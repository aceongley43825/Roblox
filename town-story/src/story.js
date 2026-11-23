// story.js: "In this town, every night at exactly 3 AM, all the streetlights turn red."
//
// THE SCRIPT (approved):
//   In this town, every night at exactly 3 AM, all the streetlights turn red. And there's one rule everyone follows.
//   Never go outside when the lights turn red. My parents told me it was because of dangerous criminals who roam the
//   streets at night. But one night, I decided to look out of my bedroom window. At exactly 3 AM, every streetlight
//   turned red. At first, everything seemed normal. The street was empty, and all the houses were dark. Until I noticed
//   a man standing under the streetlight across the road. He was staring straight at my window. [hold] Then he waved at
//   me. And I realized it was my dad. But my dad was supposed to be asleep down the hall. [hold] Before I could do
//   anything, every front door on the street opened at once. All the grown-ups tiptoed outside in their pajamas and
//   walked toward the park. So I broke the rule. I sneaked out the back door and followed them. At the park, I couldn't
//   believe my eyes. My mom was flying down the big slide. Mr. Hendricks next door was spinning on the merry-go-round.
//   And my teacher was hanging upside down from the monkey bars. They weren't hiding from criminals. They were playing.
//   Then my dad turned around and saw me. [hold] He said kids hog the playground all day, so 3 AM is the only time
//   grown-ups get a turn. And he made me promise to keep it secret. So now, when the lights turn red, I sneak out too,
//   as the lookout. My parents were right after all. There really are dangerous criminals roaming the streets at 3 AM.
//   And now I'm one of them. [hold]
import * as THREE from 'three';
import { start, shot, frame, LIGHTS, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, handheld, follow, drone, makeVeil, skyDome, hills } from './town.js';
import { TEX, SETS, floor, lampPost, tree, bush, bench, bed, counter } from './sets.js';
import { remap, E, lerp, clamp, box, glow, at, grp, mat, tmat, rng, canvasTex, PRE } from './util.js';

// ───────────── extra light presets for the red-streetlight hour
Object.assign(LIGHTS, {
  redNight: { amb: 0.42, hemi: 0.34, sun: 0.75, dir: [-8, 14, 10], sunColor: '#ff9c9c', bg: '#22080f', exposure: 1.1 },
  roomRed: { amb: 0.38, hemi: 0.26, sun: 0.5, dir: [4, 16, 10], sunColor: '#ffb0a8', bg: '#121624', exposure: 1.0 },
});
const RED = '#ff2418', ADULT = 1.2, PI = Math.PI;

// local time of a word inside a shot, usable from cam functions (which run before the light is applied)
const wt = (s, key) => { for (let i = s.w0; i < s.w1; i++) if (WORDS[i].cap === cap(key)) return WORDS[i].s - s.s; return 0; };
const lightSwitch = (cam, key, a, b) => (lt, s) => { s.light = lt >= wt(s, key) ? b : a; return typeof cam === 'function' ? cam(lt, s) : cam; };

// streetlight controller: lamp heads + point lights + sky tint go warm <-> red
function lampCtl(group) {
  const heads = [], lights = [], skies = [];
  group.traverse(o => {
    if (o.isPointLight) lights.push([o, o.color.clone(), o.intensity]);
    if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === 1.1 && o.geometry.parameters.height === 1.3) heads.push(o);
    if (o.isMesh && o.geometry.type === 'SphereGeometry' && o.geometry.parameters.radius === 420) skies.push(o);
  });
  const warm = new THREE.Color('#fff3c4').multiplyScalar(1.2), red = new THREE.Color(RED).multiplyScalar(2.4);
  return (on) => {
    heads.forEach(h => h.material.color.copy(on ? red : warm));
    lights.forEach(([l, c, i]) => { l.color.set(on ? RED : c); l.intensity = on ? i * 1.7 : i; });
    skies.forEach(s => s.material.color.set(on ? '#e08a90' : '#ffffff'));
  };
}
// looking out of the bedroom window: a dark frame + curtains stuck to the camera
function winFrame(parent) {
  const m = new THREE.MeshBasicMaterial({ color: '#21141b', depthTest: false, depthWrite: false, toneMapped: false });
  const cm = new THREE.MeshBasicMaterial({ color: '#4a1622', depthTest: false, depthWrite: false, toneMapped: false });
  const g = grp(), add = (w, h, x, y, mm, ro) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mm); b.position.set(x, y, 0); b.renderOrder = ro; g.add(b); };
  add(0.16, 0.5, -0.36, 0, cm, 999); add(0.16, 0.5, 0.36, 0, cm, 999);
  g.children.forEach(c => { c.scale.y = 4.6; });
  add(0.2, 2.4, -0.5, 0, m, 998); add(0.2, 2.4, 0.5, 0, m, 998); add(1.3, 0.3, 0, 0.98, m, 998); add(1.3, 0.42, 0, -0.95, m, 998); add(0.03, 2, 0, 0, m, 998); add(1, 0.03, 0, 0.12, m, 998);
  g.visible = false; parent.add(g); PRE.push(() => { g.visible = false; });
  return { at(camera) { g.visible = true; g.position.copy(camera.position); g.quaternion.copy(camera.quaternion); g.translateZ(-1); g.scale.setScalar(Math.tan(camera.fov * PI / 360)); } };
}
// red LED alarm clock
function makeClock() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.9, 1.9, 1.9), toneMapped: false }));
  const cl = grp(at(box(1.9, 1.0, 0.7, '#1b1c22', 0.12), 0, 0, 0), at(face, 0, 0, 0.36));
  let last = ''; cl.set = (s) => { if (s === last) return; last = s; g.fillStyle = '#060607'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#ff2a1e'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = '800 86px Montserrat'; g.fillText(s, 116, 68); g.font = '800 26px Montserrat'; g.fillText('AM', 226, 96); t.needsUpdate = true; };
  cl.set('2:59'); return cl;
}

