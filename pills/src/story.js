// story.js: "The Black Pill" (town-story-shorts style, 90 s, no catchphrase).
// One shot() per picture. `line` = words spoken in that shot (cuts land on its first word).
// '//' after a word = 0.6 s silent hold, '///' = 1.0 s.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, drone, handheld, makeVeil, house, car, stringLights, flags, skyDome, hills, mat, glow, box, at, grp, sign, rng, shade, clamp, remap, lerp, E } from './town.js';
import { SETS, TEX, floor, bush, tree, lampPost, table, bench } from './sets.js';
import { makeSparkles } from './fx.js';
import { PRE, canvasTex } from './util.js';

// ───────────── props for this story
function pill(color, black = false) {
  const m = new THREE.MeshPhongMaterial(black ? { color: '#121214', specular: '#8a8a9a', shininess: 90 } : { color, emissive: new THREE.Color(color).multiplyScalar(0.35), specular: '#fff6c0', shininess: 80 });
  const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.46, 8, 16), m); p.rotation.z = Math.PI / 2; p.castShadow = true; return p;
}
function pedestal() {
  const g = grp(at(box(1.5, 3.4, 1.5, '#f4efe6', 0.05), 0, 1.7, 0), at(box(1.9, 0.25, 1.9, '#e2b23a', 0.04), 0, 3.5, 0), at(box(2.3, 0.16, 1.3, '#7a1f2a', 0.05), 0, 3.7, 0));
  const gold = at(pill('#f2c230'), -0.5, 3.98, 0), blk = at(pill('', true), 0.5, 3.98, 0); g.add(gold, blk); g.gold = gold; g.black = blk; return g;
}
function hamster() {
  const g = grp(at(box(0.9, 0.7, 1.15, '#d9964a', 0.3), 0, 0.35, 0), at(box(0.62, 0.36, 0.12, '#f6e2c4', 0.1), 0, 0.3, 0.55));
  for (const s of [-1, 1]) g.add(at(box(0.22, 0.22, 0.12, '#c27a3a', 0.08), s * 0.3, 0.78, 0.25), at(box(0.09, 0.09, 0.05, '#111'), s * 0.2, 0.5, 0.58));
  g.add(at(box(0.12, 0.08, 0.05, '#ff8aa8'), 0, 0.4, 0.6)); return g;
}
function coinPile(n, seed = 3, spread = 1.4) { const g = grp(), r = rng(seed); for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), mat('#f2c230', { emissive: new THREE.Color('#7a5a00') })); c.position.set((r() - 0.5) * spread * (1 - i / n), 0.04 + i * 0.045, (r() - 0.5) * spread * 0.6 * (1 - i / n)); c.rotation.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3); g.add(c); } return g; }
// cash + coin rain over a character: at(dt, [x,y,z], scale)
function makeCash(parent, seed = 4) {
  const g = grp(), r = rng(seed), bits = [];
  const billTex = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#7fd08a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2f7a3a'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#2f7a3a'; c.font = '900 40px Montserrat'; c.textAlign = 'center'; c.fillText('$', w / 2, 46); });
  for (let i = 0; i < 26; i++) { const coin = i % 3 === 0; const m = coin ? new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14), mat('#f2c230', { emissive: new THREE.Color('#8a6a00') })) : new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshLambertMaterial({ map: billTex, side: THREE.DoubleSide })); m.userData = { x: (r() - 0.5) * 5, z: (r() - 0.5) * 2.4 + 0.6, y0: 7 + r() * 4, v: 4 + r() * 3, del: r() * 0.5, s: r() * 6 }; g.add(m); bits.push(m); }
  g.visible = false; parent.add(g); PRE.push(() => { g.visible = false; });
  return { at(dt, p, sc = 1) { g.visible = dt >= 0; if (!g.visible) return; g.position.set(p[0], p[1], p[2]); g.scale.setScalar(sc); for (const b of bits) { const u = b.userData, t = Math.max(0, dt - u.del); b.visible = dt >= u.del; b.position.set(u.x + Math.sin(t * 3 + u.s) * 0.4, Math.max(0.1, u.y0 - u.v * t), u.z); b.rotation.set(t * 4 + u.s, t * 3, t * 2); } } };
}
// purple healing sparkles (the kit sparkle, recoloured)
function purpleSparkles(parent, seed) { const sp = makeSparkles(parent, seed); sp.group.children.forEach(s => s.material.color.setRGB(0.75, 0.4, 1.2)); return sp; }
// glowing hand: purple orb + light on the narrator's right hand
function handGlow(av) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.45, 1.7), transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false })); const L = new THREE.PointLight('#c070ff', 0, 12, 2); o.add(L); o.position.y = -0.5; av.handR.add(o); o.visible = false; PRE.push(() => { o.visible = false; L.intensity = 0; });
  return { on(k, t) { o.visible = k > 0; o.scale.setScalar(0.3 + 0.7 * k + Math.sin(t * 14) * 0.06); L.intensity = 22 * k; } }; }
function handPill(av, color, black) { const p = pill(color, black); p.position.set(0, -0.55, 0.45); av.handR.add(p); p.visible = false; PRE.push(() => { p.visible = false; }); return p; }

