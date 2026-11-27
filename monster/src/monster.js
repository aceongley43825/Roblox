// monster.js: props and sets for "the monster that collects a debt".
// Builds on the kit (util/sets/avatar) and the town layer (town.js). Everything is a pure function of time.
import * as THREE from 'three';
import { LIGHTS, W, H } from './core.js';
import { canvasTex, mat, glow, box, at, grp, sign, rng, shade, clamp, remap, lerp, E, PRE } from './util.js';
import { TEX, floor, wall, room, tree, lampPost, sofa, windowPane, bookshelf } from './sets.js';
import { skyDome, hills, house, TOWN } from './town.js';

Object.assign(LIGHTS, {
  sepia: { amb: 1.05, hemi: 0.8, sun: 1.5, dir: [-12, 10, 12], sunColor: '#ffe0b0', bg: '#9c8462', exposure: 1.0 },
  cctv: { amb: 0.95, hemi: 0.8, sun: 0.9, dir: [-8, 14, 10], sunColor: '#d0e0ff', bg: '#1a2340', exposure: 1.25 },
  lair: { amb: 0.3, hemi: 0.22, sun: 0.55, dir: [4, 16, 10], sunColor: '#ff9a6a', bg: '#120909', exposure: 1.0 },
  office: { amb: 0.55, hemi: 0.4, sun: 0.85, dir: [4, 16, 12], sunColor: '#ffe6c4', bg: '#14141c', exposure: 1.05 },
});
// per-shot colour grades (core: shot.tint = [colour, amount], shot.sat)
export const SEPIA = { tint: ['#f0c48a', 0.9], sat: 0.6 };
export const CCTV = { tint: ['#a8e8b4', 0.8], sat: 0.5 };

// ───────────── the monster: ~33 studs tall, rock skin with glowing lava cracks, horns, claws, glowing eyes
function rockTex(base, seed) { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rng(seed); for (let i = 0; i < 320; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.16)'; g.fillRect(r() * w, r() * h, 4 + r() * 34, 3 + r() * 14); } }); }
function crackTex(seed) { return canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const r = rng(seed); g.strokeStyle = '#ffffff'; g.lineCap = 'round'; for (let k = 0; k < 6; k++) { g.lineWidth = 2 + r() * 3; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 80; y += (r() - 0.3) * 60; g.lineTo(x, y); } g.stroke(); } }); }
export function makeMonster(o = {}) {
  const body = o.color || '#2f2b3c', M = new THREE.MeshLambertMaterial({ map: rockTex(body, 3), emissive: new THREE.Color('#ff5a14'), emissiveMap: crackTex(4), emissiveIntensity: 1.7 });
  const dark = mat(shade(body, -0.35)), bone = mat('#e8dcc0'), mk = (w, h, d, m = M) => box(w, h, d, m, 0.4);
  const root = grp(), hip = grp(); hip.position.y = 11; root.add(hip);
  hip.add(at(mk(13, 12, 8), 0, 6, 0));
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.4, 6), dark); c.position.set(0, 2.5 + i * 2.9, -4.4); c.rotation.x = -0.9; c.castShadow = true; hip.add(c); }
  const head = grp(); head.position.y = 12; hip.add(head);
  head.add(at(mk(10, 5, 8.5), 0, 4.9, 0.6), at(mk(10.6, 1.3, 1.8, dark), 0, 6.7, 4.4));
  head.add(at(box(8.6, 2.3, 7.4, mat('#3a0808')), 0, 1.3, 0.4));                       // mouth inside (shows when the jaw drops)
  const eyeM = glow('#ff2a1a', 2.8), eyes = [-1, 1].map(s => { const e = box(2.1, 1.3, 0.4, eyeM); e.castShadow = false; e.position.set(s * 2.6, 5.4, 4.92); head.add(e); return e; });
  for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.3, 4), bone); t.rotation.x = Math.PI; t.position.set(-3.6 + i * 1.2, 1.9, 4.55); head.add(t); }
  const jaw = grp(); jaw.position.set(0, 2.4, -3.6); head.add(jaw); jaw.add(at(mk(9.4, 2.2, 8.2), 0, -1.1, 4.1));
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 4), bone); t.position.set(-3 + i * 1.2, 0.35, 7.7); jaw.add(t); }
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5.4, 8), bone); h.position.set(s * 4.3, 8.9, 0); h.rotation.z = -s * 0.5; h.castShadow = true; head.add(h); }
  const arm = s => { const p = grp(); p.position.set(s * 8.4, 10.5, 0); hip.add(p); p.add(at(mk(4, 13, 4), 0, -6, 0)); const hand = grp(); hand.position.y = -13; p.add(hand); hand.add(mk(4.8, 2.6, 4.8, dark)); for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 6), bone); c.position.set((k - 1) * 1.5, -2.2, 1.3); c.rotation.x = Math.PI + 0.35; hand.add(c); } return p; };
  const leg = s => { const p = grp(); p.position.set(s * 3.6, 0, 0); hip.add(p); p.add(at(mk(5, 11, 5), 0, -5.5, 0), at(mk(5.8, 1.8, 7, dark), 0, -10.1, 0.8)); return p; };
  const armL = arm(1), armR = arm(-1), legL = leg(1), legR = leg(-1);
  const m = { root, hip, head, jaw, armL, armR, legL, legR, eyes,
    reset() { for (const p of [armL, armR, legL, legR, head, jaw, hip]) p.rotation.set(0, 0, 0); hip.position.set(0, 11, 0); root.visible = true; root.scale.setScalar(1); return m.eyesOpen(1); },
    place(x, z, ry = 0, y = 0) { root.position.set(x, y, z); root.rotation.set(0, ry, 0); return m; },
    size(s) { root.scale.setScalar(s); return m; },
    eyesOpen(k) { for (const e of eyes) e.scale.y = Math.max(0.08, k); return m; },
    breathe(t, a = 1) { hip.position.y += Math.sin(t * 1.6) * 0.25 * a; head.rotation.x += Math.sin(t * 1.6 + 1) * 0.03 * a; armL.rotation.z += 0.05 + Math.sin(t * 1.6) * 0.04 * a; armR.rotation.z -= 0.05 + Math.sin(t * 1.6) * 0.04 * a; return m; },
    walk(t, sp = 1) { const ph = t * 3.4 * sp, s = Math.sin(ph) * 0.42; legL.rotation.x = -s; legR.rotation.x = s; armL.rotation.x = s * 0.6; armR.rotation.x = -s * 0.6; hip.position.y = 11 + Math.abs(Math.cos(ph)) * 0.5; hip.rotation.z = Math.sin(ph) * 0.04; return m; },
    roar(k) { jaw.rotation.x = 0.5 * k; head.rotation.x -= 0.22 * k; armL.rotation.z += 0.9 * k; armR.rotation.z -= 0.9 * k; armL.rotation.x -= 0.5 * k; armR.rotation.x -= 0.5 * k; return m; },
    look(yaw = 0, pitch = 0) { head.rotation.y += yaw; head.rotation.x += pitch; return m; },
  };
  PRE.push(() => { root.visible = false; });
  return m;
}

