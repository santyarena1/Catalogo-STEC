/* ============================================================
   ADMIN.JS — Sistema de administración Crestron Home Argentina
   ============================================================ */

'use strict';

/* ── Espera config.js ─────────────────────────────────────── */
const CFG = window.APP_CONFIG || {};

/* ============================================================
   AUTH — Login y sesión
   ============================================================ */
const Auth = (() => {
  const SESSION_KEY = 'crestron_admin_session';

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function login(user, pass) {
    if (user === CFG.ADMIN_USER && pass === CFG.ADMIN_PASS) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return { isLoggedIn, login, logout };
})();

/* ============================================================
   CONTENT EDITOR — Edición inline con localStorage
   ============================================================ */
const ContentEditor = (() => {
  const STORE = 'crestron_content';

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
  }
  function saveAll(data) {
    localStorage.setItem(STORE, JSON.stringify(data));
  }

  /* Aplica el contenido guardado al DOM */
  function applyStoredContent() {
    /* Textos editables */
    const data = loadAll();
    Object.entries(data).forEach(([key, val]) => {
      const el = document.querySelector(`[data-editable="${key}"]`);
      if (el) el.innerHTML = val;
    });

    /* Imágenes de slider */
    const slideImgs = getSlideImages();
    Object.entries(slideImgs).forEach(([i, url]) => {
      const slide = document.querySelector(`.hero-slide[data-slide="${i}"]`);
      if (slide) slide.style.backgroundImage = `url('${url}')`;
    });

    /* Imágenes de productos guardadas */
    const imgs = getProductImages();
    Object.entries(imgs).forEach(([model, url]) => {
      const card = document.querySelector(`.product-card[data-model="${model}"] .product-image`);
      if (card) applyProductImageEl(card, url);
    });

    /* Logos de marcas guardados */
    const brandImgs = getBrandImages();
    Object.entries(brandImgs).forEach(([id, url]) => {
      const el = document.querySelector(`.brand-card[data-brand="${id}"] .brand-logo-img`);
      if (el) { el.src = url; el.style.display = 'block'; el.nextElementSibling && (el.nextElementSibling.style.display = 'none'); }
    });
  }

  function enableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'true';
      el.addEventListener('blur', onBlur);
    });
  }

  function disableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'false';
      el.removeEventListener('blur', onBlur);
    });
  }

  function onBlur(e) {
    const key = e.target.dataset.editable;
    const val = e.target.innerHTML;
    const data = loadAll();
    data[key] = val;
    saveAll(data);
  }

  /* Product images */
  function getProductImages() {
    try { return JSON.parse(localStorage.getItem('crestron_product_imgs')) || {}; } catch { return {}; }
  }
  function saveProductImage(model, url) {
    const imgs = getProductImages();
    imgs[model] = url;
    localStorage.setItem('crestron_product_imgs', JSON.stringify(imgs));
  }

  /* Slide images */
  function getSlideImages() {
    try { return JSON.parse(localStorage.getItem('crestron_slide_imgs')) || {}; } catch { return {}; }
  }
  function saveSlideImage(index, url) {
    const imgs = getSlideImages();
    imgs[index] = url;
    localStorage.setItem('crestron_slide_imgs', JSON.stringify(imgs));
  }

  /* Brand images */
  function getBrandImages() {
    try { return JSON.parse(localStorage.getItem('crestron_brand_imgs')) || {}; } catch { return {}; }
  }
  function saveBrandImage(id, url) {
    const imgs = getBrandImages();
    imgs[id] = url;
    localStorage.setItem('crestron_brand_imgs', JSON.stringify(imgs));
  }

  function applyProductImageEl(container, url) {
    container.style.backgroundImage = `url('${url}')`;
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';
    const icon = container.querySelector('.product-img-icon');
    if (icon) icon.style.display = 'none';
    const bg = container.querySelector('.product-model-bg');
    if (bg) bg.style.display = 'none';
  }

  /* Multi-image per product */
  function getProductExtra(model) {
    try { return JSON.parse(localStorage.getItem('crestron_product_extra') || '{}')[model] || { images: [] }; } catch { return { images: [] }; }
  }
  function saveProductExtra(model, data) {
    const all = (() => { try { return JSON.parse(localStorage.getItem('crestron_product_extra') || '{}'); } catch { return {}; } })();
    all[model] = { ...(all[model] || {}), ...data };
    localStorage.setItem('crestron_product_extra', JSON.stringify(all));
  }
  function addProductImageMulti(model, url) {
    const extra = getProductExtra(model);
    if (!extra.images) extra.images = [];
    extra.images.push({ url, posX: 50, posY: 50 });
    saveProductExtra(model, extra);
  }
  function removeProductImageMulti(model, idx) {
    const extra = getProductExtra(model);
    extra.images.splice(idx, 1);
    saveProductExtra(model, extra);
  }
  function setImagePosition(model, idx, posX, posY) {
    const extra = getProductExtra(model);
    if (extra.images[idx]) { extra.images[idx].posX = posX; extra.images[idx].posY = posY; }
    saveProductExtra(model, extra);
  }

  /* Custom products added by admin */
  function getCustomProducts() {
    try { return JSON.parse(localStorage.getItem('crestron_custom_products') || '[]'); } catch { return []; }
  }
  function saveCustomProduct(p) {
    const all = getCustomProducts();
    const idx = all.findIndex(x => x.model === p.model);
    if (idx >= 0) all[idx] = p; else all.push(p);
    localStorage.setItem('crestron_custom_products', JSON.stringify(all));
  }
  function deleteCustomProduct(model) {
    const all = getCustomProducts().filter(x => x.model !== model);
    localStorage.setItem('crestron_custom_products', JSON.stringify(all));
  }

  return { applyStoredContent, enableEditing, disableEditing, saveProductImage, saveBrandImage, saveSlideImage, getProductImages, getBrandImages, getSlideImages, applyProductImageEl, getProductExtra, addProductImageMulti, removeProductImageMulti, setImagePosition, getCustomProducts, saveCustomProduct, deleteCustomProduct };
})();

/* ============================================================
   SERPER — Búsqueda de imágenes
   ============================================================ */
const Serper = (() => {
  const API = 'https://google.serper.dev/images';

  async function search(query) {
    if (!CFG.SERPER_KEY) throw new Error('Serper key no configurada en config.js');
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'X-API-KEY': CFG.SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 12, gl: 'ar' }),
    });
    if (!res.ok) throw new Error(`Serper error: ${res.status}`);
    const data = await res.json();
    return data.images || [];
  }

  return { search };
})();

/* ============================================================
   IMAGE PICKER — Serper / Subir archivo / URL directa
   ============================================================ */