// ───────────── the town square (sunset): stage, pedestal with the two pills, banner, crowd area, fountain, bushes
function townSquare() {
  const g = grp(skyDome('sunset'), hills('#6f9a54', -170), at(hills('#6f9a54', -170, 9), 0, 0, 0, Math.PI));
  const plaza = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#d9c7a8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b9a27e'; c.lineWidth = 4; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); } });
  g.add(at(floor(300, 220, TEX.grass('#5c9a48'), 6), 0, -0.03, 0), at(floor(80, 60, plaza, 6), 0, 0.01, 0));
  g.add(at(box(26, 1.6, 10, '#8a3a2a', 0.05), 0, 0.8, -8), at(box(26.4, 0.2, 10.4, '#f2d6a0'), 0, 1.65, -8), at(box(6, 0.8, 1.4, '#7a3222'), 0, 0.4, -2.4));
  g.add(at(box(26, 10, 0.6, '#9a1f2a', 0.05), 0, 6.6, -13), at(box(27, 0.8, 1, '#e2b23a'), 0, 11.8, -12.8));
  g.add(at(sign('CHOOSING DAY', 18, 2.6, { bg: '#e2b23a', fg: '#5a1410' }), 0, 14.2, -12.6), at(box(0.4, 15.5, 0.4, '#1b1c20'), -9.4, 7.7, -12.8), at(box(0.4, 15.5, 0.4, '#1b1c20'), 9.4, 7.7, -12.8));
  const ped = pedestal(); g.add(at(ped, 2.6, 1.6, -5));
  g.add(at(stringLights(60, 2, ['#fff2c0', '#ffd27a']), 0, 12, 2), at(flags(60), 0, 11, 2.4), at(stringLights(60, 2, ['#fff2c0']), 0, 12, 16));
  const f = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 1.4, 28), mat('#cfc6b8')); f.position.set(-22, 0.7, 8); const fw = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.2, 28), mat('#5ab0f0', { emissive: new THREE.Color('#1d5f9a') })); fw.position.set(-22, 1.35, 8);
  g.add(f, fw, at(box(0.8, 4, 0.8, '#cfc6b8'), -22, 2, 8));
  for (const [x, z] of [[14, 3], [17, 6], [-14, 2], [-30, -4], [30, -4], [20, 18], [-18, 20]]) g.add(at(bush('#3f8a3f'), x, 0, z));
  for (const [x, z] of [[-34, -10], [34, -12], [-38, 24], [38, 26]]) g.add(at(tree(11, '#3f8a3f'), x, 0, z));
  for (const x of [-26, 26]) g.add(at(lampPost(11), x, 0, -2));
  const cols = ['#c97a8e', '#3e66c9', '#d9b56a', '#8fbf9a', '#b07ad0', '#e09a6a'];
  for (let i = -3; i <= 3; i++) { g.add(at(house({ color: cols[(i + 3) % 6], lit: 0.2, seed: i + 80, roof: '#6a3a2e' }), i * 22, 0, -36)); g.add(at(house({ color: cols[(i + 5) % 6], lit: 0.2, seed: i + 90, roof: '#6a3a2e' }), i * 22 + 8, 0, 46, Math.PI)); }
  return { group: g, light: 'sunset', ped, reset() { ped.gold.visible = true; ped.black.visible = true; } };
}