// ───────────── ground crack (glowing) + rubble
function crackDecal(size = 30, seed = 6) {
  const t = canvasTex(512, 512, (g, w, h) => {
    const r = rng(seed); g.translate(w / 2, h / 2); g.lineCap = 'round'; g.lineJoin = 'round';
    const paths = []; for (let k = 0; k < 9; k++) { const a0 = k / 9 * 6.28 + r() * 0.4, p = [[0, 0]]; let x = 0, y = 0, a = a0; for (let j = 0; j < 6; j++) { a += (r() - 0.5) * 0.8; const L = 20 + r() * 26; x += Math.cos(a) * L; y += Math.sin(a) * L; p.push([x, y]); } paths.push(p); }
    for (const [lw, col, blur] of [[26, 'rgba(255,110,30,0.55)', 24], [14, '#ff7a22', 10], [7, '#ffd27a', 0]]) { g.strokeStyle = col; g.shadowColor = '#ff6a1a'; g.shadowBlur = blur; for (const p of paths) { g.lineWidth = lw; g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } }
    g.shadowBlur = 0; g.fillStyle = '#1a0a04'; g.beginPath(); g.ellipse(0, 0, 70, 46, 0.3, 0, 7); g.fill(); g.strokeStyle = '#ff8a2a'; g.lineWidth = 6; g.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.5, 1.5, 1.5) }));
  m.rotation.x = -Math.PI / 2; return m;
}
function rubbleSet(g, n, seed, colors = ['#4a3a30', '#3d4a2c', '#5a5048']) { const r = rng(seed), out = []; for (let i = 0; i < n; i++) { const s = 0.9 + r() * 2.2, b = box(s, s * 0.8, s, colors[i % colors.length], 0.2); b.userData = { a: r() * 6.28, rad: 0.6 + r() * 0.5, s, rx: r() * 3, ry: r() * 3, h: 1 + r() * 3 }; b.visible = false; g.add(b); out.push(b); } return out; }

