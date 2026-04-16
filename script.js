/* ============================================================
   CRESTRON HOME ARGENTINA — script.js
   ============================================================ */

'use strict';

/* ── MARKETPLACE CONFIG ─────────────────────────────────────── */
/* Cuando el marketplace esté online, reemplazá '#' por la URL real */
const MARKETPLACE_URL   = '#';  /* ej: 'https://marketplace.crestronhome.com.ar' */
const MARKETPLACE_LOGIN = MARKETPLACE_URL === '#' ? '#' : MARKETPLACE_URL + '/login';
const MARKETPLACE_REG   = MARKETPLACE_URL === '#' ? '#' : MARKETPLACE_URL + '/register';

/* Aplica las URLs a los botones de auth */
(function initAuthLinks() {
  document.querySelectorAll('.btn-nav-login').forEach(el  => el.href = MARKETPLACE_LOGIN);
  document.querySelectorAll('.btn-nav-register').forEach(el => el.href = MARKETPLACE_REG);

  /* Si el marketplace aún no existe, mostramos tooltip y prevenimos navegación */
  if (MARKETPLACE_URL === '#') {
    const comingSoon = document.createElement('div');
    comingSoon.id = 'coming-soon-toast';
    comingSoon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Marketplace <strong>próximamente</strong> disponible</span>
    `;
    document.body.appendChild(comingSoon);

    function showToast() {
      comingSoon.classList.add('show');
      clearTimeout(comingSoon._t);
      comingSoon._t = setTimeout(() => comingSoon.classList.remove('show'), 2800);
    }

    document.querySelectorAll('.btn-nav-login, .btn-nav-register').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); showToast(); });
    });
  }
})();

/* ── PRODUCTS DATA ──────────────────────────────────────────── */
const PRODUCTS = [
  // PROCESADORES
  {
    model: 'CP4-R', name: 'Control Procesador 4',
    category: 'procesadores', catLabel: 'Procesadores',
    desc: 'Procesador central de alto rendimiento para sistemas residenciales avanzados. 4 puertos RS-232, IR, relay e I/O digital. El cerebro de Crestron Home.',
    icon: '⚙️'
  },
  {
    model: 'MC4-R', name: 'Media Controller 4',
    category: 'procesadores', catLabel: 'Procesadores',
    desc: 'Controlador multimedia integrado con control de AV nativo. Ideal para sistemas de mediana escala con distribución de audio y video.',
    icon: '⚙️'
  },
  {
    model: 'PC4-R', name: 'Pyng Controller 4',
    category: 'procesadores', catLabel: 'Procesadores',
    desc: 'Procesador dedicado para la plataforma Crestron Home. Configuración simplificada con la app Crestron Home. Plug-and-play certificado.',
    icon: '⚙️'
  },
  {
    model: 'RMC4', name: 'Room Media Controller 4',
    category: 'procesadores', catLabel: 'Procesadores',
    desc: 'Controlador de habitación con audio y video integrados. Solución todo-en-uno para dormitorios o ambientes secundarios.',
    icon: '⚙️'
  },

  // PANTALLAS
  {
    model: 'TSW-770-B-S', name: 'Touch Screen 7" Negro',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'Pantalla táctil de 7 pulgadas con marco negro satinado. Interfaz intuitiva para control de iluminación, audio, clima y más.',
    icon: '📱'
  },
  {
    model: 'TSW-770-W-S', name: 'Touch Screen 7" Blanco',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'Pantalla táctil de 7 pulgadas con marco blanco. Diseño elegante para montaje en pared en interiores claros.',
    icon: '📱'
  },
  {
    model: 'TS-770-B-S', name: 'Touch Screen 7" Slim Negro',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'Versión slim de la TSW-770. Perfil ultra delgado con acabado premium para instalaciones de alta gama.',
    icon: '📱'
  },
  {
    model: 'TSW-870-B-S', name: 'Touch Screen 8" Negro',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'Pantalla táctil de 8 pulgadas con pantalla OLED. Perfecta como controlador central en living, cocina o escritorio.',
    icon: '📱'
  },
  {
    model: 'TSW-1070-B-S', name: 'Touch Screen 10" Negro',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'Gran pantalla táctil de 10 pulgadas. Experiencia de control inmersiva con visualización completa del estado del hogar.',
    icon: '📱'
  },
  {
    model: 'TSW-1070-W-S', name: 'Touch Screen 10" Blanco',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'Touch screen de 10 pulgadas en blanco. Elegancia y funcionalidad para ambientes de diseño contemporáneo.',
    icon: '📱'
  },
  {
    model: 'TS-1070-B-S', name: 'Touch Screen 10" Slim Negro',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'El Touch Screen más delgado de Crestron. 10 pulgadas de control puro en un perfil imposiblemente fino.',
    icon: '📱'
  },
  {
    model: 'TS-1070-W-S', name: 'Touch Screen 10" Slim Blanco',
    category: 'pantallas', catLabel: 'Pantallas',
    desc: 'Versión blanca del TS-1070 Slim. Integración perfecta en interiores nórdicos y minimalistas.',
    icon: '📱'
  },

  // KEYPADS CAMEO
  {
    model: 'CM2-DIMEX-W-S', name: 'Cameo Dimmer Blanco',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Keypad dimmer de la línea Cameo en blanco. Control de intensidad táctil con retroiluminación LED suave.',
    icon: '🎛️'
  },
  {
    model: 'CM2-DIMUEX-W-S', name: 'Cameo Dimmer Universal Blanco',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Dimmer universal Cameo. Compatible con cargas LED, CFL e incandescentes. Diseño elegante para cualquier estilo interior.',
    icon: '🎛️'
  },
  {
    model: 'CM2-SWEX-W-S', name: 'Cameo Switch Blanco',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Switch de la línea Cameo. Control on/off con indicador LED de estado. Acabado mate premium.',
    icon: '🎛️'
  },
  {
    model: 'CM2-KPEX-W-S', name: 'Cameo Keypad Blanco',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Keypad de escenas Cameo con múltiples botones programables. Activa escenas completas con un solo toque.',
    icon: '🎛️'
  },

  // KEYPADS HORIZON
  {
    model: 'HZ2-DIMEX', name: 'Horizon Dimmer',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Dimmer de la colección Horizon de alta gama. Diseño ultrafino con control de carga inteligente y retroiluminación personalizable.',
    icon: '🎛️'
  },
  {
    model: 'HZ2-DIMUEX', name: 'Horizon Dimmer Universal',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Dimmer universal Horizon para todas las tecnologías de iluminación actuales. Máxima compatibilidad con cargas LED.',
    icon: '🎛️'
  },
  {
    model: 'HZ2-DIMLVEX', name: 'Horizon Dimmer Low Voltage',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Dimmer especializado para cargas de bajo voltaje. Perfecto para tiras LED 12/24V y luminarias de diseño.',
    icon: '🎛️'
  },
  {
    model: 'HZ2-SWEX', name: 'Horizon Switch',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Switch on/off de la colección Horizon. Acabado premium con indicador de estado integrado y botones capacitivos.',
    icon: '🎛️'
  },
  {
    model: 'HZ2-KPEX', name: 'Horizon Keypad',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Keypad de escenas Horizon con botones capacitivos y retroiluminación RGB personalizable por ambiente y escena.',
    icon: '🎛️'
  },
  {
    model: 'HZ2-KPCN-W', name: 'Horizon Keypad Blanco',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Variante blanca del Horizon Keypad. Integración elegante en interiores contemporáneos de color claro.',
    icon: '🎛️'
  },

  // REMOTOS
  {
    model: 'HR-CV-MINI', name: 'Remote Control Mini',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Control remoto compacto y recargable. Acceso rápido a tus escenas favoritas desde cualquier rincón del hogar.',
    icon: '📡'
  },
  {
    model: 'HR-CV-2', name: 'Remote Control Classic',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Control remoto recargable con pantalla OLED. Control total del hogar desde el sillón: luz, clima, audio y más.',
    icon: '📡'
  },
  {
    model: 'HR-150', name: 'Remote Control HR-150',
    category: 'keypads', catLabel: 'Keypads',
    desc: 'Control remoto IR/RF de alto rendimiento. Compatible con todos los dispositivos de entretenimiento y sistemas Crestron.',
    icon: '📡'
  },

  // AUDIO
  {
    model: 'DM-NAX-8ZSA', name: 'NAX 8 Zonas Amplificado',
    category: 'audio', catLabel: 'Audio',
    desc: 'Amplificador multiroom de 8 zonas con streaming integrado. Apple Music, Spotify, Tidal y fuentes locales. La solución completa para audio residencial.',
    icon: '🔊'
  },
  {
    model: 'DM-NAX-4ZSP', name: 'NAX 4 Zonas Pre-amplificado',
    category: 'audio', catLabel: 'Audio',
    desc: 'Preamplificador de 4 zonas para integración con amplificadores externos de alta fidelidad. Máxima calidad de audio sin compromisos.',
    icon: '🔊'
  },
  {
    model: 'DM-NAX-4ZSA-50', name: 'NAX 4 Zonas 50W/Canal',
    category: 'audio', catLabel: 'Audio',
    desc: 'Amplificador de 4 zonas con 50W por canal. Potencia suficiente para cualquier instalación residencial estándar.',
    icon: '🔊'
  },
  {
    model: 'DM-NAX-AMP-X300', name: 'NAX Amplificador X300',
    category: 'audio', catLabel: 'Audio',
    desc: 'Amplificador de potencia de 300W por canal para zonas exigentes. Sonido de referencia para living y home theater.',
    icon: '🔊'
  },
  {
    model: 'DM-NAX-16AIN', name: 'NAX 16 Entradas Analógicas',
    category: 'audio', catLabel: 'Audio',
    desc: 'Módulo de 16 entradas analógicas para integrar fuentes locales: tocadiscos, CD, consolas y más al sistema NAX.',
    icon: '🔊'
  },
  {
    model: 'DM-NAX-BTIO-1G', name: 'NAX Bluetooth IO',
    category: 'audio', catLabel: 'Audio',
    desc: 'Módulo Bluetooth aptX para conectar smartphones y tablets directamente al sistema de audio Crestron Home.',
    icon: '🔊'
  },

  // ALTAVOCES
  {
    model: 'SAROS-IC6T-B-8', name: 'Saros IC6T In-Ceiling 6.5"',
    category: 'speakers', catLabel: 'Altavoces',
    desc: 'Altavoz empotrable en techo de 6.5" con tweeter orientable. Sonido natural y envolvente. Instalación discreta e invisible.',
    icon: '🔈'
  },
  {
    model: 'SAROS-IW6T-B-8', name: 'Saros IW6T In-Wall 6.5"',
    category: 'speakers', catLabel: 'Altavoces',
    desc: 'Altavoz empotrable en pared de 6.5" con tweeter orientable. Ideal para home theater distribuido y audio en living.',
    icon: '🔈'
  },
  {
    model: 'ASPIRE-IC8DT-W-T', name: 'Aspire IC8DT In-Ceiling 8"',
    category: 'speakers', catLabel: 'Altavoces',
    desc: 'Altavoz de techo de 8" con doble tweeter. Cobertura de 120° para espacios grandes: living, comedor, terraza cubierta.',
    icon: '🔈'
  },
  {
    model: 'ASPIRE-IC6T-W-T', name: 'Aspire IC6T In-Ceiling 6"',
    category: 'speakers', catLabel: 'Altavoces',
    desc: 'Altavoz de techo de 6" para ambientes de tamaño estándar: dormitorios, oficinas, pasillos. Instalación limpia y discreta.',
    icon: '🔈'
  },

  // VIDEO
  {
    model: 'DM-NVX-350', name: 'NVX Encoder/Decoder 4K60',
    category: 'video', catLabel: 'Video',
    desc: 'Codificador/decodificador de video 4K60 4:4:4 sobre red IP estándar. El futuro de la distribución de video residencial.',
    icon: '📺'
  },
  {
    model: 'DM-NVX-352', name: 'NVX E/D Dual 4K60',
    category: 'video', catLabel: 'Video',
    desc: 'Versión dual del NVX-350 con dos puertos HDMI independientes. Ideal para distribución de múltiples fuentes por zona.',
    icon: '📺'
  },
  {
    model: 'DM-NVX-D20', name: 'NVX Decoder HDMI',
    category: 'video', catLabel: 'Video',
    desc: 'Decodificador de red compacto para salidas HDMI individuales. Solución económica para pantallas adicionales.',
    icon: '📺'
  },
  {
    model: 'DM-RMC-4KZ-SCALER-C', name: 'RMC Scaler 4K HDR',
    category: 'video', catLabel: 'Video',
    desc: 'Receptor y escalador de señal 4K HDR con control por Cresnet. Conversión de resoluciones transparente y sin latencia.',
    icon: '📺'
  },

  // CLIMATIZACIÓN
  {
    model: 'CHV-TSTAT-FCU', name: 'Termostato CHV Fan Coil',
    category: 'climatizacion', catLabel: 'Climatización',
    desc: 'Termostato inteligente para unidades fan coil. Control preciso de temperatura por zona con integración nativa Crestron Home.',
    icon: '🌡️'
  },
  {
    model: 'CHV-TSTATEX-FCU', name: 'Termostato CHV Expandido',
    category: 'climatizacion', catLabel: 'Climatización',
    desc: 'Termostato avanzado con control de humedad y modo económico para fan coil. Ideal para proyectos con alta eficiencia energética.',
    icon: '🌡️'
  },
  {
    model: 'DIN-THSTAT', name: 'Termostato DIN Rail',
    category: 'climatizacion', catLabel: 'Climatización',
    desc: 'Termostato montable en riel DIN para instalaciones técnicas centralizadas. Comunicación BACnet y Cresnet.',
    icon: '🌡️'
  },
  {
    model: 'DIN-1TSTAT8', name: 'Controlador DIN 8 Zonas',
    category: 'climatizacion', catLabel: 'Climatización',
    desc: 'Controlador de climatización para hasta 8 zonas independientes en formato DIN. Gestión centralizada y eficiente.',
    icon: '🌡️'
  },

  // SHADING
  {
    model: 'QM-RCABLE', name: 'Quikset Motor con Cable',
    category: 'shading', catLabel: 'Shading',
    desc: 'Motor tubular con cable para persianas roller y cortinas. Instalación directa sin adaptadores adicionales. Silencioso y potente.',
    icon: '🪟'
  },
  {
    model: 'QM-RW', name: 'Quikset Motor Wireless',
    category: 'shading', catLabel: 'Shading',
    desc: 'Motor inalámbrico para cortinas y persianas. Sin cableado de control, ideal para retrofits y ambientes difíciles de cablear.',
    icon: '🪟'
  },
  {
    model: 'QM-VANE', name: 'Quikset Motor Vane',
    category: 'shading', catLabel: 'Shading',
    desc: 'Motor especializado para persianas tipo vane (doble tela) y persianas venecianas motorizadas con control de ángulo.',
    icon: '🪟'
  },

  // SEGURIDAD
  {
    model: 'CLK-YL-NTB620-CR2', name: 'Yale NTB620 Smart Lock',
    category: 'seguridad', catLabel: 'Seguridad',
    desc: 'Cerradura inteligente Yale con teclado numérico retroiluminado. Integración nativa con Crestron Home. Hasta 250 códigos de usuario.',
    icon: '🔒'
  },
  {
    model: 'CLK-YL-YRL226-CR2', name: 'Yale YRL226 Lever Lock',
    category: 'seguridad', catLabel: 'Seguridad',
    desc: 'Cerradura de palanca inteligente Yale. Control de acceso con códigos PIN, tarjetas y app móvil integrada en Crestron Home.',
    icon: '🔒'
  },
  {
    model: '2N-IP-STYLE', name: '2N IP Style Videoportero',
    category: 'seguridad', catLabel: 'Seguridad',
    desc: 'Videoportero IP de diseño premium. Imagen Full HD, audio bidireccional cristalino y control de acceso integrado con Crestron Home.',
    icon: '🔒'
  },
  {
    model: 'MYQ-GATEWAY', name: 'MyQ Gateway',
    category: 'seguridad', catLabel: 'Seguridad',
    desc: 'Gateway para integración de portones de garage LiftMaster y Chamberlain con Crestron Home. Control y estado en tiempo real.',
    icon: '🔒'
  },

  // NETWORKING
  {
    model: 'CEN-SW-POE-5', name: 'Switch PoE 5 Puertos',
    category: 'networking', catLabel: 'Networking',
    desc: 'Switch gestionado de 5 puertos con PoE+ integrado. Alimenta keypads, touch screens y puntos de acceso directamente.',
    icon: '🌐'
  },
  {
    model: 'CEN-GWEXER', name: 'Gateway Inalámbrico Crestron',
    category: 'networking', catLabel: 'Networking',
    desc: 'Gateway para dispositivos inalámbricos Crestron. Conecta keypads y sensores RF al sistema Crestron Home sin cableado.',
    icon: '🌐'
  },
  {
    model: 'PW-2412WU', name: 'Fuente de Alimentación 24V',
    category: 'networking', catLabel: 'Networking',
    desc: 'Fuente de alimentación lineal regulada 24V/12A para sistemas Crestron. Alta estabilidad, bajo ruido. Confiabilidad garantizada.',
    icon: '🌐'
  }
];

/* ── CUSTOM CURSOR (teal) ───────────────────────────────────── */
(function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot     = document.getElementById('cursorDot');
  const outline = document.getElementById('cursorOutline');
  if (!dot || !outline) return;

  let mouseX = 0, mouseY = 0;
  let outlineX = 0, outlineY = 0;
  let animFrame;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  function animateOutline() {
    outlineX += (mouseX - outlineX) * 0.12;
    outlineY += (mouseY - outlineY) * 0.12;
    outline.style.left = outlineX + 'px';
    outline.style.top  = outlineY + 'px';
    animFrame = requestAnimationFrame(animateOutline);
  }
  animateOutline();

  const hoverTargets = 'a, button, .product-card, .solution-card, .pillar-card, .filter-btn, input, select, textarea';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) outline.classList.add('hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) outline.classList.remove('hovering');
  });
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; outline.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; outline.style.opacity = '1'; });
})();

/* ── NAVBAR SCROLL ──────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 20);
    lastY = y;
  }, { passive: true });
})();

/* ── MOBILE MENU ────────────────────────────────────────────── */
(function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('active');
    });
  });
})();

/* ── SMOOTH SCROLL ──────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── SCROLL REVEAL ──────────────────────────────────────────── */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
})();

/* ── PRODUCT DETAIL MODAL ───────────────────────────────────── */
const CAT_GRADIENTS = {
  procesadores:  'linear-gradient(135deg,#071525 0%,#1a3050 100%)',
  pantallas:     'linear-gradient(135deg,#0d2240 0%,#1a4060 100%)',
  keypads:       'linear-gradient(135deg,#1a2a3a 0%,#2d4a6a 100%)',
  audio:         'linear-gradient(135deg,#0a1520 0%,#1a4060 100%)',
  speakers:      'linear-gradient(135deg,#101825 0%,#1e3550 100%)',
  video:         'linear-gradient(135deg,#0d1a2a 0%,#001a3a 100%)',
  climatizacion: 'linear-gradient(135deg,#0a1f35 0%,#0a3550 100%)',
  shading:       'linear-gradient(135deg,#1a1a2a 0%,#2a3a50 100%)',
  seguridad:     'linear-gradient(135deg,#0f1a28 0%,#1a3040 100%)',
  networking:    'linear-gradient(135deg,#071525 0%,#0a2840 100%)',
};

const PRODUCT_SPECS = {
  procesadores:  [['Sistema Operativo','Crestron Home OS 4'],['Conectividad','Ethernet, RS-232, IR, I/O'],['Control','App iOS & Android'],['Instalación','Rack / Gabinete']],
  pantallas:     [['Pantalla','IPS capacitiva'],['Conectividad','PoE+ (802.3at), Wi-Fi 802.11ac'],['Montaje','Empotrable en pared'],['Control','Táctil multi-touch']],
  keypads:       [['Tecnología','Capacitivo'],['Retroiluminación','LED RGB ajustable'],['Instalación','Estándar 1-2 gang'],['Certificación','CE, FCC, UL']],
  audio:         [['Streaming','Apple Music, Spotify, TIDAL, AirPlay 2'],['Protocolo','DM NAX (AES67 / AV-over-IP)'],['Control','Crestron Home OS 4'],['Alimentación','100–240 V AC']],
  speakers:      [['Instalación','In-ceiling / In-wall'],['Impedancia','8 Ω'],['Cobertura','120°'],['Certificación','CE, UL Listed']],
  video:         [['Resolución','4K60 4:4:4'],['Protocolo','DM NVX (AV-over-IP)'],['Interfaz','HDMI 2.0, Gigabit Ethernet'],['Compresión','VisualEdge HEVC']],
  climatizacion: [['Protocolo','BACnet, Cresnet'],['Control','Crestron Home OS 4'],['Instalación','Pared / Riel DIN'],['Compatibilidad','Fan Coil, Split, VRF']],
  shading:       [['Motor','Tubular silencioso'],['Control','RF inalámbrico / Cresnet'],['Compatibilidad','Roller, Vane, Veneciana'],['Acabado','Compatible telas premium']],
  seguridad:     [['Protocolo','Z-Wave Plus / IP'],['Integración','Crestron Home OS nativo'],['Certificación','UL 294 / ANSI'],['Notificaciones','Push en tiempo real']],
  networking:    [['Estándar','IEEE 802.3at PoE+'],['Gestión','SNMP, Web UI'],['Certificación','CE, FCC, UL'],['Temperatura','0 °C – 45 °C']],
};

function showProductDetail(product) {
  let modal = document.getElementById('productDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'productDetailModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,21,37,0.92);backdrop-filter:blur(14px);z-index:80000;display:none;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto;';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.style.display !== 'none') modal.style.display = 'none'; });
  }

  const grad = CAT_GRADIENTS[product.category] || CAT_GRADIENTS.procesadores;
  const specs = PRODUCT_SPECS[product.category] || [];
  const isAdmin = sessionStorage.getItem('crestron_admin_session') === 'true';

  /* Get images: multi-image takes priority over legacy single image */
  const extra = (() => { try { return JSON.parse(localStorage.getItem('crestron_product_extra') || '{}')[product.model] || { images: [] }; } catch { return { images: [] }; } })();
  const legacyImg = (() => { try { return JSON.parse(localStorage.getItem('crestron_product_imgs') || '{}')[product.model] || ''; } catch { return ''; } })();
  const images = extra.images && extra.images.length ? extra.images : (legacyImg ? [{ url: legacyImg, posX: 50, posY: 50 }] : []);
  let currentImgIdx = 0;

  function heroStyle(imgData) {
    if (!imgData) return `background:${grad};`;
    return `background-image:url('${imgData.url}');background-size:cover;background-position:${imgData.posX ?? 50}% ${imgData.posY ?? 50}%;`;
  }

  function buildCarouselDots() {
    if (images.length <= 1) return '';
    return `<div id="pdDots" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:3;">
      ${images.map((_, i) => `<button onclick="pdGoTo(${i})" style="width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;background:${i===0?'#009DC7':'rgba(255,255,255,0.5)'};transition:background .2s;padding:0;"></button>`).join('')}
    </div>`;
  }

  function buildAdminImgControls() {
    if (!isAdmin) return '';
    return `<div id="pdAdminImgTools" style="position:absolute;bottom:48px;right:16px;display:flex;flex-direction:column;gap:6px;z-index:5;">
      <button onclick="pdAddImage()" style="background:rgba(0,157,199,0.9);color:#fff;border:none;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">+ Agregar foto</button>
      ${images.length > 0 ? `<button onclick="pdRemoveImage()" style="background:rgba(220,38,38,0.85);color:#fff;border:none;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">✕ Quitar foto</button>` : ''}
    </div>
    ${images.length > 0 ? `
    <div id="pdPosControls" style="position:absolute;top:12px;left:12px;background:rgba(7,21,37,0.85);border-radius:10px;padding:10px;z-index:5;">
      <div style="font-size:10px;color:rgba(255,255,255,0.7);font-weight:600;margin-bottom:6px;">POSICIÓN</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <label style="font-size:10px;color:rgba(255,255,255,0.7);">X: <input type="range" id="pdPosX" min="0" max="100" value="${images[currentImgIdx]?.posX ?? 50}" style="width:90px;vertical-align:middle;" oninput="pdUpdatePos()"></label>
        <label style="font-size:10px;color:rgba(255,255,255,0.7);">Y: <input type="range" id="pdPosY" min="0" max="100" value="${images[currentImgIdx]?.posY ?? 50}" style="width:90px;vertical-align:middle;" oninput="pdUpdatePos()"></label>
      </div>
    </div>` : ''}`;
  }

  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;width:100%;max-width:760px;margin:auto;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.5);">
      <div id="pdHero" style="height:300px;position:relative;display:flex;align-items:flex-end;padding:24px;${heroStyle(images[0])}">
        ${!images.length ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:5.5rem;opacity:.18;">${product.icon}</div>` : ''}
        <button onclick="document.getElementById('productDetailModal').style.display='none'" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);backdrop-filter:blur(6px);border:1.5px solid rgba(255,255,255,0.25);border-radius:50%;width:40px;height:40px;cursor:pointer;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;">✕</button>
        ${images.length > 1 ? `<button onclick="pdGoTo(currentImgIdx-1)" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.18);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;color:#fff;font-size:18px;">‹</button><button onclick="pdGoTo(currentImgIdx+1)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.18);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;color:#fff;font-size:18px;">›</button>` : ''}
        ${buildCarouselDots()}
        ${buildAdminImgControls()}
        <span style="background:rgba(0,157,199,0.95);color:#fff;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;position:relative;z-index:1;">${product.catLabel}</span>
      </div>
      <div style="padding:32px 36px 40px;">
        <div style="font-size:12px;font-weight:700;color:#8096A8;letter-spacing:.09em;text-transform:uppercase;margin-bottom:8px;">${product.model}</div>
        <h2 style="font-size:26px;font-weight:800;color:#0D1B2A;margin-bottom:14px;line-height:1.3;">${product.name}</h2>
        <p style="font-size:15px;color:#4A5E72;line-height:1.78;margin-bottom:28px;">${product.desc}</p>
        ${specs.length ? `
        <div style="background:#F4F7FA;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#8096A8;margin-bottom:14px;">Especificaciones técnicas</div>
          ${specs.map(([k,v]) => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.06);"><span style="font-size:13px;font-weight:600;color:#4A5E72;">${k}</span><span style="font-size:13px;color:#0D1B2A;">${v}</span></div>`).join('')}
        </div>` : ''}
        <div style="background:rgba(0,157,199,0.06);border:1px solid rgba(0,157,199,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#4A5E72;line-height:1.5;">
          <strong style="color:#009DC7;">Instalación certificada</strong> — Todos los productos Crestron Home son instalados por integradores certificados. Consultá con nuestros especialistas para un presupuesto.
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <a href="#contacto" id="pdConsultBtn" style="display:inline-flex;align-items:center;gap:8px;padding:13px 26px;background:#009DC7;color:#fff;border-radius:100px;font-size:14px;font-weight:700;text-decoration:none;">Consultar sobre este producto →</a>
          <a href="catalogo.html" style="display:inline-flex;align-items:center;gap:8px;padding:13px 20px;background:#F4F7FA;border-radius:100px;font-size:14px;color:#4A5E72;text-decoration:none;">Ver catálogo interactivo 📖</a>
          <button onclick="document.getElementById('productDetailModal').style.display='none'" style="padding:13px 18px;background:#F4F7FA;border:none;border-radius:100px;font-size:14px;color:#4A5E72;cursor:pointer;font-family:inherit;">Cerrar</button>
        </div>
      </div>
    </div>`;

  /* Carousel functions exposed to onclick */
  window.currentImgIdx = currentImgIdx;
  window.pdGoTo = function(i) {
    if (!images.length) return;
    window.currentImgIdx = ((i % images.length) + images.length) % images.length;
    const hero = document.getElementById('pdHero');
    if (hero) hero.style.cssText = `height:300px;position:relative;display:flex;align-items:flex-end;padding:24px;${heroStyle(images[window.currentImgIdx])}`;
    document.querySelectorAll('#pdDots button').forEach((d, di) => d.style.background = di === window.currentImgIdx ? '#009DC7' : 'rgba(255,255,255,0.5)');
    const px = document.getElementById('pdPosX');
    const py = document.getElementById('pdPosY');
    if (px) px.value = images[window.currentImgIdx]?.posX ?? 50;
    if (py) py.value = images[window.currentImgIdx]?.posY ?? 50;
  };

  window.pdUpdatePos = function() {
    if (!images.length) return;
    const posX = +document.getElementById('pdPosX').value;
    const posY = +document.getElementById('pdPosY').value;
    const hero = document.getElementById('pdHero');
    if (hero) { hero.style.backgroundPosition = `${posX}% ${posY}%`; }
    images[window.currentImgIdx].posX = posX;
    images[window.currentImgIdx].posY = posY;
    /* Save to localStorage */
    const all = (() => { try { return JSON.parse(localStorage.getItem('crestron_product_extra') || '{}'); } catch { return {}; } })();
    if (!all[product.model]) all[product.model] = { images: [] };
    all[product.model].images = images;
    localStorage.setItem('crestron_product_extra', JSON.stringify(all));
  };

  window.pdAddImage = function() {
    if (typeof ImagePicker !== 'undefined') {
      ImagePicker.open(`Crestron ${product.model} product`, (url) => {
        images.push({ url, posX: 50, posY: 50 });
        const all = (() => { try { return JSON.parse(localStorage.getItem('crestron_product_extra') || '{}'); } catch { return {}; } })();
        if (!all[product.model]) all[product.model] = {};
        all[product.model].images = images;
        localStorage.setItem('crestron_product_extra', JSON.stringify(all));
        showProductDetail(product); /* re-render */
      });
    }
  };

  window.pdRemoveImage = function() {
    if (!images.length) return;
    images.splice(window.currentImgIdx, 1);
    const all = (() => { try { return JSON.parse(localStorage.getItem('crestron_product_extra') || '{}'); } catch { return {}; } })();
    if (!all[product.model]) all[product.model] = {};
    all[product.model].images = images;
    localStorage.setItem('crestron_product_extra', JSON.stringify(all));
    showProductDetail(product);
  };

  modal.style.display = 'flex';

  modal.querySelector('#pdConsultBtn').addEventListener('click', () => {
    modal.style.display = 'none';
    const msg = document.getElementById('mensaje');
    if (msg && !msg.value) msg.value = `Consulta sobre: ${product.model} — ${product.name}`;
    setTimeout(() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }), 100);
  });
}

