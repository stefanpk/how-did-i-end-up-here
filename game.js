/* ============================================================
   HOW DID I END UP HERE — VHS Edition
   "Nach Hause von der Party kommen" — 3 Tapes, 3 Räusche.
   Three.js r149 (lokal), WebAudio-Synth, VHS-Post-Shader.
   ============================================================ */
'use strict';

// ---------------------------------------------------------- LEVELS
const LEVELS = [
  {
    key: 'weed', channel: 'LEVEL 1 · WEED', tape: 'LEVEL 1/3', clock: [23, 58],
    circle: 'KIFFER-FREUNDESKREIS', drug: 'WEED',
    intro: 'Der Abend beim Kiffer-Freundeskreis war gemütlich. Zu gemütlich. ' +
           'Jetzt schwebt der Asphalt und dein Magen schreibt dir Drohbriefe: MUNCHIES. ' +
           'Sammle Döner, halt die Munchies-Leiste unten — und schweb einfach nach Hause.',
    length: 280, speed: 4.6, fov: 70,
    alienEvery: [5.0, 8.0], alienSpeed: [2.2, 3.2], alienHP: 1, alienDmg: 10,
    maxAliens: 6, alienColor: 0x39ff6a,
    bg: 0x0a140f, fogNear: 18, fogFar: 130,
    fx: { wob: 0.5, wobFreq: 0.8, dbl: 0.0, sat: 1.15, tint: [0.93, 1.05, 0.95], vig: 0.35 },
    timeScale: 0.82, sway: 0.15, jitter: 0, breathe: 4.0,
    rauschLabel: 'MUNCHIES', ufoEvery: 0, jointEvery: 22, hallu: true,
    hint: 'WASD: Lauf Richtung ZUHAUSE-Schild. Döner = Leben. Aliens = abknallen.',
    msgs: [
      'Ein Joint fliegt als Sternschnuppe vorbei. Schön.',
      'Deine Kumpels schreiben: "biste gut heim gekommen??"',
      'Dein Magen knurrt bedrohlich.',
      'War die Laterne schon immer... flüssig?',
      'Du vergisst kurz, wohin du wolltest. Ach ja: HEIM.',
    ],
  },
  {
    key: 'alk', channel: 'LEVEL 2 · ALKOHOL', tape: 'LEVEL 2/3', clock: [1, 34],
    circle: 'PARTY-CLIQUE', drug: 'ALKOHOL',
    intro: 'Der Party-Clique konntest du nicht nein sagen. Sieben Shots später schwankt der Boden. ' +
           'Oder du. Doppelt sehen heißt doppelt zielen. Wasser trinken hilft — kurz. ' +
           'Und pass auf, wo du hintrittst.',
    length: 340, speed: 5.2, fov: 72,
    alienEvery: [4.0, 6.5], alienSpeed: [2.8, 3.9], alienHP: 2, alienDmg: 12,
    maxAliens: 8, alienColor: 0xb04cff,
    bg: 0x0d0a16, fogNear: 16, fogFar: 120,
    fx: { wob: 0.3, wobFreq: 1.4, dbl: 0.6, sat: 1.02, tint: [1.0, 0.97, 1.05], vig: 0.4 },
    timeScale: 1.0, sway: 0.9, jitter: 0, breathe: 0,
    rauschLabel: 'PROMILLE', ufoEvery: 40, jointEvery: 0, hallu: false, stumble: true,
    hint: 'Du schwankst. Wasser-Flaschen senken den Promille-Pegel.',
    msgs: [
      'Der Boden schwankt. Oder du?',
      'Du singst laut. Die Nachbarschaft ist begeistert. Nicht.',
      'STOLPERGEFAHR!',
      'Ein Dönerladen ruft deinen Namen. Vielleicht.',
      'Wie viele Aliens siehst du? Teile durch zwei.',
    ],
  },
  {
    key: 'koks', channel: 'LEVEL 3 · KOKS', tape: 'LEVEL 3/3', clock: [3, 12],
    circle: 'VIP-HINTERZIMMER', drug: 'KOKS',
    intro: 'Das VIP-Hinterzimmer war ein Fehler. Dein Herz spielt Doppel-Bassdrum, ' +
           'die Welt läuft auf 1.5x Speed und der CRASH kommt näher. ' +
           'Erreich dein Bett, BEVOR die Leiste leer ist. Die Aliens sind heute Nacht überall. RENN.',
    length: 400, speed: 7.8, fov: 82,
    alienEvery: [2.4, 4.2], alienSpeed: [3.8, 5.2], alienHP: 2, alienDmg: 15,
    maxAliens: 12, alienColor: 0xff3b3b,
    bg: 0x160a0d, fogNear: 14, fogFar: 115,
    fx: { wob: 0.18, wobFreq: 3.0, dbl: 0.12, sat: 1.2, tint: [1.08, 0.94, 0.95], vig: 0.45 },
    timeScale: 1.15, sway: 0.1, jitter: 1, breathe: 0,
    rauschLabel: 'CRASH IN', crashTime: 105, ufoEvery: 26, jointEvery: 0, hallu: false,
    hint: 'SPRINTE (Shift)! Erreich dein Bett bevor der Crash kommt. Wasser = +Zeit.',
    msgs: [
      'Dein Herz: BUMM. BUMM. BUMM.',
      'Die Aliens sind definitiv echt. Definitiv.',
      'NACH HAUSE. SOFORT. RENN.',
      'Deine Zähne fühlen sich elektrisch an.',
      'Wer hat die Nacht auf Vorspulen gestellt?',
    ],
  },
];

// ---------------------------------------------------------- STATE
let state = 'menu';           // menu | intro | playing | paused | dead | done | win
let levelIdx = 0, L = LEVELS[0];
let scene, camera, renderer, rt, postScene, postCam, postMat;
let gun, muzzle, gunRecoil = 0;
let aliens = [], pickups = [], particles = [], ufos = [], blobs = [], joints = [], loopSounds = [];
let partyLight = null, homeLight = null, moonLight = null, followLight = null;

const P = {
  x: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vz: 0,
  hp: 100, rausch: 0, bob: 0, bobPrev: 0, rollKick: 0, shake: 0,
  ammo: 8, reloading: false, kills: 0, time: 0, dmgTaken: 0,
  clarity: 0, stumbleT: 5, spawnT: 3, msgT: 8, ufoT: 20, jointT: 8,
  heartT: 1, clockSec: 0,
};
let totals = { kills: 0, time: 0, dmg: 0 };
let unlocked = parseInt(localStorage.getItem('hdiuh_unlocked') || '1');

const keys = {};
const $ = (id) => document.getElementById(id);

// ============================================================
//  AUDIO — komplett synthetisiert, keine Dateien
// ============================================================
let AC = null, master = null, noiseBuf = null;
const music = { style: null, next: 0, step: 0, timer: null };