const ImagePicker = (() => {
  let overlay = null;
  let selectedUrl = null;
  let callback = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'serper-overlay';
    overlay.innerHTML = `
      <div class="serper-modal ip-modal">
        <div class="serper-modal-header">
          <div>
            <h3 id="ipTitle" style="margin:0;">Agregar imagen</h3>
            <p id="ipHint" style="font-size:11px;color:var(--text-light);margin:3px 0 0;display:none;"></p>
          </div>
          <button class="serper-close" id="ipClose">✕</button>
        </div>
        <!-- Tabs -->
        <div class="ip-tabs">
          <button class="ip-tab active" data-tab="search">🔍 Buscar</button>
          <button class="ip-tab" data-tab="upload">📁 Subir</button>
          <button class="ip-tab" data-tab="url">🔗 URL</button>
        </div>
        <!-- Search panel -->
        <div class="ip-panel active" id="ipPanelSearch">
          <div class="serper-search-row">
            <input type="text" id="ipSearchInput" placeholder="Buscar imágenes...">
            <button class="btn-serper-search" id="ipSearchBtn">Buscar</button>
          </div>
          <div class="serper-images-grid" id="ipGrid"></div>
        </div>
        <!-- Upload panel -->
        <div class="ip-panel" id="ipPanelUpload">
          <div class="ip-upload-area" id="ipUploadArea">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p>Arrastrá una imagen acá o <strong>hacé clic para elegir</strong></p>
            <p style="font-size:11px;color:var(--text-light)">JPG, PNG, WEBP — max 8 MB</p>
            <input type="file" accept="image/*" id="ipFileInput" style="position:absolute;inset:0;opacity:0;cursor:pointer;">
          </div>
          <div id="ipUploadPreview" style="margin-top:12px;"></div>
        </div>
        <!-- URL panel -->
        <div class="ip-panel" id="ipPanelUrl">
          <div style="padding:12px 0;">
            <label style="font-size:12px;font-weight:600;color:var(--text-medium);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:8px;">URL de la imagen</label>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
              <input type="url" id="ipUrlInput" placeholder="https://ejemplo.com/imagen.jpg" style="flex:1;padding:10px 14px;border:1.5px solid var(--border-med);border-radius:8px;font-size:14px;font-family:inherit;outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor=''">
              <button class="btn-serper-search" id="ipUrlPreviewBtn">Vista previa</button>
            </div>
            <div id="ipUrlPreview"></div>
          </div>
        </div>
        <!-- Actions -->
        <div class="serper-apply-row" style="margin-top:14px;">
          <button class="btn-serper-cancel" id="ipCancel">Cancelar</button>
          <button class="btn-serper-apply" id="ipApply" disabled>Aplicar imagen</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    /* Tab switching */
    overlay.querySelectorAll('.ip-tab').forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    /* Search */
    overlay.querySelector('#ipSearchBtn').addEventListener('click', doSearch);
    overlay.querySelector('#ipSearchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    /* Upload */
    const fileInput = overlay.querySelector('#ipFileInput');
    const uploadArea = overlay.querySelector('#ipUploadArea');
    fileInput.addEventListener('change', e => { if (e.target.files[0]) readFile(e.target.files[0]); });
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
    });

    /* URL */
    overlay.querySelector('#ipUrlPreviewBtn').addEventListener('click', previewUrl);
    overlay.querySelector('#ipUrlInput').addEventListener('keydown', e => { if (e.key === 'Enter') previewUrl(); });

    /* Apply / close */
    overlay.querySelector('#ipApply').addEventListener('click', doApply);
    overlay.querySelector('#ipCancel').addEventListener('click', close);
    overlay.querySelector('#ipClose').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  function switchTab(tab) {
    overlay.querySelectorAll('.ip-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    overlay.querySelectorAll('.ip-panel').forEach(p => p.classList.remove('active'));
    overlay.querySelector(`#ipPanel${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
  }

  function setSelected(url) {
    selectedUrl = url;
    overlay.querySelector('#ipApply').disabled = !url;
  }

  async function doSearch() {
    const q = overlay.querySelector('#ipSearchInput').value.trim();
    if (!q) return;
    const grid = overlay.querySelector('#ipGrid');
    grid.innerHTML = '<div class="serper-loading">Buscando imágenes...</div>';
    setSelected(null);
    try {
      const images = await Serper.search(q);
      if (!images.length) { grid.innerHTML = '<div class="serper-loading">Sin resultados.</div>'; return; }
      grid.innerHTML = images.map(img =>
        `<div class="serper-img-item" data-url="${img.imageUrl}">
          <img src="${img.imageUrl}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
        </div>`
      ).join('');
      grid.querySelectorAll('.serper-img-item').forEach(item => {
        item.addEventListener('click', () => {
          grid.querySelectorAll('.serper-img-item').forEach(x => x.classList.remove('selected'));
          item.classList.add('selected');
          setSelected(item.dataset.url);
        });
      });
    } catch(err) {
      grid.innerHTML = `<div class="serper-loading" style="color:#dc2626">Error: ${err.message}</div>`;
    }
  }

  function readFile(file) {
    if (file.size > 8 * 1024 * 1024) { alert('Archivo demasiado grande (máx 8 MB)'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      overlay.querySelector('#ipUploadPreview').innerHTML =
        `<img src="${dataUrl}" style="max-width:100%;max-height:260px;border-radius:10px;display:block;margin:0 auto;">`;
      setSelected(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function previewUrl() {
    const url = overlay.querySelector('#ipUrlInput').value.trim();
    if (!url) return;
    overlay.querySelector('#ipUrlPreview').innerHTML =
      `<img src="${url}" style="max-width:100%;max-height:220px;border-radius:10px;display:block;"
        onerror="this.parentElement.innerHTML='<p style=color:#dc2626;font-size:13px>No se pudo cargar la imagen.</p>'">`;
    setSelected(url);
  }

  function doApply() {
    if (selectedUrl && callback) callback(selectedUrl);
    close();
  }

  function open(defaultQuery, cb, title, hint) {
    if (!overlay) build();
    callback = cb;
    selectedUrl = null;
    overlay.querySelector('#ipApply').disabled = true;
    overlay.querySelector('#ipTitle').textContent = title || 'Agregar imagen';
    const hintEl = overlay.querySelector('#ipHint');
    if (hint) { hintEl.textContent = '📐 ' + hint; hintEl.style.display = 'block'; }
    else { hintEl.style.display = 'none'; }
    overlay.querySelector('#ipSearchInput').value = defaultQuery || '';
    overlay.querySelector('#ipGrid').innerHTML = '';
    overlay.querySelector('#ipUploadPreview').innerHTML = '';
    overlay.querySelector('#ipUrlInput').value = '';
    overlay.querySelector('#ipUrlPreview').innerHTML = '';
    switchTab('search');
    overlay.classList.add('show');
    if (defaultQuery) doSearch();
  }

  function close() { if (overlay) overlay.classList.remove('show'); }

  return { open };
})();

/* Alias para compatibilidad con código existente */
const SerperPicker = ImagePicker;

/* ============================================================
   BLOG MANAGER — Artículos con IA
   ============================================================ */
const BlogManager = (() => {
  const STORE = 'crestron_blog_posts';

  /* Artículos de ejemplo para mostrar si no hay nada guardado */
  const DEFAULT_POSTS = [
    {
      id: 'p1',
      title: 'Crestron Home OS 4: La nueva era de la automatización residencial',
      excerpt: 'La última versión del sistema operativo de Crestron trae configuración simplificada, nuevas integraciones y la mejor experiencia de usuario de la historia.',
      content: 'Crestron Home OS 4 representa un salto cualitativo en la automatización residencial. Con una interfaz rediseñada y un motor de configuración hasta tres veces más rápido, instaladores y clientes ahora pueden poner un hogar inteligente en funcionamiento en tiempo récord.\n\nEntre las novedades más destacadas se encuentra la integración nativa con Apple Home, que permite controlar todos los dispositivos Crestron directamente desde la app Hogar de iOS. Además, la compatibilidad con Matter —el estándar abierto de la industria— garantiza que el sistema pueda comunicarse con cientos de dispositivos de terceros sin fricciones.\n\nLa aplicación móvil renovada lleva la experiencia de usuario a otro nivel: personalización por habitación, favoritos rápidos y escenas inteligentes que aprenden de los hábitos del hogar.',
      category: 'Plataforma',
      image: '',
      date: '2024-12-15',
    },
    {
      id: 'p2',
      title: '¿Por qué elegir Crestron sobre otras marcas de domótica?',
      excerpt: 'Analizamos las principales diferencias entre Crestron Home y otras plataformas populares como Lutron, Control4 y KNX.',
      content: 'El mercado de la automatización residencial ofrece muchas alternativas, pero no todas son iguales. Crestron Home se distingue por tres características clave que pocas plataformas pueden igualar: confiabilidad, escalabilidad y la ausencia de suscripciones mensuales.\n\nMientras que otras plataformas populares requieren pagos recurrentes para mantener las funciones activas, Crestron Home es tuyo para siempre desde el primer día. Una inversión única que protege a los propietarios de cambios de precios o discontinuaciones del servicio.\n\nEn términos de hardware, los procesadores Crestron están diseñados para funcionar 24/7 durante décadas. La garantía extendida y el soporte técnico de nivel empresarial son estándar, no opcionales.',
      category: 'Comparativas',
      image: '',
      date: '2024-11-28',
    },
  ];

  function loadPosts() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE));
      return stored && stored.length ? stored : DEFAULT_POSTS;
    } catch { return DEFAULT_POSTS; }
  }

  function savePosts(posts) {
    localStorage.setItem(STORE, JSON.stringify(posts));
  }

  function savePost(post) {
    const posts = loadPosts();
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx >= 0) posts[idx] = post;
    else posts.unshift(post);
    savePosts(posts);
  }

  function deletePost(id) {
    const posts = loadPosts().filter(p => p.id !== id);
    savePosts(posts);
  }

  function renderBlog(limitTo) {
    const container = document.getElementById('blogGrid');
    if (!container) return;
    const allPosts = loadPosts();
    const posts = limitTo ? allPosts.slice(0, limitTo) : allPosts;
    container.innerHTML = posts.map(post => `
      <article class="blog-card" data-post-id="${post.id}">
        <div class="blog-card-img" style="${post.image ? `background-image:url('${post.image}')` : ''}">
          ${!post.image ? `<div class="blog-img-placeholder">${post.category}</div>` : ''}
        </div>
        <div class="blog-card-body">
          <span class="blog-category-tag">${post.category}</span>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-footer">
            <time class="blog-date">${formatDate(post.date)}</time>
            <div class="blog-card-actions">
              <button class="btn-read-more" data-id="${post.id}">Leer más →</button>
              ${Auth.isLoggedIn() ? `<button class="btn-blog-edit" data-id="${post.id}">✏️</button><button class="btn-blog-del" data-id="${post.id}">🗑️</button>` : ''}
            </div>
          </div>
        </div>
      </article>`).join('');

    /* Evento: expandir artículo */
    container.querySelectorAll('.btn-read-more').forEach(btn => {
      btn.addEventListener('click', () => showPostReader(btn.dataset.id));
    });
    /* Eventos admin */
    container.querySelectorAll('.btn-blog-edit').forEach(btn => {
      btn.addEventListener('click', () => showPostEditor(btn.dataset.id));
    });
    container.querySelectorAll('.btn-blog-del').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('\u00bfEliminar este art\u00edculo?')) { deletePost(btn.dataset.id); renderBlog(); if (typeof BlogPage !== 'undefined') BlogPage.renderGrid(); }
      });
    });
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return iso; }
  }

  /* ── Post Reader Modal ───────────────────────────────────── */
  function showPostReader(id) {
    const posts = loadPosts();
    const post = posts.find(p => p.id === id);
    if (!post) return;

    let readerOverlay = document.getElementById('postReaderOverlay');
    if (!readerOverlay) {
      readerOverlay = document.createElement('div');
      readerOverlay.id = 'postReaderOverlay';
      readerOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(7,21,37,0.85);backdrop-filter:blur(8px);z-index:95000;display:flex;align-items:center;justify-content:center;';
      document.body.appendChild(readerOverlay);
      readerOverlay.addEventListener('click', e => { if (e.target === readerOverlay) readerOverlay.remove(); });
    }
    readerOverlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:40px;max-width:700px;width:90%;max-height:85vh;overflow-y:auto;position:relative;">
        <button onclick="this.closest('#postReaderOverlay').remove()" style="position:absolute;top:16px;right:16px;background:var(--bg-light);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;">✕</button>
        <span style="font-size:12px;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:.05em;">${post.category}</span>
        <h2 style="font-size:24px;font-weight:700;color:var(--text-dark);margin:12px 0 8px;">${post.title}</h2>
        <time style="font-size:13px;color:var(--text-light);">${formatDate(post.date)}</time>
        ${post.image ? `<img src="${post.image}" style="width:100%;border-radius:10px;margin:20px 0;aspect-ratio:16/9;object-fit:cover;" alt="">` : ''}
        <div style="color:var(--text-medium);line-height:1.8;margin-top:20px;font-size:15px;white-space:pre-line;">${post.content}</div>
      </div>`;
    readerOverlay.style.display = 'flex';
  }

  /* ── Post Editor Modal ───────────────────────────────────── */
  function showPostEditor(id) {
    const posts = loadPosts();
    const post = id ? posts.find(p => p.id === id) : null;

    /* Remove previous modal if exists */
    document.getElementById('blogModalOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'blogModalOverlay';
    overlay.className = 'blog-modal-overlay';

    overlay.innerHTML = `
      <div class="blog-modal">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <h3 style="margin:0;">${post ? 'Editar artículo' : 'Nuevo artículo'}</h3>
          <button id="blogCloseX" style="background:var(--bg-light);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <!-- AI Generation block -->
        <div style="background:linear-gradient(135deg,#f0f4ff,#e8f0fe);border:1px solid rgba(99,102,241,.2);border-radius:12px;padding:20px;margin-bottom:22px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6366f1;margin-bottom:10px;">✨ ${post ? 'Regenerar con IA' : 'Generá el artículo con IA'}</div>
          <p style="font-size:13px;color:#4A5E72;margin-bottom:14px;line-height:1.5;">Escribí el tema en español o inglés y la IA genera el artículo completo (título, resumen y contenido) en español argentino.</p>
          <div style="display:flex;gap:10px;">
            <input type="text" id="blogTopic" placeholder="Ej: benefits of smart home automation, Crestron vs KNX, home theater setup..." style="flex:1;padding:10px 14px;border:1.5px solid rgba(99,102,241,.3);border-radius:8px;font-size:14px;font-family:inherit;">
            <button class="btn-ai-generate" id="btnAiGenerate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2l2.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Generar
            </button>
          </div>
          <div id="aiStatus" style="font-size:12px;color:#6366f1;margin-top:8px;display:none;"></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;color:var(--text-light);font-size:12px;"><div style="flex:1;height:1px;background:var(--border)"></div>o editá manualmente<div style="flex:1;height:1px;background:var(--border)"></div></div>

        <div class="blog-field">
          <label>Título</label>
          <input type="text" id="blogTitle" value="${post ? escHtml(post.title) : ''}" placeholder="Título del artículo en español">
        </div>
        <div class="blog-field">
          <label>Categoría</label>
          <select id="blogCategory">
            ${['Plataforma','Instalación','Comparativas','Novedades','Casos de éxito'].map(c => `<option${post && post.category===c?' selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="blog-field">
          <label>Resumen <span style="font-weight:400;color:var(--text-light)">(texto de la tarjeta)</span></label>
          <textarea id="blogExcerpt" rows="2" placeholder="2-3 oraciones que resumen el artículo">${post ? escHtml(post.excerpt) : ''}</textarea>
        </div>
        <div class="blog-field">
          <label>Contenido completo</label>
          <textarea id="blogContent" rows="9" placeholder="El artículo completo...">${post ? escHtml(post.content) : ''}</textarea>
        </div>
        <div class="blog-field">
          <label>Imagen de cabecera <span style="font-weight:400;color:var(--text-light)">(opcional · Recomendado: 1200 × 630 px)</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" id="blogImage" value="${post && post.image ? escHtml(post.image) : ''}" placeholder="URL de imagen..." style="flex:1;">
            <button type="button" id="blogImagePickerBtn" style="padding:8px 14px;border-radius:8px;border:1.5px solid var(--border-med);background:#fff;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;white-space:nowrap;color:var(--text-medium);">🖼️ Elegir</button>
          </div>
          <div id="blogImagePreview" style="margin-top:8px;">${post && post.image ? `<img src="${escHtml(post.image)}" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;">` : ''}</div>
        </div>
        <div class="blog-modal-actions">
          <button class="btn-blog-cancel" id="blogCancelBtn">Cancelar</button>
          <button class="btn-blog-save" id="blogSaveBtn">Guardar artículo</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    /* Force reflow so CSS transition plays */
    overlay.getBoundingClientRect();
    overlay.classList.add('show');

    const closeModal = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); };

    overlay.querySelector('#blogCloseX').addEventListener('click', closeModal);
    overlay.querySelector('#blogCancelBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#blogSaveBtn').addEventListener('click', () => {
      const title = overlay.querySelector('#blogTitle').value.trim();
      if (!title) { overlay.querySelector('#blogTitle').focus(); return; }
      const newPost = {
        id: post ? post.id : 'p' + Date.now(),
        title,
        excerpt: overlay.querySelector('#blogExcerpt').value.trim(),
        content: overlay.querySelector('#blogContent').value.trim(),
        category: overlay.querySelector('#blogCategory').value,
        image: overlay.querySelector('#blogImage').value.trim(),
        date: post ? post.date : new Date().toISOString().slice(0,10),
      };
      savePost(newPost);
      closeModal();
      renderBlog();
      /* If on blog.html, also refresh its grid */
      if (typeof BlogPage !== 'undefined') BlogPage.renderGrid();
    });

    const aiBtn = overlay.querySelector('#btnAiGenerate');
    if (aiBtn) aiBtn.addEventListener('click', () => generateWithAI(overlay));

    /* Image picker button */
    overlay.querySelector('#blogImagePickerBtn')?.addEventListener('click', () => {
      const query = overlay.querySelector('#blogTitle').value.trim() || 'smart home automation';
      ImagePicker.open(query, (url) => {
        overlay.querySelector('#blogImage').value = url;
        overlay.querySelector('#blogImagePreview').innerHTML =
          `<img src="${url}" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;">`;
      }, 'Imagen de cabecera del artículo', 'Recomendado: 1200 × 630 px (16:9)');
    });

    /* Live preview when URL typed manually */
    overlay.querySelector('#blogImage')?.addEventListener('blur', () => {
      const url = overlay.querySelector('#blogImage').value.trim();
      overlay.querySelector('#blogImagePreview').innerHTML = url
        ? `<img src="${url}" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`
        : '';
    });
  }

  async function generateWithAI(overlay) {
    const topicInput = overlay.querySelector('#blogTopic');
    const topic = topicInput?.value.trim();
    if (!topic) { topicInput?.focus(); return; }

    if (!CFG.OPENAI_KEY || CFG.OPENAI_KEY.startsWith('TU_')) {
      overlay.querySelector('#aiStatus').style.display = 'block';
      overlay.querySelector('#aiStatus').style.color = '#dc2626';
      overlay.querySelector('#aiStatus').textContent = 'Falta la API key de OpenAI en config.js';
      return;
    }

    const aiBtn = overlay.querySelector('#btnAiGenerate');
    const aiStatus = overlay.querySelector('#aiStatus');
    aiBtn.disabled = true;
    aiBtn.textContent = 'Generando...';
    aiStatus.style.display = 'block';
    aiStatus.style.color = '#6366f1';
    aiStatus.textContent = 'La IA está escribiendo el artículo...';

    const category = overlay.querySelector('#blogCategory').value;

    const prompt = `Sos un experto en automatización residencial y smart home. Generá un artículo de blog profesional en español argentino para el sitio de Crestron Home Argentina (distribuidor: Soundtec SRL).

TEMA: "${topic}"
CATEGORÍA: ${category}

Respondé ÚNICAMENTE con un JSON válido con este formato exacto:
{
  "title": "Título del artículo en español",
  "excerpt": "Resumen de 2 oraciones que describe el artículo",
  "content": "Cuerpo completo del artículo (300-450 palabras, párrafos separados por \\n\\n, sin markdown, sin subtítulos, en español argentino profesional)"
}`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CFG.OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 900,
          temperature: 0.72,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Error ${res.status}`);
      }

      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      if (parsed.title) overlay.querySelector('#blogTitle').value = parsed.title;
      if (parsed.excerpt) overlay.querySelector('#blogExcerpt').value = parsed.excerpt;
      if (parsed.content) overlay.querySelector('#blogContent').value = parsed.content;

      aiStatus.style.color = '#16a34a';
      aiStatus.textContent = '¡Artículo generado! Revisá y editá antes de guardar.';

    } catch(err) {
      aiStatus.style.color = '#dc2626';
      aiStatus.textContent = 'Error: ' + err.message;
    } finally {
      aiBtn.disabled = false;
      aiBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2l2.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Generar`;
    }
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { renderBlog, showPostEditor };
})();

