// story.js: "In this town, every hundred years, a giant monster rises from beneath the ground."
//
// THE SCRIPT (approved; joined shot lines must equal it word for word):
//   In this town, every hundred years, a giant monster rises from beneath the ground. But what nobody knows is that
//   the monster isn't hunting people randomly. It's coming to collect a debt. For generations, everyone has followed
//   one rule. When the sirens go off, you have ten minutes to get underground. If you're caught outside, you're never
//   seen again. This year was the hundredth anniversary. At exactly midnight, the sirens started blaring. I ran into
//   my basement and turned on the news. The mayor appeared on every channel. He said, "Whatever happens tonight, do
//   not leave your homes." But then the broadcast suddenly changed. A security camera showed the monster walking
//   straight toward city hall. I watched as it smashed through the entrance and disappeared underground. Then my
//   phone rang. It was the mayor, my grandpa. He was crying. He told me that a hundred years ago, the town made a deal
//   with the monster. Every century, the mayor must sacrifice ten people to keep it asleep. But this year, he refused
//   to sacrifice anyone. That's why the monster had returned. Suddenly, another emergency broadcast appeared. It showed
//   my grandpa standing in front of the camera. He looked directly into it and said, "There's something I never told
//   you. The monster isn't coming to destroy our town." He paused. "It's coming to take back the ten people we stole
//   from it." Then the camera turned to the room behind him. And standing there were ten people who had disappeared
//   exactly a hundred years ago. They hadn't aged a single day.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, handheld, follow, whip, drone } from './town.js';
import { makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, at, grp, sign } from './util.js';
import { makeMonster, field, cityHall, office, lair, basement, sirenPole, cellarDoors, phone, makeHud, SEPIA, CCTV } from './monster.js';

