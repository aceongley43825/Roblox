// story.js: "In this town, everybody tapes their closet shut every night. Except me." (60 s, town-story-shorts style)
// One shot() per picture. `line` = words spoken in that shot (cuts land on its first word).
// '//' after a word = 0.6 s silent hold. ALL-CAPS words show in caps (HUSS!).
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, ball, dribble, arc, handheld, follow, whip, drone, makeVeil, goldfishBowl, partyWash } from './town.js';
import { bench, trashCan, table } from './sets.js';
import { remap, E, lerp, clamp, box, at, grp, mat, sign, canvasTex, PRE, shade } from './util.js';

// ───────────── props for this story
const tapeTex = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#b8bcc4'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 6) { g.fillStyle = `rgba(255,255,255,${0.08 + (x % 18 ? 0 : 0.1)})`; g.fillRect(x, 0, 2, h); } g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); });
const tapeM = () => new THREE.MeshLambertMaterial({ map: tapeTex, emissive: new THREE.Color('#2a2c30') });
const strip = (len, wd = 0.6) => box(len, wd, 0.05, tapeM());
const xTape = (w, h) => { const g = grp(), a = Math.atan2(h, w), L = Math.hypot(w, h); const s1 = strip(L), s2 = strip(L); s1.rotation.z = a; s2.rotation.z = -a; g.add(s1, s2); g.strips = [s1, s2]; g.L = L; return g; };
function tapeRoll() { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.17, 10, 22), tapeM()); t.castShadow = true; return t; }
// wardrobe closet against a wall. state(open 0..1, tapes 0|1|2, tapeK 0..1 for "being taped", shake)
function closet(o = {}) {
  const { w = 5, h = 8.4, color = '#e8dcc6' } = o, g = grp();
  g.add(at(box(w, h, 0.2, '#16161c'), 0, h / 2, 0));
  for (const s of [-1, 1]) g.add(at(box(0.4, h + 0.4, 0.8, '#f4f1ea'), s * (w / 2 + 0.2), (h + 0.4) / 2, 0.3));
  g.add(at(box(w + 0.8, 0.4, 0.8, '#f4f1ea'), 0, h + 0.2, 0.3), at(box(w, 0.15, 1.0, '#6a5038'), 0, h - 0.5, 0.5), at(box(w, 0.15, 1.0, '#6a5038'), 0, 3.0, 0.5), at(box(w - 0.4, 0.1, 0.1, '#9aa0a8'), 0, h - 1.3, 0.5));
  const shirts = ['#e94b3c', '#f2d33c', '#7fc98a']; shirts.forEach((c, i) => g.add(at(box(1.1, 2.2, 0.15, c), -1.3 + i * 1.3, h - 2.5, 0.5)));
  const doors = [];
  for (const s of [-1, 1]) { const p = grp(); p.position.set(s * w / 2, 0, 0.55); const d = box(w / 2 - 0.04, h - 0.05, 0.22, color, 0.04); d.position.set(-s * w / 4, h / 2, 0); p.add(d);
    for (const y of [h * 0.28, h * 0.68]) p.add(at(box(w / 2 - 0.7, h * 0.3, 0.06, shade(color, -0.07)), -s * w / 4, y, 0.13));
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat('#c9a24a')); k.position.set(-s * (w / 2 - 0.45), h * 0.48, 0.2); p.add(k); g.add(p); doors.push(p); }
  const t1 = xTape(w * 0.92, h * 0.86); t1.position.set(0, h / 2, 0.75); g.add(t1);
  const t2 = grp(strip(w + 0.6), strip(w + 0.6), strip(w + 0.6)); t2.children.forEach((s, i) => { s.position.y = [h * 0.25, h * 0.5, h * 0.75][i]; s.rotation.z = [0.06, -0.04, 0.05][i]; }); t2.position.set(0, 0, 0.8); g.add(t2);
  const def = [o.open || 0, o.tapes ?? 1];
  g.state = (open = 0, tapes = 1, tapeK = 1, shake = 0) => {
    doors[0].rotation.y = -open * 1.9 + shake; doors[1].rotation.y = open * 1.9 - shake * 0.7;
    t1.visible = tapes >= 1 && open < 0.05; t2.visible = tapes >= 2 && open < 0.05;
    t1.strips[0].scale.x = Math.max(0.001, clamp(tapeK * 2)); t1.strips[1].scale.x = Math.max(0.001, clamp(tapeK * 2 - 1)); t1.strips[1].visible = tapeK > 0.5;
    return g; };
  PRE.push(() => g.state(def[0], def[1]));
  return g;
}
function fridge() { const g = grp(at(box(3.8, 8.2, 3.4, '#eef0f3', 0.25), 0, 4.1, 0), at(box(3.84, 0.08, 3.44, '#b9bdc4'), 0, 5.6, 0), at(box(0.22, 1.6, 0.3, '#9aa0a8'), 1.4, 6.6, 1.8), at(box(0.22, 2.4, 0.3, '#9aa0a8'), 1.4, 3.6, 1.8)); const x = xTape(3.3, 7.4); x.position.set(0, 4.1, 1.8); g.add(x); return g; }
function tapedBowl() { const b = goldfishBowl(); const lid = box(2.0, 0.12, 2.0, '#9aa0a8', 0.05); lid.position.y = 3.05; const x = xTape(1.5, 1.0); x.scale.set(1, 1, 1); x.position.set(0, 2.75, 1.18); x.rotation.x = -0.5; b.add(lid, x); return b; }
const hideable = o => { PRE.push(() => { o.visible = false; }); o.visible = false; return o; };

