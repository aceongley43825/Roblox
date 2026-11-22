// story.js: "In this town, your sixteenth birthday..." (town-story-shorts style, 90 s)
//
// THE SCRIPT (approved):
//   In this town, your sixteenth birthday is the most important day of your life. Because when you turn sixteen,
//   you get one phone call from your future self. But the call can only happen inside the old red phone booth in
//   the middle of the town square. It's been standing there for over two hundred years, and nobody knows who built
//   it. Nobody is allowed to touch it before they turn sixteen. And every year, the whole town comes to watch.
//   My best friend Milo went last spring. His future self told him to never buy a blue car, so now he rides a bike
//   everywhere. My grandma's future self told her to marry the boy who sold ice cream. That's my grandpa. And
//   everybody always says the same thing about the booth. It's tiny. Milo got stuck in the door for twenty minutes.
//   Then it was my turn. The night of my birthday, the whole town was standing in the square, holding candles. I
//   squeezed inside, closed the door, and waited. The phone rang. I picked it up. A voice said, "Hey. It's you. I'm
//   calling from thirty years in the future, and I don't have much time." Everyone outside went completely silent.
//   [hold] Then he said, "In a few years, you're going to build a time machine. You're going to travel back two
//   hundred years, and you're going to build a phone booth. Please, whatever you do, make the door bigger." Then the
//   line went dead. [hold] So now I know who built the booth. It was me. And I still haven't figured out how to get
//   out of it. [hold]
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar, POSES } from './avatar.js';
import { TOWN, makeNarrator, handheld, follow, drone, skyDome, hills, house, car } from './town.js';
import { makeSparkles } from './fx.js';
import { remap, E, lerp, clamp, box, glow, mat, tmat, at, grp, sign, rng, shade, canvasTex, PRE } from './util.js';
import { TEX, floor, lampPost, tree, bush, bench, desk, room, windowPane, rug } from './sets.js';

Object.assign(POSES, {
  phone: { aR: [168, 10], aL: [0, 6], head: [0, 0, -6] },   // receiver at the ear
  hold: { aR: [72, -16], aL: [8, 4] },                         // candle in front of the chest
  hammer: { aR: [120, -4], aL: [40, 10] },
  squeeze: { aL: [6, -10], aR: [6, -10], head: [6, 0, 4] },
  pull: { aL: [92, -12], aR: [92, -12], lean: [-12, 0] },
  bike: { aL: [72, -6], aR: [72, -6], lL: 80, lR: 80 },
});

