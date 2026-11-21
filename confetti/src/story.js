// story.js: "The Confetti Kid" (30 s). In this town everybody parties every night; the narrator sweeps the confetti.
// One shot() per picture. `line` = words spoken in that shot (cuts land on its first word).
// '//' after a word = 0.6 s silent hold. ALL-CAPS words show in caps (the HUSS! catchphrase).
import * as THREE from 'three';
import { start, shot, frame, WORDS } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, hatOn, handheld, follow, whip, drone, makeVeil, goldfishBowl, partyWash, stringLights, balloons, partyHat, PARTY } from './town.js';
import { makePuff } from './fx.js';
import { remap, E, lerp, clamp, rng, box, at, grp, mat, PRE } from './util.js';

// ───────────── story props
const CONF = ['#ff6fd8', '#7dffa8', '#ffe46a', '#7ab8ff', '#c18cff', '#ff8a5c', '#ffffff'];
const fleckGeo = new THREE.BoxGeometry(0.42, 0.035, 0.26);
const fleckMat = () => new THREE.MeshLambertMaterial({ color: '#ffffff' });
const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), S4 = new THREE.Vector3(), P4 = new THREE.Vector3(), EU = new THREE.Euler();
// confetti lying on the ground in a box area. clear(fn) hides every fleck where fn(x, z) is true (swept).
function confettiField(group, { x0, x1, z0, z1, n = 2000, seed = 7, y = 0.06 }) {
  const m = new THREE.InstancedMesh(fleckGeo, fleckMat(), n), r = rng(seed), base = [];
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); base.push([x, z, r() * 6.28, r() * 0.4]); m.setColorAt(i, new THREE.Color(CONF[i % CONF.length])); }
  m.receiveShadow = true; group.add(m); let key = null;
  const api = { mesh: m, clear(fn = null, k = 'all') { if (k === key) return; key = k; base.forEach(([x, z, a, tilt], i) => { const on = !fn || !fn(x, z); EU.set(tilt * 0.3, a, tilt * 0.3); Q4.setFromEuler(EU); S4.setScalar(on ? 1 : 0); P4.set(x, y, z); m.setMatrixAt(i, M4.compose(P4, Q4, S4)); }); m.instanceMatrix.needsUpdate = true; } };
  api.clear(); PRE.push(() => { m.visible = true; }); return api;
}
// confetti raining from above over an area, pure function of t. at(t, on)
function confettiRain(group, { cx = 0, cz = 0, w = 30, d = 16, top = 16, n = 500, seed = 3, speed = 3.2 }) {
  const m = new THREE.InstancedMesh(fleckGeo, fleckMat(), n), r = rng(seed), P = [];
  for (let i = 0; i < n; i++) { P.push([cx + (r() - 0.5) * w, cz + (r() - 0.5) * d, r() * top, r() * 6.28, 0.6 + r() * 0.8]); m.setColorAt(i, new THREE.Color(CONF[(i + 3) % CONF.length])); }
  m.visible = false; group.add(m); PRE.push(() => { m.visible = false; });
  return { at(t) { m.visible = true; P.forEach(([x, z, y0, a, s], i) => { const y = top - ((y0 + t * speed * s) % top); EU.set(t * 3 * s + a, a + t * 2, t * 4 * s); Q4.setFromEuler(EU); S4.setScalar(1); P4.set(x + Math.sin(t * 1.3 + a) * 0.6, y, z); m.setMatrixAt(i, M4.compose(P4, Q4, S4)); }); m.instanceMatrix.needsUpdate = true; } };
}
// confetti kicked up by a broom stroke. at(dt, pos, dir): dt seconds since the stroke, dir = sweep direction angle
const kickGeo = new THREE.BoxGeometry(0.26, 0.03, 0.17);
function confettiKick(group, seed = 5, n = 40) {
  const m = new THREE.InstancedMesh(kickGeo, fleckMat(), n), r = rng(seed), V = [];
  for (let i = 0; i < n; i++) { V.push([(r() - 0.5) * 2.2, 2 + r() * 5, 1.5 + r() * 4, r() * 6.28, r() * 0.06]); m.setColorAt(i, new THREE.Color(CONF[i % CONF.length])); }
  m.visible = false; group.add(m); PRE.push(() => { m.visible = false; });
  return { at(dt, p, dir = 0) { if (dt < 0 || dt > 0.9) return; m.visible = true; const c = Math.cos(dir), s = Math.sin(dir); V.forEach(([sx, vy, f, a, del], i) => { const tt = Math.max(0, dt - del), lx = sx + f * tt * 0.9, y = Math.max(0.05, 0.3 + vy * tt - 9 * tt * tt); EU.set(tt * 9 + a, a, tt * 7); Q4.setFromEuler(EU); S4.setScalar(tt > 0 ? 1 : 0); P4.set(p[0] + lx * c + Math.sin(a) * 0.3, p[1] + y, p[2] - lx * s * 0 + Math.cos(a) * 0.4 + f * tt * 0.25); m.setMatrixAt(i, M4.compose(P4, Q4, S4)); }); m.instanceMatrix.needsUpdate = true; } };
}
// a push broom held in both hands, attached to the avatar root. sweep(av, t) animates it (stroke period 0.42 s)
function giveBroom(av) {
  const yaw = new THREE.Group(), tilt = new THREE.Group(); yaw.position.set(0, 2.9, 1.25); yaw.add(tilt); tilt.rotation.x = -0.62;
  const stick = box(0.2, 3.6, 0.2, '#a8693a'); stick.position.y = -1.6; tilt.add(stick);
  const head = grp(box(2.3, 0.42, 0.55, '#d23a3a', 0.06), at(box(2.2, 0.55, 0.42, '#f2c64a', 0.03), 0, -0.45, 0)); head.position.y = -3.45; head.rotation.x = 0.62; tilt.add(head);
  av.root.add(yaw); av.broom = yaw; av.broomHead = head; yaw.visible = false; PRE.push(() => { yaw.visible = false; });
  return av;
}
const HOLD = { aL: [52, -16], aR: [52, -16] };
const WP = new THREE.Vector3();
function sweep(av, t, amt = 1, period = 0.42) { av.broom.visible = true; const ph = (t / period) * Math.PI * 2, s = Math.sin(ph) * amt; av.broom.rotation.y = s * 0.5; av.hip.rotation.y += s * 0.18; av.armL.rotation.z += s * 0.25; av.armR.rotation.z += s * 0.25; av.head.rotation.y -= s * 0.1; return av; }
const holdBroom = (av) => { av.broom.visible = true; av.broom.rotation.y = 0; return av; };
const headPos = (av) => { av.root.updateMatrixWorld(true); av.broomHead.getWorldPosition(WP); return [WP.x, 0, WP.z]; };

