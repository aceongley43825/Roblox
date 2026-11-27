// story.js: "In this town, everybody walks backwards." (town-story-shorts style, about 60 s)
//
// THE SCRIPT (approved):
//   In this town, everybody walks backwards. Nobody remembers why. My mom walks backwards to the grocery store.
//   The mailman walks backwards with a bag full of letters. Even our dog walks backwards, and he is not happy about
//   it. Except me. I walk forwards. Everybody thinks I'm weird. At school, they call me Front Face, and nobody wants
//   to sit next to me at lunch. Then came the big summer parade. The whole town was marching backwards down Main
//   Street, with the mayor in front, smiling and waving at nobody. But I was the only one facing the right way, so I
//   was the only one who saw it. A giant hole, right in the middle of the road. [hold] Nobody else could see it,
//   because they were walking straight towards it backwards. So I ran ahead of the parade and yelled STOP! The whole
//   town froze. They turned around, and saw the hole for the first time. The mayor was one step away from falling
//   in. The next morning, he gave me a gold medal, and now everybody in town walks forwards. Everybody, except the
//   dog. [hold]
//
// World convention: Main Street runs along x. "Forwards" for the town is +x. A backwards walker faces -x
// (ry = -PI/2) while moving +x. The narrator faces +x (ry = +PI/2). The hole is on the road at x = 30, z = 13.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, bunting } from './sets.js';
import { TOWN, makeNarrator, handheld, follow, whip, drone } from './town.js';
import { makeSparkles } from './fx.js';
import { remap, E, lerp, box, glow, mat, at, grp, sign, PRE, clamp } from './util.js';

const PI = Math.PI, BACK = -PI / 2, FWD = PI / 2;
const HX = 30, HZ = 13;   // the hole