function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume().catch(() => {}); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
function tone(type, freq, t, dur, vol, slideTo) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(Math.max(20, freq), t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(t, dur, vol, filterFreq, q) {
  if (!AC) return;
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = AC.createBiquadFilter(); f.type = 'bandpass';
  f.frequency.value = filterFreq || 1000; f.Q.value = q || 0.8;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + dur + 0.05);
}
const now_ = () => (AC ? AC.currentTime : 0);

const SFX = {
  shoot()   { const t = now_(); noise(t, 0.09, 0.5, 2400, 0.6); tone('square', 190, t, 0.09, 0.28, 55); },
  reload()  { const t = now_(); tone('square', 850, t, 0.03, 0.12); tone('square', 1200, t + 0.16, 0.03, 0.12); },
  empty()   { tone('square', 220, now_(), 0.05, 0.1); },
  hit()     { tone('sawtooth', 320, now_(), 0.06, 0.2, 150); },
  die()     { const t = now_(); tone('sawtooth', 620, t, 0.28, 0.25, 55); noise(t, 0.18, 0.22, 700); },
  pickup()  { const t = now_(); [660, 880, 1320].forEach((f, i) => tone('square', f, t + i * 0.08, 0.07, 0.13)); },
  hurt()    { const t = now_(); noise(t, 0.22, 0.4, 300, 0.5); tone('sine', 110, t, 0.22, 0.32, 50); },
  stumble() { noise(now_(), 0.13, 0.35, 180, 0.5); },
  step()    { noise(now_(), 0.035, 0.05, 500, 1); },
  heart()   { const t = now_(); tone('sine', 58, t, 0.1, 0.5, 38); tone('sine', 52, t + 0.15, 0.09, 0.34, 34); },
  win()     { const t = now_(); [523, 659, 784, 1046].forEach((f, i) => tone('square', f, t + i * 0.13, 0.15, 0.16)); },
  filmriss(){ const t = now_(); tone('sawtooth', 240, t, 1.4, 0.3, 28); noise(t, 1.0, 0.15, 400, 0.4); },
  spawn()   { tone('sine', 900, now_(), 0.2, 0.08, 1600); },
};

function startUfoSound() {
  if (!AC) return null;
  const o = AC.createOscillator(), lfo = AC.createOscillator(), lg = AC.createGain(), g = AC.createGain();
  o.type = 'sine'; o.frequency.value = 420;
  lfo.type = 'sine'; lfo.frequency.value = 6; lg.gain.value = 90;
  lfo.connect(lg); lg.connect(o.frequency);
  g.gain.value = 0.05; o.connect(g); g.connect(master);
  o.start(); lfo.start();
  const h = { stop() { try { g.gain.setTargetAtTime(0.0001, now_(), 0.1); o.stop(now_() + 0.4); lfo.stop(now_() + 0.4); } catch (e) {} } };
  loopSounds.push(h); return h;
}
function stopLoopSounds() { loopSounds.forEach((h) => h.stop()); loopSounds = []; }

// --------- Musik-Sequencer (pro Level ein Style) ----------
function startMusic(style) {
  if (!AC) return;
  music.style = style; music.step = 0; music.next = AC.currentTime + 0.15;
  if (!music.timer) music.timer = setInterval(musicTick, 80);
}
function stopMusic() { music.style = null; }
function stepDur(style) {
  return style === 'weed' ? 60 / 72 / 2 : style === 'alk' ? 60 / 116 / 2 : 60 / 150 / 2;
}
function musicTick() {
  if (!AC || !music.style) return;
  while (music.next < AC.currentTime + 0.25) {
    scheduleStep(music.style, music.step, music.next);
    music.next += stepDur(music.style);
    music.step++;
  }
}
function scheduleStep(style, step, t) {
  const s16 = step % 16, bar = Math.floor(step / 16);
  if (style === 'weed') {
    const roots = [55, 55, 43.65, 49];
    const root = roots[bar % 4];
    if (s16 === 0 || s16 === 8) tone('sine', root, t, 0.5, 0.26);
    if (s16 % 4 === 2) { // offbeat skank
      [4, 4.755, 6].forEach((m) => tone('sawtooth', root * m, t, 0.11, 0.035));
    }
    if (s16 === 12 && bar % 2 === 1) tone('triangle', root * 8, t, 0.4, 0.05, root * 6);
  } else if (style === 'alk') {
    if (s16 % 4 === 0) tone('triangle', s16 % 8 === 0 ? 65.4 : 98, t, 0.22, 0.3);
    const mel = [523, 0, 659, 0, 784, 659, 523, 0, 587, 0, 659, 0, 523, 0, 392, 0];
    if (mel[s16]) tone('square', mel[s16], t, 0.12, 0.06);
    if (s16 % 8 === 4) noise(t, 0.05, 0.08, 4000, 1);
  } else { // koks — techno
    if (s16 % 4 === 0) tone('sine', 130, t, 0.13, 0.55, 40);
    if (s16 % 2 === 0) noise(t, 0.03, 0.07, 7000, 1.5);
    if (s16 % 2 === 1) tone('sawtooth', s16 % 8 === 7 ? 82.4 : 110, t, 0.09, 0.11);
    if (s16 === 14) noise(t, 0.12, 0.1, 2000, 0.8);
  }
}

// ============================================================
//  RENDERER + VHS POST-SHADER
// ============================================================
const canvas = $('c');
renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
camera = new THREE.PerspectiveCamera(70, 1, 0.1, 300);
camera.rotation.order = 'YXZ';