start(() => {
  // ── sets
  const stN = TOWN.street({ time: 'night', litAll: true }), stD = TOWN.street({ time: 'day' }), stS = TOWN.street({ time: 'sunset' });
  const stWash = partyWash(stN.group, { strength: 0.4 }); stN.update = (t) => stWash.update(t, !!stN.party);
  stN.group.add(at(stringLights(40, 1.4, PARTY), -2, 9, -2.5), at(balloons(5, 3), -8, 0, 1.5), at(balloons(2, 3), 10, 0, 1.5));
  const pool = TOWN.pool(), poolE = TOWN.pool();
  { const L = poolE.group.children.slice(-3); poolE.update = () => { for (const l of L) l.intensity = 0; }; }
  const tbl = TOWN.partyTable({ wall: '#b886b4' }), tblG = TOWN.partyTable({ wall: '#6f8fd8' });
  const court = TOWN.court({ time: 'sunset', banner: 'BLOCK PARTY' });
  const room = TOWN.roomNight({ wall: '#5a3f7a', rug: '#e2b23a', shelf: true });

  // ground confetti
  const cfN = confettiField(stN.group, { x0: -40, x1: 40, z0: 2, z1: 20, n: 2600, seed: 11 });
  const cfD = confettiField(stD.group, { x0: -50, x1: 50, z0: 2, z1: 20, n: 3400, seed: 12 });
  const cfS = confettiField(stS.group, { x0: -40, x1: 40, z0: 2, z1: 20, n: 2600, seed: 13 });
  const cfC = confettiField(court.group, { x0: -31, x1: 31, z0: -15, z1: 15, n: 4200, seed: 14 });
  const cfG = confettiField(tblG.group, { x0: -14, x1: 14, z0: -6, z1: 10, n: 1400, seed: 15 });
  const rainN = confettiRain(stN.group, { cx: 0, cz: 2, w: 60, d: 14, top: 18, n: 420 });
  const rainC = confettiRain(court.group, { cx: 0, cz: -6, w: 60, d: 26, top: 18, n: 700 });
  const rainT = confettiRain(tbl.group, { cx: 0, cz: 0, w: 26, d: 14, top: 13, n: 360 });
  const rainG = confettiRain(tblG.group, { cx: 0, cz: 0, w: 26, d: 14, top: 13, n: 360 });
  const rainP = confettiRain(pool.group, { cx: 0, cz: -2, w: 34, d: 18, top: 14, n: 400 });

  // goldfish bowl with its own tiny party hat (on the goldfish table)
  const bowlT = goldfishBowl(), bowlG = goldfishBowl();
  for (const b of [bowlT, bowlG]) { const bm = b.children[3].material; bm.specular.set('#222222'); bm.shininess = 20; bm.opacity = 0.18; b.children[1].material.opacity = 0.2; b.fish.scale.setScalar(1.5); const h = partyHat('#ff6fd8'); h.scale.setScalar(0.45); h.position.set(0.05, 0.3, 0); b.fish.add(h); }
  tbl.group.add(at(bowlT, 5.5, 2.9, 0.4)); bowlT.visible = false;
  tblG.group.add(at(bowlG, 1.5, 2.9, 0.4));
  const swim = (b, t) => { b.fish.position.set(Math.sin(t * 2.1) * 0.55, 1.5 + Math.sin(t * 3.3) * 0.12, Math.cos(t * 2.1) * 0.35); b.fish.rotation.y = -t * 2.1 + Math.PI / 2; b.fish.children[1].rotation.y = Math.sin(t * 14) * 0.5; };

  // ── cast: one copy per set, identical options
  const LOOK = {
    milo: { seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' },
    gran: { seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true },
    fan1: { seed: 4, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' },
    fan2: { seed: 5, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' },
    rival: { seed: 6, skin: 'light', hair: 'short', hairColor: '#5a3a1a', top: 'jersey', topColor: '#d23a3a', number: '1', bottom: 'shorts', bottomColor: '#d23a3a', cap: '#d23a3a' },
    mayor: { seed: 8, skin: 'deep', hair: 'short', hairColor: '#1b1210', top: 'suit', topColor: '#2b2f3e', bottom: 'slacks', bottomColor: '#2b2f3e', shoe: '#1b1b1b', sole: '#111' },
    fan3: { seed: 9, skin: 'tan', hair: 'ponytail', hairColor: '#7a3a1a', top: 'stripes', topColor: '#3d6fe0', bottom: 'skirt', bottomColor: '#ff7ac2' },
  };
  const HATS = { milo: '#f2b01e', gran: '#7fc98a', fan1: '#ff7ac2', fan2: '#7ab8ff', rival: '#c18cff', mayor: '#ffe46a', fan3: '#ff8a5c' };
  const cast = (set, names, { hats = false, meHat = false } = {}) => {
    const c = {};
    if (names.includes('me')) { c.me = giveBroom(makeNarrator({ color: '#2f4fc4', print: 'SWEEP' })); set.group.add(c.me.root); if (meHat) hatOn(c.me, '#ff6fd8'); }
    for (const n of names) if (n !== 'me') { c[n] = makeAvatar(LOOK[n]); set.group.add(c[n].root); if (hats) hatOn(c[n], HATS[n]); }
    c.kick = confettiKick(set.group); c.puff = makePuff(set.group); c.veil = makeVeil(set.group);
    return c;
  };
  const N = cast(stN, ['me', 'milo', 'gran', 'fan1', 'fan2', 'fan3'], { hats: true });
  const D = cast(stD, ['me']), SS = cast(stS, ['me']);
  const P = cast(pool, ['milo', 'fan1', 'fan2', 'fan3'], { hats: true }), PE = cast(poolE, ['me']);
  const T = cast(tbl, ['milo', 'gran', 'fan1', 'fan2', 'mayor'], { hats: true });
  const G = cast(tblG, ['me'], { meHat: true });
  const C = cast(court, ['me', 'milo', 'gran', 'fan1', 'fan2', 'fan3', 'rival', 'mayor'], { hats: true });
  const R = cast(room, ['gran']); giveBroom(R.gran);
  // the narrator's hat in the party table set is hidden only in no-party moments (none here: he wears it all three shots)

  // court crowd in the bleachers, laughing / cheering
  const crowd = (lt, c, face = 'joy', pose = 'cheer') => { const bl = court.bleachers; [C.milo, C.gran, C.fan1, C.fan2, C.fan3, C.mayor].forEach((a, i) => { const p = bl.seat(0.2 + i * 0.12, i % 3); a.reset().place(p[0], p[2] - 19, 0, p[1]).sit(0).pose(i % 2 ? pose : 'wave', 0.8).setFace(face).idle(c.t); a.hip.position.y += Math.abs(Math.sin(c.t * 7 + i)) * 0.25; }); };
  const dance = (a, t, i = 0) => { a.pose(i % 2 ? 'cheer' : 'wave'); a.hip.position.y += Math.abs(Math.sin(t * 8 + i)) * 0.35; a.hip.rotation.z = Math.sin(t * 8 + i) * 0.12; return a; };

  // 1 HOOK: drone over the night street, party in full swing, confetti falling
  shot({ line: 'In this town, everybody parties every night.', set: stN, sfx: [['whoosh', 0]],
    cam: drone([0, 3, 0], { h: 26, back: 40, drift: [8, -3, -10], fov: 54 }),
    act(lt, c) { stN.party = true; rainN.at(c.t); cfN.clear(); [N.milo, N.gran, N.fan1, N.fan2, N.fan3].forEach((a, i) => { a.reset().place(-12 + i * 6, 3.5 + (i % 2) * 1.5, 0.3 - i * 0.15).setFace(i % 2 ? 'joy' : 'winkjoy'); dance(a, c.t, i); }); } });
  // 2 the exception: narrator close-up with his broom, wink + open grin
  shot({ line: 'Except me.', set: stN, sfx: [['pop', 'me', 0.6]],
    cam: frame(4, 4, { size: 'close', side: -12 }),
    act(lt, c) { stN.party = false; cfN.clear(); N.me.reset().place(4, 4, -0.15).pose(HOLD).setFace(lt < c.w('me') ? 'calm' : 'winkjoy').idle(c.t); holdBroom(N.me); } });
  // 3 catchphrase beat: low hero angle, sweeping, confetti kicked up on every stroke
  shot({ line: 'HUSS! HUSS!', set: stN, sfx: [['whoosh', 0, 0.5], ['whoosh', 0.42, 0.5], ['whoosh', 0.84, 0.4]],
    cam: frame(0, 5, { size: 'full', side: 14, low: 0.24 }),
    act(lt, c) { stN.party = false; const x = lt * 1.2; cfN.clear((fx, fz) => fx < x + 1 && fx > -6 && fz < 8 && fz > 3, 'hero' + Math.floor(lt * 30)); N.me.reset().place(x, 5, -0.35).pose(HOLD).setFace('joy').idle(c.t); sweep(N.me, lt); N.kick.at(lt % 0.42, headPos(N.me), -0.35); } });
  // 4 list: pool party
  shot({ line: 'Pool parties,', set: pool, sfx: [['pop', 0, 0.5]],
    cam: frame(0, 7, { size: 'wide', side: 10 }),
    act(lt, c) { rainP.at(c.t); P.milo.reset().place(3, -8, 0, 1.2 + Math.abs(Math.sin(c.t * 5)) * 1.2).pose('cheer').setFace('joy'); [P.fan1, P.fan2, P.fan3].forEach((a, i) => { a.reset().place(-8 + i * 8, 8.5, 0.2 - i * 0.2).setFace(i ? 'joy' : 'winkjoy'); dance(a, c.t, i); }); } });
  // 5 list: pizza party
  shot({ line: 'pizza parties,', set: tbl,
    cam: frame(-1, 4.5, { size: 'medium', side: -16, dist: 1.35 }),
    act(lt, c) { rainT.at(c.t); T.milo.reset().place(-3, 4.5, 0.3).pose({ aR: [95, 0], aL: [30, 10] }).setFace('joy').talk(c.t); T.fan2.reset().place(2.5, 5, -0.3).setFace('winkjoy'); dance(T.fan2, c.t, 1); } });
  // 6 list: the planted absurd item (pays off at the end)
  shot({ line: "a birthday party for the mayor's goldfish.", set: tbl, sfx: [['ding', 'goldfish', 0.6]],
    cam: (lt, s) => ({ pos: [5.5, 6.6, 14], look: [5.5, 5, -1], fov: 48, blur: 0.4, push: 0, to: { pos: [5.5, 6, 9.5] }, t0: 0, t1: s.d, ease: 'lin' }),
    act(lt, c) { rainT.at(c.t); bowlT.visible = true; swim(bowlT, c.t); T.mayor.reset().place(8.5, -3.8, -0.3).pose('cheer').setFace(lt < c.w('goldfish') ? 'calm' : 'joy').idle(c.t); T.gran.reset().place(2.2, -3.8, 0.3).pose('wave').setFace('joy').idle(c.t); } });
  // 7 the cost: a morning street drowned in confetti (drone)
  shot({ line: 'Every morning? Confetti everywhere.', set: stD,
    cam: drone([0, 0, 8], { h: 22, back: 22, drift: [10, -2, -4], fov: 56 }),
    act(lt, c) { cfD.clear(); } });
  // 8 narrator close-up holding the broom (day)
  shot({ line: 'So I swept.', set: stD, sfx: [['pop', 'swept', 0.5]],
    cam: frame(-3, 4.5, { size: 'close', side: 14 }),
    act(lt, c) { cfD.clear(); D.me.reset().place(-3, 4.5, 0.15).pose(HOLD).setFace(lt < c.w('swept') ? 'calm' : 'joy').idle(c.t); holdBroom(D.me); } });
  // 9-11 montage: same framing, morning / evening / midnight, HUSS! on each
  const mont = (set, X, cf, line, sideA) => shot({ line, set, sfx: [['whoosh', 0, 0.5], ['whoosh', 0.42, 0.4]],
    cam: frame(2, 5, { size: 'full', side: sideA, low: 0.24 }),
    act(lt, c) { if (set === stN) stN.party = false; const x = 2 + lt * 1.4; cf.clear((fx, fz) => fx < x + 1 && fz < 7.5 && fz > 3, 'm' + Math.floor(lt * 30)); X.me.reset().place(x, 5, -0.4).pose(HOLD).setFace('joy').idle(c.t); sweep(X.me, lt); X.kick.at(lt % 0.42, headPos(X.me), -0.4); } });
  mont(stD, D, cfD, 'Morning, HUSS!', 16); mont(stS, SS, cfS, 'evening, HUSS!', 16); mont(stN, N, cfN, 'midnight, HUSS!', 16);
  // 12 the big event: drone wide of the court at sunset, banner, crowd in party hats
  shot({ line: 'Then came the biggest party of the year.', set: court, sfx: [['whoosh', 0, 0.5]],
    cam: drone([0, 2, -6], { h: 30, back: 50, drift: [-10, -4, -8] }),
    act(lt, c) { rainC.at(c.t); cfC.clear(); crowd(lt, c); C.rival.reset().place(6, 4, -0.4).setFace('joy'); dance(C.rival, c.t, 1); court.scoreboard.set('CONFETTI', '100%', 'SECONDS', 0); } });
  // 13 ten tons: low wide across the confetti-covered court
  shot({ line: 'Ten tons of confetti.', set: court,
    cam: { pos: [-14, 2.2, 14], look: [0, 3.5, -4], fov: 58, blur: 0.2 },
    act(lt, c) { rainC.at(c.t); cfC.clear(); crowd(lt, c); [C.rival].forEach((a, i) => { a.reset().place(-4, 2, 0.3).setFace('winkjoy'); dance(a, c.t, i); }); } });
  // 14 everybody laughed
  shot({ line: 'Everybody laughed.', set: court, sfx: [['pop', 'laughed', 0.5]],
    cam: { pos: [2, 5.2, -5], look: [0, 4.2, -21], fov: 55, blur: 0.2 },
    act(lt, c) { cfC.clear(); crowd(lt, c, lt < c.w('laughed') ? 'smirk' : 'laugh', 'point'); } });
  // 15 the mocking line (rival close-up)
  shot({ line: 'Nice broom, beanie boy.', set: court,
    cam: frame(3, 3, { size: 'close', side: -16 }),
    act(lt, c) { cfC.clear(); C.rival.reset().place(3, 3, -0.3).pose('point').setFace(lt < c.w('beanie') ? 'smirk' : 'laugh').talk(c.t); } });
  // 16 triumph: handheld follow while he sweeps the court clean, whip up to the scoreboard on "ten"
  shot({ line: 'HUSS! Ten seconds. Spotless.', set: court, sfx: [['whoosh', 0], ['whoosh', 0.42, 0.6], ['whoosh', 'ten', 0.8], ['ding', 'spotless']],
    cam: (lt, s) => { const k = WORDS[s.w0 + 1].s - s.s; return lt < k ? handheld(follow(l => [-22 + l * 16, 0, 2], [6, 3.4, 10]), 1.3)(lt, s) : whip([12, 9, 6], [-22 + k * 16, 3, 2], [29, 15, -4], k, { dur: 0.25, fov: 44 })(lt); },
    act(lt, c) { const k = c.w('ten'); const x = -22 + Math.min(lt, k + 0.3) * 16; cfC.clear((fx, fz) => fx < x + 1.2, 'c' + Math.floor(Math.min(lt, k + 0.3) * 30)); C.me.reset().place(x, 2, Math.PI / 2 - 0.25).pose(HOLD).setFace('joy'); C.me.walk(c.t, 1.6, 30); C.me.pose(HOLD); sweep(C.me, lt, 1, 0.3); C.kick.at(lt % 0.3, headPos(C.me), 0);
      const pct = Math.max(0, Math.round(100 - 100 * clamp(lt / (k + 0.3)))), sec = Math.min(10, Math.floor(remap(lt, 0, c.w('spotless')) * 10)); court.scoreboard.set('CONFETTI', pct + '%', 'SECONDS', sec); } });
  // 17 the silence: a guest frozen mid-party, real silent hold, then the camera dives into a bush (fly-through)
  shot({ line: 'The music stopped. //', set: court, sfx: [['thud', 'stopped', 0.7]],
    cam: (lt, s) => { const k = E.in(remap(lt, s.d - 0.4, s.d)); return { pos: [lerp(-6, -2.2, k), lerp(4.6, 4.3, k), lerp(9, 4.2, k)], look: [-4.6, 4.2, 3], fov: 56, blur: 0.8, push: 0.08 }; },
    act(lt, c) { cfC.clear((fx) => true, 'clean'); C.fan2.reset().place(-4.6, 3, 0.3).pose('cheer').setFace(lt < c.w('stopped') ? 'joy' : 'gasp'); if (lt < c.w('stopped')) C.fan2.idle(c.t); C.fan1.reset().place(1, -1, -0.4).pose('cheer').setFace('gasp'); court.scoreboard.set('CONFETTI', '0%', 'SECONDS', 10); C.veil.at(lt - (c.d - 0.33), c.camera); } });
  // 18 reversal: the next night, a quiet street, every window lit
  shot({ line: 'The next night, from every single window...', set: stN, sfx: [['whoosh', 0, 0.4]],
    cam: (lt, s) => ({ pos: [-16 + lt * 1.5, 4.2, 19], look: [-10 + lt * 1.5, 5.5, -4], fov: 56, blur: 0.15 }),
    act(lt, c) { stN.party = false; cfN.clear((fx, fz) => true, 'clean'); N.me.reset().place(-12 + lt * 1.6, 4.4, Math.PI / 2 - 0.4).walk(c.t, 0.9).setFace(lt < c.w('window') ? 'uneasy' : 'gasp').lookAt(-8, -8); holdBroom(N.me); } });
  // 19 HUSS! from the windows: grandma sweeping her room at midnight
  shot({ line: 'HUSS! Even grandma.', set: room, sfx: [['whoosh', 0, 0.6], ['whoosh', 0.42, 0.5], ['pop', 'grandma', 0.5]],
    cam: frame(-1, 2, { size: 'full', side: -14, low: 0.3 }),
    act(lt, c) { R.gran.reset().place(-1 + lt * 0.8, 2, 0.35).pose(HOLD).setFace('joy').idle(c.t); sweep(R.gran, lt); R.kick.at(lt % 0.42, headPos(R.gran), 0.3); } });
  // 20 cost: the empty pool, narrator alone
  shot({ line: 'Nobody parties anymore.', set: poolE, sfx: [['sad', 'anymore', 0.6]],
    cam: frame(-4, 8.5, { size: 'full', side: 18, dist: 1.2 }),
    act(lt, c) { PE.me.reset().place(-4, 8.5, 0.2).pose(HOLD, 0.6).pose('slump', 0.5).setFace(lt < c.w('anymore') ? 'uneasy' : 'sad').idle(c.t, 0.5); holdBroom(PE.me); } });
  // 21 button: he throws a party (party wash cycles)
  shot({ line: 'So I threw one.', set: tblG, sfx: [['pop', 'one', 0.6]],
    cam: frame(-2.5, 4.5, { size: 'medium', side: -14 }),
    act(lt, c) { rainG.at(c.t); cfG.clear(); swim(bowlG, c.t); G.me.reset().place(-2.5, 4.5, 0.2).pose(lt < c.w('one') ? 'open' : 'cheer').setFace(lt < c.w('one') ? 'calm' : 'joy').idle(c.t); if (lt >= c.w('one')) dance(G.me, c.t, 0); } });
  // 22 the only guest: the goldfish (payoff of the plant)
  shot({ line: "The only guest was the mayor's goldfish.", set: tblG, sfx: [['ding', 'goldfish', 0.6]],
    cam: { pos: [-0.6, 9.2, 13.5], look: [-0.6, 4.4, 0.2], fov: 44, blur: 0.35, push: 0.1 },
    act(lt, c) { rainG.at(c.t); cfG.clear(); swim(bowlG, c.t); G.me.reset().place(-2.4, 2.6, 0.5).pose('wave').setFace('joy').idle(c.t); } });
  // 23 final wide: narrator sweeps up after the goldfish, HUSS!, hard cut
  shot({ line: 'He left confetti everywhere. HUSS!', set: tblG, sfx: [['whoosh', 'huss', 0.6], ['whoosh', 'huss', 0.4]],
    cam: frame(-1.5, 5, { size: 'full', side: 12, low: 0.1, dist: 1.4 }),
    act(lt, c) { cfG.clear(); swim(bowlG, c.t); const h = c.w('huss'); G.me.reset().place(-3.5, 5, 0.25).pose(HOLD).setFace(lt < c.w('everywhere') ? 'calm' : lt < h ? 'uneasy' : 'joy').idle(c.t); if (lt < h) { holdBroom(G.me); rainG.at(c.t); } else { sweep(G.me, lt - h); G.kick.at((lt - h) % 0.42, headPos(G.me), 0.25); } } });
});