// ───────────── props for this story
const RED = '#c8202a', Y0 = 0.35, BW = 4.4, PH = 7.4;   // booth: plinth top, outer width, panel height
const glassM = () => new THREE.MeshLambertMaterial({ color: '#d6ecff', transparent: true, opacity: 0.16, depthWrite: false });
function boothPanel(w, solid = false) {
  const p = grp(at(box(w, 1.5, 0.18, RED), 0, 0.75, 0));
  if (solid) p.add(at(box(w, PH - 1.5, 0.14, RED), 0, 1.5 + (PH - 1.5) / 2, 0));
  else { const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, PH - 1.5), glassM()); gl.position.set(0, 1.5 + (PH - 1.5) / 2, 0); p.add(gl); }
  for (const y of [1.5, 3.0, 6.3]) p.add(at(box(w, 0.16, 0.22, RED), 0, y, 0));
  p.add(at(box(0.18, PH, 0.22, RED), -w / 2 + 0.09, PH / 2, 0), at(box(0.18, PH, 0.22, RED), w / 2 - 0.09, PH / 2, 0), at(box(w, 0.22, 0.22, RED), 0, PH, 0));
  return p;
}
function phoneBooth(o = {}) {
  const g = grp(at(box(5.4, Y0, 5.4, '#6b6a70'), 0, Y0 / 2, 0)), h = BW / 2 - 0.1;
  const posts = grp(); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) posts.add(at(box(0.5, PH + 1.2, 0.5, RED, 0.06), x * (BW / 2 - 0.25), Y0 + (PH + 1.2) / 2, z * (BW / 2 - 0.25)));
  const back = at(boothPanel(BW - 0.6), 0, Y0, -h), left = at(boothPanel(BW - 0.6), -h, Y0, 0, Math.PI / 2), right = at(boothPanel(BW - 0.6), h, Y0, 0, -Math.PI / 2);
  // the phone on the left inner wall
  const phone = grp(at(box(0.5, 1.5, 1.1, '#141416', 0.08), 0, 0, 0), at(box(0.1, 0.6, 0.6, '#c9c9cf'), 0.28, -0.2, 0));
  for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) phone.add(at(box(0.06, 0.1, 0.12, '#2a2a30'), 0.34, -0.38 + r * 0.13 - 0.05, -0.15 + k * 0.15)); phone.add(at(box(0.06, 0.08, 0.4, '#e2b23a'), 0.3, 0.45, 0));
  phone.position.set(-(BW / 2 - 0.55), Y0 + 4.2, -0.5);
  const cradleRec = at(box(0.34, 0.34, 1.4, '#141416', 0.12), -(BW / 2 - 0.85), Y0 + 5.05, -0.5);
  const top = grp(at(box(BW + 0.2, 1.2, BW + 0.2, RED, 0.08), 0, Y0 + PH + 0.6, 0), at(box(BW + 0.7, 0.3, BW + 0.7, RED, 0.08), 0, Y0 + PH + 1.35, 0));
  for (let i = 0; i < 4; i++) { const s = sign('TELEPHONE', 3.4, 0.72, { bg: '#f4f1e6', fg: '#141414', glowing: true }); const a = i * Math.PI / 2; s.position.set(Math.sin(a) * (BW / 2 + 0.12), Y0 + PH + 0.6, Math.cos(a) * (BW / 2 + 0.12)); s.rotation.y = a; top.add(s); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.3, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(RED)); dome.scale.y = 0.32; dome.position.y = Y0 + PH + 1.5; dome.castShadow = true; top.add(dome, at(box(0.6, 0.6, 0.6, '#e2b23a', 0.2), 0, Y0 + PH + 2.4, 0));
  top.add(at(box(0.9, 0.18, 0.9, glow('#fff1c8', 2.2)), 0, Y0 + PH - 0.05, 0));
  const lamp = new THREE.PointLight('#ffe2b0', o.night ? 60 : 20, 11, 2); lamp.position.set(0, Y0 + PH - 0.8, 0.4); top.add(lamp);
  // door: hinged on the left front post, swings outward (negative rotation)
  const door = grp(at(boothPanel(BW - 1.0), (BW - 1.0) / 2, 0, 0), at(box(0.22, 0.7, 0.2, '#e2b23a'), BW - 1.35, 3.6, 0.2)); door.position.set(-(BW / 2 - 0.5), Y0, h + 0.05);
  // scaffold + planks (only while being built 200 years ago)
  const scaffold = grp(at(box(0.3, 11, 0.3, '#8a5a34'), 3.2, 5.5, 2.6), at(box(0.3, 11, 0.3, '#8a5a34'), 3.2, 5.5, -2.6), at(box(0.3, 0.3, 5.6, '#8a5a34'), 3.2, 6.5, 0), at(box(0.3, 0.3, 5.6, '#8a5a34'), 3.2, 3.2, 0));
  for (let i = 0; i < 4; i++) scaffold.add(at(box(4.2, 0.3, 0.8, i % 2 ? RED : shade(RED, -0.15)), -5.2, 0.15 + i * 0.3, 2.5 + (i % 2) * 0.2));
  g.add(posts, back, left, right, phone, cradleRec, top, door, scaffold);
  const B = { group: g, door, phone, cradleRec, back, left, right, top, scaffold, lamp };
  B.build = (k) => { back.visible = k > 0.15; left.visible = phone.visible = cradleRec.visible = k > 0.35; right.visible = k > 0.6; top.visible = k > 0.85; door.visible = k >= 1; scaffold.visible = k < 1; };
  B.reset = () => { B.build(1); door.rotation.y = 0; phone.rotation.set(0, 0, 0); phone.position.y = Y0 + 4.2; cradleRec.visible = true; g.visible = true; };
  B.ring = (lt) => { const r = Math.sin(lt * 60) * (Math.sin(lt * 9) > 0 ? 1 : 0); phone.rotation.x = r * 0.06; phone.position.y = Y0 + 4.2 + Math.abs(r) * 0.04; cradleRec.position.y = Y0 + 5.05 + Math.abs(r) * 0.1; };
  B.reset(); return B;
}
const cobble = (c) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = shade(c, -0.25); g.fillRect(0, 0, w, h); const r = rng(12); for (let y = 0; y < 8; y++) for (let x = -1; x < 9; x++) { g.fillStyle = shade(c, (r() - 0.5) * 0.18); const ox = (y % 2) * 16; g.beginPath(); g.roundRect(x * 32 + ox + 2, y * 32 + 2, 28, 28, 8); g.fill(); } });
function candle() { const f = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), glow('#ffb347', 2.8)); f.scale.y = 1.6; f.position.y = 1.05; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 10), mat('#f6f0e0')); c.position.y = 0.45; return grp(c, f); }
function receiver() { return grp(at(box(0.3, 0.3, 1.4, '#141416', 0.12), 0, 0, 0)); }
function cone() { const c = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.0, 14), mat('#d9a85a')); c.rotation.x = Math.PI; const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), mat('#ff9ec8')); s.position.y = 0.62; return grp(c, s); }
function hammer() { return grp(at(box(0.18, 1.5, 0.18, '#8a5a34'), 0, 0, 0), at(box(0.7, 0.32, 0.32, '#5a5c64'), 0, 0.75, 0)); }
function iceCart() { const g = grp(at(box(5, 2.6, 2.6, '#f6f2ea', 0.15), 0, 2.4, 0), at(box(5.05, 0.5, 2.65, '#ff7ab0'), 0, 1.4, 0), at(sign('ICE CREAM', 4.2, 1.0, { bg: '#ff7ab0', fg: '#ffffff' }), 0, 2.7, 1.32));
  for (const x of [-1.8, 1.8]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.18, 8, 18), mat('#222')); w.position.set(x, 0.7, 1.35); g.add(w); }
  g.add(at(box(0.15, 5, 0.15, '#ddd'), 0, 6, 0)); const u = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.3, 12), mat('#ff9ec8')); u.position.y = 8.6; g.add(u); return g; }
function bike(color = '#e8c33a') { const g = grp(); for (const x of [-1.7, 1.7]) { const w = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.13, 8, 22), mat('#1b1c20')); w.position.set(x, 1.1, 0); g.add(w); }
  g.add(at(box(3.0, 0.18, 0.18, color), 0, 2.2, 0), at(box(0.18, 1.4, 0.18, color), -0.6, 2.0, 0), at(box(1.0, 0.22, 0.5, '#222'), -0.6, 2.8, 0), at(box(0.18, 1.7, 0.18, color), 1.5, 2.2, 0), at(box(0.2, 0.2, 1.8, '#222'), 1.5, 3.1, 0)); return g; }