rt = new THREE.WebGLRenderTarget(2, 2);
if (renderer.capabilities.isWebGL2) rt.samples = 4;
postScene = new THREE.Scene();
postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postMat = new THREE.ShaderMaterial({
  depthTest: false, depthWrite: false,
  uniforms: {
    tDiffuse: { value: rt.texture },
    time:    { value: 0 },
    uDouble: { value: 0 },
    uWobAmp: { value: 0.15 }, uWobFreq: { value: 1 }, uVig: { value: 0.35 },
    uPulse:  { value: 0 },    uSat: { value: 1.05 },
    uTint:   { value: new THREE.Vector3(1, 1, 1) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time, uDouble, uWobAmp, uWobFreq, uVig, uPulse, uSat;
    uniform vec3 uTint;
    varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      uv.x += sin(uv.y*6.0 + time*uWobFreq) * uWobAmp * 0.008;
      uv.y += cos(uv.x*5.0 + time*uWobFreq*0.7) * uWobAmp * 0.004;
      uv = (uv - 0.5) * (1.0 - uPulse*0.03) + 0.5;
      vec3 col = texture2D(tDiffuse, uv).rgb;
      if (uDouble > 0.001) {
        vec2 off = vec2(sin(time*1.3), cos(time*0.9)) * uDouble * 0.025;
        vec3 col2 = texture2D(tDiffuse, uv + off).rgb;
        col = mix(col, max(col, col2), 0.5 * min(uDouble*2.0, 1.0));
      }
      col = pow(max(col, 0.0), vec3(1.0/2.2)); // Gamma (linear -> sRGB)
      float g = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(g), col, uSat) * uTint;
      col += uPulse * vec3(0.08, 0.0, 0.02);
      float d = distance(uv, vec2(0.5));
      col *= 1.0 - uVig * smoothstep(0.45, 0.85, d);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

const fx = { wob: 0.15, wobFreq: 1, dbl: 0, sat: 1.05, vig: 0.35, tint: [1, 1, 1], pulse: 0 };

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  if (w < 2 || h < 2) return; // Tab noch nicht sichtbar/vermessen
  const pr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  rt.setSize(Math.max(64, Math.round(w * pr)), Math.max(64, Math.round(h * pr)));
}
window.addEventListener('resize', onResize);
onResize();

// ============================================================
//  TEXTUR-HELFER (Canvas-Texturen, keine Asset-Dateien)
// ============================================================
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'));
  return new THREE.CanvasTexture(c);
}
const texWindows = canvasTex(256, 512, (g) => {
  g.fillStyle = '#0a0b12'; g.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 6; x++) {
    const lit = Math.random() < 0.3;
    const wx = 16 + x * 38, wy = 20 + y * 34;
    g.fillStyle = '#151824'; g.fillRect(wx - 2, wy - 2, 30, 24); // Rahmen
    g.fillStyle = lit ? (Math.random() < 0.5 ? '#ffd98a' : '#8ad4ff') : '#10121c';
    g.globalAlpha = lit ? 0.6 + Math.random() * 0.4 : 1;
    g.fillRect(wx, wy, 26, 20);
    g.globalAlpha = 1;
  }
});
const texPool = canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  r.addColorStop(0, 'rgba(255,220,150,0.55)'); r.addColorStop(1, 'rgba(255,220,150,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
function textTex(text, color) {
  return canvasTex(512, 128, (g) => {
    g.fillStyle = '#050508'; g.fillRect(0, 0, 512, 128);
    g.font = 'bold 72px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = 26;
    g.fillStyle = color; g.fillText(text, 256, 68);
    g.shadowBlur = 0; g.fillText(text, 256, 68);
  });
}

// ============================================================
//  WELT BAUEN
// ============================================================
const MAT = {
  road:  new THREE.MeshStandardMaterial({ color: 0x1b1e28, roughness: 0.95 }),
  walk:  new THREE.MeshStandardMaterial({ color: 0x272b38, roughness: 0.9 }),
  gnd:   new THREE.MeshStandardMaterial({ color: 0x0d0f18, roughness: 1 }),
  dash:  new THREE.MeshBasicMaterial({ color: 0xb8b890 }),
  pole:  new THREE.MeshStandardMaterial({ color: 0x3a3f4c, metalness: 0.7, roughness: 0.35 }),
  lampOn:new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
};

function buildWorld(Lv) {
  aliens = []; pickups = []; particles = []; ufos = []; blobs = []; joints = [];
  scene = new THREE.Scene();
  // bg-Hex ist die gewünschte Bildschirmfarbe — für die Gamma-Stufe des Post-Shaders linearisieren
  const bgCol = new THREE.Color(Lv.bg).convertSRGBToLinear();
  scene.background = bgCol;
  scene.fog = new THREE.Fog(bgCol.getHex(), Lv.fogNear, Lv.fogFar);
  scene.add(camera);

  scene.add(new THREE.HemisphereLight(0x36466e, 0x141821, 0.55));
  moonLight = new THREE.DirectionalLight(0xa9b6ff, 0.45);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.near = 5; moonLight.shadow.camera.far = 160;
  moonLight.shadow.camera.left = -50; moonLight.shadow.camera.right = 50;
  moonLight.shadow.camera.top = 50; moonLight.shadow.camera.bottom = -50;
  moonLight.shadow.bias = -0.0005;
  moonLight.position.set(-25, 55, -30);
  scene.add(moonLight); scene.add(moonLight.target);
  followLight = new THREE.PointLight(0xffd9a0, 0.4, 32);
  followLight.position.set(0, 6, -4); scene.add(followLight);

  const len = Lv.length;

  // Boden / Straße / Gehwege
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(240, len + 160), MAT.gnd);
  gnd.rotation.x = -Math.PI / 2; gnd.position.z = -len / 2; gnd.receiveShadow = true; scene.add(gnd);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(13, len + 90), MAT.road);
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -len / 2 + 5); road.receiveShadow = true; scene.add(road);
  [-8.2, 8.2].forEach((x) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(3.4, len + 90), MAT.walk);
    w.rotation.x = -Math.PI / 2; w.position.set(x, 0.02, -len / 2 + 5); w.receiveShadow = true; scene.add(w);
  });
  // Mittelstreifen
  const dashGeo = new THREE.PlaneGeometry(0.32, 2.4);
  for (let z = 8; z > -len - 20; z -= 8) {
    const d = new THREE.Mesh(dashGeo, MAT.dash);
    d.rotation.x = -Math.PI / 2; d.position.set(0, 0.03, z); scene.add(d);
  }

  // Häuser
  for (let z = 12; z > -len - 40; z -= 14) {
    [-1, 1].forEach((side) => {
      if (Math.random() < 0.12) return;
      const h = 12 + Math.random() * 22;
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(10, h, 12),
        new THREE.MeshStandardMaterial({
          map: texWindows, emissiveMap: texWindows, emissive: 0xffffff, emissiveIntensity: 0.5,
          color: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.15, 0.5 + Math.random() * 0.3),
          roughness: 0.85,
        })
      );
      b.position.set(side * (17 + Math.random() * 5), h / 2, z);
      b.castShadow = true; b.receiveShadow = true;
      scene.add(b);
    });
  }

  // Laternen mit Lichtkegel-Fake
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.2, 16);
  const headGeo = new THREE.SphereGeometry(0.22, 20, 14);
  const poolGeo = new THREE.PlaneGeometry(7, 7);
  let lampSide = 1;
  for (let z = 2; z > -len; z -= 26) {
    lampSide *= -1;
    const x = lampSide * 7.2;
    const pole = new THREE.Mesh(poleGeo, MAT.pole);
    pole.position.set(x, 2.6, z); pole.castShadow = true; scene.add(pole);
    const head = new THREE.Mesh(headGeo, MAT.lampOn);
    head.position.set(x, 5.2, z); scene.add(head);
    const pool = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ map: texPool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.05, z); scene.add(pool);
  }

  // Parkende Autos (weiche, moderne Formen)
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 18);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.9 });
  for (let z = -14; z > -len; z -= 30 + Math.random() * 26) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const car = new THREE.Group();
    const col = new THREE.Color().setHSL(Math.random(), 0.55, 0.38);
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 28, 20),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.6, roughness: 0.3 })
    );
    body.scale.set(0.95, 0.5, 2.1); body.position.y = 0.55; body.castShadow = true;
    const cabin = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0x10131c, metalness: 0.3, roughness: 0.12 })
    );
    cabin.scale.set(0.72, 0.42, 1.15); cabin.position.set(0, 0.92, -0.15); cabin.castShadow = true;
    car.add(body, cabin);
    [[-0.82, 1.25], [0.82, 1.25], [-0.82, -1.25], [0.82, -1.25]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, 0.28, wz);
      car.add(wheel);
    });
    car.position.set(side * 5.6, 0, z);
    scene.add(car);
  }

  // Sterne + Mond
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 60;
    starPos[i * 3] = Math.cos(a) * r;
    starPos[i * 3 + 1] = 20 + Math.random() * 120;
    starPos[i * 3 + 2] = -len / 2 + (Math.random() - 0.5) * 300;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xccccff, size: 0.7, sizeAttenuation: false })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 32, 24), new THREE.MeshBasicMaterial({ color: 0xf5f0d8 }));
  moon.position.set(-55, 75, -len - 80); scene.add(moon);

  // Party hinter dir
  const club = new THREE.Mesh(new THREE.BoxGeometry(26, 12, 8), new THREE.MeshStandardMaterial({ color: 0x1b1d2a, roughness: 0.8 }));
  club.position.set(0, 6, 20); club.castShadow = true; scene.add(club);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ map: textTex('PARTY', '#ff44dd'), transparent: false }));
  sign.position.set(0, 7, 15.9); sign.rotation.y = Math.PI; scene.add(sign);
  partyLight = new THREE.PointLight(0xff44dd, 1.4, 40);
  partyLight.position.set(0, 5, 14); scene.add(partyLight);

  // ZUHAUSE
  const home = new THREE.Group();
  const pillarG = new THREE.BoxGeometry(0.9, 5.4, 0.9);
  const pillarM = new THREE.MeshStandardMaterial({ color: 0x4a3d52, roughness: 0.7 });
  [-2.1, 2.1].forEach((x) => { const p = new THREE.Mesh(pillarG, pillarM); p.position.set(x, 2.7, 0); p.castShadow = true; home.add(p); });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 0.9), pillarM);
  lintel.position.y = 5.4; home.add(lintel);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.6), new THREE.MeshBasicMaterial({ color: 0xffc060 }));
  door.position.set(0, 2.4, 0.05); home.add(door);
  const homeSign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.8), new THREE.MeshBasicMaterial({ map: textTex('ZUHAUSE', '#ffd050') }));
  homeSign.position.set(0, 6.8, 0.2); home.add(homeSign);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 40, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffc060, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  beam.position.y = 20; home.add(beam);
  homeLight = new THREE.PointLight(0xffb050, 1.6, 30);
  homeLight.position.set(0, 3, 2); home.add(homeLight);
  home.position.set(0, 0, -len); scene.add(home);

  // Weed-Level: Halluzinations-Blobs
  if (Lv.hallu) {
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.6 + Math.random() * 0.9, 24, 18),
        new THREE.MeshBasicMaterial({
          color: [0xff66cc, 0x66ffcc, 0x66ccff][i % 3],
          transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      b.position.set((Math.random() - 0.5) * 16, 1.5 + Math.random() * 5, -20 - Math.random() * (len - 40));
      b.userData = { ph: Math.random() * 6, y0: b.position.y, x0: b.position.x };
      scene.add(b); blobs.push(b);
    }
  }

  // Pickups verteilen
  for (let z = -35; z > -len + 18; z -= 42 + Math.random() * 26) {
    spawnPickup(Math.random() < 0.55 ? 'doener' : 'wasser', (Math.random() - 0.5) * 11, z - Math.random() * 10);
  }
}

