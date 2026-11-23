// story.js: "House Number 13" (town-story-shorts style, ~90 s).
//
// THE SCRIPT (approved):
//   In this town, there's one house that nobody is allowed to enter. House Number 13. Mayor Grimley tells everyone
//   it's cursed. He says anyone who goes inside will disappear forever. So every kid walks past it a little faster,
//   and every grown-up crosses the street. But I always wondered why a mayor would care so much about one old house.
//   So one night, I climbed out of my bedroom window and walked straight to House Number 13. The front door wasn't
//   even locked. Inside, everything was covered in dust. The stairs, the sofa, the paintings on the walls. Everything
//   except one room at the end of the hall. That room was spotless. The walls were covered with dozens of newspaper
//   articles, all about Mayor Hollis, the old mayor who mysteriously disappeared twenty years ago, on the same night
//   Grimley became mayor. And on the desk, there was a cup of tea. It was still warm. [hold] Then I heard footsteps
//   behind me. An old man was standing in the doorway, holding a candle. He said, "Please don't go outside. The town
//   is cursed." It was Mayor Hollis. Grimley had told him that anyone who stepped outside would disappear forever.
//   So for twenty years, he stayed inside, and the whole town stayed out. Hollis and the whole town were scared of
//   the exact same lie. So I took his hand, opened the front door, and walked him into the street. Nothing happened.
//   The next morning, the whole town came to see him. Grimley took one look at us and ran so fast he left a shoe
//   behind. Nobody has seen him since. Some people say he disappeared forever. [hold]
import * as THREE from 'three';
import { start, shot, frame, LIGHTS } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, house, car, skyDome, hills, handheld, follow, drone, makeVeil } from './town.js';
import { TEX, floor, lampPost, tree, bush, room, desk, chair, sofa, bookshelf, building, bunting, rug, windowPane } from './sets.js';
import { canvasTex, mat, tmat, glow, box, at, grp, sign, rng, shade, clamp, remap, lerp, E, PRE } from './util.js';

Object.assign(LIGHTS, {
  dusty: { amb: 0.38, hemi: 0.32, sun: 0.6, dir: [6, 14, 8], sunColor: '#9fb3e8', bg: '#0b0e18', exposure: 1.02 },
  cleanRoom: { amb: 0.8, hemi: 0.5, sun: 0.95, dir: [-6, 16, 10], sunColor: '#ffd6a0', bg: '#120e0a', exposure: 1.0 },
});