/* ============================================================
   HERO CAROUSEL
   ============================================================ */
const HeroCarousel = (() => {
  let slides, dots, current = 0, timer;

  function init() {
    const wrap = document.querySelector('.hero-slides');
    if (!wrap) return;
    slides = wrap.querySelectorAll('.hero-slide');
    dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;
    goTo(0);
    startAuto();

    document.querySelector('.hero-prev')?.addEventListener('click', () => { clearInterval(timer); prev(); startAuto(); });
    document.querySelector('.hero-next')?.addEventListener('click', () => { clearInterval(timer); next(); startAuto(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { clearInterval(timer); goTo(i); startAuto(); }));
  }

  function goTo(i) {
    if (!slides.length) return;
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }
  function startAuto() { timer = setInterval(next, 5500); }

  return { init };
})();

/* ============================================================
   BRANDS — Marcas Compatibles
   ============================================================ */
const BrandsSection = (() => {
  const BRANDS = [
    { id: 'yale',        name: 'Yale',          cat: 'Cerraduras',    icon: '🔐', tip: 'Cerraduras inteligentes con acceso por PIN, tarjeta o app.' },
    { id: '2n',          name: '2N',            cat: 'Videoportero',  icon: '📹', tip: 'Videoportero IP de alta definición con control remoto.' },
    { id: 'doorbird',    name: 'DoorBird',      cat: 'Videoportero',  icon: '🚪', tip: 'Portero visual HD integrado directamente con Crestron.' },
    { id: 'apple',       name: 'Apple Home',    cat: 'Ecosistema',    icon: '🍎', tip: 'Control nativo desde iPhone, iPad y Apple Watch.' },
    { id: 'google',      name: 'Google Home',   cat: 'Ecosistema',    icon: '🏠', tip: 'Integración con dispositivos Google y asistente de voz.' },
    { id: 'amazon',      name: 'Amazon Alexa',  cat: 'Voz',           icon: '🔊', tip: 'Control por voz de escenas, luces y climatización.' },
    { id: 'spotify',     name: 'Spotify',       cat: 'Streaming',     icon: '🎵', tip: 'Música personalizada por zona distribuida por Crestron.' },
    { id: 'apple-music', name: 'Apple Music',   cat: 'Streaming',     icon: '🎶', tip: 'Streaming de alta calidad integrado a cada habitación.' },
    { id: 'tidal',       name: 'TIDAL',         cat: 'Streaming',     icon: '🎼', tip: 'Audio Hi-Fi y MQA para sistemas de alta fidelidad.' },
    { id: 'liftmaster',  name: 'LiftMaster',    cat: 'Portones',      icon: '🚗', tip: 'Automatización de portones con apertura por escena.' },
    { id: 'lutron',      name: 'Lutron',        cat: 'Iluminación',   icon: '💡', tip: 'Dimmers y sistemas de iluminación de precisión profesional.' },
    { id: 'nest',        name: 'Google Nest',   cat: 'Termostatos',   icon: '🌡️', tip: 'Termostatos inteligentes con aprendizaje automático.' },
  ];

  function render() {
    const grid = document.getElementById('brandsGrid');
    if (!grid) return;
    const savedImgs = ContentEditor.getBrandImages();

    grid.innerHTML = BRANDS.map(b => {
      const savedUrl = savedImgs[b.id];
      return `
        <div class="brand-card" data-brand="${b.id}">
          ${savedUrl
            ? `<img src="${savedUrl}" alt="${b.name}" class="brand-logo-img" style="max-height:48px;object-fit:contain;">`
            : `<div class="brand-icon-placeholder">${b.icon}</div>`
          }
          <div class="brand-name">${b.name}</div>
          <div class="brand-cat">${b.cat}</div>
          <div class="brand-tooltip">${b.tip}</div>
          <button class="admin-brand-refresh" data-brand-id="${b.id}" data-brand-name="${b.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Logo
          </button>
        </div>`;
    }).join('');

    grid.querySelectorAll('.admin-brand-refresh').forEach(btn => {
      btn.addEventListener('click', () => {
        SerperPicker.open(`${btn.dataset.brandName} logo transparent png`, (url) => {
          ContentEditor.saveBrandImage(btn.dataset.brandId, url);
          render();
        }, `Logo de ${btn.dataset.brandName}`, 'Recomendado: 300 × 120 px (horizontal, fondo transparente)');
      });
    });
  }

  return { render };
})();

/* ============================================================
   ADMIN UI — Inicialización principal
   ============================================================ */
(function initAdmin() {
  /* ── Build login modal ─────────────────────────────────────── */
  const loginOverlay = document.createElement('div');
  loginOverlay.className = 'admin-overlay';
  loginOverlay.id = 'adminLoginOverlay';
  loginOverlay.innerHTML = `
    <div class="admin-modal">
      <button class="admin-modal-close" id="adminModalClose">✕</button>
      <div class="admin-modal-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <span>Admin Panel</span>
      </div>
      <h2>Acceso administrativo</h2>
      <p>Ingresá tus credenciales para editar el contenido del sitio.</p>
      <div class="admin-error" id="adminError">Usuario o contraseña incorrectos</div>
      <div class="admin-field">
        <label>Usuario</label>
        <input type="text" id="adminUser" autocomplete="username" placeholder="Usuario">
      </div>
      <div class="admin-field">
        <label>Contraseña</label>
        <input type="password" id="adminPass" autocomplete="current-password" placeholder="Contraseña">
      </div>
      <button class="btn-admin-login" id="adminLoginBtn">Ingresar</button>
    </div>`;
  document.body.appendChild(loginOverlay);

  /* ── Build admin toolbar (floating FABs) ───────────────────── */
  const toolbar = document.createElement('div');
  toolbar.className = 'admin-toolbar';
  toolbar.id = 'adminToolbar';
  toolbar.innerHTML = `
    <button class="admin-fab danger" id="fabLogout">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Cerrar sesión
    </button>
    <button class="admin-fab" id="fabNewPost">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
      Nuevo artículo
    </button>
    <button class="admin-fab" id="fabNewProduct">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
      Nuevo producto
    </button>
    <button class="admin-fab" id="fabNewRecurso">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      Nuevo recurso
    </button>
    <button class="admin-fab" id="fabSetVideo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
      Editar video
    </button>
    <button class="admin-fab" id="fabToggleEdit">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Modo edición
    </button>
    <div class="admin-fab admin-fab-main" id="fabMain" style="cursor:pointer;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      ADMIN
    </div>`;
  document.body.appendChild(toolbar);

  /* ── Edit badge ────────────────────────────────────────────── */
  const editBadge = document.createElement('div');
  editBadge.className = 'admin-edit-badge';
  editBadge.id = 'adminEditBadge';
  editBadge.textContent = '✏️ Modo edición activo — hacé clic en cualquier texto para editarlo';
  document.body.appendChild(editBadge);

  /* ── Events: login modal ─────────────────────────────────────*/
  const triggerBtn = document.querySelector('.btn-admin-trigger');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      if (Auth.isLoggedIn()) {
        /* Ya logueado → toggle toolbar */
        toolbar.classList.toggle('show');
      } else {
        loginOverlay.classList.add('show');
        document.getElementById('adminUser').focus();
      }
    });
  }

  /* ADMIN FAB-main: click to login or toggle toolbar (all pages) */
  document.getElementById('fabMain')?.addEventListener('click', () => {
    if (Auth.isLoggedIn()) {
      toolbar.classList.toggle('show');
    } else {
      loginOverlay.classList.add('show');
      document.getElementById('adminUser').focus();
    }
  });

  document.getElementById('adminModalClose').addEventListener('click', () => loginOverlay.classList.remove('show'));
  loginOverlay.addEventListener('click', e => { if (e.target === loginOverlay) loginOverlay.classList.remove('show'); });

  /* Enter key login */
  ['adminUser','adminPass'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  });
  document.getElementById('adminLoginBtn').addEventListener('click', doLogin);

  function doLogin() {
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value;
    const errEl = document.getElementById('adminError');

    if (Auth.login(user, pass)) {
      errEl.classList.remove('show');
      loginOverlay.classList.remove('show');
      onAuthSuccess();
      document.dispatchEvent(new CustomEvent('crestron:auth:login'));
    } else {
      errEl.classList.add('show');
      document.getElementById('adminPass').value = '';
      document.getElementById('adminPass').focus();
    }
  }

  /* ── Events: toolbar ───────────────────────────────────────── */
  let editMode = false;

  document.getElementById('fabLogout').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión de administrador?')) {
      Auth.logout();
      exitEditMode();
      toolbar.classList.remove('show');
      triggerBtn?.classList.remove('active');
      /* Remover botones admin del blog */
      BlogManager.renderBlog();
      BrandsSection.render();
      if (typeof BlogPage !== 'undefined') BlogPage.renderGrid();
      document.dispatchEvent(new CustomEvent('crestron:auth:logout'));
    }
  });

  document.getElementById('fabNewPost').addEventListener('click', () => BlogManager.showPostEditor(null));
  document.getElementById('fabNewProduct').addEventListener('click', showAddProductForm);
  document.getElementById('fabNewRecurso').addEventListener('click', () => {
    if (typeof RecursosPage !== 'undefined') RecursosPage.openModal();
    else window.location.href = 'recursos.html';
  });
  document.getElementById('fabSetVideo').addEventListener('click', () => {
    if (typeof VideoManager !== 'undefined') VideoManager.showEditor();
  });

  document.getElementById('fabToggleEdit').addEventListener('click', () => {
    editMode = !editMode;
    if (editMode) enterEditMode();
    else exitEditMode();
  });

  function enterEditMode() {
    document.body.classList.add('admin-edit-mode');
    editBadge.classList.add('show');
    ContentEditor.enableEditing();
    addProductImgButtons();
    initSlideEditButtons();
    document.getElementById('fabToggleEdit').style.background = 'var(--accent)';
    if (typeof SectionEditor !== 'undefined') SectionEditor.addControls();
  }

  function exitEditMode() {
    editMode = false;
    document.body.classList.remove('admin-edit-mode');
    editBadge.classList.remove('show');
    ContentEditor.disableEditing();
    document.getElementById('fabToggleEdit').style.background = '';
    if (typeof SectionEditor !== 'undefined') SectionEditor.removeControls();
  }

  /* ── Slide image editing ───────────────────────────────────── */
  function initSlideEditButtons() {
    document.querySelectorAll('.admin-slide-edit-btn').forEach(btn => {
      /* Remove old listener and re-attach (handles re-entry into edit mode) */
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        const slideIdx = newBtn.dataset.slide;
        const queries = [
          'luxury smart home living room interior photography',
          'Crestron touch screen control panel modern home',
          'modern smart home automation interior design',
          'smart home keypads controllers technology display',
        ];
        SerperPicker.open(queries[slideIdx] || 'smart home interior', (url) => {
          ContentEditor.saveSlideImage(slideIdx, url);
          const slide = document.querySelector(`.hero-slide[data-slide="${slideIdx}"]`);
          if (slide) slide.style.backgroundImage = `url('${url}')`;
        }, `Foto de slider ${slideIdx + 1}`, 'Recomendado: 1920 × 1080 px (16:9)');
      });
    });
  }

  function addProductImgButtons() {
    document.querySelectorAll('.product-card').forEach(card => {
      if (card.querySelector('.admin-img-btn')) return;
      const model = card.dataset.model || card.querySelector('.product-model')?.textContent || '';
      const btn = document.createElement('button');
      btn.className = 'admin-img-btn';
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Imagen`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        SerperPicker.open(`Crestron ${model} product photo`, (url) => {
          ContentEditor.saveProductImage(model, url);
          const imgArea = card.querySelector('.product-image');
          if (imgArea) ContentEditor.applyProductImageEl(imgArea, url);
        }, `Foto de ${model}`, 'Recomendado: 800 × 800 px (cuadrado)');
      });
      card.querySelector('.product-image')?.appendChild(btn);
    });
  }

  /* ── If already logged in from sessionStorage ─────────────── */
  function onAuthSuccess() {
    toolbar.classList.add('show');
    triggerBtn?.classList.add('active');
    /* Re-render blog and brands to show edit buttons */
    BlogManager.renderBlog();
    BrandsSection.render();
    /* Notify blog.html page if BlogPage is loaded */
    if (typeof BlogPage !== 'undefined') BlogPage.renderGrid();
    /* Notify catalog page if CatalogApp is loaded */
    if (typeof CatalogApp !== 'undefined') CatalogApp.init();
  }

  if (Auth.isLoggedIn()) onAuthSuccess();

  /* ── Apply stored content on load ─────────────────────────── */
  ContentEditor.applyStoredContent();

  /* ── Init hero carousel, blog (preview: 3), brands ────────── */
  HeroCarousel.init();
  /* On index.html show only 3 blog previews; blog.html shows all */
  const isIndexPage = !!document.getElementById('catalogFilters');
  BlogManager.renderBlog(isIndexPage ? 3 : undefined);
  BrandsSection.render();

  /* Observer: when productsGrid updates, add img buttons if in edit mode */
  const productsGrid = document.getElementById('productsGrid');
  if (productsGrid) {
    new MutationObserver(() => {
      if (editMode) addProductImgButtons();
      applyAllProductImages();
    }).observe(productsGrid, { childList: true });
  }

  function applyAllProductImages() {
    /* Legacy single images */
    const imgs = ContentEditor.getProductImages();
    Object.entries(imgs).forEach(([model, url]) => {
      const card = document.querySelector(`.product-card[data-model="${model}"] .product-image`);
      if (card) ContentEditor.applyProductImageEl(card, url);
    });
    /* Multi-image: use first image */
    document.querySelectorAll('.product-card[data-model]').forEach(card => {
      const model = card.dataset.model;
      const extra = ContentEditor.getProductExtra(model);
      if (extra.images && extra.images.length > 0) {
        const { url, posX = 50, posY = 50 } = extra.images[0];
        const imgArea = card.querySelector('.product-image');
        if (imgArea) {
          imgArea.style.backgroundImage = `url('${url}')`;
          imgArea.style.backgroundSize = 'cover';
          imgArea.style.backgroundPosition = `${posX}% ${posY}%`;
          const icon = imgArea.querySelector('.product-img-icon');
          if (icon) icon.style.display = 'none';
          const bg = imgArea.querySelector('.product-model-bg');
          if (bg) bg.style.display = 'none';
        }
      }
    });
  }

  /* ── Add Product Form ──────────────────────────────────────── */
  const CATEGORIES = [
    { val: 'procesadores', label: 'Procesadores' },
    { val: 'pantallas', label: 'Pantallas' },
    { val: 'keypads', label: 'Keypads' },
    { val: 'audio', label: 'Audio' },
    { val: 'speakers', label: 'Altavoces' },
    { val: 'video', label: 'Video' },
    { val: 'climatizacion', label: 'Climatización' },
    { val: 'shading', label: 'Shading' },
    { val: 'seguridad', label: 'Seguridad' },
    { val: 'networking', label: 'Networking' },
  ];
  const CAT_ICONS = { procesadores:'⚙️', pantallas:'📱', keypads:'🎛️', audio:'🔊', speakers:'🔈', video:'📺', climatizacion:'🌡️', shading:'🪟', seguridad:'🔒', networking:'🌐' };

  function showAddProductForm(existingProduct) {
    document.getElementById('addProductOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'addProductOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(7,21,37,0.85);backdrop-filter:blur(8px);z-index:92000;display:flex;align-items:center;justify-content:center;padding:20px;';
    const isEdit = !!existingProduct;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;position:relative;">
        <button id="apClose" style="position:absolute;top:16px;right:16px;background:var(--bg-light);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;">✕</button>
        <h3 style="font-size:20px;font-weight:700;color:var(--text-dark);margin-bottom:24px;">${isEdit ? 'Editar producto' : 'Nuevo producto'}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div>
            <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-medium);display:block;margin-bottom:6px;">Modelo *</label>
            <input id="apModel" type="text" value="${existingProduct?.model || ''}" placeholder="Ej: TSW-770-B-S" style="width:100%;padding:10px 12px;border:1.5px solid var(--border-med);border-radius:8px;font-size:14px;font-family:inherit;" ${isEdit ? 'readonly' : ''}>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-medium);display:block;margin-bottom:6px;">Categoría *</label>
            <select id="apCategory" style="width:100%;padding:10px 12px;border:1.5px solid var(--border-med);border-radius:8px;font-size:14px;font-family:inherit;background:#fff;">
              ${CATEGORIES.map(c => `<option value="${c.val}" ${existingProduct?.category===c.val?'selected':''}>${c.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-medium);display:block;margin-bottom:6px;">Nombre del producto *</label>
          <input id="apName" type="text" value="${existingProduct?.name || ''}" placeholder="Nombre descriptivo" style="width:100%;padding:10px 12px;border:1.5px solid var(--border-med);border-radius:8px;font-size:14px;font-family:inherit;">
        </div>
        <div style="margin-bottom:20px;">
          <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-medium);display:block;margin-bottom:6px;">Descripción</label>
          <textarea id="apDesc" rows="3" placeholder="Descripción del producto..." style="width:100%;padding:10px 12px;border:1.5px solid var(--border-med);border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;">${existingProduct?.desc || ''}</textarea>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="apCancel" style="padding:10px 18px;background:var(--bg-light);border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;">Cancelar</button>
          ${isEdit ? `<button id="apDelete" style="padding:10px 18px;background:#fee2e2;color:#dc2626;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;">Eliminar</button>` : ''}
          <button id="apSave" style="padding:10px 22px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Guardar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#apClose').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#apCancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#apSave').addEventListener('click', () => {
      const model = overlay.querySelector('#apModel').value.trim();
      const name = overlay.querySelector('#apName').value.trim();
      const category = overlay.querySelector('#apCategory').value;
      const desc = overlay.querySelector('#apDesc').value.trim();
      if (!model || !name) { alert('Modelo y nombre son obligatorios'); return; }
      const catLabel = CATEGORIES.find(c => c.val === category)?.label || category;
      ContentEditor.saveCustomProduct({ model, name, category, catLabel, desc, icon: CAT_ICONS[category] || '📦', custom: true });
      overlay.remove();
      /* Re-render products */
      if (typeof renderProducts === 'function') {
        const activeBtn = document.querySelector('.filter-btn.active');
        renderProducts(activeBtn?.dataset.filter || 'all');
      }
    });
    if (isEdit) {
      overlay.querySelector('#apDelete')?.addEventListener('click', () => {
        if (!confirm('¿Eliminar este producto?')) return;
        ContentEditor.deleteCustomProduct(existingProduct.model);
        overlay.remove();
        if (typeof renderProducts === 'function') {
          const activeBtn = document.querySelector('.filter-btn.active');
          renderProducts(activeBtn?.dataset.filter || 'all');
        }
      });
    }
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* Expose showAddProductForm for catalog page */
  window.adminShowAddProductForm = showAddProductForm;
})();

