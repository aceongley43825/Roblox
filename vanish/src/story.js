// story.js: "In this town, every night at exactly midnight, one house disappears."
// One shot() per picture. `line` = words spoken in that shot (cuts land on its first word).
// '//' after a word = 0.6 s silent hold, '///' = 1.0 s. No catchphrase in this one.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TEX, floor, lampPost, tree, bush } from './sets.js';
import { TOWN, makeNarrator, house, car, skyDome, hills, handheld, drone, makeVeil } from './town.js';
import { makeSparkles } from './fx.js';
import { remap, E, lerp, clamp, box, at, grp, sign, mat, glow, shade } from './util.js';

// ── props
function flamingo() {
  const pink = mat('#ff6fae'), g = grp();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), pink); body.scale.set(1.35, 0.85, 0.8); body.position.y = 3.2; body.castShadow = true;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 10), pink); tail.rotation.z = Math.PI / 2; tail.position.set(-1.6, 3.4, 0);
  for (const z of [-0.25, 0.25]) g.add(at(box(0.12, 2.6, 0.12, '#e8508e'), 0.1, 1.3, z));
  const neck = grp(); neck.position.set(1.0, 3.6, 0);
  neck.add(at(box(0.32, 1.6, 0.32, pink), 0.25, 0.8, 0), at(box(0.32, 1.2, 0.32, pink), 0.05, 2.0, 0));
  const head = grp(); head.position.set(0.1, 2.8, 0);
  const hs = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), pink); head.add(hs);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 10), mat('#2a2226')); beak.rotation.z = -Math.PI / 2 - 0.5; beak.position.set(0.6, -0.15, 0); head.add(beak);
  for (const z of [-0.36, 0.36]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat('#111')); e.position.set(0.18, 0.12, z); head.add(e); }
  neck.add(head); g.add(body, tail, neck); g.head = head; g.neck = neck;
  return g;
}
// a house that can flicker, lose its roof and float away
function liftHouse(o) {
  const lit = house({ ...o, lit: 1 }), dark = house({ ...o, lit: 0 }), g = grp(lit, dark);
  const roofs = [lit.children[1], dark.children[1]], chim = [lit.children[2], dark.children[2]];
  const base = roofs[0].position.y, cb = chim[0].position.y;
  g.reset = () => { g.visible = true; g.position.y = 0; g.rotation.set(0, 0, 0); lit.visible = true; dark.visible = false; for (const r of roofs) { r.position.y = base; r.rotation.y = 0; } for (const c of chim) c.position.y = cb; };
  g.flicker = (on) => { lit.visible = on; dark.visible = !on; };
  g.roof = (k) => { for (const r of roofs) { r.position.y = base + k * 9; r.rotation.y = k * 0.4; } for (const c of chim) c.position.y = cb + k * 9; };
  return g;
}
const beamMat = new THREE.MeshBasicMaterial({ color: '#b98cff', transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
function beam() { const m = new THREE.Mesh(new THREE.CylinderGeometry(8, 9.5, 200, 32, 1, true), beamMat.clone()); m.position.y = 100; return m; }

// ── the street: our side at z = -9 (front walls at z = -4), road at z = 13, Kevin across at z = 33
function myStreet(time = 'night') {
  const night = time === 'night', g = grp(skyDome(night ? 'night' : 'day'), hills(night ? '#1d3320' : '#5c8a4a'));
  const conc = TEX.concrete(night ? '#8a8c92' : '#cfcbc4');
  g.add(at(floor(300, 160, TEX.grass(night ? '#2b4a26' : '#5aa04a'), 6), 0, -0.03, -40), at(floor(300, 5, conc, 4), 0, 0.02, 4.5), at(floor(300, 12, TEX.road(), 6), 0, 0.01, 13), at(floor(300, 5, conc, 4), 0, 0.02, 21.5));
  for (let i = -16; i <= 16; i++) g.add(at(box(3, 0.04, 0.4, '#e8c33a'), i * 8, 0.04, 13));
  const roof = night ? '#252a36' : '#5a3a2e';
  const S = { group: g, light: night ? 'townNight' : 'overcast' };
  S.linda = liftHouse({ color: '#e58fb0', roof, seed: 3, door: '#b8406a' }); at(S.linda, 0, 0, -9);
  S.jake = liftHouse({ color: '#3e66c9', roof, seed: 5, door: '#f2f2f2' }); at(S.jake, 19, 0, -9);
  S.far = liftHouse({ color: '#8fbf9a', roof, seed: 8 }); at(S.far, -38, 0, -9);
  g.add(S.jake, S.far); if (night) g.add(S.linda);
  else { const lot = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat('#66ad55')); lot.rotation.x = -Math.PI / 2; lot.position.set(0, 0.01, -9); g.add(lot); }
  g.add(at(house({ color: '#d9b56a', roof, lit: night ? 0.3 : 0, seed: 11 }), -19, 0, -9), at(house({ color: '#b07ad0', roof, lit: night ? 0.3 : 0, seed: 12 }), 38, 0, -9), at(house({ color: '#e09a6a', roof, lit: night ? 0.3 : 0, seed: 13 }), 57, 0, -9), at(house({ color: '#7aa0d8', roof, lit: night ? 0.3 : 0, seed: 14 }), -57, 0, -9));
  S.kevin = house({ color: '#f2c94c', roof, lit: night ? 0.6 : 0, seed: 21, door: '#c0392b' }); g.add(at(S.kevin, 10, 0, 33, Math.PI));
  for (let i = -3; i <= 3; i++) if (i !== 0) g.add(at(house({ color: ['#c97a8e', '#3e66c9', '#d9b56a', '#8fbf9a', '#b07ad0', '#e09a6a'][(i + 3) % 6], roof, lit: night ? 0.3 : 0, seed: i + 40 }), 10 + i * 19, 0, 33, Math.PI));
  for (const x of [-28, -9.5, 9.5, 28]) { g.add(at(lampPost(10), x, 0, 6.6)); if (night) { const L = new THREE.PointLight('#ffd9a0', 220, 26, 2); L.position.set(x, 10.2, 6.6); g.add(L); } }
  const leaf = night ? '#24452a' : '#3f9b3f';
  g.add(at(car('#2f9e55'), -14, 0, 9.4, Math.PI / 2), at(car('#d23a3a'), 30, 0, 16.6, -Math.PI / 2), at(tree(9, leaf), -28, 0, 0), at(tree(10, leaf), 28.5, 0, -1), at(bush(leaf), -5.5, 0, 1.4), at(bush(leaf), 9.5, 0, 1.2));
  S.hedge = grp(); for (let i = 0; i < 4; i++) S.hedge.add(at(bush(leaf), -3 + i * 2, 0, 3)); S.hedge.scale.set(1, 1.6, 1); g.add(S.hedge);
  S.flamingo = flamingo(); g.add(S.flamingo);
  // where the houses go: small houses drifting high in the sky
  S.skyHouses = grp(); for (let i = 0; i < 9; i++) { const h = house({ color: ['#e58fb0', '#8fbf9a', '#d9b56a', '#7aa0d8', '#b07ad0'][i % 5], roof, lit: 0.7, seed: 60 + i }); h.scale.setScalar(0.45 + (i % 3) * 0.12); h.position.set(-48 + i * 12, 60 + (i * 37 % 30), -70 - (i * 13 % 25)); h.rotation.set((i % 2 ? 0.2 : -0.15), i * 0.7, (i % 3 - 1) * 0.2); S.skyHouses.add(h); }
  g.add(S.skyHouses);
  S.beam = beam(); g.add(S.beam);
  S.reset = () => { for (const h of [S.linda, S.jake, S.far]) h.reset(); S.skyHouses.visible = false; S.beam.visible = false; S.flamingo.visible = true; S.hedge.visible = true;
    if (night) { at(S.flamingo, 4.5, 0, 0.5, 0.3); } else { at(S.flamingo, 15.5, 0, 0, Math.PI / 2 + 0.25); } S.flamingo.neck.rotation.y = 0; };
  S.sparks = makeSparkles(g, 3, 18); S.veil = makeVeil(g);
  return S;
}
// float a house up (k 0..1+) with a wobble; the town's vanish move
const float = (h, k) => { h.position.y = E.in(clamp(k)) * 70 + clamp(k) * 2; h.rotation.z = Math.sin(k * 5) * 0.06 * clamp(k * 3); h.rotation.x = k * 0.12; };

start(() => {
  const N = myStreet('night'), D = myStreet('day');
  const bed = TOWN.roomNight({ wall: '#3e4f8f', bed: '#c33a3a', shelf: true, rug: '#d9b33a' });
  const kroom = TOWN.roomNight({ wall: '#7a3e4a', floor: '#6a4a30', rug: '#3f6fd6' });
  // bedside clock (11:59 -> 12:00)
  const c59 = sign('11:59', 2.4, 1.1, { bg: '#121216', fg: '#ff3b30', border: '#333' }), c00 = sign('12:00', 2.4, 1.1, { bg: '#121216', fg: '#ff3b30', border: '#333' });
  bed.group.add(at(box(2.8, 2.4, 2.4, '#7a5232', 0.1), -4.6, 1.2, -4.2), at(c59, -4.6, 3.0, -3.0), at(c00, -4.6, 3.0, -3.0));
  bed.reset = () => { c59.visible = true; c00.visible = false; };
  const clock = (lt, t) => { c59.visible = lt < t; c00.visible = lt >= t; };

  // ── cast (identical options in every set)
  const OPT = {
    linda: { seed: 2, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#e58fb0', inner: '#ffffff', sleeves: 'long', bottom: 'skirt', bottomColor: '#6a4a7a', glasses: true },
    kevin: { seed: 3, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' },
    mom: { seed: 4, skin: 'light', hair: 'long', hairColor: '#7a4a2e', top: 'sweater', topColor: '#2e9e8a', sleeves: 'long', bottom: 'slacks', bottomColor: '#3a4a6b', shoe: '#2a2a30' },
    man: { seed: 5, skin: 'brown', hair: 'short', hairColor: '#1b1210', top: 'shirt', topColor: '#f2b01e', bottom: 'jeans', bottomColor: '#2f3f5f' },
    gal: { seed: 6, skin: 'deep', hair: 'buns', hairColor: '#17110f', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' },
  };
  const cast = set => { const c = { jake: makeNarrator({ color: '#2f4fc4' }) }; for (const [k, o] of Object.entries(OPT)) c[k] = makeAvatar(o); for (const a of Object.values(c)) set.group.add(a.root); return c; };
  const A = cast(N), B = cast(D), R = cast(bed), K = cast(kroom);

  // ───────── HOOK
  shot({ line: 'In this town, every night at exactly midnight,', set: N, sfx: [['whoosh', 0, 0.6]],
    cam: drone([0, 4, -8], { h: 32, back: 50, drift: [10, -4, -12], fov: 54 }),
    act(lt, c) { A.man.reset().place(-12 + lt * 2.5, 4.5, Math.PI / 2).walk(c.t, 0.9).setFace('worried'); } });
  shot({ line: 'one house disappears.', set: N, sfx: [['rise', 'disappears', 0.8], ['sparkle', 'disappears']],
    cam: { pos: [-30, 3, 26], look: [-38, 9, -9], fov: 60, blur: 0.1, push: 0.03, to: { look: [-38, 16, -9] }, ease: 'lin' },
    act(lt, c) { const t0 = c.w('disappears'); N.beam.visible = true; N.beam.position.x = -38; N.beam.position.z = -9; N.beam.material.opacity = 0.07 + 0.02 * Math.sin(lt * 20); float(N.far, (lt - t0) / 1.4); N.sparks.at(lt - t0, [-38, N.far.position.y, -4], 3); } });
  shot({ line: 'Nobody knows why,', set: N,
    cam: frame(-16, 3, { size: 'close', side: 14 }),
    act(lt, c) { A.man.reset().place(-16, 3, 0.2).pose('shrug').setFace('worried').idle(c.t); } });
  shot({ line: 'or where they go.', set: N, sfx: [['whoosh', 0, 0.4]],
    cam: { pos: [0, 2, 14], look: [0, 55, -60], fov: 62, blur: 0, push: 0.05 },
    act(lt, c) { N.skyHouses.visible = true; N.skyHouses.children.forEach((h, i) => { h.position.y = 60 + (i * 37 % 30) + lt * 2; h.rotation.y = i * 0.7 + lt * 0.3; }); } });
  shot({ line: "But there's one rule everybody follows.", set: N,
    cam: frame(-19, 0, { size: 'medium', side: -16 }),
    act(lt, c) { A.gal.reset().place(-19, -1, 0.1).pose({ aR: [88, 4] }).setFace('serious').talk(c.t); A.man.reset().place(-23, 1, 0.5).setFace('worried').idle(c.t); } });
  shot({ line: 'If your house is chosen,', set: N, sfx: [['rise', 'chosen', 0.6]],
    cam: { pos: [6, 5, 26], look: [0, 8, -9], fov: 58, blur: 0, push: 0.06 },
    act(lt, c) { const k = remap(lt, c.w('chosen') - 0.1, c.w('chosen') + 0.3); N.beam.visible = true; N.beam.position.set(0, 100, -9); N.beam.material.opacity = k * 0.09; N.linda.flicker(true); } });
  shot({ line: 'never look outside.', set: bed, sfx: [['thud', 'never', 0.5]],
    cam: frame(2, 1, { size: 'close', side: -12 }),
    act(lt, c) { R.mom.reset().place(2, 1, 0).pose({ aL: [150, -18], aR: [150, -18], head: [10, 0, 0] }).setFace('sleepy').idle(c.t, 0.4); } });

  // ───────── JAKE + NEIGHBOURS
  shot({ line: 'My name is Jake.', set: N,
    cam: frame(14, 2.5, { size: 'close', side: 12 }),
    act(lt, c) { A.jake.reset().place(14, 2.5, -0.1).setFace(lt < c.w('jake') ? 'calm' : 'smile').idle(c.t); } });
  shot({ line: "I've lived here my whole life.", set: N,
    cam: (lt) => ({ pos: [24 - lt * 2.2, 4.4, 21], look: [22 - lt * 2.2, 3.4, 4], fov: 58, blur: 0.25, push: 0 }),
    act(lt, c) { A.jake.reset().place(23 - lt * 2.2, 4, -Math.PI / 2).walk(c.t, 0.9).setFace('calm'); } });
  shot({ line: 'Next door lives Linda,', set: N,
    cam: frame(-2, 1, { size: 'medium', side: -14 }),
    act(lt, c) { A.linda.reset().place(-2, 1, 0.15).pose('wave').setFace('smile').idle(c.t); A.linda.armR.rotation.z += Math.sin(c.t * 8) * 0.25; } });
  shot({ line: 'and her pink flamingo.', set: N, sfx: [['pop', 'flamingo', 0.5]],
    cam: { pos: [7.5, 3.4, 7.5], look: [5, 4.6, 0.5], fov: 56, blur: 0.5, push: 0.1 },
    act(lt, c) { } });
  shot({ line: 'Across the street, my best friend Kevin.', set: N,
    cam: frame(10, 24, { size: 'medium', facing: Math.PI, side: 10 }),
    act(lt, c) { A.kevin.reset().place(10, 24, Math.PI).pose(lt < c.w('kevin') ? 'idle' : 'wave').setFace(lt < c.w('kevin') ? 'calm' : 'grin').idle(c.t); if (lt > c.w('kevin')) A.kevin.armR.rotation.z += Math.sin(c.t * 8) * 0.25; } });

  // ───────── THE SCREAM
  shot({ line: 'One night, at midnight,', set: bed, sfx: [['tick', 0, 0.6], ['ding', 'midnight', 0.5]],
    cam: { pos: [-4.2, 3.4, 1.2], look: [-4.6, 2.5, -3.0], fov: 46, blur: 0.4, push: 0.1 },
    act(lt, c) { clock(lt, c.w('midnight')); } });
  shot({ line: 'I heard a scream. //', set: bed, sfx: [['thud', 'scream', 0.9]],
    cam: frame(-9, 0, { size: 'close', y: 1.4, side: 22, push: 0.08 }),
    act(lt, c) { R.jake.reset().place(-9, 0, 0.2).sit(1.6).setFace(lt < c.w('scream') ? 'sleepy' : 'gasp'); R.jake.root.position.y = 0.6; if (lt < c.w('scream')) R.jake.idle(c.t, 0.4); clock(lt, -1); } });
  shot({ line: "From Linda's house.", set: N,
    cam: { pos: [-3, 4, 22], look: [0, 7, -9], fov: 56, blur: 0, push: 0.08 },
    act(lt, c) { N.linda.flicker(true); } });
  shot({ line: 'I knew the rule.', set: bed,
    cam: frame(-1, -1, { size: 'close', side: -16 }),
    act(lt, c) { R.jake.reset().place(-1, -1, 0.3).setFace('worried').idle(c.t); clock(lt, -1); } });
  shot({ line: 'But I looked anyway.', set: bed, sfx: [['whoosh', 'looked', 0.4]],
    cam: { pos: [6.4, 4.5, -5.3], look: [6, 4.3, -2.6], fov: 60, blur: 0.7, push: 0.07 },
    act(lt, c) { const k = E.out(remap(lt, 0, c.w('looked') + 0.2)); R.jake.reset().place(lerp(3, 6, k), lerp(0, -2.6, k), Math.PI).setFace(lt < c.w('looked') ? 'worried' : 'gasp'); if (k < 1) R.jake.walk(c.t, 0.8); clock(lt, -1); } });
  shot({ line: 'Her lights flickered.', set: N, sfx: [['tick', 'flickered', 0.6]],
    cam: { pos: [2, 6, 16], look: [0, 6.5, -9], fov: 54, blur: 0, push: 0.08 },
    act(lt, c) { const f = Math.floor((lt - c.w('flickered')) * 30 / 3); N.linda.flicker(lt < c.w('flickered') || [1, 0, 1, 1, 0, 0, 1, 0, 0, 0][Math.min(9, f)] === 1); } });
  shot({ line: 'The roof lifted off.', set: N, sfx: [['rise', 'lifted', 0.7]],
    cam: { pos: [-4, 2, 9], look: [0, 14, -9], fov: 60, blur: 0, push: 0.05 },
    act(lt, c) { N.linda.flicker(false); N.linda.roof(E.inOut(remap(lt, c.w('lifted'), c.w('lifted') + 0.9))); } });
  shot({ line: 'The whole house floated into the sky.', set: N, sfx: [['rise', 'floated'], ['sparkle', 'floated', 0.7]],
    cam: { pos: [3, 3, 30], look: [0, 8, -9], fov: 60, blur: 0, push: 0, to: { look: [0, 30, -9], pos: [3, 4, 34] }, t0: 0.3, ease: 'inOut' },
    act(lt, c) { const t0 = c.w('floated'); N.linda.flicker(false); N.linda.roof(1); float(N.linda, (lt - t0) / 1.6); N.beam.visible = true; N.beam.position.set(0, 100, -9); N.beam.material.opacity = 0.08; N.sparks.at(lt - t0, [0, N.linda.position.y + 2, -4], 3.2); N.flamingo.visible = true; } });
  // empty lot, then the camera dives into the hedge (fly-through to the next morning)
  shot({ line: 'Gone. No trace.', set: N, sfx: [['whoosh', 'trace', 0.7]],
    cam: (lt, s) => { const k = E.in(remap(lt, s.d - 0.42, s.d)); return { pos: [lerp(0, 0, k), lerp(4.5, 2.2, k), lerp(18 - lt * 0.6, 4.2, k)], look: [0, lerp(4, 2, k), -9], fov: 58, blur: 0, push: 0 }; },
    act(lt, c) { N.linda.visible = false; N.veil.at(lt - (c.d - 0.33), c.camera); } });

  // ───────── THE NEXT MORNING
  shot({ line: 'The next morning, only grass.', set: D, sfx: [['whoosh', 0, 0.4]],
    cam: { pos: [0, 3.5, 6], look: [0, 4, -9], fov: 60, blur: 0, push: 0, to: { pos: [0, 5.5, 22] }, ease: 'out' },
    act(lt, c) { } });
  shot({ line: 'But something was wrong.', set: D,
    cam: frame(8, 2, { size: 'close', side: 14 }),
    act(lt, c) { B.jake.reset().place(8, 2, -0.3).setFace(lt < c.w('wrong') ? 'calm' : 'uneasy').idle(c.t); B.jake.lookAt(0, -9); } });
  shot({ line: 'Kevin walked right past.', set: D,
    cam: (lt) => ({ pos: [-4 + lt * 3.4, 4, 15], look: [-6 + lt * 3.4, 4, 4.5], fov: 58, blur: 0.3, push: 0 }),
    act(lt, c) { B.kevin.reset().place(-6 + lt * 3.4, 4.5, Math.PI / 2).walk(c.t).setFace('smile'); } });
  shot({ line: "I asked, where's Linda's house?", set: D,
    cam: frame(6, 4, { size: 'close', side: -14 }),
    act(lt, c) { B.jake.reset().place(6, 4, -0.4).pose('open', 0.7).setFace('say').talk(c.t); } });
  shot({ line: "He said, who's Linda?", set: D, sfx: [['pop', 'linda', 0.4]],
    cam: frame(2, 4.5, { size: 'close', side: 14 }),
    act(lt, c) { B.kevin.reset().place(2, 4.5, 0.4).pose(lt < c.w("who's") ? 'idle' : 'shrug').setFace(lt < c.w("who's") ? 'smile' : 'say').talk(c.t); } });
  shot({ line: 'Mom said that lot was always empty.', set: D,
    cam: frame(19, -2, { size: 'medium', side: -18 }),
    act(lt, c) { B.mom.reset().place(19, -2, -0.2).pose('hips').setFace(lt < c.w('empty') ? 'say' : 'smile').talk(c.t); } });
  shot({ line: 'Nobody remembered her.', set: D,
    cam: drone([2, 2, 2], { h: 22, back: 34, drift: [-6, -2, -6], fov: 54 }),
    act(lt, c) { B.man.reset().place(-10 + lt * 3, 4.2, Math.PI / 2).walk(c.t).setFace('smile'); B.gal.reset().place(12 - lt * 3, 3.6, -Math.PI / 2).walk(c.t, 0.9).setFace('happy'); B.kevin.reset().place(-3, 22, Math.PI / 2).walk(c.t).setFace('smile'); B.kevin.root.position.x = -3 + lt * 3.2; } });
  shot({ line: 'Nobody but me.', set: D, sfx: [['sad', 'me', 0.5]],
    cam: frame(0, -6, { size: 'close', side: -10, push: 0.09 }),
    act(lt, c) { B.jake.reset().place(0, -6, 0.1).pose('slump', 0.7).setFace('sad').idle(c.t, 0.5); } });
  shot({ line: 'Then I saw', set: D,
    cam: frame(10, 3, { size: 'close', side: 14, push: 0.1 }),
    act(lt, c) { B.jake.reset().place(10, 3, 0.6).setFace(lt < c.w('saw') ? 'uneasy' : 'gasp').idle(c.t); } });
  shot({ line: 'her pink flamingo,', set: D, sfx: [['thud', 'her', 0.7]],
    cam: { pos: [18.5, 3.6, 5], look: [15.5, 4.4, 0], fov: 56, blur: 0.5, push: 0.1 },
    act(lt, c) { } });
  shot({ line: 'standing in my yard,', set: D,
    cam: { pos: [12, 5, 24], look: [17, 5, -6], fov: 56, blur: 0, push: 0.07 },
    act(lt, c) { } });
  shot({ line: 'staring at my window.', set: D, sfx: [['tick', 'window', 0.5]],
    cam: { pos: [13, 2.2, 3], look: [19, 9, -4], fov: 58, blur: 0.3, focus: [19, 8, -4], push: 0.08 },
    act(lt, c) { } });

  // ───────── THE TRUTH
  shot({ line: "The houses aren't chosen.", set: N,
    cam: { pos: [-18, 2, 14], look: [-12, 55, -60], fov: 62, blur: 0, push: 0.05 },
    act(lt, c) { N.skyHouses.visible = true; N.linda.visible = false; N.skyHouses.children.forEach((h, i) => { h.position.y = 60 + (i * 37 % 30) + lt * 2; h.rotation.y = i * 0.7 + lt * 0.3; }); } });
  shot({ line: "They're taken when someone looks.", set: bed,
    cam: { pos: [6.4, 4.5, -5.3], look: [6, 4.3, -2.6], fov: 60, blur: 0.7, push: 0.11 },
    act(lt, c) { R.jake.reset().place(6, -2.6, Math.PI).setFace(lt < c.w('looks') ? 'uneasy' : 'gasp').idle(c.t, 0.3); clock(lt, -1); } });
  shot({ line: 'The scream was bait.', set: N, sfx: [['thud', 'bait', 0.8]],
    cam: { pos: [7.5, 3.4, 7.5], look: [5, 5.2, 0.5], fov: 50, blur: 0.5, push: 0.1 },
    act(lt, c) { N.linda.visible = false; const k = E.out(remap(lt, c.w('bait'), c.w('bait') + 0.2)); N.flamingo.neck.rotation.y = -k * 1.1; } });

  // ───────── THE NEXT NIGHT
  shot({ line: 'The next night,', set: bed, sfx: [['tick', 0, 0.6], ['ding', 'night', 0.5]],
    cam: { pos: [-4.2, 3.4, 1.2], look: [-4.6, 2.5, -3.0], fov: 46, blur: 0.4, push: 0.1 },
    act(lt, c) { clock(lt, c.w('night')); } });
  shot({ line: 'I heard another scream.', set: bed, sfx: [['thud', 'scream', 0.9]],
    cam: frame(-9, 0, { size: 'close', y: 1.4, side: -18, push: 0.09 }),
    act(lt, c) { R.jake.reset().place(-9, 0, -0.1).sit(1.6).setFace(lt < c.w('scream') ? 'sleepy' : 'gasp'); R.jake.root.position.y = 0.6; if (lt < c.w('scream')) R.jake.idle(c.t, 0.4); clock(lt, 0); } });
  shot({ line: 'From my own front yard. ///', set: bed, sfx: [['sad', 'yard', 0.4]],
    cam: frame(-2, 0, { size: 'close', side: 14, push: 0.11 }),
    act(lt, c) { R.jake.reset().place(-2, 0, 0.2).setFace('gasp'); if (lt < c.w('yard') + 0.4) R.jake.idle(c.t, 0.5); clock(lt, 0); } });
  shot({ line: "So I didn't look.", set: bed,
    cam: frame(-1, -1, { size: 'close', side: -14 }),
    act(lt, c) { R.jake.reset().place(-1, -1, 0.15).pose({ aL: [150, -18], aR: [150, -18], head: [10, 0, 0] }).setFace('sleepy').idle(c.t, 0.4); clock(lt, 0); } });
  shot({ line: 'But across the street,', set: N,
    cam: { pos: [19, 6, 2], look: [10, 9, 28], fov: 56, blur: 0, push: 0.07 },
    act(lt, c) { N.flamingo.visible = false; } });
  shot({ line: 'Kevin did.', set: kroom, sfx: [['thud', 'did', 0.8]],
    cam: { pos: [6.5, 4.7, -5.6], look: [6, 4.4, -1.4], fov: 62, blur: 0.7, push: 0.11 },
    act(lt, c) { K.kevin.reset().place(6, -1.4, Math.PI).setFace(lt < c.w('did') ? 'sleepy' : 'gasp').idle(c.t, 0.3); } });
  shot({ line: 'Never look outside.', set: N, sfx: [['rise', 'never'], ['sparkle', 'outside', 0.7]],
    cam: { pos: [14, 3, 26], look: [19, 9, -9], fov: 60, blur: 0, push: 0, to: { look: [19, 24, -9] }, ease: 'inOut' },
    act(lt, c) { N.linda.visible = false; N.flamingo.visible = false; N.jake.flicker(true); N.jake.roof(E.inOut(remap(lt, 0, 0.6))); float(N.jake, (lt - 0.5) / 1.5); N.beam.visible = true; N.beam.position.set(19, 100, -9); N.beam.material.opacity = 0.08; N.sparks.at(lt - c.w('outside'), [19, N.jake.position.y + 2, -4], 3.2); } });
});