/* ── Export products for catalog/other pages ─────────────────── */
window.CRESTRON_PRODUCTS = PRODUCTS;

/* ── Get all products (static + custom added by admin) ──────── */
function getAllProducts() {
  try {
    const custom = JSON.parse(localStorage.getItem('crestron_custom_products') || '[]');
    return [...PRODUCTS, ...custom];
  } catch { return PRODUCTS; }
}

/* ── RENDER PRODUCTS ────────────────────────────────────────── */
const PRODUCTS_PER_PAGE = 9;
let currentProductFilter = 'all';
let showingAll = false;

function renderProducts(filter) {
  currentProductFilter = filter;
  showingAll = false;
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productsCount');
  if (!grid) return;

  const all = getAllProducts();
  const filtered = filter === 'all' ? all : all.filter(p => p.category === filter);

  const toShow = showingAll ? filtered : filtered.slice(0, PRODUCTS_PER_PAGE);
  if (countEl) countEl.textContent = filtered.length;

  grid.innerHTML = toShow.map(p => `
    <div class="product-card" data-category="${p.category}" data-model="${p.model}">
      <div class="product-image cat-${p.category}">
        <div class="product-img-icon">${p.icon}</div>
        <div class="product-model-bg">${p.model}</div>
      </div>
      <div class="product-info">
        <span class="product-category-tag">${p.catLabel}${p.custom ? ' <span style="color:var(--accent);font-size:10px;">✦ Personalizado</span>' : ''}</span>
        <div class="product-model">${p.model}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
      </div>
    </div>
  `).join('');

  /* "Ver más" / "Ver menos" button */
  let verMasBtn = document.getElementById('verMasProductos');
  if (!verMasBtn) {
    verMasBtn = document.createElement('div');
    verMasBtn.id = 'verMasProductos';
    verMasBtn.style.cssText = 'grid-column:1/-1;text-align:center;padding:8px 0;';
    grid.parentElement.appendChild(verMasBtn);
  }
  if (filtered.length > PRODUCTS_PER_PAGE) {
    verMasBtn.innerHTML = showingAll
      ? `<button class="filter-btn" id="verMasBtn" style="background:var(--bg-light);">Ver menos ↑</button>`
      : `<button class="filter-btn" id="verMasBtn">Ver los ${filtered.length - PRODUCTS_PER_PAGE} productos restantes ↓</button>`;
    verMasBtn.querySelector('#verMasBtn').addEventListener('click', () => {
      showingAll = !showingAll;
      renderProducts(currentProductFilter);
    });
    verMasBtn.style.display = 'block';
  } else {
    verMasBtn.style.display = 'none';
  }

  /* Stagger animation + click to detail */
  requestAnimationFrame(() => {
    grid.querySelectorAll('.product-card').forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = `opacity 0.35s ease ${i * 0.04}s, transform 0.35s ease ${i * 0.04}s`;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const model = card.dataset.model;
        const product = getAllProducts().find(p => p.model === model);
        if (product) showProductDetail(product);
      });
      requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  });
}

/* ── PRODUCT FILTER ─────────────────────────────────────────── */
(function initFilter() {
  const filterContainer = document.getElementById('catalogFilters');
  if (!filterContainer) return;

  renderProducts('all');

  filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn || btn.id === 'verMasBtn') return;
    filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(btn.dataset.filter);
  });
})();

/* ── CONTACT FORM ───────────────────────────────────────────── */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn-submit');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<span>Enviando...</span>';
    btn.disabled = true;

    /* Simulate send — replace with actual fetch/mailto */
    setTimeout(() => {
      btn.innerHTML = '<span>¡Consulta enviada!</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
      btn.style.background = '#16a34a';

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 4000);
    }, 1200);
  });
})();

/* ── ACTIVE NAV LINK (scroll spy) ───────────────────────────── */
(function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.style.color = 'var(--text-primary)';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();

/* ── PARALLAX HERO ORBS (subtle) ────────────────────────────── */
(function initParallax() {
  const orb1 = document.querySelector('.hero-orb-1');
  const orb2 = document.querySelector('.hero-orb-2');
  if (!orb1 || !orb2) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    orb1.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
    orb2.style.transform = `translate(${-x * 0.3}px, ${-y * 0.3}px)`;
  }, { passive: true });
})();