// ---------------------------------------------------------- PICKUPS
function spawnPickup(type, x, z) {
  const g = new THREE.Group();
  if (type === 'doener') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0xc98b4b, emissive: 0x552200, emissiveIntensity: 0.4, roughness: 0.6 }));
    cone.rotation.z = Math.PI; cone.position.y = 1.0; g.add(cone);
    const salad = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0x4faa3f, roughness: 0.7 }));
    salad.position.y = 1.42; g.add(salad);
  } else {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.55, 18), new THREE.MeshStandardMaterial({ color: 0x66bbff, emissive: 0x1144aa, emissiveIntensity: 0.45, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.1 }));
    bottle.position.y = 1.1; g.add(bottle);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    cap.position.y = 1.42; g.add(cap);
  }
  const ring = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({ map: texPool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: type === 'doener' ? 0xffcc44 : 0x44aaff })
  );
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  g.position.set(x, 0, z);
  g.userData = { type, ph: Math.random() * 6 };
  scene.add(g); pickups.push(g);
}

// ---------------------------------------------------------- ALIENS
function spawnAlien(nearX, nearZ) {
  if (aliens.length >= L.maxAliens) return;
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: L.alienColor, emissive: L.alienColor, emissiveIntensity: 0.35, roughness: 0.45 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 8, 24), bodyMat);
  body.position.y = 0.9; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), bodyMat);
  head.scale.set(1, 1.3, 0.95); head.position.y = 1.72; head.castShadow = true; g.add(head);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.15 });
  [-0.13, 0.13].forEach((x) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), eyeMat);
    e.scale.set(1, 1.6, 0.6); e.position.set(x, 1.78, 0.24); g.add(e);
  });
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 6, 14), bodyMat);
    arm.position.set(s * 0.45, 1.0, 0.1); arm.rotation.z = s * 2.5; arm.castShadow = true; g.add(arm);
  });
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8),
    new THREE.MeshBasicMaterial({ map: texPool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: L.alienColor })
  );
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05; g.add(glow);

  let x, z;
  if (nearX !== undefined) { x = nearX + (Math.random() - 0.5) * 4; z = nearZ + (Math.random() - 0.5) * 4; }
  else {
    x = (Math.random() < 0.5 ? -1 : 1) * (11 + Math.random() * 5);
    z = P.z - 22 - Math.random() * 35;
    if (L.key === 'koks' && Math.random() < 0.25) z = P.z + 12 + Math.random() * 8; // Paranoia: auch von hinten
  }
  g.position.set(x, 0, z);
  const a = {
    g, bodyMat, hp: L.alienHP, cd: 0, flash: 0,
    speed: L.alienSpeed[0] + Math.random() * (L.alienSpeed[1] - L.alienSpeed[0]),
    ph: Math.random() * 6,
  };
  g.traverse((m) => { m.userData.alienRef = a; });
  scene.add(g); aliens.push(a);
  SFX.spawn();
}
function killAlien(a, silent) {
  a.g.parent && scene.remove(a.g);
  aliens = aliens.filter((x) => x !== a);
  if (!silent) {
    burst(a.g.position.clone().setY(1.2), L.alienColor, 26);
    SFX.die(); P.kills++;
  }
}