// ───────────── props for this story
const D2 = Math.PI / 2;
function deadTree() { const g = grp(at(box(0.8, 7, 0.8, '#3a2c22'), 0, 3.5, 0)); for (const [y, a, l] of [[5, 0.8, 3.2], [6.2, -0.9, 2.8], [4.2, -0.5, 2.4], [6.8, 0.3, 2]]) { const b = box(0.35, l, 0.35, '#3a2c22'); b.position.set(Math.sin(a) * l / 2, y + Math.cos(a) * l / 2, 0); b.rotation.z = -a; g.add(b); } return g; }
function house13(o = {}) { // the boarded-up house: dark windows with planks, hinged door, "13" plaque, broken fence, KEEP OUT sign
  const w = 14, h = 11, d = 10, color = '#6d6577', g = grp();
  g.add(at(box(w, h, d, color), 0, h / 2, 0));
  const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, d * 0.62, w + 1, 3, 1), mat('#1f2129')); rf.rotation.z = D2; rf.rotation.x = Math.PI / 6 + D2; rf.scale.set(1, 1, 0.75); rf.position.set(0, h + d * 0.28, 0); rf.castShadow = true; g.add(rf);
  g.add(at(box(1.6, 4, 1.6, '#3f3a46'), w * 0.28, h + 3, -1));
  const wood = '#7a5a3a';
  for (let fl = 0; fl < 2; fl++) for (let c = 0; c < 3; c++) {
    if (fl === 0 && c === 1) continue; const wx = (c - 1) * (w / 3.2), wy = 3.2 + fl * 4.8;
    g.add(at(box(2.2, 2.6, 0.2, '#8d8794'), wx, wy, d / 2 + 0.05), at(box(1.8, 2.2, 0.12, mat('#0c0f18')), wx, wy, d / 2 + 0.14));
    const p1 = box(2.6, 0.35, 0.12, wood); p1.position.set(wx, wy, d / 2 + 0.26); p1.rotation.z = 0.55; const p2 = box(2.6, 0.35, 0.12, wood); p2.position.set(wx, wy, d / 2 + 0.3); p2.rotation.z = -0.55; g.add(p1, p2);
  }
  // doorway: dark opening + frame bars + hinged door (pivot on the left edge)
  const open = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.2), new THREE.MeshBasicMaterial({ color: '#05070d' })); open.position.set(0, 2.1, d / 2 + 0.02);
  g.add(open, at(box(0.25, 4.5, 0.3, '#8d8794'), -1.17, 2.25, d / 2 + 0.1), at(box(0.25, 4.5, 0.3, '#8d8794'), 1.17, 2.25, d / 2 + 0.1), at(box(2.6, 0.25, 0.3, '#8d8794'), 0, 4.4, d / 2 + 0.1));
  const doorP = grp(); doorP.position.set(-1.05, 0, d / 2 + 0.1); const dm = box(2.1, 4.2, 0.16, '#4a3020'); dm.position.set(1.05, 2.1, 0); const knob = box(0.2, 0.2, 0.2, '#c9a23a'); knob.position.set(1.8, 2.1, 0.12); doorP.add(dm, knob); g.add(doorP);
  g.door = doorP;
  const plaque = sign('13', 1.8, 1.3, { bg: '#2a2530', fg: '#d9cfae', border: '#d9cfae' }); plaque.position.set(0, 5.4, d / 2 + 0.06); g.add(plaque);
  g.add(at(box(4.4, 0.4, 2.2, '#56505e'), 0, 0.2, d / 2 + 1.1));
  return g;
}
function brokenFence() { const g = grp(); for (const s of [-1, 1]) { g.add(at(box(5.2, 0.25, 0.2, '#8a8076'), s * 4.2, 2.2, 0), at(box(5.2, 0.25, 0.2, '#8a8076'), s * 4.2, 1.2, 0)); for (let i = 0; i < 6; i++) { const p = box(0.35, 2.8 - (i % 3) * 0.3, 0.15, '#9a9086'); p.position.set(s * (1.8 + i * 0.9), 1.3, 0.1); p.rotation.z = (i % 2 ? 0.12 : -0.08) * s; g.add(p); } } return g; }
function street13(time = 'night') {
  const night = time === 'night', day = time === 'day', g = grp(skyDome(time), hills(night ? '#1d3320' : '#5c8a4a'));
  const conc = night ? '#8a8c92' : '#cfcbc4';
  g.add(at(floor(260, 140, TEX.grass(night ? '#2b4a26' : '#5aa04a'), 6), 0, -0.03, -40), at(floor(260, 5, TEX.concrete(conc), 4), 0, 0.02, 4.5), at(floor(260, 12, TEX.road(), 6), 0, 0.01, 13), at(floor(260, 5, TEX.concrete(conc), 4), 0, 0.02, 21.5));
  g.add(at(floor(2.4, 6, TEX.concrete(shade(conc, -0.15)), 2), 0, 0.03, -0.9));
  for (let i = -14; i <= 14; i++) g.add(at(box(3, 0.04, 0.4, '#e8c33a'), i * 8, 0.04, 13));
  const cols = ['#c97a8e', '#3e66c9', '#d9b56a', '#8fbf9a', '#b07ad0', '#e09a6a', '#7aa0d8'], r = rng(4), lit = night ? 0.55 : 0;
  for (let i = -6; i <= 6; i++) { const z = -8 - r() * 3; if (i === 0) continue; g.add(at(house({ color: cols[(i + 7) % cols.length], lit, seed: i + 9, roof: night ? '#252a36' : '#5a3a2e' }), i * 19, 0, z)); }
  for (let i = -6; i <= 6; i++) g.add(at(house({ color: cols[(i + 10) % cols.length], lit, seed: i + 30, roof: night ? '#252a36' : '#5a3a2e' }), i * 19 + 9, 0, 33, Math.PI));
  const h13 = house13(); g.add(at(h13, 0, 0, -9));
  g.add(at(brokenFence(), 0, 0, 1.3), at(deadTree(), -5, 0, -1.5));
  const ko = sign('KEEP OUT', 3.2, 1.3, { bg: '#e8d9a8', fg: '#8a1f12', border: '#8a1f12' }); g.add(at(ko, 4.6, 2.6, 0.2), at(box(0.25, 2.6, 0.25, '#5a4030'), 4.6, 1.3, 0.1));
  for (const x of [-40, -16, 8, 32]) { g.add(at(lampPost(10), x, 0, 6.6)); if (night) { const L = new THREE.PointLight('#ffd9a0', 220, 26, 2); L.position.set(x, 10.2, 6.6); g.add(L); } }
  g.add(at(car('#2f9e55'), -10, 0, 9.4, D2), at(car('#d23a3a'), 22, 0, 16.6, -D2), at(car('#e8e8ea'), 40, 0, 9.4, D2), at(tree(9, night ? '#24452a' : '#3f9b3f'), -28, 0, 1), at(tree(10, night ? '#24452a' : '#3f9b3f'), 18, 0, 0.5), at(bush(night ? '#24452a' : '#3f9b3f'), -12, 0, 2));
  const shoe = grp(at(box(0.9, 0.5, 1.9, '#1a1a20', 0.2), 0, 0.32, 0.1), at(box(0.9, 0.9, 0.8, '#1a1a20', 0.2), 0, 0.5, -0.55), at(box(0.98, 0.14, 2.1, '#d8d4cc'), 0, 0.07, 0.05), at(box(0.6, 0.05, 0.55, '#b3262e'), 0, 0.96, -0.55), at(box(0.5, 0.06, 0.12, '#f2f2f2'), 0, 0.6, 0.3), at(box(0.5, 0.06, 0.12, '#f2f2f2'), 0, 0.62, 0.0)); shoe.rotation.y = 0.5; at(shoe, 17, 0.02, 10.2); shoe.rotation.y = 0.5; g.add(shoe); shoe.visible = false;
  return { group: g, light: night ? 'townNight' : day ? 'overcast' : 'sunset', h13, shoe, reset() { h13.door.rotation.y = 0; shoe.visible = false; } };
}
// newspaper clipping texture: masthead, headline, optional photo (blocky portrait), grey text lines
function portrait(g, x, y, s, who, colour = false) {
  const sk = colour ? '#f2cfa4' : '#c9c3b6', dk = '#2a2a2a';
  g.fillStyle = colour ? '#6a8a9a' : '#9d978b'; g.fillRect(x, y, s, s);
  g.fillStyle = colour ? (who === 'grimley' ? '#23232b' : '#7a3b3b') : '#4a4640'; g.fillRect(x + s * 0.15, y + s * 0.78, s * 0.7, s * 0.22);
  g.fillStyle = sk; g.beginPath(); g.roundRect(x + s * 0.27, y + s * 0.22, s * 0.46, s * 0.56, s * 0.09); g.fill();
  g.fillStyle = dk; for (const e of [-1, 1]) { g.beginPath(); g.ellipse(x + s * (0.5 + e * 0.1), y + s * 0.45, s * 0.03, s * 0.04, 0, 0, 7); g.fill(); }
  g.strokeStyle = dk; g.lineWidth = s * 0.025; g.beginPath(); g.arc(x + s * 0.5, y + s * 0.55, s * 0.09, 0.2, Math.PI - 0.2); g.stroke();
  if (who === 'hollis') { g.fillStyle = colour ? '#f2f2f4' : '#ecebe6'; g.fillRect(x + s * 0.25, y + s * 0.17, s * 0.5, s * 0.1); g.strokeStyle = dk; g.lineWidth = s * 0.02; for (const e of [-1, 1]) { g.beginPath(); g.arc(x + s * (0.5 + e * 0.1), y + s * 0.45, s * 0.06, 0, 7); g.stroke(); } }
  if (who === 'grimley') { g.fillStyle = '#141418'; g.fillRect(x + s * 0.3, y + s * 0.02, s * 0.4, s * 0.22); g.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.05); g.fillRect(x + s * 0.4, y + s * 0.6, s * 0.2, s * 0.04); }
}
function clipping(headline, o = {}) {
  const W = 512, H = 640, t = canvasTex(W, H, g => {
    g.fillStyle = o.paper || '#ece4d0'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(120,100,60,0.08)'; g.fillRect(0, H * 0.85, W, H * 0.15);
    g.fillStyle = '#2a2622'; g.font = '700 30px Montserrat'; g.textAlign = 'center'; g.fillText('THE TOWN TIMES', W / 2, 46); g.fillRect(24, 60, W - 48, 4);
    const lines = headline.split('\n'); let size = 74; g.font = `900 ${size}px Montserrat`; while (Math.max(...lines.map(l => g.measureText(l).width)) > W - 50) { size -= 2; g.font = `900 ${size}px Montserrat`; }
    lines.forEach((l, i) => g.fillText(l, W / 2, 80 + size * (i + 1) * 1.02));
    let y = 92 + size * lines.length * 1.02;
    if (o.sub) { g.font = '700 28px Montserrat'; g.fillStyle = '#7a1f12'; g.fillText(o.sub, W / 2, y + 22); y += 40; }
    if (o.photo) { portrait(g, 40, y + 6, 200, o.photo); y += 0; }
    g.fillStyle = 'rgba(40,36,30,0.45)'; const r = rng(o.seed || 3);
    for (let yy = y + 14; yy < H - 30; yy += 22) { const x0 = o.photo && yy < y + 210 ? 260 : 40; g.fillRect(x0, yy, (W - 40 - x0) * (0.75 + r() * 0.25), 9); }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(o.w || 2.6, (o.w || 2.6) * 1.25), tmat(t));
}
function cobweb(s = 3) { const t = canvasTex(256, 256, g => { g.strokeStyle = 'rgba(230,230,235,0.55)'; g.lineWidth = 2; for (let i = 0; i <= 6; i++) { const a = i / 6 * D2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 256, Math.sin(a) * 256); g.stroke(); } for (let r = 40; r < 256; r += 42) { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * D2; const p = [Math.cos(a) * r, Math.sin(a) * r]; i ? g.quadraticCurveTo(Math.cos(a - D2 / 12) * r * 0.85, Math.sin(a - D2 / 12) * r * 0.85, p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); } }); return new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide })); }
function dustMotes(parent, box3, n = 220, seed = 5) {
  const r = rng(seed), base = []; const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) base.push([box3[0] + r() * (box3[1] - box3[0]), box3[2] + r() * (box3[3] - box3[2]), box3[4] + r() * (box3[5] - box3[4]), r() * 6.28]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = canvasTex(32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, map: tex, transparent: true, opacity: 0.7, depthWrite: false, color: '#e8e2d2' })); parent.add(pts);
  return (t) => { for (let i = 0; i < n; i++) { const b = base[i]; pos[i * 3] = b[0] + Math.sin(t * 0.3 + b[3]) * 0.4; pos[i * 3 + 1] = b[1] + Math.sin(t * 0.2 + b[3] * 2) * 0.5; pos[i * 3 + 2] = b[2] + Math.cos(t * 0.25 + b[3]) * 0.4; } geo.attributes.position.needsUpdate = true; };
}
function hallSet() { // House 13 inside: long dusty hall, stairs left, sheeted sofa right, crooked paintings, cobwebs, warm door at the end
  const g = room({ w: 16, d: 38, h: 13, back: -30, floorTex: TEX.wood('#6b5f50'), tile: 6, wallColor: '#59605e', trim: '#3c4241', trimY: 4, lights: 0, ceiling: '#14161a' });
  for (let i = 0; i < 9; i++) g.add(at(box(4, 1.0 * (i + 1), 1.6, '#6e6052'), -5.6, (i + 1) / 2, -4 - i * 1.6));
  const rail = box(0.3, 0.3, 15, '#4a3a2a'); rail.position.set(-3.5, 6, -10.5); rail.rotation.x = -Math.atan2(9, 14.4); g.add(rail); for (let i = 0; i < 9; i += 2) g.add(at(box(0.2, 2.6, 0.2, '#4a3a2a'), -3.5, (i + 1) + 1.3, -4 - i * 1.6));
  const sf = grp(sofa('#8a8478'), at(box(7.4, 2.9, 3.1, '#c9c4b8', 0.4), 0, 1.75, -0.2)); g.add(at(sf, 5.2, 0, -9, -D2));
  const paint = (who, w, h, x, z, ry, tilt) => { const t = canvasTex(256, 320, c => { c.fillStyle = '#5a4a3a'; c.fillRect(0, 0, 256, 320); portrait(c, 18, 40, 220, who, true); c.fillStyle = 'rgba(160,155,145,0.45)'; c.fillRect(0, 0, 256, 320); }); const p = grp(at(box(w + 0.5, h + 0.5, 0.25, '#8a6a2a'), 0, 0, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(w, h), tmat(t)), 0, 0, 0.14)); p.position.set(x, 7, z); p.rotation.set(0, ry, tilt); g.add(p); };
  paint('hollis', 3, 3.8, 7.85, -4.5, -D2, 0.08); paint(null, 2.6, 2.6, 7.85, -16, -D2, -0.12); paint(null, 2.8, 3.4, -7.85, -18, D2, 0.1);
  for (const [x, z, ry] of [[-7.9, -2, D2], [7.9, -12, -D2], [-7.9, -24, D2]]) { const c = cobweb(3.2); c.position.set(x, 11.4, z); c.rotation.y = ry; g.add(c); }
  g.add(at(rug(6, 14, '#6a6458'), 0, 0, -14), at(box(1.6, 6.4, 1, '#4a3a2a'), 6.6, 3.2, -22));
  const glowDoor = grp(at(box(0.3, 8, 0.4, '#3c2a1a'), -2, 4, 0), at(box(0.3, 8, 0.4, '#3c2a1a'), 2, 4, 0), at(box(4.3, 0.3, 0.4, '#3c2a1a'), 0, 8, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(3.7, 7.85), glow('#ffcf8a', 1.35)), 0, 3.92, -0.05));
  g.add(at(glowDoor, 0, 0, -29.8)); const L = new THREE.PointLight('#ffc27a', 160, 20, 2); L.position.set(0, 5, -26.5); g.add(L);
  const dust = dustMotes(g, [-7, 7, 0.5, 11, -28, 6]);
  return { group: g, light: 'dusty', update: t => dust(t) };
}
function cleanSet() { // the spotless room: clippings wall, doorway at right of back wall, desk with lamp and teacup
  const g = room({ w: 28, d: 20, h: 12, back: -6, floorTex: TEX.wood('#9a6a40'), tile: 6, wallColor: '#c7a472', trim: '#7a4f2a', trimY: 3.2, lights: 0, ceiling: '#2a2018' });
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(4, 8.5), new THREE.MeshBasicMaterial({ color: '#07090f' })); opening.position.set(8, 4.25, -5.92); g.add(opening);
  g.add(at(box(0.35, 8.9, 0.3, '#6a4426'), 5.9, 4.45, -5.85), at(box(0.35, 8.9, 0.3, '#6a4426'), 10.1, 4.45, -5.85), at(box(4.6, 0.35, 0.3, '#6a4426'), 8, 8.75, -5.85));
  const heads = ['WHERE IS\nMAYOR HOLLIS?', 'SEARCH\nGOES ON', 'TOWN MISSES\nHOLLIS', 'STILL NO\nSIGN', 'HOLLIS:\nONE YEAR', 'NO CLUES\nFOUND', 'CANDLES FOR\nHOLLIS', 'MISSING\n10 YEARS', 'WHO SAW\nHOLLIS?', 'MAYOR GONE', 'POLICE\nBAFFLED', 'HOLLIS\nMYSTERY'];
  const r = rng(12); let k = 0;
  for (let row = 0; row < 3; row++) for (let c = 0; c < 6; c++) { if (k >= heads.length && r() < 2) { } const m = clipping(heads[k % heads.length], { seed: k + 2, photo: k % 3 === 0 ? 'hollis' : null, w: 2.3, paper: ['#ece4d0', '#e4dcc6', '#f0e8d6'][k % 3] }); m.position.set(-12.5 + c * 2.75 + (r() - 0.5) * 0.4, 2.6 + row * 3.4 + (r() - 0.5) * 0.4, -5.9 + k * 0.0004); m.rotation.z = (r() - 0.5) * 0.16; g.add(m); k++; }
  const big = (txt, o, x, y, tilt) => { const m = clipping(txt, o); m.position.set(x, y, -5.84); m.rotation.z = tilt; g.add(m); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat('#d02a2a')), x, y + (o.w || 2.6) * 0.58, -5.78)); return m; };
  big('MAYOR HOLLIS\nVANISHES', { photo: 'hollis', w: 3.4, seed: 21 }, -8.6, 7.4, 0.04);
  big('GRIMLEY\nBECOMES MAYOR', { sub: 'SAME NIGHT HOLLIS VANISHED', photo: 'grimley', w: 3.1, seed: 22 }, 0.6, 5.4, -0.05);
  big('OUR MAYOR\nHOLLIS', { photo: 'hollis', w: 2.5, seed: 23 }, 3.9, 7.8, 0.06);
  g.add(at(desk('#7a4a2a'), 9.5, 0, 2.5), at(chair('#5a3a22'), 9.5, 0, 0.6), at(bookshelf(4, 6), -13.2, 0, 1, D2), at(rug(8, 6, '#8a2f2f'), 2, 0, 3));
  const lamp = grp(at(box(0.8, 0.2, 0.8, '#2a2a2a'), 0, 0.1, 0), at(box(0.15, 1.6, 0.15, '#2a2a2a'), 0, 0.9, 0)); const shadeM = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.8, 16, 1, true), glow('#ffd59a', 1.25)); shadeM.position.y = 1.9; lamp.add(shadeM); g.add(at(lamp, 7.4, 2.71, 2.0));
  const L = new THREE.PointLight('#ffcf90', 70, 22, 2); L.position.set(7.4, 5.5, 3.4); g.add(L);
  const cup = grp(at(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 20), mat('#f4f2ee')), 0, 0.04, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.6, 20), mat('#f4f2ee')), 0, 0.38, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.02, 20), mat('#7a4a22')), 0, 0.62, 0));
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 14), mat('#f4f2ee')); hd.position.set(0.46, 0.4, 0); cup.add(hd); g.add(at(cup, 9.0, 2.71, 3.2));
  g.add(at(box(1.4, 0.3, 1.0, '#2e5a8a'), 11.2, 2.86, 2.4), at(box(1.3, 0.25, 0.95, '#8a2e2e'), 11.2, 3.13, 2.4));
  const stTex = canvasTex(64, 64, c => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  const steam = []; for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: stTex, transparent: true, depthWrite: false, opacity: 0.5 })); g.add(s); steam.push(s); }
  const upd = t => { steam.forEach((s, i) => { const k = ((t * 0.45 + i / 5) % 1); s.position.set(9.0 + Math.sin(t * 2 + i) * 0.15 * k, 3.4 + k * 2.2, 3.2); s.scale.setScalar(0.4 + k * 0.9); s.material.opacity = Math.sin(k * Math.PI) * 0.45; }); };
  return { group: g, light: 'cleanRoom', opening, update: upd, reset() { opening.material.color.set('#07090f'); } };
}
function hallTown() { // town hall plaza at sunset: building, columns, podium with mic, bunting
  const g = grp(skyDome('sunset'), hills('#6f9a54', -160), at(floor(260, 160, TEX.grass('#5c9a48'), 6), 0, -0.03, -20), at(floor(70, 34, TEX.concrete('#d8d0c4'), 4), 0, 0.01, 2));
  g.add(at(building(44, 18, 10, '#e6dccb', { sign: 'TOWN HALL', signFg: '#2a3a6a', windows: [6, 2], doorColor: '#7a2a2a', signY: 12.6 }), 0, 0, -16));
  for (const x of [-9, -4, 4, 9]) g.add(at(box(1.4, 11, 1.4, '#f4efe6'), x, 5.5, -10));
  g.add(at(box(26, 0.6, 3, '#cfc6b8'), 0, 0.3, -9), at(box(26, 0.3, 2, '#cfc6b8'), 0, 0.75, -9.6));
  g.add(at(box(2.8, 3.0, 1.6, '#6a2a2a', 0.1), 0, 1.5, -3), at(box(0.1, 1.0, 0.1, '#222'), 1.1, 3.5, -2.6), at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat('#333')), 1.1, 4.0, -2.5));
  const seal = sign('★', 1.4, 1.4, { bg: '#c9a23a', fg: '#6a2a2a' }); g.add(at(seal, 0, 1.9, -2.18));
  g.add(at(bunting(30), 0, 9.2, -9), at(lampPost(), -14, 0, 0), at(lampPost(), 14, 0, 0), at(tree(10), -24, 0, -6), at(tree(11), 24, 0, -5));
  return { group: g, light: 'sunset' };
}
// flashlight in the narrator's right hand (beam along the arm) and candle in Hollis' right hand
function flashlight(av) {
  const g = grp(at(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 12), mat('#22252c')), 0, -0.1, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), glow('#fff6d8', 2.2)), 0, -0.58, 0));
  const cg = new THREE.ConeGeometry(2.2, 12, 24, 1, true); cg.translate(0, -6, 0);
  const beam = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.position.y = -0.6; g.add(beam);
  const L = new THREE.PointLight('#e8f0ff', 35, 20, 2); L.position.y = -2.5; g.add(L);
  av.handR.add(g); g.visible = false; PRE.push(() => { g.visible = false; }); return g;
}
function candle(av) {
  const g = grp(at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16), mat('#c9a23a')), 0, 0, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.0, 12), mat('#f4efe0')), 0, 0.52, 0));
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), glow('#ffc060', 1.7)); fl.scale.y = 1.8; fl.position.y = 1.2; g.add(fl);
  const L = new THREE.PointLight('#ffb060', 9, 10, 2); L.position.y = 2.2; g.add(L);
  av.handR.add(g); g.visible = false; PRE.push(() => { g.visible = false; }); g.flame = fl; return g;
}
const HOLD = { aR: [70, -4], aL: [0, 6] };
function holdCandle(H, t) { H.cnd.visible = true; H.cnd.rotation.x = -H.hollis.armR.rotation.x; H.cnd.flame.scale.set(1 + Math.sin(t * 23) * 0.12, 1.8 + Math.sin(t * 17) * 0.25, 1); }