// open field on the edge of town: the monster rises here
export function field(o = {}) {
  const g = grp(skyDome(o.sky || 'night'), hills(o.sky === 'sunset' ? '#5c6a3a' : '#1d3320'));
  g.add(at(floor(300, 220, TEX.grass(o.sky === 'sunset' ? '#6a7a3a' : '#2b4a26'), 6), 0, -0.03, -40));
  const cols = ['#c97a8e', '#3e66c9', '#d9b56a', '#8fbf9a', '#b07ad0'];
  for (let i = -4; i <= 4; i++) g.add(at(house({ color: cols[(i + 4) % 5], lit: o.sky === 'sunset' ? 0 : 0.55, seed: i + 80, roof: '#252a36' }), i * 22, 0, -66 - Math.abs(i % 2) * 6));
  for (const [x, z, h] of [[-30, -20, 10], [27, -24, 11], [-44, 6, 9], [42, 2, 10], [-17, -38, 9], [15, -42, 10]]) g.add(at(tree(h, o.sky === 'sunset' ? '#4a6a2a' : '#24452a'), x, 0, z));
  const crack = crackDecal(34); g.add(at(crack, 0, 0.04, 2));
  const glowL = new THREE.PointLight('#ff6a1a', 0, 70, 1.5); glowL.position.set(0, 5, 8); g.add(glowL);
  const rubble = rubbleSet(g, 18, 9);
  const set = { group: g, light: o.light || (o.sky === 'sunset' ? 'sepia' : 'townNight'), crack, glowL,
    reset() { glowL.intensity = 0; crack.visible = false; rubble.forEach(b => { b.visible = false; }); },
    // k: 0 = closed ground, 1 = fully open crack with rubble pushed out
    quake(k, t = 0) { crack.visible = k > 0.01; crack.scale.setScalar(0.35 + 0.65 * k); glowL.intensity = 700 * k * (0.85 + 0.15 * Math.sin(t * 9)); rubble.forEach((b, i) => { const u = b.userData, R = (8 + u.rad * 9) * (0.5 + 0.5 * k); b.visible = k > 0.05; b.position.set(Math.cos(u.a) * R, u.s * 0.4 + Math.max(0, Math.sin(k * Math.PI * 1.3)) * u.h, 2 + Math.sin(u.a) * R * 0.7); b.rotation.set(u.rx * k, u.ry * k, 0); }); },
  };
  return set;
}

