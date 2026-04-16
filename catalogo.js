/* ============================================================
   CATALOGO.JS — Catálogo interactivo Crestron Home Argentina
   ============================================================ */

'use strict';

const CatalogApp = (() => {
  const CATALOG_DATA_KEY  = 'crestron_catalog_data';   // {model:{desc,mfrUrl,headerImg}}
  const PRODUCT_EXTRA_KEY = 'crestron_product_extra';   // {model:{images:[{url,posX,posY}]}}
  const PRODUCT_IMGS_KEY  = 'crestron_product_images';  // legacy single image

  /* ── State ─────────────────────────────────────────────────── */
  let allProducts   = [];
  let filteredPages = [];
  let currentSpread = 0;
  let mode          = 'pdf';
  let transitioning = false;
  let editingModel  = null;

  /* ── Storage helpers ───────────────────────────────────────── */
  function loadCatalogData() {
    try { return JSON.parse(localStorage.getItem(CATALOG_DATA_KEY)) || {}; } catch { return {}; }
  }
  function saveCatalogEntry(model, entry) {
    const data = loadCatalogData();
    data[model] = { ...(data[model] || {}), ...entry };
    localStorage.setItem(CATALOG_DATA_KEY, JSON.stringify(data));
  }
  function getCatalogEntry(model) {
    return loadCatalogData()[model] || {};
  }

  function getProductImages(model) {
    try {
      const extra = JSON.parse(localStorage.getItem(PRODUCT_EXTRA_KEY)) || {};
      if (extra[model]?.images?.length) return extra[model].images;
    } catch {}
    try {
      const imgs = JSON.parse(localStorage.getItem(PRODUCT_IMGS_KEY)) || {};
      if (imgs[model]) return [{ url: imgs[model], posX: 50, posY: 50 }];
    } catch {}
    return [];
  }

  function saveProductImage(model, url) {
    try {
      const extra = JSON.parse(localStorage.getItem(PRODUCT_EXTRA_KEY)) || {};
      if (!extra[model]) extra[model] = { images: [] };
      if (!extra[model].images) extra[model].images = [];
      if (extra[model].images.length > 0) {
        extra[model].images[0] = { ...extra[model].images[0], url };
      } else {
        extra[model].images.push({ url, posX: 50, posY: 50 });
      }
      localStorage.setItem(PRODUCT_EXTRA_KEY, JSON.stringify(extra));
    } catch {}
  }

  /* ── Specs table data ──────────────────────────────────────── */
  const SPECS = {
    procesadores:  [['Sistema Operativo','Crestron Home OS 4'],['Conectividad','Ethernet, RS-232, IR, I/O'],['Control','App iOS & Android'],['Instalación','Rack / Gabinete']],
    pantallas:     [['Pantalla','IPS capacitiva'],['Conectividad','PoE+ (802.3at), Wi-Fi 802.11ac'],['Montaje','Empotrable en pared'],['Control','Táctil multi-touch']],
    keypads:       [['Tecnología','Capacitivo'],['Retroiluminación','LED RGB ajustable'],['Instalación','Estándar 1-2 gang'],['Certificación','CE, FCC, UL']],
    audio:         [['Canales','Estéreo / Multi-zona'],['Potencia','Clase D amplificado'],['Conectividad','Dante, AES67, Analógico'],['Control','Crestron Home']],
    iluminacion:   [['Tecnología','Dimmer MOSFET'],['Carga','LED, CFL, Incandescente'],['Instalación','1-gang estándar'],['Protocolo','DALI, DMX, 0-10V']],
    climatizacion: [['Compatibilidad','Splits, VRF, Fan coil'],['Protocolo','BACnet, Modbus'],['Control','Termostato integrado'],['Integración','Crestron Home nativo']],
    seguridad:     [['Tecnología','IP HD, PoE'],['Resolución','1080p / 4K'],['Detección','Movimiento, PIR'],['Integración','NVR compatible']],
    shades:        [['Motor','Silencioso 35dB'],['Control','RF, RS-485'],['Integración','Crestron Home'],['Garantía','5 años']],
    networking:    [['Estándar','IEEE 802.3at PoE+'],['Velocidad','1Gbps / 10Gbps uplink'],['Gestión','Cloud / CLI'],['Capa','L2 / L3']],
  };

  /* ── Build product page HTML ───────────────────────────────── */
  function buildProductPageHTML(product, pageNum, isAdmin) {
    const entry      = getCatalogEntry(product.model);
    const desc       = entry.desc     || product.desc;
    const mfrUrl     = entry.mfrUrl   || '';
    const headerImg  = entry.headerImg || '';
    const prodImages = getProductImages(product.model);
    const prodImg    = prodImages[0]  || null;
    const specs      = SPECS[product.category] || [];
    const today      = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });

    const headerStyle = headerImg
      ? `background-image:url('${headerImg}');background-size:cover;background-position:center;`
      : '';

    const imgContent = prodImg
      ? `<img src="${prodImg.url}" alt="${product.name}" style="object-position:${prodImg.posX ?? 50}% ${prodImg.posY ?? 50}%;">`
      : `<span>${product.icon || '📦'}</span>`;

    const specsRows = specs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');

    const mfrLinkHTML = mfrUrl ? `
      <a href="${mfrUrl}" target="_blank" rel="noopener" class="cat-mfr-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Ver en sitio del fabricante
      </a>` : '';

    const adminBar = isAdmin ? `
      <div class="cat-admin-bar">
        <button class="cat-admin-btn" onclick="CatalogApp.openEditModal('${product.model}')">✏️ Editar</button>
      </div>` : '';

    /* Parse inline images from desc: [[img:URL:left|right|center]] */
    const descImg   = entry.descImg   || '';
    const descImgPos = entry.descImgPos || 'left';
    let descHTML = desc;
    if (descImg) {
      const imgTag = `<img src="${descImg}" class="cat-desc-img ${descImgPos}" alt="">`;
      if (descImgPos === 'left' || descImgPos === 'right') {
        descHTML = imgTag + desc + '<div class="cat-desc-clearfix"></div>';
      } else {
        // center — image above text
        descHTML = imgTag + desc;
      }
    }

    return `
      <div class="cat-product-page">
        <div class="cat-product-header" style="${headerStyle}">
          <div class="cat-product-header-overlay"></div>
          <div class="cat-product-header-text">
            <div class="cat-product-cat-label">${product.catLabel || product.category}</div>
            <div class="cat-product-header-name">${product.name}</div>
            <div class="cat-product-header-model">${product.model}</div>
          </div>
          ${isAdmin ? `<button class="cat-edit-header-btn" onclick="CatalogApp.openEditModal('${product.model}')">✏️ Editar</button>` : ''}
        </div>
        <div class="cat-product-body">
          <div class="cat-product-top-row">
            <div class="cat-product-img-col">
              <div class="cat-product-img-box">${imgContent}</div>
            </div>
            <div class="cat-product-specs-col">
              ${specsRows ? `<table class="cat-specs-table">${specsRows}</table>` : ''}
              ${mfrLinkHTML}
            </div>
          </div>
          <div class="cat-product-desc-row">
            <p class="cat-product-desc">${descHTML}</p>
          </div>
        </div>
        ${adminBar}
        <div class="cat-page-footer">
          <span>Soundtec SRL — Distribuidor Crestron</span>
          <span class="cat-page-footer-center">Crestron Home Argentina</span>
          <span>Pág. ${pageNum} · ${today}</span>
        </div>
      </div>`;
  }

  /* ── Category metadata ─────────────────────────────────────── */
  const CAT_LABELS = {
    procesadores: 'Procesadores', pantallas: 'Pantallas', keypads: 'Keypads & Botones',
    audio: 'Audio & Video', iluminacion: 'Iluminación', climatizacion: 'Climatización',
    seguridad: 'Seguridad & Cámaras', shades: 'Cortinas Motorizadas', networking: 'Redes & Infraestructura',
  };
  const CAT_ICONS = {
    procesadores: '⚙️', pantallas: '📱', keypads: '🔲',
    audio: '🔊', iluminacion: '💡', climatizacion: '🌡️',
    seguridad: '📷', shades: '🪟', networking: '🌐',
  };
  const CAT_DESC = {
    procesadores: 'El cerebro de cada instalación Crestron Home.',
    pantallas: 'Interfaces táctiles para control intuitivo.',
    keypads: 'Teclados elegantes integrados a la arquitectura.',
    audio: 'Distribución de audio y video de alto rendimiento.',
    iluminacion: 'Control de iluminación inteligente y eficiente.',
    climatizacion: 'Clima perfecto en cada ambiente.',
    seguridad: 'Monitoreo y acceso con tecnología IP.',
    shades: 'Cortinas motorizadas silenciosas y precisas.',
    networking: 'Infraestructura de red para instalaciones profesionales.',
  };

  /* ── PDF MODE ──────────────────────────────────────────────── */
  function renderPdf() {
    const container = document.getElementById('catPdfContainer');
    if (!container) return;

    const isAdmin = sessionStorage.getItem('crestron_admin_session') === 'true';

    if (!filteredPages.length) {
      container.innerHTML = '<div class="cat-no-results">No se encontraron productos.</div>';
      updateCounter();
      return;
    }

    /* Group by category preserving order */
    const byCategory = {};
    const catOrder   = [];
    filteredPages.forEach(p => {
      if (!byCategory[p.category]) { byCategory[p.category] = []; catOrder.push(p.category); }
      byCategory[p.category].push(p);
    });

    const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    let html = '';
    let pageNum = 1;

    /* ── Cover ── */
    html += `
      <div class="cat-pdf-page cat-cover-page">
        <div class="cat-pdf-cover">
          <div class="cat-pdf-cover-inner">
            <div class="cat-pdf-cover-tag">Catálogo de Productos</div>
            <h2>Crestron Home<br>Argentina</h2>
            <p>Automatización residencial de nivel profesional.</p>
            <p>Soundtec SRL — Distribuidor oficial</p>
            <div class="cat-pdf-cover-stats">
              <div>
                <div class="cat-pdf-cover-stat-n">${filteredPages.length}</div>
                <div class="cat-pdf-cover-stat-l">Productos</div>
              </div>
              <div>
                <div class="cat-pdf-cover-stat-n">${catOrder.length}</div>
                <div class="cat-pdf-cover-stat-l">Categorías</div>
              </div>
            </div>
          </div>
        </div>
        <div class="cat-page-footer">
          <span>soundtec.com.ar</span>
          <span class="cat-page-footer-center">Crestron Home Argentina</span>
          <span>${today}</span>
        </div>
      </div>`;

    catOrder.forEach(cat => {
      const products = byCategory[cat];

      /* ── Category header page ── */
      html += `
        <div class="cat-pdf-page cat-cat-page">
          <div class="cat-category-header">
            <div class="cat-category-icon">${CAT_ICONS[cat] || '📦'}</div>
            <div>
              <div class="cat-category-header-label">Categoría</div>
              <h3>${CAT_LABELS[cat] || cat}</h3>
              <p>${CAT_DESC[cat] || ''} · ${products.length} producto${products.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div class="cat-page-footer">
            <span>Soundtec SRL — Distribuidor Crestron</span>
            <span class="cat-page-footer-center">Crestron Home Argentina</span>
            <span>${today}</span>
          </div>
        </div>`;

      /* ── Product pages ── */
      products.forEach(product => {
        html += `<div class="cat-pdf-page" data-model="${product.model}">${buildProductPageHTML(product, pageNum++, isAdmin)}</div>`;
      });
    });

    container.innerHTML = html;
    updateCounter();
  }

  /* ── MAGAZINE MODE ─────────────────────────────────────────── */
  function renderSpread(spreadIndex, animate, direction) {
    const left  = document.getElementById('catPageLeft');
    const right = document.getElementById('catPageRight');
    if (!left || !right) return;

    const isAdmin   = sessionStorage.getItem('crestron_admin_session') === 'true';
    const leftIdx   = spreadIndex * 2;
    const rightIdx  = spreadIndex * 2 + 1;
    const leftProd  = filteredPages[leftIdx]  || null;
    const rightProd = filteredPages[rightIdx] || null;

    function setContent() {
      left.innerHTML  = leftProd
        ? buildProductPageHTML(leftProd,  leftIdx + 1, isAdmin)
        : `<div style="height:100%;display:flex;align-items:center;justify-content:center;"></div>`;
      right.innerHTML = rightProd
        ? buildProductPageHTML(rightProd, rightIdx + 1, isAdmin)
        : `<div style="height:100%;display:flex;align-items:center;justify-content:center;"></div>`;
    }

    if (!animate || transitioning) {
      setContent();
      updateNav();
      updateCounter();
      return;
    }

    /* Smooth slide animation — no DOM cloning */
    transitioning = true;
    const spread = document.getElementById('catSpread');
    spread.style.setProperty('--slide-dir', direction === 'next' ? '-30px' : '30px');
    spread.classList.add('transitioning');

    setTimeout(() => {
      setContent();
      updateNav();
      updateCounter();
      /* Force reflow then remove class to animate back in */
      spread.getBoundingClientRect();
      spread.style.setProperty('--slide-dir', direction === 'next' ? '20px' : '-20px');
      spread.classList.remove('transitioning');
      setTimeout(() => { transitioning = false; }, 300);
    }, 280);
  }

  function updateNav() {
    const prevBtn = document.getElementById('catPrevBtn');
    const nextBtn = document.getElementById('catNextBtn');
    const info    = document.getElementById('catNavInfo');
    if (!prevBtn || !nextBtn) return;
    const maxSpread = Math.max(0, Math.ceil(filteredPages.length / 2) - 1);
    prevBtn.disabled = currentSpread <= 0;
    nextBtn.disabled = currentSpread >= maxSpread;
    const l = currentSpread * 2 + 1;
    const r = Math.min(currentSpread * 2 + 2, filteredPages.length);
    info.textContent = filteredPages.length ? `${l}–${r} de ${filteredPages.length}` : 'Sin resultados';
  }

  function updateCounter() {
    const counter = document.getElementById('catPageCounter');
    if (!counter) return;
    if (mode === 'pdf') {
      counter.textContent = `${filteredPages.length} productos`;
    } else {
      const l = currentSpread * 2 + 1;
      const r = Math.min(currentSpread * 2 + 2, filteredPages.length);
      counter.textContent = filteredPages.length ? `${l}–${r} / ${filteredPages.length}` : '0 productos';
    }
  }

  /* ── Mode switch ───────────────────────────────────────────── */
  function setMode(newMode) {
    mode = newMode;
    const pdfEl = document.getElementById('catPdfContainer');
    const magEl = document.getElementById('catMagContainer');
    const btnPdf = document.getElementById('btnModePdf');
    const btnMag = document.getElementById('btnModeMag');
    const printBtn = document.getElementById('catPrintBtn');

    if (mode === 'pdf') {
      pdfEl.style.display = '';
      magEl.style.display = 'none';
      btnPdf.classList.add('active');
      btnMag.classList.remove('active');
      if (printBtn) printBtn.style.display = '';
      renderPdf();
    } else {
      pdfEl.style.display = 'none';
      magEl.style.display = 'flex';
      btnPdf.classList.remove('active');
      btnMag.classList.add('active');
      if (printBtn) printBtn.style.display = 'none';
      renderSpread(currentSpread, false, null);
    }
    updateCounter();
  }

  /* ── Search / Filter ───────────────────────────────────────── */
  function applyFilter(query) {
    const q = (query || '').toLowerCase().trim();
    filteredPages = q
      ? allProducts.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.catLabel || '').toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q)
        )
      : [...allProducts];
    currentSpread = 0;
    if (mode === 'pdf') renderPdf();
    else renderSpread(0, false, null);
  }

  /* ── Edit Modal ────────────────────────────────────────────── */
  function openEditModal(model) {
    editingModel = model;
    const product = allProducts.find(p => p.model === model);
    const entry   = getCatalogEntry(model);
    const prodImg = getProductImages(model)[0];

    document.getElementById('catEditTitle').textContent = `Editar: ${product ? product.name : model}`;
    document.getElementById('catEditDesc').value        = entry.desc      || (product ? product.desc : '');
    document.getElementById('catEditUrl').value         = entry.mfrUrl    || '';
    document.getElementById('catEditHeaderImg').value   = entry.headerImg || '';
    document.getElementById('catEditProdImg').value     = prodImg ? prodImg.url : '';
    document.getElementById('catEditDescImg').value     = entry.descImg   || '';
    document.getElementById('catAiPrompt').value        = '';
    document.getElementById('catAiStatus').style.display = 'none';

    /* Desc image position radio */
    const pos = entry.descImgPos || 'left';
    document.querySelectorAll('input[name="catDescImgPos"]').forEach(r => { r.checked = r.value === pos; });

    /* Image previews */
    document.getElementById('catHeaderImgPreview').innerHTML = entry.headerImg
      ? `<img src="${entry.headerImg}">` : '';
    document.getElementById('catProdImgPreview').innerHTML = prodImg
      ? `<img src="${prodImg.url}">` : '';
    document.getElementById('catDescImgPreview').innerHTML = entry.descImg
      ? `<img src="${entry.descImg}">` : '';

    document.getElementById('catEditOverlay').style.display = 'flex';
  }

  function closeEditModal() {
    document.getElementById('catEditOverlay').style.display = 'none';
    editingModel = null;
  }

  function saveEditModal() {
    if (!editingModel) return;
    const desc       = document.getElementById('catEditDesc').value.trim();
    const mfrUrl     = document.getElementById('catEditUrl').value.trim();
    const headerImg  = document.getElementById('catEditHeaderImg').value.trim();
    const prodImgUrl = document.getElementById('catEditProdImg').value.trim();
    const descImg    = document.getElementById('catEditDescImg').value.trim();
    const descImgPos = document.querySelector('input[name="catDescImgPos"]:checked')?.value || 'left';

    saveCatalogEntry(editingModel, { desc, mfrUrl, headerImg, descImg, descImgPos });
    if (prodImgUrl) saveProductImage(editingModel, prodImgUrl);

    closeEditModal();
    if (mode === 'pdf') renderPdf();
    else renderSpread(currentSpread, false, null);
  }

  /* Live preview helpers */
  function setupImgPreviewInput(inputId, previewId) {
    const input = document.getElementById(inputId);
    const prev  = document.getElementById(previewId);
    if (!input || !prev) return;
    input.addEventListener('input', () => {
      const url = input.value.trim();
      prev.innerHTML = url
        ? `<img src="${url}" onerror="this.parentElement.innerHTML=''">`
        : '';
    });
  }

  /* ── AI Description ────────────────────────────────────────── */
  async function generateDescription() {
    const model   = editingModel;
    const product = allProducts.find(p => p.model === model);
    const hint    = document.getElementById('catAiPrompt').value.trim();
    const status  = document.getElementById('catAiStatus');
    const btn     = document.getElementById('catBtnAi');
    const CFG     = window.APP_CONFIG || {};

    if (!CFG.OPENAI_KEY) { alert('Configurá la clave de OpenAI en config.js'); return; }

    btn.disabled = true;
    status.style.display = 'block';
    status.style.color   = '#6366f1';
    status.textContent   = 'Generando descripción con IA...';

    try {
      const prompt = `Sos un redactor técnico de domótica y automatización residencial.
Escribí una descripción para el catálogo de ventas del producto Crestron "${product?.name || model}" (modelo: ${model}, categoría: ${product?.catLabel || ''}).
${hint ? `Contexto: ${hint}` : ''}
Requisitos: 80-120 palabras, español argentino, destaca beneficios y usos comunes.
Respondé SOLO con el texto, sin comillas ni explicaciones.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CFG.OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 250,
          temperature: 0.7,
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('Sin respuesta');

      document.getElementById('catEditDesc').value = text;
      status.textContent = '✓ Listo. Podés editarlo antes de guardar.';
    } catch (err) {
      status.style.color = '#dc2626';
      status.textContent = `Error: ${err.message}`;
    } finally {
      btn.disabled = false;
    }
  }

  /* ── Image pickers inside modal ────────────────────────────── */
  function setupModalImagePickers() {
    document.getElementById('catPickHeaderBtn')?.addEventListener('click', () => {
      if (typeof ImagePicker === 'undefined') return;
      const product = allProducts.find(p => p.model === editingModel);
      ImagePicker.open(
        product ? `${product.name} Crestron header banner` : editingModel,
        (url) => {
          document.getElementById('catEditHeaderImg').value = url;
          document.getElementById('catHeaderImgPreview').innerHTML = `<img src="${url}">`;
        },
        'Imagen de cabecera del producto',
        'Recomendado: 1400 × 500 px (panorámica)'
      );
    });

    document.getElementById('catPickProdBtn')?.addEventListener('click', () => {
      if (typeof ImagePicker === 'undefined') return;
      const product = allProducts.find(p => p.model === editingModel);
      ImagePicker.open(
        product ? `Crestron ${product.name} product photo` : editingModel,
        (url) => {
          document.getElementById('catEditProdImg').value = url;
          document.getElementById('catProdImgPreview').innerHTML = `<img src="${url}">`;
        },
        'Foto del producto',
        'Recomendado: 800 × 800 px (cuadrado)'
      );
    });

    document.getElementById('catPickDescImgBtn')?.addEventListener('click', () => {
      if (typeof ImagePicker === 'undefined') return;
      const product = allProducts.find(p => p.model === editingModel);
      ImagePicker.open(
        product ? `Crestron ${product.name} installation detail` : editingModel,
        (url) => {
          document.getElementById('catEditDescImg').value = url;
          document.getElementById('catDescImgPreview').innerHTML = `<img src="${url}">`;
        },
        'Imagen en la descripción',
        'Recomendado: 400 × 280 px — aparece junto al texto'
      );
    });

    /* Live preview for desc image URL input */
    setupImgPreviewInput('catEditDescImg', 'catDescImgPreview');
  }

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    if (typeof getAllProducts === 'function') {
      allProducts = getAllProducts();
    } else if (window.CRESTRON_PRODUCTS) {
      allProducts = [...window.CRESTRON_PRODUCTS];
    } else {
      allProducts = [];
    }
    filteredPages = [...allProducts];

    setMode('pdf');

    /* Search */
    const searchEl = document.getElementById('catSearch');
    if (searchEl) {
      let timer;
      searchEl.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => applyFilter(searchEl.value), 240);
      });
    }

    /* Mode toggle */
    document.getElementById('btnModePdf')?.addEventListener('click', () => setMode('pdf'));
    document.getElementById('btnModeMag')?.addEventListener('click', () => setMode('magazine'));

    /* Print */
    document.getElementById('catPrintBtn')?.addEventListener('click', () => window.print());

    /* Magazine nav */
    document.getElementById('catPrevBtn')?.addEventListener('click', () => {
      if (currentSpread > 0 && !transitioning) { currentSpread--; renderSpread(currentSpread, true, 'prev'); }
    });
    document.getElementById('catNextBtn')?.addEventListener('click', () => {
      const max = Math.max(0, Math.ceil(filteredPages.length / 2) - 1);
      if (currentSpread < max && !transitioning) { currentSpread++; renderSpread(currentSpread, true, 'next'); }
    });

    /* Keyboard */
    document.addEventListener('keydown', e => {
      if (mode !== 'magazine' || document.getElementById('catEditOverlay')?.style.display !== 'none') return;
      const max = Math.max(0, Math.ceil(filteredPages.length / 2) - 1);
      if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && currentSpread < max && !transitioning) {
        currentSpread++; renderSpread(currentSpread, true, 'next');
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && currentSpread > 0 && !transitioning) {
        currentSpread--; renderSpread(currentSpread, true, 'prev');
      }
    });

    /* Edit modal events */
    document.getElementById('catEditClose')?.addEventListener('click', closeEditModal);
    document.getElementById('catEditCancel')?.addEventListener('click', closeEditModal);
    document.getElementById('catEditSave')?.addEventListener('click', saveEditModal);
    document.getElementById('catBtnAi')?.addEventListener('click', generateDescription);
    document.getElementById('catEditOverlay')?.addEventListener('click', e => {
      if (e.target.id === 'catEditOverlay') closeEditModal();
    });

    setupImgPreviewInput('catEditHeaderImg', 'catHeaderImgPreview');
    setupImgPreviewInput('catEditProdImg',   'catProdImgPreview');
    setupModalImagePickers();
  }

  /* ── Public API ─────────────────────────────────────────────── */
  return { init, openEditModal };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', CatalogApp.init);
} else {
  CatalogApp.init();
}
