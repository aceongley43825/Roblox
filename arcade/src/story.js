// story.js: "In this town, everybody parties. Except me." (arcade / high scores, catchphrase HUSS!)
// One shot() per picture. '//' = 0.6 s silent hold, '///' = 1.0 s. ALL-CAPS words show in caps.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, hatOn, handheld, whip, drone, makeVeil, goldfishBowl, partyWash } from './town.js';
import { cabinet, pinball, arcadeRoom, crown, topHat, gradCap, screwdriver } from './arcade.js';
import { makeSparkles, makePuff } from './fx.js';
import { sign, at, remap, E, lerp, clamp } from './util.js';
import { bench, bush } from './sets.js';

start(() => {
  // ── sets
  const street = TOWN.street({ time: 'night', litAll: true });
  street.group.add(at(bench('#8a5a34'), -19, 0, 2.4));
  for (const x of [6.5, 8.5, 10.5]) { const b = bush('#24452a'); b.scale.setScalar(1.7); street.group.add(at(b, x, 0, 6)); }
  const SW = partyWash(street.group, { strength: 0.35 });
  const winGlow = new THREE.PointLight('#5ef2ff', 0, 40, 1.4); winGlow.position.set(0, 7, -1); street.group.add(winGlow);
  const arc = arcadeRoom(), HERO = arc.hero;
  const pool = TOWN.pool(), poolE = TOWN.pool();
  const party = TOWN.partyTable({ wall: '#b886b4' }), partyE = TOWN.partyTable({ wall: '#b886b4' }), party2 = TOWN.partyTable({ wall: '#b886b4' });
  const off = s => { s.update = null; for (const L of s.group.children.slice(-3)) L.intensity = 0; };   // party lights off (empty pool / empty chairs)
  off(poolE); off(partyE);
  const grad = sign('HAPPY GRADUATION', 12, 1.6, { bg: '#2b2f3e', fg: '#ffd23f' }); party.group.add(at(grad, 0, 9, -7.85));
  const court = TOWN.court({ time: 'night', banner: 'MEGA PARTY' }), CW = partyWash(court.group, { strength: 0.35 });
  const CC = cabinet({ color: '#3a2bd6', title: 'STAR BLAST', seed: 1, light: true }); court.group.add(at(CC, -2, 0, 2, Math.PI / 2));
  const r1 = TOWN.roomNight({ wall: '#3e4f8f', bed: '#c33a3a' }), R1C = cabinet({ color: '#d6331f', title: 'ROCKET RUN', seed: 3, light: true, lightColor: '#ffb0e8' }); r1.group.add(at(R1C, -2, 0, 0, Math.PI / 2));
  const r2 = TOWN.roomNight({ wall: '#5a3e8f', rug: '#5ef2ff', shelf: true }), R2C = [-4.5, 0, 4.5].map((x, i) => { const c = cabinet({ color: ['#1fae5a', '#d68a1f', '#1f8ad6'][i], title: ['TURBO KART', 'MEGA MAZE', 'GALAXY 9'][i], seed: 4 + i }); r2.group.add(at(c, x, 0, -4.2)); return c; });
  const r3 = TOWN.roomNight({ wall: '#8f5a3e', rug: '#c06a9a', shelf: true }), PB = pinball({ seed: 7 }); r3.group.add(at(PB, 0, 0, -2));
  const PC = cabinet({ color: '#3a2bd6', title: 'STAR BLAST', seed: 1, light: true }); party2.group.add(at(PC, 9.5, 0, -2.5, -0.45));
  street.light = 'townNight';

  // ── cast: one copy per set, identical looks
  const LOOK = {
    me: () => makeNarrator({ color: '#2f4fc4', print: 'GAME ON' }),
    milo: () => makeAvatar({ seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' }),
    rita: () => makeAvatar({ seed: 7, skin: 'brown', hair: 'ponytail', hairColor: '#1b1210', top: 'stripes', topColor: '#19a7a0', bottom: 'shorts', bottomColor: '#f2d33c' }),
    gran: () => makeAvatar({ seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true }),
    mayor: () => { const a = makeAvatar({ seed: 8, skin: 'light', hair: 'bald', top: 'suit', topColor: '#2b2f3e', bottom: 'slacks', bottomColor: '#2b2f3e', glasses: true }); a.head.add(topHat()); return a; },
    derek: () => { const a = makeAvatar({ seed: 6, skin: 'light', hair: 'short', hairColor: '#e0b040', top: 'jersey', topColor: '#d23a3a', number: '1', bottom: 'shorts', bottomColor: '#d23a3a' }); a.head.add(crown()); return a; },
    f1: () => makeAvatar({ seed: 4, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' }),
    f2: () => makeAvatar({ seed: 5, skin: 'deep', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' }),
    f3: () => makeAvatar({ seed: 9, skin: 'tan', hair: 'messy', hairColor: '#5a3a1a', top: 'hoodie', topColor: '#ff7ac2', bottom: 'joggers', bottomColor: '#444' }),
    f4: () => makeAvatar({ seed: 10, skin: 'fair', hair: 'long', hairColor: '#c9772f', top: 'sweater', topColor: '#7ab8ff', bottom: 'skirt', bottomColor: '#2b2f3e' }),
  };
  const HATS = { me: '#ff4fd8', milo: '#f2b01e', rita: '#7dffa8', gran: '#7fc98a', f1: '#ff7ac2', f2: '#7ab8ff', f3: '#ffe46a', f4: '#c18cff', mayor: null, derek: null };
  const reg = new Map();
  const A = (set, name, hat = false) => { let m = reg.get(set); if (!m) reg.set(set, m = {}); if (!m[name]) { m[name] = LOOK[name](); set.group.add(m[name].root); if (hat && HATS[name]) hatOn(m[name], HATS[name]); } return m[name]; };
  const props = new Map();
  const P = (set, name, make) => { const k = name; let m = props.get(set); if (!m) props.set(set, m = {}); if (!m[k]) m[k] = make(set); return m[k]; };
  const bowl = set => P(set, 'bowl', s => { const b = goldfishBowl(); b.add(at(gradCap(), 0, 3.12, 0)); s.group.add(b); return b; });
  const fishSwim = (b, t) => { b.fish.position.x = Math.sin(t * 1.8) * 0.5; b.fish.rotation.y = Math.cos(t * 1.8) > 0 ? 0 : Math.PI; b.fish.position.y = 1.5 + Math.sin(t * 3) * 0.12; };
  const tool = set => P(set, 'tool', s => { const sd = screwdriver(); A(s, 'me').handR.add(sd); return sd; });
  const sparks = set => P(set, 'sp', s => makeSparkles(s.group, 4, 10));
  const puff = set => P(set, 'puff', s => makePuff(s.group));
  const veil = makeVeil(street.group);

  // ── motion helpers
  const dance = (av, t, ph = 0, amt = 1) => { const s = Math.sin(t * 9 + ph); av.pose({ aL: [150 + 22 * s, 30], aR: [150 - 22 * s, 30] }); av.hip.position.y += Math.abs(s) * 0.25 * amt; av.hip.rotation.z += s * 0.1 * amt; av.head.rotation.z += s * 0.1; return av; };
  const mash = (av, t, k = 1) => { av.pose({ aL: [64, 12], aR: [64, 12] }); av.armL.rotation.x += Math.sin(t * 28) * 0.1 * k; av.armR.rotation.x += Math.sin(t * 31 + 1) * 0.12 * k; av.hip.position.y += Math.abs(Math.sin(t * 14)) * 0.05 * k; return av; };
  const tinker = (av, t) => { av.pose({ aR: [72, -6], aL: [40, 18] }); av.armR.rotation.z += Math.sin(t * 16) * 0.12; return av; };
  const kneel = av => { av.pose({ lL: 80, lR: 20, lean: [12, 0] }); av.hip.position.y = 1.25; return av; };
  const street_ = (c, party) => { SW.update(c.t, party); winGlow.intensity = 0; };
  const scoresHUS = [['HUS', '999,990'], ['HUS', '999,980'], ['HUS', '999,970'], ['HUS', '999,960'], ['HUS', '999,950']];
  // screen camera: inside a cabinet's screen, looking out at the player (the face lit by the game)
  const screenCam = (from, to, o = {}) => ({ pos: [from[0] - 1.0, from[1], from[2]], look: to, fov: o.fov || 52, blur: o.blur ?? 0.8, push: o.push ?? 0.07, roll: o.roll });
  const ME_A = [0.6, 0];   // player spot in front of the arcade hero cabinet (faces -x)

  // ═════════ ACT 1: everybody parties, except me
  // 1 HOOK: drone over the night street, one house rocking with party light
  shot({ line: 'In this town, everybody parties.', set: street, sfx: [['whoosh', 0]],
    cam: drone([0, 4, -4], { h: 30, back: 46, drift: [8, -2, -10], fov: 52 }),
    act(lt, c) { street_(c, true); ['f1', 'f2', 'f3', 'f4', 'milo'].forEach((n, i) => dance(A(street, n, true).reset().place(-8 + i * 4, 0.5 + (i % 2) * 1.5, 0), c.t, i * 1.3).setFace('joy')); } });
  // 2 the exception: narrator close-up, wink + open grin
  shot({ line: 'Except me.', set: street, sfx: [['pop', 'me', 0.6]],
    cam: frame(4, 3.5, { size: 'close', side: -12 }),
    act(lt, c) { street_(c, true); A(street, 'me').reset().place(4, 3.5, -0.15).setFace(lt < c.w('me') ? 'calm' : 'winkjoy').idle(c.t); dance(A(street, 'f2', true).reset().place(-2, -2, 0.3), c.t, 1).setFace('joy'); } });
  // 3 he fixes arcade machines: kneeling at the open cabinet, sparks, the screen boots up
  shot({ line: 'I fix arcade machines.', set: arc, sfx: [['tick', 'arcade'], ['sparkle', 'machines', 0.5]],
    cam: { pos: [-0.4, 3.6, 6.4], look: [0.4, 2.8, 0], fov: 55, blur: 0.5 },
    act(lt, c) { const me = A(arc, 'me'); tool(arc).visible = true; tinker(kneel(me.reset().place(1.0, 0.3, -Math.PI / 2 + 0.7)), c.t).setFace('serious'); me.head.rotation.x = 0.25;
      HERO.open(1); HERO.screen.set(lt < c.w('machines') ? 'ooo' : 'game', {}, c.t); sparks(arc).at(lt - c.w('machines'), [-0.8, 0.2, 0], 0.6); } });
  // 4 catchphrase beat: low hero angle, mashing the buttons
  shot({ line: 'HUSS! HUSS!', set: arc, sfx: [['tick', 0, 0.8], ['tick', 0.2, 0.8], ['tick', 0.4, 0.8], ['tick', 'huss', 0.8], ['pop', 'huss', 0.5]],
    cam: { pos: [-0.6, 1.2, 4.8], look: [0.5, 4.6, 0], fov: 60, blur: 0.3 },
    act(lt, c) { HERO.peek(); const me = A(arc, 'me'); tool(arc).visible = false; mash(me.reset().place(ME_A[0], ME_A[1], -Math.PI / 2 + 0.95), c.t).setFace('joy'); HERO.open(0); HERO.mash(c.t); HERO.screen.set('game', { score: 40000 + lt * 90000 }, c.t); } });
  // 5-7 the world list: pool parties / pizza parties / a graduation party for the mayor's goldfish
  shot({ line: 'Pool parties.', set: pool, sfx: [['whoosh', 0, 0.5]],
    cam: { pos: [0, 13, 24], look: [0, 1, -2], fov: 52, blur: 0, push: 0.05 },
    act(lt, c) { ['f1', 'f2', 'f3'].forEach((n, i) => A(pool, n, true).reset().place(-6 + i * 5, -1 + (i % 2) * 3, 0.2, -2.6 + Math.sin(c.t * 3 + i) * 0.15).pose('cheer').setFace('joy'));
      const k = remap(lt, 0.1, 0.9); A(pool, 'f4', true).reset().place(3, -8 + k * 6, 0, 1.3 + Math.sin(k * Math.PI) * 4 - k * 2).pose('cheer').setFace('joy');
      dance(A(pool, 'rita', true).reset().place(-9, 9, 0.4), c.t).setFace('joy'); } });
  shot({ line: 'Pizza parties.', set: party,
    cam: { pos: [2, 9, 12], look: [0, 3.4, -1], fov: 52, blur: 0.2 },
    act(lt, c) { ['f1', 'f2', 'f3', 'f4'].forEach((n, i) => { const a = A(party, n, true).reset().place(-3.3 + i * 2.2, -3, 0).sit(1.6).setFace(i % 2 ? 'joy' : 'laugh').idle(c.t); a.armR.rotation.x = -1.2 - Math.abs(Math.sin(c.t * 6 + i)) * 0.6; }); bowl(party).visible = false; } });
  shot({ line: "A graduation party for the mayor's goldfish.", set: party, sfx: [['pop', 'goldfish', 0.7]],
    cam: { pos: [1.4, 6.0, 9.5], look: [0.4, 4.4, -0.5], fov: 46, blur: 0.5, push: 0.08 },
    act(lt, c) { const b = bowl(party); b.visible = true; b.position.set(0, 2.9, 0.6); fishSwim(b, c.t);
      A(party, 'mayor').reset().place(3, -3.2, -0.3).pose('cheer').setFace('joy').idle(c.t); dance(A(party, 'f2', true).reset().place(-3.4, -3.4, 0.3), c.t, 2).setFace('joy'); } });
  // 8 nobody here plays games
  shot({ line: 'Nobody here plays games.', set: pool,
    cam: frame(5, 9.5, { size: 'medium', side: -18 }),
    act(lt, c) { dance(A(pool, 'f3', true).reset().place(5, 9.5, -0.2), c.t, 0.5).setFace('joy'); dance(A(pool, 'f1', true).reset().place(-1, 6.2, 0.3), c.t, 2.2).setFace('laugh'); } });
  // 9 narrator: why would they?
  shot({ line: 'Why would they?', set: street,
    cam: frame(-3, 3.5, { size: 'close', side: 16 }),
    act(lt, c) { street_(c, true); A(street, 'me').reset().place(-3, 3.5, 0.15).pose('shrug').setFace(lt < c.w('they') ? 'calm' : 'joy').idle(c.t); } });
  // 10-12 the three named people
  shot({ line: 'Best friend Milo dances on tables.', set: party, sfx: [['boing', 'dances', 0.5]],
    cam: { pos: [3, 6.6, 13], look: [0, 5.6, 0], fov: 56, blur: 0.3 },
    act(lt, c) { dance(A(party, 'milo', true).reset().place(0, 0, 0.1, 2.95), c.t, 0, 1.4).setFace(lt < c.w('dances') ? 'grin' : 'joy'); ['f1', 'f4'].forEach((n, i) => A(party, n, true).reset().place(-4 + i * 8, -3, 0).sit(1.6).pose('cheer').setFace('joy')); bowl(party).visible = false; } });
  shot({ line: 'Neighbor Rita throws pool parties.', set: pool,
    cam: frame(-4, 9, { size: 'medium', side: 20 }),
    act(lt, c) { A(pool, 'rita', true).reset().place(-4, 9, 0.15).pose(lt < c.w('throws') ? 'open' : 'cheer').setFace('joy').talk(c.t); ['f2', 'f3'].forEach((n, i) => A(pool, n, true).reset().place(-7 + i * 7, 1 - i * 2, 0, -2.6 + Math.sin(c.t * 3 + i) * 0.15).pose('cheer').setFace('joy')); } });
  shot({ line: 'Even Grandma does the limbo.', set: party, sfx: [['boing', 'limbo', 0.5]],
    cam: frame(0, 6.6, { size: 'full', side: 38, low: 0.2 }),
    act(lt, c) { const k = remap(lt, 0, c.d); const g = A(party, 'gran', true).reset().place(0, 5.4 + k * 2.4, 0).pose({ aL: [20, 60], aR: [20, 60], lL: 50, lR: 50, lean: [-38, 0], head: [-10, 0, 0] }).setFace('joy'); g.hip.position.y = 1.5;
      P(party, 'limbo', s => { const L = new THREE.Group(); L.add(at(new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 0.18), new THREE.MeshLambertMaterial({ color: '#ffd23f' })), 0, 4.0, 0)); for (const x of [-3, 3]) L.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.4, 0.25), new THREE.MeshLambertMaterial({ color: '#ff4fd8' })), x, 2.2, 0)); L.position.set(0, 0, 6.6); s.group.add(L); return L; }).visible = true;
      ['f1', 'f3'].forEach((n, i) => A(party, n, true).reset().place(-5 + i * 10, 5, i ? -0.6 : 0.6).pose('cheer').setFace('joy').idle(c.t)); bowl(party).visible = false; } });
  // 13 but not me: narrator close-up with the screwdriver
  shot({ line: 'But not me.', set: arc,
    cam: screenCam([-1.5, 5.3, 0.25], [0.6, 5.0, 0], { fov: 62 }),
    act(lt, c) { HERO.peek(); arc.sky('night'); const me = A(arc, 'me'); tool(arc).visible = true; me.reset().place(ME_A[0], ME_A[1], -Math.PI / 2).pose({ aR: [120, 10] }).setFace(lt < c.w('me') ? 'calm' : 'smirk').idle(c.t); me.armR.rotation.y = Math.sin(c.t * 8) * 0.3; HERO.open(0); HERO.screen.set('game', {}, c.t); } });
  // 14-16 montage: day by day, same framing, the window sky changes day -> sunset -> night
  const montage = (sky, light, kind, faceAt) => ({ set: arc, light, sfx: [['tick', 'huss', 0.8], ['pop', 'huss', 0.6]],
    cam: frame(ME_A[0], ME_A[1], { size: 'medium', side: -28 }),
    act(lt, c) { arc.sky(sky); const me = A(arc, 'me').reset().place(ME_A[0], ME_A[1], -Math.PI / 2); tool(arc).visible = kind === 'fix';
      if (kind === 'fix') { tinker(kneel(me), c.t).setFace(lt < c.w('huss') ? 'serious' : 'joy'); HERO.open(lt < c.w('huss') ? 1 : 0); HERO.screen.set(lt < c.w('huss') ? 'ooo' : 'game', {}, c.t); sparks(arc).at(lt - c.w('huss'), [-0.8, 0.2, 0], 0.6); }
      else { HERO.open(0); if (lt < c.w('huss')) { mash(me, c.t).setFace('serious'); HERO.mash(c.t); HERO.screen.set('game', { score: 900000 + lt * 50000 }, c.t); } else { me.pose('cheer').setFace('joy'); HERO.screen.set('score', { label: 'NEW HIGH SCORE', score: 999990 }, c.t); } } } });
  shot({ line: 'Day by day, HUSS!', ...montage('day', 'arcadeDay', 'play') });
  shot({ line: 'I fixed them. HUSS!', ...montage('sunset', 'arcadeSunset', 'fix') });
  shot({ line: 'I beat them all. HUSS!', ...montage('night', 'arcade', 'play') });
  // 17 insert: the high score table, every row is his
  shot({ line: 'Every high score: mine.', set: arc, sfx: [['ding', 'mine', 0.6]],
    cam: { pos: [2.6, 5.6, 0.2], look: [-1.22, 5.45, 0], fov: 44, blur: 0.15, push: 0.1 },
    act(lt, c) { HERO.open(0); HERO.screen.set('scores', { rows: scoresHUS }, c.t); } });

  // ═════════ ACT 2: the biggest party of the year
  const crowd = (c, mood) => { const bl = court.bleachers; ['f1', 'f2', 'f3', 'f4', 'milo', 'gran', 'rita'].forEach((n, i) => { const p = bl.seat(0.18 + i * 0.11, i % 3); const a = A(court, n, true).reset().place(p[0], p[2] - 19, 0, p[1]).sit(0);
      if (mood === 'party') dance(a, c.t, i).setFace('joy'); else if (mood === 'laugh') a.pose('point').setFace('laugh').talk(c.t, 2); else if (mood === 'cheer') a.pose('cheer').setFace('joy').idle(c.t); else a.setFace('gasp'); }); };
  shot({ line: 'Then came the party of the year.', set: court, sfx: [['whoosh', 0, 0.6]],
    cam: drone([0, 0, -4], { h: 34, back: 54, drift: [-10, -4, -8] }),
    act(lt, c) { CW.update(c.t); crowd(c, 'party'); court.scoreboard.set('PARTY', 'ON', 'MUSIC', 'UP'); CC.screen.set('game', {}, c.t); A(court, 'mayor').reset().place(-2, 5.5, 0.3).pose('wave').idle(c.t); } });
  shot({ line: 'And one arcade machine.', set: court, sfx: [['pop', 'machine', 0.6]],
    cam: { pos: [4, 5.4, 15], look: [-1.5, 4.2, 2], fov: 52, blur: 0.3 },
    act(lt, c) { CW.update(c.t); A(court, 'mayor').reset().place(1.2, 4.8, -0.6).pose(lt < c.w('machine') ? 'idle' : 'open').setFace('joy').talk(c.t); CC.screen.set('scores', { rows: [['DRK', '12,000'], ['DRK', '11,500'], ['DRK', '9,000'], ['DRK', '8,000'], ['DRK', '7,500']] }, c.t); crowd(c, 'party'); } });
  shot({ line: 'Everybody laughed.', set: court, sfx: [['boing', 'laughed', 0.5]],
    cam: { pos: [9, 6, 22], look: [3, 4, -6], fov: 55, blur: 0.15 },
    act(lt, c) { CW.update(c.t); const k = remap(lt, 0, c.w('laughed')); A(court, 'me').reset().place(lerp(12, 5, k), 6, -Math.PI / 2 - 0.3).walk(c.t, k < 1 ? 1 : 0).setFace('calm'); crowd(c, lt < c.w('laughed') ? 'party' : 'laugh'); A(court, 'derek').reset().place(-1, 4, 0.3).pose('hips').setFace(lt < c.w('laughed') ? 'smug' : 'laugh').idle(c.t); } });
  shot({ line: "Party King Derek: who's the beanie guy?", set: court,
    cam: frame(-1, 4, { size: 'close', side: -14 }),
    act(lt, c) { CW.update(c.t); A(court, 'derek').reset().place(-1, 4, 0.2).pose(lt < c.w("who's") ? 'hips' : 'point').setFace(lt < c.w("who's") ? 'smug' : 'say').talk(c.t); } });
  // 22-26 triumph
  shot({ line: 'I grabbed the stick.', set: court,
    cam: screenCam([-1.5, 5.3, 2.25], [0.6, 5.0, 2], { fov: 62 }),
    act(lt, c) { CW.update(c.t); CC.peek(); const me = A(court, 'me').reset().place(0.6, 2, -Math.PI / 2); me.pose(lt < c.w('stick') ? 'idle' : { aL: [64, 12], aR: [64, 12] }).setFace('smirk').idle(c.t); CC.screen.set('game', { score: 0 }, c.t); } });
  shot({ line: 'HUSS! HUSS! HUSS!', set: court, sfx: [['tick', 0, 0.8], ['tick', 0.32, 0.8], ['tick', 0.64, 0.8], ['whoosh', 0.7, 0.6]],
    cam: (lt, s) => { const t0 = s.d * 0.55; return lt < t0 ? handheld({ pos: [3.4, 5.0, 7.0], look: [0.2, 3.9, 2], fov: 56, blur: 0.2, push: 0 }, 1.5)(lt, s) : whip([2.2, 5.9, 5.6], [0.2, 3.9, 2], [-1.22, 5.45, 2], t0, { fov: 48 })(lt); },
    act(lt, c) { CW.update(c.t); mash(A(court, 'me').reset().place(0.6, 2, -Math.PI / 2), c.t, 1.4).setFace('joy'); CC.mash(c.t); CC.screen.set('game', { score: lt * 18000 }, c.t); } });
  shot({ line: 'Fifty thousand.', set: court, sfx: [['tick', 'fifty', 0.5]],
    cam: { pos: [2.0, 6.0, 3.6], look: [-1.22, 5.45, 2], fov: 42, blur: 0.15, push: 0.09 },
    act(lt, c) { CW.update(c.t); A(court, 'me').reset().place(0.6, 2, -Math.PI / 2).pose({ aL: [64, 12], aR: [64, 12] }); CC.screen.set('score', { score: Math.min(50000, 12000 + (lt / c.d) * 52000) }, c.t); } });
  shot({ line: 'One million.', set: court, sfx: [['sparkle', 'million', 0.6]],
    cam: { pos: [3.0, 5.3, 2.2], look: [-1.22, 5.3, 2], fov: 34, blur: 0.1, push: 0.12 },
    act(lt, c) { CW.update(c.t); CC.screen.set('score', { score: lt < c.w('million') ? 50000 : 1000000, flash: lt >= c.w('million') }, c.t); } });
  shot({ line: 'All by myself.', set: court, sfx: [['pop', 'myself', 0.6]],
    cam: frame(0.9, 2.2, { size: 'close', side: -16, low: 0.3 }),
    act(lt, c) { CW.update(c.t); A(court, 'me').reset().place(0.9, 2.2, -0.3).pose('cheer').setFace('joy').idle(c.t); CC.screen.set('score', { score: 1000000, flash: true }, c.t); } });
  // 27 silence: music stops, crowd goes silent, 0.6 s hold on a shocked face
  shot({ line: 'The music stopped. The crowd went silent. //', set: court, sfx: [['thud', 'stopped', 0.7]],
    cam: (() => { const p = court.bleachers.seat(0.18, 0); return frame(p[0], p[2] - 19, { size: 'close', y: p[1], side: 8 }); })(),
    act(lt, c) { CW.update(c.t, lt < c.w('stopped')); crowd(c, lt < c.w('stopped') ? 'party' : 'gasp'); } });
  // 28 the rival walks up
  shot({ line: 'When did you get so good?', set: court,
    cam: { pos: [2.6, 4.8, 15], look: [2.6, 4.1, 2], fov: 50, blur: 0.3 },
    act(lt, c) { const k = remap(lt, 0, 0.6); const d = A(court, 'derek').reset().place(lerp(7, 4.4, k), 2, -Math.PI / 2); if (k < 1) d.walk(c.t); d.setFace('sad').talk(c.t, k >= 1 ? 1 : 0); A(court, 'me').reset().place(0.6, 2, Math.PI / 2).setFace('calm').idle(c.t); } });
  // 29 the line: narrator close-up, wink, push in hard
  shot({ line: 'The truth? While you were partying.', set: court, sfx: [['pop', 'partying', 0.6]],
    cam: frame(0.6, 2, { size: 'close', side: -28, facing: Math.PI / 2, push: 0.12 }),
    act(lt, c) { A(court, 'me').reset().place(0.6, 2, Math.PI / 2).pose('idle').setFace(lt < c.w('partying') ? 'say' : 'winkjoy').talk(c.t, lt < c.w('partying') ? 1 : 0); } });

  // ═════════ ACT 3: the reversal
  // 30 fly-through: the next night on the quiet street, the camera dives into the hedge
  shot({ line: 'The next night,', set: street, sfx: [['whoosh', 'night', 0.9]],
    cam: (lt, s) => { const k = E.in(remap(lt, s.d - 0.42, s.d)); return { pos: [lerp(-2 + lt * 1.2, 8.5, k), lerp(5.2, 1.6, k), lerp(17, 7.4, k)], look: [lerp(1 + lt, 8.5, k), lerp(3.4, 1.4, k), lerp(3.5, 6, k)], fov: 54, blur: 0.15, push: 0 }; },
    act(lt, c) { street_(c, false); A(street, 'me').reset().place(-2 + lt * 2.4, 3.5, Math.PI / 2 - 0.2).walk(c.t, 0.8).setFace('calm'); veil.at(lt - (c.d - 0.33), c.camera); } });
  shot({ line: 'something was wrong.', set: street,
    cam: frame(2, 3.5, { size: 'close', side: -18 }),
    act(lt, c) { street_(c, false); A(street, 'me').reset().place(2, 3.5, -0.1).setFace(lt < c.w('wrong') ? 'calm' : 'uneasy').idle(c.t); A(street, 'me').head.rotation.y += Math.sin(lt * 3) * 0.3; } });
  shot({ line: 'Empty pool.', set: poolE,
    cam: { pos: [-2, 11, 23], look: [0, 0.5, -2], fov: 52, blur: 0, push: 0.05 },
    act(lt, c) { A(poolE, 'me').reset().place(8, 9, -0.6).setFace('uneasy').idle(c.t); } });
  shot({ line: 'Empty chairs.', set: partyE,
    cam: { pos: [-3, 7, 12], look: [0, 3, -1], fov: 52, blur: 0.2, push: 0.06 },
    act(lt, c) { } });
  shot({ line: 'Then, from every window,', set: street,
    cam: frame(0, 4, { size: 'full', side: 18, low: 0.4 }),
    act(lt, c) { street_(c, false); const me = A(street, 'me').reset().place(0, 4, Math.PI).setFace('uneasy'); me.head.rotation.x = -0.35; } });
  // 35 HUSS from every window, gasp + 1.0 s silent hold
  shot({ line: 'HUSS! ///', set: street, sfx: [['tick', 0, 0.8], ['tick', 0.15, 0.6], ['tick', 0.3, 0.6], ['pop', 0, 0.6]],
    cam: frame(0, 4, { size: 'close', side: -8, push: 0.1 }),
    act(lt, c) { street_(c, false); winGlow.intensity = 260 + Math.sin(c.t * 37) * 80; winGlow.color.set(Math.floor(c.t * 8) % 2 ? '#5ef2ff' : '#ff4fd8'); A(street, 'me').reset().place(0, 4, 0).setFace('gasp').idle(c.t, lt < 0.4 ? 1 : 0.2); } });
  // 36-38 the three named people, now gaming
  shot({ line: 'Milo was gaming.', set: r1, sfx: [['tick', 'gaming', 0.6]],
    cam: screenCam([-1.5, 5.3, 0.25], [0.6, 5.0, 0], { fov: 62 }),
    act(lt, c) { R1C.peek(); mash(A(r1, 'milo').reset().place(0.6, 0, -Math.PI / 2), c.t).setFace(lt < c.w('gaming') ? 'serious' : 'joy'); R1C.mash(c.t); R1C.screen.set('game', { score: 3000 + lt * 4000 }, c.t); } });
  shot({ line: 'Rita bought three machines.', set: r2, sfx: [['pop', 'three', 0.6]],
    cam: frame(0, 1.5, { size: 'full', side: 10, dist: 1.25 }),
    act(lt, c) { A(r2, 'rita').reset().place(0, 1.5, 0).pose(lt < c.w('three') ? 'open' : 'cheer').setFace('joy').talk(c.t); R2C.forEach((m, i) => m.screen.set('game', {}, c.t + i)); } });
  shot({ line: 'Grandma was speed-running pinball.', set: r3, sfx: [['tick', 'pinball', 0.7], ['tick', 0.5, 0.6]],
    cam: { pos: [0, 4.9, -4.4], look: [0, 4.4, 1.6], fov: 56, blur: 0.7 },
    act(lt, c) { const g = A(r3, 'gran').reset().place(0, 1.6, Math.PI).pose({ aL: [58, 14], aR: [58, 14] }).setFace(lt < c.w('pinball') ? 'serious' : 'smirk'); g.armL.rotation.x += Math.sin(c.t * 22) * 0.1; g.armR.rotation.x += Math.sin(c.t * 19 + 2) * 0.1; PB.flip(c.t); PB.screen.set('score', { score: 4200000 + lt * 300000 }, c.t); } });
  // 39-42 the cost
  shot({ line: 'Nobody parties anymore.', set: street,
    cam: { pos: [12, 6, 24], look: [0, 3, 0], fov: 52, blur: 0, push: 0.05 },
    act(lt, c) { street_(c, false); } });
  shot({ line: 'The whole town is gaming.', set: street,
    cam: drone([0, 4, -8], { h: 36, back: 50, drift: [-8, -2, -8] }),
    act(lt, c) { street_(c, false); winGlow.intensity = 220 + Math.sin(c.t * 23) * 70; winGlow.color.set(Math.floor(c.t * 5) % 2 ? '#5ef2ff' : '#ff4fd8'); } });
  shot({ line: 'Which is great,', set: street,
    cam: frame(-3, 3.5, { size: 'close', side: 12 }),
    act(lt, c) { street_(c, false); A(street, 'me').reset().place(-3, 3.5, 0.1).setFace('laugh').idle(c.t); } });
  shot({ line: "except I'm alone on Fridays.", set: street, sfx: [['sad', 'fridays', 0.5]],
    cam: frame(-19, 2.6, { size: 'full', side: 35, h: 0.8 }),
    act(lt, c) { street_(c, false); A(street, 'me').reset().place(-19, 2.6, 0).sit(1.4).pose('slump').setFace('sad').idle(c.t, 0.4); } });
  // 43-46 button: he throws a party, the only guest is the planted goldfish, who beats his high score
  shot({ line: 'So I threw a party.', set: party2, sfx: [['pop', 'party', 0.6]],
    cam: frame(2, 5.4, { size: 'medium', side: -16 }),
    act(lt, c) { dance(A(party2, 'me', true).reset().place(2, 5.4, -0.1), c.t, 0, 0.6).setFace('calm'); bowl(party2).visible = false; PC.screen.set('game', {}, c.t); } });
  shot({ line: "The only guest: the mayor's goldfish.", set: party2,
    cam: { pos: [-0.8, 6.4, 10], look: [-0.6, 4.2, -1], fov: 50, blur: 0.4, push: 0.08 },
    act(lt, c) { const b = bowl(party2); b.visible = true; b.position.set(0.6, 2.9, 0.3); fishSwim(b, c.t); A(party2, 'me', true).reset().place(-2.2, -3, 0.2).sit(1.6).setFace('calm').idle(c.t); PC.screen.set('game', {}, c.t); } });
  shot({ line: 'He beat my high score.', set: party2, sfx: [['ding', 'score', 0.6]],
    cam: { pos: [6.4, 5.8, 4.2], look: [9.16, 5.45, -1.8], fov: 46, blur: 0.25, push: 0.08 },
    act(lt, c) { const b = bowl(party2); b.visible = true; b.position.set(6.2, 2.9, 1.4); fishSwim(b, c.t); PC.screen.set('scores', { rows: [['FSH', '1,000,001', '#ff8a2a'], ['HUS', '1,000,000'], ['HUS', '999,990'], ['HUS', '999,980'], ['HUS', '999,970']] }, c.t); } });
  shot({ line: 'HUSS!', set: party2, sfx: [['tick', 0, 0.8], ['pop', 0, 0.7]],
    cam: { pos: [2, 7.5, 17], look: [4, 4.5, -1], fov: 52, blur: 0.15, push: 0.08 },
    act(lt, c) { const b = bowl(party2); b.visible = true; b.position.set(4.6, 2.9, 0.9); fishSwim(b, c.t * 2); b.fish.position.y = 1.5 + Math.abs(Math.sin(c.t * 7)) * 0.4;
      A(party2, 'me', true).reset().place(1.4, 4.6, 0.2).pose('cheer').setFace('joy').idle(c.t); PC.screen.set('scores', { rows: [['FSH', '1,000,001', '#ff8a2a'], ['HUS', '1,000,000'], ['HUS', '999,990'], ['HUS', '999,980'], ['HUS', '999,970']] }, c.t); } });
});