// ───────────── the park (playground): slide, merry-go-round, monkey bars, swings
const SL = { x0: -10.4, y0: 6.0, x1: -1.9, y1: 0.8 }, SL_ANG = Math.atan2(SL.y0 - SL.y1, SL.x1 - SL.x0);
const MGR = [8, 0, -1], BARS = [1, 9, -10], SW = { x: [13, 17], y: 10, z: -10, len: 6.8 };
function park(o = {}) {
  const day = o.time === 'day', g = grp(skyDome(day ? 'day' : 'night'), hills(day ? '#5c8a4a' : '#1d3320', -140));
  g.add(at(floor(260, 160, TEX.grass(day ? '#5aa04a' : '#2b4a26'), 6), 0, -0.03, -10), at(floor(46, 30, TEX.concrete(day ? '#d9b48a' : '#9a7258'), 4), 1, 0.01, -5));
  const r = rng(31), tc = day ? '#3f9b3f' : '#24452a';
  for (let i = 0; i < 14; i++) g.add(at(tree(9 + r() * 4, tc), -46 + i * 7 + r() * 3, 0, -26 - r() * 14));
  for (const [x, z] of [[-30, 2], [32, 0], [-34, -12], [34, -14], [-14, 24], [10, 26], [26, 18], [-28, 18]]) g.add(at(tree(10 + r() * 3, tc), x, 0, z));
  // slide
  g.add(at(box(3.4, 0.3, 3.4, '#3d6fe0'), -12, 6, -2));
  for (const [x, z] of [[-13.5, -3.5], [-10.5, -3.5], [-13.5, -0.5], [-10.5, -0.5]]) g.add(at(box(0.3, 7.6, 0.3, '#f2b01e'), x, 3.8, z));
  for (const z of [-3.6, -0.4]) g.add(at(box(3.2, 0.2, 0.2, '#f2b01e'), -12, 7.5, z));
  g.add(at(box(0.2, 0.2, 3.2, '#f2b01e'), -13.6, 7.5, -2));
  for (let i = 0; i < 6; i++) g.add(at(box(0.25, 0.25, 2.8, '#e8e8ea'), -14.1, 0.9 + i * 1.0, -2));
  g.add(at(box(0.25, 6.6, 0.25, '#e8e8ea'), -14.1, 3.3, -3.3), at(box(0.25, 6.6, 0.25, '#e8e8ea'), -14.1, 3.3, -0.7));
  const L = Math.hypot(SL.x1 - SL.x0, SL.y0 - SL.y1), mid = [(SL.x0 + SL.x1) / 2, (SL.y0 + SL.y1) / 2];
  const plank = box(L, 0.3, 2.4, '#e8432f'); plank.position.set(mid[0], mid[1], -2); plank.rotation.z = -SL_ANG; g.add(plank);
  for (const z of [-3.25, -0.75]) { const rr = box(L, 0.7, 0.16, '#c9301f'); rr.position.set(mid[0], mid[1] + 0.4, z); rr.rotation.z = -SL_ANG; g.add(rr); }
  g.add(at(box(2, 0.3, 2.4, '#e8432f'), -1.1, 0.65, -2), at(box(0.3, 3.4, 0.3, '#f2b01e'), -6, 1.7, -2));
  // merry-go-round
  const mgr = grp(), discTex = canvasTex(256, 256, (c, w) => { const cs = ['#e8432f', '#f2d33c', '#3d6fe0', '#2f9e55']; for (let i = 0; i < 8; i++) { c.fillStyle = cs[i % 4]; c.beginPath(); c.moveTo(w / 2, w / 2); c.arc(w / 2, w / 2, w / 2, i * PI / 4, (i + 1) * PI / 4); c.fill(); } });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.4, 32), [mat('#c9c9cf'), tmat(discTex), mat('#8a8a90')]); disc.position.y = 0.7; disc.castShadow = disc.receiveShadow = true; mgr.add(disc);
  mgr.add(at(box(0.5, 3.4, 0.5, '#e8e8ea'), 0, 2.2, 0));
  for (let k = 0; k < 4; k++) { const a = k * PI / 2; mgr.add(at(box(0.18, 2.6, 0.18, '#f2f2f2'), Math.sin(a) * 1.6, 2.2, Math.cos(a) * 1.6)); const bar = box(3.4, 0.18, 0.18, '#f2f2f2'); bar.position.set(Math.sin(a) * 0.8, 3.4, Math.cos(a) * 0.8); bar.rotation.y = a + PI / 2; mgr.add(bar); }
  g.add(at(mgr, MGR[0], 0, MGR[2]));
  // monkey bars (top at y 9)
  const [bx, by, bz] = BARS; for (const x of [-4, 4]) for (const z of [-1.2, 1.2]) g.add(at(box(0.35, by, 0.35, '#2f9e55'), bx + x, by / 2, bz + z));
  for (const z of [-1.2, 1.2]) g.add(at(box(8.4, 0.3, 0.3, '#2f9e55'), bx, by, bz + z));
  for (let i = 0; i < 8; i++) g.add(at(box(0.18, 0.18, 2.4, '#e8e8ea'), bx - 3.5 + i, by, bz));
  for (const x of [-4, 4]) for (let i = 0; i < 6; i++) g.add(at(box(0.18, 0.18, 2.4, '#e8e8ea'), bx + x, 1.2 + i * 1.3, bz));
  // swings
  g.add(at(box(0.4, SW.y, 0.4, '#d9466a'), 11, SW.y / 2, SW.z), at(box(0.4, SW.y, 0.4, '#d9466a'), 19, SW.y / 2, SW.z), at(box(8.4, 0.4, 0.4, '#d9466a'), 15, SW.y, SW.z));
  const swings = SW.x.map(x => { const p = grp(at(box(0.06, SW.len, 0.06, '#cfcfd6'), -0.9, -SW.len / 2, 0), at(box(0.06, SW.len, 0.06, '#cfcfd6'), 0.9, -SW.len / 2, 0), at(box(2, 0.25, 1.2, '#1b1c22', 0.05), 0, -SW.len, 0)); at(p, x, SW.y, SW.z); g.add(p); return p; });
  // benches, lamps, the hiding bush
  g.add(at(bench(), -20, 0, -4, 0.3), at(bench(), 22, 0, -2, -0.3));
  for (const [x, z] of [[-20, 6], [20, 6], [0, -20]]) { g.add(at(lampPost(10), x, 0, z)); if (!day) { const Lt = new THREE.PointLight('#ffd9a0', 260, 32, 2); Lt.position.set(x, 10.2, z); g.add(Lt); } }
  const hide = bush(day ? '#3f9b3f' : '#24452a'); hide.scale.setScalar(1.8); g.add(at(hide, -3, 0, 10)); const hide2 = bush(day ? '#3f9b3f' : '#24452a'); hide2.scale.setScalar(1.4); g.add(at(hide2, -7, 0, 10.5));
  if (!day) { const fill = new THREE.PointLight('#ff6a5a', 150, 40, 1.6); fill.position.set(0, 13, 6); g.add(fill); }
  const set = { group: g, light: day ? 'overcast' : 'redNight', mgr, swings };
  if (!day) lampCtl(g)(true);
  set.reset = () => { mgr.rotation.y = 0; swings.forEach(s => s.rotation.x = 0); };
  set.slideY = x => SL.y0 + 0.18 - (x - SL.x0) * Math.tan(SL_ANG);
  set.slide = (av, k, arms = true) => { // k 0 = top of the slide, 1 = bottom
    if (k <= 0) { av.place(-11.4, -2, PI / 2, 6.15).sit(0); }
    else { const x = lerp(SL.x0, SL.x1 - 0.6, clamp(k)); av.place(x, -2, PI / 2, k >= 1 ? 0.8 : set.slideY(x)).sit(0); if (k < 1) av.root.rotation.x = -0.28; }
    if (arms) av.pose({ aL: [150, 30], aR: [150, 30] });
    return av;
  };
  set.ride = (av, a, rad = 2.5) => { mgr.rotation.y = a; av.place(MGR[0] + Math.sin(a) * rad, MGR[2] + Math.cos(a) * rad, a, 0.9); return av; };
  set.hang = (av, t, upright = false) => { // upside down by the knees from the bars
    const h = av.root.scale.x;
    if (upright) { av.place(bx, bz, 0, by - 5.75 * h).pose('cheer'); av.root.rotation.x = Math.sin(t * 2.4) * 0.12; }
    else { av.place(bx, bz, 0, by + 0.1).pose('cheer'); av.root.rotation.z = PI; av.root.rotation.x = Math.sin(t * 2) * 0.16; }
    return av;
  };
  set.swing = (av, i, t, amp = 0.7) => { const a = Math.sin(t * 2.2 + i * 1.7) * amp; swings[i].rotation.x = a; av.place(SW.x[i], SW.z - SW.len * Math.sin(a), 0, SW.y - SW.len * Math.cos(a) + 0.15).sit(0); av.root.rotation.x = a; av.pose({ aL: [150, 8], aR: [150, 8] }); return av; };
  return set;
}