// ---------------------------------------------------------- PARTIKEL
function burst(pos, color, n) {
  const geo = new THREE.BufferGeometry();
  const posArr = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) {
    posArr[i * 3] = pos.x; posArr[i * 3 + 1] = pos.y; posArr[i * 3 + 2] = pos.z;
    vel.push(new THREE.Vector3((Math.random() - 0.5) * 7, Math.random() * 6, (Math.random() - 0.5) * 7));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.16, transparent: true, opacity: 1 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  particles.push({ pts, vel, life: 0.7, max: 0.7 });
}

// ---------------------------------------------------------- UFO
function spawnUfo() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 0.6, 36), new THREE.MeshStandardMaterial({ color: 0x8890a8, emissive: 0x222833, emissiveIntensity: 0.6, metalness: 0.85, roughness: 0.25 }));
  body.castShadow = true; g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 18), new THREE.MeshStandardMaterial({ color: 0x66ffee, emissive: 0x22aa99, emissiveIntensity: 0.8, transparent: true, opacity: 0.8, roughness: 0.1 }));
  dome.position.y = 0.7; g.add(dome);
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff66cc }));
    const a = (i / 6) * Math.PI * 2;
    l.position.set(Math.cos(a) * 2.7, -0.15, Math.sin(a) * 2.7); g.add(l);
  }
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 3.4, 16, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x88ffee, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  beam.position.y = -8.3; g.add(beam);
  const dir = Math.random() < 0.5 ? 1 : -1;
  g.position.set(-dir * 48, 16, P.z - 30);
  scene.add(g);
  ufos.push({ g, beam, vx: dir * 12, dropped: false, snd: startUfoSound(), t: 0 });
}

// ---------------------------------------------------------- JOINT-STERNSCHNUPPE (Weed)
function spawnJoint() {
  const g = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 1.5, 14), new THREE.MeshBasicMaterial({ color: 0xf5f0e0 }));
  paper.rotation.z = Math.PI / 2; g.add(paper);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff7722 }));
  tip.position.x = 0.8; g.add(tip);
  g.position.set(-42, 12 + Math.random() * 9, P.z - 30 - Math.random() * 20);
  g.rotation.z = -0.35;
  scene.add(g);
  joints.push({ g, vx: 7 + Math.random() * 4 });
}

// ============================================================
//  WAFFE
// ============================================================
function buildGun() {
  gun = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2d36, metalness: 0.8, roughness: 0.3 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.46, 18), dark);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.02, -0.28); gun.add(barrel);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.22), dark);
  body.position.set(0, -0.03, -0.02); gun.add(body);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.19, 0.1), dark);
  grip.position.set(0, -0.17, 0.04); grip.rotation.x = 0.35; gun.add(grip);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.018, 0.3), new THREE.MeshBasicMaterial({ color: 0x66e0ff }));
  stripe.position.set(0, 0.062, -0.2); gun.add(stripe);
  muzzle = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshBasicMaterial({ map: texPool, color: 0xffcc66, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  muzzle.position.set(0, 0.02, -0.56); muzzle.visible = false; gun.add(muzzle);
  gun.position.set(0.34, -0.3, -0.72);
  camera.add(gun);
}
buildGun();

const raycaster = new THREE.Raycaster();
function shoot() {
  if (P.reloading) return;
  if (P.ammo <= 0) { SFX.empty(); return; }
  P.ammo--; updAmmo();
  SFX.shoot();
  gunRecoil = 1; P.shake = Math.min(P.shake + 0.25, 0.6);
  muzzle.visible = true; muzzle.rotation.z = Math.random() * 6;
  setTimeout(() => { muzzle.visible = false; }, 45);

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const meshes = [];
  aliens.forEach((a) => a.g.traverse((m) => { if (m.isMesh) meshes.push(m); }));
  const hit = raycaster.intersectObjects(meshes, false)[0];
  if (hit) {
    const a = hit.object.userData.alienRef;
    if (a) {
      a.hp--; a.flash = 1; SFX.hit();
      burst(hit.point, 0xffffff, 6);
      if (a.hp <= 0) killAlien(a);
    }
  }
  if (P.ammo === 0) reload();
}
function reload() {
  if (P.reloading || P.ammo === 8) return;
  P.reloading = true; SFX.reload();
  $('ammo').textContent = 'LADEN…';
  setTimeout(() => { P.reloading = false; P.ammo = 8; updAmmo(); }, 1100);
}
function updAmmo() { $('ammo').textContent = '▮'.repeat(P.ammo) + '▯'.repeat(8 - P.ammo); }

// ============================================================
//  UI / STATE
// ============================================================
const overlays = ['menu', 'intro', 'pause', 'dead', 'done', 'win'];
function show(id) {
  overlays.forEach((o) => $(o).classList.add('hidden'));
  if (id) $(id).classList.remove('hidden');
  $('hud').classList.toggle('hidden', !!id && id !== 'none');
}
let msgTimeout = null;
function showMsg(text, dur) {
  const m = $('msg'); m.textContent = text; m.style.opacity = 1;
  clearTimeout(msgTimeout);
  msgTimeout = setTimeout(() => { m.style.opacity = 0; }, (dur || 3.2) * 1000);
}
function flashScreen(op) {
  const f = $('flash');
  f.style.transition = 'none'; f.style.opacity = op;
  requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 0; });
}

function buildMenu() {
  const wrap = $('circles'); wrap.innerHTML = '';
  LEVELS.forEach((Lv, i) => {
    const card = document.createElement('div');
    const isLocked = i + 1 > unlocked;
    const isDone = unlocked > i + 1;
    card.className = 'circle-card' + (isLocked ? ' locked' : '') + (isDone ? ' done' : '');
    card.innerHTML =
      `<div class="cname">${isLocked ? '🔒 ???' : Lv.circle}</div>` +
      `<div class="cdrug">${isLocked ? '···' : Lv.drug}</div>` +
      `<div class="clvl">${Lv.tape}${isDone ? ' · ✔ DURCHGESPIELT' : ''}</div>`;
    card.addEventListener('click', () => {
      initAudio();
      if (isLocked) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); SFX.empty(); return; }
      openIntro(i);
    });
    wrap.appendChild(card);
  });
}

function openIntro(i) {
  levelIdx = i; L = LEVELS[i];
  state = 'intro';
  $('introTape').textContent = L.tape;
  $('introTitle').textContent = L.circle;
  $('introDrug').textContent = L.drug;
  $('introText').textContent = L.intro;
  show('intro');
}