// ───────────── props
export function sirenPole() { // tall grey pole, two horn speakers, a red beacon that pulses when the siren is on
  const g = grp(at(box(0.6, 15, 0.6, '#3a3d46'), 0, 7.5, 0), at(box(2.4, 1.2, 1.2, '#4a4e58'), 0, 13.5, 0));
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.35, 2.4, 14, 1, true), mat('#c9ccd4', { side: THREE.DoubleSide })); h.rotation.z = s * Math.PI / 2; h.position.set(s * 2.2, 13.5, 0); g.add(h); }
  const beaconOn = glow('#ff2a2a', 2.6), beaconOff = mat('#5a1a1a'), beacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), beaconOff); beacon.position.set(0, 15.4, 0); g.add(beacon);
  const L = new THREE.PointLight('#ff2a2a', 0, 70, 1.3); L.position.set(0, 14, 3); g.add(L);
  PRE.push(() => { L.intensity = 0; beacon.material = beaconOff; });
  g.on = t => { const k = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4); L.intensity = 900 * k; beacon.material = k > 0.35 ? beaconOn : beaconOff; return k; };
  return g;
}
export function cellarDoors() { // storm-cellar bulkhead in a front lawn; open(k) swings the doors up
  const g = grp(at(box(4.6, 0.7, 4, '#6a6e76'), 0, 0.35, 0), at(box(3.8, 0.2, 3.2, '#0a0a0c'), 0, 0.72, 0));
  const dl = grp(), dr = grp(); dl.position.set(-1.9, 0.8, 0); dr.position.set(1.9, 0.8, 0); dl.add(at(box(1.9, 0.25, 3.4, '#8a4a2a', 0.05), 0.95, 0, 0)); dr.add(at(box(1.9, 0.25, 3.4, '#8a4a2a', 0.05), -0.95, 0, 0)); g.add(dl, dr);
  g.open = k => { dl.rotation.z = 1.9 * k; dr.rotation.z = -1.9 * k; }; return g;
}
export function contract() { // old parchment: the deal
  const t = canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#e8d6a8'; g.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(120,80,30,${r() * 0.08})`; g.fillRect(r() * w, r() * h, 3 + r() * 30, 2 + r() * 8); }
    g.fillStyle = '#4a2a12'; g.textAlign = 'center'; g.font = '900 78px Montserrat'; g.fillText('THE DEBT', w / 2, 120); g.font = '700 40px Montserrat'; g.fillText('SIGNED 1926', w / 2, 190);
    g.font = '900 180px Montserrat'; g.fillStyle = '#7a1a10'; g.fillText('10', w / 2, 400); g.font = '700 34px Montserrat'; g.fillStyle = '#4a2a12'; g.fillText('OWED EVERY 100 YEARS', w / 2, 470);
    g.strokeStyle = '#3a1a0a'; g.lineWidth = 5; g.beginPath(); g.moveTo(140, 560); g.bezierCurveTo(200, 520, 260, 600, 380, 545); g.stroke();
    g.strokeStyle = 'rgba(90,20,10,0.8)'; g.lineWidth = 12; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(330 + k * 34, 230); g.lineTo(250 + k * 34, 610); g.stroke(); } // claw marks
  });
  return grp(new THREE.Mesh(new THREE.PlaneGeometry(4, 5), new THREE.MeshLambertMaterial({ map: t })));
}
function clockFace(text = '12:00') { // city hall clock reading midnight
  return canvasTex(256, 256, (g, w) => { const c = w / 2; g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill(); g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(c, c, c - 10, 0, 7); g.fill(); g.fillStyle = '#1b1b1b'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(c + Math.sin(a) * (c - 26) - 4, c - Math.cos(a) * (c - 26) - 8, 8, 16); } g.lineCap = 'round'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 12; g.beginPath(); g.moveTo(c, c); g.lineTo(c, 48); g.stroke(); g.lineWidth = 16; g.beginPath(); g.moveTo(c, c); g.lineTo(c, 80); g.stroke(); g.fillStyle = '#c33'; g.beginPath(); g.arc(c, c, 10, 0, 7); g.fill(); });
}
export function phone(o = {}) { // smartphone with an incoming call screen ("GRANDPA / MAYOR")
  const t = canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3a6a'); gr.addColorStop(1, '#101830'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.fillStyle = '#c8d4f0'; g.font = '700 22px Montserrat'; g.fillText('incoming call', w / 2, 80);
    g.fillStyle = '#8a9ac8'; g.beginPath(); g.arc(w / 2, 170, 52, 0, 7); g.fill(); g.fillStyle = '#e0e0e4'; g.fillRect(w / 2 - 30, 128, 60, 26); g.fillStyle = '#f6cfa9'; g.fillRect(w / 2 - 28, 150, 56, 52); g.fillStyle = '#16161a'; g.fillRect(w / 2 - 18, 166, 10, 10); g.fillRect(w / 2 + 8, 166, 10, 10);
    g.fillStyle = '#ffffff'; g.font = '900 40px Montserrat'; g.fillText('GRANDPA', w / 2, 270); g.fillStyle = '#c8d4f0'; g.font = '700 22px Montserrat'; g.fillText('(the mayor)', w / 2, 304);
    g.fillStyle = '#e0413a'; g.beginPath(); g.arc(70, 430, 34, 0, 7); g.fill(); g.fillStyle = '#34c759'; g.beginPath(); g.arc(w - 70, 430, 34, 0, 7); g.fill(); });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); scr.position.z = 0.081;
  return grp(box(0.92, 1.76, 0.16, o.color || '#18181d', 0.08), scr);
}
export function tvCamera() { // studio camera on a tripod, faces +z (rotate it to aim)
  const g = grp(); for (const a of [0, 2.1, 4.2]) { const l = box(0.18, 5.4, 0.18, '#22242a'); l.position.set(Math.sin(a) * 0.9, 2.5, Math.cos(a) * 0.9); l.rotation.set(Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18); g.add(l); }
  g.add(at(box(1.6, 1.5, 3.2, '#2b2e36', 0.12), 0, 5.6, 0), at(box(1.2, 1.0, 0.8, '#17181c'), 0, 5.7, 1.9), at(box(0.5, 0.3, 0.1, glow('#ff2a2a', 2.4)), 0.4, 6.5, 1.0));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.6, 20), mat('#0d0e12')); lens.rotation.x = Math.PI / 2; lens.position.set(0, 5.7, 2.5); g.add(lens);
  return g;
}