start(() => {
  // ── sets
  const SN = street13('night'), SD = street13('day'), SS = street13('sunset');
  const TH = hallTown(), BR = TOWN.roomNight({ wall: '#3e4f8f', bed: '#3553b8', shelf: true }), HL = hallSet(), CR = cleanSet();
  // ── cast: one copy per set, identical options
  const DEF = {
    milo: () => makeAvatar({ seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a', height: 0.88 }),
    lady: () => makeAvatar({ seed: 3, skin: 'brown', hair: 'bob', hairColor: '#2a1a12', top: 'dress', topColor: '#2f9e8a', bottom: 'skirt', bottomColor: '#2f9e8a', shoe: '#3a2a22', height: 1.06 }),
    fan1: () => makeAvatar({ seed: 4, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a', height: 0.9 }),
    fan2: () => makeAvatar({ seed: 5, skin: 'deep', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' }),
    fan3: () => makeAvatar({ seed: 7, skin: 'fair', hair: 'bald', hairColor: '#8a6a4a', top: 'sweater', topColor: '#c9a23a', bottom: 'cargo', bottomColor: '#5a5a4a', height: 1.05, glasses: true }),
    grim: () => { const a = makeAvatar({ seed: 8, skin: 'light', hair: 'swoop', hairColor: '#141418', top: 'suit', topColor: '#23232b', tie: '#b3262e', sleeves: 'long', bottom: 'slacks', bottomColor: '#23232b', shoe: '#141418', sole: '#3a3a40', height: 1.12, face: 'smug' }); const hat = grp(at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.05, 24), mat('#141418')), 0, 0.5, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 24), mat('#141418')), 0, 0, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.18, 24), mat('#b3262e')), 0, 0.15, 0)); hat.position.y = 1.18; a.head.add(hat); return a; },
    hollis: () => makeAvatar({ seed: 9, skin: 'fair', hair: 'wavy', hairColor: '#e9e9ee', top: 'cardigan', topColor: '#7a3b3b', inner: '#efe3c6', sleeves: 'long', bottom: 'slacks', bottomColor: '#5a4a3a', shoe: '#3a2a22', glasses: true, height: 0.98, face: 'calm' }),
  };
  const cast = (set, names) => { const X = { me: makeNarrator({ color: '#3553b8', print: 'curious' }) }; for (const n of names) X[n] = DEF[n](); for (const a of Object.values(X)) set.group.add(a.root); X.fl = flashlight(X.me); if (X.hollis) X.cnd = candle(X.hollis); X.veil = makeVeil(set.group); return X; };
  const N = cast(SN, ['milo', 'lady', 'grim', 'hollis']), D = cast(SD, ['milo', 'lady', 'fan1', 'fan2', 'fan3', 'grim', 'hollis']), S = cast(SS, ['milo', 'lady', 'fan1', 'fan2']);
  const T = cast(TH, ['milo', 'lady', 'fan1', 'fan2', 'fan3', 'grim']), B = cast(BR, []), H = cast(HL, ['hollis']), C = cast(CR, ['hollis']);
  const grimPodium = (lt, c, face, pose = 'idle', talk = true) => { T.grim.reset().place(0, -4.6, 0).pose(pose).setFace(face).idle(c.t); if (talk) T.grim.talk(c.t); };
  const crowdTH = (c, faces) => [T.milo, T.lady, T.fan1, T.fan2, T.fan3].forEach((a, i) => a.reset().place(-7 + i * 3.5, 8 + (i % 2) * 2.5, Math.PI + (i - 2) * 0.12).setFace(faces[i % faces.length]).idle(c.t));
  const party = (c) => { D.hollis.reset().place(0, 9, 0).pose('wave').setFace('joy').idle(c.t); D.me.reset().place(2.4, 9.3, -0.2).setFace('joy').idle(c.t);
    [D.milo, D.lady, D.fan1, D.fan2, D.fan3].forEach((a, i) => { const ang = Math.PI - 1.3 + i * 0.65; a.reset().place(Math.sin(ang) * 5, 9 + Math.cos(ang) * 4, ang + Math.PI).pose(i % 2 ? 'cheer' : 'open').setFace('joy').idle(c.t); a.hip.position.y += Math.abs(Math.sin(c.t * 6 + i)) * 0.4; }); };
  const door = (set, lt, t0, dur = 0.7, to = 1.25) => { set.h13.door.rotation.y = E.out(remap(lt, t0, t0 + dur)) * to; };

  // ── ACT 1: the rule
  shot({ line: "In this town, there's one house", set: SN, sfx: [['whoosh', 0]], cam: drone([0, 4, -4], { h: 30, back: 44, drift: [6, -2, -8], fov: 52 }) });
  shot({ line: 'that nobody is allowed to enter.', set: SN, cam: { pos: [4, 4.5, 16], look: [0, 6, -6], fov: 50, blur: 0.1, push: 0.08 } });
  shot({ line: 'House Number 13.', set: SN, cam: { pos: [0.8, 5.0, 1.8], look: [0, 5.4, -3.8], fov: 40, blur: 0.15, push: 0.11 } });
  shot({ line: 'Mayor Grimley', set: TH, cam: frame(0, -4.6, { size: 'close', h: 1.12, side: -12 }), act(lt, c) { grimPodium(lt, c, 'smug', 'idle', false); } });
  shot({ line: "tells everyone it's cursed.", set: TH, cam: { pos: [6, 5.5, 15], look: [0, 4.8, -4], fov: 42, blur: 0.25, push: 0.07 },
    act(lt, c) { grimPodium(lt, c, lt < c.w('cursed') ? 'say' : 'serious', 'point'); crowdTH(c, ['calm', 'uneasy']); } });
  shot({ line: 'He says anyone who goes inside', set: TH, cam: frame(0, -4.6, { size: 'close', h: 1.12, side: 16, push: 0.1 }), act(lt, c) { grimPodium(lt, c, 'say', 'open'); } });
  shot({ line: 'will disappear forever.', set: TH, sfx: [['pop', 'forever', 0.5]], cam: { pos: [1, 5.2, 1], look: [0, 4.2, 9], fov: 52, blur: 0.25, push: 0.07 },
    act(lt, c) { crowdTH(c, lt < c.w('forever') ? ['worried', 'uneasy'] : ['gasp', 'worried']); } });
  shot({ line: 'So every kid walks past it', set: SN, cam: follow(lt => [-7 + lt * 3.2, 0, 4.5], [-1.5, 3.4, 11], { lookY: 2.8 }),
    act(lt, c) { N.milo.reset().place(-7 + lt * 3.2, 4.5, D2).walk(c.t, 1.1).setFace('worried').lookAt(0, -6); } });
  shot({ line: 'a little faster,', set: SN, cam: handheld(frame(1, 4.5, { size: 'medium', h: 0.88, side: 30 }), 1.2),
    act(lt, c) { N.milo.reset().place(-1.5 + lt * 5.5, 4.5, D2).run(c.t, 1.1).setFace('gasp'); } });
  shot({ line: 'and every grown-up crosses the street.', set: SN, cam: { pos: [-14, 6, 31], look: [0, 2.5, 8], fov: 50, blur: 0.1, push: 0.06 },
    act(lt, c) { N.lady.reset().place(-4 + lt * 1.7, 5 + lt * 2.6, 0.58).walk(c.t, 1).setFace('uneasy'); } });
  shot({ line: 'But I always wondered', set: SN, cam: frame(2, 21.5, { size: 'close', facing: Math.PI, side: -14 }),
    act(lt, c) { N.me.reset().place(2, 21.5, Math.PI).pose('hips').setFace('calm').idle(c.t); } });
  shot({ line: 'why a mayor would care so much', set: TH, cam: frame(0, -4.6, { size: 'close', h: 1.12, side: 22, push: 0.09 }), act(lt, c) { grimPodium(lt, c, 'sus', 'hips', false); } });
  shot({ line: 'about one old house.', set: SN, cam: { pos: [-3, 1.6, 6], look: [0, 7, -6], fov: 55, blur: 0.05, push: 0.06 } });

  // ── ACT 2: inside House 13
  shot({ line: 'So one night,', set: SN, sfx: [['whoosh', 0, 0.6]], cam: drone([0, 3, -6], { h: 38, back: 52, drift: [-8, -3, -6] }) });
  shot({ line: 'I climbed out of my bedroom window', set: BR, cam: { pos: [12, 6.2, 6], look: [6, 6, -4], fov: 55, blur: 0.3, push: 0.07 },
    act(lt, c) { const k = remap(lt, 0.2, c.d); B.me.reset().place(6, -2.6 - k * 1.6, Math.PI - 0.3, k * 3.2).pose('reach').setFace('calm'); B.me.hip.rotation.x = 0.35 * k; B.me.legR.rotation.x = -1.2 * k; } });
  shot({ line: 'and walked straight to House Number 13.', set: SN, cam: follow(lt => [-5 + lt * 2.6, 0, 4.5], [3, 3.8, 9.5], { lookY: 3.6 }),
    act(lt, c) { N.me.reset().place(-5 + lt * 2.6, 4.5, D2).walk(c.t, 0.95).setFace('calm'); N.fl.visible = true; } });
  shot({ line: 'The front door', set: SN, cam: { pos: [4.6, 5.4, 4.2], look: [0, 3, -3.85], fov: 50, blur: 0.35, push: 0.08 },
    act(lt, c) { N.me.reset().place(-0.9, -1.3, Math.PI - 0.15).pose('point').setFace('calm'); N.fl.visible = true; } });
  shot({ line: "wasn't even locked.", set: SN, sfx: [['rise', 'locked', 0.5]], cam: { pos: [-2.6, 3.8, 4.2], look: [0, 3, -4], fov: 50, blur: 0.3, push: 0.07 },
    act(lt, c) { door(SN, lt, 0.12, 0.6, 1.1); N.me.reset().place(2.8, -1.0, Math.PI + 0.4).pose('point').setFace(lt < c.w('locked') ? 'calm' : 'gasp'); N.fl.visible = true; } });
  shot({ line: 'Inside, everything was covered in dust.', set: HL, cam: { pos: [-3, 5.5, 9], look: [0, 4.5, -6], fov: 55, blur: 0.15, push: 0.07 },
    act(lt, c) { H.me.reset().place(1, -1, Math.PI - 0.2).pose('point').setFace('uneasy'); H.me.head.rotation.y = Math.sin(lt * 1.5) * 0.4; H.fl.visible = true; } });
  shot({ line: 'The stairs,', set: HL, cam: { pos: [1, 4.5, 1], look: [-5, 3.5, -9], fov: 50, blur: 0.15, push: 0.1 } });
  shot({ line: 'the sofa,', set: HL, cam: { pos: [0.5, 4, -3], look: [4.5, 2, -9], fov: 50, blur: 0.15, push: 0.1 } });
  shot({ line: 'the paintings on the walls.', set: HL, cam: { pos: [1.5, 6.5, 0.5], look: [7.8, 7, -4.5], fov: 45, blur: 0.2, push: 0.1 } });
  shot({ line: 'Everything except one room', set: HL, cam: frame(0, -12, { size: 'close', side: 12 }),
    act(lt, c) { H.me.reset().place(0, -12, 0.2).setFace(lt < c.w('except') ? 'calm' : 'uneasy').idle(c.t); H.me.head.rotation.y = remap(lt, c.w('except'), c.w('except') + 0.3) * 0.7; } });
  shot({ line: 'at the end of the hall.', set: HL, cam: { pos: [0.5, 5, 6], look: [0, 4.5, -30], fov: 40, blur: 0.1, push: 0.1 },
    act(lt, c) { H.me.reset().place(0.6, -9 - lt * 2.2, Math.PI).walk(c.t, 0.8).setFace('calm'); H.fl.visible = true; } });
  shot({ line: 'That room was spotless.', set: CR, sfx: [['sparkle', 'spotless', 0.5]], cam: { pos: [-4, 6, 12], look: [3, 5, -5], fov: 55, blur: 0.15, push: 0.06 },
    act(lt, c) { C.me.reset().place(8, -5.1, 0.1).setFace(lt < c.w('spotless') ? 'calm' : 'gasp').idle(c.t); } });
  shot({ line: 'The walls were covered with dozens', set: CR, cam: { pos: [-5, 6.5, 7], look: [-5, 6.8, -6], fov: 55, blur: 0.1, push: 0.07 } });
  shot({ line: 'of newspaper articles,', set: CR, cam: { pos: [-4.5, 6.5, 0], look: [-4.5, 6.4, -6], fov: 45, blur: 0.1, push: 0.1, roll: -2 } });
  shot({ line: 'all about Mayor Hollis,', set: CR, cam: { pos: [3.6, 7.8, -1.6], look: [3.9, 7.8, -5.9], fov: 50, blur: 0.1, push: 0.1 } });
  shot({ line: 'the old mayor who mysteriously disappeared', set: CR, cam: { pos: [-8.2, 7.3, -1.4], look: [-8.6, 7.4, -5.9], fov: 52, blur: 0.1, push: 0.11, roll: 2 } });
  shot({ line: 'twenty years ago,', set: CR, cam: frame(-5, 1, { size: 'close', facing: Math.PI, side: 40 }),
    act(lt, c) { C.me.reset().place(-5, 1, Math.PI).setFace('uneasy').idle(c.t); } });
  shot({ line: 'on the same night Grimley became mayor.', set: CR, sfx: [['thud', 'grimley', 0.6]], cam: { pos: [0.4, 5.5, -1.9], look: [0.6, 5.4, -5.9], fov: 52, blur: 0.1, push: 0.1 } });
  shot({ line: 'And on the desk,', set: CR, cam: { pos: [4, 6.2, 9.5], look: [9.5, 3, 2.5], fov: 50, blur: 0.15, push: 0.07 } });
  shot({ line: 'there was a cup of tea.', set: CR, cam: { pos: [8.1, 4.4, 6.4], look: [9, 3.2, 3.2], fov: 40, blur: 0.4, push: 0.12 } });
  shot({ line: 'It was still warm. //', set: CR, sfx: [['pop', 'warm', 0.5]], cam: frame(6, 5.5, { size: 'close', side: -15, push: 0.1 }),
    act(lt, c) { const w = lt >= c.w('warm'); C.me.reset().place(6, 5.5, -0.3).setFace(w ? 'gasp' : 'calm'); if (!w) C.me.idle(c.t); } });

  // ── ACT 3: the old man
  shot({ line: 'Then I heard footsteps', set: CR, sfx: [['thud', 'heard', 0.7], ['thud', 'footsteps', 0.8]], cam: { pos: [3.5, 5.5, 4], look: [8, 4.5, -6], fov: 45, blur: 0.15, push: 0.1 },
    act(lt, c) { CR.opening.material.color.set(new THREE.Color('#07090f').lerp(new THREE.Color('#b0661c'), remap(lt, 0.2, c.d))); } });
  shot({ line: 'behind me.', set: CR, sfx: [['pop', 'me', 0.5]], cam: frame(6.6, 3, { size: 'close', side: -8, blur: 0.45 }),
    act(lt, c) { C.me.reset().place(6.6, 3, 0).setFace(lt < c.w('me') ? 'uneasy' : 'gasp'); C.hollis.reset().place(8, -5.0, 0).pose(HOLD).setFace('worried'); holdCandle(C, c.t); } });
  shot({ line: 'An old man', set: CR, cam: frame(8, -5.0, { size: 'close', h: 0.98, side: 10 }),
    act(lt, c) { C.hollis.reset().place(8, -5.0, 0).pose(HOLD).setFace('worried').idle(c.t); holdCandle(C, c.t); } });
  shot({ line: 'was standing in the doorway,', set: CR, cam: frame(8, -5.0, { size: 'full', h: 0.98, side: -14 }),
    act(lt, c) { C.hollis.reset().place(8, -5.0, 0).pose(HOLD).setFace('worried').idle(c.t); holdCandle(C, c.t); } });
  shot({ line: 'holding a candle.', set: CR, cam: { pos: [5.9, 4.5, -0.4], look: [6.5, 3.9, -3.5], fov: 40, blur: 0.4, push: 0.1 },
    act(lt, c) { C.hollis.reset().place(8, -5.0, 0).pose(HOLD).setFace('worried').idle(c.t); holdCandle(C, c.t); } });
  shot({ line: 'He said, "Please don\'t go outside.', set: CR, cam: frame(8, -5.0, { size: 'close', h: 0.98, side: 14 }),
    act(lt, c) { C.hollis.reset().place(8, -5.0, 0).pose(HOLD).setFace('say').talk(c.t).idle(c.t); holdCandle(C, c.t); } });
  shot({ line: 'The town is cursed."', set: CR, cam: frame(8, -5.0, { size: 'face', h: 0.98, side: -10, push: 0.1 }),
    act(lt, c) { C.hollis.reset().place(8, -5.0, 0).pose(HOLD).setFace(lt < c.w('cursed') ? 'say' : 'worried').talk(c.t).idle(c.t); holdCandle(C, c.t); } });
  shot({ line: 'It was Mayor Hollis.', set: CR, sfx: [['ding', 'hollis', 0.6]], cam: { pos: [2.6, 5.6, 3.5], look: [6.4, 5.2, -5], fov: 50, blur: 0.15, push: 0.08 },
    act(lt, c) { C.hollis.reset().place(8, -5.0, -0.3).pose(HOLD).setFace('calm').idle(c.t); holdCandle(C, c.t); } });
  shot({ line: 'Grimley had told him', set: SN, cam: { pos: [0.8, 5.2, 8.5], look: [0.4, 4.5, -2.5], fov: 46, blur: 0.25, push: 0.07 },
    act(lt, c) { N.grim.reset().place(2.1, -2.2, -D2 + 0.3).pose('point').setFace('smug').talk(c.t); N.hollis.reset().place(-0.9, -2.6, D2 - 0.3).setFace('calm').idle(c.t); } });
  shot({ line: 'that anyone who stepped outside', set: SN, cam: frame(2.1, -2.2, { size: 'close', h: 1.12, facing: -D2 + 0.3, side: 55 }),
    act(lt, c) { N.grim.reset().place(2.1, -2.2, -D2 + 0.3).pose('open').setFace('say').talk(c.t); } });
  shot({ line: 'would disappear forever.', set: SN, sfx: [['pop', 'forever', 0.5]], cam: frame(-0.9, -2.6, { size: 'close', h: 0.98, facing: D2 - 0.3, side: -55, push: 0.1 }),
    act(lt, c) { N.hollis.reset().place(-0.9, -2.6, D2 - 0.3).pose('shy').setFace(lt < c.w('forever') ? 'worried' : 'gasp').idle(c.t, 0.5); } });
  shot({ line: 'So for twenty years,', set: SD, sfx: [['whoosh', 0, 0.6]], cam: drone([0, 4, -6], { h: 32, back: 46, drift: [8, -2, -6] }) });
  shot({ line: 'he stayed inside,', set: CR, cam: { pos: [12.6, 6.8, 7.4], look: [9.5, 4.4, 0.6], fov: 42, blur: 0.3, push: 0.07 },
    act(lt, c) { C.hollis.reset().place(9.5, 0.6, 0).sit(1.5).pose('slump', 0.35).setFace('sad').idle(c.t, 0.4); } });
  shot({ line: 'and the whole town stayed out.', set: SS, cam: { pos: [9, 6, 25], look: [0, 3.5, 2], fov: 52, blur: 0.05, push: 0.06 },
    act(lt, c) { [S.milo, S.lady, S.fan1, S.fan2].forEach((a, i) => { const x = -14 + i * 6 + lt * 2.2; a.reset().place(x, 4 + (i % 2) * 1.2, D2).walk(c.t + i, 0.9).setFace('uneasy').lookAt(0, -6); }); } });
  shot({ line: 'Hollis and the whole town', set: CR, cam: frame(5, 4.5, { size: 'close', side: 12 }),
    act(lt, c) { C.me.reset().place(5, 4.5, 0.15).pose('hips').setFace('uneasy').idle(c.t); } });
  shot({ line: 'were scared', set: CR, cam: frame(4, -2, { size: 'close', h: 0.98, side: -12 }),
    act(lt, c) { C.hollis.reset().place(4, -2, -0.2).pose('shy').setFace('worried').idle(c.t, 0.5); } });
  shot({ line: 'of the exact same lie.', set: TH, cam: frame(0, -4.6, { size: 'close', h: 1.12, side: -20, push: 0.1 }),
    act(lt, c) { grimPodium(lt, c, lt < c.w('lie') ? 'smug' : 'smirk', 'hips', false); } });

  // ── ACT 4: out the door
  shot({ line: 'So I took his hand,', set: CR, cam: frame(2.05, -1.1, { size: 'medium', side: 4, dist: 1.45 }),
    act(lt, c) { const k = remap(lt, 0, c.w('hand') + 0.2); C.me.reset().place(0.6, -1, D2).pose({ aR: [55 * k, 0] }).setFace('calm').idle(c.t); C.hollis.reset().place(3.5, -1.2, -D2).pose({ aR: [40 * k, 0] }).setFace(k < 1 ? 'worried' : 'calm').idle(c.t); } });
  shot({ line: 'opened the front door,', set: SN, sfx: [['rise', 'opened', 0.4]], cam: { pos: [2.2, 4.6, 6.5], look: [0, 3.2, -4], fov: 48, blur: 0.15, push: 0.08 },
    act(lt, c) { door(SN, lt, 0.05, 0.6, 1.3); N.me.reset().place(0.2, -3.1, 0).pose('point').setFace('calm'); N.me.root.visible = lt > 0.25; N.fl.visible = lt > 0.25; } });
  shot({ line: 'and walked him into the street.', set: SN, cam: follow(lt => [0.4, 0, -1.6 + lt * 2.4], [4.5, 3.8, 10.5], { lookY: 3.4 }),
    act(lt, c) { SN.h13.door.rotation.y = 1.3; const z = -1.6 + lt * 2.4; N.me.reset().place(1.4, z, 0).walk(c.t, 0.8).setFace('calm'); N.hollis.reset().place(-0.8, z - 0.4, 0).walk(c.t + 0.3, 0.7).pose(HOLD, 1).setFace('worried'); holdCandle(N, c.t); } });
  shot({ line: 'Nothing happened.', set: SN, cam: frame(-0.8, 4.5, { size: 'close', h: 0.98, side: 14 }),
    act(lt, c) { SN.h13.door.rotation.y = 1.3; N.hollis.reset().place(-0.8, 4.5, 0).pose(HOLD).setFace(lt < c.w('happened') + 0.25 ? 'worried' : 'joy').idle(c.t); N.hollis.head.rotation.y = Math.sin(lt * 3) * 0.35; holdCandle(N, c.t); } });
  shot({ line: 'The next morning,', set: SD, sfx: [['whoosh', 0]], cam: drone([0, 4, 0], { h: 30, back: 42, drift: [-8, -2, -6], fov: 52 }),
    act(lt, c) { D.veil.at(Math.max(0, 0.3 - lt), c.camera); SD.h13.door.rotation.y = 1.3; } });
  shot({ line: 'the whole town came to see him.', set: SD, sfx: [['sparkle', 'see', 0.5]], cam: { pos: [-4, 7, 24], look: [0, 3.5, 7], fov: 50, blur: 0.1, push: 0.07 },
    act(lt, c) { SD.h13.door.rotation.y = 1.3; party(c); } });
  shot({ line: 'Grimley took one look at us', set: SD, cam: frame(14, 6, { size: 'close', h: 1.12, side: -20, facing: -0.4 }),
    act(lt, c) { D.grim.reset().place(14, 6, -0.4).setFace(lt < c.w('look') ? 'smug' : 'gasp').idle(c.t); } });
  shot({ line: 'and ran so fast', set: SD, sfx: [['whoosh', 0.1]], cam: handheld(follow(lt => [15 + lt * 9, 0, 9.5], [-8, 4, 10], { lookY: 3.2 }), 1.4),
    act(lt, c) { D.grim.reset().place(15 + lt * 9, 9.5, D2).run(c.t, 1.5).setFace('gasp'); SD.shoe.visible = lt > 0.35; } });
  shot({ line: 'he left a shoe behind.', set: SD, sfx: [['boing', 'shoe', 0.5]], cam: { pos: [14.4, 2.6, 13.4], look: [17, 0.5, 10.2], fov: 44, blur: 0.3, push: 0.12 },
    act(lt, c) { SD.shoe.visible = true; D.grim.reset().place(36 + lt * 9, 9.5, D2).run(c.t, 1.5).setFace('gasp'); } });
  shot({ line: 'Nobody has seen him since.', set: SD, cam: frame(3, 4.5, { size: 'close', side: 12 }),
    act(lt, c) { D.me.reset().place(3, 4.5, 0.2).setFace('calm').idle(c.t); SD.h13.door.rotation.y = 1.3; } });
  shot({ line: 'Some people say he disappeared forever. ///', set: SD, cam: { pos: [23.8, 2.0, 10.7], look: [12, 2.0, 9.9], focus: [17, 0.4, 10.2], fov: 40, blur: 0.25, push: 0.08 },
    act(lt, c) { SD.shoe.visible = true; SD.h13.door.rotation.y = 1.3; party(c); } });
});
