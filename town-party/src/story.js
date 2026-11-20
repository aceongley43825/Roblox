// story.js: "In this town, everybody parties every night." Town-story-shorts style, 60 s, catchphrase HUSS!
// One shot() per picture. `line` = words spoken in that shot (cuts land on its first word).
// '//' after a word = 0.6 s silent hold, '///' = 1.0 s (tools/holds.py). ALL-CAPS words show in caps.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, hatOn, ball, dribble, arc, handheld, follow, whip, drone, makeVeil, goldfishBowl, partyWash, partyHat } from './town.js';
import { bench, bush, tray } from './sets.js';
import { remap, E, lerp, at, box, sign, clamp } from './util.js';

start(() => {
  // ── sets
  const streetP = TOWN.street({ time: 'night', litAll: true, seed: 4 });       // the party town (colour wash on)
  { const P = partyWash(streetP.group, { strength: 0.35 }); streetP.update = (t) => P.update(t); }
  const streetN = TOWN.street({ time: 'night', litAll: true, seed: 4 });       // the hustle town (no party)
  streetN.group.add(at(bench('#7a5232'), 13, 0, 3));
  const courtN = TOWN.court({ time: 'night', banner: 'TOWN CUP' });
  const courtS = TOWN.court({ time: 'sunset', banner: 'TOWN CUP FINAL' });
  const courtD = TOWN.court({ time: 'day', banner: 'TOWN CUP' });
  for (const x of [-24, 24]) courtS.group.add(at(box(2.6, 5, 2.6, '#1b1c22'), x, 2.5, -17));
  const dive = bush('#24452a'); dive.scale.setScalar(2.6); courtS.group.add(at(dive, -9, 0, 10.5));
  const pool = TOWN.pool();
  const poolE = TOWN.pool(); poolE.update = null; poolE.light = 'townNight';
  const party = TOWN.partyTable({ wall: '#b886b4' });
  const partyE = TOWN.partyTable({ wall: '#b886b4' }); partyE.update = null; partyE.light = 'townNight';
  const partyF = TOWN.partyTable({ wall: '#7fa6d8' });
  partyF.group.add(at(sign('HAPPY BIRTHDAY BUBBLES', 16, 2.2, { bg: '#ffd25e', fg: '#7a1f12' }), 0, 10.2, -7.85));
  const bowl = goldfishBowl(); partyF.group.add(at(bowl, 0, 2.93, 0));
  { const glass = bowl.children.at(-1).material; glass.specular.set('#333333'); glass.shininess = 30; glass.opacity = 0.18; bowl.children[1].material.opacity = 0.22; bowl.fish.renderOrder = 2; }
  const fishHat = partyHat('#ff6fd8'); fishHat.position.set(0.1, 0.42, 0); fishHat.scale.setScalar(0.55); bowl.fish.add(fishHat);
  const bedroom = TOWN.roomNight({ wall: '#3e4f8f', bed: '#c33a3a', shelf: true });
  const dojo = TOWN.roomNight({ wall: '#7a3e3e', floor: '#a8764a', rug: '#2f4fc4', mats: true, bag: true });
  const granRoom = TOWN.roomNight({ wall: '#5e4a7a', rug: '#e09a6a', shelf: true });

  // ── cast: one copy per set with identical looks
  const LOOK = {
    me: () => makeNarrator({ color: '#3553b8', print: 'hustle' }),
    toby: () => makeAvatar({ seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' }),
    linda: () => makeAvatar({ seed: 7, skin: 'brown', hair: 'ponytail', hairColor: '#1b1210', top: 'stripes', topColor: '#19a7a0', stripe: '#ffffff', sleeves: 'short', bottom: 'joggers', bottomColor: '#2b2f45', shoe: '#ff7ac2' }),
    gran: () => makeAvatar({ seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', inner: '#f4efe6', sleeves: 'long', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true }),
    derek: () => makeAvatar({ seed: 6, skin: 'light', hair: 'short', hairColor: '#5a3a1a', top: 'jersey', topColor: '#d23a3a', number: '9', bottom: 'shorts', bottomColor: '#d23a3a', cap: '#d23a3a' }),
    mayor: () => makeAvatar({ seed: 9, skin: 'deep', hair: 'short', hairColor: '#1b1210', top: 'suit', topColor: '#2b2f45', bottom: 'slacks', bottomColor: '#2b2f45', glasses: true }),
    fan1: () => makeAvatar({ seed: 4, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' }),
    fan2: () => makeAvatar({ seed: 5, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' }),
    fan3: () => makeAvatar({ seed: 8, skin: 'dark', hair: 'afro', hairColor: '#1b1210', top: 'zip', topColor: '#8a4fd0', bottom: 'cargo', bottomColor: '#5a5a3a' }),
    fan4: () => makeAvatar({ seed: 12, skin: 'fair', hair: 'long', hairColor: '#c9822e', top: 'sweater', topColor: '#ff8a5c', bottom: 'skirt', bottomColor: '#3d6fe0' }),
  };
  const HATS = { toby: '#f2b01e', linda: '#7ab8ff', gran: '#7fc98a', mayor: '#ff6fd8', fan1: '#ff7ac2', fan2: '#c18cff', fan3: '#ffe46a', fan4: '#7dffa8', derek: '#f2b01e', me: '#ffe46a' };
  const cast = (set, names, o = {}) => {
    const c = {}; for (const n of names) { c[n] = LOOK[n](); set.group.add(c[n].root); if (o.hats) { const h = hatOn(c[n], HATS[n]); if (n === 'me') h.position.y = 1.5; } }
    c.ball = ball(); c.ball.visible = false; set.group.add(c.ball); return c;
  };
  const SP = cast(streetP, ['me', 'toby', 'linda', 'fan1', 'fan2', 'fan3', 'fan4'], { hats: true }); SP.me.head.children.at(-1).visible = false;
  const SN = cast(streetN, ['me']);
  const CN = cast(courtN, ['me', 'toby', 'linda', 'gran', 'fan1', 'fan3']);
  const CNb = [0, 1, 2, 3, 4].map(() => { const b = ball(); courtN.group.add(b); return b; });
  const CS = cast(courtS, ['me', 'derek', 'toby', 'linda', 'gran', 'fan1', 'fan2', 'fan3', 'fan4'], { hats: true });
  for (const n of ['me', 'derek']) CS[n].head.children.at(-1).visible = false;
  CS.veil = makeVeil(courtS.group);
  const CD = cast(courtD, ['me']);
  const PO = cast(pool, ['toby', 'fan1', 'fan2', 'fan3', 'fan4'], { hats: true });
  const PT = cast(party, ['linda', 'gran', 'fan1', 'fan2', 'fan3', 'fan4'], { hats: true });
  const PF = cast(partyF, ['me', 'mayor', 'fan1', 'fan2', 'fan3', 'fan4'], { hats: true });
  const BR = cast(bedroom, ['toby']), DJ = cast(dojo, ['linda']), GR = cast(granRoom, ['gran']);
  const snack = tray(true); PT.linda.handR.add(snack); snack.position.set(-1.5, -0.4, 0.9); snack.rotation.x = Math.PI / 2;

  // ── motion helpers
  const hide = (...bs) => bs.forEach(b => { b.visible = false; });
  const dance = (a, t, ph = 0, amt = 1) => { const s = Math.sin(t * 9 + ph); a.pose({ aL: [150 + s * 25, 30], aR: [150 - s * 25, 30] }); a.hip.position.y += Math.abs(Math.sin(t * 9 + ph)) * 0.25 * amt; a.hip.rotation.y += Math.sin(t * 4.5 + ph) * 0.3 * amt; return a; };
  const cheer = (a, t, ph = 0) => { a.pose('cheer'); a.armL.rotation.z += Math.sin(t * 11 + ph) * 0.25; a.armR.rotation.z -= Math.sin(t * 11 + ph + 1) * 0.25; return a; };
  const hold = (a, b) => { const p = a.root.position, r = a.root.rotation.y; a.pose({ aL: [62, -18], aR: [62, -18] }); b.visible = true; b.position.set(p.x + Math.sin(r) * 1.55, p.y + 2.65, p.z + Math.cos(r) * 1.55); };
  const crowd = (set, X, names, face, mode, t) => names.forEach((n, i) => { const p = set.bleachers.seat(0.22 + i * 0.09, i % 3); const a = X[n].reset().place(p[0], p[2] - 19, 0, p[1]).sit(0).setFace(typeof face === 'function' ? face(i) : face).idle(t + i); if (mode === 'cheer') cheer(a, t, i); });
  const thuds = (n, t0 = 0.21, g = 0.6) => Array.from({ length: n }, (_, i) => ['thud', t0 + i * 0.42, g]);
  const FANS = ['fan1', 'fan2', 'toby', 'fan3', 'linda', 'gran', 'fan4'];

  // 1 HOOK: drone over the party street, everybody dancing in party hats under the colour wash
  shot({ line: 'In this town, everybody parties every night.', set: streetP, sfx: [['whoosh', 0]],
    cam: drone([-25, 3, 2], { h: 24, back: 36, drift: [6, -3, -10], fov: 52 }),
    act(lt, c) { ['toby', 'linda', 'fan1', 'fan2', 'fan3', 'fan4'].forEach((n, i) => dance(SP[n].reset().place(-37 + i * 4.6, 4 + (i % 2) * 1.2, (i - 2.5) * 0.15).setFace(i % 2 ? 'joy' : 'laugh'), c.t, i)); hide(SP.ball); } });
  // 2 the exception: narrator close-up, no hat, wink on "me"
  shot({ line: 'Except me.', set: streetP, sfx: [['pop', 'me', 0.6]],
    cam: frame(4, 8, { size: 'close', side: -10 }),
    act(lt, c) { SP.me.reset().place(4, 8, -0.15).setFace(lt < c.w('me') ? 'calm' : 'winkjoy').idle(c.t); ['toby', 'fan2', 'linda'].forEach((n, i) => dance(SP[n].reset().place(-2 + i * 6, 2, 0.2).setFace('joy'), c.t, i)); hide(SP.ball); } });
  // 3 catchphrase beat: low hero angle on the empty night court, dribbling
  shot({ line: 'HUSS! HUSS!', set: courtN, sfx: thuds(4),
    cam: frame(0, 2, { size: 'full', side: 12, low: 0.45 }),
    act(lt, c) { CN.me.reset().place(0, 2, -0.3).setFace('calm').idle(c.t); dribble(CN.me, CN.ball, lt); hide(...CNb); } });
  // 4-6 the list: pool party, pizza party, the mayor's goldfish birthday (planted for the ending)
  shot({ line: 'Pool parties.', set: pool, sfx: [['boing', 0.25, 0.5]],
    cam: { pos: [-2, 9, 24], look: [1, 2, -2], fov: 55, blur: 0.1 },
    act(lt, c) { const k = remap(lt, 0.05, 0.75); PO.fan1.reset().place(3, -8 + k * 7, 0, 1.15 + Math.sin(k * Math.PI) * 4 - k * 1.6).pose('cheer').setFace('joy'); ['toby', 'fan2', 'fan3', 'fan4'].forEach((n, i) => dance(PO[n].reset().place(-9 + i * 5.5, 8.5, 0).setFace('joy'), c.t, i)); hide(PO.ball); } });
  shot({ line: 'Pizza parties.', set: party,
    cam: { pos: [0, 11, 18], look: [0, 3, -1], fov: 50, blur: 0.15 },
    act(lt, c) { ['fan1', 'fan2', 'fan3', 'fan4'].forEach((n, i) => dance(PT[n].reset().place(-6.6 + i * 4.4, -5.5 - (i % 2) * 0.8, (i - 1.5) * 0.15).setFace(i % 2 ? 'joy' : 'laugh'), c.t, i)); hide(PT.ball); } });
  shot({ line: "A birthday party for the mayor's goldfish.", set: partyF, sfx: [['pop', 'goldfish', 0.6]],
    cam: { pos: [1.5, 8.5, 9.5], look: [0, 4.4, -2], fov: 52, blur: 0.4 },
    act(lt, c) { bowl.fish.position.x = Math.sin(c.t * 2.4) * 0.5; bowl.fish.rotation.y = Math.cos(c.t * 2.4) > 0 ? 0 : Math.PI;
      PF.mayor.reset().place(-3.5, -4.2, 0.3).setFace(lt < c.w('mayor\'s') ? 'calm' : 'joy'); cheer(PF.mayor, c.t);
      ['fan1', 'fan2', 'fan3'].forEach((n, i) => cheer(PF[n].reset().place(1 + i * 3.4, -4.8 - (i % 2), -0.2).setFace('joy'), c.t, i)); hide(PF.ball); } });
  // 7-9 the three named people, all partying
  shot({ line: 'My best friend Toby danced till sunrise.', set: pool,
    cam: frame(1, 9, { size: 'medium', side: 16 }),
    act(lt, c) { dance(PO.toby.reset().place(1, 9, -0.2).setFace(lt < c.w('danced') ? 'calm' : 'joy'), c.t); dance(PO.fan4.reset().place(-5, 6.8, 0.4).setFace('laugh'), c.t, 2); hide(PO.ball); } });
  shot({ line: 'Neighbor Linda ran the snack table.', set: party,
    cam: frame(-1, -5.2, { size: 'medium', side: -14, low: -0.35, dist: 1.4 }),
    act(lt, c) { PT.linda.reset().place(-1, -5.2, 0.1).pose({ aR: [92, 4], aL: [20, 10] }).setFace(lt < c.w('snack') ? 'calm' : 'joy').talk(c.t); PT.linda.hip.position.y += Math.abs(Math.sin(c.t * 9)) * 0.15; dance(PT.fan2.reset().place(5, -5.8, -0.3).setFace('joy'), c.t, 1); hide(PT.ball); } });
  shot({ line: 'Even my grandma did the worm.', set: party, sfx: [['boing', 'worm', 0.5]],
    cam: { pos: [-5, 4, 16], look: [0, 1.4, 7], fov: 50, blur: 0.3 },
    act(lt, c) { const g = PT.gran.reset(), wv = Math.sin(c.t * 10); g.root.rotation.order = 'YXZ'; g.place(3.5, 7, -Math.PI / 2, 0.6 + Math.max(0, wv) * 0.6); g.root.rotation.x = Math.PI / 2 + wv * 0.18; g.pose({ aL: [178, 0], aR: [178, 0], head: [-55, 0, 0] }).setFace(lt < c.w('worm') ? 'joy' : 'laugh'); g.hip.rotation.x += Math.sin(c.t * 10 + 1.4) * 0.25;
      ['fan1', 'fan3'].forEach((n, i) => cheer(PT[n].reset().place(-5 + i * 10, 5.5, i ? -0.5 : 0.5).setFace('laugh'), c.t, i)); hide(PT.ball); } });
  // 10 "But not me." narrator holds the ball on the night court
  shot({ line: 'But not me.', set: courtN,
    cam: frame(0, 2, { size: 'close', side: -14 }),
    act(lt, c) { CN.me.reset().place(0, 2, 0.1).setFace(lt < c.w('me') ? 'calm' : 'joy').idle(c.t); hold(CN.me, CN.ball); hide(...CNb); } });
  // 11-13 montage: same framing, the sky changes each cut (day -> sunset -> night)
  for (const [line, set, X] of [['Day by day, HUSS!', courtD, CD], ['Sunset, HUSS!', courtS, CS], ['Midnight, HUSS!', courtN, CN]]) {
    shot({ line, set, sfx: [['thud', 'huss', 0.6], ['thud', 0.63, 0.5]],
      cam: frame(0, 2, { size: 'full', side: -12, low: 0.45 }),
      act(lt, c) { X.me.reset().place(0, 2, 0.3).setFace(lt < c.w('huss') ? 'calm' : 'joy').idle(c.t); dribble(X.me, X.ball, lt); if (X === CN) hide(...CNb); if (X === CS) X.veil && 0; } });
  }
  // 14 the big event: drone over the sunset court, full bleachers
  shot({ line: 'Then came the biggest game of the year.', set: courtS, sfx: [['whoosh', 0, 0.5]],
    cam: drone([0, 0, -4], { h: 32, back: 50, drift: [-10, -4, -8] }),
    act(lt, c) { crowd(courtS, CS, FANS, 'joy', 'cheer', c.t); CS.derek.reset().place(6, 3, -0.8).run(c.t, 0.8); CS.me.reset().place(-6, 3, 0.6).setFace('calm'); dribble(CS.me, CS.ball, lt); courtS.scoreboard.set('GUEST', 0, 'HOME', 0); } });
  // 15 the town shows up in party hats
  shot({ line: 'The town showed up in party hats.', set: courtS,
    cam: { pos: [2, 5.2, -6], look: [0, 3.6, -21], fov: 58, blur: 0.15 },
    act(lt, c) { crowd(courtS, CS, FANS, 'joy', 'cheer', c.t); hide(CS.ball); } });
  // 16 everybody laughed (close on two fans pointing)
  shot({ line: 'Everybody laughed.', set: courtS, sfx: [['pop', 'laughed', 0.5]],
    cam: (() => { const p = courtS.bleachers.seat(0.31, 1); return { pos: [p[0] + 1.5, p[1] + 3.8, p[2] - 19 + 7], look: [p[0] - 0.4, p[1] + 3.8, p[2] - 19], fov: 58, blur: 0.8 }; })(),
    act(lt, c) { crowd(courtS, CS, FANS, i => (lt < c.w('laughed') ? 'joy' : 'laugh'), null, c.t); for (const n of ['fan2', 'toby']) CS[n].pose('point', 1); CS.toby.head.rotation.z += Math.sin(c.t * 14) * 0.08; CS.fan2.head.rotation.z += Math.sin(c.t * 14 + 1) * 0.08; hide(CS.ball); } });
  // 17 the rival mocks him
  shot({ line: "Who's the guy in the beanie?", set: courtS,
    cam: frame(4, 1, { size: 'close', side: 16 }),
    act(lt, c) { CS.derek.reset().place(4, 1, 0.25).pose('point').setFace(lt < c.w('beanie') ? 'say' : 'smug').talk(c.t); hide(CS.ball); } });
  // 18 "I got the ball." smirk
  shot({ line: 'I got the ball.', set: courtS, sfx: [['pop', 'ball', 0.5]],
    cam: frame(-3, 3, { size: 'close', side: -12 }),
    act(lt, c) { CS.me.reset().place(-3, 3, -0.2).setFace(lt < c.w('ball') ? 'calm' : 'smirk').idle(c.t); hold(CS.me, CS.ball); } });
  // 19 action: handheld follow while he drives, whip to the hoop, ball arcs in
  shot({ line: 'HUSS! Crossover, spin, HUSS!', set: courtS, sfx: [['thud', 0.21, 0.6], ['thud', 0.63, 0.6], ['whoosh', 'spin', 0.7], ['ding', 'huss', 0.6]],
    cam: (lt, s) => { const tw = s.d * 0.6; return lt < tw ? handheld(follow(l => [4 + l * 9, 0, 3], [-3, 3.4, 11]), 1.4)(lt, s) : whip([4 + tw * 9 + 4, 6, 13], [4 + tw * 9 + 2, 4, 3], [29, 9.9, 0], tw, { dur: 0.2 })(lt); },
    act(lt, c) { const tw = c.d * 0.6, x = 4 + Math.min(lt, tw) * 9; CS.me.reset().place(x, 3, Math.PI / 2 - 0.3).run(c.t).setFace('joy'); if (lt > c.w('spin') && lt < c.w('spin') + 0.3) CS.me.root.rotation.y += remap(lt, c.w('spin'), c.w('spin') + 0.3) * Math.PI * 2;
      if (lt < tw) dribble(CS.me, CS.ball, lt); else arc(CS.ball, lt, tw, Math.max(0.3, c.d - tw - 0.05), [x + 1, 6, 3], [29, 9.9, 0], 5);
      CS.derek.reset().place(x + 5 - Math.min(lt, tw) * 2, 1.5, -Math.PI / 2).pose('reach').setFace('gasp'); crowd(courtS, CS, FANS, 'joy', null, c.t); courtS.scoreboard.set('GUEST', 8, 'HOME', 8); } });
  // 20-22 scoreboard inserts, climbing
  shot({ line: 'Ten points.', set: courtS, sfx: [['tick', 'ten']],
    cam: { pos: [12, 13, -1], look: [29, 15, -4], fov: 40, blur: 0.2, push: 0.09 },
    act(lt, c) { courtS.scoreboard.set('GUEST', 8, 'HOME', 10, '2ND HALF'); hide(CS.ball); } });
  shot({ line: 'Thirty.', set: courtS, sfx: [['tick', 0]],
    cam: { pos: [16, 11, -9], look: [29, 15, -4], fov: 38, blur: 0.2, push: 0.1 },
    act(lt, c) { courtS.scoreboard.set('GUEST', 8, 'HOME', 30, '2ND HALF'); hide(CS.ball); } });
  shot({ line: 'Fifty points.', set: courtS, sfx: [['ding', 'fifty']],
    cam: { pos: [23.5, 14.6, -1.4], look: [29, 14.6, -1.5], fov: 32, blur: 0, push: 0.12 },
    act(lt, c) { courtS.scoreboard.set('GUEST', 8, 'HOME', 50, '2ND HALF'); hide(CS.ball); } });
  // 23 all by myself: cheer close-up
  shot({ line: 'All by myself.', set: courtS, sfx: [['sparkle', 'myself', 0.6]],
    cam: frame(2, 2, { size: 'close', side: 10, low: 0.3 }),
    act(lt, c) { cheer(CS.me.reset().place(2, 2, -0.1).setFace('joy'), c.t); hide(CS.ball); } });
  // 24 the music stopped: wide on the frozen bleachers
  shot({ line: 'The music stopped.', set: courtS, sfx: [['thud', 'stopped', 0.9]],
    cam: { pos: [-4, 6, -3], look: [-1, 3.4, -21], fov: 60, blur: 0.1, push: 0.05 },
    act(lt, c) { crowd(courtS, CS, FANS, lt < c.w('stopped') ? 'joy' : 'gasp', lt < c.w('stopped') ? 'cheer' : null, c.t); hide(CS.ball); } });
  // 25 silence: frozen shocked best friend, 0.6 s true silence
  shot({ line: 'The crowd went silent. //', set: courtS,
    cam: (() => { const p = courtS.bleachers.seat(0.22 + 2 * 0.09, 2); return frame(p[0], p[2] - 19, { size: 'close', y: p[1] - 2.0, side: 8, push: 0.1 }); })(),
    act(lt, c) { crowd(courtS, CS, FANS, 'gasp', null, 0); hide(CS.ball); } });
  // 26 the rival walks up
  shot({ line: "Derek asked, when'd you get so good?", set: courtS,
    cam: frame(3, 2, { size: 'close', side: 18 }),
    act(lt, c) { CS.derek.reset().place(3, 2 + Math.max(0, 0.6 - lt) * 3, -0.35).setFace(lt < c.w("when'd") ? 'gasp' : 'say').talk(c.t).pose('shrug', 0.7); hide(CS.ball); } });
  // 27 the line + wink, push in hard, then the camera dives into the bush (fly-through)
  shot({ line: 'I told him: while you partied, I practiced.', set: courtS, sfx: [['pop', 'practiced', 0.6], ['whoosh', -0.4]],
    cam: (lt, s) => { const b = frame(-4, 4, { size: 'close', side: -16, push: 0.12 }), k = E.in(remap(lt, s.d - 0.42, s.d)); return { ...b, pos: [lerp(b.pos[0], -9, k), lerp(b.pos[1], 1.6, k), lerp(b.pos[2], 10.5, k)], look: [lerp(-4, -9.5, k), lerp(4.2, 1.4, k), lerp(4, 9, k)], push: k > 0 ? 0 : 0.12 }; },
    act(lt, c) { CS.me.reset().place(-4, 4, 0.25).setFace(lt < c.w('practiced') ? 'calm' : 'winkjoy').idle(c.t).talk(c.t, lt < c.w('practiced') ? 1 : 0); CS.veil.at(lt - (c.d - 0.33), c.camera); hide(CS.ball); } });
  // ── reversal
  shot({ line: 'The next night, something was wrong.', set: streetN, sfx: [['whoosh', 0, 0.5]],
    cam: follow(l => [10 + l * 3.2, 0, 5.6], [2, 3.6, 9], { lookY: 3.6, blur: 0.4 }),
    act(lt, c) { SN.me.reset().place(10 + lt * 3.2, 5.6, Math.PI / 2 - 0.5).walk(c.t, 0.9).setFace(lt < c.w('wrong') ? 'calm' : 'uneasy'); hide(SN.ball); } });
  shot({ line: 'The pool, empty.', set: poolE,
    cam: { pos: [-3, 8, 21], look: [1, 1.5, -2], fov: 55, blur: 0.1, push: 0.05 }, act() { hide(); } });
  shot({ line: 'The chairs, empty.', set: partyE,
    cam: { pos: [-5, 7, 13], look: [0, 3, 0], fov: 55, blur: 0.15, push: 0.05 }, act() { } });
  shot({ line: 'Then, from every window,', set: streetN,
    cam: drone([12, 5, -9], { h: 30, back: 58, drift: [-6, -2, -8], fov: 55 }),
    act(lt, c) { SN.me.reset().place(12, 4.2, 0).setFace('uneasy').idle(c.t); hide(SN.ball); } });
  shot({ line: 'HUSS! ///', set: streetN, sfx: [['thud', 0.05, 0.7], ['thud', 0.42, 0.6], ['thud', 0.84, 0.5]],
    cam: frame(12, 4.2, { size: 'close', side: 8, push: 0.1 }),
    act(lt, c) { SN.me.reset().place(12, 4.2, 0).setFace('gasp'); hide(SN.ball); } });
  shot({ line: 'Toby was dribbling.', set: bedroom, sfx: thuds(3),
    cam: frame(1, 2, { size: 'medium', side: 14 }),
    act(lt, c) { BR.toby.reset().place(1, 2, -0.2).setFace('serious').idle(c.t); dribble(BR.toby, BR.ball, lt); } });
  shot({ line: 'Linda was doing karate.', set: dojo, sfx: [['whoosh', 'karate', 0.6]],
    cam: frame(0, 2, { size: 'full', side: -20 }),
    act(lt, c) { const k = Math.sin(c.t * 7); DJ.linda.reset().place(0, 2, -0.5, 0.4).pose({ aL: [90 + k * 20, -10], aR: [40 - k * 30, 20], lR: 60 + Math.max(0, k) * 40, lL: -10 }).setFace('angry'); hide(DJ.ball); } });
  shot({ line: 'Grandma was doing push-ups.', set: granRoom, sfx: [['thud', 'push-ups', 0.5]],
    cam: { pos: [-9, 4, 13], look: [-3, 1.8, 2], fov: 52, blur: 0.3 },
    act(lt, c) { const g = GR.gran.reset(), k = 0.5 + 0.5 * Math.sin(c.t * 6); g.root.rotation.order = 'YXZ'; g.place(0, 2, -Math.PI / 2, 1.3 + k * 0.8); g.root.rotation.x = Math.PI / 2 - 0.12; g.pose({ aL: [90 - k * 10, 0], aR: [90 - k * 10, 0], head: [-50, 0, 0] }).setFace('serious'); hide(GR.ball); } });
  shot({ line: 'Nobody parties anymore.', set: streetN, sfx: [['sad', 'anymore', 0.3]],
    cam: { pos: [7, 4.5, 24], look: [7, 4.5, 0], fov: 55, blur: 0, push: 0.04 }, act() { hide(SN.ball); } });
  shot({ line: 'The whole town is hustling.', set: courtN, sfx: thuds(4, 0.21, 0.4),
    cam: drone([0, 0, 0], { h: 30, back: 44, drift: [8, -4, -8] }),
    act(lt, c) { ['toby', 'linda', 'gran', 'fan1', 'fan3'].forEach((n, i) => { const a = CN[n].reset().place(-16 + i * 8, (i % 2) * 6 - 3, (i - 2) * 0.3).setFace('serious').idle(c.t); dribble(a, CNb[i], lt + i * 0.1); }); hide(CN.ball); } });
  shot({ line: 'Which is great...', set: streetN,
    cam: frame(2, 5, { size: 'close', side: -12 }),
    act(lt, c) { SN.me.reset().place(2, 5, 0.1).setFace('joy').idle(c.t).pose('open', 0.6); hide(SN.ball); } });
  shot({ line: "except now I'm the only one free on Fridays.", set: streetN, sfx: [['sad', 'fridays', 0.6]],
    cam: frame(13, 3.2, { size: 'full', side: 10, y: -0.3, low: 0.2, push: 0.06 }),
    act(lt, c) { SN.me.reset().place(13, 3.2, 0).sit(1.4).pose('slump', 0.6).setFace(lt < c.w('only') ? 'calm' : 'sad').idle(c.t, 0.5); hide(SN.ball); } });
  // ── button: he throws a party; the only guest is the mayor's goldfish
  shot({ line: 'So I threw a party.', set: partyF, sfx: [['pop', 'party', 0.6]],
    cam: frame(-4.5, 5.5, { size: 'medium', side: 18 }),
    act(lt, c) { const a = PF.me.reset().place(-4.5, 5.5, 0.3).setFace(lt < c.w('party') ? 'calm' : 'joy'); if (lt < c.w('party')) a.idle(c.t); else dance(a, c.t); bowl.fish.position.x = Math.sin(c.t * 2.4) * 0.5; hide(PF.ball); } });
  shot({ line: "The only guest was the mayor's goldfish.", set: partyF,
    cam: { pos: [0.8, 4.9, 6.5], look: [0, 4.4, 0], fov: 50, blur: 0.3, push: 0.1 },
    act(lt, c) { bowl.fish.position.x = Math.sin(c.t * 2.4) * 0.5; bowl.fish.rotation.y = Math.cos(c.t * 2.4) > 0 ? 0 : Math.PI; bowl.fish.position.y = 1.5; hide(PF.ball); } });
  shot({ line: "He's actually a great dancer.", set: partyF, sfx: [['boing', 'dancer', 0.5]],
    cam: { pos: [-1.5, 6.5, 18], look: [-2.6, 4, 3], fov: 48, blur: 0.3 },
    act(lt, c) { const f = bowl.fish; f.position.x = Math.sin(c.t * 9) * 0.35; f.position.y = 1.5 + Math.abs(Math.sin(c.t * 9)) * 0.3; f.rotation.z = Math.sin(c.t * 9) * 0.5; f.rotation.y = 0;
      dance(PF.me.reset().place(-5, 5.8, 0.5).setFace('joy'), c.t); hide(PF.ball); } });
  shot({ line: 'HUSS!', set: partyF, sfx: [['thud', 0.21, 0.6], ['thud', 0.63, 0.5]],
    cam: { pos: [-0.5, 8, 19], look: [-2.4, 3.6, 2.5], fov: 55, blur: 0.15, push: 0.08 },
    act(lt, c) { const f = bowl.fish; f.position.x = Math.sin(c.t * 9) * 0.35; f.position.y = 1.5 + Math.abs(Math.sin(c.t * 9)) * 0.3; f.rotation.z = Math.sin(c.t * 9) * 0.5; f.rotation.y = 0;
      PF.me.reset().place(-4, 5.5, 0.3).setFace('joy').idle(c.t); dribble(PF.me, PF.ball, lt); } });
});