// ───────────── HUD: a full-frame overlay glued to the camera (news lower-third, emergency card, CCTV, old film)
export function makeHud(parent) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); m.renderOrder = 999; m.visible = false; parent.add(m); PRE.push(() => { m.visible = false; });
  let last = '';
  const bar = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const txt = (s, x, y, size, col, weight = 900, align = 'left') => { g.font = `${weight} ${size}px Montserrat`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y); };
  const draw = {
    news(tt) { bar(60, 120, 150, 64, '#d8262c'); txt('LIVE', 135, 153, 40, '#fff', 900, 'center'); txt('MH7', W - 70, 153, 44, 'rgba(255,255,255,0.85)', 900, 'right');
      bar(0, 1430, W, 90, '#d8262c'); txt('BREAKING NEWS', 60, 1476, 52, '#fff'); bar(0, 1520, W, 120, 'rgba(250,250,250,0.94)'); txt('MAYOR: STAY IN YOUR HOMES', 60, 1580, 50, '#1b1b1b', 800); bar(0, 1640, W, 54, '#1b2a4a'); txt('SIRENS ACTIVE • DO NOT GO OUTSIDE • SIRENS ACTIVE', 60 - (tt * 120) % 300, 1667, 30, '#fff', 700); },
    emergency(tt) { const on = Math.floor(tt * 2) % 2 === 0; bar(0, 0, W, 210, on ? '#d8262c' : '#a01418'); txt('⚠ EMERGENCY BROADCAST', W / 2, 108, 62, '#fff', 900, 'center');
      bar(60, 250, 150, 64, '#d8262c'); txt('LIVE', 135, 283, 40, '#fff', 900, 'center');
      bar(0, 1470, W, 170, 'rgba(10,10,14,0.88)'); bar(0, 1470, 22, 170, '#f2c230'); txt('THE MAYOR SPEAKS', 60, 1525, 54, '#f2c230'); txt('STAY UNDERGROUND UNTIL FURTHER NOTICE', 60, 1595, 34, '#fff', 700); },
    cctv(tt) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 8; const L = 90, p = 50; for (const [x, y, sx, sy] of [[p, p, 1, 1], [W - p, p, -1, 1], [p, H - p, 1, -1], [W - p, H - p, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y); g.stroke(); }
      txt('CAM 03  CITY HALL', 90, 130, 44, '#fff', 800); if (Math.floor(tt * 2) % 2 === 0) { g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(W - 250, 130, 18, 0, 7); g.fill(); } txt('REC', W - 90, 130, 44, '#fff', 800, 'right');
      const s = Math.floor(tt) % 60; txt(`11-27-2026  00:04:${String(12 + s).padStart(2, '0')}`, 90, H - 130, 40, '#fff', 700);
      g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); },
    film(tt) { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.62); gr.addColorStop(0, 'rgba(40,20,5,0)'); gr.addColorStop(1, 'rgba(40,20,5,0.75)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const r = rng(1 + Math.floor(tt * 10)); g.strokeStyle = 'rgba(255,240,210,0.35)'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { const x = r() * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 40, H); g.stroke(); } g.fillStyle = 'rgba(30,15,5,0.5)'; for (let i = 0; i < 30; i++) g.fillRect(r() * W, r() * H, 3 + r() * 5, 3 + r() * 5);
      txt('1926', W - 80, H - 140, 64, 'rgba(255,240,210,0.9)', 900, 'right'); },
  };
  return { at(camera, kind, tt = 0) {
    m.visible = true; const key = kind + '|' + (kind === 'film' ? Math.floor(tt * 10) : Math.floor(tt * 2)) + '|' + (kind === 'news' ? Math.floor(tt * 30) : 0);
    if (key !== last) { last = key; g.clearRect(0, 0, W, H); draw[kind](tt); t.needsUpdate = true; }
    m.position.copy(camera.position); m.quaternion.copy(camera.quaternion); m.translateZ(-0.5); const h = Math.tan(camera.fov * Math.PI / 360); m.scale.set(h * W / H, h, 1);
  } };
}