// ───────────── cast: same options in every set (one copy per set)
const LOOKS = {
  me: () => makeNarrator({ color: '#2f4fc4', print: 'night shift' }),
  dex: () => makeAvatar({ seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' }),
  rhonda: () => makeAvatar({ seed: 7, skin: 'brown', hair: 'ponytail', hairColor: '#1b1210', top: 'tee', topColor: '#19a7a0', bottom: 'joggers', bottomColor: '#2b2f3e', height: 1.12 }),
  gran: () => makeAvatar({ seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', inner: '#f4efe6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true }),
  rival: () => makeAvatar({ seed: 6, skin: 'light', hair: 'short', hairColor: '#5a3a1a', top: 'jersey', topColor: '#d23a3a', number: '9', bottom: 'shorts', bottomColor: '#d23a3a', cap: '#d23a3a' }),
  fan1: () => makeAvatar({ seed: 4, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' }),
  fan2: () => makeAvatar({ seed: 5, skin: 'deep', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' }),
  fan3: () => makeAvatar({ seed: 8, skin: 'tan', hair: 'messy', hairColor: '#3a2416', top: 'stripes', topColor: '#ff8a5c', stripe: '#ffffff', bottom: 'jeans', bottomColor: '#2f4f7a' }),
  fan4: () => makeAvatar({ seed: 9, skin: 'fair', hair: 'long', hairColor: '#c98a3a', top: 'sweater', topColor: '#3d6fe0', bottom: 'skirt', bottomColor: '#2b2f3e' }),
  fan5: () => makeAvatar({ seed: 10, skin: 'dark', hair: 'buzz', hairColor: '#111', top: 'vest', topColor: '#f2b01e', bottom: 'cargo', bottomColor: '#5a5a40' }),
};
function cast(set, names, nBalls = 1) {
  const c = {}; for (const n of names) { c[n] = LOOKS[n](); set.group.add(c[n].root); }
  c.balls = []; for (let i = 0; i < nBalls; i++) { const b = hideable(ball()); set.group.add(b); c.balls.push(b); }
  c.ball = c.balls[0]; return c;
}

start(() => {
  // ── sets
  const street = TOWN.street({ time: 'night', litAll: true });
  const courtN = TOWN.court({ time: 'night', banner: 'TOWN FINALS' });
  const courtS = TOWN.court({ time: 'sunset', banner: 'TOWN FINALS' });
  const courtD = TOWN.court({ time: 'day', banner: 'TOWN FINALS' });
  const myRoom = TOWN.roomNight({ wall: '#3e4f8f', bed: '#2f4fc4', shelf: true, rug: '#e8c33a' });
  const dexRoom = TOWN.roomNight({ wall: '#3d6b5a', bed: '#e94b3c', rug: '#f2b01e' });
  const rhRoom = TOWN.roomNight({ wall: '#6a4f8f', mats: true, bag: true, rug: '#7fc98a' });
  const granRoom = TOWN.roomNight({ wall: '#9a5f7a', bed: '#b58ad6', rug: '#e8c33a' });
  const mayorRoom = TOWN.roomNight({ wall: '#7a5a3a', floor: '#5a3a24', rug: '#a8323a' });

  // ── props in sets
  const myCl = closet({ tapes: 0, color: '#d9c7a6' }); myRoom.group.add(at(myCl, -2.5, 0, -5.7));
  const myBall = hideable(ball()); myCl.add(at(myBall, 1.2, 3.65, 0.6));
  const myBowl = hideable(tapedBowl()); myCl.add(at(myBowl, 0, 0, 1.0));
  const myRoll = hideable(tapeRoll());
  const dexCl = closet({ tapes: 2, color: '#e8dcc6' }); dexRoom.group.add(at(dexCl, -2.5, 0, -5.7));
  const trash = grp(trashCan('#5a6a7a')); const r1 = tapeRoll(), r2 = tapeRoll(); r1.rotation.x = 1.3; r1.position.set(0.1, 2.0, 0); r2.rotation.set(0.6, 0.4, 0); r2.position.set(-0.3, 2.2, 0.2); trash.add(r1, r2); hideable(trash); dexRoom.group.add(at(trash, 1.8, 0, -3.2));
  const dexFloorTape = hideable(grp(strip(2.6), strip(2.2))); dexFloorTape.children[0].rotation.set(-Math.PI / 2, 0, 0.3); dexFloorTape.children[1].rotation.set(-Math.PI / 2, 0, -0.9); dexFloorTape.children[1].position.set(0.4, 0, 0.6); dexRoom.group.add(at(dexFloorTape, -1.5, 0.07, -1.5));
  const rhCl = closet({ tapes: 1, color: '#efe0c8' }); rhRoom.group.add(at(rhCl, -9, 0, -5.7));
  rhRoom.group.add(at(fridge(), 11, 0, -3.8));
  const granCl = closet({ tapes: 1, color: '#e8dcc6' }); granRoom.group.add(at(granCl, -2.5, 0, -5.7));
  const mayorBowl = tapedBowl(); mayorRoom.group.add(at(table(5, 3, '#6a4428', 3.0), 0, 0, -1), at(mayorBowl, 0, 3.13, -1), at(sign("MAYOR'S OFFICE", 7, 1.4, { bg: '#e2b23a', fg: '#3a2408' }), 0, 9.2, -5.84));
  const bedCover = (set, color) => { const b = hideable(box(4.5, 0.4, 4.0, color, 0.15)); set.group.add(at(b, -9, 3.15, 0.4)); return b; };
  const dexCover = bedCover(dexRoom, '#e94b3c'), granCover = bedCover(granRoom, '#b58ad6');
  courtN.group.add(at(bench('#b9783f'), 0, 0, 26));
  const wash = partyWash(courtN.group, { strength: 0.5 }); PRE.push(() => wash.update(0, false));

  // ── cast
  const S = cast(street, ['me']);
  const N = cast(courtN, ['me', 'dex', 'gran', 'rhonda', 'fan1', 'fan2', 'fan3'], 7);
  const SS = cast(courtS, ['me', 'dex', 'gran', 'rival', 'fan1', 'fan2', 'fan3', 'fan4', 'fan5'], 2);
  const D = cast(courtD, ['me']);
  const M = cast(myRoom, ['me']); M.me.handR.add(at(myRoll, 0, -0.35, 0.55)); myRoll.rotation.y = Math.PI / 2;
  const X = cast(dexRoom, ['dex']);
  const R = cast(rhRoom, ['rhonda']); const rhRoll = hideable(tapeRoll()); R.rhonda.handR.add(at(rhRoll, 0, -0.35, 0.55)); rhRoll.rotation.y = Math.PI / 2;
  const G = cast(granRoom, ['gran']); const grRoll = hideable(tapeRoll()); G.gran.handR.add(at(grRoll, 0, -0.3, 0.55)); grRoll.rotation.y = Math.PI / 2;
  const veil = makeVeil(street.group);
  const score = (set, g, h, clock = '') => set.scoreboard.set('GUEST', g, 'HOME', h, clock);
  // sitting up in bed under a pulled-up blanket (bed at x -9, headboard at z -5)
  const inBed = (av, cover, t, face) => { av.reset().place(-9, -2.6, 0).sit(2.3).setFace(face).idle(t, 0.5); cover.visible = true; return av; };

  // 1 HOOK: drone over the night street, every window lit
  shot({ line: 'In this town, everybody tapes their closet shut every night.', set: street, sfx: [['whoosh', 0, 0.6]],
    cam: drone([4, 2, -6], { h: 40, back: 48, drift: [6, -4, -8], fov: 60 }),
    act(lt, c) { } });
  // 2 the rule, insert: a big silver X across a closet
  shot({ line: 'Big silver X.', set: dexRoom, sfx: [['thud', 'x', 0.5]],
    cam: { pos: [-1.6, 4.6, 5.2], look: [-2.5, 4.4, -5.2], fov: 50, blur: 0.3, push: 0.1 },
    act(lt, c) { dexCl.state(0, 1); } });
  // 3 the exception: narrator close-up under a street lamp
  shot({ line: 'Except me.', set: street, sfx: [['pop', 'me', 0.6]],
    cam: frame(8, 3.6, { size: 'close', side: -12 }),
    act(lt, c) { S.me.reset().place(8, 3.6, -0.15).setFace(lt < c.w('me') ? 'calm' : 'winkjoy').idle(c.t); } });
  // 4 catchphrase beat: low hero angle, empty night court
  shot({ line: 'HUSS! HUSS!', set: courtN, sfx: [['thud', 0.05, 0.6], ['thud', 0.47, 0.6], ['thud', 0.89, 0.6]],
    cam: frame(0, 2, { size: 'full', side: 14, low: 0.45 }),
    act(lt, c) { score(courtN, 0, 0); N.me.reset().place(0, 2, -0.3).setFace('joy').idle(c.t); dribble(N.me, N.ball, c.t); } });
  // 5-7 the list: closets / fridges / the mayor's goldfish (planted)
  shot({ line: 'Closets taped.', set: dexRoom,
    cam: { pos: [-4.5, 6.5, 10], look: [-7.6, 4, -3], fov: 58, blur: 0.25 },
    act(lt, c) { dexCl.state(0, 2); inBed(X.dex, dexCover, c.t, 'worried'); } });
  shot({ line: 'Fridges taped.', set: rhRoom,
    cam: { pos: [7.2, 5.2, 6.5], look: [11, 4.6, -3.8], fov: 52, blur: 0.4, push: 0.09 },
    act(lt, c) { } });
  shot({ line: "Even the mayor's goldfish bowl.", set: mayorRoom, sfx: [['pop', 'goldfish', 0.5]],
    cam: { pos: [1.2, 5.6, 6.8], look: [0, 4.4, -1], fov: 48, blur: 0.5, push: 0.1 },
    act(lt, c) { mayorBowl.fish.position.x = Math.sin(c.t * 1.6) * 0.5; mayorBowl.fish.rotation.y = Math.cos(c.t * 1.6) > 0 ? 0 : Math.PI; } });
  // 8 the logic
  shot({ line: 'Nobody goes out after dark.', set: street,
    cam: { pos: [-30, 3, 11], look: [-14, 4, 1], fov: 58, blur: 0.1 },
    act(lt, c) { } });
  shot({ line: 'Why would they?', set: street,
    cam: frame(8, 3.6, { size: 'close', side: 14 }),
    act(lt, c) { S.me.reset().place(8, 3.6, 0.2).setFace(lt < c.w('they') ? 'calm' : 'joy').idle(c.t); } });
  // 10-12 the three named people
  shot({ line: 'My best friend Dex tapes his twice.', set: dexRoom, sfx: [['thud', 'twice', 0.4]],
    cam: frame(-9, -2.6, { size: 'medium', y: 1.4, side: 22 }),
    act(lt, c) { dexCl.state(0, 2); inBed(X.dex, dexCover, c.t, 'worried').pose({ aL: [40, -10], aR: [40, -10] }).lookAt(-2.5, -5); } });
  shot({ line: 'Neighbor Rhonda uses three rolls.', set: rhRoom,
    cam: frame(-5.8, -1.6, { size: 'medium', h: 1.12, side: 14, dist: 1.15 }),
    act(lt, c) { rhCl.state(0, 2, 1); R.rhonda.reset().place(-5.8, -1.6, -0.35).pose({ aR: [100, 20], aL: [40, 10] }).setFace(lt < c.w('three') ? 'serious' : 'say').talk(c.t); rhRoll.visible = true; } });
  shot({ line: 'Grandma sleeps holding the tape.', set: granRoom, sfx: [['pop', 'tape', 0.4]],
    cam: frame(-9, -2.6, { size: 'close', y: 1.3, side: -16 }),
    act(lt, c) { inBed(G.gran, granCover, c.t, 'sleepy').pose({ aR: [28, -30], aL: [30, -10] }); G.gran.head.rotation.z += 0.18; grRoll.visible = true; } });
  // 13 but not me
  shot({ line: 'But not me.', set: myRoom,
    cam: frame(2, 1.5, { size: 'close', side: -10 }),
    act(lt, c) { M.me.reset().place(2, 1.5, -0.2).pose({ aR: [60, -14] }).setFace(lt < c.w('me') ? 'calm' : 'smirk').idle(c.t); M.ball.visible = true; M.ball.position.set(0.2, 2.4, 2.6); } });
  shot({ line: 'My ball lives in there.', set: myRoom,
    cam: frame(-1.6, -3, { size: 'wide', side: 10, dist: 0.7 }),
    act(lt, c) { myCl.state(E.out(remap(lt, 0, 0.35)), 0); myBall.visible = true; M.me.reset().place(0.9, -2.0, -0.5).pose('point').lookAt(-2.5, -6).setFace('joy').idle(c.t); M.me.armR.rotation.z -= 0.5; } });
  // 15-18 montage: day / sunset / night, same court, HUSS
  shot({ line: 'Day by day,', set: courtD,
    cam: frame(-4, 3, { size: 'full', side: 18, low: 0.3 }),
    act(lt, c) { score(courtD, 0, 0); D.me.reset().place(-4, 3, 0.3).setFace('calm').idle(c.t); dribble(D.me, D.ball, c.t); } });
  shot({ line: 'HUSS!', set: courtS, sfx: [['thud', 0.05, 0.6], ['thud', 0.47, 0.6]],
    cam: frame(-4, 3, { size: 'full', side: 18, low: 0.3 }),
    act(lt, c) { score(courtS, 0, 0); SS.me.reset().place(-4, 3, 0.3).setFace('joy').idle(c.t); dribble(SS.me, SS.ball, c.t); } });
  shot({ line: 'night by night,', set: courtN,
    cam: frame(-4, 3, { size: 'full', side: 18, low: 0.3 }),
    act(lt, c) { score(courtN, 0, 0); N.me.reset().place(-4, 3, 0.3).setFace('calm').idle(c.t); dribble(N.me, N.ball, c.t); } });
  shot({ line: 'HUSS!', set: courtN, sfx: [['thud', 0.05, 0.6], ['thud', 0.47, 0.6]],
    cam: frame(-4, 3, { size: 'close', side: -12 }),
    act(lt, c) { score(courtN, 0, 0); N.me.reset().place(-4, 3, 0.1).setFace('joy').idle(c.t).talk(c.t); dribble(N.me, N.ball, c.t); } });
  // 19 the big event: drone over the sunset court
  shot({ line: 'Then came the big game.', set: courtS, sfx: [['whoosh', 0, 0.5]],
    cam: drone([0, 2, -8], { h: 30, back: 48, drift: [-10, -4, -8] }),
    act(lt, c) { score(courtS, 0, 0); const bl = courtS.bleachers; [SS.dex, SS.gran, SS.fan1, SS.fan2, SS.fan3, SS.fan4, SS.fan5].forEach((a, i) => { const p = bl.seat(0.14 + i * 0.12, i % 3); a.reset().place(p[0], p[2] - 19, 0, p[1]).sit(0).setFace('sleepy').idle(c.t); }); SS.rival.reset().place(6, 4, -0.8).idle(c.t); } });
  shot({ line: 'Everybody showed up, yawning.', set: courtS,
    cam: { pos: [-2, 5.5, -6], look: [-3, 4.2, -21], fov: 54, blur: 0.4 },
    act(lt, c) { score(courtS, 0, 0); const bl = courtS.bleachers; [SS.dex, SS.gran, SS.fan1, SS.fan2, SS.fan3, SS.fan4, SS.fan5].forEach((a, i) => { const p = bl.seat(0.3 + (i % 4) * 0.07, Math.floor(i / 4)); const yawn = Math.sin(c.t * 2 + i) > 0.3; a.reset().place(p[0], p[2] - 19, 0, p[1]).sit(0).setFace(yawn ? 'wow' : 'sleepy').idle(c.t); if (yawn) a.pose({ aL: [150, 20], aR: [150, 20] }, 0.6); }); } });
  shot({ line: 'I walked on. Everybody laughed.', set: courtS, sfx: [['pop', 'laughed', 0.5]],
    cam: { pos: [8, 5.5, 14], look: [-2, 3.5, -8], fov: 56, blur: 0.15 },
    act(lt, c) { score(courtS, 0, 0); SS.me.reset().place(4 - lt * 2.4, 4, -Math.PI / 2 + 0.4).walk(c.t).setFace(lt < c.w('laughed') ? 'calm' : 'uneasy'); const bl = courtS.bleachers; [SS.dex, SS.gran, SS.fan1, SS.fan2, SS.fan3, SS.fan4, SS.fan5].forEach((a, i) => { const p = bl.seat(0.3 + (i % 4) * 0.07, Math.floor(i / 4)); const laugh = lt >= c.w('laughed'); a.reset().place(p[0], p[2] - 19, 0, p[1]).sit(0).setFace(laugh ? 'laugh' : 'sleepy').idle(c.t); if (laugh) { a.pose('point', 0.8); a.hip.position.y += Math.abs(Math.sin(c.t * 14 + i)) * 0.12; } }); } });
  shot({ line: "Who's the kid in the beanie?", set: courtS,
    cam: frame(6, 4, { size: 'close', side: 16 }),
    act(lt, c) { score(courtS, 0, 0); SS.rival.reset().place(6, 4, -0.2).pose('point').setFace('smug').talk(c.t); SS.rival.armR.rotation.z += 0.3; } });
  // 23-27 triumph
  shot({ line: 'I got the ball.', set: courtS,
    cam: frame(-2, 3, { size: 'close', side: -14 }),
    act(lt, c) { score(courtS, 0, 0); SS.me.reset().place(-2, 3, 0.2).pose({ aR: [60, -14] }).setFace(lt < c.w('ball') ? 'calm' : 'smirk').idle(c.t); SS.ball.visible = true; SS.ball.position.set(-3.4, 2.3, 4.0); } });
  shot({ line: 'HUSS! HUSS!', set: courtS, sfx: [['thud', 0.05, 0.6], ['thud', 0.47, 0.6], ['whoosh', 'huss', 0.8], ['ding', 'huss', 0.5]],
    cam: (lt, s) => lt < s.d * 0.55 ? handheld(follow(l2 => [-6 + l2 * 10, 0, 2], [-3, 3.4, 12]), 1.4)(lt, s) : whip([18, 6, 11], [12, 4, 2], [29, 9.9, 0], s.d * 0.55)(lt),
    act(lt, c) { score(courtS, 12, lt < c.d * 0.9 ? 48 : 50); const x = -6 + Math.min(lt, c.d * 0.55) * 10; SS.me.reset().place(x, 2, Math.PI / 2 - 0.3).run(c.t).setFace('joy'); if (lt < c.d * 0.55) dribble(SS.me, SS.ball, c.t); else arc(SS.ball, lt, c.d * 0.55, 0.42, [x + 1, 6, 2], [29, 9.9, 0], 5); SS.rival.reset().place(x + 5, 5, -Math.PI / 2).run(c.t, 0.6).setFace('gasp'); } });
  shot({ line: 'Fifty points.', set: courtS, sfx: [['ding', 'fifty', 0.7]],
    cam: { pos: [21, 15.4, -1.0], look: [29, 13.6, -1.6], fov: 34, blur: 0.15, push: 0.12 },
    act(lt, c) { score(courtS, 12, 50); } });
  shot({ line: 'All by myself.', set: courtS,
    cam: frame(2, 3, { size: 'close', side: 12, low: 0.3 }),
    act(lt, c) { score(courtS, 12, 50); SS.me.reset().place(2, 3, -0.1).pose('cheer').setFace('joy').idle(c.t); SS.me.hip.position.y += Math.abs(Math.sin(c.t * 7)) * 0.15; } });
  // 27 silence
  shot({ line: 'The crowd went silent. //', set: courtS,
    cam: frame(-0.44, -21, { size: 'close', y: 0.7, side: 8, push: 0.1 }),
    act(lt, c) { score(courtS, 12, 50); const bl = courtS.bleachers; const p = bl.seat(0.49, 1); SS.fan2.reset().place(p[0], p[2] - 19, 0, p[1]).sit(0).setFace(lt < c.w('silent') ? 'sleepy' : 'gasp').idle(c.t, lt < c.w('silent') ? 1 : 0.15); const q = bl.seat(0.56, 2); SS.fan3.reset().place(q[0], q[2] - 19, 0, q[1]).sit(0).setFace('gasp'); } });
  // 28-31 the line
  shot({ line: 'When did you get so good?', set: courtS,
    cam: frame(5, 3, { size: 'close', side: 14 }),
    act(lt, c) { score(courtS, 12, 50); SS.dex.reset().place(5, 3, -0.3).pose('open').setFace(lt < c.w('good') ? 'say' : 'wow').talk(c.t); } });
  shot({ line: 'I told him:', set: courtS,
    cam: frame(0, 3, { size: 'close', side: -12 }),
    act(lt, c) { score(courtS, 12, 50); SS.me.reset().place(0, 3, 0.25).setFace('calm').idle(c.t); } });
  shot({ line: 'while you were taping,', set: courtS,
    cam: frame(0, 3, { size: 'close', side: 10, push: 0.1 }),
    act(lt, c) { score(courtS, 12, 50); SS.me.reset().place(0, 3, -0.1).pose('open', 0.7).setFace('say').talk(c.t); } });
  shot({ line: 'I was practicing.', set: courtS, sfx: [['pop', 'practicing', 0.6]],
    cam: frame(0, 3, { size: 'face', side: -6, push: 0.12 }),
    act(lt, c) { score(courtS, 12, 50); SS.me.reset().place(0, 3, 0.05).setFace(lt < c.w('practicing') ? 'smirk' : 'winkjoy').idle(c.t); } });
  // 32 act break: the next night, camera dives through a bush
  shot({ line: 'The next night,', set: street, sfx: [['whoosh', 'night', 0.9]],
    cam: (lt, s) => { const k = E.in(remap(lt, s.d - 0.42, s.d)); return { pos: [lerp(-8, 2, k), lerp(6, 1.3, k), lerp(17, 3.0, k)], look: [lerp(2, 2, k), lerp(3, 0.9, k), lerp(0, 1.4, k)], fov: 56, blur: 0.15, push: 0.04 }; },
    act(lt, c) { veil.at(lt - (c.d - 0.33), c.camera); } });
  shot({ line: 'something was wrong.', set: street, sfx: [['sad', 'wrong', 0.4]],
    cam: (lt, s) => ({ pos: [-12 + lt * 2.6, 4.2, 12], look: [-12 + lt * 2.6, 3.8, 3.8], fov: 56, blur: 0.4, push: 0 }),
    act(lt, c) { S.me.reset().place(-12 + lt * 2.6, 3.8, 0.35).walk(c.t, 0.8).setFace(lt < c.w('wrong') ? 'calm' : 'uneasy'); } });
  shot({ line: 'Closets open. Tape in the trash.', set: dexRoom,
    cam: (lt, s) => lt < s.d * 0.42 ? { pos: [-1.4, 4.4, 6], look: [-2.5, 4.2, -5], fov: 54, blur: 0.3, push: 0.08 } : { pos: [3.2, 4.6, 2.6], look: [1.8, 1.8, -3.2], fov: 50, blur: 0.4, push: 0.1 },
    act(lt, c) { dexCl.state(1, 0); trash.visible = true; dexFloorTape.visible = true; } });
  shot({ line: 'Then, from every window:', set: street,
    cam: frame(4.5, 3.6, { size: 'medium', side: 10, low: 0.3 }),
    act(lt, c) { S.me.reset().place(4.5, 3.6, 0).pose({ head: [-14, 0, 0] }).setFace('worried').idle(c.t); } });
  shot({ line: 'HUSS!', set: street, sfx: [['thud', 0.05, 0.6], ['thud', 0.47, 0.6]],
    cam: { pos: [-2, 2.5, 14], look: [-2, 9, -7], fov: 60, blur: 0, push: 0.05 },
    act(lt, c) { } });
  shot({ line: 'HUSS! //', set: street,
    cam: frame(8, 3.6, { size: 'face', side: -8, push: 0.1 }),
    act(lt, c) { S.me.reset().place(8, 3.6, 0).setFace('gasp').idle(c.t, lt < c.d - 0.8 ? 1 : 0.1); } });
  // 38-40 the three people now hustle
  shot({ line: 'Dex, dribbling.', set: dexRoom, sfx: [['thud', 0.1, 0.5], ['thud', 0.52, 0.5]],
    cam: frame(-1, 1, { size: 'full', side: 16, low: 0.3 }),
    act(lt, c) { dexCl.state(1, 0); dexFloorTape.visible = true; X.dex.reset().place(-1, 1, 0.2).setFace('joy').idle(c.t); dribble(X.dex, X.ball, c.t); } });
  shot({ line: 'Rhonda, karate.', set: rhRoom, sfx: [['whoosh', 'karate', 0.5]],
    cam: frame(-2, 1, { size: 'full', h: 1.12, side: -18, y: 0.4 }),
    act(lt, c) { rhCl.state(1, 0); const ph = Math.floor((c.t * 3.2)) % 2; R.rhonda.reset().place(-2, 1, 0.5, 0.4).pose(ph ? { aR: [90, 0], aL: [30, 30], lL: -20, lR: 20 } : { aL: [90, 0], aR: [30, 30], lL: 20, lR: -20 }).setFace('angry').idle(c.t); } });
  shot({ line: 'Grandma, push-ups.', set: granRoom, sfx: [['pop', 'push-ups', 0.4]],
    cam: { pos: [4.5, 3.4, 10.5], look: [-1.5, 1.6, 3.2], fov: 54, blur: 0.3 },
    act(lt, c) { granCl.state(1, 0); const k = 0.5 + 0.5 * Math.sin(c.t * 7); const g = G.gran.reset().place(-1.5, 0.2, 0, 0.3 + k * 0.5).pose({ aL: [75, 4], aR: [75, 4] }).setFace('mad'); g.root.rotation.x = 1.28 - k * 0.2; g.head.rotation.x = -0.7; } });
  // 41 the whole town at night: block-party court, colour wash
  shot({ line: 'Now the whole town hustles all night.', set: courtN, sfx: [['whoosh', 0, 0.5]],
    cam: drone([0, 2, 2], { h: 22, back: 34, drift: [8, -3, -6], fov: 54 }),
    act(lt, c) { wash.update(c.t); score(courtN, 88, 91); [N.dex, N.gran, N.rhonda, N.fan1, N.fan2, N.fan3].forEach((a, i) => { const x = -16 + i * 6.4, z = (i % 2 ? -5 : 6) + Math.sin(c.t + i) * 1.5; a.reset().place(x, z, Math.sin(i * 1.7) * 0.8).run(c.t, 0.5).setFace('joy'); dribble(a, N.balls[i + 1], c.t + i * 0.13); }); } });
  shot({ line: 'Which is great...', set: courtN,
    cam: frame(0, 26, { size: 'close', y: -0.1, side: 160 }),
    act(lt, c) { wash.update(c.t); [N.dex, N.gran, N.rhonda, N.fan1].forEach((a, i) => { a.reset().place(-9 + i * 6, 10 + (i % 2) * 4, Math.PI).run(c.t, 0.5).setFace('joy'); dribble(a, N.balls[i + 1], c.t + i * 0.13); }); N.me.reset().place(0, 26, Math.PI).sit(1.4).setFace('joy').idle(c.t); } });
  shot({ line: 'except the court is always full.', set: courtN, sfx: [['sad', 'full', 0.5]],
    cam: { pos: [3, 3.6, 36], look: [0, 3, 22], fov: 52, blur: 0.55, focus: [0, 3, 26.3], push: 0.07 },
    act(lt, c) { wash.update(c.t); [N.dex, N.gran, N.rhonda, N.fan1, N.fan2, N.fan3].forEach((a, i) => { a.reset().place(-14 + i * 5.6, 8 + (i % 3) * 3, Math.PI + Math.sin(i) * 0.6).run(c.t, 0.5).setFace('joy'); dribble(a, N.balls[i + 1], c.t + i * 0.13); }); N.me.reset().place(0, 26.3, 0).sit(1.4).pose('slump', 0.7).setFace('sad').idle(c.t, 0.4); N.ball.visible = true; N.ball.position.set(1.6, 0.55, 27); } });
  // 44-48 button: he tapes his own closet; the goldfish
  shot({ line: 'So I taped my closet shut.', set: myRoom, sfx: [['whoosh', 'taped', 0.4]],
    cam: frame(-2.5, -1.2, { size: 'full', side: 28, dist: 0.9 }),
    act(lt, c) { myCl.state(0, 1, remap(lt, c.w('taped'), c.d - 0.1)); M.me.reset().place(-1.4, -1.6, Math.PI - 0.5).pose({ aR: [110, 10], aL: [80, -10] }).setFace('calm').idle(c.t); M.me.armR.rotation.x += Math.sin(c.t * 10) * 0.15; myRoll.visible = true; } });
  shot({ line: 'Then something knocked.', set: myRoom, sfx: [['thud', 'knocked', 1.0], ['thud', 'knocked', 0.9]],
    cam: frame(0.6, 0.4, { size: 'close', side: 20 }),
    act(lt, c) { const kn = lt - c.w('knocked'), sh = kn > 0 && kn < 0.5 ? Math.sin(kn * 60) * 0.05 * (1 - kn / 0.5) : 0; myCl.state(0, 1, 1, sh); M.me.reset().place(0.6, 0.4, 0.15).setFace(kn < 0 ? 'calm' : 'gasp').idle(c.t); } });
  shot({ line: "It was the mayor's goldfish.", set: myRoom, sfx: [['pop', 'goldfish', 0.7]],
    cam: { pos: [-1.6, 4.0, 4.2], look: [-2.5, 2.2, -4.7], fov: 52, blur: 0.4, push: 0.1 },
    act(lt, c) { myCl.state(1, 0); myBowl.visible = true; myBowl.position.set(0, 0, 1.0); myBowl.fish.position.x = Math.sin(c.t * 2) * 0.5; myBowl.fish.rotation.y = Math.cos(c.t * 2) > 0 ? 0 : Math.PI; } });
  shot({ line: "He's actually great at defense.", set: myRoom, sfx: [['thud', 0.1, 0.5], ['thud', 0.52, 0.5]],
    cam: frame(3, 3.4, { size: 'full', side: -24, low: 0.45 }),
    act(lt, c) { myCl.state(1, 0); myBowl.visible = true; myBowl.position.set(6.7, 0, 10.3); myBowl.fish.position.x = Math.sin(c.t * 5) * 0.55; myBowl.fish.rotation.y = 1.4; M.me.reset().place(3, 1.6, 0.4).setFace(lt < c.w('defense') ? 'smirk' : 'joy').idle(c.t); dribble(M.me, M.ball, c.t); } });
  shot({ line: 'HUSS!', set: myRoom, sfx: [['thud', 0.05, 0.6], ['thud', 0.47, 0.6]],
    cam: frame(1.5, 1.6, { size: 'wide', side: 8, low: 0.2, dist: 0.85 }),
    act(lt, c) { myCl.state(1, 0); myBowl.visible = true; myBowl.position.set(6.7, 0, 10.3); myBowl.fish.position.x = Math.sin(c.t * 5) * 0.55; myBowl.fish.rotation.y = 1.4; M.me.reset().place(1.5, 1.6, 0.3).setFace('winkjoy').idle(c.t); dribble(M.me, M.ball, c.t); } });
});