/* ============================================================
   VIDEO MANAGER — Set/render video section
   ============================================================ */
const VideoManager = (() => {
  const KEY = 'crestron_video_url';

  function getUrl() { return localStorage.getItem(KEY) || ''; }
  function setUrl(url) { localStorage.setItem(KEY, url); }

  function toEmbedUrl(url) {
    if (!url) return '';
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1] + '?rel=0&modestbranding=1';
    // Vimeo
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return 'https://player.vimeo.com/video/' + vmMatch[1];
    // Direct mp4/webm etc – use as-is in <video>
    return url;
  }

  function render() {
    const wrapper = document.getElementById('videoEmbedWrapper');
    const placeholder = document.getElementById('videoPlaceholder');
    if (!wrapper) return;
    const url = getUrl();
    const embed = toEmbedUrl(url);
    if (!embed) {
      if (placeholder) placeholder.style.display = 'flex';
      return;
    }
    if (placeholder) placeholder.style.display = 'none';
    // Clear previous embeds
    wrapper.querySelectorAll('iframe,video').forEach(el => el.remove());
    if (embed.includes('youtube.com') || embed.includes('vimeo.com')) {
      const iframe = document.createElement('iframe');
      iframe.src = embed;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
      wrapper.appendChild(iframe);
    } else {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000;';
      wrapper.appendChild(video);
    }
  }

  function showEditor() {
    const cur = getUrl();
    const val = prompt('Pegá la URL del video (YouTube, Vimeo o enlace directo):', cur || '');
    if (val === null) return;
    setUrl(val.trim());
    render();
  }

  return { render, showEditor };
})();

