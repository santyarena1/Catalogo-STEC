/* ============================================================
   APPDEMO.JS — Interactive Crestron Home App Demo
   ============================================================ */
'use strict';

const AppDemo = (() => {
  let screen    = 'home';
  let dark      = true;
  let tablet    = false;
  let activeScene = 0;
  let lightVal  = 72;
  let tempVal   = 22;
  let curtainVal = 45;
  let audioOn   = true;
  let _activeRoom = 0;

  const SCENES = [
    { icon: '🌙', name: 'Noche' },
    { icon: '🎬', name: 'Cine' },
    { icon: '🌅', name: 'Mañana' },
    { icon: '🏠', name: 'Casa' },
  ];
  const ROOMS = [
    { name: 'Living',     on: true,  status: '2 activos' },
    { name: 'Dormitorio', on: true,  status: 'Modo noche' },
    { name: 'Cocina',     on: false, status: 'Apagado' },
    { name: 'Estudio',    on: true,  status: '1 activo' },
    { name: 'Jardín',     on: false, status: 'Apagado' },
  ];

  function pad(n) { return String(n).padStart(2, '0'); }
  function now() { const t = new Date(); return pad(t.getHours()) + ':' + pad(t.getMinutes()); }

  /* ── Shared partials ── */
  function sb() {
    return `<div class="chapp-sb">
      <span class="chapp-sb-brand">CRESTRON HOME</span>
      <span class="chapp-sb-time">${now()}</span>
    </div>`;
  }

  function nav(active) {
    const items = [
      { ico: '🏠', lbl: 'Inicio',    key: 'home' },
      { ico: '🛋️', lbl: 'Ambientes', key: 'rooms' },
      { ico: '⚙️', lbl: 'Ajustes',   key: 'settings' },
    ];
    return `<div class="chapp-nav">
      ${items.map(it => `<button class="chapp-nav-btn${it.key === active ? ' active' : ''}" onclick="AppDemo.go('${it.key}')">
        <span class="chapp-nav-ico">${it.ico}</span>
        <span class="chapp-nav-lbl">${it.lbl}</span>
      </button>`).join('')}
    </div>`;
  }

  function topbar(title, back) {
    return `<div class="chapp-topbar">
      <button class="chapp-back-btn" onclick="AppDemo.go('${back || 'home'}')">‹</button>
      <span class="chapp-topbar-title">${title}</span>
      <span class="chapp-topbar-more">···</span>
    </div>`;
  }

  /* ── Screens ── */
  function homeHTML() {
    return `<div class="chapp-ui">
      ${sb()}
      <div class="chapp-body">
        <div class="chapp-section-hd">Escenas</div>
        <div class="chapp-scenes-wrap">
          ${SCENES.map((s, i) => `<button class="chapp-scene-pill${i === activeScene ? ' active' : ''}"
            onclick="AppDemo.setScene(${i})">
            ${s.icon} ${s.name}
          </button>`).join('')}
        </div>

        <div class="chapp-section-hd">Ambientes</div>
        <div class="chapp-rooms-list">
          ${ROOMS.map((r, i) => `<button class="chapp-room-row" onclick="AppDemo.goRoom(${i})">
            <span class="chapp-room-dot${r.on ? ' on' : ''}"></span>
            <span class="chapp-room-info">
              <span class="chapp-room-name">${r.name}</span>
              <span class="chapp-room-sub">${r.status}</span>
            </span>
            <span class="chapp-chevron">›</span>
          </button>`).join('')}
        </div>

        <div class="chapp-section-hd">Control rápido</div>
        <div class="chapp-tiles-grid">
          <button class="chapp-tile${lightVal > 0 ? ' on' : ''}" onclick="AppDemo.go('lights')">
            <span class="chapp-tile-ico">💡</span>
            <span class="chapp-tile-val">${lightVal}%</span>
            <span class="chapp-tile-lbl">Iluminación</span>
          </button>
          <button class="chapp-tile on" onclick="AppDemo.go('climate')">
            <span class="chapp-tile-ico">🌡️</span>
            <span class="chapp-tile-val">${tempVal}°C</span>
            <span class="chapp-tile-lbl">Temperatura</span>
          </button>
          <button class="chapp-tile${audioOn ? ' on' : ''}" onclick="AppDemo.go('audio')">
            <span class="chapp-tile-ico">🎵</span>
            <span class="chapp-tile-val">${audioOn ? 'Jazz' : 'Off'}</span>
            <span class="chapp-tile-lbl">Audio</span>
          </button>
          <button class="chapp-tile" onclick="AppDemo.go('shades')">
            <span class="chapp-tile-ico">🪟</span>
            <span class="chapp-tile-val">${curtainVal}%</span>
            <span class="chapp-tile-lbl">Cortinas</span>
          </button>
        </div>

        <div class="chapp-voice-bar">
          <div class="chapp-voice-waves"><b></b><b></b><b></b><b></b><b></b></div>
          <span>"Ok Crestron, ${SCENES[activeScene].name.toLowerCase()}"</span>
        </div>
      </div>
      ${nav('home')}
    </div>`;
  }

  function roomHTML() {
    const room = ROOMS[_activeRoom] || ROOMS[0];
    return `<div class="chapp-ui">
      ${topbar(room.name, 'home')}
      <div class="chapp-body">
        <div class="chapp-room-hero-card">
          <div class="chapp-rh-name">${room.name}</div>
          <div class="chapp-rh-stat">${room.status}</div>
        </div>

        <div class="chapp-section-hd">Acciones rápidas</div>
        <div class="chapp-qa-row">
          <button class="chapp-qa-pill" onclick="this.classList.toggle('active')">⚡ Apagar</button>
          <button class="chapp-qa-pill" onclick="this.classList.toggle('active')">🌙 Relax</button>
          <button class="chapp-qa-pill" onclick="this.classList.toggle('active')">🎬 Cine</button>
          <button class="chapp-qa-pill" onclick="this.classList.toggle('active')">💼 Reunión</button>
        </div>

        <div class="chapp-section-hd">Servicios</div>
        <div class="chapp-svc-grid">
          <button class="chapp-svc-card" onclick="AppDemo.go('lights')">
            <span class="chapp-svc-ico">💡</span>
            <span class="chapp-svc-nm">Luces</span>
            <span class="chapp-svc-stat">${lightVal}%</span>
          </button>
          <button class="chapp-svc-card" onclick="AppDemo.go('climate')">
            <span class="chapp-svc-ico">🌡️</span>
            <span class="chapp-svc-nm">Clima</span>
            <span class="chapp-svc-stat">${tempVal}°C</span>
          </button>
          <button class="chapp-svc-card" onclick="AppDemo.go('shades')">
            <span class="chapp-svc-ico">🪟</span>
            <span class="chapp-svc-nm">Cortinas</span>
            <span class="chapp-svc-stat">${curtainVal}%</span>
          </button>
          <button class="chapp-svc-card" onclick="AppDemo.go('audio')">
            <span class="chapp-svc-ico">🎵</span>
            <span class="chapp-svc-nm">Audio</span>
            <span class="chapp-svc-stat">${audioOn ? 'Jazz' : 'Off'}</span>
          </button>
        </div>
      </div>
      ${nav('rooms')}
    </div>`;
  }

  function lightsHTML() {
    const pct = lightVal;
    const warmHue = Math.round(30 + pct * 0.15);
    const lum = Math.max(15, Math.round(pct * 0.55));
    return `<div class="chapp-ui">
      ${topbar('Luces · Living', 'home')}
      <div class="chapp-body">
        <div class="chapp-ls-pills">
          <button class="chapp-ls-pill${pct === 0 ? ' active' : ''}" onclick="AppDemo.setLight(0)">⬛ Apagado</button>
          <button class="chapp-ls-pill${pct > 0 && pct < 40 ? ' active' : ''}" onclick="AppDemo.setLight(25)">🌑 Suave</button>
          <button class="chapp-ls-pill${pct >= 40 && pct < 80 ? ' active' : ''}" onclick="AppDemo.setLight(60)">🌤 Normal</button>
          <button class="chapp-ls-pill${pct >= 80 ? ' active' : ''}" onclick="AppDemo.setLight(90)">☀️ Brillante</button>
        </div>

        <div class="chapp-slider-wrap">
          <div class="chapp-slider-label">
            Intensidad general
            <span class="chapp-slider-val" id="chappLV">${pct}%</span>
          </div>
          <input type="range" class="chapp-range" min="0" max="100" value="${pct}"
            oninput="document.getElementById('chappLV').textContent=this.value+'%'"
            onchange="AppDemo.setLight(+this.value)">
        </div>

        <div class="chapp-section-hd">Luminarias</div>
        <div class="chapp-light-items">
          <div class="chapp-light-item">
            <div class="chapp-light-dot" style="background:hsl(${warmHue},90%,${lum}%);"></div>
            <div class="chapp-light-info">
              <div class="chapp-light-nm">Techo Living</div>
              <div class="chapp-light-meta">3000K · ${pct}%</div>
            </div>
            <div class="chapp-toggle${pct > 0 ? ' on' : ''}" onclick="this.classList.toggle('on')"></div>
          </div>
          <div class="chapp-light-item">
            <div class="chapp-light-dot" style="background:hsl(20,80%,${Math.max(10, Math.round(pct * 0.3))}%);"></div>
            <div class="chapp-light-info">
              <div class="chapp-light-nm">Lámpara de piso</div>
              <div class="chapp-light-meta">Hue · ${Math.round(pct * 0.28)}%</div>
            </div>
            <div class="chapp-toggle${pct > 0 ? ' on' : ''}" onclick="this.classList.toggle('on')"></div>
          </div>
          <div class="chapp-light-item">
            <div class="chapp-light-dot" style="background:#1a4fa8;"></div>
            <div class="chapp-light-info">
              <div class="chapp-light-nm">Tiras LED</div>
              <div class="chapp-light-meta">Azul · 100%</div>
            </div>
            <div class="chapp-toggle on" onclick="this.classList.toggle('on')"></div>
          </div>
        </div>
      </div>
      ${nav('home')}
    </div>`;
  }

  function climateHTML() {
    const angle = Math.round(((tempVal - 16) / 16) * 270);
    const circ = 2 * Math.PI * 54;
    const dashOffset = circ - (circ * angle / 360);
    return `<div class="chapp-ui">
      ${topbar('Clima · Living', 'home')}
      <div class="chapp-body">
        <div class="chapp-thermo-wrap">
          <div class="chapp-ring">
            <svg class="chapp-ring-svg" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="54" stroke="var(--ca-s2)" stroke-width="10"/>
              <circle cx="60" cy="60" r="54" stroke="var(--ca-accent)" stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="${circ}"
                stroke-dashoffset="${dashOffset}"/>
            </svg>
            <div class="chapp-ring-core">
              <div class="chapp-thermo-temp">${tempVal}°</div>
              <div class="chapp-thermo-sub">Enfriando</div>
            </div>
          </div>
          <div class="chapp-thermo-btns">
            <button class="chapp-adj-btn" onclick="AppDemo.changeTemp(-1)">−</button>
            <button class="chapp-adj-btn" onclick="AppDemo.changeTemp(1)">+</button>
          </div>
        </div>
        <div class="chapp-section-hd">Modo</div>
        <div class="chapp-modes-row">
          <button class="chapp-mode-btn active" onclick="document.querySelectorAll('.chapp-mode-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">❄️ Frío</button>
          <button class="chapp-mode-btn" onclick="document.querySelectorAll('.chapp-mode-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">🔥 Calor</button>
          <button class="chapp-mode-btn" onclick="document.querySelectorAll('.chapp-mode-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">💨 Ventil.</button>
          <button class="chapp-mode-btn" onclick="document.querySelectorAll('.chapp-mode-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">⏸ Off</button>
        </div>
      </div>
      ${nav('home')}
    </div>`;
  }

  function shadesHTML() {
    const pct = curtainVal;
    return `<div class="chapp-ui">
      ${topbar('Cortinas · Living', 'home')}
      <div class="chapp-body">
        <div class="chapp-window-visual">
          <div class="chapp-blind" id="chappBlind" style="height:${pct}%;"></div>
          <div class="chapp-shade-pct" id="chappShadePct">${pct}%</div>
        </div>
        <div class="chapp-slider-wrap">
          <div class="chapp-slider-label">Posición <span class="chapp-slider-val" id="chappCV">${pct}%</span></div>
          <input type="range" class="chapp-range" min="0" max="100" value="${pct}"
            oninput="document.getElementById('chappCV').textContent=this.value+'%';document.getElementById('chappBlind').style.height=this.value+'%';document.getElementById('chappShadePct').textContent=this.value+'%'"
            onchange="AppDemo.setCurtain(+this.value)">
        </div>
        <div class="chapp-shade-btns">
          <button class="chapp-qa-pill" onclick="AppDemo.setCurtain(0)">⬆ Abrir</button>
          <button class="chapp-qa-pill" onclick="AppDemo.setCurtain(50)">⏸ Mitad</button>
          <button class="chapp-qa-pill" onclick="AppDemo.setCurtain(100)">⬇ Cerrar</button>
        </div>
      </div>
      ${nav('home')}
    </div>`;
  }

  function audioHTML() {
    const progress = 40;
    return `<div class="chapp-ui">
      ${topbar('Audio · Living', 'home')}
      <div class="chapp-body">
        <div class="chapp-np-card">
          <div class="chapp-np-art">🎵</div>
          <div>
            <div class="chapp-np-title">Take Five</div>
            <div class="chapp-np-artist">Dave Brubeck Quartet</div>
          </div>
        </div>
        <div class="chapp-progress-wrap">
          <div class="chapp-progress-track"><div class="chapp-progress-fill" style="width:${progress}%"></div></div>
          <div class="chapp-progress-times"><span>1:24</span><span>5:24</span></div>
        </div>
        <div class="chapp-audio-row">
          <button class="chapp-audio-btn">⏮</button>
          <button class="chapp-audio-btn play" onclick="AppDemo.toggleAudio()">${audioOn ? '⏸' : '▶'}</button>
          <button class="chapp-audio-btn">⏭</button>
        </div>
        <div class="chapp-slider-wrap" style="margin-top:4px;">
          <div class="chapp-slider-label">Volumen <span class="chapp-slider-val">65%</span></div>
          <input type="range" class="chapp-range" min="0" max="100" value="65">
        </div>
        <div class="chapp-section-hd">Zonas</div>
        <div class="chapp-zones">
          <div class="chapp-zone on">
            <span class="chapp-zone-dot"></span>
            <span class="chapp-zone-name">Living</span>
            <span class="chapp-zone-vol">🔊 65%</span>
          </div>
          <div class="chapp-zone">
            <span class="chapp-zone-dot"></span>
            <span class="chapp-zone-name">Cocina</span>
            <span class="chapp-zone-vol">—</span>
          </div>
          <div class="chapp-zone on">
            <span class="chapp-zone-dot"></span>
            <span class="chapp-zone-name">Dormitorio</span>
            <span class="chapp-zone-vol">🔊 30%</span>
          </div>
        </div>
      </div>
      ${nav('home')}
    </div>`;
  }

  const BUILDERS = { home: homeHTML, room: roomHTML, lights: lightsHTML, climate: climateHTML, shades: shadesHTML, audio: audioHTML };

  /* ── Render ── */
  function render() {
    const el = document.getElementById('chappScreen');
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.97) translateX(6px)';
    setTimeout(() => {
      el.innerHTML = (BUILDERS[screen] || BUILDERS.home)();
      el.style.transition = 'opacity .18s ease, transform .18s ease';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }, 100);
  }

  /* ── Navigation ── */
  function go(s) {
    if (s === 'rooms') { s = 'room'; }
    screen = s; render();
  }
  function goRoom(idx) { _activeRoom = idx; screen = 'room'; render(); }
  function setScene(i) { activeScene = i; render(); }
  function setLight(v) { lightVal = v; render(); }
  function changeTemp(d) { tempVal = Math.max(16, Math.min(32, tempVal + d)); render(); }
  function setCurtain(v) { curtainVal = v; render(); }
  function toggleAudio() { audioOn = !audioOn; render(); }

  /* ── Device / Theme ── */
  function setDevice(mode) {
    tablet = mode === 'tablet';
    const dev = document.getElementById('chappDevice');
    if (!dev) return;
    dev.classList.toggle('chapp-tablet', tablet);
    document.getElementById('chappBtnPhone')?.classList.toggle('active', !tablet);
    document.getElementById('chappBtnTablet')?.classList.toggle('active', tablet);
  }

  function toggleTheme() {
    dark = !dark;
    const dev = document.getElementById('chappDevice');
    if (!dev) return;
    dev.classList.toggle('chapp-light', !dark);
    const btn = document.getElementById('chappThemeBtn');
    if (btn) btn.textContent = dark ? '🌙 Modo oscuro' : '☀️ Modo claro';
  }

  /* ── Init ── */
  function init() {
    render();
    setInterval(() => {
      const el = document.querySelector('#chappScreen .chapp-sb-time');
      if (el) el.textContent = now();
    }, 30000);
  }

  return { init, go, goRoom, setScene, setLight, changeTemp, setCurtain, toggleAudio, setDevice, toggleTheme };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AppDemo.init);
} else {
  AppDemo.init();
}