function startLevel() {
  buildWorld(L);
  Object.assign(P, {
    x: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vz: 0,
    hp: 100, rausch: L.key === 'koks' ? 100 : 0, bob: 0, rollKick: 0, shake: 0,
    ammo: 8, reloading: false, kills: 0, time: 0, dmgTaken: 0, clarity: 0,
    stumbleT: 4 + Math.random() * 4, spawnT: 3.5, msgT: 9, ufoT: L.ufoEvery * 0.6,
    jointT: 6, heartT: 0.8,
    clockSec: L.clock[0] * 3600 + L.clock[1] * 60,
  });
  camera.fov = L.fov; camera.updateProjectionMatrix();
  $('rauschlabel').textContent = L.rauschLabel;
  $('channel').textContent = L.channel;
  updAmmo();
  $('hint').textContent = L.hint;
  setTimeout(() => { if (state === 'playing') $('hint').textContent = ''; }, 7000);
  state = 'playing';
  show(null);
  lockPointer();
  startMusic(L.key);
  showMsg(L.tape + ' · ' + L.drug, 2.5);
}

function levelComplete() {
  state = 'done';
  stopMusic(); stopLoopSounds();
  SFX.win();
  document.exitPointerLock && document.exitPointerLock();
  totals.kills += P.kills; totals.time += P.time; totals.dmg += P.dmgTaken;
  unlocked = Math.max(unlocked, levelIdx + 2);
  localStorage.setItem('hdiuh_unlocked', String(Math.min(unlocked, 4)));
  const stats =
    `ZEIT: <b>${P.time.toFixed(1)}s</b><br>` +
    `ALIENS ERLEDIGT: <b>${P.kills}</b><br>` +
    `SCHADEN KASSIERT: <b>${Math.round(P.dmgTaken)}</b><br>` +
    `RESTZUSTAND: <b>${Math.round(P.hp)}%</b>`;
  if (levelIdx >= LEVELS.length - 1) {
    $('winStats').innerHTML =
      `GESAMTZEIT: <b>${totals.time.toFixed(1)}s</b><br>` +
      `ALIENS GESAMT: <b>${totals.kills}</b><br>` +
      `SCHADEN GESAMT: <b>${Math.round(totals.dmg)}</b><br>` +
      `BEWERTUNG: <b>${'★'.repeat(Math.max(1, 5 - Math.floor(totals.dmg / 60)))}</b>`;
    show('win');
  } else {
    $('doneTitle').textContent = 'ZUHAUSE ANGEKOMMEN';
    $('doneStats').innerHTML = stats;
    $('nextBtn').textContent = '⏭ NÄCHSTES LEVEL: ' + LEVELS[levelIdx + 1].drug;
    show('done');
  }
  buildMenu();
}

function die(reason) {
  if (state !== 'playing') return;
  state = 'dead';
  stopMusic(); stopLoopSounds();
  SFX.filmriss();
  document.exitPointerLock && document.exitPointerLock();
  $('deadText').textContent = reason || 'Du bist nicht angekommen.';
  show('dead');
}

// ---------------------------------------------------------- INPUT
function lockPointer() {
  try { canvas.requestPointerLock && canvas.requestPointerLock(); } catch (e) {}
}
document.addEventListener('pointerlockchange', () => {
  if (state === 'playing' && document.pointerLockElement !== canvas) {
    state = 'paused'; show('pause');
  }
});
document.addEventListener('mousemove', (e) => {
  if (state !== 'playing' || document.pointerLockElement !== canvas) return;
  P.yaw -= e.movementX * 0.0022;
  P.pitch -= e.movementY * 0.0022;
  P.pitch = Math.max(-1.35, Math.min(1.35, P.pitch));
});
canvas.addEventListener('pointerdown', () => {
  initAudio();
  if (state === 'playing') shoot();
});
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyR' && state === 'playing') reload();
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
document.addEventListener('pointerdown', initAudio, { passive: true });

// Buttons
$('introBtn').addEventListener('click', () => { initAudio(); startLevel(); });
$('resumeBtn').addEventListener('click', () => { state = 'playing'; show(null); lockPointer(); });
$('quitBtn').addEventListener('click', () => { stopMusic(); stopLoopSounds(); state = 'menu'; buildMenu(); show('menu'); });
$('retryBtn').addEventListener('click', () => openIntro(levelIdx));
$('deadMenuBtn').addEventListener('click', () => { state = 'menu'; buildMenu(); show('menu'); });
$('nextBtn').addEventListener('click', () => openIntro(levelIdx + 1));
$('doneMenuBtn').addEventListener('click', () => { state = 'menu'; buildMenu(); show('menu'); });
$('winMenuBtn').addEventListener('click', () => { state = 'menu'; buildMenu(); show('menu'); });

// ---------------------------------------------------------- SCHADEN
function damagePlayer(dmg) {
  P.hp -= dmg; P.dmgTaken += dmg;
  P.shake = Math.min(P.shake + 0.5, 1);
  flashScreen(0.45);
  SFX.hurt();
  if (P.hp <= 0) {
    P.hp = 0;
    die(L.key === 'weed' ? 'Von Aliens erwischt. Die Munchies haben gewonnen.' :
        L.key === 'alk' ? 'K.O. gegangen. Der Gehweg war weicher als gedacht. Nicht.' :
        'Die Aliens waren schneller als dein Herz.');
  }
}

