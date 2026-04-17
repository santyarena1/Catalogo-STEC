/* ============================================================
   ANNOTATIONS.JS — Sistema de anotaciones / feedback de cliente
   Funciona en todas las páginas: index, micrositios, blog, etc.
   ============================================================ */

'use strict';

const Annotations = (() => {

  const STORE       = 'stec_annotations';
  const SESSION_KEY = 'crestron_admin_session';

  let annotateMode     = false;
  let fabWrap          = null;
  let checklistOverlay = null;
  let listFilter       = 'all';
  let dragState        = null;
  let syncTimer        = null;
  let syncIndicator    = null;

  /* ────────────────────────────────────────────────────────────
     AUTH
  ──────────────────────────────────────────────────────────── */
  function isAdmin() {
    /* Works whether admin.js is loaded or not */
    if (typeof Auth !== 'undefined') return Auth.isLoggedIn();
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  /* ────────────────────────────────────────────────────────────
     JSONBIN REMOTE SYNC
  ──────────────────────────────────────────────────────────── */
  function binCfg() {
    const c = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : null) ||
              (typeof window.APP_CONFIG !== 'undefined' ? window.APP_CONFIG : {});
    return { id: c.JSONBIN_ID || '', key: c.JSONBIN_KEY || '' };
  }

  function binUrl()    { return 'https://api.jsonbin.io/v3/b/' + binCfg().id; }
  function binEnabled(){ const b = binCfg(); return !!(b.id && b.key); }

  async function remotePull() {
    if (!binEnabled()) return null;
    try {
      const res = await fetch(binUrl() + '/latest', {
        headers: { 'X-Master-Key': binCfg().key }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.record) ? data.record : null;
    } catch { return null; }
  }

  function remotePush(anns) {
    if (!binEnabled()) return;
    clearTimeout(syncTimer);
    setSyncStatus('syncing');
    syncTimer = setTimeout(async () => {
      try {
        const res = await fetch(binUrl(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Master-Key': binCfg().key },
          body: JSON.stringify(anns),
        });
        setSyncStatus(res.ok ? 'ok' : 'error');
      } catch { setSyncStatus('error'); }
    }, 700);
  }

  function setSyncStatus(state) {
    if (!syncIndicator) return;
    const labels = { syncing: '↻ Sincronizando...', ok: '✓ Guardado en la nube', error: '⚠ Error al sincronizar' };
    const colors = { syncing: '#009DC7', ok: '#22c55e', error: '#f97316' };
    syncIndicator.textContent = labels[state] || '';
    syncIndicator.style.color = colors[state] || '';
    if (state === 'ok') setTimeout(() => { if (syncIndicator) syncIndicator.textContent = ''; }, 3000);
  }

  /* ────────────────────────────────────────────────────────────
     STORAGE  (localStorage = cache rápido, JSONBin = fuente real)
  ──────────────────────────────────────────────────────────── */
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; }
  }
  function saveAll(anns) {
    localStorage.setItem(STORE, JSON.stringify(anns));
    remotePush(anns);
  }

  /* ────────────────────────────────────────────────────────────
     PAGE / SECTION HELPERS
  ──────────────────────────────────────────────────────────── */
  function getPageKey() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  const PAGE_LABELS = {
    'index.html'               : 'Inicio',
    ''                         : 'Inicio',
    'blog.html'                : 'Blog',
    'recursos.html'            : 'Recursos',
    'catalogo.html'            : 'Catálogo',
    'microsite-keypads.html'   : 'Keypads & Dimmers',
    'microsite-lighting.html'  : 'Iluminación Zūm',
    'microsite-shading.html'   : 'Shading',
    'microsite-audio.html'     : 'Audio DM NAX',
    'microsite-clima.html'     : 'Clima',
    'microsite-seguridad.html' : 'Seguridad',
    'microsite-interfaces.html': 'Interfaces',
    'microsite-escenarios.html': 'Escenarios',
  };

  const SECTION_NAMES = {
    inicio: 'Hero', hero: 'Hero', plataforma: 'Plataforma',
    escenarios: 'Escenarios', soluciones: 'Soluciones',
    micrositios: 'Micrositios', productos: 'Catálogo',
    recursos: 'Recursos', blog: 'Blog', contacto: 'Contacto',
    marcas: 'Marcas', comparacion: 'Comparación', pilares: 'Pilares',
    chapp: 'App Demo',
  };

  function getPageLabel(key) {
    const k = key != null ? key : getPageKey();
    return PAGE_LABELS[k] || k;
  }

  function getSectionAt(docY) {
    let best = null;
    let bestTop = -Infinity;
    document.querySelectorAll('section[id], nav, footer').forEach(el => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= docY && top > bestTop) { bestTop = top; best = el; }
    });
    if (!best) return 'General';
    const id = best.id;
    if (SECTION_NAMES[id]) return SECTION_NAMES[id];
    const h = best.querySelector('h1,h2,h3,.section-heading,.ms-hero-title,.section-title');
    if (h) return h.textContent.trim().slice(0, 28);
    if (id) return id.charAt(0).toUpperCase() + id.slice(1);
    return best.tagName === 'NAV' ? 'Navegación' : best.tagName === 'FOOTER' ? 'Footer' : 'General';
  }

  /* ────────────────────────────────────────────────────────────
     DRAG
  ──────────────────────────────────────────────────────────── */
  function initGlobalDrag() {
    document.addEventListener('mousemove', e => {
      if (!dragState) return;
      const { el, startX, startY, origX, origY } = dragState;
      el.style.left = (origX + e.clientX - startX) + 'px';
      el.style.top  = (origY + e.clientY - startY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragState) return;
      const { el, id } = dragState;
      dragState = null;
      el.style.zIndex = '';
      const anns = loadAll();
      const ann = anns.find(a => a.id === id);
      if (ann) {
        ann.x = parseInt(el.style.left)  || 0;
        ann.y = parseInt(el.style.top)   || 0;
        saveAll(anns);
      }
    });
  }

  function makeDraggable(el, id) {
    const header = el.querySelector('.ann-note-header');
    header.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragState = {
        el, id,
        startX: e.clientX, startY: e.clientY,
        origX: parseInt(el.style.left) || 0,
        origY: parseInt(el.style.top)  || 0,
      };
      el.style.zIndex = '91000';
    });
  }

  /* ────────────────────────────────────────────────────────────
     NOTE ELEMENT
  ──────────────────────────────────────────────────────────── */
  function createNoteEl(ann) {
    const el = document.createElement('div');
    el.className = 'ann-note' + (ann.resolved ? ' resolved' : '');
    el.dataset.id = ann.id;
    el.style.cssText = 'left:' + ann.x + 'px;top:' + ann.y + 'px;';

    el.innerHTML = [
      '<div class="ann-note-header" title="Arrastrá para mover">',
        '<span class="ann-note-origin">',
          escHtml(getPageLabel(ann.pageKey)) + ' &rsaquo; ' + escHtml(ann.section),
        '</span>',
        '<button class="ann-note-close" title="Eliminar nota">\u2715</button>',
      '</div>',
      '<div class="ann-note-body">',
        '<textarea class="ann-note-textarea" placeholder="Escribí tu anotaci\u00f3n ac\u00e1...">',
          escHtml(ann.text),
        '</textarea>',
      '</div>',
      '<div class="ann-note-footer">',
        '<span class="ann-note-date">' + ann.createdAt + '</span>',
        '<button class="ann-note-resolve">' + (ann.resolved ? '\u21a9 Reabrir' : '\u2713 Resolver') + '</button>',
      '</div>',
    ].join('');

    /* Delete */
    el.querySelector('.ann-note-close').addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('\u00bfEliminar esta nota?')) deleteNote(ann.id);
    });

    /* Resolve */
    el.querySelector('.ann-note-resolve').addEventListener('click', e => {
      e.stopPropagation();
      resolveNote(ann.id);
    });

    /* Save text on blur */
    el.querySelector('.ann-note-textarea').addEventListener('input', e => {
      updateNoteText(ann.id, e.target.value);
    });

    /* Stop page-level clicks (annotation mode) */
    el.addEventListener('mousedown', e => e.stopPropagation());
    el.addEventListener('click',     e => e.stopPropagation());

    makeDraggable(el, ann.id);
    return el;
  }

  /* ────────────────────────────────────────────────────────────
     CRUD
  ──────────────────────────────────────────────────────────── */
  function addNote(pageX, pageY) {
    const pageKey = getPageKey();
    const ann = {
      id       : 'ann_' + Date.now(),
      pageKey,
      pageLabel: getPageLabel(pageKey),
      section  : getSectionAt(pageY),
      x        : Math.min(pageX, (window.innerWidth || 1200) - 310),
      y        : pageY,
      text     : '',
      resolved : false,
      createdAt: new Date().toLocaleDateString('es-AR'),
    };
    const anns = loadAll();
    anns.push(ann);
    saveAll(anns);

    const layer = document.getElementById('annLayer');
    if (layer) {
      const el = createNoteEl(ann);
      layer.appendChild(el);
      el.querySelector('.ann-note-textarea').focus();
    }
    updateFabCount();
    return ann;
  }

  function deleteNote(id) {
    saveAll(loadAll().filter(a => a.id !== id));
    document.querySelector('.ann-note[data-id="' + id + '"]')?.remove();
    updateFabCount();
    renderChecklist();
  }

  function resolveNote(id) {
    const anns = loadAll();
    const ann  = anns.find(a => a.id === id);
    if (!ann) return;
    ann.resolved = !ann.resolved;
    saveAll(anns);
    const el = document.querySelector('.ann-note[data-id="' + id + '"]');
    if (el) {
      el.classList.toggle('resolved', ann.resolved);
      el.querySelector('.ann-note-resolve').textContent = ann.resolved ? '\u21a9 Reabrir' : '\u2713 Resolver';
    }
    updateFabCount();
    renderChecklist();
  }

  function updateNoteText(id, text) {
    const anns = loadAll();
    const ann  = anns.find(a => a.id === id);
    if (ann) { ann.text = text; saveAll(anns); }
    /* Debounce checklist refresh */
    clearTimeout(updateNoteText._t);
    updateNoteText._t = setTimeout(renderChecklist, 400);
  }

  /* ────────────────────────────────────────────────────────────
     RENDER NOTES ON PAGE
  ──────────────────────────────────────────────────────────── */
  function renderNotesForPage() {
    const layer = document.getElementById('annLayer');
    if (!layer) return;
    layer.innerHTML = '';
    loadAll()
      .filter(a => a.pageKey === getPageKey())
      .forEach(ann => layer.appendChild(createNoteEl(ann)));
  }

  /* ────────────────────────────────────────────────────────────
     FAB BUTTON
  ──────────────────────────────────────────────────────────── */
  function buildFab() {
    fabWrap = document.createElement('div');
    fabWrap.className = 'ann-fab-wrap';
    fabWrap.id = 'annFabWrap';
    fabWrap.innerHTML = [
      '<button class="ann-fab-btn" id="annFabOpen" title="Ver anotaciones del sitio">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">',
          '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>',
          '<polyline points="14 2 14 8 20 8"/>',
          '<line x1="16" y1="13" x2="8" y2="13"/>',
          '<line x1="16" y1="17" x2="8" y2="17"/>',
          '<polyline points="10 9 9 9 8 9"/>',
        '</svg>',
        'Notas ',
        '<span class="ann-badge" id="annBadge">0</span>',
      '</button>',
      '<span id="annSyncStatus" style="font-size:10px;font-weight:600;padding:0 4px;transition:color .3s;"></span>',
    ].join('');
    document.body.appendChild(fabWrap);
    syncIndicator = document.getElementById('annSyncStatus');
    document.getElementById('annFabOpen').addEventListener('click', openChecklist);
  }

  function updateFabCount() {
    const anns    = loadAll();
    const pending = anns.filter(a => !a.resolved).length;
    const badge   = document.getElementById('annBadge');
    if (!badge) return;
    badge.textContent = pending;
    badge.className   = 'ann-badge' + (pending === 0 ? ' zero' : '');
  }

  /* ────────────────────────────────────────────────────────────
     PLACEMENT MODE
  ──────────────────────────────────────────────────────────── */
  function enterAnnotateMode() {
    annotateMode = true;
    document.body.classList.add('ann-placing');

    const banner = document.createElement('div');
    banner.className = 'ann-place-banner';
    banner.id = 'annPlaceBanner';
    banner.textContent = '\uD83D\uDCDD Hac\u00e9 clic en cualquier lugar para poner una nota \u00b7 Esc para cancelar';
    document.body.appendChild(banner);

    document.addEventListener('mousedown', onPageClick, true);
    document.addEventListener('keydown',   onEscKey);
    closeChecklist();
  }

  function exitAnnotateMode() {
    if (!annotateMode) return;
    annotateMode = false;
    document.body.classList.remove('ann-placing');
    document.getElementById('annPlaceBanner')?.remove();
    document.removeEventListener('mousedown', onPageClick, true);
    document.removeEventListener('keydown',   onEscKey);
  }

  function onPageClick(e) {
    if (!annotateMode) return;
    if (e.target.closest('.ann-note, .ann-fab-wrap, .ann-checklist-overlay, .admin-toolbar, .admin-overlay')) return;
    e.preventDefault();
    e.stopPropagation();
    addNote(e.pageX, e.pageY);
    exitAnnotateMode();
  }

  function onEscKey(e) {
    if (e.key === 'Escape') exitAnnotateMode();
  }

  /* ────────────────────────────────────────────────────────────
     CHECKLIST PANEL
  ──────────────────────────────────────────────────────────── */
  function buildChecklist() {
    checklistOverlay = document.createElement('div');
    checklistOverlay.className = 'ann-checklist-overlay';
    checklistOverlay.id = 'annChecklistOverlay';
    checklistOverlay.innerHTML = [
      '<div class="ann-checklist-modal">',
        '<div class="ann-checklist-header">',
          '<div>',
            '<div class="ann-checklist-title">\uD83D\uDCCB Anotaciones del sitio</div>',
            '<div class="ann-checklist-subtitle" id="annChecklistSub"></div>',
          '</div>',
          '<button class="ann-checklist-close" id="annChecklistClose">\u2715</button>',
        '</div>',
        '<div class="ann-filter-row">',
          '<button class="ann-filter-btn active" data-filter="all">Todas</button>',
          '<button class="ann-filter-btn"         data-filter="pending">Pendientes</button>',
          '<button class="ann-filter-btn"         data-filter="resolved">Resueltas</button>',
        '</div>',
        '<div class="ann-checklist-body" id="annChecklistBody"></div>',
        '<div class="ann-checklist-footer">',
          '<span class="ann-footer-count" id="annFooterCount"></span>',
          '<div class="ann-footer-actions">',
            '<button class="ann-btn-add" id="annBtnAdd">+ Agregar nota</button>',
            '<button class="ann-btn-close-list" id="annBtnClose">Cerrar</button>',
          '</div>',
        '</div>',
      '</div>',
    ].join('');
    document.body.appendChild(checklistOverlay);

    checklistOverlay.querySelector('#annChecklistClose').addEventListener('click', closeChecklist);
    checklistOverlay.querySelector('#annBtnClose').addEventListener('click', closeChecklist);
    checklistOverlay.querySelector('#annBtnAdd').addEventListener('click', () => {
      closeChecklist();
      setTimeout(enterAnnotateMode, 200);
    });
    checklistOverlay.addEventListener('click', e => {
      if (e.target === checklistOverlay) closeChecklist();
    });

    checklistOverlay.querySelectorAll('.ann-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        listFilter = btn.dataset.filter;
        checklistOverlay.querySelectorAll('.ann-filter-btn')
          .forEach(b => b.classList.toggle('active', b === btn));
        renderChecklist();
      });
    });
  }

  function openChecklist() {
    if (!checklistOverlay) buildChecklist();
    renderChecklist();
    checklistOverlay.classList.add('show');
  }

  function closeChecklist() {
    checklistOverlay?.classList.remove('show');
  }

  function renderChecklist() {
    if (!checklistOverlay || !checklistOverlay.classList.contains('show')) return;
    const body        = document.getElementById('annChecklistBody');
    const footerCount = document.getElementById('annFooterCount');
    const sub         = document.getElementById('annChecklistSub');
    if (!body) return;

    let all     = loadAll();
    const total   = all.length;
    const pending = all.filter(a => !a.resolved).length;
    const done    = total - pending;

    if (sub) sub.textContent = pending + ' pendiente' + (pending !== 1 ? 's' : '') + ' \u00b7 ' + done + ' resuelta' + (done !== 1 ? 's' : '');
    if (footerCount) footerCount.textContent = total + ' nota' + (total !== 1 ? 's' : '') + ' en total';

    let filtered = all;
    if (listFilter === 'pending')  filtered = all.filter(a => !a.resolved);
    if (listFilter === 'resolved') filtered = all.filter(a =>  a.resolved);

    /* Sort newest first */
    filtered = filtered.slice().sort((a, b) => b.id.localeCompare(a.id));

    if (!filtered.length) {
      const msgs = {
        all     : 'No hay anotaciones a\u00fan.\nHac\u00e9 clic en \u201c+ Agregar nota\u201d para empezar.',
        pending : 'No hay notas pendientes. \u2713',
        resolved: 'No hay notas resueltas a\u00fan.',
      };
      body.innerHTML = '<div class="ann-checklist-empty">' + (msgs[listFilter] || '') + '</div>';
      return;
    }

    body.innerHTML = filtered.map(ann => [
      '<div class="ann-item ' + (ann.resolved ? 'resolved-item' : '') + '" data-id="' + ann.id + '">',
        '<div class="ann-item-check ' + (ann.resolved ? 'checked' : '') + '" data-id="' + ann.id + '" title="' + (ann.resolved ? 'Reabrir' : 'Marcar como resuelto') + '">',
          ann.resolved ? '\u2713' : '',
        '</div>',
        '<div class="ann-item-body">',
          '<div class="ann-item-origin">',
            escHtml(ann.pageLabel || getPageLabel(ann.pageKey)),
            ' <span class="sep">&rsaquo;</span> ',
            escHtml(ann.section),
          '</div>',
          '<div class="ann-item-text ' + (ann.text ? '' : 'empty-text') + '">',
            ann.text ? escHtml(ann.text) : '(sin texto)',
          '</div>',
          '<div class="ann-item-date">' + ann.createdAt + '</div>',
        '</div>',
        '<div class="ann-item-actions">',
          '<button class="ann-item-goto" data-id="' + ann.id + '" data-page="' + ann.pageKey + '" data-y="' + ann.y + '" title="Ir a la nota">\uD83D\uDC41</button>',
          '<button class="ann-item-del"  data-id="' + ann.id + '" title="Eliminar">\uD83D\uDDD1</button>',
        '</div>',
      '</div>',
    ].join('')).join('');

    /* Events */
    body.querySelectorAll('.ann-item-check').forEach(el => {
      el.addEventListener('click', () => resolveNote(el.dataset.id));
    });
    body.querySelectorAll('.ann-item-del').forEach(el => {
      el.addEventListener('click', () => {
        if (confirm('\u00bfEliminar esta nota?')) deleteNote(el.dataset.id);
      });
    });
    body.querySelectorAll('.ann-item-goto').forEach(el => {
      el.addEventListener('click', () => gotoNote(el.dataset.id, el.dataset.page, parseInt(el.dataset.y)));
    });
  }

  function gotoNote(id, pageKey, y) {
    if (pageKey === getPageKey()) {
      closeChecklist();
      window.scrollTo({ top: Math.max(0, y - 220), behavior: 'smooth' });
      setTimeout(() => {
        const noteEl = document.querySelector('.ann-note[data-id="' + id + '"]');
        if (noteEl) {
          noteEl.style.transition = 'box-shadow .3s';
          noteEl.style.boxShadow  = '0 0 0 3px #009DC7, 0 8px 32px rgba(0,0,0,0.55)';
          setTimeout(() => { noteEl.style.boxShadow = ''; }, 2200);
        }
      }, 500);
    } else {
      window.location.href = pageKey + '#goto_' + id;
    }
  }

  /* ────────────────────────────────────────────────────────────
     TOOLBAR BUTTON (admin.js toolbar)
  ──────────────────────────────────────────────────────────── */
  function addToolbarButton() {
    if (document.getElementById('fabAnnotations')) return;
    const fabMain = document.getElementById('fabMain');
    if (!fabMain) return;
    const btn = document.createElement('button');
    btn.className = 'admin-fab';
    btn.id = 'fabAnnotations';
    btn.innerHTML = [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">',
        '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>',
        '<polyline points="14 2 14 8 20 8"/>',
        '<line x1="16" y1="13" x2="8" y2="13"/>',
        '<line x1="16" y1="17" x2="8" y2="17"/>',
      '</svg>',
      'Anotaciones',
    ].join('');
    btn.addEventListener('click', openChecklist);
    fabMain.parentNode.insertBefore(btn, fabMain);
  }

  /* ────────────────────────────────────────────────────────────
     UTIL
  ──────────────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ────────────────────────────────────────────────────────────
     PULL REMOTO Y SINCRONIZAR
  ──────────────────────────────────────────────────────────── */
  async function pullAndSync() {
    if (!binEnabled()) return;
    setSyncStatus('syncing');
    const remote = await remotePull();
    if (!remote) { setSyncStatus('error'); return; }

    const local    = loadAll();
    const localIds = new Set(local.map(a => a.id));
    const remIds   = new Set(remote.map(a => a.id));

    /* Merge: keep all notes from both sides, remote wins on conflicts */
    const merged = [...remote];
    local.forEach(a => { if (!remIds.has(a.id)) merged.push(a); });

    const changed = JSON.stringify(merged) !== JSON.stringify(local);
    if (changed) {
      localStorage.setItem(STORE, JSON.stringify(merged));
      renderNotesForPage();
      updateFabCount();
      renderChecklist();
    }
    setSyncStatus('ok');
  }

  /* ────────────────────────────────────────────────────────────
     INIT
  ──────────────────────────────────────────────────────────── */
  function init() {
    /* Annotation layer */
    const layer = document.createElement('div');
    layer.id = 'annLayer';
    document.body.appendChild(layer);

    /* Global drag handlers (single set) */
    initGlobalDrag();

    /* Floating FAB */
    buildFab();

    /* Auth event listeners */
    document.addEventListener('crestron:auth:login', () => {
      fabWrap?.classList.add('show');
      setTimeout(addToolbarButton, 150);
      renderNotesForPage();
      updateFabCount();
      pullAndSync();
    });

    document.addEventListener('crestron:auth:logout', () => {
      fabWrap?.classList.remove('show');
      exitAnnotateMode();
      const layer = document.getElementById('annLayer');
      if (layer) layer.innerHTML = '';
      document.getElementById('fabAnnotations')?.remove();
    });

    /* Already logged in */
    if (isAdmin()) {
      fabWrap.classList.add('show');
      setTimeout(addToolbarButton, 150);
      renderNotesForPage();
      updateFabCount();
      pullAndSync();
    }

    /* Handle direct link to a note: URL hash #goto_ann_XXXXX */
    if (window.location.hash.startsWith('#goto_')) {
      const id = window.location.hash.slice(6);
      setTimeout(() => {
        const noteEl = document.querySelector('.ann-note[data-id="' + id + '"]');
        if (noteEl) {
          const y = parseInt(noteEl.style.top) || 0;
          window.scrollTo({ top: Math.max(0, y - 220), behavior: 'smooth' });
          noteEl.style.transition = 'box-shadow .3s';
          noteEl.style.boxShadow  = '0 0 0 3px #009DC7, 0 8px 32px rgba(0,0,0,0.55)';
          setTimeout(() => { noteEl.style.boxShadow = ''; }, 2200);
        }
      }, 600);
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { openChecklist, enterAnnotateMode };

})();