start(() => {
  // ── sets
  const street = TOWN.street({ time: 'night', lit: 0.5 });
  const streetS = TOWN.street({ time: 'sunset' });
  const fieldN = field();
  const fieldOld = field({ sky: 'sunset' });
  const hall = cityHall();
  const room = office();
  const cave = lair();
  const cave1926 = lair({ light: 'sepia' });
  const base = basement();
  // street dressing: siren pole, the rule sign, a storm cellar in front of house 0
  const siren = sirenPole(); street.group.add(at(siren, -9, 0, 5.2));
  const rule = sign(['WHEN THE SIRENS SOUND', 'YOU HAVE 10 MINUTES', 'TO GET UNDERGROUND'], 7, 4.2, { bg: '#f2d33c', fg: '#1b1b1b', border: '#1b1b1b' });
  street.group.add(at(grp(at(box(0.3, 6, 0.3, '#3a3d46'), -2.4, 3, -0.2), at(box(0.3, 6, 0.3, '#3a3d46'), 2.4, 3, -0.2), at(rule, 0, 6.6, 0)), -2, 0, 3.4, 0.25));
  const cellar = cellarDoors(); street.group.add(at(cellar, 4, 0, -1.4));
  const lostCap = grp(at(box(1.2, 0.35, 1.2, '#d23a3a', 0.15), 0, 0.18, 0), at(box(0.7, 0.08, 0.6, '#d23a3a'), 0, 0.06, 0.8)); street.group.add(at(lostCap, 16, 0, 4.4, 0.6));
  const phoneBig = phone(); base.group.add(phoneBig);

  // ── cast: one copy per set, identical options
  const OLD = [ // the ten from 1926
    { seed: 21, skin: 'fair', hair: 'short', hairColor: '#3a2a1a', top: 'suit', topColor: '#5a4a3a', bottom: 'slacks', bottomColor: '#3a3028', cap: '#3a3028' },
    { seed: 22, skin: 'light', hair: 'bob', hairColor: '#2a1a12', top: 'dress', topColor: '#7a5a6a', bottom: 'skirt', bottomColor: '#7a5a6a' },
    { seed: 23, skin: 'tan', hair: 'short', hairColor: '#1a1210', top: 'shirt', topColor: '#d8d0c0', bottom: 'slacks', bottomColor: '#4a4038' },
    { seed: 24, skin: 'fair', hair: 'ponytail', hairColor: '#8a5a2a', top: 'dress', topColor: '#4a6a7a', bottom: 'skirt', bottomColor: '#4a6a7a' },
    { seed: 25, skin: 'brown', hair: 'short', hairColor: '#1a1210', top: 'vest', topColor: '#6a5a4a', bottom: 'slacks', bottomColor: '#2a2a2a', cap: '#4a4a4a' },
    { seed: 26, skin: 'light', hair: 'buns', hairColor: '#3a2a1a', top: 'cardigan', topColor: '#8a7a5a', bottom: 'skirt', bottomColor: '#5a4a3a' },
    { seed: 27, skin: 'light', hair: 'short', hairColor: '#4a3a2a', top: 'suit', topColor: '#4a3a44', bottom: 'slacks', bottomColor: '#3a3a44', cap: '#2a2a30' },
    { seed: 28, skin: 'deep', hair: 'short', hairColor: '#111111', top: 'shirt', topColor: '#a89878', bottom: 'slacks', bottomColor: '#5a4a3a', cap: '#5a4a3a' },
    { seed: 29, skin: 'light', hair: 'long', hairColor: '#5a3a1a', top: 'dress', topColor: '#6a4a4a', bottom: 'skirt', bottomColor: '#6a4a4a' },
    { seed: 30, skin: 'tan', hair: 'messy', hairColor: '#2a1a12', top: 'sweater', topColor: '#5a6a4a', bottom: 'shorts', bottomColor: '#4a3a2a' },
  ];
  const cast = (set) => {
    const c = {
      me: makeNarrator({ color: '#3553b8', print: 'curfew' }),
      gramp: makeAvatar({ seed: 7, skin: 'fair', hair: 'short', hairColor: '#e4e4e8', top: 'suit', topColor: '#22283c', sleeves: 'long', bottom: 'slacks', bottomColor: '#22283c', shoe: '#1a1a1a', glasses: true }),
      mom: makeAvatar({ seed: 8, skin: 'light', hair: 'long', hairColor: '#6a3a1a', top: 'cardigan', topColor: '#c45a7a', bottom: 'jeans', bottomColor: '#3a4f7a' }),
      n1: makeAvatar({ seed: 12, skin: 'tan', hair: 'spiky', hairColor: '#2a1a12', top: 'hoodie', topColor: '#d23a3a', bottom: 'jeans', bottomColor: '#3a4f7a', cap: '#d23a3a' }),
      n2: makeAvatar({ seed: 13, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' }),
      n3: makeAvatar({ seed: 14, skin: 'light', hair: 'curly', hairColor: '#8a4a1a', top: 'zip', topColor: '#2e9e59', bottom: 'joggers', bottomColor: '#2a2a30' }),
      oldMayor: makeAvatar({ seed: 31, skin: 'fair', hair: 'short', hairColor: '#7a7a7a', top: 'suit', topColor: '#1a1a1a', sleeves: 'long', bottom: 'slacks', bottomColor: '#1a1a1a', cap: '#111111', shoe: '#111' }),
      ten: OLD.map(o => makeAvatar({ ...o, sleeves: 'long' })),
      monster: makeMonster(),
    };
    for (const a of [c.me, c.gramp, c.mom, c.n1, c.n2, c.n3, c.oldMayor, ...c.ten]) set.group.add(a.root);
    set.group.add(c.monster.root);
    const ph = phone(); c.gramp.head.add(ph); ph.position.set(-0.78, 0.75, 0.15); ph.rotation.set(0, -Math.PI / 2, 0.2); ph.scale.setScalar(0.6); c.gPhone = ph;
    const ph2 = phone(); c.me.head.add(ph2); ph2.position.set(-0.8, 0.75, 0.15); ph2.rotation.set(0, -Math.PI / 2, 0.2); ph2.scale.setScalar(0.6); c.mPhone = ph2;
    return { ...c, hud: makeHud(set.group), puff: makePuff(set.group), puffs: OLD.map((_, i) => makePuff(set.group, 40 + i)) };
  };
  const ST = cast(street), SS = cast(streetS), FN = cast(fieldN), FO = cast(fieldOld), CH = cast(hall), RM = cast(room), CV = cast(cave), CO = cast(cave1926), BA = cast(base);
  for (const X of [ST, SS, FN, FO, CH, RM, CV, CO, BA]) { X.gPhone.visible = false; X.mPhone.visible = false; }
  const onPhone = (X, who, on = true) => { const p = who === X.me ? X.mPhone : X.gPhone; p.visible = on; if (on) who.pose({ aR: [162, 40] }); };
  const sitMe = (X, t, face) => { X.me.reset().place(0, 3.1, 0).sit(1.3).setFace(face).idle(t, 0.5); };
  const mayorAt = (X, t, face, talk = true) => { X.gramp.reset().place(0, 0, 0).setFace(face).idle(t); if (talk) X.gramp.talk(t); return X.gramp; };
  const tenRoom = (X, t, faces = ['blank']) => X.ten.forEach((a, i) => { const row = i < 5 ? 0 : 1, k = i % 5; a.reset().place(-16.5 + k * 2.5 + row * 1.2, -3.6 + row * 2.6, 0.35).setFace(faces[i % faces.length]).idle(t, 0.15); });
  const oldPhoto = (X, t) => X.ten.forEach((a, i) => { const row = i < 5 ? 0 : 1, k = i % 5; a.reset().place(-5 + k * 2.5 + row * 1.25, 12 + row * 2.4, 0).setFace('neutral').idle(t, 0.2); });
  const hud = (X, kind) => (lt, c) => X.hud.at(c.camera, kind, c.t);
  const roomCam = (p, l, o = {}) => ({ pos: p, look: l, fov: o.fov || 50, blur: o.blur ?? 0, push: o.push ?? 0.07, roll: o.roll });

  // ════════ ACT 1: the legend and the rule
  shot({ line: 'In this town,', set: street, sfx: [['rumble', 0, 0.5]], cam: drone([0, 4, -6], { h: 32, back: 46, drift: [8, -2, -8], fov: 52 }) });
  shot({ line: 'every hundred years,', set: fieldN, cam: handheld({ pos: [10, 4, 34], look: [0, 1, 0], fov: 50, blur: 0.1, push: 0.08 }, 0.8),
    act(lt, c) { fieldN.quake(0.15 + lt * 0.12, c.t); } });
  shot({ line: 'a giant monster', set: fieldN, sfx: [['rumble', 0, 1]], cam: handheld({ pos: [8, 3, 36], look: [0, 16, 0], fov: 55, blur: 0.1, push: 0.06 }, 1.2),
    act(lt, c) { fieldN.quake(0.6 + lt * 0.2, c.t); FN.monster.reset().place(0, 2, 0, lerp(-24, -14, E.out(remap(lt, 0, c.d)))).roar(0.3).breathe(c.t); } });
  shot({ line: 'rises from beneath the ground.', set: fieldN, cam: handheld({ pos: [0, 12, 72], look: [0, 15, 0], fov: 55, blur: 0, push: 0.04 }, 0.7),
    act(lt, c) { fieldN.quake(1, c.t); FN.monster.reset().place(0, 2, 0, lerp(-14, 0, E.out(remap(lt, 0, c.d * 0.85)))).roar(remap(lt, c.d * 0.5, c.d)).breathe(c.t); } });
  shot({ line: 'But what nobody knows', set: street, cam: frame(6, 4, { size: 'close', side: -12 }),
    act(lt, c) { ST.me.reset().place(6, 4, -0.15).setFace(lt < c.w('knows') ? 'calm' : 'uneasy').talk(c.t); } });
  shot({ line: 'is that the monster', set: fieldN, cam: { pos: [7, 27, 26], look: [0, 27, 2], fov: 40, blur: 0.2, push: 0.1 },
    act(lt, c) { fieldN.quake(1, c.t); FN.monster.reset().place(0, 2, 0.15).breathe(c.t).look(0.1, 0.1); } });
  shot({ line: "isn't hunting people randomly.", set: fieldN, cam: { pos: [-26, 16, 64], look: [0, 21, 2], fov: 42, blur: 0, push: 0.06 },
    act(lt, c) { fieldN.quake(1, c.t); FN.monster.reset().place(0, 2, 0.5).breathe(c.t).look(Math.sin(lt * 1.4) * 0.5, 0.15); } });
  shot({ line: "It's coming to collect a debt. //", set: cave, sfx: [['thud', 'debt', 0.8]], cam: { pos: [12.5, 5.6, 13], look: [16, 5.4, 6], fov: 42, blur: 0.4, push: 0.1 } });
  shot({ line: 'For generations,', set: streetS, cam: frame(0, 4, { size: 'full', side: 10 }),
    act(lt, c) { SS.gramp.reset().place(-3, 4, 0.2).setFace('smile').idle(c.t); SS.mom.reset().place(0, 4.4, 0).setFace('smile').idle(c.t); SS.me.reset().place(3, 4, -0.2).setFace('calm').idle(c.t); } });
  shot({ line: 'everyone has followed one rule.', set: street, cam: { pos: [-3.2, 6.2, 12.5], look: [-1.6, 6.4, 3.6], fov: 42, blur: 0.2, push: 0.1 } });
  shot({ line: 'When the sirens go off,', set: street, sfx: [['siren', 0, 0.8]], cam: handheld({ pos: [-4, 2.5, 14], look: [-9, 13.5, 5.2], fov: 52, blur: 0.15, push: 0.08 }, 0.8),
    act(lt, c) { siren.on(c.t); } });
  shot({ line: 'you have ten minutes', set: street, cam: handheld(follow(lt => [10 + lt * 7, 0, 4], [-11, 5, 14], { lookY: 3 }), 1.3),
    act(lt, c) { siren.on(c.t); [ST.n1, ST.n2, ST.n3].forEach((a, i) => a.reset().place(10 + lt * 7 - i * 2.6, 3.6 + (i % 2) * 1.4, Math.PI / 2).run(c.t + i * 0.3).setFace('worried')); } });
  shot({ line: 'to get underground.', set: street, cam: { pos: [-5, 8, 16], look: [4, 2, -1.4], fov: 50, blur: 0.1, push: 0.08 },
    act(lt, c) { siren.on(c.t); cellar.open(1); [ST.n2, ST.n3].forEach((a, i) => { const k = remap(lt, i * 0.35, i * 0.35 + 0.8); a.reset().place(4 + (i - 0.5) * 0.8, lerp(4, -1.4, k), Math.PI, -k * 6).run(c.t).setFace('worried'); }); } });
  shot({ line: "If you're caught outside,", set: street, sfx: [['siren', 0, 0.5]], cam: frame(16, 4.5, { size: 'close', side: 15 }),
    act(lt, c) { siren.on(c.t); lostCap.visible = false; ST.n1.reset().place(16, 4.5, 0.2).pose('shy').setFace(lt < c.w('outside') ? 'worried' : 'shock').lookAt(10, 20).idle(c.t, 0.4); } });
  shot({ line: "you're never seen again.", set: street, sfx: [['fall', 0, 0.5]], cam: { pos: [19, 3, 11], look: [16, 1, 4.4], fov: 48, blur: 0.25, push: 0.06 },
    act(lt, c) { lostCap.visible = true; ST.puff.at(lt, [16, 0, 4.5]); } });
  shot({ line: 'This year was the hundredth anniversary.', set: hall, cam: { pos: [4, 9, 6], look: [0, 11.2, -0.4], fov: 46, blur: 0.2, push: 0.09 } });
  shot({ line: 'At exactly midnight,', set: hall, sfx: [['tick', 0], ['tick', 0.5], ['tick', 1.0]], cam: { pos: [3, 21, 6], look: [0, 23.2, -10], fov: 34, blur: 0.15, push: 0.1 } });
  shot({ line: 'the sirens started blaring.', set: street, sfx: [['siren', 0, 1]], cam: handheld(drone([-9, 6, 4], { h: 22, back: 30, drift: [6, -2, -6], fov: 55 }), 1.0),
    act(lt, c) { siren.on(c.t); } });

  // ════════ ACT 2: the night of the hundredth year
  shot({ line: 'I ran into my basement', set: street, cam: handheld(follow(lt => [10 - lt * 4, 0, 3.4 - lt * 1.4], [5, 3.6, 10], { lookY: 3 }), 1.2),
    act(lt, c) { siren.on(c.t); cellar.open(1); ST.me.reset().place(10 - lt * 4, 3.4 - lt * 1.4, -1.9).run(c.t).setFace('worried'); } });
  shot({ line: 'and turned on the news.', set: base, sfx: [['pop', 'news', 0.5]], cam: { pos: [3, 6.4, -2.5], look: [0, 4, 13.6], fov: 52, blur: 0.2, push: 0.06 },
    act(lt, c) { base.tv(lt < c.w('news') ? 'off' : 'news', c.t); sitMe(BA, c.t, 'worried'); BA.me.pose({ aR: [70, 0] }); } });
  shot({ line: 'The mayor appeared', set: base, cam: { pos: [0.6, 4.3, 7.2], look: [0, 4.1, 13.6], fov: 44, blur: 0.1, push: 0.08 },
    act(lt, c) { base.tv('news', c.t); } });
  shot({ line: 'on every channel.', set: room, cam: roomCam(frame(0, 0, { size: 'medium', side: 6 }).pos, [0, 3.9, 0]),
    act(lt, c) { mayorAt(RM, c.t, 'serious'); hud(RM, 'news')(lt, c); } });
  shot({ line: 'He said,', set: room, cam: roomCam(frame(0, 0, { size: 'close', side: -10 }).pos, [0, 4.2, 0]),
    act(lt, c) { mayorAt(RM, c.t, 'say'); hud(RM, 'news')(lt, c); } });
  shot({ line: '"Whatever happens tonight,', set: room, cam: roomCam(frame(0, 0, { size: 'close', side: 12 }).pos, [0, 4.2, 0], { push: 0.1 }),
    act(lt, c) { mayorAt(RM, c.t, 'serious').pose('open', 0.6); hud(RM, 'news')(lt, c); } });
  shot({ line: 'do not leave your homes."', set: room, cam: roomCam(frame(0, 0, { size: 'face', side: -6 }).pos, [0, 4.5, 0], { push: 0.1 }),
    act(lt, c) { mayorAt(RM, c.t, 'mad').pose('point', 0.8); hud(RM, 'news')(lt, c); } });
  shot({ line: 'But then the broadcast', set: base, cam: frame(0, 3.1, { size: 'close', side: 10, y: -0.25 }),
    act(lt, c) { base.tv('news', c.t); sitMe(BA, c.t, 'calm'); } });
  shot({ line: 'suddenly changed.', set: base, sfx: [['static', 0, 1]], cam: handheld({ pos: [-0.4, 4.1, 9.6], look: [0, 4.1, 13.6], fov: 44, blur: 0.1, push: 0.12 }, 0.6),
    act(lt, c) { base.tv('static', c.t); } });
  shot({ line: 'A security camera showed', set: hall, tint: CCTV.tint, sat: CCTV.sat, light: 'cctv', cam: { pos: [34, 24, 40], look: [4, 4, -2], fov: 62, blur: 0, push: 0 },
    act(lt, c) { hud(CH, 'cctv')(lt, c); } });
  shot({ line: 'the monster walking straight toward city hall.', set: hall, tint: CCTV.tint, sat: CCTV.sat, light: 'cctv', sfx: [['thud', 0.2, 0.6], ['thud', 1.1, 0.6], ['thud', 2.0, 0.6]], cam: { pos: [34, 24, 40], look: [4, 4, -2], fov: 62, blur: 0, push: 0 },
    act(lt, c) { const k = remap(lt, 0, c.d + 0.3); CH.monster.reset().size(0.75).place(lerp(46, 8, k), lerp(24, 6, k), -1.98).walk(c.t, 0.9); hud(CH, 'cctv')(lt, c); } });
  shot({ line: 'I watched', set: base, cam: frame(0, 3.1, { size: 'close', side: -12, y: -0.25, push: 0.12 }),
    act(lt, c) { base.tv('static', c.t + 0.13); sitMe(BA, c.t, 'shock'); } });
  shot({ line: 'as it smashed through the entrance', set: hall, sfx: [['crash', 'smashed', 1.2]], flash: lt => 0, cam: (lt, s) => handheld({ pos: [-28, 11, 40], look: [0, 9, -3], fov: 50, blur: 0.1, push: 0.05 }, lt > 0.5 ? 2.2 : 0.8)(lt, s),
    act(lt, c) { const hit = c.w('smashed') + 0.15, pk = remap(lt, hit - 0.3, hit); CH.monster.reset().size(0.75).place(1, 3.5, Math.PI).breathe(c.t); CH.monster.armR.rotation.x = -1.6 * E.inOut(pk); CH.monster.armL.rotation.x = -0.6 * pk; hall.breach(lt - hit, c.t); CH.puff.at(lt - hit, [0, 2, -4]); c.shot.flash = l => 0.55 * Math.max(0, 1 - Math.abs(l - hit) / 0.12); } });
  shot({ line: 'and disappeared underground.', set: hall, sfx: [['rumble', 0, 1], ['fall', 'underground', 0.7]], cam: handheld({ pos: [0, 10, 44], look: [0, 8, -4], fov: 55, blur: 0, push: 0.04 }, 1.2),
    act(lt, c) { hall.breach(5, c.t); hall.hole(1, c.t); CH.monster.reset().size(0.75).place(2, 3.5, Math.PI, lerp(0, -28, E.inOut(remap(lt, 0.2, c.d + 0.2)))).roar(0.4).breathe(c.t); } });
  shot({ line: 'Then my phone rang.', set: base, sfx: [['ring', 'rang', 0.8]], cam: { pos: [1.2, 3.9, 7.4], look: [0.9, 3.0, 4.9], fov: 40, blur: 0.5, push: 0.08 },
    act(lt, c) { base.tv('static', c.t); sitMe(BA, c.t, 'shock'); const r = lt > c.w('rang') ? Math.sin(c.t * 60) * 0.04 : 0; phoneBig.position.set(0.9 + r, 3.0, 4.9); phoneBig.rotation.set(-0.35, 0, r * 2); BA.me.pose({ aR: [62, 6] }); } });
  shot({ line: 'It was the mayor,', set: base, cam: { pos: [0.95, 3.3, 6.5], look: [0.9, 3.0, 4.9], fov: 36, blur: 0.6, push: 0.1 },
    act(lt, c) { base.tv('static', c.t); sitMe(BA, c.t, 'worried'); const r = Math.sin(c.t * 60) * 0.03; phoneBig.position.set(0.9 + r, 3.0, 4.9); phoneBig.rotation.set(-0.35, 0, r * 2); } });
  shot({ line: 'my grandpa.', set: room, cam: roomCam(frame(3, 4, { size: 'close', side: 14 }).pos, [3, 4.2, 4], { blur: 0.5 }),
    act(lt, c) { RM.gramp.reset().place(3, 4, -0.3).setFace('sad').idle(c.t); onPhone(RM, RM.gramp); } });
  shot({ line: 'He was crying.', set: room, sfx: [['sad', 'crying', 0.6]], cam: roomCam(frame(3, 4, { size: 'face', side: -8 }).pos, [3, 4.5, 4], { blur: 0.6, push: 0.1 }),
    act(lt, c) { RM.gramp.reset().place(3, 4, -0.2).setFace('cry').idle(c.t); onPhone(RM, RM.gramp); } });
  shot({ line: 'He told me that', set: base, cam: frame(0, 3.1, { size: 'close', side: 16, y: -0.25 }),
    act(lt, c) { base.tv('static', c.t); sitMe(BA, c.t, 'worried'); onPhone(BA, BA.me); } });
  // flashback, 1926: sepia + old film
  shot({ line: 'a hundred years ago,', set: fieldOld, ...SEPIA, sfx: [['whoosh', 0, 0.6]], cam: drone([0, 6, 0], { h: 34, back: 60, drift: [8, -2, -8], fov: 52 }),
    act(lt, c) { fieldOld.quake(1, c.t); FO.monster.reset().place(0, 0, 0).breathe(c.t); hud(FO, 'film')(lt, c); } });
  shot({ line: 'the town made a deal with the monster.', set: fieldOld, ...SEPIA, cam: { pos: [26, 9, 30], look: [0, 10, 4], fov: 52, blur: 0.1, push: 0.06 },
    act(lt, c) { fieldOld.quake(1, c.t); FO.monster.reset().place(0, 0, 0).breathe(c.t).look(0, 0.35); FO.monster.armR.rotation.x = -0.9; FO.oldMayor.reset().place(2, 15, Math.PI).pose('reach', 0.7).setFace('worried').idle(c.t);
      [FO.n1, FO.n2, FO.n3, FO.mom].forEach((a, i) => a.reset().place(-4 + i * 3, 21 + (i % 2) * 2, Math.PI).setFace('worried').idle(c.t)); hud(FO, 'film')(lt, c); } });
  shot({ line: 'Every century,', set: cave1926, ...SEPIA, cam: drone([0, 6, -6], { h: 26, back: 44, drift: [-6, -2, -6], fov: 55 }),
    act(lt, c) { CO.monster.reset().place(0, -16, 0, -5).breathe(c.t, 0.5).eyesOpen(0.1).look(0, 0.4); hud(CO, 'film')(lt, c); } });
  shot({ line: 'the mayor must sacrifice ten people', set: cave1926, ...SEPIA, cam: { pos: [7, 5, 20], look: [0, 6, -6], fov: 52, blur: 0.15, push: 0.06 },
    act(lt, c) { CO.monster.reset().place(0, -16, 0, -5).breathe(c.t, 0.5).eyesOpen(0.1).look(0, 0.4); CO.oldMayor.reset().place(11, 8, -0.6).pose('point').setFace('serious').idle(c.t);
      CO.ten.forEach((a, i) => a.reset().place(-11 + i * 2.45, 4 - lt * 1.2, Math.PI).walk(c.t + i * 0.2, 0.5).setFace('worried')); [0, 3, 7].forEach(i => CO.ten[i].setFace('neutral')); hud(CO, 'film')(lt, c); } });
  shot({ line: 'to keep it asleep.', set: cave1926, ...SEPIA, cam: { pos: [8, 20, 6], look: [0, 19, -12], fov: 45, blur: 0.2, push: 0.08 },
    act(lt, c) { CO.monster.reset().place(0, -16, 0, -5).breathe(c.t, 0.7).eyesOpen(0.08).look(0, 0.4); hud(CO, 'film')(lt, c); } });
  shot({ line: 'But this year,', set: room, cam: roomCam(frame(3, 4, { size: 'close', side: -16 }).pos, [3, 4.2, 4], { blur: 0.5 }),
    act(lt, c) { RM.gramp.reset().place(3, 4, 0.2).setFace('serious').idle(c.t); onPhone(RM, RM.gramp); } });
  shot({ line: 'he refused to sacrifice anyone.', set: room, cam: roomCam(frame(3, 4, { size: 'medium', side: 12 }).pos, [3, 3.9, 4], { blur: 0.4 }),
    act(lt, c) { RM.gramp.reset().place(3, 4, 0).setFace(lt < c.w('refused') ? 'serious' : 'mad').idle(c.t).talk(c.t); RM.gramp.head.rotation.y += Math.sin(c.t * 9) * 0.25 * remap(lt, c.w('refused'), c.w('refused') + 0.2); onPhone(RM, RM.gramp); } });
  shot({ line: "That's why the monster had returned.", set: fieldN, sfx: [['rumble', 0, 0.8]], cam: { pos: [6, 1.5, 30], look: [0, 22, 0], fov: 58, blur: 0, push: 0.05 },
    act(lt, c) { fieldN.quake(1, c.t); FN.monster.reset().place(0, 2, 0).roar(E.out(remap(lt, 0.3, 1.0))).breathe(c.t); } });

  // ════════ ACT 3: the second broadcast
  shot({ line: 'Suddenly,', set: base, sfx: [['beep', 0, 0.7]], cam: frame(0, 3.1, { size: 'close', side: -10, y: -0.25, push: 0.12 }),
    act(lt, c) { base.tv('emergency', c.t); sitMe(BA, c.t, 'shock'); } });
  shot({ line: 'another emergency broadcast appeared.', set: base, cam: { pos: [0.4, 4.3, 7.2], look: [0, 4.1, 13.6], fov: 44, blur: 0.1, push: 0.08 },
    act(lt, c) { base.tv('emergency', c.t); } });
  shot({ line: 'It showed my grandpa', set: room, cam: roomCam(frame(0, 0, { size: 'medium', side: -6 }).pos, [0, 3.9, 0]),
    act(lt, c) { mayorAt(RM, c.t, 'sad', false); hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'standing in front of the camera.', set: room, cam: { pos: [9, 6.5, 15], look: [0, 4, 3], fov: 50, blur: 0.15, push: 0.06 },
    act(lt, c) { mayorAt(RM, c.t, 'sad', false); } });
  shot({ line: 'He looked directly into it and said,', set: room, cam: roomCam(frame(0, 0, { size: 'close', side: 4 }).pos, [0, 4.3, 0], { push: 0.12 }),
    act(lt, c) { mayorAt(RM, c.t, lt < c.w('said') ? 'serious' : 'say', lt > c.w('said')); hud(RM, 'emergency')(lt, c); } });
  shot({ line: '"There\'s something I never told you.', set: room, cam: roomCam(frame(0, 0, { size: 'face', side: -8 }).pos, [0, 4.5, 0], { push: 0.08 }),
    act(lt, c) { mayorAt(RM, c.t, 'sad'); hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'The monster', set: cave, sfx: [['rumble', 0, 0.6]], cam: { pos: [7, 19, 8], look: [0, 18.5, -12], fov: 45, blur: 0.2, push: 0.1 },
    act(lt, c) { CV.monster.reset().place(0, -16, 0, -5).breathe(c.t).eyesOpen(E.out(remap(lt, 0.05, 0.3))).look(0, 0.2); } });
  shot({ line: "isn't coming to destroy our town.\"", set: room, cam: roomCam(frame(0, 0, { size: 'close', side: 10 }).pos, [0, 4.2, 0], { push: 0.08 }),
    act(lt, c) { mayorAt(RM, c.t, 'worried'); RM.gramp.head.rotation.y += Math.sin(c.t * 7) * 0.18; hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'He paused. ///', set: room, cam: roomCam(frame(0, 0, { size: 'face', side: 2 }).pos, [0, 4.6, 0], { push: 0.05 }),
    act(lt, c) { mayorAt(RM, c.t, 'sad', false).idle(c.t, 0.3); hud(RM, 'emergency')(lt, c); } });
  shot({ line: '"It\'s coming to take back', set: room, cam: roomCam(frame(0, 0, { size: 'face', side: -12 }).pos, [0, 4.5, 0], { push: 0.1 }),
    act(lt, c) { mayorAt(RM, c.t, 'worried'); hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'the ten people we stole from it."', set: room, sfx: [['sad', 'stole', 0.5]], cam: roomCam(frame(0, 0, { size: 'face', side: 8 }).pos, [0, 4.5, 0], { push: 0.12 }),
    act(lt, c) { mayorAt(RM, c.t, lt < c.w('stole') ? 'worried' : 'cry'); hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'Then the camera turned', set: room, sfx: [['whoosh', 0.05, 0.9]], cam: (lt) => ({ ...whip([0.5, 5.6, 9], [0, 4.4, 0], [-11, 4.4, -2], 0.1, { dur: 0.45, roll: 3, fov: 50 })(lt), blur: 0 }),
    act(lt, c) { mayorAt(RM, c.t, 'cry', false); room.cold.intensity = 60; tenRoom(RM, c.t); hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'to the room behind him.', set: room, cam: roomCam([-8.5, 5.4, 10], [-11.5, 4.2, -2], { push: 0.07 }),
    act(lt, c) { room.cold.intensity = 60 + lt * 120; tenRoom(RM, c.t); hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'And standing there were ten people', set: room, sfx: [['thud', 'ten', 0.7]], cam: roomCam([-10.5, 4.6, 12], [-11, 4, -2], { push: 0.05, fov: 56 }),
    act(lt, c) { room.cold.intensity = 260; tenRoom(RM, c.t); hud(RM, 'emergency')(lt, c); } });
  shot({ line: 'who had disappeared exactly a hundred years ago.', set: fieldOld, ...SEPIA, sfx: [['pop', 'disappeared', 0.6]], cam: { pos: [0, 5.2, 30], look: [0, 3.8, 13], fov: 50, blur: 0.1, push: 0.05 },
    act(lt, c) { const gone = lt >= c.w('disappeared') + 0.1; if (!gone) oldPhoto(FO, c.t); FO.puffs.forEach((p, i) => { const row = i < 5 ? 0 : 1, k = i % 5; p.at(lt - c.w('disappeared') - 0.1, [-5 + k * 2.5 + row * 1.25, 0.5, 12 + row * 2.4]); }); hud(FO, 'film')(lt, c); } });
  shot({ line: "They hadn't aged", set: room, cam: (lt) => ({ pos: [lerp(-15, -11, lt / 1.4), 4.8, 4.2], look: [lerp(-15, -11, lt / 1.4), 4.4, -3.6], fov: 45, blur: 0.3, push: 0 }),
    act(lt, c) { room.cold.intensity = 260; tenRoom(RM, c.t); } });
  shot({ line: 'a single day. ///', set: room, cam: roomCam([-11.5, 4.6, 0.2], [-11.5, 4.5, -3.6], { blur: 0.6, push: 0.06, fov: 48 }),
    act(lt, c) { room.cold.intensity = 260; tenRoom(RM, c.t, ['blank']); RM.ten[2].setFace(lt > 1.2 ? 'smirk' : 'blank'); } });
});