start(() => {
  // ── sets
  const stWarm = TOWN.street({ time: 'night', lit: 0.45 });
  const stRed = TOWN.street({ time: 'night', lit: 0 }); stRed.light = 'redNight'; stRed.lamp = lampCtl(stRed.group);
  const bedroom = TOWN.roomNight({ wall: '#3e4f8f', bed: '#c33a3a', shelf: true });
  const parentsRoom = TOWN.roomNight({ wall: '#5b4a72', bed: '#8a5aa8', rug: '#c9a24a' });
  const living = SETS.livingRoom();
  const kitchen = TOWN.roomNight({ wall: '#4f6b5c', floor: '#7a5230', rug: '#9a4a3a' });
  const parkR = park(), parkD = park({ time: 'day' });

  // the town rule sign (both streets)
  for (const s of [stWarm, stRed]) s.group.add(at(grp(at(box(0.3, 9.4, 0.3, '#17181c'), 0, 4.7, -0.25), at(box(5.4, 4.6, 0.25, '#c21f1f'), 0, 7, -0.08),
    at((() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.2), new THREE.MeshLambertMaterial({ map: canvasTex(640, 538, (g, w, h) => { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#c21f1f'; g.textAlign = 'center'; g.font = '900 64px Montserrat'; g.fillText('TOWN RULE', w / 2, 100); g.fillRect(60, 130, w - 120, 8); g.font = '800 52px Montserrat'; ['NEVER GO OUTSIDE', 'WHEN THE LIGHTS', 'TURN RED'].forEach((l, i) => g.fillText(l, w / 2, 230 + i * 92)); }) })); return m; })(), 0, 7, 0.06)), -4, 0, 3));
  // front doors that swing open (stRed). Front-row house positions replicate TOWN.street's seeded layout.
  const zr = rng(4), FRONT = []; for (let i = -6; i <= 6; i++) FRONT.push([i * 19, -8 - zr() * 3 + 5]);
  const doors = FRONT.map(([x, zf]) => { const hole = new THREE.Mesh(new THREE.PlaneGeometry(2, 4.1), glow('#ffb060', 0.75)); hole.position.set(x, 2.05, zf + 0.24); stRed.group.add(hole); const piv = grp(at(box(2, 4.1, 0.14, '#7a4a2a'), 1, 2.05, 0), at(box(0.25, 0.25, 0.25, '#d8c070'), 1.7, 2.1, 0.12)); at(piv, x - 1, 0, zf + 0.32); stRed.group.add(piv); return piv; });
  const openDoors = (fn) => doors.forEach((d, i) => { d.rotation.y = -1.75 * clamp(fn(i)); });
  const ZF0 = FRONT[6][1];   // the house at x = 0
  stRed.reset = () => { stRed.lamp(true); openDoors(() => 0); };
  const winF = winFrame(stRed.group);
  // bedroom: red glow in the window, a nightstand with the alarm clock
  const redPane = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), glow(RED, 1.3)); redPane.position.set(6, 7, -5.69); bedroom.group.add(redPane);
  const winL = new THREE.PointLight('#ff3020', 0, 30, 1.6); winL.position.set(6, 6.5, -3.5); bedroom.group.add(winL);
  bedroom.red = (on) => { redPane.visible = on; winL.intensity = on ? 170 : 0; };
  bedroom.reset = () => bedroom.red(false);
  const clock = makeClock(); bedroom.group.add(at(box(2.2, 2.4, 2, '#6a4428'), -4.2, 1.2, -4.4), at(clock, -4.2, 2.9, -4.3));
  // parents' room: an empty bed with the blanket thrown back
  parentsRoom.group.add(at(box(4.6, 0.55, 3, '#8a5aa8', 0.2), -9.4, 2.05, 2.6), at(box(3.2, 0.6, 1.6, '#ffffff', 0.25), -7.6, 2.2, -3.2));
  // kitchen: counter, fridge, the back door (opens onto red light), red window
  kitchen.group.add(at(counter(9, '#e8e2d6', '#6a5a4a'), 7, 0, -4.6), at(box(4, 8, 3, '#f4f4f6', 0.2), 13, 4, -4.2));
  kitchen.group.add(at(box(4.3, 8.3, 0.3, '#e8e2d6'), -6, 4.15, -5.85));
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 7.8), glow('#ff3a28', 0.9)); outside.position.set(-6, 3.9, -5.68); kitchen.group.add(outside);
  const kdoor = grp(at(box(3.7, 7.8, 0.2, '#7a4a2a'), 1.85, 3.9, 0), at(box(0.3, 0.3, 0.3, '#d8c070'), 3.2, 3.8, 0.15)); at(kdoor, -7.85, 0, -5.55); kitchen.group.add(kdoor);
  const kred = new THREE.PointLight('#ff3020', 0, 26, 1.6); kred.position.set(-6, 5, -3.5); kitchen.group.add(kred);
  const kpane = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), glow(RED, 1.1)); kpane.position.set(6, 7, -5.69); kitchen.group.add(kpane);
  kitchen.reset = () => { kdoor.rotation.y = 0; kred.intensity = 25; };

  // ── cast: one copy per set, identical options
  const cast = (set, kids = false) => {
    const c = {
      me: makeNarrator({ color: '#3553b8', print: 'night owl' }),
      dad: makeAvatar({ seed: 21, skin: 'light', hair: 'short', hairColor: '#4a2e1c', top: 'stripes', topColor: '#5b8fe0', stripe: '#3a64b8', sleeves: 'long', bottom: 'plain', bottomColor: '#3f6fc4', shoe: '#7a4a2a', sole: '#5a3a20', height: ADULT }),
      mom: makeAvatar({ seed: 22, skin: 'tan', hair: 'long', hairColor: '#6a2e14', top: 'stripes', topColor: '#f29cc0', stripe: '#ffffff', sleeves: 'long', bottom: 'plain', bottomColor: '#e47aa6', shoe: '#f4f4f4', height: ADULT }),
      hen: makeAvatar({ seed: 23, skin: 'fair', hair: 'buzz', hairColor: '#d6d6da', glasses: true, top: 'cardigan', topColor: '#8a5a3a', inner: '#e8dcc0', sleeves: 'long', bottom: 'plain', bottomColor: '#6a5a4a', shoe: '#3a2a1a', height: ADULT }),
      tea: makeAvatar({ seed: 24, skin: 'brown', hair: 'bob', hairColor: '#1e130e', glasses: true, top: 'tee', topColor: '#7fc98a', sleeves: 'long', bottom: 'plain', bottomColor: '#4fa86a', shoe: '#f4f4f4', height: ADULT }),
      n1: makeAvatar({ seed: 25, skin: 'deep', hair: 'curly', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', sleeves: 'long', bottom: 'plain', bottomColor: '#d9b52a', height: ADULT }),
      n2: makeAvatar({ seed: 26, skin: 'light', hair: 'ponytail', hairColor: '#e0a040', top: 'tee', topColor: '#b38cff', sleeves: 'long', bottom: 'plain', bottomColor: '#8a6ad0', height: ADULT }),
    };
    if (kids) { const cs = ['#e94b5f', '#3d6fe0', '#f2b01e', '#2f9e55', '#8a4fd0', '#19a7a0', '#ff7a2f', '#ff7ac2'], hs = ['messy', 'curly', 'ponytail', 'spiky', 'buns', 'short', 'afro', 'bob'], sk = ['light', 'brown', 'fair', 'tan', 'deep', 'light', 'dark', 'tan'];
      c.kids = cs.map((col, i) => makeAvatar({ seed: 40 + i, skin: sk[i], hair: hs[i], hairColor: ['#2a1a12', '#e8a03a', '#1b1210', '#7a3b1e'][i % 4], top: 'tee', topColor: col, bottom: i % 2 ? 'shorts' : 'jeans', bottomColor: i % 2 ? '#2f4f8a' : '#4f79a7', height: 0.72 })); }
    for (const a of [...Object.values(c).filter(a => a.root), ...(c.kids || [])]) { a.root.rotation.order = 'YXZ'; set.group.add(a.root); }
    return c;
  };
  const W = cast(stWarm), R = cast(stRed), B = cast(bedroom), LV = cast(living), K = cast(kitchen), P = cast(parkR), D = cast(parkD, true);
  const vR = makeVeil(stRed.group), vP = makeVeil(parkR.group);
  const DAD = [9.6, 5.0];   // under the streetlight across the road
  const WIN = [6, -3.3];    // the narrator's spot at the bedroom window

  // everyone playing in the red park (used by several shots). skip: names to leave out.
  const play = (t, skip = []) => {
    const on = k => !skip.includes(k);
    if (on('mom')) parkR.slide(P.mom.reset(), 0).setFace('joy').idle(t);
    if (on('hen')) { parkR.ride(P.hen.reset(), t * 1.6).pose('cheer').setFace('joy').talk(t); }
    if (on('tea')) parkR.hang(P.tea.reset(), t).setFace('joy');
    if (on('n1')) parkR.swing(P.n1.reset(), 0, t).setFace('joy');
    if (on('n2')) parkR.swing(P.n2.reset(), 1, t + 0.8).setFace('joy');
    if (on('dad')) P.dad.reset().place(-1, 5, PI * 0.9).pose('open', 0.6).setFace('joy').talk(t);
  };
  const kidsPlay = (t) => {
    const k = D.kids; parkD.slide(k[0].reset(), (t * 0.8) % 1.3).setFace('joy');
    parkD.slide(k[1].reset(), 0).setFace('joy'); parkD.swing(k[2].reset(), 0, t).setFace('joy'); parkD.swing(k[3].reset(), 1, t + 1).setFace('joy');
    parkD.ride(k[4].reset(), t * 1.8).pose('cheer').setFace('joy'); k[5].reset().place(MGR[0] + Math.sin(t * 1.8 + PI) * 2.4, MGR[2] + Math.cos(t * 1.8 + PI) * 2.4, t * 1.8 + PI, 0.9).pose('cheer').setFace('joy');
    parkD.hang(k[6].reset(), t, true).setFace('joy');
    k[7].reset().place(-4 + Math.sin(t * 1.4) * 4, 3, Math.cos(t * 1.4) > 0 ? PI / 2 : -PI / 2).run(t).setFace('joy');
  };

  // ═════════ ACT 1: the rule
  shot({ line: 'In this town, every night', set: stWarm, sfx: [['whoosh', 0]], cam: drone([0, 4, -4], { h: 30, back: 44, drift: [8, -2, -8], fov: 52 }) });
  shot({ line: 'at exactly 3 AM,', set: bedroom, sfx: [['tick', '3', 0.9]], cam: { pos: [-4.2, 3.7, 1.0], look: [-4.2, 2.55, -4.3], fov: 40, blur: 0.3, push: 0.1 },
    act(lt, c) { clock.set(lt < c.w('3') ? '2:59' : '3:00'); } });
  shot({ line: 'all the streetlights turn red.', set: stRed, sfx: [['thud', 'red', 0.8]], cam: lightSwitch({ pos: [40, 7, 14], look: [-20, 8, 4], fov: 50, blur: 0.05, push: 0.05 }, 'red', 'townNight', 'redNight'),
    act(lt, c) { stRed.lamp(lt >= c.w('red')); } });
  shot({ line: "And there's one rule everyone follows.", set: stRed, cam: { pos: [-14, 10, 30], look: [2, 4, 2], fov: 55, blur: 0, push: 0.05 } });
  shot({ line: 'Never go outside', set: stRed, cam: { pos: [-3, 5.6, 14.7], look: [-4, 5.42, 3], fov: 42, blur: 0.15, push: 0.1 } });
  shot({ line: 'when the lights turn red.', set: stRed, cam: { pos: [1.5, 4, 17], look: [8, 8, 6.6], fov: 52, blur: 0.1, push: 0.09 } });
  shot({ line: 'My parents told me', set: living, cam: { pos: [-4, 3.4, 14], look: [-4, 5.4, 1], fov: 55, blur: 0.2, push: 0.06 },
    act(lt, c) { LV.dad.reset().place(-1.8, 1, -0.2).pose('point', 0.5).setFace('say').talk(c.t); LV.mom.reset().place(-6.2, 1, 0.2).pose('hips').setFace('serious').idle(c.t); } });
  shot({ line: 'it was because of dangerous criminals', set: living, cam: frame(-1.8, 1, { size: 'close', h: ADULT, side: -12 }),
    act(lt, c) { LV.dad.reset().place(-1.8, 1, -0.1).pose('open', 0.6).setFace(lt < c.w('dangerous') ? 'say' : 'serious').talk(c.t); } });
  shot({ line: 'who roam the streets at night.', set: living, cam: frame(-6.2, 1, { size: 'close', h: ADULT, side: 14 }),
    act(lt, c) { LV.mom.reset().place(-6.2, 1, 0.15).pose('shy', 0.5).setFace('worried').talk(c.t); } });

  // ═════════ ACT 2: the window
  shot({ line: 'But one night,', set: bedroom, cam: { pos: [2, 7, 12], look: [-6, 2.5, -2], fov: 55, blur: 0.1, push: 0.05 },
    act(lt, c) { B.me.reset().place(-9, -2.4, 0, 2.0).sit(0).setFace('calm').idle(c.t); clock.set('2:58'); } });
  shot({ line: 'I decided to look out', set: bedroom, cam: frame(-9, -2.4, { size: 'close', y: 0.5, side: 16 }),
    act(lt, c) { B.me.reset().place(-9, -2.4, 0.1, 2.0).sit(0).setFace(lt < c.w('decided') ? 'calm' : 'smirk').idle(c.t); } });
  shot({ line: 'of my bedroom window.', set: bedroom, cam: { pos: [-1, 5.5, 9], look: [5, 4.5, -4], fov: 55, blur: 0.2, push: 0.05 },
    act(lt, c) { const k = clamp(lt / 1.2), x = lerp(0, WIN[0], k), z = lerp(3, WIN[1], k); B.me.reset().place(x, z, k < 1 ? Math.atan2(WIN[0], WIN[1] - 3) : PI).setFace('calm'); if (k < 1) B.me.walk(c.t, 0.8); else B.me.idle(c.t); } });
  shot({ line: 'At exactly 3 AM,', set: bedroom, sfx: [['tick', '3', 0.9]], cam: lightSwitch({ pos: [-2.2, 3.5, 0.2], look: [-4.2, 2.6, -4.3], fov: 40, blur: 0.35, push: 0.12 }, '3', 'roomNight', 'roomRed'),
    act(lt, c) { const on = lt >= c.w('3'); clock.set(on ? '3:00' : '2:59'); bedroom.red(on); } });
  shot({ line: 'every streetlight turned red.', set: stRed, sfx: [['thud', 'red', 0.8]], cam: lightSwitch({ pos: [-0.5, 8.5, 30.5], look: [4, 3.5, 4], fov: 58, blur: 0, push: 0.04 }, 'red', 'townNight', 'redNight'),
    act(lt, c) { stRed.lamp(lt >= c.w('red')); winF.at(c.camera); } });
  shot({ line: 'At first, everything seemed normal.', set: bedroom, light: 'roomRed', cam: frame(WIN[0], WIN[1], { size: 'close', facing: PI, side: 64 }),
    act(lt, c) { bedroom.red(true); B.me.reset().place(WIN[0], WIN[1], PI).setFace('calm').idle(c.t); B.me.head.rotation.y += 0.45; } });
  shot({ line: 'The street was empty,', set: stRed, cam: { pos: [-30, 3, 13], look: [10, 3.4, 6], fov: 58, blur: 0, push: 0.06 } });
  shot({ line: 'and all the houses were dark.', set: stRed, cam: { pos: [6, 6, 16], look: [-2, 6, -8], fov: 50, blur: 0.05, push: 0.08 } });
  shot({ line: 'Until I noticed a man', set: bedroom, light: 'roomRed', cam: frame(WIN[0], WIN[1], { size: 'face', facing: PI, side: 48, push: 0.1 }),
    act(lt, c) { bedroom.red(true); B.me.reset().place(WIN[0], WIN[1], PI).setFace(lt < c.w('man') ? 'calm' : 'uneasy').idle(c.t, 0.5); B.me.head.rotation.y += 0.4; } });
  shot({ line: 'standing under the streetlight', set: stRed, cam: { pos: [-0.5, 8.5, 30.5], look: [5.4, 4, 5], fov: 50, blur: 0, push: 0.05 },
    act(lt, c) { R.dad.reset().place(DAD[0], DAD[1], 0).pose({ head: [-14, 0, 0] }).setFace('sus').lookAt(-0.5, 30).idle(c.t, 0.3); winF.at(c.camera); } });
  shot({ line: 'across the road.', set: stRed, cam: { pos: [-0.5, 8.5, 30.5], look: [8.4, 4.6, 5], fov: 26, blur: 0.1, push: 0.08 },
    act(lt, c) { R.dad.reset().place(DAD[0], DAD[1], 0).pose({ head: [-14, 0, 0] }).setFace('sus').lookAt(-0.5, 30).idle(c.t, 0.3); winF.at(c.camera); } });
  shot({ line: 'He was staring straight at my window. //', set: stRed, cam: { pos: [12.4, 9.6, 15.5], look: [9.6, 6.0, 5], fov: 42, blur: 0.4, push: 0.06 },
    act(lt, c) { R.dad.reset().place(DAD[0], DAD[1], 0).pose({ head: [-18, 0, 0] }).setFace('sus').lookAt(-0.5, 30).idle(c.t, 0.15); } });
  shot({ line: 'Then he waved at me.', set: stRed, sfx: [['pop', 'waved', 0.5]], cam: frame(DAD[0], DAD[1], { size: 'medium', h: ADULT, side: -18, low: -0.25 }),
    act(lt, c) { const on = lt >= c.w('waved'); R.dad.reset().place(DAD[0], DAD[1], 0).setFace(on ? 'happy' : 'sus').lookAt(-0.5, 30); if (on) { R.dad.pose('wave'); R.dad.armR.rotation.z -= Math.sin(c.t * 11) * 0.3; } R.dad.idle(c.t); } });
  shot({ line: 'And I realized', set: bedroom, light: 'roomRed', cam: frame(WIN[0], WIN[1], { size: 'close', side: 12 }),
    act(lt, c) { bedroom.red(true); B.me.reset().place(WIN[0], WIN[1], 0).setFace(lt < c.w('realized') ? 'uneasy' : 'gasp').idle(c.t, 0.5); } });
  shot({ line: 'it was my dad.', set: stRed, cam: frame(DAD[0], DAD[1], { size: 'close', h: ADULT, side: 14, low: -0.1 }),
    act(lt, c) { R.dad.reset().place(DAD[0], DAD[1], 0).pose('wave').setFace('happy').lookAt(-0.5, 30).idle(c.t); R.dad.armR.rotation.z -= Math.sin(c.t * 11) * 0.3; } });
  shot({ line: 'But my dad', set: bedroom, light: 'roomRed', cam: frame(WIN[0], WIN[1], { size: 'face', side: -10, push: 0.1 }),
    act(lt, c) { bedroom.red(true); B.me.reset().place(WIN[0], WIN[1], -0.1).setFace('gasp').idle(c.t, 0.4); } });
  shot({ line: 'was supposed to be asleep down the hall. //', set: parentsRoom, cam: { pos: [-3.5, 5.5, 8], look: [-9, 2.2, -1], fov: 50, blur: 0.2, push: 0.06 } });
  shot({ line: 'Before I could do anything,', set: bedroom, light: 'roomRed', cam: { pos: [4.4, 5.6, 3], look: [6, 5.2, -5.5], fov: 55, blur: 0.25, push: 0.08 },
    act(lt, c) { bedroom.red(true); B.me.reset().place(WIN[0], WIN[1], PI).setFace('gasp').idle(c.t, 0.5); } });
  shot({ line: 'every front door on the street', set: stRed, cam: { pos: [2.5, 3.8, ZF0 + 10], look: [0, 2.8, ZF0], fov: 55, blur: 0.1, push: 0.08 } });
  shot({ line: 'opened at once.', set: stRed, sfx: [['whoosh', 'opened', 0.7]], cam: { pos: [16, 4.2, 4.5], look: [-10, 2.6, -6], fov: 50, blur: 0, push: 0.04 },
    act(lt, c) { const w = c.w('opened'); openDoors(i => E.out(remap(lt, w + Math.abs(i - 7) * 0.025, w + Math.abs(i - 7) * 0.025 + 0.3))); } });
  shot({ line: 'All the grown-ups tiptoed outside', set: stRed, cam: { pos: [5, 4.8, ZF0 + 17], look: [0, 3.6, ZF0 + 2.5], fov: 58, blur: 0.15, push: 0.06 },
    act(lt, c) { openDoors(() => 1); const tip = (av, x, z, ry) => av.reset().place(x, z, ry).walk(c.t, 0.55, 22).setFace('happy');
      tip(R.mom, 0.2 + lt * 0.3, ZF0 + 0.8 + lt * 1.3, 0.2); tip(R.tea, -5.5 + lt * 0.8, ZF0 + 3.5 + lt * 0.9, 0.7); tip(R.hen, 5.2 - lt * 0.5, ZF0 + 4.5 + lt * 0.8, -0.5);
      for (const a of [R.mom, R.tea, R.hen]) { a.armL.rotation.z += 0.5; a.armR.rotation.z -= 0.5; a.hip.position.y += 0.15; } } });
  shot({ line: 'in their pajamas', set: stRed, cam: { pos: [-0.5, 4.8, ZF0 + 16], look: [-0.8, 4.4, ZF0 + 6.5], fov: 50, blur: 0.4, push: 0.08 },
    act(lt, c) { openDoors(() => 1); R.hen.reset().place(1.4, ZF0 + 6 + lt * 0.6, -0.15).walk(c.t, 0.55, 22).setFace('happy'); R.tea.reset().place(-3.2, ZF0 + 5.4 + lt * 0.6, 0.15).walk(c.t + 0.3, 0.55, 22).setFace('calm'); } });
  shot({ line: 'and walked toward the park.', set: stRed, cam: (lt) => ({ pos: [12 - lt * 3, 5, 20], look: [7 - lt * 3, 3.5, 4], fov: 55, blur: 0.05, push: 0 }),
    act(lt, c) { openDoors(() => 1); [R.dad, R.mom, R.hen, R.tea, R.n1, R.n2].forEach((a, i) => a.reset().place(3 + i * 3.2 - lt * 3, 3.6 + (i % 2) * 1.6, -PI / 2).walk(c.t + i * 0.2, 0.8).setFace('happy')); } });
  shot({ line: 'So I broke the rule.', set: bedroom, light: 'roomRed', cam: frame(WIN[0], WIN[1], { size: 'close', side: -16, low: 0.3, push: 0.1 }),
    act(lt, c) { bedroom.red(true); B.me.reset().place(WIN[0], WIN[1], 0.1).pose('hips').setFace(lt < c.w('broke') ? 'calm' : 'smirk').idle(c.t); } });
  shot({ line: 'I sneaked out the back door', set: kitchen, cam: { pos: [2, 5, 8.5], look: [-5, 4.2, -3], fov: 55, blur: 0.2, push: 0.06 },
    act(lt, c) { const k = clamp(lt / (c.d * 0.9)), x = lerp(-1.5, -6, k), z = lerp(3, -3.6, k); K.me.reset().place(x, z, Math.atan2(-4.5, -6.6)).walk(c.t, 0.5, 24).setFace('smirk'); K.me.armL.rotation.z += 0.5; K.me.armR.rotation.z -= 0.5;
      const o = E.out(remap(lt, c.w('door') - 0.1, c.w('door') + 0.3)); kdoor.rotation.y = 1.6 * o; kred.intensity = 25 + 220 * o; } });
  shot({ line: 'and followed them.', set: stRed, sfx: [['whoosh', 0.9, 0.6]], cam: (lt, s) => { const p = [2 - lt * 2.8, 0, 4.6]; let pos = [p[0] + 6, 4, p[2] + 6], look = [p[0] - 3, 3, p[2]]; const k = E.in(remap(lt, s.d - 0.35, s.d)); pos = pos.map((v, i) => lerp(v, look[i], k * 0.85)); return { pos, look, fov: 55, blur: 0.15, push: 0 }; },
    act(lt, c) { openDoors(() => 1); R.me.reset().place(2 - lt * 2.8, 4.6, -PI / 2).walk(c.t, 0.8, 30).setFace('smirk'); R.me.hip.position.y -= 0.2; R.me.hip.rotation.x = 0.25;
      [R.dad, R.mom, R.hen].forEach((a, i) => a.reset().place(-22 - i * 3 - lt * 3, 3.8 + (i % 2) * 1.4, -PI / 2).walk(c.t + i * 0.3, 0.8));
      vR.at(lt - (c.d - 0.35), c.camera); } });

  // ═════════ ACT 3: the park
  shot({ line: 'At the park,', set: parkR, cam: drone([1, 2, -5], { h: 28, back: 40, drift: [-6, -2, -6], fov: 52 }),
    act(lt, c) { vP.at(Math.max(0, 0.3 - lt), c.camera); play(c.t); } });
  shot({ line: "I couldn't believe my eyes.", set: parkR, sfx: [['pop', 'eyes', 0.5]], cam: { pos: [-3, 4.6, 6.5], look: [-3, 4.5, 12], fov: 55, blur: 0.5, push: 0.08 },
    act(lt, c) { P.me.reset().place(-3, 12, PI).pose('reach', 0.4).setFace(lt < c.w('believe') ? 'calm' : 'gasp').idle(c.t, 0.5); } });
  shot({ line: 'My mom', set: parkR, cam: frame(-11.4, -2, { size: 'close', h: ADULT, y: 6.15 - 1.5 * ADULT, facing: PI / 2, side: -25 }),
    act(lt, c) { play(c.t, ['dad']); P.mom.talk(c.t); } });
  shot({ line: 'was flying down the big slide.', set: parkR, sfx: [['whoosh', 'flying', 0.8]], cam: { pos: [-5.5, 5, 17], look: [-6.5, 3.4, -2], fov: 58, blur: 0.1, push: 0.04 },
    act(lt, c) { play(c.t, ['mom', 'dad']); const k = E.in(remap(lt, c.w('flying') - 0.15, c.w('flying') + 0.9)); parkR.slide(P.mom.reset(), k).setFace('joy'); if (k >= 1) P.mom.talk(c.t); } });
  shot({ line: 'Mr. Hendricks next door', set: parkR, cam: (lt, s) => { const a = (s.s + lt) * 1.6, b = a + 0.22, hp = [MGR[0] + Math.sin(a) * 2.5, MGR[2] + Math.cos(a) * 2.5]; return { pos: [MGR[0] + Math.sin(b) * 8, 5.3, MGR[2] + Math.cos(b) * 8], look: [hp[0], 5.9, hp[1]], fov: 60, blur: 0.8, push: 0.05 }; },
    act(lt, c) { play(c.t, ['dad']); } });
  shot({ line: 'was spinning on the merry-go-round.', set: parkR, cam: handheld({ pos: [15, 6.5, 10], look: [8, 2, -1], fov: 52, blur: 0.1, push: 0.05 }, 1.2),
    act(lt, c) { play(c.t, ['dad', 'hen']); parkR.ride(P.hen.reset(), c.t * 2.8).pose('cheer').setFace('joy').talk(c.t); } });
  shot({ line: 'And my teacher', set: parkR, cam: { pos: [1.4, 1.8, -4.4], look: [1, 2.4, -10], fov: 52, blur: 0.4, push: 0.1 },
    act(lt, c) { play(c.t, ['dad']); P.tea.talk(c.t); } });
  shot({ line: 'was hanging upside down', set: parkR, cam: { pos: [5.5, 5.5, -2], look: [1, 6, -10], fov: 55, blur: 0.3, push: 0.07 },
    act(lt, c) { play(c.t, ['dad']); } });
  shot({ line: 'from the monkey bars.', set: parkR, cam: { pos: [-6, 7, 5], look: [1, 6, -10], fov: 52, blur: 0.05, push: 0.05 },
    act(lt, c) { play(c.t, ['dad']); } });
  shot({ line: "They weren't hiding from criminals.", set: parkR, cam: { pos: [3, 15, 30], look: [2, 2, -6], fov: 55, blur: 0, push: 0.04 },
    act(lt, c) { play(c.t); } });
  shot({ line: 'They were playing.', set: parkR, cam: handheld({ pos: [22, 5.5, 2], look: [15, 4.5, -10], fov: 55, blur: 0.15, push: 0.06 }, 1.1),
    act(lt, c) { play(c.t, ['dad']); P.n1.talk(c.t); P.n2.talk(c.t); } });
  shot({ line: 'Then my dad', set: parkR, cam: frame(-1, 5, { size: 'medium', h: ADULT, facing: PI, side: 30 }),
    act(lt, c) { play(c.t); } });
  shot({ line: 'turned around', set: parkR, cam: { pos: [-3.2, 4.9, 11.3], look: [-1, 5, 5], fov: 50, blur: 0.3, push: 0.08 },
    act(lt, c) { play(c.t, ['dad']); const k = E.inOut(remap(lt, c.w('around') - 0.15, c.w('around') + 0.3)); P.dad.reset().place(-1, 5, lerp(PI * 0.9, 0, k)).setFace(k < 0.6 ? 'joy' : 'gasp').idle(c.t, 0.3); } });
  shot({ line: 'and saw me. ///', set: parkR, sfx: [['thud', 'saw', 0.6]], cam: { pos: [-2.6, 4.8, 8.2], look: [-3, 4.6, 12], fov: 52, blur: 0.5, push: 0.1 },
    act(lt, c) { P.me.reset().place(-3, 12, PI).pose('reach', 0.4).setFace('gasp').idle(c.t, 0.1); } });
  shot({ line: 'He said', set: parkR, cam: frame(-1, 5, { size: 'close', h: ADULT, side: -14 }),
    act(lt, c) { play(c.t, ['dad']); P.dad.reset().place(-1, 5, 0).pose('open', 0.5).setFace('say').talk(c.t); } });
  shot({ line: 'kids hog the playground all day,', set: parkD, cam: { pos: [4, 9, 24], look: [1, 3, -5], fov: 55, blur: 0, push: 0.05 },
    act(lt, c) { kidsPlay(c.t); } });
  shot({ line: 'so 3 AM is the only time', set: parkR, cam: frame(-1, 5, { size: 'medium', h: ADULT, side: 20 }),
    act(lt, c) { play(c.t, ['dad']); P.dad.reset().place(-1, 5, 0.2).pose('open').setFace('talk').talk(c.t); } });
  shot({ line: 'grown-ups get a turn.', set: parkR, cam: handheld({ pos: [26, 6, 5], look: [14, 5, -10], fov: 55, blur: 0.2, push: 0.06 }, 1),
    act(lt, c) { play(c.t, ['dad', 'n1']); parkR.swing(P.mom.reset(), 0, c.t).setFace('joy').talk(c.t); } });
  shot({ line: 'And he made me promise', set: parkR, cam: { pos: [0.3, 5, 19], look: [0.3, 4.4, 5], fov: 50, blur: 0.3, push: 0.07 },
    act(lt, c) { play(c.t, ['dad']); P.dad.reset().place(-1.3, 5, PI / 2).pose('point').setFace(lt < c.w('promise') ? 'serious' : 'smile').talk(c.t); P.me.reset().place(1.9, 5, -PI / 2).setFace('calm').idle(c.t); P.me.head.rotation.x += Math.max(0, Math.sin(c.t * 8)) * 0.15; } });
  shot({ line: 'to keep it secret.', set: parkR, cam: frame(2.2, 5, { size: 'close', side: 12 }),
    act(lt, c) { play(c.t, ['dad']); P.me.reset().place(2.2, 5, 0.1).pose('hips').setFace('wink').idle(c.t); } });

  // ═════════ the ending: every night since
  shot({ line: 'So now, when the lights turn red,', set: stRed, sfx: [['thud', 'red', 0.8]], cam: lightSwitch(drone([0, 3, 4], { h: 30, back: 44, drift: [-8, -2, -8], fov: 52 }), 'red', 'townNight', 'redNight'),
    act(lt, c) { stRed.lamp(lt >= c.w('red')); } });
  shot({ line: 'I sneak out too,', set: stRed, cam: follow(lt => [6 - lt * 2.6, 0, 4.6], [-4, 3.6, 8], { lookY: 4 }),
    act(lt, c) { openDoors(() => 1); R.me.reset().place(6 - lt * 2.6, 4.6, -PI / 2 + 0.35).walk(c.t, 0.8).setFace('joy'); } });
  shot({ line: 'as the lookout.', set: parkR, cam: { pos: [-7, 4.2, 8], look: [-12, 10, -2], fov: 55, blur: 0.15, push: 0.06 },
    act(lt, c) { play(c.t, ['mom', 'dad', 'n1']); parkR.swing(P.mom.reset(), 0, c.t).setFace('joy'); P.me.reset().place(-12, -2, 0.4, 6.15).pose({ aR: [150, -8], aL: [0, 5] }).setFace('smug').idle(c.t); } });
  shot({ line: 'My parents were right after all.', set: stRed, cam: frame(4, 4.6, { size: 'close', side: -12 }),
    act(lt, c) { openDoors(() => 1); R.me.reset().place(4, 4.6, -0.1).pose('open', 0.5).setFace('say').talk(c.t); } });
  shot({ line: 'There really are dangerous criminals', set: parkR, cam: handheld({ pos: [2, 8, 26], look: [2, 3, 1], fov: 55, blur: 0.05, push: 0.05 }, 1.2),
    act(lt, c) { play(c.t, ['dad', 'mom', 'hen', 'n2']); [P.dad, P.mom, P.hen, P.n2].forEach((a, i) => { const ang = c.t * 1.1 + i * PI / 2; a.reset().place(2 + Math.sin(ang) * 6, 1 + Math.cos(ang) * 6, ang + PI / 2).run(c.t + i * 0.2, 0.8).setFace('joy'); }); } });
  shot({ line: 'roaming the streets at 3 AM.', set: stRed, cam: handheld({ pos: [16, 5, 12], look: [-6, 3.8, 4.5], fov: 55, blur: 0.1, push: 0.05 }, 1.2),
    act(lt, c) { openDoors(() => 1); [R.dad, R.mom, R.hen, R.tea, R.n1, R.n2].forEach((a, i) => a.reset().place(-16 + i * 2.6 + lt * 6, 3.4 + (i % 2) * 1.8, PI / 2).run(c.t + i * 0.25, 0.8).setFace('joy')); } });
  shot({ line: "And now I'm one of them. ///", set: stRed, sfx: [['pop', 'them', 0.5]], cam: frame(0, 5.4, { size: 'close', low: 0.35, side: 10, push: 0.08 }),
    act(lt, c) { openDoors(() => 1); R.me.reset().place(0, 5.4, 0).setFace(lt < c.w('them') ? 'joy' : 'winkjoy').idle(c.t); [R.dad, R.mom, R.hen].forEach((a, i) => a.reset().place(-10 + i * 3.5 + lt * 5, 0.5 - (i % 2) * 1.5, PI / 2).run(c.t + i * 0.3, 0.8).setFace('joy')); } });
});