// ============================================================
//  UPDATE-LOOP
// ============================================================
function updatePlaying(dt) {
  P.time += dt;
  P.clockSec += dt;
  const t = P.time;
  const ts = L.timeScale * (P.clarity > 0 ? 0.95 : 1);
  const clar = P.clarity > 0 ? 0.3 : 1; // Wasser aktiv → Effekte gedämpft
  if (P.clarity > 0) P.clarity -= dt;

  // ------- Rausch-Mechanik pro Level
  if (L.key === 'weed') {
    P.rausch = Math.min(100, P.rausch + dt * (100 / 50));
    if (P.rausch >= 100) { P.hp -= dt * 3.5; if (P.hp <= 0) { P.hp = 0; die('Verhungert. Drei Meter vor dem Kühlschrank. Fast.'); return; } }
  } else if (L.key === 'alk') {
    P.rausch = Math.min(100, P.rausch + dt * (100 / 75));
  } else {
    P.rausch -= dt * (100 / L.crashTime);
    if (P.rausch <= 0) { die('Der Crash hat dich auf halber Strecke erwischt.'); return; }
    // Herzschlag
    P.heartT -= dt;
    if (P.heartT <= 0) {
      SFX.heart(); fx.pulse = 1;
      P.heartT = 0.35 + 0.55 * (P.rausch / 100);
    }
  }

  // ------- Stolpern (Alk)
  if (L.stumble) {
    P.stumbleT -= dt;
    if (P.stumbleT <= 0) {
      P.stumbleT = 3.5 + Math.random() * 5;
      P.vx += (Math.random() < 0.5 ? -1 : 1) * (2.5 + P.rausch / 35);
      P.rollKick = (Math.random() < 0.5 ? -1 : 1) * 0.4;
      SFX.stumble();
      if (Math.random() < 0.35) showMsg('*stolper*', 1.2);
    }
  }

  // ------- Bewegung
  const swayMul = L.key === 'alk' ? (0.5 + P.rausch / 90) * clar : L.sway;
  let ix = 0, iz = 0;
  if (keys.KeyW || keys.ArrowUp) iz -= 1;
  if (keys.KeyS || keys.ArrowDown) iz += 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  const ilen = Math.hypot(ix, iz) || 1;
  const sp = L.speed * ((keys.ShiftLeft || keys.ShiftRight) ? 1.35 : 1);
  const cos = Math.cos(P.yaw), sin = Math.sin(P.yaw);
  let tvx = ((ix * cos - iz * sin) / ilen) * sp;
  let tvz = ((-ix * sin - iz * cos) / ilen) * sp;
  // Alk: Drift
  if (L.key === 'alk') { tvx += Math.sin(t * 0.7) * 1.4 * swayMul * (Math.abs(tvz) > 0.1 ? 1 : 0); }
  const smooth = L.key === 'weed' ? 3.2 : 11;
  const k = 1 - Math.exp(-smooth * dt);
  P.vx += (tvx - P.vx) * k;
  P.vz += (tvz - P.vz) * k;
  P.x = Math.max(-7.5, Math.min(7.5, P.x + P.vx * dt));
  P.z = Math.max(-L.length - 4, Math.min(13, P.z + P.vz * dt));

  // Kopf-Wippen + Schritte
  const moving = Math.hypot(P.vx, P.vz) > 0.6;
  if (moving) P.bob += dt * sp * 1.7;
  const bobY = Math.sin(P.bob) * 0.05;
  if (moving && Math.sin(P.bob) < 0 && Math.sin(P.bobPrev) >= 0) SFX.step();
  P.bobPrev = P.bob;

  // ------- Kamera
  let camYaw = P.yaw, camPitch = P.pitch;
  if (L.jitter) { camYaw += (Math.random() - 0.5) * 0.006 * clar; camPitch += (Math.random() - 0.5) * 0.006 * clar; }
  P.rollKick *= Math.exp(-2.5 * dt);
  P.shake *= Math.exp(-5 * dt);
  const roll = Math.sin(t * 0.85) * 0.055 * swayMul + P.rollKick + (Math.random() - 0.5) * P.shake * 0.06;
  camera.position.set(
    P.x + Math.sin(t * 0.6) * 0.35 * swayMul + (Math.random() - 0.5) * P.shake * 0.15,
    1.7 + bobY,
    P.z
  );
  camera.rotation.set(camPitch, camYaw, roll);
  if (L.breathe) {
    camera.fov = L.fov + Math.sin(t * 0.55) * L.breathe * clar;
    camera.updateProjectionMatrix();
  }

  // Licht folgt dem Spieler (Schatten + Straßenglow)
  moonLight.position.set(P.x - 25, 55, P.z - 30);
  moonLight.target.position.set(P.x, 0, P.z - 10);
  followLight.position.set(P.x, 6, P.z - 4);

  // Waffen-Recoil
  gunRecoil *= Math.exp(-9 * dt);
  gun.position.z = -0.72 + gunRecoil * 0.13;
  gun.rotation.x = gunRecoil * 0.22;
  gun.position.y = -0.3 + bobY * 0.4;

  // ------- Aliens
  P.spawnT -= dt;
  if (P.spawnT <= 0 && P.z > -L.length + 16) {
    P.spawnT = L.alienEvery[0] + Math.random() * (L.alienEvery[1] - L.alienEvery[0]);
    spawnAlien();
  }
  const wdt = dt * ts;
  for (const a of [...aliens]) {
    const dx = P.x - a.g.position.x, dz = P.z - a.g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.1) {
      a.g.position.x += (dx / dist) * a.speed * wdt;
      a.g.position.z += (dz / dist) * a.speed * wdt;
    }
    a.ph += wdt * 7;
    a.g.position.y = Math.abs(Math.sin(a.ph)) * 0.18;
    a.g.rotation.z = Math.sin(a.ph * 0.7) * 0.1;
    a.g.lookAt(P.x, a.g.position.y, P.z);
    if (a.flash > 0) { a.flash -= dt * 5; a.bodyMat.emissiveIntensity = 0.35 + Math.max(0, a.flash) * 1.2; }
    a.cd -= dt;
    if (dist < 1.7 && a.cd <= 0) {
      a.cd = 1.2;
      damagePlayer(L.alienDmg);
      if (state !== 'playing') return;
      a.g.position.x -= (dx / dist) * 2.2;
      a.g.position.z -= (dz / dist) * 2.2;
    }
    if (a.g.position.z > P.z + 30) killAlien(a, true); // weit hinter uns → weg
  }

  // ------- UFO
  if (L.ufoEvery) {
    P.ufoT -= dt;
    if (P.ufoT <= 0) { P.ufoT = L.ufoEvery * (0.8 + Math.random() * 0.4); spawnUfo(); showMsg('⚠ UFO GESICHTET', 2); }
  }
  for (const u of [...ufos]) {
    u.t += dt;
    u.g.position.x += u.vx * dt;
    u.g.position.y = 16 + Math.sin(u.t * 2.2) * 1.2;
    u.g.rotation.y += dt * 2;
    if (!u.dropped && Math.abs(u.g.position.x - P.x) < 6) {
      u.dropped = true;
      u.beam.material.opacity = 0.35;
      setTimeout(() => { u.beam.material.opacity = 0; }, 600);
      const n = L.key === 'koks' ? 3 : 2;
      for (let i = 0; i < n; i++) spawnAlien(u.g.position.x, u.g.position.z);
    }
    if (Math.abs(u.g.position.x) > 55) {
      u.snd && u.snd.stop();
      scene.remove(u.g);
      ufos = ufos.filter((x) => x !== u);
    }
  }

  // ------- Joint-Sternschnuppen (Weed)
  if (L.jointEvery) {
    P.jointT -= dt;
    if (P.jointT <= 0) { P.jointT = L.jointEvery * (0.7 + Math.random() * 0.6); spawnJoint(); }
  }
  for (const j of [...joints]) {
    j.g.position.x += j.vx * dt;
    j.g.position.y += Math.sin(j.g.position.x * 0.4) * dt * 1.5;
    if (j.g.position.x > 46) { scene.remove(j.g); joints = joints.filter((x) => x !== j); }
  }

  // ------- Hallu-Blobs
  for (const b of blobs) {
    b.userData.ph += wdt;
    const ph = b.userData.ph;
    b.position.y = b.userData.y0 + Math.sin(ph * 0.7) * 0.8;
    b.position.x = b.userData.x0 + Math.sin(ph * 0.4) * 1.5;
    const s = 1 + Math.sin(ph * 1.3) * 0.25;
    b.scale.set(s, s, s);
  }

  // ------- Pickups
  for (const p of [...pickups]) {
    p.userData.ph += wdt * 2;
    p.rotation.y += wdt * 1.5;
    p.children[0].position.y = (p.userData.type === 'doener' ? 1.0 : 1.1) + Math.sin(p.userData.ph) * 0.12;
    if (Math.hypot(P.x - p.position.x, P.z - p.position.z) < 1.9) {
      SFX.pickup();
      burst(p.position.clone().setY(1), p.userData.type === 'doener' ? 0xffcc44 : 0x44aaff, 12);
      if (p.userData.type === 'doener') {
        P.hp = Math.min(100, P.hp + 30);
        if (L.key === 'weed') P.rausch = Math.max(0, P.rausch - 100);
        showMsg('🥙 DÖNER! +30', 2);
      } else {
        P.clarity = 6;
        if (L.key === 'alk') P.rausch = Math.max(0, P.rausch - 35);
        if (L.key === 'koks') { P.rausch = Math.min(100, P.rausch + 9); showMsg('💧 WASSER! +CRASH-ZEIT', 2); }
        else showMsg('💧 WASSER! Kurz klar sehen.', 2);
      }
      scene.remove(p);
      pickups = pickups.filter((x) => x !== p);
    }
  }

  // ------- Partikel
  for (const pa of [...particles]) {
    pa.life -= dt;
    const arr = pa.pts.geometry.attributes.position.array;
    for (let i = 0; i < pa.vel.length; i++) {
      pa.vel[i].y -= 9 * dt;
      arr[i * 3] += pa.vel[i].x * dt;
      arr[i * 3 + 1] = Math.max(0.02, arr[i * 3 + 1] + pa.vel[i].y * dt);
      arr[i * 3 + 2] += pa.vel[i].z * dt;
    }
    pa.pts.geometry.attributes.position.needsUpdate = true;
    pa.pts.material.opacity = Math.max(0, pa.life / pa.max);
    if (pa.life <= 0) { scene.remove(pa.pts); particles = particles.filter((x) => x !== pa); }
  }

  // ------- Party-Licht + Musik-Nähe
  if (partyLight) {
    partyLight.color.setHSL((t * 0.4) % 1, 0.9, 0.55);
    partyLight.intensity = 1.2 + Math.sin(t * 6) * 0.5;
  }
  if (homeLight) homeLight.intensity = 1.4 + Math.sin(t * 2.5) * 0.35;

  // ------- Flavor-Meldungen
  P.msgT -= dt;
  if (P.msgT <= 0) {
    P.msgT = 15 + Math.random() * 12;
    showMsg(L.msgs[Math.floor(Math.random() * L.msgs.length)], 3.2);
  }

  // ------- Ziel erreicht?
  if (P.z <= -L.length + 2.5) { levelComplete(); return; }

  // ------- HUD
  $('hpbar').style.width = Math.max(0, P.hp) + '%';
  $('rauschbar').style.width = Math.max(0, Math.min(100, P.rausch)) + '%';
  $('dist').textContent = '→ ZUHAUSE ' + Math.max(0, Math.round(P.z + L.length)) + 'm';
  const cs = Math.floor(P.clockSec);
  const hh = String(Math.floor(cs / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor(cs / 60) % 60).padStart(2, '0');
  const ss = String(cs % 60).padStart(2, '0');
  $('clock').textContent = hh + ':' + mm + ':' + ss;

  // ------- FX-Ziele setzen (mit Klarheits-Dämpfung)
  const F = L.fx;
  fxLerp('wob', F.wob * clar, dt); fxLerp('dbl', F.dbl * clar, dt);
  fxLerp('sat', F.sat, dt); fxLerp('vig', F.vig, dt);
  fx.wobFreq = F.wobFreq;
  for (let i = 0; i < 3; i++) fx.tint[i] += (F.tint[i] - fx.tint[i]) * Math.min(1, dt * 2);
}