/* ============================================================
   RESOURCES MANAGER — CRUD for crestron_recursos (admin)
   ============================================================ */
const ResourcesManager = (() => {
  const KEY = 'crestron_recursos';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function save(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

  function addResource(data) {
    const all = load();
    all.unshift({ id: Date.now().toString(), ...data });
    save(all);
    if (typeof RecursosPage !== 'undefined') { RecursosPage.renderGrid(); RecursosPage.renderPreview(); }
  }

  return { load, save, addResource };
})();

/* ============================================================
   SECTION VISIBILITY — Hide/show sections in edit mode
   ============================================================ */
const SectionEditor = (() => {
  const KEY = 'crestron_hidden_sections';

  function getHidden() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function setHidden(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

  function applyVisibility() {
    const hidden = getHidden();
    document.querySelectorAll('section[id], .video-section[id]').forEach(sec => {
      sec.style.display = hidden.includes(sec.id) ? 'none' : '';
    });
  }

  function addControls() {
    const hidden = getHidden();
    document.querySelectorAll('section[id], .video-section[id]').forEach(sec => {
      if (sec.querySelector('.section-visibility-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'section-visibility-btn';
      const isHidden = hidden.includes(sec.id);
      btn.textContent = isHidden ? '👁️ Mostrar sección' : '🙈 Ocultar sección';
      btn.style.cssText = 'position:absolute;top:10px;right:10px;z-index:9000;padding:6px 12px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);';
      btn.addEventListener('click', () => {
        const h = getHidden();
        const idx = h.indexOf(sec.id);
        if (idx === -1) { h.push(sec.id); btn.textContent = '👁️ Mostrar sección'; sec.style.opacity = '0.4'; }
        else { h.splice(idx, 1); btn.textContent = '🙈 Ocultar sección'; sec.style.opacity = ''; }
        setHidden(h);
      });
      sec.style.position = sec.style.position || 'relative';
      sec.appendChild(btn);
    });
  }

  function removeControls() {
    document.querySelectorAll('.section-visibility-btn').forEach(btn => btn.remove());
    document.querySelectorAll('section[id], .video-section[id]').forEach(sec => { sec.style.opacity = ''; });
    applyVisibility();
  }

  return { applyVisibility, addControls, removeControls };
})();

/* ── Hook VideoManager, ResourcesManager, SectionEditor into existing flow ── */
document.addEventListener('DOMContentLoaded', () => {
  /* Apply section visibility */
  SectionEditor.applyVisibility();

  /* Render video */
  VideoManager.render();

  /* Render resources preview on homepage */
  if (typeof RecursosPage !== 'undefined') RecursosPage.renderPreview();

  /* Show admin-only elements if logged in */
  function applyAdminUI(loggedIn) {
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = loggedIn ? '' : 'none';
    });
    if (loggedIn) {
      SectionEditor.addControls();
      if (typeof RecursosPage !== 'undefined') {
        RecursosPage.renderGrid();
        RecursosPage.renderPreview();
      }
    } else {
      SectionEditor.removeControls();
    }
  }

  applyAdminUI(Auth.isLoggedIn());

  /* Set video button */
  const btnSetVideo = document.getElementById('btnSetVideo');
  if (btnSetVideo) {
    btnSetVideo.addEventListener('click', () => VideoManager.showEditor());
  }

  /* Also expose for the video placeholder click in edit mode */
  const placeholder = document.getElementById('videoPlaceholder');
  if (placeholder) {
    placeholder.addEventListener('click', () => {
      if (Auth.isLoggedIn()) VideoManager.showEditor();
    });
  }

  /* Patch onAuthSuccess to include new managers */
  const _origFABClick = document.getElementById('fabMain');
  /* We override via event on login form — listen for custom event */
  document.addEventListener('crestron:auth:login', () => applyAdminUI(true));
  document.addEventListener('crestron:auth:logout', () => applyAdminUI(false));
});