// ───────────── sets
function square(o = {}) {
  const night = o.time === 'night', old = !!o.old, g = grp(skyDome(night ? 'night' : 'sunset'), hills(night ? '#1d3320' : '#6f9a54', -170));
  g.add(at(floor(300, 300, old ? TEX.concrete('#a07f58') : cobble(night ? '#7a7c86' : '#b8aa9a'), old ? 6 : 3), 0, -0.02, 0));
  if (!old) {
    const cols = ['#c97a8e', '#3e66c9', '#d9b56a', '#8fbf9a', '#b07ad0', '#e09a6a', '#7aa0d8'];
    for (let i = -3; i <= 3; i++) g.add(at(house({ color: cols[(i + 3) % 7], lit: night ? 0.75 : 0, seed: i + 20, roof: night ? '#252a36' : '#5a3a2e' }), i * 18, 0, -30 - (i & 1) * 2));
    for (let i = -3; i <= 3; i++) g.add(at(house({ color: cols[(i + 5) % 7], lit: night ? 0.75 : 0, seed: i + 40, roof: night ? '#252a36' : '#5a3a2e' }), i * 18 + 6, 0, 46, Math.PI));
    for (const s of [-1, 1]) for (const z of [-8, 12]) g.add(at(house({ color: cols[(z + 9 + s) % 7 + 0 | 0] || '#c97a8e', lit: night ? 0.75 : 0, seed: z + s * 3 + 60 }), s * 40, 0, z, -s * Math.PI / 2));
    for (const [x, z] of [[-8, -4], [8, -4], [-16, 20], [16, 20]]) { g.add(at(lampPost(10), x, 0, z)); if (night) { const L = new THREE.PointLight('#ffd9a0', 200, 26, 2); L.position.set(x, 10.2, z); g.add(L); } }
    g.add(at(bench('#7a4a2a'), -12, 0, 4, Math.PI / 2), at(bench('#7a4a2a'), 12, 0, -2, -Math.PI / 2));
    // brass plaque on a stone pedestal
    g.add(at(box(1.5, 2.2, 1.2, '#8d8a86', 0.08), -4.6, 1.1, 2.8), at(sign('EST. 1821', 1.3, 0.62, { bg: '#c9a24a', fg: '#3a2a10' }), -4.6, 1.75, 3.42));
  } else {
    for (const [x, z, c] of [[-20, -26, '#8a6a48'], [4, -32, '#7a5a3a'], [24, -24, '#9a7a52'], [-30, 6, '#7a5a3a']]) g.add(at(house({ color: c, lit: 0, seed: x + 90, roof: '#3a2a1e', door: '#4a2e1a' }), x, 0, z, x < -25 ? Math.PI / 2 : 0));
  }
  g.add(at(tree(10, night ? '#24452a' : '#3f9b3f'), -17, 0, -13), at(tree(9, night ? '#24452a' : '#3f9b3f'), 18, 0, -15), at(bush(night ? '#24452a' : '#3f9b3f'), -9, 0, -9), at(bush(night ? '#24452a' : '#3f9b3f'), 9, 0, -10));
  const booth = phoneBooth({ night }); g.add(booth.group);
  // rope barrier with the 16+ sign (daytime only)
  const rope = grp(); for (const x of [-3.2, 3.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 3, 12), mat('#d9b04a')); p.position.set(x, 1.5, 4.4); rope.add(p, at(new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), mat('#d9b04a')), x, 3.05, 4.4)); }
  rope.add(at(box(6.4, 0.16, 0.16, '#8a1020'), 0, 2.75, 4.4), at(sign('16+ ONLY', 2.2, 0.9, { bg: '#f4f1e6', fg: '#b0141e', border: '#b0141e' }), 0, 2.1, 4.5));
  g.add(rope);
  let cart = null; if (o.cart) { cart = iceCart(); g.add(at(cart, 11, 0, 4, -0.35)); }
  const S = { group: g, light: night ? 'townNight' : 'sunset', booth, rope, cart };
  S.reset = () => { booth.reset(); rope.visible = !night && !old; if (old) booth.build(0.55); };
  return S;
}
function bedroom() {
  const s = TOWN.roomNight({ wall: '#3e4f8f', bed: '#c33a3a', shelf: true }); const g = s.group;
  g.add(at(desk('#b9783f'), 3.2, 0, 1.2));
  const cake = grp(at(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.9, 24), mat('#ff9ec8')), 0, 0.45, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.16, 24), mat('#ffffff')), 0, 0.9, 0));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = candle(); c.scale.setScalar(0.32); c.children[1].material = glow('#ffb347', 1.6); c.position.set(Math.cos(a) * 0.9, 0.95, Math.sin(a) * 0.9); cake.add(c); }
  cake.add(at(sign('16', 0.8, 0.6, { bg: '#f2c230', fg: '#7a1f12', glowing: true }), 0, 1.5, 0.3));
  cake.scale.setScalar(0.8); g.add(at(cake, 3.2, 2.72, 1.2)); const L = new THREE.PointLight('#ffc07a', 30, 9, 2); L.position.set(2, 5, 3.5); g.add(L);
  return s;
}
function garage() {
  const s = TOWN.roomNight({ wall: '#55606e', floor: '#6b6f78', rug: '#2d3340' }); const g = s.group;
  g.add(at(box(7, 2.8, 2.4, '#7a5232', 0.05), -9, 1.4, -4), at(box(1.2, 0.8, 0.8, '#d43a2a'), -10.5, 3.2, -4), at(box(2, 0.4, 0.6, '#9aa0aa'), -8, 3.0, -3.6));
  g.add(at(sign(['CALENDAR', '2056'], 2.6, 2.0, { bg: '#f4f1e6', fg: '#c33a3a' }), -5.5, 7.6, -5.85));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.5, 14, 40), mat('#9aa0aa', { emissive: new THREE.Color('#2aa8ff'), emissiveIntensity: 0.25 })); ring.position.set(5, 4.4, -3.4); ring.castShadow = true;
  const inner = new THREE.Mesh(new THREE.CircleGeometry(2.9, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5fd2ff').multiplyScalar(1.6), transparent: true, opacity: 0.7, toneMapped: false })); inner.position.set(5, 4.4, -3.45);
  const lights = grp(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; lights.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), glow('#ffe46a', 2.4)), 5 + Math.cos(a) * 3.3, 4.4 + Math.sin(a) * 3.3, -2.85)); }
  g.add(ring, inner, lights, at(box(9, 0.6, 2, '#3a3f4a'), 5, 0.3, -3.4)); const L = new THREE.PointLight('#5fd2ff', 120, 18, 2); L.position.set(5, 4.4, 0); g.add(L);
  s.update = (t) => { inner.material.opacity = 0.55 + Math.sin(t * 7) * 0.15; inner.rotation.z = t; };
  return s;
}