function fxLerp(kk, target, dt) { fx[kk] += (target - fx[kk]) * Math.min(1, dt * 2.5); }

// Menü-Kamera: langsame Fahrt durch die Straße
function updateMenu(dt, t) {
  camera.position.set(Math.sin(t * 0.1) * 3, 2.2, -((t * 1.2) % 200));
  camera.rotation.set(-0.03, Math.sin(t * 0.07) * 0.25, Math.sin(t * 0.13) * 0.02);
  if (partyLight) partyLight.color.setHSL((t * 0.4) % 1, 0.9, 0.55);
  if (moonLight) {
    moonLight.position.set(camera.position.x - 25, 55, camera.position.z - 30);
    moonLight.target.position.set(camera.position.x, 0, camera.position.z - 10);
  }
  if (followLight) followLight.position.set(camera.position.x, 6, camera.position.z - 4);
  fxLerp('wob', 0.15, dt); fxLerp('dbl', 0, dt);
  fxLerp('sat', 1.05, dt); fxLerp('vig', 0.35, dt);
  fx.wobFreq = 0.7;
}

// ============================================================
//  HAUPTSCHLEIFE
// ============================================================
let last = performance.now(), elapsed = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (canvas.width === 0 || canvas.height === 0) onResize(); // Start im Hintergrund-Tab abfangen
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now; elapsed += dt;

  if (state === 'playing') updatePlaying(dt);
  else if (state === 'menu' || state === 'intro') updateMenu(dt, elapsed);

  // FX-Abkling
  fx.pulse *= Math.exp(-4 * dt);

  const U = postMat.uniforms;
  U.time.value = elapsed;
  U.uDouble.value = fx.dbl;
  U.uWobAmp.value = fx.wob; U.uWobFreq.value = fx.wobFreq; U.uVig.value = fx.vig;
  U.uPulse.value = fx.pulse; U.uSat.value = fx.sat;
  U.uTint.value.set(fx.tint[0], fx.tint[1], fx.tint[2]);

  if (scene) {
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }
}

// ---------------------------------------------------------- BOOT
buildWorld(LEVELS[0]);   // Menü-Hintergrund
buildMenu();
show('menu');
requestAnimationFrame(loop);

// Dev-Zugriff (Konsole): game.start(2) etc.
window.game = {
  start(i) { openIntro(i || 0); startLevel(); },
  intro: openIntro,
  get state() { return state; },
  P, LEVELS,
  win: levelComplete, die,
};
