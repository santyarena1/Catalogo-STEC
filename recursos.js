/* recursos.js — Marketing Resources Page Controller */
var RecursosPage = (function () {
  'use strict';

  var STORE_KEY = 'crestron_recursos';
  var currentType = 'all';
  var currentSearch = '';

  /* ── helpers ── */
  function isAdmin() {
    return sessionStorage.getItem('crestron_admin_session') === 'true';
  }

  function loadResources() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { return []; }
  }

  function saveResources(arr) {
    localStorage.setItem(STORE_KEY, JSON.stringify(arr));
  }

  function typeLabel(t) {
    return { brochure: 'Brochure', video: 'Video', image: 'Imagen', flyer: 'Folleto', other: 'Otro' }[t] || t;
  }

  function typeIcon(t) {
    return { brochure: '📄', video: '🎬', image: '🖼️', flyer: '📋', other: '📦' }[t] || '📦';
  }

  /* ── render ── */
  function renderGrid() {
    var grid = document.getElementById('recFullGrid');
    if (!grid) return;

    var all = loadResources();
    var filtered = all.filter(function (r) {
      var matchType = currentType === 'all' || r.type === currentType;
      var matchSearch = !currentSearch || r.title.toLowerCase().includes(currentSearch.toLowerCase());
      return matchType && matchSearch;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div class="rec-empty">No se encontraron recursos.</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (r) {
      var thumb = r.thumb
        ? '<img src="' + r.thumb + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">'
        : '<span style="font-size:40px;">' + typeIcon(r.type) + '</span>';
      var adminBtns = isAdmin()
        ? '<button class="btn-resource-del" onclick="RecursosPage.deleteResource(\'' + r.id + '\')">🗑️</button>'
        : '';
      return (
        '<div class="resource-card">' +
          '<div class="resource-card-thumb">' +
            thumb +
            '<span class="resource-type-badge ' + r.type + '">' + typeLabel(r.type) + '</span>' +
          '</div>' +
          '<div class="resource-card-body">' +
            '<h4>' + r.title + '</h4>' +
            (r.desc ? '<p>' + r.desc + '</p>' : '') +
          '</div>' +
          '<div class="resource-card-actions">' +
            '<button class="btn-resource-open" onclick="RecursosPage.openResource(\'' + r.id + '\')">Ver / Descargar</button>' +
            adminBtns +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ── preview grid on homepage ── */
  function renderPreview() {
    var grid = document.getElementById('resourcesPreviewGrid');
    if (!grid) return;
    var all = loadResources().slice(0, 4);
    if (!all.length) {
      grid.innerHTML = '<p style="color:var(--text-light);font-size:14px;grid-column:1/-1;text-align:center;padding:40px 0;">No hay recursos disponibles aún.</p>';
      return;
    }
    grid.innerHTML = all.map(function (r) {
      var thumb = r.thumb
        ? '<img src="' + r.thumb + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">'
        : '<span style="font-size:40px;">' + typeIcon(r.type) + '</span>';
      return (
        '<div class="resource-card">' +
          '<div class="resource-card-thumb">' +
            thumb +
            '<span class="resource-type-badge ' + r.type + '">' + typeLabel(r.type) + '</span>' +
          '</div>' +
          '<div class="resource-card-body">' +
            '<h4>' + r.title + '</h4>' +
            (r.desc ? '<p>' + r.desc + '</p>' : '') +
          '</div>' +
          '<div class="resource-card-actions">' +
            '<button class="btn-resource-open" onclick="RecursosPage.openResource(\'' + r.id + '\')">Ver / Descargar</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ── public actions ── */
  function openResource(id) {
    var all = loadResources();
    var r = all.find(function (x) { return x.id === id; });
    if (r && r.url) { window.open(r.url, '_blank'); }
  }

  function deleteResource(id) {
    if (!confirm('¿Eliminar este recurso?')) return;
    var all = loadResources().filter(function (r) { return r.id !== id; });
    saveResources(all);
    renderGrid();
    renderPreview();
  }

  /* ── modal ── */
  function openModal() {
    var overlay = document.getElementById('recModalOverlay');
    if (overlay) {
      overlay.classList.add('show');
      ['recTitle','recUrl','recThumb','recDesc'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
      var prev = document.getElementById('recThumbPreview');
      if (prev) prev.innerHTML = '';
      var sel = document.getElementById('recType');
      if (sel) sel.value = 'brochure';
    }
  }

  function closeModal() {
    var overlay = document.getElementById('recModalOverlay');
    if (overlay) overlay.classList.remove('show');
  }

  function saveResource() {
    var title = (document.getElementById('recTitle') || {}).value || '';
    var type = (document.getElementById('recType') || {}).value || 'other';
    var desc = (document.getElementById('recDesc') || {}).value || '';
    var url = (document.getElementById('recUrl') || {}).value || '';
    var thumb = (document.getElementById('recThumb') || {}).value || '';

    if (!title.trim()) { alert('El título es obligatorio.'); return; }
    if (!url.trim()) { alert('La URL o archivo es obligatorio.'); return; }

    var all = loadResources();
    all.unshift({ id: Date.now().toString(), title: title.trim(), type: type, desc: desc.trim(), url: url, thumb: thumb });
    saveResources(all);
    closeModal();
    renderGrid();
    renderPreview();
  }

  /* ── init ── */
  function init() {
    renderGrid();

    /* filter buttons */
    document.querySelectorAll('.rec-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.rec-type-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentType = btn.dataset.type;
        renderGrid();
      });
    });

    /* search */
    var searchInput = document.getElementById('recSearch');
    if (searchInput) {
      var t;
      searchInput.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { currentSearch = searchInput.value; renderGrid(); }, 250);
      });
    }

    /* modal close */
    var closeBtn = document.getElementById('recModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    var overlay = document.getElementById('recModalOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    }

    /* save */
    var saveBtn = document.getElementById('recSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveResource);

    /* file upload */
    var filePick = document.getElementById('recFilePick');
    var fileInput = document.getElementById('recFileInput');
    if (filePick && fileInput) {
      filePick.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          var urlInput = document.getElementById('recUrl');
          if (urlInput) urlInput.value = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    /* thumb picker */
    var thumbPick = document.getElementById('recThumbPick');
    if (thumbPick) {
      thumbPick.addEventListener('click', function () {
        var titleVal = (document.getElementById('recTitle') || {}).value || 'recurso';
        if (typeof ImagePicker !== 'undefined') {
          ImagePicker.open(titleVal, function (url) {
            var inp = document.getElementById('recThumb');
            if (inp) inp.value = url;
            var prev = document.getElementById('recThumbPreview');
            if (prev) prev.innerHTML = '<img src="' + url + '" style="max-width:100%;border-radius:8px;margin-top:6px;">';
          }, 'Imagen de portada del recurso', 'Recomendado: 480 × 320 px (3:2)');
        }
      });
    }

    /* thumb URL live preview */
    var thumbInp = document.getElementById('recThumb');
    if (thumbInp) {
      thumbInp.addEventListener('blur', function () {
        var url = thumbInp.value;
        var prev = document.getElementById('recThumbPreview');
        if (prev && url) prev.innerHTML = '<img src="' + url + '" style="max-width:100%;border-radius:8px;margin-top:6px;">';
      });
    }

    /* admin FAB adds resource */
    var fab = document.getElementById('fabMain');
    if (fab && isAdmin()) {
      var addBtn = document.createElement('button');
      addBtn.textContent = '+ Agregar recurso';
      addBtn.style.cssText = 'position:fixed;bottom:90px;right:24px;z-index:9999;padding:10px 20px;background:var(--accent);color:#fff;border:none;border-radius:100px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font);box-shadow:0 4px 16px rgba(0,157,199,0.4);';
      addBtn.addEventListener('click', openModal);
      document.body.appendChild(addBtn);
    }

    /* escape closes modal */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* Check if we're on the resources page or homepage */
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('recFullGrid')) {
      init();
    } else {
      renderPreview();
    }
  });

  return { renderGrid: renderGrid, renderPreview: renderPreview, openResource: openResource, deleteResource: deleteResource, openModal: openModal };
})();