start(() => {
  const SQN = square({ time: 'night' }), SQS = square({ time: 'sunset', cart: true }), OLD = square({ time: 'sunset', old: true });
  const ST = TOWN.street({ time: 'day' }), BED = bedroom(), GAR = garage();
  ST.group.add(at(car('#2f6fe0'), 13, 0, 9.4, Math.PI / 2)); const stBike = bike(); ST.group.add(stBike);

  // ── cast (one copy per set, same options everywhere)
  const MK = {
    me: () => makeNarrator({ color: '#3553b8', print: 'sweet 16' }),
    future: () => { const a = makeNarrator({ color: '#3553b8', print: 'sweet 16', seed: 12 }); a.size(1.1); a.baseHeight = 1.1; a.head.add(at(box(0.62, 0.13, 0.1, '#3a2416', 0.04), 0, 0.42, 0.66)); return a; },
    milo: () => makeAvatar({ seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' }),
    gran: () => makeAvatar({ seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true, height: 0.95 }),
    gramps: () => makeAvatar({ seed: 7, skin: 'light', hair: 'short', hairColor: '#cfcfd4', top: 'shirt', topColor: '#7fb6e8', bottom: 'slacks', bottomColor: '#5a4a3a', glasses: '#6a4a2a', height: 0.97 }),
    kid: () => makeAvatar({ seed: 8, skin: 'brown', hair: 'spiky', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'shorts', bottomColor: '#3f74c8', height: 0.78 }),
    zoe: () => makeAvatar({ seed: 9, skin: 'light', hair: 'ponytail', hairColor: '#c2742f', top: 'zip', topColor: '#2fb39a', bottom: 'jeans', bottomColor: '#2f3f6a' }),
  };
  const EXTRA = [
    { seed: 21, skin: 'deep', hair: 'afro', hairColor: '#1b1210', top: 'tee', topColor: '#ff7a2f', bottom: 'jeans' },
    { seed: 22, skin: 'fair', hair: 'long', hairColor: '#e8c06a', top: 'sweater', topColor: '#7fc98a', bottom: 'skirt', bottomColor: '#3a6a3a' },
    { seed: 23, skin: 'tan', hair: 'short', hairColor: '#2a1a12', top: 'vest', topColor: '#d23a3a', bottom: 'cargo', bottomColor: '#5a5a4a', cap: '#2f4fc4' },
    { seed: 24, skin: 'light', hair: 'buns', hairColor: '#5a3a1a', top: 'dress', topColor: '#f2d33c', bottom: 'plain', bottomColor: '#f2d33c' },
    { seed: 25, skin: 'brown', hair: 'dreads', hairColor: '#1b1210', top: 'hoodie', topColor: '#8a4fd0', bottom: 'joggers', bottomColor: '#2b2b33' },
    { seed: 26, skin: 'light', hair: 'messy', hairColor: '#8a5a2a', top: 'stripes', topColor: '#f4f4f4', bottom: 'jeans', bottomColor: '#3f74c8' },
    { seed: 27, skin: 'dark', hair: 'bald', hairColor: '#111', top: 'suit', topColor: '#2b3348', bottom: 'slacks', bottomColor: '#2b3348', height: 1.05 },
    { seed: 28, skin: 'fair', hair: 'ponytail', hairColor: '#1b1210', top: 'tee', topColor: '#19a7a0', bottom: 'shorts', bottomColor: '#2e4a7a', height: 0.85 },
  ];
  const cast = (set, names, crowd = false) => {
    const C = {}; for (const n of names) { C[n] = MK[n](); set.group.add(C[n].root); }
    const attach = (av, mk, where = 'handR', pos = [0, 0, 0]) => { const p = mk(); p.position.set(...pos); av[where].add(p); PRE.push(() => { p.visible = false; }); return p; };
    for (const n of names) if (n === 'me' || n === 'milo' || n === 'future' || n === 'gramps') C[n].rec = attach(C[n], receiver, 'handR', [0.1, -0.15, 0.55]);
    if (crowd) { C.crowd = EXTRA.map(o => { const a = makeAvatar(o); set.group.add(a.root); return a; }); for (const n of ['milo', 'gran', 'gramps']) C.crowd.splice(3 + ['milo', 'gran', 'gramps'].indexOf(n) + 1, 0, C[n]); for (const a of C.crowd) a.candle = attach(a, candle, 'handR', [0, -0.25, 0]); }
    C.sp = makeSparkles(set.group);
    return C;
  };
  const N = cast(SQN, ['me', 'milo', 'gran', 'gramps'], true), S = cast(SQS, ['me', 'milo', 'gran', 'gramps', 'kid', 'zoe']);
  const O = cast(OLD, ['me']), T = cast(ST, ['milo']), BR = cast(BED, ['me']), G = cast(GAR, ['me', 'future']);
  S.cone = (() => { const c = cone(); c.position.set(0, -0.3, 0.3); S.gramps.handR.add(c); PRE.push(() => { c.visible = false; }); return c; })();
  O.hammer = (() => { const h = hammer(); h.position.set(0, -0.2, 0.3); h.rotation.x = Math.PI / 2; O.me.handR.add(h); PRE.push(() => { h.visible = false; }); return h; })();

  // crowd: a ring of townspeople facing the booth, each holding a candle
  const SLOTS = N.crowd.map((a, i) => { const k = (i - (N.crowd.length - 1) / 2) / ((N.crowd.length - 1) / 2), ang = k * 0.95, r = 13 + (i % 2) * 2.6; const x = Math.sin(ang) * r, z = Math.cos(ang) * r; return [x, z, Math.atan2(-x, -z)]; });
  const crowdOn = (t, face = 'joy', skip = []) => N.crowd.forEach((a, i) => { if (skip.includes(a)) return; const p = SLOTS[i]; a.reset().place(p[0], p[1], p[2]).pose('hold').setFace(typeof face === 'function' ? face(i) : face).idle(t + i * 0.7); a.candle.visible = true; a.candle.rotation.x = -a.armR.rotation.x; });
  const gi = N.crowd.indexOf(N.gran), GP = SLOTS[gi];
  const inBooth = (av, t, face, o = {}) => { av.reset().place(o.x ?? 0.2, o.z ?? -0.2, o.ry || 0, Y0); if (o.phone !== undefined) { av.pose('phone', o.phone); if (o.phone > 0.5) av.rec.visible = true; } else av.pose(o.pose || 'squeeze'); av.setFace(face).idle(t, 0.5); return av; };
  const IN = (o = {}) => frame(0.2, -0.2, { y: Y0, size: 'close', ...o });

  // ───────── ACT 1: the rule
  shot({ line: 'In this town,', set: SQN, sfx: [['whoosh', 0]], cam: drone([0, 0, 5], { h: 34, back: 46, drift: [8, -2, -8], fov: 52 }),
    act(lt, c) { crowdOn(c.t); } });
  shot({ line: 'your sixteenth birthday', set: BED, cam: { pos: [1.2, 4.8, 8], look: [2.6, 3.6, 1.2], fov: 40, blur: 0.25, push: 0.11 },
    act(lt, c) { BR.me.reset().place(0, -1, 0).setFace('joy').idle(c.t); } });
  shot({ line: 'is the most important day', set: BED, cam: frame(0, -1, { size: 'close', side: -12 }),
    act(lt, c) { BR.me.reset().place(0, -1, -0.1).pose('open', 0.6).setFace('joy').talk(c.t); } });
  shot({ line: 'of your life.', set: BED, cam: frame(0, -1, { size: 'close', side: 14, push: 0.1 }),
    act(lt, c) { BR.me.reset().place(0, -1, 0.15).setFace(lt < c.w('life') ? 'calm' : 'winkjoy').idle(c.t); } });
  shot({ line: 'Because when you turn sixteen,', set: SQS, cam: follow(lt => [6 - lt * 1.7, 0, 15 - lt * 2.7], [5, 3.6, 8], { lookY: 3.6, fov: 56 }),
    act(lt, c) { S.zoe.reset().place(6 - lt * 1.7, 15 - lt * 2.7, Math.atan2(-1.7, -2.7)).walk(c.t).setFace('calm'); } });
  shot({ line: 'you get one phone call', set: SQS, sfx: [['ding', 0, 0.6], ['ding', 0.55, 0.6]], cam: { pos: [1.4, Y0 + 5.7, 1.9], look: [-1.7, Y0 + 4.6, -0.5], fov: 44, blur: 0.1, push: 0.08 },
    act(lt, c) { SQS.booth.ring(lt); } });
  shot({ line: 'from your future self.', set: GAR, cam: frame(-2, 1, { size: 'medium', h: 1.1, side: -14 }),
    act(lt, c) { G.future.reset().place(-2, 1, 0.15).pose('phone').setFace('joy').talk(c.t); G.future.rec.visible = true; } });
  shot({ line: 'But the call can only happen', set: SQS, cam: frame(5.5, 7, { size: 'close', side: -14 }),
    act(lt, c) { S.me.reset().place(5.5, 7, -0.2).pose('open', 0.7).setFace('calm').talk(c.t); } });
  shot({ line: 'inside the old red phone booth', set: SQS, cam: { pos: [5, 5, 17], look: [0, 5, 0], fov: 46, blur: 0.1, push: 0.08 } });
  shot({ line: 'in the middle of the town square.', set: SQS, cam: drone([0, 0, 0], { h: 36, back: 46, drift: [-8, -2, -6], fov: 52 }),
    act(lt, c) { S.gran.reset().place(-9, 9, 0.6).walk(c.t, 0.6); S.kid.reset().place(8 - lt, 10, -Math.PI / 2).walk(c.t); } });
  shot({ line: "It's been standing there", set: SQS, cam: { pos: [-6, 1.2, 12], look: [0, 6.2, 0], fov: 56, blur: 0.1, push: 0.07 } });
  shot({ line: 'for over two hundred years,', set: SQS, cam: { pos: [-3.9, 2.2, 6.8], look: [-4.6, 1.75, 3.42], fov: 38, blur: 0.25, push: 0.1 } });
  shot({ line: 'and nobody knows who built it.', set: SQS, cam: frame(0, 7, { size: 'full', side: 10 }),
    act(lt, c) { S.gran.reset().place(-2.4, 7, 0.2).pose('shrug', remap(lt, 0, 0.3)).setFace(lt < c.w('knows') ? 'calm' : 'uneasy').idle(c.t); S.gramps.reset().place(2.4, 7.2, -0.2).pose('shrug', remap(lt, 0.2, 0.5)).setFace('uneasy').idle(c.t + 1); } });
  shot({ line: 'Nobody is allowed to touch it', set: SQS, cam: { pos: [6.2, 3.6, 3.6], look: [0.4, 3.2, 6.6], fov: 52, blur: 0.25, push: 0.07 },
    act(lt, c) { S.kid.reset().place(1.0, 5.6, Math.PI).pose('reach', 0.55 * remap(lt, 0, 0.5)).setFace('worried').idle(c.t); S.gran.reset().place(-1.6, 8, Math.PI - 0.5).pose('point').setFace('mad').talk(c.t); } });
  shot({ line: 'before they turn sixteen.', set: SQS, cam: { pos: [0.7, 2.4, 8.6], look: [0, 2.1, 4.5], fov: 38, blur: 0.25, push: 0.11 } });
  shot({ line: 'And every year,', set: SQN, sfx: [['whoosh', 0]], cam: drone([0, 0, 6], { h: 26, back: 36, drift: [-8, -2, -6], fov: 54 }),
    act(lt, c) { crowdOn(c.t); } });
  shot({ line: 'the whole town comes to watch.', set: SQN, cam: handheld({ pos: [2, 4.6, 3.6], look: [0, 4, 14], fov: 56, blur: 0.2, push: 0.05 }, 1),
    act(lt, c) { crowdOn(c.t, i => i % 3 ? 'joy' : 'calm'); } });

  // ───────── ACT 2: who went before
  shot({ line: 'My best friend Milo', set: ST, cam: frame(-6, 4, { size: 'close', side: 14 }),
    act(lt, c) { stBike.position.set(-2.8, 0, 4.6); stBike.rotation.y = 0; T.milo.reset().place(-6, 4, -0.15).pose('wave', 0.8).setFace('joy').idle(c.t); } });
  shot({ line: 'went last spring.', set: SQS, cam: IN({ size: 'medium', side: 16 }),
    act(lt, c) { inBooth(S.milo, c.t, 'say', { phone: 1 }).talk(c.t); SQS.booth.cradleRec.visible = false; } });
  shot({ line: 'His future self told him', set: SQS, cam: IN({ side: -10, push: 0.1 }),
    act(lt, c) { inBooth(S.milo, c.t, lt < c.w('told') ? 'calm' : 'gasp', { phone: 1 }); SQS.booth.cradleRec.visible = false; } });
  shot({ line: 'to never buy a blue car,', set: ST, cam: { pos: [6.5, 4.2, 1.5], look: [13, 2.4, 9.4], fov: 46, blur: 0.15, push: 0.09 },
    act(lt, c) { stBike.position.set(-30, 0, 4.6); } });
  shot({ line: 'so now he rides a bike everywhere.', set: ST, cam: follow(lt => [-30 + lt * 6, 0, 12], [-3, 3.6, 9.5], { lookY: 3, fov: 56 }),
    act(lt, c) { const x = -30 + lt * 6; stBike.position.set(x, 0, 12); stBike.rotation.y = 0; T.milo.reset().place(x - 0.3, 12, Math.PI / 2).sit(2.4).pose('bike').setFace('joy');
      const ph = c.t * 8; T.milo.legL.rotation.x = -1.2 + Math.sin(ph) * 0.4; T.milo.legR.rotation.x = -1.2 - Math.sin(ph) * 0.4; } });
  shot({ line: "My grandma's future self", set: SQS, cam: frame(-7, 6, { size: 'close', side: 12, h: 0.95 }),
    act(lt, c) { S.gran.reset().place(-7, 6, 0.1).setFace('calm').idle(c.t); } });
  shot({ line: 'told her to marry the boy', set: SQS, cam: frame(-7, 6, { size: 'medium', side: -18, h: 0.95 }),
    act(lt, c) { S.gran.reset().place(-7, 6, -0.3).pose('hug', 0.7).setFace(lt < c.w('marry') ? 'calm' : 'love').idle(c.t); } });
  shot({ line: 'who sold ice cream.', set: SQS, cam: { pos: [6.5, 4.6, 15], look: [9.5, 3.8, 4], fov: 46, blur: 0.15, push: 0.08 },
    act(lt, c) { S.gramps.reset().place(7.4, 5.2, 0.4).pose('carry', 0.8).setFace('joy').idle(c.t); S.cone.visible = true; } });
  shot({ line: "That's my grandpa.", set: SQS, cam: frame(7.4, 5.2, { size: 'close', side: -12, h: 0.97 }),
    act(lt, c) { S.gramps.reset().place(7.4, 5.2, 0.1).pose({ aR: [55, -10] }).setFace(lt < c.w('grandpa') ? 'calm' : 'winkjoy').idle(c.t); S.cone.visible = true; } });
  shot({ line: 'And everybody always says the same thing', set: SQS, cam: frame(0.4, 8.5, { size: 'wide', side: -8 }),
    act(lt, c) { S.milo.reset().place(-3.4, 8, 0.25).pose('open', 0.5).setFace('talk').talk(c.t); S.gran.reset().place(-0.8, 8.8, 0.1).setFace('say').talk(c.t + 1); S.gramps.reset().place(1.8, 8.4, -0.15).pose('shrug', 0.6).setFace('talk').talk(c.t + 2); S.kid.reset().place(4.2, 9, -0.3).setFace('say').talk(c.t + 3); } });
  shot({ line: 'about the booth.', set: SQS, cam: { pos: [-4.5, 6, 14], look: [0, 5.6, 0], fov: 44, blur: 0.1, push: 0.1 } });
  shot({ line: "It's tiny.", set: SQS, sfx: [['boing', 'tiny', 0.5]], cam: IN({ side: 8, h: 0.97, push: 0.1 }),
    act(lt, c) { inBooth(S.gramps, c.t, 'worried', { pose: 'squeeze' }); } });
  shot({ line: 'Milo got stuck in the door', set: SQS, cam: { pos: [8, 5.2, 9.5], look: [0.4, 4.0, 2.6], fov: 50, blur: 0.12, push: 0.07 },
    act(lt, c) { SQS.rope.visible = false; SQS.booth.door.rotation.y = -1.9; S.milo.reset().place(0.3, 2.1, 0.5, Y0).pose({ aL: [80, 12], aR: [0, 6] }).setFace('worried').idle(c.t, 2);
      S.gramps.reset().place(0.4, 5.0, Math.PI).pose('pull').setFace('uneasy'); S.gran.reset().place(0.7, 6.8, Math.PI).pose('pull').setFace('worried'); } });
  shot({ line: 'for twenty minutes.', set: SQS, sfx: [['tick', 0, 0.6], ['tick', 0.5, 0.6], ['tick', 1.0, 0.6]], cam: frame(0.3, 2.1, { size: 'close', y: Y0, side: 22, push: 0.1 }),
    act(lt, c) { SQS.rope.visible = false; SQS.booth.door.rotation.y = -1.9; S.milo.reset().place(0.3, 2.1, 0.5, Y0).pose({ aL: [80, 12], aR: [0, 6] }).setFace('worried').idle(c.t, 2); } });

  // ───────── ACT 3: my turn
  shot({ line: 'Then it was my turn.', set: SQN, sfx: [['whoosh', 0]], cam: drone([0, 0, 5], { h: 22, back: 30, drift: [6, -3, -6], fov: 54 }),
    act(lt, c) { crowdOn(c.t); N.me.reset().place(0, 10 - lt * 2, Math.PI).walk(c.t).setFace('calm'); } });
  shot({ line: 'The night of my birthday,', set: BED, cam: frame(0, -1, { size: 'medium', side: 18 }),
    act(lt, c) { BR.me.reset().place(0, -1, 0.2).pose('cheer', remap(lt, 0.2, 0.5)).setFace('joy').idle(c.t); } });
  shot({ line: 'the whole town was standing', set: SQN, cam: handheld({ pos: [-3, 4.8, 4.2], look: [2, 4.1, 14], fov: 56, blur: 0.2, push: 0.05 }, 1, 4),
    act(lt, c) { crowdOn(c.t, 'calm'); } });
  shot({ line: 'in the square,', set: SQN, cam: { pos: [0, 15, 30], look: [0, 3, 0], fov: 48, blur: 0, push: 0.04 },
    act(lt, c) { crowdOn(c.t, 'calm'); N.me.reset().place(0, 6, Math.PI).setFace('calm'); } });
  shot({ line: 'holding candles.', set: SQN, cam: { pos: [-0.5, 4.4, 5], look: [0.2, 3.6, 14], fov: 38, blur: 0.25, push: 0.1 },
    act(lt, c) { crowdOn(c.t, 'calm'); } });
  shot({ line: 'I squeezed inside,', set: SQN, cam: frame(0.1, 1, { size: 'medium', y: Y0, side: 26 }),
    act(lt, c) { SQN.booth.door.rotation.y = -1.4; N.me.reset().place(0.1, 2.6 - E.inOut(remap(lt, 0.1, 0.8)) * 2.6, 0, Y0).pose('squeeze').setFace('uneasy').idle(c.t, 2); } });
  shot({ line: 'closed the door,', set: SQN, sfx: [['thud', 'door', 0.6]], cam: { pos: [3.4, 4.8, 9.5], look: [0.3, 4.3, 0.8], fov: 50, blur: 0.15, push: 0.07 },
    act(lt, c) { SQN.booth.door.rotation.y = -1.4 * (1 - E.inOut(remap(lt, 0.05, c.w('door') + 0.1))); inBooth(N.me, c.t, 'calm'); } });
  shot({ line: 'and waited.', set: SQN, cam: IN({ side: 8 }),
    act(lt, c) { inBooth(N.me, c.t, lt < c.w('waited') + 0.3 ? 'calm' : 'uneasy'); } });
  shot({ line: 'The phone rang.', set: SQN, sfx: [['ding', 'rang', 0.6], ['ding', 0.95, 0.6]], cam: { pos: [1.4, Y0 + 5.7, 1.9], look: [-1.7, Y0 + 4.6, -0.5], fov: 44, blur: 0.1, push: 0.1 },
    act(lt, c) { if (lt > c.w('rang') - 0.05) SQN.booth.ring(lt); } });
  shot({ line: 'I picked it up.', set: SQN, cam: IN({ size: 'medium', side: -14 }),
    act(lt, c) { const k = E.inOut(remap(lt, c.w('picked'), c.w('picked') + 0.35)); inBooth(N.me, c.t, k < 1 ? 'calm' : 'gasp', { phone: k }); if (k > 0.5) SQN.booth.cradleRec.visible = false; } });
  shot({ line: 'A voice said,', set: SQN, cam: IN({ side: 12, push: 0.09 }),
    act(lt, c) { inBooth(N.me, c.t, 'uneasy', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: '"Hey. It\'s you.', set: GAR, cam: frame(-2, 1, { size: 'close', h: 1.1, side: 12 }),
    act(lt, c) { G.future.reset().place(-2, 1, 0.1).pose('phone').setFace('joy').talk(c.t); G.future.rec.visible = true; } });
  shot({ line: "I'm calling from thirty years", set: GAR, cam: frame(-2, 1, { size: 'medium', h: 1.1, side: -24 }),
    act(lt, c) { G.future.reset().place(-2, 1, -0.2).pose('phone').setFace('talk').talk(c.t); G.future.rec.visible = true; } });
  shot({ line: 'in the future,', set: GAR, sfx: [['rise', 0, 0.4]], cam: { pos: [0.5, 6, 19], look: [0.8, 4.4, -2], fov: 54, blur: 0.05, push: 0.06 },
    act(lt, c) { G.future.reset().place(-2.4, 1.5, 0.3).pose('phone').setFace('talk').talk(c.t); G.future.rec.visible = true; } });
  shot({ line: 'and I don\'t have much time."', set: SQN, cam: IN({ side: -10, push: 0.1 }),
    act(lt, c) { inBooth(N.me, c.t, lt < c.w('time') ? 'uneasy' : 'gasp', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: 'Everyone outside went completely silent. //', set: SQN, cam: { pos: [-1.2, 4.7, 5.5], look: [1.2, 4.2, 14], fov: 50, blur: 0.25, push: 0.06 },
    act(lt, c) { crowdOn(c.t, i => (i % 2 ? 'gasp' : 'worried')); } });
  shot({ line: 'Then he said,', set: SQN, cam: IN({ side: 14 }),
    act(lt, c) { inBooth(N.me, c.t, 'uneasy', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: '"In a few years,', set: GAR, cam: frame(-2, 1, { size: 'close', h: 1.1, side: -8 }),
    act(lt, c) { G.future.reset().place(-2, 1, -0.05).pose('phone').setFace('say').talk(c.t); G.future.rec.visible = true; } });
  shot({ line: "you're going to build a time machine.", set: GAR, sfx: [['sparkle', 'machine', 0.7]], cam: { pos: [-1.5, 5, 15], look: [2.8, 4.4, -1.8], fov: 50, blur: 0.1, push: 0.07 },
    act(lt, c) { G.me.reset().place(0.2, 1.6, 0.35).pose('open', 0.8).setFace('joy').idle(c.t); G.sp.at(lt - c.w('machine'), [5, 1.8, -2.6], 1.4); } });
  shot({ line: "You're going to travel back", set: GAR, sfx: [['whoosh', 0.3]], cam: { pos: [-6, 5, 13], look: [3, 4.2, -2], fov: 52, blur: 0.1, push: 0.09 },
    act(lt, c) { const k = remap(lt, 0, Math.max(0.6, c.d - 0.2)); G.me.reset().place(lerp(-3, 4.8, k), lerp(4, -3, k), Math.atan2(7.8, -7)).run(c.t).setFace('joy'); G.me.root.visible = k < 0.97; c.shot.flash = x => clamp((x - (c.d - 0.3)) / 0.3) * 0.9; } });
  shot({ line: 'two hundred years,', set: OLD, sfx: [['sparkle', 0, 0.6]], cam: drone([0, 0, 2], { h: 30, back: 40, drift: [8, -2, -6], fov: 52 }),
    act(lt, c) { OLD.booth.group.visible = false; O.me.reset().place(0, 4, 0).setFace('gasp').idle(c.t); O.sp.at(lt, [0, 0, 4], 1.4); } });
  shot({ line: "and you're going to build", set: OLD, sfx: [['thud', 0.2, 0.4], ['thud', 0.6, 0.4], ['thud', 1.0, 0.4]], cam: { pos: [7.5, 4.8, 10], look: [2.4, 4.2, 0.6], fov: 50, blur: 0.15, push: 0.07 },
    act(lt, c) { O.me.reset().place(3.4, 3.2, -0.3).pose('hammer').setFace('serious'); O.me.armR.rotation.x += Math.abs(Math.sin(c.t * 7.8)) * 0.8; O.hammer.visible = true; } });
  shot({ line: 'a phone booth.', set: OLD, cam: { pos: [-5.5, 3, 12.5], look: [0, 4.6, 0], fov: 50, blur: 0.1, push: 0.1 },
    act(lt, c) { O.me.reset().place(3.4, 3.2, -0.3).pose('hammer').setFace('joy'); O.me.armR.rotation.x += Math.abs(Math.sin(c.t * 7.8)) * 0.8; O.hammer.visible = true; } });
  shot({ line: 'Please, whatever you do,', set: GAR, cam: frame(-2, 1, { size: 'close', h: 1.1, side: 16, push: 0.11 }),
    act(lt, c) { G.future.reset().place(-2, 1, 0.2).pose('phone').setFace('worried').talk(c.t); G.future.rec.visible = true; } });
  shot({ line: 'make the door bigger."', set: SQN, cam: { pos: [1.4, 4.1, 6.8], look: [0.4, 3.9, 2.2], fov: 46, blur: 0.15, push: 0.12 },
    act(lt, c) { inBooth(N.me, c.t, lt < c.w('bigger') ? 'uneasy' : 'gasp', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: 'Then the line went dead. ///', set: SQN, sfx: [['fall', 'dead', 0.6]], cam: IN({ side: -6, push: 0.1 }),
    act(lt, c) { inBooth(N.me, c.t, lt < c.w('dead') ? 'uneasy' : 'gasp', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: 'So now I know', set: SQN, cam: IN({ side: 16 }),
    act(lt, c) { inBooth(N.me, c.t, lt < c.w('know') ? 'calm' : 'wow', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: 'who built the booth.', set: SQN, cam: { pos: [5, 1.4, 12], look: [0, 6.2, 0], fov: 56, blur: 0.1, push: 0.07 },
    act(lt, c) { crowdOn(c.t, 'calm'); inBooth(N.me, c.t, 'wow', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: 'It was me.', set: SQN, sfx: [['pop', 'me', 0.5]], cam: IN({ side: 0, push: 0.12 }),
    act(lt, c) { inBooth(N.me, c.t, lt < c.w('me') ? 'gasp' : 'winkjoy', { phone: 1 }); SQN.booth.cradleRec.visible = false; } });
  shot({ line: "And I still haven't figured out", set: SQN, cam: IN({ size: 'medium', side: -10 }),
    act(lt, c) { SQN.booth.door.rotation.y = -0.35 * E.out(remap(lt, 0.2, 0.6)); N.me.reset().place(0.2, 0.9, 0, Y0).pose('squeeze').setFace('uneasy').walk(c.t * 0.6, 0.6, 10); } });
  shot({ line: 'how to get out of it. ///', set: SQN, sfx: [['sad', 'it', 0.6]], cam: { pos: [8, 5.2, 9.5], look: [0.4, 4.0, 2.6], fov: 50, blur: 0.12, push: 0.05 },
    act(lt, c) { crowdOn(c.t, 'calm', [N.milo, N.gran]); SQN.booth.door.rotation.y = -1.9; N.me.reset().place(0.4, 2.1, 0.5, Y0).pose({ aL: [80, 12], aR: [0, 6] }).setFace('worried').idle(c.t, 2);
      N.milo.reset().place(0.4, 5.0, Math.PI).pose('pull').setFace('uneasy'); N.gran.reset().place(0.7, 6.8, Math.PI).pose('pull').setFace('worried'); } });
});