// ── a blocky dog. Head points local +x. walk(t, speed): legs swing. Angry brows (he is not happy about it).
function makeDog() {
  const fur = '#c98a4a', dark = '#7a4a24', g = grp();
  const body = at(box(2.8, 1.3, 1.3, fur, 0.2), 0, 1.7, 0);
  const head = grp(at(box(1.4, 1.3, 1.2, fur, 0.2), 0, 0, 0), at(box(0.7, 0.55, 0.75, '#e6b98a', 0.1), 0.85, -0.25, 0), at(box(0.25, 0.22, 0.3, '#1b1410', 0.05), 1.22, -0.08, 0));
  for (const s of [-1, 1]) {
    head.add(at(box(0.08, 0.2, 0.2, '#111'), 0.71, 0.18, s * 0.3));
    const brow = at(box(0.08, 0.09, 0.38, '#2a1a10'), 0.73, 0.4, s * 0.3); brow.rotation.x = s * 0.55; head.add(brow);
    head.add(at(box(0.5, 0.9, 0.18, dark, 0.06), -0.25, 0.25, s * 0.68));
  }
  head.position.set(1.75, 2.6, 0);
  const tail = at(box(0.9, 0.28, 0.28, dark, 0.08), -1.75, 2.2, 0); tail.rotation.z = 0.6;
  const legs = [];
  for (const [x, z] of [[0.95, 0.42], [0.95, -0.42], [-0.95, 0.42], [-0.95, -0.42]]) { const p = grp(at(box(0.42, 1.1, 0.42, fur, 0.08), 0, -0.55, 0)); p.position.set(x, 1.1, z); g.add(p); legs.push(p); }
  g.add(body, head, tail);
  const dog = { root: g, head, tail, legs,
    place(x, z, ry = 0) { g.position.set(x, 0, z); g.rotation.set(0, ry, 0); g.visible = true; for (const l of legs) l.rotation.z = 0; head.rotation.set(0, 0, 0); return dog; },
    walk(t, speed = 1) { const s = Math.sin(t * 9 * speed) * 0.5; legs[0].rotation.z = s; legs[3].rotation.z = s; legs[1].rotation.z = -s; legs[2].rotation.z = -s; g.position.y = Math.abs(Math.cos(t * 9 * speed)) * 0.08; tail.rotation.y = Math.sin(t * 12) * 0.4; return dog; },
    grumble(t) { head.rotation.z = -0.12 + Math.sin(t * 3) * 0.04; return dog; } };
  PRE.push(() => { g.visible = false; });
  return dog;
}
// ── the hole in the road: black pit, dirt rim, orange cones on the far side (seen only by the narrator)
function makeHole() {
  const g = grp();
  const pit = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), new THREE.MeshBasicMaterial({ color: '#050507' })); pit.rotation.x = -PI / 2; pit.position.y = 0.06;
  const rim = new THREE.Mesh(new THREE.RingGeometry(4.2, 5.0, 40), mat('#6b4a2e')); rim.rotation.x = -PI / 2; rim.position.y = 0.05;
  const wallIn = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 6, 40, 1, true), new THREE.MeshLambertMaterial({ color: '#2a1d14', side: THREE.BackSide })); wallIn.position.y = -2.95;
  g.add(pit, rim, wallIn);
  for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45, c = grp(new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.4, 16), mat('#ff6a1a')), at(box(1.0, 0.12, 1.0, '#ff6a1a'), 0, -0.7, 0)); c.children[0].castShadow = true; c.add(at(box(0.62, 0.18, 0.62, '#ffffff'), 0, 0.05, 0)); c.position.set(HX + 6.2 * Math.cos(a), 0.76, HZ + 6.2 * Math.sin(a)); g.add(c); }
  g.children.slice(0, 3).forEach(m => m.position.set(HX, m.position.y, HZ));
  return g;
}
// top hat + red sash for the mayor
function mayorize(av) {
  const hat = grp(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 1.1, 24), mat('#17171c')), at(new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.08, 28), mat('#17171c')), 0, -0.52, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.2, 24), mat('#c8262e')), 0, -0.36, 0));
  hat.position.y = HH_TOP + 0.5; av.head.add(hat); av.hair.visible = false;
  const sash = box(0.5, 2.6, 0.08, '#c8262e'); sash.position.set(0, 0.05, 0.52); sash.rotation.z = 0.75; av.torso.add(sash);
  return av;
}
const HH_TOP = 1.22;
function addMedal(av) {
  const m = grp(at(box(0.22, 0.9, 0.05, '#c8262e'), -0.22, 0.45, 0), at(box(0.22, 0.9, 0.05, '#2f5fd8'), 0.22, 0.45, 0));
  m.children[0].rotation.z = -0.35; m.children[1].rotation.z = 0.35;
  const d = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 28), mat('#ffc21a', { emissive: new THREE.Color('#6a4a00') })); d.rotation.x = PI / 2; m.add(d);
  m.position.set(0, 0.05, 0.56); av.torso.add(m); m.visible = false; return m;
}