// ───────────── sets
// city hall at night: columns, pediment, clock tower at midnight, anniversary banner. breach(dt) = the monster's punch.
export function cityHall(o = {}) {
  const g = grp(skyDome('night'), hills('#1d3320', -170));
  g.add(at(floor(300, 220, TEX.grass('#2b4a26'), 6), 0, -0.03, -40), at(floor(80, 46, TEX.concrete('#8a8c92'), 4), 0, 0.01, 4), at(floor(300, 12, TEX.road(), 6), 0, 0.02, 32));
  const Bz = -14, Wd = 40, Ht = 17, D = 14, fz = Bz + D / 2;                          // front wall at z = -7
  g.add(at(box(Wd, Ht, D, '#d8d2c4'), 0, Ht / 2, Bz), at(box(Wd + 2, 1.2, D + 2, '#bfb8a8'), 0, Ht + 0.6, Bz));
  for (const fl of [0, 1]) for (const x of [-16, -12, 12, 16]) g.add(at(windowPane(2.4, 3.2, '#ffe7a8'), x, 4.5 + fl * 6.5, fz + 0.1));
  const cols = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 12.6, 18), mat('#ece6d8')); c.position.set(-10 + i * 4, 6.3 + 0.9, fz + 3.6); c.castShadow = true; g.add(c); cols.push(c); }
  g.add(at(box(25, 1.5, 6, '#e2dccc'), 0, 14.2, fz + 3.4));
  const tri = new THREE.Shape(); tri.moveTo(-12.5, 0); tri.lineTo(12.5, 0); tri.lineTo(0, 4.6); tri.closePath();
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 5.6, bevelEnabled: false }), mat('#e2dccc')); ped.position.set(0, 14.95, fz + 0.6); ped.castShadow = true; g.add(ped);
  for (let i = 0; i < 3; i++) g.add(at(box(22 - i * 1.5, 0.6, 2, '#bdb6a6'), 0, 0.3 + i * 0.6, fz + 7.6 - i * 1.2));
  g.add(at(box(25, 0.9, 7.6, '#cfc8b8'), 0, 0.45, fz + 3.4));
  g.add(at(sign('CITY HALL', 13, 1.25, { bg: '#e2dccc', fg: '#3a3328' }), 0, 14.2, fz + 6.42));
  const banner = sign(['100TH ANNIVERSARY', '1926 - 2026'], 15, 3.2, { bg: '#9a1e22', fg: '#f2c230', border: '#f2c230' }); g.add(at(banner, 0, 11.2, fz + 6.5));
  const doorway = at(box(6.4, 8.2, 0.3, '#0a0605'), 0, 5.0, fz + 0.1), doors = grp(at(box(3.0, 7.6, 0.3, '#6a4428', 0.05), -1.55, 4.7, fz + 0.3), at(box(3.0, 7.6, 0.3, '#6a4428', 0.05), 1.55, 4.7, fz + 0.3)); g.add(doorway, doors);
  const breachHole = at(box(13, 13, 0.4, '#140805'), 0, 6.5, fz + 0.12); g.add(breachHole);
  const inner = new THREE.PointLight('#ff6a1a', 0, 40, 1.4); inner.position.set(0, 6, fz + 3); g.add(inner);
  const tower = grp(at(box(8, 9, 8, '#d8d2c4'), 0, 4.5, 0), at(box(9, 0.8, 9, '#bfb8a8'), 0, 9.4, 0)); const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 5, 4), mat('#3a4a5a')); roof.rotation.y = Math.PI / 4; roof.position.y = 12.3; tower.add(roof);
  const cf = new THREE.Mesh(new THREE.CircleGeometry(2.8, 40), new THREE.MeshBasicMaterial({ map: clockFace(), toneMapped: false, color: new THREE.Color(1.25, 1.25, 1.2) })); cf.position.set(0, 4.8, 4.06); tower.add(cf);
  g.add(at(tower, 0, Ht + 1.2, Bz));
  for (const x of [-18, 18]) { g.add(at(lampPost(10), x, 0, 14)); const L = new THREE.PointLight('#ffd9a0', 240, 30, 2); L.position.set(x, 10.2, 14); g.add(L); }
  g.add(at(box(0.3, 20, 0.3, '#ddd'), 24, 10, 10), at(box(4.5, 2.6, 0.1, '#3d6fe0'), 26.3, 18.5, 10));
  for (const [x, z] of [[-30, 4], [31, 0], [-36, 20], [38, 22]]) g.add(at(tree(10, '#24452a'), x, 0, z));
  for (let i = -3; i <= 3; i++) if (i) g.add(at(house({ color: ['#3e66c9', '#c97a8e', '#d9b56a', '#8fbf9a'][(i + 3) % 4], lit: 0.5, seed: i + 90, roof: '#252a36' }), i * 24, 0, 52, Math.PI));
  const crack = crackDecal(30, 11); g.add(at(crack, 2, 0.05, 4)); const glowL = new THREE.PointLight('#ff6a1a', 0, 60, 1.5); glowL.position.set(2, 5, 8); g.add(glowL);
  const rubble = rubbleSet(g, 16, 5, ['#d8d2c4', '#bfb8a8', '#ece6d8']);
  const set = { group: g, light: o.light || 'townNight', banner, crack, glowL, fz,
    reset() { doors.visible = true; breachHole.visible = false; cols[2].visible = cols[3].visible = true; inner.intensity = 0; crack.visible = false; glowL.intensity = 0; rubble.forEach(b => { b.visible = false; }); },
    // dt = seconds since the punch landed
    breach(dt, t = 0) { if (dt < 0) return; doors.visible = false; breachHole.visible = true; cols[2].visible = cols[3].visible = false; inner.intensity = 300;
      rubble.forEach((b, i) => { const u = b.userData, k = E.out(remap(dt, 0, 0.7)); b.visible = true; const tx = Math.cos(u.a) * (6 + u.rad * 10), tz = fz + 6 + Math.abs(Math.sin(u.a)) * 10 * u.rad; b.position.set(lerp(0, tx, k), lerp(6 + (i % 4), u.s * 0.4, k) + Math.sin(k * Math.PI) * u.h * 2, lerp(fz + 1, tz, k)); b.rotation.set(u.rx * k * 2, u.ry * k * 2, 0); }); },
    hole(k, t = 0) { crack.visible = k > 0.01; crack.scale.setScalar(0.3 + 0.7 * k); glowL.intensity = 600 * k * (0.85 + 0.15 * Math.sin(t * 9)); },
  };
  return set;
}
// the mayor's broadcast room inside city hall: seal, flags, podium with a mic, a studio camera, a dark back corner
export function office() {
  const g = room({ w: 40, d: 26, h: 13, floorTex: TEX.wood('#5a3a24'), tile: 6, wallColor: '#33415f', trim: '#222b42', trimY: 4, lights: 0, ceiling: '#141824' });
  g.add(at(sign(['CITY OF', 'MAPLE HOLLOW'], 7.5, 3.4, { bg: '#26304e', fg: '#e2c46a', border: '#e2c46a' }), 0, 8.6, -5.8));
  for (const x of [-5.5, 5.5]) g.add(at(box(0.25, 10, 0.25, '#d8c070'), x, 5, -4.6), at(box(2.6, 3.6, 0.12, x < 0 ? '#3d6fe0' : '#9a1e22'), x + 1.4, 8, -4.6));
  for (const x of [-9.5, 9.5]) g.add(at(box(3, 12.8, 0.8, '#6a1820', 0.2), x, 6.4, -5.4));
  g.add(at(box(3.4, 3.2, 1.8, '#6a4428', 0.12), 0, 1.6, 1.9), at(box(3.8, 0.3, 2.2, '#4a2e1a', 0.08), 0, 3.3, 1.9), at(sign('MH', 1.6, 1.2, { bg: '#e2c46a', fg: '#26304e' }), 0, 1.9, 2.82));
  g.add(at(box(0.08, 0.7, 0.08, '#222'), 1.2, 3.8, 1.6), at(new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat('#111')), 1.2, 4.2, 1.5));
  const cam = tvCamera(); g.add(at(cam, 0.5, 0, 10.5, Math.PI));
  g.add(at(bookshelf(5, 8), 15, 0, -4.8), at(bookshelf(5, 8), -15, 0, -4.8));
  const key = new THREE.PointLight('#ffe8c8', 110, 26, 1.8); key.position.set(1, 9, 7); g.add(key);
  const cold = new THREE.PointLight('#8fb0ff', 0, 30, 1.6); cold.position.set(-12, 9, 5); g.add(cold); PRE.push(() => { cold.intensity = 0; });
  return { group: g, light: 'office', cold };
}
// the monster's lair under the town: rock walls, lava cracks, a stone pedestal
export function lair(o = {}) {
  const g = grp(at(floor(140, 100, TEX.concrete('#3a2e2a'), 5), 0, 0, -10)), r = rng(17);
  for (let i = 0; i < 26; i++) { const s = 6 + r() * 10; const b = box(s, s * (1 + r()), s, ['#2a201c', '#33261f', '#241b18'][i % 3], 0.8); const a = Math.PI * (0.05 + 0.9 * (i / 25)); b.position.set(Math.cos(a) * -48, s * 0.4, -36 + Math.sin(a) * -8 + (i % 2) * 6); if (i > 12) b.position.set((r() - 0.5) * 110, s * 0.5, -40 - r() * 10); g.add(b); }
  for (const x of [-44, 44]) for (let k = 0; k < 4; k++) g.add(at(box(10, 18 + k * 3, 12, '#2a201c', 0.8), x + (x < 0 ? -k * 4 : k * 4), 9, 18 - k * 14));
  const crack = crackDecal(46, 21); g.add(at(crack, 0, 0.04, -4)); for (const [x, z] of [[-10, -2], [10, -6], [0, 8]]) { const L = new THREE.PointLight('#ff5a14', 380, 40, 1.6); L.position.set(x, 3, z); g.add(L); }
  const ped = grp(at(box(3, 3, 3, '#4a3a30', 0.3), 0, 1.5, 0)); const doc = contract(); doc.position.set(0, 5.6, 0.3); doc.rotation.x = -0.15; ped.add(doc); g.add(at(ped, 16, 0, 6, -0.35));
  return { group: g, light: o.light || 'lair' };
}
// basement: grey walls, sofa, a TV on the front wall whose picture we control (news / static / cctv / emergency)
export function basement() {
  const s = TOWN.roomNight({ wall: '#5b6070', floor: '#5a5a60', rug: '#7a3a3a' }), g = s.group;
  g.add(at(wall(30, 12, '#535866', { trim: '#3a3e4a', trimY: 0.6 }), 0, 0, 15.5, Math.PI));
  g.add(at(sofa('#3a5a8a'), 0, 0, 2.2), at(bookshelf(4, 6), -11, 0, -4.8), at(box(5, 3, 3, '#6a5a44'), 10, 1.5, -3.5));
  for (let i = 0; i < 8; i++) g.add(at(box(0.7, 1.0, 0.7, ['#c33a3a', '#e2b23a', '#3a7ac3'][i % 3], 0.1), 8.2 + (i % 4) * 1.2, 3.5 + Math.floor(i / 4) * 1.1, -3.5));
  const scr = document.createElement('canvas'); scr.width = 384; scr.height = 216; const sg = scr.getContext('2d'), st = new THREE.CanvasTexture(scr); st.colorSpace = THREE.SRGBColorSpace;
  const tvG = grp(at(box(7.4, 1.8, 2, '#5a3a22'), 0, 0.9, 0), at(box(7, 4.2, 0.4, '#111114', 0.1), 0, 4.1, 0));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 3.66), new THREE.MeshBasicMaterial({ map: st, toneMapped: false, color: new THREE.Color(0.95, 0.95, 0.95) })); screen.position.set(0, 4.1, 0.21); tvG.add(screen);
  g.add(at(tvG, 0, 0, 13.6, Math.PI));
  const tvL = new THREE.PointLight('#9fc0ff', 0, 22, 1.6); tvL.position.set(0, 4.5, 11); g.add(tvL);
  let last = '';
  const fig = (x, y, s, suit = '#22283c', hair = '#e0e0e4') => { sg.fillStyle = suit; sg.fillRect(x - 26 * s, y, 52 * s, 60 * s); sg.fillStyle = '#f6cfa9'; sg.fillRect(x - 20 * s, y - 42 * s, 40 * s, 40 * s); sg.fillStyle = hair; sg.fillRect(x - 21 * s, y - 46 * s, 42 * s, 10 * s); sg.fillStyle = '#16161a'; sg.fillRect(x - 11 * s, y - 28 * s, 6 * s, 7 * s); sg.fillRect(x + 5 * s, y - 28 * s, 6 * s, 7 * s); sg.fillRect(x - 8 * s, y - 14 * s, 16 * s, 3 * s); };
  const draw = {
    off() { sg.fillStyle = '#050608'; sg.fillRect(0, 0, 384, 216); },
    news() { const gr = sg.createLinearGradient(0, 0, 0, 216); gr.addColorStop(0, '#2a3f7a'); gr.addColorStop(1, '#16224a'); sg.fillStyle = gr; sg.fillRect(0, 0, 384, 216); sg.fillStyle = '#e2c46a'; sg.fillRect(140, 26, 104, 46); fig(192, 108, 1.2); sg.fillStyle = '#6a4428'; sg.fillRect(150, 150, 84, 40);
      sg.fillStyle = '#d8262c'; sg.fillRect(0, 160, 384, 22); sg.fillStyle = '#fff'; sg.font = '900 15px Montserrat'; sg.textBaseline = 'middle'; sg.fillText('BREAKING NEWS', 10, 171); sg.fillStyle = '#f4f4f4'; sg.fillRect(0, 182, 384, 22); sg.fillStyle = '#1b1b1b'; sg.font = '800 13px Montserrat'; sg.fillText('MAYOR: STAY IN YOUR HOMES', 10, 193); sg.fillStyle = '#d8262c'; sg.fillRect(12, 12, 40, 18); sg.fillStyle = '#fff'; sg.font = '900 12px Montserrat'; sg.fillText('LIVE', 18, 21); },
    static(f) { const im = sg.createImageData(384, 216), r = rng(7 + f * 13); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } sg.putImageData(im, 0, 0); },
    emergency(f) { sg.fillStyle = Math.floor(f / 15) % 2 ? '#a01418' : '#d8262c'; sg.fillRect(0, 0, 384, 216); sg.fillStyle = '#111'; sg.fillRect(0, 70, 384, 76); sg.fillStyle = '#f2c230'; sg.font = '900 26px Montserrat'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('EMERGENCY', 192, 96); sg.fillText('BROADCAST', 192, 124); sg.textAlign = 'left'; },
  };
  s.tv = (state, t = 0) => { const f = Math.floor(t * 30), key = state + (state === 'static' ? f : state === 'emergency' ? Math.floor(f / 15) : ''); if (key !== last) { last = key; draw[state](f); st.needsUpdate = true; }
    tvL.color.set({ off: '#000000', news: '#9fc0ff', static: '#d0d0d0', emergency: '#ff3a3a' }[state]); tvL.intensity = state === 'off' ? 0 : state === 'static' ? 160 + (f % 3) * 40 : 200; };
  s.reset = () => s.tv('off');
  return s;
}
export { remap, E, lerp, clamp };