// ───────────── cast (one copy per set, identical options)
const LOOK = {
  me: () => makeNarrator({ color: '#3553b8' }),
  theo: () => makeAvatar({ seed: 2, skin: 'tan', hair: 'swoop', hairColor: '#2a1a12', top: 'zip', topColor: '#e2b23a', bottom: 'slacks', bottomColor: '#2a2a30', shoe: '#e2b23a', glasses: '#111', face: 'smug' }),
  mia: () => makeAvatar({ seed: 8, skin: '#f0c49a', hair: 'ponytail', hairColor: '#3a2416', top: 'tee', topColor: '#ff9ac2', bottom: 'plain', bottomColor: '#ffc2dc', shoe: '#ffffff', height: 0.68 }),
  dad: () => makeAvatar({ seed: 7, skin: '#f0c49a', hair: 'short', hairColor: '#3a2416', top: 'shirt', topColor: '#5f86b5', bottom: 'slacks', bottomColor: '#4a4a52', shoe: '#3a2a20', height: 1.12, face: 'serious' }),
  pick: () => makeAvatar({ seed: 9, skin: 'fair', hair: 'bald', hairColor: '#d8d8dc', glasses: true, top: 'shirt', topColor: '#f4f4f4', bottom: 'slacks', bottomColor: '#6a6a72', shoe: '#222', height: 0.95, face: 'serious' }),
  k1: () => makeAvatar({ seed: 20, skin: 'brown', hair: 'afro', hairColor: '#1b1210', top: 'tee', topColor: '#2e9e59', bottom: 'jeans', bottomColor: '#3f5f9a' }),
  k2: () => makeAvatar({ seed: 21, skin: 'light', hair: 'long', hairColor: '#d9a54a', top: 'hoodie', topColor: '#8a4fd0', bottom: 'jeans', bottomColor: '#3a4f7a' }),
  k3: () => makeAvatar({ seed: 22, skin: 'deep', hair: 'buzz', hairColor: '#111', top: 'stripes', topColor: '#e8632b', bottom: 'shorts', bottomColor: '#2a2a30' }),
  k4: () => makeAvatar({ seed: 23, skin: 'fair', hair: 'bob', hairColor: '#e05a2a', top: 'sweater', topColor: '#19a7a0', bottom: 'skirt', bottomColor: '#2a3a5a' }),
};
const EXTRA = [
  { seed: 30, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' },
  { seed: 31, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' },
  { seed: 32, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' },
  { seed: 33, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true },
  { seed: 34, skin: 'deep', hair: 'dreads', hairColor: '#1b1210', top: 'vest', topColor: '#3d6fe0', bottom: 'cargo', bottomColor: '#6a5a3a' },
  { seed: 35, skin: 'light', hair: 'ponytail', hairColor: '#7a4a2a', top: 'stripes', topColor: '#ff7ac2', bottom: 'jeans', bottomColor: '#4f79a7' },
  { seed: 36, skin: 'dark', hair: 'short', hairColor: '#111', top: 'jersey', topColor: '#d23a3a', number: '7', bottom: 'shorts', bottomColor: '#d23a3a', cap: '#d23a3a' },
  { seed: 37, skin: 'tan', hair: 'messy', hairColor: '#3a2416', top: 'sweater', topColor: '#f2b01e', bottom: 'slacks', bottomColor: '#3a3a42' },
  { seed: 38, skin: 'fair', hair: 'long', hairColor: '#2a1a12', top: 'dress', topColor: '#2e9e59', bottom: 'plain', bottomColor: '#2e9e59' },
  { seed: 39, skin: 'brown', hair: 'bald', hairColor: '#111', top: 'shirt', topColor: '#e8e2d0', bottom: 'slacks', bottomColor: '#5a4a3a', height: 1.1 },
];
function cast(set, keys, extras = 0) { const c = {}; for (const k of keys) { c[k] = LOOK[k](); set.group.add(c[k].root); } c.ex = []; for (let i = 0; i < extras; i++) { const a = makeAvatar(EXTRA[i % EXTRA.length]); set.group.add(a.root); c.ex.push(a); } return c; }

start(() => {
  // ── sets
  const sq = townSquare();
  const street = TOWN.street({ time: 'night', litAll: false });
  const dayStreet = TOWN.street({ time: 'day' });
  const bedroom = TOWN.roomNight({ wall: '#5a4f8f', bed: '#ff9ac2', shelf: true, rug: '#e8b84a' });
  const kitchen = TOWN.roomNight({ wall: '#8a5a3a', floor: '#6a4a2a', rug: '#3a6a8a' });
  const pharm = SETS.shop({ sign: 'PHARMACY', wall: '#eaf6f2' });

  // street extras: gold car + Theo's hamster mansion (a tiny gold house)
  street.group.add(at(car('#e2b23a'), 12, 0, 10.2, Math.PI / 2));
  const mini = house({ w: 14, h: 11, d: 10, color: '#e2b23a', roof: '#8a1f2a', lit: 1, seed: 3, door: '#8a1f2a' }); mini.scale.setScalar(0.22); street.group.add(at(mini, -30, 0.02, 4.2));
  const hamS = hamster(); street.group.add(hamS);
  // kitchen: table, coin jar, gold piles, hamster + tissue
  const kt = table(9, 3.8, '#c98f52', 2.7); kitchen.group.add(kt);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.5, 20, 1, true), new THREE.MeshPhongMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.35, shininess: 100, side: THREE.DoubleSide, depthWrite: false }));
  const jarG = grp(jar, at(coinPile(12, 5, 0.6), 0, -0.72, 0)); jar.position.y = 0; kitchen.group.add(at(jarG, 2.4, 3.6, 0.4));
  const piles = grp(at(coinPile(60, 7, 2.2), -2.5, 2.83, 0), at(coinPile(80, 8, 2.4), 1.2, 2.83, 0.2), at(coinPile(40, 9, 1.6), 3.6, 2.83, -0.4)); kitchen.group.add(piles);
  const hamK = hamster(); kitchen.group.add(hamK);
  const tissue = at(box(0.5, 0.06, 0.5, '#ffffff', 0.02), 0, 0, 0); kitchen.group.add(tissue);
  kitchen.reset = () => { jarG.visible = true; piles.visible = false; hamK.visible = false; tissue.visible = false; };
  street.reset = () => { hamS.visible = false; };
  // pharmacy price sign + medicine bottle
  pharm.group.add(at(sign(['MEDICINE', '1,000,000 COINS'], 3.6, 1.6, { bg: '#ffffff', fg: '#c0283a', border: '#c0283a' }), -2.3, 4.3, -1.05), at(grp(at(box(0.8, 1.2, 0.8, '#ff8a3a', 0.15), 0, 0.6, 0), at(box(0.6, 0.3, 0.6, '#ffffff', 0.05), 0, 1.35, 0)), -0.4, 3.3, -1.6));

  // ── casts
  const Q = cast(sq, ['me', 'theo', 'dad', 'pick', 'k1', 'k2', 'k3', 'k4'], 10);
  const S = cast(street, ['me', 'theo']);
  const D = cast(dayStreet, ['theo', 'pick'], 8);
  const B = cast(bedroom, ['me', 'mia']);
  const K = cast(kitchen, ['me', 'dad', 'mia']);
  const P = cast(pharm, ['me', 'pick']);
  const fx = (set, seed) => ({ sp: makeSparkles(set.group, seed), cash: makeCash(set.group, seed + 1), veil: makeVeil(set.group, '#24451f') });
  const QF = fx(sq, 1), BF = fx(bedroom, 5), KF = fx(kitchen, 7);
  const BP = purpleSparkles(bedroom.group, 11), BP2 = purpleSparkles(bedroom.group, 12);
  const glowB = handGlow(B.me);
  const qGold = { k1: handPill(Q.k1, '#f2c230'), k2: handPill(Q.k2, '#f2c230'), k3: handPill(Q.k3, '#f2c230'), k4: handPill(Q.k4, '#f2c230') }, qBlack = handPill(Q.me, '', true);
  // swallow: hand lifts the pill to the mouth between t0 and t0+0.35, pill vanishes at t0+0.4
  const swallow = (av, p, lt, t0) => { const k = remap(lt, t0 - 0.35, t0); av.pose({ aR: [lerp(35, 150, E.inOut(k)), lerp(10, 26, k)] }); p.visible = lt < t0 + 0.05; if (lt > t0 && lt < t0 + 0.3) av.setFace('wow'); };

  // crowd in front of the stage, facing it (ry = PI). Slots on a loose grid.
  const slots = []; { const r = rng(17); for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) slots.push([(i - 2.5) * 4.2 + (r() - 0.5) * 1.4 + (row % 2) * 2, 5 + row * 3.6 + (r() - 0.5)]); }
  const crowd = (c, face = 'joy', pose = null, skip = []) => { Q.ex.forEach((a, i) => { const [x, z] = slots[i + 2]; if (typeof skip === 'function' ? skip(x, z) : skip.includes(i)) return; a.reset().place(x, z, Math.PI + (i % 3 - 1) * 0.12).setFace(typeof face === 'function' ? face(i) : face); if (pose) a.pose(typeof pose === 'function' ? pose(i) : pose); a.idle(c.t); }); };
  const fromStage = (x, z, o = {}) => frame(x, z, { side: 180, ...o });

  // 1 HOOK: drone over the square at sunset, the line of 18-year-olds by the stage
  shot({ line: 'In this town, everyone who turns eighteen', set: sq, sfx: [['whoosh', 0, 0.7]],
    cam: drone([0, 2, -2], { h: 34, back: 52, drift: [10, -6, -12], fov: 52 }),
    act(lt, c) { crowd(c, 'joy', i => (i % 3 ? 'idle' : 'cheer')); [Q.k1, Q.k2, Q.k3, Q.k4].forEach((a, i) => a.reset().place(-9 + i * 3, -6, 0, 1.6).setFace('calm').idle(c.t)); } });
  // 2 the square from the crowd, banner + pedestal
  shot({ line: 'goes to the town square,', set: sq,
    cam: { pos: [-6, 6, 22], look: [0, 6, -8], fov: 55, blur: 0.15 },
    act(lt, c) { crowd(c, 'joy', i => (i % 2 ? 'cheer' : 'wave')); [Q.k1, Q.k2, Q.k3, Q.k4].forEach((a, i) => a.reset().place(-9 + i * 3, -6, 0, 1.6).setFace('calm').idle(c.t)); } });
  // 3 insert: the two pills on the tray
  shot({ line: 'and picks one of two pills.', set: sq, sfx: [['ding', 'two', 0.6]],
    cam: { pos: [2.6, 6.9, -0.4], look: [2.6, 5.3, -5], fov: 42, blur: 0.9, push: 0.1 }, act() {} });
  // 4 the gold pill: a kid swallows it, sparkles + cash rain
  shot({ line: 'The gold pill makes you instantly rich.', set: sq, sfx: [['sparkle', 'instantly'], ['tick', 'rich', 0.6]],
    cam: frame(-2, -5, { size: 'medium', y: 1.6, side: -14 }),
    act(lt, c) { const t0 = c.w('makes'); Q.k1.reset().place(-2, -5, 0, 1.6).setFace(lt < c.w('instantly') ? 'calm' : 'joy').idle(c.t); swallow(Q.k1, qGold.k1, lt, t0 + 0.2); if (lt > c.w('instantly')) Q.k1.pose('cheer', 0.8); QF.sp.at(lt - c.w('instantly'), [-2, 1.6, -5]); QF.cash.at(lt - c.w('instantly'), [-2, 1.6, -5]); } });
  // 5 insert: the black pill, extreme close
  shot({ line: 'Nobody knows what the black pill does.', set: sq,
    cam: { pos: [4.0, 6.7, -1.0], look: [3.1, 5.6, -5], fov: 30, blur: 1, push: 0.12 }, act() {} });
  // 6 crowd shrugs
  shot({ line: 'Nobody ever picks it.', set: sq,
    cam: fromStage(slots[3][0], slots[3][1], { size: 'medium', side: 168 }),
    act(lt, c) { crowd(c, i => (i % 2 ? 'smug' : 'calm'), i => (i % 2 ? 'shrug' : 'hips')); } });
  // 7 narrator in the crowd
  shot({ line: 'Why would they?', set: sq, sfx: [['pop', 'they', 0.5]],
    cam: fromStage(slots[1][0], slots[1][1], { size: 'close', side: 192 }),
    act(lt, c) { crowd(c, 'calm'); Q.me.reset().place(slots[1][0], slots[1][1], Math.PI).pose('shrug', 0.7).setFace(lt < c.w('they') ? 'calm' : 'joy').idle(c.t); } });
  // 8 best friend Theo, gold jacket, night street
  shot({ line: 'My best friend Theo picked gold last year.', set: street,
    cam: frame(6, 6, { size: 'close', side: 14 }),
    act(lt, c) { S.theo.reset().place(6, 6, -0.2).pose('hips').setFace(lt < c.w('gold') ? 'smug' : 'winkjoy').idle(c.t); } });
  // 9 gold car
  shot({ line: 'Now he owns a gold car,', set: street, sfx: [['ding', 'car', 0.4]],
    cam: { pos: [-2, 5, 30], look: [9, 3, 10], fov: 50, blur: 0.15 },
    act(lt, c) { S.theo.reset().place(5.6, 12.2, 0.5).pose('open', 0.8).setFace('smug').idle(c.t); } });
  // 10 the hamster mansion (plant)
  shot({ line: 'and his hamster has a mansion.', set: street,
    cam: { pos: [-28.8, 1.9, 10.4], look: [-29.8, 1.5, 5.2], fov: 50, blur: 0.6, push: 0.08 },
    act(lt, c) { hamS.visible = true; hamS.position.set(-29.6, 0.02, 6.4); hamS.rotation.y = 0.3; hamS.position.y = Math.abs(Math.sin(c.t * 6)) * 0.12; } });
  // 11 narrator intro close-up, night
  shot({ line: 'This year, I turn eighteen.', set: street,
    cam: frame(-16, 4, { size: 'close', side: -12 }),
    act(lt, c) { S.me.reset().place(-16, 4, 0.15).setFace(lt < c.w('eighteen') ? 'calm' : 'joy').talk(c.t, 0.5).idle(c.t); } });
  // 12 the problem
  shot({ line: "But there's one problem.", set: street,
    cam: frame(-16, 4, { size: 'medium', side: 22 }),
    act(lt, c) { S.me.reset().place(-16, 4, 0.3).pose('shy').setFace('uneasy').idle(c.t); } });
  // 13 Mia sick in bed (camera above)
  shot({ line: 'My little sister Mia is very sick.', set: bedroom, sfx: [['sad', 'sick', 0.5]],
    cam: { pos: [-9, 7.6, 3.4], look: [-9, 2.2, 0.2], fov: 50, blur: 0.6 },
    act(lt, c) { B.mia.reset().place(-9, 2.1, 0, 2.1); B.mia.root.rotation.x = -Math.PI / 2; B.mia.setFace(lt < c.w('sick') ? 'sad' : 'worried').idle(c.t, 0.4); } });
  // 14 pharmacy price sign, Mister Pickles behind the counter
  shot({ line: 'Her medicine costs one million coins.', set: pharm, sfx: [['thud', 'million', 0.6]],
    cam: { pos: [-1.2, 5.2, 8.5], look: [-1.2, 4.6, -2.5], fov: 50, blur: 0.3 },
    act(lt, c) { P.pick.reset().place(0.3, -3.8, -0.2).setFace('serious').pose(lt > c.w('million') ? 'point' : 'idle', 0.7).idle(c.t); } });
  // 15 the coin jar
  shot({ line: 'We have twelve.', set: kitchen,
    cam: { pos: [2.6, 5.0, 4.4], look: [2.4, 3.6, 0.4], fov: 44, blur: 0.9, push: 0.1 }, act() {} });
  // 16 dad close-up
  shot({ line: 'My dad keeps saying,', set: kitchen,
    cam: frame(-1, -2.4, { size: 'close', h: 1.12, side: 12 }),
    act(lt, c) { K.dad.reset().place(-1, -2.4, 0).setFace('serious').pose('hips').idle(c.t); } });
  shot({ line: 'take the gold pill.', set: kitchen,
    cam: frame(-1, -2.4, { size: 'medium', h: 1.12, side: -16 }),
    act(lt, c) { K.dad.reset().place(-1, -2.4, -0.15).pose('point').setFace('say').talk(c.t).idle(c.t); } });
  shot({ line: 'It fixes everything.', set: kitchen, sfx: [['pop', 'everything', 0.4]],
    cam: frame(-1, -2.4, { size: 'face', h: 1.12, side: 6, push: 0.1 }),
    act(lt, c) { K.dad.reset().place(-1, -2.4, 0).pose('open', 0.6).setFace(lt < c.w('everything') ? 'say' : 'grin').talk(c.t).idle(c.t); } });
  // 19-21 the plan, three fast cuts
  shot({ line: 'Get rich.', set: bedroom, sfx: [['tick', 'rich', 0.6]],
    cam: frame(3, 3, { size: 'close', side: -10 }),
    act(lt, c) { B.me.reset().place(3, 3, 0).pose('cheer', 0.8).setFace('joy').idle(c.t); BF.cash.at(lt + 0.3, [3, -2, 4.5]); } });
  shot({ line: 'Buy the medicine.', set: pharm,
    cam: { pos: [-5, 5.4, 7], look: [0.6, 4.2, -1.6], fov: 52, blur: 0.4 },
    act(lt, c) { P.me.reset().place(2.6, 0.4, Math.PI + 0.7).pose('reach', 0.6).idle(c.t); P.pick.reset().place(0.3, -3.8, 0.3).setFace('calm').idle(c.t); } });
  shot({ line: 'Save Mia.', set: bedroom,
    cam: { pos: [-11, 6.8, 6.5], look: [-7, 3.0, -0.2], fov: 54, blur: 0.5 },
    act(lt, c) { B.mia.reset().place(-9, 2.1, 0, 2.1); B.mia.root.rotation.x = -Math.PI / 2; B.mia.setFace('sleepy'); B.me.reset().place(-5.4, 1.2, -Math.PI / 2 + 0.4).setFace('calm').pose('hug', 0.4).idle(c.t); } });
  // 22 the big event
  shot({ line: 'Then came Choosing Day.', set: sq, sfx: [['whoosh', 0, 0.6]],
    cam: drone([0, 8, -10], { h: 28, back: 44, drift: [-10, -4, -8], fov: 50 }),
    act(lt, c) { crowd(c, 'joy', i => (i % 2 ? 'cheer' : 'wave')); [Q.k2, Q.k3, Q.k4, Q.me].forEach((a, i) => a.reset().place(-9 + i * 3, -6, 0, 1.6).setFace('calm').idle(c.t)); } });
  shot({ line: 'The whole town showed up.', set: sq,
    cam: handheld({ pos: [0, 6.5, -2.5], look: [0, 3.2, 10], fov: 60, blur: 0.15 }, 0.6),
    act(lt, c) { crowd(c, i => (i % 3 ? 'joy' : 'winkjoy'), i => (i % 2 ? 'cheer' : 'wave')); Q.ex.forEach((a, i) => { if (i % 2) a.armL.rotation.z += Math.sin(c.t * 9 + i) * 0.25; }); Q.theo.reset().place(slots[0][0], slots[0][1], Math.PI).setFace('smug').pose('hips').idle(c.t); Q.pick.reset().place(slots[13][0], slots[13][1] + 1, Math.PI).setFace('serious').idle(c.t); } });
  // 24-27 the gold pills
  shot({ line: 'First kid. Gold.', set: sq, sfx: [['pop', 'gold', 0.6]],
    cam: frame(0, -5, { size: 'medium', y: 1.6, side: 16 }),
    act(lt, c) { Q.k2.reset().place(0, -5, -0.2, 1.6).setFace('calm').idle(c.t); swallow(Q.k2, qGold.k2, lt, c.w('gold')); } });
  shot({ line: 'Instantly rich.', set: sq, sfx: [['sparkle', 0], ['tick', 'rich', 0.6]],
    cam: frame(0, -5, { size: 'close', y: 1.6, side: -8, low: 0.3 }),
    act(lt, c) { Q.k2.reset().place(0, -5, 0, 1.6).pose('cheer', 0.9).setFace(lt < 0.2 ? 'wow' : 'joy').idle(c.t); QF.sp.at(lt, [0, 1.6, -5]); QF.cash.at(lt + 0.2, [0, 1.6, -5]); } });
  shot({ line: 'Next kid. Gold.', set: sq, sfx: [['sparkle', 'gold', 0.8]],
    cam: frame(0, -5, { size: 'medium', y: 1.6, side: -20 }),
    act(lt, c) { Q.k3.reset().place(0, -5, 0.1, 1.6).setFace(lt < c.w('gold') + 0.1 ? 'calm' : 'joy').idle(c.t); swallow(Q.k3, qGold.k3, lt, c.w('gold') - 0.05); if (lt > c.w('gold') + 0.1) Q.k3.pose('cheer', 0.9); QF.sp.at(lt - c.w('gold'), [0, 1.6, -5]); QF.cash.at(lt - c.w('gold'), [0, 1.6, -5]); } });
  shot({ line: 'Next. Gold.', set: sq, sfx: [['sparkle', 'gold', 0.8]],
    cam: frame(0, -5, { size: 'close', y: 1.6, side: 10 }),
    act(lt, c) { Q.k4.reset().place(0, -5, -0.1, 1.6).setFace(lt < c.w('gold') + 0.1 ? 'calm' : 'joy').idle(c.t); swallow(Q.k4, qGold.k4, lt, c.w('gold') - 0.05); if (lt > c.w('gold') + 0.1) Q.k4.pose('cheer', 0.9); QF.sp.at(lt - c.w('gold'), [0, 1.6, -5]); } });
  // 28 my turn: low hero angle, walking up to the pedestal
  shot({ line: 'Then it was my turn.', set: sq, sfx: [['thud', 'turn', 0.5]],
    cam: frame(-2.4, -5, { size: 'full', y: 1.6, side: 14, low: 0.45 }),
    act(lt, c) { const k = remap(lt, 0, c.d * 0.8); Q.me.reset().place(lerp(-6, 0, k), -5, k < 1 ? Math.PI / 2 - 0.4 : 0, 1.6).setFace('calm'); if (k < 1) Q.me.walk(c.t, 1); else Q.me.idle(c.t); } });
  // 29 reaching for gold
  shot({ line: 'I reached for the gold pill.', set: sq,
    cam: { pos: [-0.6, 6.4, -1.2], look: [1.6, 5.2, -5], fov: 46, blur: 0.7, push: 0.1 },
    act(lt, c) { Q.me.reset().place(0.2, -5, 0.6, 1.6).pose({ aR: [lerp(10, 80, E.out(remap(lt, c.w('reached'), c.d))), -8] }).setFace('calm').idle(c.t); } });
  // 30 then I saw him
  shot({ line: 'Then I saw him.', set: sq, sfx: [['pop', 'saw', 0.5]],
    cam: frame(0.2, -5, { size: 'close', y: 1.6, side: -10 }),
    act(lt, c) { Q.me.reset().place(0.2, -5, 0, 1.6).pose({ aR: [70, -8] }).setFace(lt < c.w('saw') ? 'calm' : 'gasp').idle(c.t); if (lt > c.w('saw')) Q.me.lookAt(6, 9); } });
  // 31-33 Mister Pickles in the crowd
  const pk = [6, 8.4];
  shot({ line: 'Old Mister Pickles, the pharmacist.', set: sq,
    cam: fromStage(pk[0], pk[1], { size: 'medium', h: 0.95, side: 170, blur: 0.6 }),
    act(lt, c) { crowd(c, 'calm', null, (x, z) => Math.abs(x - pk[0]) < 3.5 && z < pk[1] + 0.5); Q.pick.reset().place(pk[0], pk[1], Math.PI).setFace('serious').idle(c.t); } });
  shot({ line: 'The only man who ever picked black.', set: sq,
    cam: fromStage(pk[0], pk[1], { size: 'close', h: 0.95, side: 194 }),
    act(lt, c) { crowd(c, 'calm', null, (x, z) => Math.abs(x - pk[0]) < 3.5 && z < pk[1] + 0.5); Q.pick.reset().place(pk[0], pk[1], Math.PI).setFace(lt < c.w('black') ? 'serious' : 'smirk').idle(c.t); } });
  shot({ line: 'He shook his head. //', set: sq,
    cam: (lt, s) => lt < s.d - 0.75 ? fromStage(pk[0], pk[1], { size: 'face', h: 0.95, side: 180, push: 0.1 }) : frame(0.2, -5, { size: 'face', y: 1.6, side: 8, push: 0.12 }),
    act(lt, c) { crowd(c, 'calm', null, (x, z) => Math.abs(x - pk[0]) < 3.5 && z < pk[1] + 0.5); Q.pick.reset().place(pk[0], pk[1], Math.PI).setFace('serious').idle(c.t, 0.3); Q.pick.head.rotation.y += Math.sin(remap(lt, c.w('shook'), c.w('shook') + 0.9) * Math.PI * 4) * 0.35; Q.me.reset().place(0.2, -5, 0, 1.6).pose({ aR: [70, -8] }).setFace('gasp').idle(c.t, 0.2); } });
  // 34 the black pill
  shot({ line: 'So I took the black pill.', set: sq, sfx: [['thud', 'black', 0.7]],
    cam: frame(0.2, -5, { size: 'medium', y: 1.6, side: -16 }),
    act(lt, c) { sq.ped.black.visible = lt < c.w('took'); Q.me.reset().place(0.2, -5, 0, 1.6).setFace('serious').idle(c.t); qBlack.visible = lt >= c.w('took'); const t0 = c.w('pill') + 0.1; const k = remap(lt, c.w('took'), t0); Q.me.pose({ aR: [lerp(40, 150, E.inOut(k)), lerp(0, 26, k)] }); if (lt > t0 + 0.05) qBlack.visible = false; } });
  // 35 silence: 1 s hold on the shocked crowd
  shot({ line: 'The crowd went silent. ///', set: sq,
    cam: fromStage(slots[2][0], slots[2][1], { size: 'medium', side: 174, push: 0.09 }),
    act(lt, c) { sq.ped.black.visible = false; crowd(c, 'gasp', 'idle'); } });
  // 36-37 nothing happened
  shot({ line: 'Nothing happened.', set: sq,
    cam: frame(0.2, -5, { size: 'full', y: 1.6, side: 0, push: 0 }),
    act(lt, c) { sq.ped.black.visible = false; Q.me.reset().place(0.2, -5, 0, 1.6).setFace('blank').idle(c.t, 0.3); } });
  shot({ line: 'No money. No sparkles.', set: sq,
    cam: frame(0.2, -5, { size: 'close', y: 1.6, side: 18 }),
    act(lt, c) { sq.ped.black.visible = false; Q.me.reset().place(0.2, -5, 0, 1.6).pose(lt < c.w('no', 1) ? 'open' : 'shrug', 0.8).setFace(lt < c.w('no', 1) ? 'blank' : 'uneasy').idle(c.t); } });
  // 38-39 everybody laughed
  shot({ line: 'Everybody laughed.', set: sq, sfx: [['boing', 'laughed', 0.5]],
    cam: handheld({ pos: [0, 8.5, -3.5], look: [0, 3.6, 9], fov: 60, blur: 0.15 }, 0.8),
    act(lt, c) { crowd(c, 'laugh', i => (i % 2 ? 'point' : 'hips')); Q.ex.forEach((a, i) => { a.hip.position.y += Math.abs(Math.sin(c.t * 10 + i)) * 0.15; }); } });
  shot({ line: 'Even Theo.', set: sq,
    cam: fromStage(slots[0][0], slots[0][1], { size: 'close', side: 186 }),
    act(lt, c) { crowd(c, 'laugh'); Q.theo.reset().place(slots[0][0], slots[0][1], Math.PI).pose('point', 0.9).setFace('laugh').idle(c.t); Q.theo.hip.position.y += Math.abs(Math.sin(c.t * 11)) * 0.14; } });
  // 40 dad stares, then the camera dives into the bush (fly-through to night)
  shot({ line: 'My dad just stared at me.', set: sq, sfx: [['whoosh', 'me', 0.8]],
    cam: (lt, s) => { const k = E.in(remap(lt, s.d - 0.4, s.d)); const b = frame(11, 7, { size: 'close', h: 1.12, side: 170 }); return { ...b, pos: [lerp(b.pos[0], 14, k), lerp(b.pos[1], 1.2, k), lerp(b.pos[2], 3.4, k)], look: [lerp(b.look[0], 14, k), lerp(b.look[1], 0.8, k), lerp(b.look[2], 3, k)], push: k > 0 ? 0 : 0.07 }; },
    act(lt, c) { Q.dad.reset().place(11, 7, Math.PI).setFace('sad').idle(c.t, 0.4); QF.veil.at(lt - (c.d - 0.33), c.camera); } });
  // 41 that night
  shot({ line: 'That night, Mia got worse.', set: bedroom, sfx: [['sad', 'worse', 0.6]],
    cam: { pos: [-8.2, 7.2, 2.8], look: [-9, 2.2, 0.0], fov: 50, blur: 0.6, push: 0.08 },
    act(lt, c) { B.mia.reset().place(-9, 2.1, 0, 2.1); B.mia.root.rotation.x = -Math.PI / 2; B.mia.setFace(lt < c.w('worse') ? 'sad' : 'cry').idle(c.t, 0.3); } });
  // 42 held her hand (two-shot)
  shot({ line: 'I held her hand.', set: bedroom,
    cam: { pos: [-11.5, 7, 6.5], look: [-6.4, 3, 0.4], fov: 52, blur: 0.4 },
    act(lt, c) { B.mia.reset().place(-9, 2.1, 0, 2.1); B.mia.root.rotation.x = -Math.PI / 2; B.mia.setFace('sleepy'); B.me.reset().place(-5.4, 1.2, -Math.PI / 2).pose({ aR: [70, -10] }).setFace('sad').idle(c.t); } });
  // 43 the glow
  shot({ line: 'And my hand started glowing.', set: bedroom, sfx: [['rise', 'glowing', 0.7]],
    cam: frame(-5.4, 1.2, { size: 'close', side: 20, facing: -Math.PI / 2 + 0.6 }),
    act(lt, c) { B.me.reset().place(-5.4, 1.2, -Math.PI / 2 + 0.6).pose({ aR: [80, -6] }).setFace(lt < c.w('glowing') ? 'sad' : 'gasp').idle(c.t); glowB.on(clamp((lt - c.w('started')) / 0.6), c.t); } });
  // 44 Mia sits up (purple sparkles)
  shot({ line: 'Then Mia sat up.', set: bedroom, sfx: [['sparkle', 'sat']],
    cam: { pos: [-8, 5.4, 4.2], look: [-9, 3.2, -1.4], fov: 50, blur: 0.4 },
    act(lt, c) { const t0 = c.w('sat'), k = E.back(remap(lt, t0, t0 + 0.35)); B.mia.reset().place(-9, lerp(2.1, -1.4, k), 0, 2.1); B.mia.root.rotation.x = lerp(-Math.PI / 2, 0, k); if (k > 0.05) B.mia.sit(0.15); B.mia.setFace(lt < t0 ? 'sleepy' : 'wow').idle(c.t); BP.at(lt - t0, [-9, 1.6, -1.4], 0.8); B.me.reset().place(-5.4, 1.2, -Math.PI / 2).pose({ aR: [70, -10] }).setFace('gasp'); glowB.on(1 - remap(lt, t0, t0 + 0.8), c.t); } });
  // 45 cheeks went pink
  shot({ line: 'Her cheeks went pink.', set: bedroom,
    cam: frame(-9, -1.4, { size: 'close', h: 0.68, y: 1.0, side: 14 }),
    act(lt, c) { B.mia.reset().place(-9, -1.4, 0, 2.1).sit(0.15).setFace(lt < c.w('pink') ? 'wow' : 'joy', lt < c.w('pink') ? {} : { blush: true }).idle(c.t); } });
  // 46 "I'm hungry" + 0.6 s hold on the narrator's shocked face
  shot({ line: "She said, I'm hungry. //", set: bedroom,
    cam: (lt, s) => lt < s.d - 0.75 ? frame(-9, -1.4, { size: 'medium', h: 0.68, y: 1.0, side: -12 }) : frame(-5.4, 1.2, { size: 'face', side: 0, facing: -Math.PI / 2 + 0.5, push: 0.12 }),
    act(lt, c) { B.mia.reset().place(-9, -1.4, 0.3, 2.1).sit(0.15).pose({ aL: [40, 10], aR: [40, 10] }).setFace('say', { blush: true }).talk(c.t).idle(c.t); B.me.reset().place(-5.4, 1.2, -Math.PI / 2 + 0.5).setFace('gasp').idle(c.t, 0.2); } });
  // 47-48 the reveal
  shot({ line: "The black pill doesn't make you rich.", set: bedroom,
    cam: frame(2, 3, { size: 'close', side: -14 }),
    act(lt, c) { B.me.reset().place(2, 3, -0.1).pose({ aR: [60, 10] }).setFace(lt < c.w('rich') ? 'calm' : 'smirk').talk(c.t, 0.5).idle(c.t); glowB.on(0.6, c.t); } });
  shot({ line: 'It makes you a healer.', set: bedroom, sfx: [['sparkle', 'healer', 0.8]],
    cam: frame(2, 3, { size: 'medium', side: 12, low: 0.4 }),
    act(lt, c) { B.me.reset().place(2, 3, 0.1).pose({ aR: [150, 16] }).setFace(lt < c.w('healer') ? 'calm' : 'winkjoy').idle(c.t); glowB.on(1, c.t); BP2.at(lt - c.w('healer'), [2, 0, 3]); } });
  // 49 reversal: drone over the day street, the line outside our house
  const lineX = i => 4 + i * 3.2;
  const queue = (c, list) => list.forEach((a, i) => a.reset().place(lineX(i), 4.6 + (i % 2) * 0.4, -Math.PI / 2 + (i % 3 - 1) * 0.15).setFace(i % 2 ? 'worried' : 'sad').idle(c.t));
  shot({ line: 'By morning, the whole town knew.', set: dayStreet, sfx: [['whoosh', 0, 0.6]],
    cam: drone([10, 0, 2], { h: 30, back: 42, drift: [8, -4, -8], fov: 52 }),
    act(lt, c) { queue(c, [D.theo, D.pick, ...D.ex]); } });
  shot({ line: 'There was a line outside our house.', set: dayStreet,
    cam: { pos: [32, 5.5, 14], look: [10, 3.5, 3], fov: 50, blur: 0.2, push: 0.06 },
    act(lt, c) { queue(c, [D.theo, D.pick, ...D.ex]); } });
  shot({ line: 'Rich people get sick too.', set: dayStreet, sfx: [['pop', 'sick', 0.5]],
    cam: frame(lineX(0), 4.6, { size: 'close', side: -60, facing: 0 }),
    act(lt, c) { queue(c, [D.theo, D.pick, ...D.ex]); D.theo.setFace(lt < c.w('sick') ? 'worried' : 'shock').pose('shy', 0.6); const k = remap(lt, c.w('sick'), c.w('sick') + 0.25); D.theo.head.rotation.x += Math.sin(k * Math.PI) * 0.5; } });
  // 52 they pay in gold
  shot({ line: 'And they pay in gold.', set: kitchen, sfx: [['tick', 'gold', 0.8]],
    cam: { pos: [1, 5.6, 6], look: [0.6, 3, 0], fov: 46, blur: 0.6, push: 0.1 },
    act(lt, c) { jarG.visible = false; piles.visible = true; piles.scale.set(1, 0.4 + 0.6 * E.out(remap(lt, 0, c.d)), 1); KF.cash.at(lt - 0.05, [0.5, 2.8, -0.5], 0.7); } });
  shot({ line: "Now we're the richest family in town.", set: kitchen,
    cam: frame(-1, -2.4, { size: 'medium', h: 1.12, side: 14 }),
    act(lt, c) { jarG.visible = false; piles.visible = true; K.dad.reset().place(-1, -2.4, 0).pose('cheer', 0.9).setFace('joy').idle(c.t); K.dad.armL.rotation.z += Math.sin(c.t * 8) * 0.2; K.mia.reset().place(3.6, -2.6, -0.3).pose('cheer').setFace('joy').idle(c.t); } });
  // 54-56 the cost: Theo's hamster (payoff)
  shot({ line: 'Which is great,', set: kitchen,
    cam: frame(-3.4, 3.4, { size: 'close', side: -16 }),
    act(lt, c) { K.me.reset().place(-3.4, 3.4, 0.2).pose('open', 0.5).setFace('joy').idle(c.t); } });
  shot({ line: 'except my first patient every morning', set: kitchen,
    cam: frame(-3.4, 3.4, { size: 'medium', side: 18 }),
    act(lt, c) { K.me.reset().place(-3.4, 3.4, -0.1).pose('shrug', 0.7).setFace('uneasy').idle(c.t); } });
  shot({ line: "is Theo's hamster.", set: kitchen, sfx: [['boing', 'hamster', 0.5]],
    cam: { pos: [0.6, 4.6, 7.6], look: [0.2, 3.4, -1], fov: 50, blur: 0.4 },
    act(lt, c) { jarG.visible = false; hamK.visible = lt > c.w('hamster') - 0.05; hamK.position.set(0.6, 2.83, 0.6); hamK.rotation.y = -0.3; hamK.position.y += Math.abs(Math.sin(c.t * 6)) * 0.1; K.me.reset().place(0.2, -2.6, 0).pose({ aR: [60, 10] }).setFace(lt < c.w('hamster') ? 'calm' : 'uneasy').idle(c.t); } });
  shot({ line: 'He has a cold. Again.', set: kitchen, sfx: [['pop', 'again', 0.6]],
    cam: { pos: [0.8, 3.8, 3.2], look: [0.6, 3.15, 0.6], fov: 40, blur: 0.9, push: 0.12 },
    act(lt, c) { jarG.visible = false; hamK.visible = true; tissue.visible = true; tissue.position.set(1.4, 2.85, 0.9); const sneeze = Math.sin(remap(lt, c.w('cold'), c.w('cold') + 0.3) * Math.PI); hamK.position.set(0.6, 2.83 + sneeze * 0.25, 0.6); hamK.rotation.set(-sneeze * 0.4, -0.2, 0); } });
  // 57-58 button: dad's line, flipped
  shot({ line: 'And Dad? He still keeps saying it.', set: kitchen,
    cam: frame(-1, -2.4, { size: 'close', h: 1.12, side: -12 }),
    act(lt, c) { jarG.visible = false; piles.visible = true; K.dad.reset().place(-1, -2.4, 0).pose('hips').setFace('calm').idle(c.t); } });
  shot({ line: 'The black pill fixes everything.', set: kitchen, sfx: [['ding', 'everything', 0.6]],
    cam: frame(-1, -2.4, { size: 'face', h: 1.12, side: 8, push: 0.12 }),
    act(lt, c) { piles.visible = true; jarG.visible = false; K.dad.reset().place(-1, -2.4, 0).pose('point').setFace(lt < c.w('everything') ? 'say' : 'winkjoy').talk(c.t).idle(c.t); } });
});