start(() => {
  // ── sets
  const streetN = TOWN.street({ time: 'night', lit: 0.7 });
  const streetD = TOWN.street({ time: 'day' });
  const parade = TOWN.street({ time: 'sunset' });
  const morning = TOWN.street({ time: 'day', light: 'sunset' });
  const shop = SETS.shop({ sign: 'GROCERY', wall: '#eaf6e6' });
  const school = SETS.schoolFront({ name: 'MAPLE HILL SCHOOL' });
  const caf = SETS.cafeteria({ menu: 'TODAY: TACOS!' });
  // parade dressing: bunting across the street, a MAIN ST sign, the hole
  for (const x of [-30, -10, 10]) parade.group.add(at(bunting(24, ['#e94b5f', '#f2b01e', '#2f9e55', '#3d6fe0', '#8a4fd0']), x, 10.5, 6.8));
  parade.group.add(at(sign('MAIN ST', 6, 1.4, { bg: '#2f8f4a', fg: '#ffffff' }), -16, 11.8, 6.4), at(sign('SUMMER\nPARADE', 9, 3.4, { bg: '#ffcf3f', fg: '#8a1f12' }), -2, 12.5, -2));
  const hole = makeHole(); parade.group.add(hole);
  const noCars = set => set.group.children.filter(o => [[-6, 9.4], [22, 16.6], [40, 9.4]].some(([x, z]) => Math.abs(o.position.x - x) < 0.01 && Math.abs(o.position.z - z) < 0.01)).forEach(o => set.group.remove(o));
  [streetN, streetD, parade, morning].forEach(noCars);

  // ── cast: one copy per set, identical options
  const cast = (set) => {
    const c = {
      me: makeNarrator({ color: '#3553b8', print: 'forward' }),
      mom: makeAvatar({ seed: 2, skin: 'light', hair: 'ponytail', hairColor: '#6a3a1a', top: 'cardigan', topColor: '#e9739a', bottom: 'jeans', bottomColor: '#3a4f7a' }),
      mail: makeAvatar({ seed: 3, skin: 'brown', hair: 'short', hairColor: '#1b1210', top: 'shirt', topColor: '#6f9fd8', bottom: 'shorts', bottomColor: '#2a3a6a', cap: '#2a3a6a' }),
      gran: makeAvatar({ seed: 4, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true }),
      kid1: makeAvatar({ seed: 5, skin: 'tan', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' }),
      kid2: makeAvatar({ seed: 6, skin: 'deep', hair: 'buns', hairColor: '#1b1210', top: 'stripes', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' }),
      mayor: mayorize(makeAvatar({ seed: 7, skin: 'light', hair: 'short', hairColor: '#8a8a8a', top: 'suit', topColor: '#2b2f45', bottom: 'slacks', bottomColor: '#22263a' })),
    };
    const bag = grp(at(box(1.0, 1.3, 0.7, '#7a4a24', 0.1), 0, 0, 0), at(box(1.02, 0.5, 0.72, '#5e3818', 0.08), 0, 0.45, 0.02)); for (let i = 0; i < 4; i++) bag.add(at(box(0.7, 0.5, 0.04, '#ffffff'), -0.15 + i * 0.1, 0.75 + (i % 2) * 0.1, -0.2 + i * 0.12)); bag.position.set(-1.55, 0.6, 0.15); c.mail.hip.add(bag);
    for (const a of Object.values(c)) set.group.add(a.root);
    const dog = makeDog(); set.group.add(dog.root);
    return { ...c, dog, medal: addMedal(c.me), sp: makeSparkles(set.group) };
  };
  const N = cast(streetN), D = cast(streetD), P = cast(parade), M = cast(morning), SH = cast(shop), SC = cast(school), CF = cast(caf);

  // townsfolk strolling backwards on the sidewalk (face -x, move +x)
  const strollers = (X, t, x0 = -20, face = 'happy') => [X.gran, X.kid1, X.mail, X.kid2].forEach((a, i) => a.reset().place(x0 + i * 9 + t * 1.6, 3.6 + (i % 2) * 1.6, BACK).walk(t + i, -0.8).setFace(face));
  // the parade: mayor in front (biggest x), everyone marching backwards on the road
  const marchers = X => [X.mayor, X.mom, X.mail, X.gran, X.kid1, X.kid2];
  const spot = i => [-(i === 0 ? 0 : 3.4 + (i - 1) * 3.0), i === 0 ? HZ : (i % 2 ? 11.2 : 14.8)];
  const march = (X, x0, t, o = {}) => marchers(X).forEach((a, i) => { const [dx, z] = spot(i); a.reset().place(x0 + dx, z, o.ry ?? BACK); if (o.walk !== false) a.walk(t + i * 0.3, -0.75); else a.idle(t); if (i === 0 && o.wave !== false) a.pose('wave', 0.9); a.setFace(o.face ? o.face(i) : (i % 2 ? 'grin' : 'happy')); });

  // ── ACT 1: the rule
  shot({ line: 'In this town,', set: streetN, sfx: [['whoosh', 0]], cam: drone([0, 3, 4], { h: 30, back: 21, drift: [10, -4, -3], fov: 58 }),
    act(lt, c) { strollers(N, c.t, -18); } });
  shot({ line: 'everybody walks backwards.', set: streetN,
    cam: { pos: [3, 4.2, 20], look: [-8, 3.2, 7], fov: 54, blur: 0.15, push: 0.07 },
    act(lt, c) { strollers(N, c.t, -18); N.mom.reset().place(-4 + lt * 1.6, 10, BACK).walk(c.t, -0.8).setFace('happy'); N.mayor.reset().place(10 + lt * 1.6, 15, BACK).walk(c.t + 1, -0.8).setFace('happy'); } });
  shot({ line: 'Nobody remembers why.', set: streetN, cam: frame(0, 4, { size: 'close', facing: BACK, side: -14 }),
    act(lt, c) { N.gran.reset().place(lt * 0.9, 4, BACK).walk(c.t, -0.5).pose('shrug', 0.8).setFace('blank'); } });
  shot({ line: 'My mom walks backwards', set: streetD, cam: frame(-4, 4.5, { size: 'full', facing: BACK, side: -40 }),
    act(lt, c) { D.mom.reset().place(-6 + lt * 1.8, 4.5, BACK).walk(c.t, -0.8).pose('carry', 0.5).setFace('happy'); } });
  shot({ line: 'to the grocery store.', set: shop, cam: { pos: [0, 5.5, 22], look: [0, 4, 2], fov: 52, blur: 0.15, push: 0.06 },
    act(lt, c) { SH.mom.reset().place(0, 10 - lt * 2.2, 0).walk(c.t, -0.8).pose('carry', 0.5).setFace('happy'); SH.gran.reset().place(-9, 3, 0.4).setFace('smile').idle(c.t); } });
  shot({ line: 'The mailman walks backwards', set: streetD, cam: frame(8, 4, { size: 'close', facing: BACK, side: 16 }),
    act(lt, c) { D.mail.reset().place(8 + lt * 0.9, 4, BACK).walk(c.t, -0.6).setFace('smile'); } });
  shot({ line: 'with a bag full of letters.', set: streetD, cam: follow(lt => [-10 + lt * 1.8, 0, 4], [-7.5, 3.6, 5], { lookY: 3.2, fov: 54 }),
    act(lt, c) { D.mail.reset().place(-10 + lt * 1.8, 4, BACK).walk(c.t, -0.8).pose('carry').setFace('happy'); } });
  shot({ line: 'Even our dog walks backwards,', set: streetD, sfx: [['boing', 'dog', 0.5]], cam: { pos: [-2.4, 3.6, 14], look: [-2.4, 2.2, 4.4], fov: 50, blur: 0.3, push: 0.07 },
    act(lt, c) { D.dog.place(-2 + lt * 1.6, 4.4, PI).walk(c.t, -0.8); } });
  shot({ line: 'and he is not happy about it.', set: streetD, cam: { pos: [-4.6, 2.4, 6.6], look: [-0.8, 2.4, 4.4], fov: 50, blur: 0.5, push: 0.1 },
    act(lt, c) { D.dog.place(lt * 0.6, 4.4, PI).walk(c.t, -0.5).grumble(c.t); } });
  shot({ line: 'Except me.', set: streetN, sfx: [['pop', 'me', 0.5]], cam: frame(4, 4.5, { size: 'close', side: -12 }),
    act(lt, c) { N.me.reset().place(4, 4.5, -0.15).setFace(lt < c.w('me') ? 'calm' : 'winkjoy').idle(c.t); } });
  shot({ line: 'I walk forwards.', set: streetN, cam: follow(lt => [-6 + lt * 3, 0, 4.4], [9, 3.2, 9], { lookY: 3.6, fov: 54 }),
    act(lt, c) { N.me.reset().place(-6 + lt * 3, 4.4, FWD).walk(c.t, 0.9).setFace('joy'); strollers(N, c.t, -16); } });
  shot({ line: "Everybody thinks I'm weird.", set: streetN, cam: { pos: [6, 4.4, 15], look: [4, 4, 3], fov: 54, blur: 0.4, push: 0.08 },
    act(lt, c) { [N.gran, N.kid1, N.kid2].forEach((a, i) => a.reset().place(-2 + i * 4, 2.5 + (i % 2) * 1.2, 0.3 - i * 0.3).setFace(i === 1 ? 'sus' : 'smirk').idle(c.t)); N.me.reset().place(9, 5.5, -0.6).setFace('uneasy').idle(c.t); } });
  shot({ line: 'At school,', set: school, sfx: [['whoosh', 0, 0.6]], cam: drone([0, 6, -6], { h: 20, back: 42, drift: [6, -2, -6], fov: 54 }),
    act(lt, c) { SC.me.reset().place(-6 + lt * 2, 6, FWD).walk(c.t, 0.8).setFace('calm'); SC.kid1.reset().place(4 - lt, 5, BACK).walk(c.t, 0.6).setFace('happy'); } });
  shot({ line: 'they call me Front Face,', set: caf, cam: frame(0, 0, { size: 'medium', side: 14 }),
    act(lt, c) { CF.kid1.reset().place(-1.4, 0, 0.35).pose('point').setFace('laugh').talk(c.t); CF.kid2.reset().place(2.2, -0.6, -0.2).pose('hips').setFace('laugh').talk(c.t + 1); } });
  shot({ line: 'and nobody wants to sit next to me', set: caf, cam: { pos: [-4, 7.5, 18], look: [-2, 4, 3.4], fov: 52, blur: 0.3, push: 0.07 },
    act(lt, c) { [CF.kid1, CF.kid2].forEach((a, i) => a.reset().place(-2.4 + i * 4.8, 3.4, 0).sit(1.5).setFace('laugh').talk(c.t + i)); } });
  shot({ line: 'at lunch.', set: caf, sfx: [['sad', 'lunch', 0.5]], cam: { pos: [-16.4, 6.4, 9.5], look: [-17.4, 4.9, 3.4], fov: 50, blur: 0.5, push: 0.09 },
    act(lt, c) { CF.me.reset().place(-17.4, 3.4, 0).sit(1.5).setFace('sad').idle(c.t, 0.5); } });

  // ── ACT 2: the parade
  shot({ line: 'Then came the big summer parade.', set: parade, sfx: [['whoosh', 0], ['rise', 0.3, 0.4]], cam: drone([-6, 3, 8], { h: 32, back: 26, drift: [8, -3, -4], fov: 56 }),
    act(lt, c) { march(P, -6 + lt * 1.4, c.t); } });
  shot({ line: 'The whole town was marching backwards', set: parade, cam: { pos: [-8, 3.8, 26], look: [-10, 3.6, 13], fov: 56, blur: 0.25, push: 0.07 },
    act(lt, c) { march(P, -2 + lt * 1.6, c.t); } });
  shot({ line: 'down Main Street,', set: parade, cam: { pos: [-24, 5, 28], look: [-12, 8, 8], fov: 54, blur: 0.15, push: 0.08 },
    act(lt, c) { march(P, -2 + lt * 1.6, c.t); } });
  shot({ line: 'with the mayor in front,', set: parade, cam: frame(4, HZ, { size: 'close', facing: BACK, side: 18 }),
    act(lt, c) { P.mayor.reset().place(4 + lt * 0.6, HZ, BACK).walk(c.t, -0.5).setFace('grin'); } });
  shot({ line: 'smiling and waving at nobody.', set: parade, cam: frame(6, HZ, { size: 'medium', facing: BACK, side: -22 }),
    act(lt, c) { P.mayor.reset().place(6 + lt * 0.6, HZ, BACK).walk(c.t, -0.5).pose('wave', 0.9).setFace('happy'); P.mayor.armR.rotation.z -= Math.sin(c.t * 9) * 0.35; } });
  shot({ line: 'But I was the only one', set: parade, cam: frame(8, 4.4, { size: 'close', facing: FWD, side: -18 }),
    act(lt, c) { P.me.reset().place(8 + lt * 0.8, 4.4, FWD).walk(c.t, 0.5).setFace('calm'); } });
  shot({ line: 'facing the right way,', set: parade, cam: { pos: [17, 3.8, 8], look: [8, 3.6, 5], fov: 54, blur: 0.25, push: 0.07 },
    act(lt, c) { P.me.reset().place(7 + lt * 1.2, 4.4, FWD).walk(c.t, 0.6).setFace('calm'); march(P, 2 + lt * 1.4, c.t); } });
  shot({ line: 'so I was the only one who saw it.', set: parade, sfx: [['rise', 'saw', 0.5]], cam: frame(10, 4.4, { size: 'close', facing: FWD, side: 12, push: 0.12 }),
    act(lt, c) { P.me.reset().place(10, 4.4, FWD + 0.3).setFace(lt < c.w('saw') ? 'calm' : 'gasp').idle(c.t, 0.5); } });
  shot({ line: 'A giant hole, //', set: parade, sfx: [['thud', 'hole', 0.8]], cam: { pos: [HX - 9, 7, HZ + 8], look: [HX, 0, HZ], fov: 48, blur: 0.2, push: 0.1 } });
  shot({ line: 'right in the middle of the road.', set: parade, cam: drone([HX - 8, 0, HZ], { h: 30, back: 12, drift: [2, -2, -2], fov: 54 }),
    act(lt, c) { march(P, 8 + lt * 1.4, c.t); } });
  shot({ line: 'Nobody else could see it,', set: parade, cam: frame(14, HZ, { size: 'close', facing: BACK, side: -10 }),
    act(lt, c) { P.mayor.reset().place(14 + lt * 0.5, HZ, BACK).walk(c.t, -0.5).pose('wave', 0.8).setFace('grin'); } });
  shot({ line: 'because they were walking', set: parade, cam: { pos: [22, 2.4, 5], look: [12, 3, 13], fov: 56, blur: 0.25, push: 0.07 },
    act(lt, c) { march(P, 12 + lt * 1.5, c.t); } });
  shot({ line: 'straight towards it backwards.', set: parade, cam: { pos: [HX + 1, 3.2, HZ + 2], look: [HX - 14, 4, HZ], fov: 56, blur: 0.3, push: 0.05 },
    act(lt, c) { march(P, 14 + lt * 1.5, c.t); } });
  shot({ line: 'So I ran ahead of the parade', set: parade, sfx: [['whoosh', 0, 0.7]], cam: handheld(follow(lt => [6 + lt * 9, 0, 4.4], [9, 3.2, 4], { lookY: 3.4, fov: 58 }), 1.4),
    act(lt, c) { P.me.reset().place(6 + lt * 9, 4.4, FWD + 0.25).run(c.t).setFace('worried'); march(P, 13 + lt * 1.4, c.t); } });
  shot({ line: 'and yelled STOP!', set: parade, sfx: [['pop', 'stop', 0.9]], cam: frame(23, HZ, { size: 'close', facing: BACK, side: 10, push: 0.13 }),
    act(lt, c) { const y = lt >= c.w('stop'); P.me.reset().place(23, HZ, BACK).pose(y ? 'reach' : 'open', 0.9).setFace(y ? 'scream' : 'worried').talk(c.t, y ? 2 : 1); } });
  shot({ line: 'The whole town froze.', set: parade, cam: { pos: [12, 4.2, 24], look: [14, 4, 13], fov: 54, blur: 0.3, push: 0.08 },
    act(lt, c) { march(P, 19, c.t, { walk: false, wave: false, face: () => 'shock' }); P.me.reset().place(23, HZ, BACK).pose('reach', 0.7).setFace('worried'); } });
  shot({ line: 'They turned around,', set: parade, sfx: [['whoosh', 0.1, 0.5]], cam: { pos: [26, 4.6, 26], look: [16, 4, 13], fov: 54, blur: 0.25, push: 0.08 },
    act(lt, c) { const k = E.inOut(remap(lt, 0.05, 0.6)); march(P, 19, c.t, { walk: false, wave: false, ry: lerp(BACK, FWD, k), face: () => 'neutral' }); } });
  shot({ line: 'and saw the hole', set: parade, cam: { pos: [HX - 13, 5.2, HZ + 1], look: [HX, 0.5, HZ], fov: 50, blur: 0.2, push: 0.12 } });
  shot({ line: 'for the first time.', set: parade, cam: frame(16.6, 11.2, { size: 'close', facing: FWD, side: 20 }),
    act(lt, c) { march(P, 19, c.t, { walk: false, wave: false, ry: FWD, face: i => (i % 2 ? 'scream' : 'shock') }); } });
  shot({ line: 'The mayor was one step away', set: parade, sfx: [['tick', 'step', 0.6]], cam: { pos: [HX - 1, 1.5, HZ + 7], look: [HX - 5.5, 3.2, HZ], fov: 50, blur: 0.4, push: 0.08 },
    act(lt, c) { P.mayor.reset().place(HX - 5.4, HZ, FWD).pose({ aL: [60, 50], aR: [60, 50] }).setFace('worried').idle(c.t, 2); } });
  shot({ line: 'from falling in.', set: parade, sfx: [['fall', 'falling', 0.5]], cam: frame(HX - 5.4, HZ, { size: 'medium', facing: FWD, side: -30, low: 0.3 }),
    act(lt, c) { const w = Math.sin(c.t * 10) * 0.12; P.mayor.reset().place(HX - 5.4, HZ, FWD).pose({ aL: [150, 70], aR: [150, 70], lean: [12 + w * 60, w * 40] }).setFace('scream'); } });

  // ── ACT 3: the payoff
  shot({ line: 'The next morning,', set: morning, sfx: [['whoosh', 0]], cam: drone([4, 3, 6], { h: 22, back: 19, drift: [-6, -2, -3], fov: 56 }),
    act(lt, c) { M.me.reset().place(-2 + lt * 1.4, 4.6, FWD).walk(c.t, 0.6).setFace('calm'); M.mayor.reset().place(4, 4.4, -FWD).setFace('smile').idle(c.t); } });
  shot({ line: 'he gave me a gold medal,', set: morning, sfx: [['sparkle', 'medal', 0.8], ['ding', 'gold', 0.5]], cam: frame(2, 4.6, { size: 'close', side: -14 }),
    act(lt, c) { const on = lt >= c.w('gold'); M.medal.visible = on; M.me.reset().place(2, 4.6, 0).setFace(on ? 'joy' : 'calm').idle(c.t); M.mayor.reset().place(5.5, 3.6, -0.9).pose(on ? 'idle' : 'reach', 0.7).setFace('happy'); if (on) M.sp.at(lt - c.w('gold'), [2, 4.6, 5.2], 0.6); } });
  shot({ line: 'and now everybody in town walks forwards.', set: morning, cam: { pos: [-18, 5, 24], look: [-4, 3.6, 8], fov: 56, blur: 0.15, push: 0.06 },
    act(lt, c) { M.medal.visible = true; [M.mom, M.mail, M.gran, M.kid1, M.kid2, M.me].forEach((a, i) => a.reset().place(-22 + i * 5 + lt * 2, i % 2 ? 4 : 11, FWD).walk(c.t + i, 0.8).setFace(i === 5 ? 'joy' : 'happy')); } });
  shot({ line: 'Everybody,', set: morning, cam: frame(-4, 4.6, { size: 'medium', facing: FWD, side: -26 }),
    act(lt, c) { M.medal.visible = true; M.me.reset().place(-4 + lt * 2, 4.6, FWD).walk(c.t, 0.8).setFace('joy'); M.kid1.reset().place(-9 + lt * 2, 3.4, FWD).walk(c.t + 1, 0.8).setFace('happy'); } });
  shot({ line: 'except the dog. ///', set: morning, sfx: [['boing', 'dog', 0.6]], cam: { pos: [-5.6, 2.8, 9.6], look: [-3.4, 2.4, 4.4], fov: 50, blur: 0.5, push: 0.08 },
    act(lt, c) { const k = Math.min(lt, 1.1); M.dog.place(-2.4 + k * 1.0, 4.4, PI).walk(lt < 1.1 ? c.t : 0, -0.8).grumble(c.t); } });
});
