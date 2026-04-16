/* ============================================================
   BLOG.JS — Página completa de blog (blog.html)
   ============================================================ */

'use strict';

const BlogPage = (() => {
  const STORE = 'crestron_blog_posts';

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

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return iso; }
  }

  /* ── State ─────────────────────────────────────────────────── */
  let currentCat = 'all';
  let currentSearch = '';

  /* ── Render grid ───────────────────────────────────────────── */
  function isAdmin() {
    return sessionStorage.getItem('crestron_admin_session') === 'true';
  }

  function renderGrid() {
    const grid = document.getElementById('blogFullGrid');
    if (!grid) return;

    const allPosts = loadPosts();
    const filtered = allPosts.filter(post => {
      const matchCat = currentCat === 'all' || post.category === currentCat;
      const q = currentSearch.toLowerCase();
      const matchSearch = !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div class="blog-empty">No se encontraron artículos para tu búsqueda.</div>';
      return;
    }

    grid.innerHTML = filtered.map(post => `
      <article class="blog-card" data-post-id="${post.id}" style="cursor:pointer;">
        <div class="blog-card-img" style="${post.image ? `background-image:url('${post.image}')` : ''}">
          ${!post.image ? `<div class="blog-img-placeholder">${post.category}</div>` : ''}
        </div>
        <div class="blog-card-body">
          <span class="blog-category-tag">${post.category}</span>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-footer">
            <time class="blog-date">${formatDate(post.date)}</time>
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="btn-read-more" data-id="${post.id}">Leer más →</button>
              ${isAdmin() ? `<button class="btn-blog-edit" data-id="${post.id}" style="background:var(--bg-light);border:1px solid var(--border-med);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">✏️</button><button class="btn-blog-del" data-id="${post.id}" style="background:var(--bg-light);border:1px solid var(--border-med);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">🗑️</button>` : ''}
            </div>
          </div>
        </div>
      </article>`).join('');

    grid.querySelectorAll('.btn-read-more').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openReader(btn.dataset.id); });
    });
    grid.querySelectorAll('.btn-blog-edit').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        /* Use BlogManager.showPostEditor from admin.js if available */
        if (typeof BlogManager !== 'undefined') BlogManager.showPostEditor(btn.dataset.id);
      });
    });
    grid.querySelectorAll('.btn-blog-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('¿Eliminar este artículo?')) {
          const posts = loadPosts().filter(p => p.id !== btn.dataset.id);
          localStorage.setItem(STORE, JSON.stringify(posts));
          renderGrid();
        }
      });
    });
    grid.querySelectorAll('.blog-card').forEach(card => {
      card.addEventListener('click', e => {
        if (!e.target.closest('button')) openReader(card.dataset.postId);
      });
    });
  }

  /* ── Article Reader ────────────────────────────────────────── */
  function openReader(id) {
    const post = loadPosts().find(p => p.id === id);
    if (!post) return;

    const overlay = document.getElementById('articleReaderOverlay');
    const inner = document.getElementById('articleReaderInner');
    if (!overlay || !inner) return;

    inner.innerHTML = `
      <div class="article-reader-header-img" style="${post.image ? `background-image:url('${post.image}');background-size:cover;background-position:center;` : ''}"></div>
      <div class="article-reader-body">
        <span class="article-cat">${post.category}</span>
        <h1>${post.title}</h1>
        <time class="article-date">${formatDate(post.date)}</time>
        <div class="article-content">${post.content}</div>
      </div>`;

    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeReader() {
    const overlay = document.getElementById('articleReaderOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ── Filters ───────────────────────────────────────────────── */
  function initFilters() {
    /* Category buttons */
    document.querySelectorAll('.blog-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.blog-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCat = btn.dataset.cat;
        renderGrid();
      });
    });

    /* Search input */
    const searchEl = document.getElementById('blogSearch');
    if (searchEl) {
      let debounce;
      searchEl.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          currentSearch = searchEl.value.trim();
          renderGrid();
        }, 250);
      });
    }

    /* Close button */
    document.getElementById('articleCloseBtn')?.addEventListener('click', closeReader);

    /* Click outside reader inner closes it */
    document.getElementById('articleReaderOverlay')?.addEventListener('click', e => {
      if (e.target === document.getElementById('articleReaderOverlay')) closeReader();
    });

    /* Escape key */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeReader();
    });
  }

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    initFilters();
    renderGrid();
  }

  return { init, renderGrid };
})();

/* Run when DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', BlogPage.init);
} else {
  BlogPage.init();
}
