// story.js: "In my town, there's a vending machine that grants any wish."
// Sets, cast, then one shot() per picture. The spoken script is the shots' `line` strings joined in order.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff, makeEmote } from './fx.js';
import { remap, E, lerp, box, at, grp, sign, glow, mat, rng, PRE } from './util.js';

// ── props
function coin() {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 28), glow('#ffcf33', 1.5)); c.rotation.x = Math.PI / 2;
  const s = sign('R$', 0.56, 0.4, { bg: '#ffcf33', fg: '#8a5a00', glowing: true }); s.position.z = 0.06; return grp(c, s);
}
function gift(color, seed) {
  const r = rng(seed), w = 0.9 + r() * 0.5;
  return grp(at(box(w, w * 0.8, w, color, 0.05), 0, w * 0.4, 0), at(box(w + 0.04, w * 0.82, 0.16, '#fff'), 0, w * 0.4, 0), at(box(0.16, w * 0.82, w + 0.04, '#fff'), 0, w * 0.4, 0), at(box(0.5, 0.25, 0.25, '#fff', 0.08), 0, w * 0.82, 0));
}
function remote() { return grp(at(box(0.34, 0.12, 0.7, '#1c1d22', 0.04), 0, 0, 0), at(box(0.16, 0.08, 0.16, glow('#ff3b30', 1.6)), 0, 0.08, 0.12)); }
// the wish machine: purple cabinet, glass front full of snacks, side screen with swappable messages, coin slot, header sign
function machine() {
  const g = grp(at(box(4.6, 8.8, 2.8, '#6b3fd4', 0.2), 0, 4.4, 0), at(box(4.8, 0.4, 3, '#4a2a9e', 0.1), 0, 0.2, 0));
  g.add(at(box(2.9, 5.6, 0.1, glow('#bfe6ff', 0.9)), -0.6, 5, 1.42));
  const cs = ['#ff5a5a', '#ffcf33', '#38d27a', '#2f9bff', '#ff7ad1'], r = rng(4);
  for (let row = 0; row < 4; row++) { g.add(at(box(2.8, 0.1, 0.6, '#d9dde3'), -0.6, 2.6 + row * 1.35, 1.2)); for (let i = 0; i < 4; i++) g.add(at(box(0.5, 0.8, 0.4, cs[Math.floor(r() * 5)], 0.06), -1.6 + i * 0.66, 3.1 + row * 1.35, 1.15)); }
  g.add(at(box(2.9, 0.9, 0.2, '#2a1a5a'), -0.6, 1.3, 1.42));                       // drop tray
  const screens = {}; for (const [k, t, bg, fg] of [['idle', ['MAKE', 'A WISH'], '#101828', '#7fe8ff'], ['granted', ['WISH', 'GRANTED'], '#0e2a14', '#5dff8a'], ['undone', ['WISH', 'UNDONE'], '#2a0e0e', '#ff5a5a'], ['off', [' '], '#0b0b10', '#000']]) { const s = sign(t, 1.2, 1.0, { bg, fg, glowing: true }); s.position.set(1.6, 6.4, 1.43); g.add(s); screens[k] = s; }
  g.add(at(box(0.5, 0.9, 0.12, '#2a2a33'), 1.6, 4.9, 1.43), at(box(0.12, 0.5, 0.06, glow('#ffcf33', 1.3)), 1.6, 4.9, 1.5));   // coin slot
  const headOn = sign('WISH-O-MATIC', 4.4, 1.1, { bg: '#ff3b8d', fg: '#fff', glowing: true }), headOff = sign('WISH-O-MATIC', 4.4, 1.1, { bg: '#5a2a40', fg: '#9a8a96' });
  for (const h of [headOn, headOff]) { h.position.set(0, 8.2, 1.43); g.add(h); }
  g.userData = { screens, headOn, headOff, show(k, lit = true) { for (const s in screens) screens[s].visible = s === k; headOn.visible = lit; headOff.visible = !lit; } };
  return g;
}

start(() => {
  // ── sets
  const town = SETS.street({ shops: [['ARCADE', '#e4d0ff', '#7b3fc4'], ['TOYS', '#bfe3ff', '#2f7de1'], ['PIZZA', '#fff0b8', '#e8632b'], ['CANDY', '#ffd0e4', '#e8458b'], ['PETS', '#d6f2c4', '#2e9e59']] });
  const vm = machine(); town.group.add(at(vm, -5, 0, -0.6));
  const coinFly = coin(); town.group.add(coinFly); PRE.push(() => { coinFly.visible = false; });
  town.reset = () => { vm.userData.show('idle'); vm.position.x = -5; };
  const hall = SETS.hallway({ banner: ['SPRING', 'DANCE!'], bannerBg: '#ff7ad1', poster: ['BE KIND'], door: 'ROOM 7' });
  const school = SETS.schoolFront({ name: 'SUNNY HILLS SCHOOL' });
  const gifts = grp(at(gift('#ff5a5a', 1), -1.2, 0, 3.4), at(gift('#2f9bff', 2), 1.4, 0, 3.6), at(gift('#38d27a', 3), 0.1, 1.2, 3.4), at(gift('#ffcf33', 4), -0.4, 0, 4.4));
  hall.group.add(gifts); PRE.push(() => { gifts.visible = false; });

  // ── cast: identical options in every set
  const OPT = {
    sam: { seed: 1, skin: 'fair', hair: 'short', hairColor: '#d99a3a', top: 'tee', topColor: '#2fb8c9', bottom: 'cargo', bottomColor: '#4a4f5c' },
    mia: { seed: 2, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'zip', topColor: '#e8458b', inner: '#ffffff', sleeves: 'long', bottom: 'jeans', bottomColor: '#3a5a9a' },
    amy: { seed: 4, skin: 'tan', hair: 'ponytail', hairColor: '#3a2212', top: 'stripes', topColor: '#ffcf33', stripe: '#ffffff', bottom: 'skirt', bottomColor: '#5b3fa0' },
    ben: { seed: 5, skin: 'deep', hair: 'curly', hairColor: '#17110f', top: 'hoodie', topColor: '#2ebd5a', bottom: 'joggers', bottomColor: '#1d1f26' },
    zoe: { seed: 6, skin: 'light', hair: 'long', hairColor: '#e8b04a', top: 'dress', topColor: '#9b59d6', bottom: 'skirt', bottomColor: '#9b59d6' },
    guy: { seed: 7, skin: 'tan', hair: 'spiky', hairColor: '#2a1a10', top: 'jersey', topColor: '#e8413c', number: '9', bottom: 'shorts', bottomColor: '#25427a' },
  };
  const cast = set => {
    const c = {}; for (const [k, o] of Object.entries(OPT)) { c[k] = makeAvatar(o); set.group.add(c[k].root); }
    const hold = (av, obj) => { obj.position.set(0, -0.15, 0.55); obj.rotation.x = -Math.PI / 2; av.handR.add(obj); PRE.push(() => { obj.visible = false; }); return obj; };
    c.sam.coin = hold(c.sam, coin()); c.mia.remote = hold(c.mia, remote()); c.mia.remote.rotation.x = 0;
    return { ...c, sp: makeSparkles(set.group), bulb: makeBulb(set.group), puff: makePuff(set.group), bang: makeEmote(set.group, '!'), q: makeEmote(set.group, '?', '#2f7de1'), dots: makeEmote(set.group, '...', '#555') };
  };
  const T = cast(town), H = cast(hall), S = cast(school);
  const SX = -1.6, SZ = 2.6;                       // where Sam stands at the machine
  const crowd = (C, lt, c, face, o = {}) => {       // the popular-kid crowd in the hallway around Sam at x=0
    const spots = { amy: [-3.2, 1.2, 0.5], ben: [3.2, 1.0, -0.5], zoe: [-2.2, -1.4, 0.3], guy: [2.4, -1.6, -0.3] };
    for (const [k, [x, z, ry]] of Object.entries(spots)) { const a = C[k].reset().place(x, z, ry).setFace(face).idle(c.t); if (o.cheer) { a.pose('cheer', 0.7); a.hip.position.y += Math.abs(Math.sin(c.t * 8 + x)) * 0.25; } }
  };

  // ───────── HOOK: the machine
  shot({ line: 'In my town,', set: town, sfx: [['whoosh', 0]], cam: { pos: [6, 5, 28], look: [-2, 5.5, 0], fov: 60, blur: 0.1, push: 0.04 },
    act(lt, c) { T.guy.reset().place(6 - lt * 4, 3.5, -Math.PI / 2).walk(c.t).setFace('grin'); T.zoe.reset().place(9, 1.5, -0.3).setFace('smile').idle(c.t); } });
  shot({ line: "there's a vending machine that grants any wish.", set: town, sfx: [['sparkle', 'wish', 0.8]], cam: { pos: [-3.2, 6.5, 12], look: [-5, 5.2, -0.6], fov: 60, blur: 0.2, push: 0.04 },
    act(lt, c) { T.sp.at(lt - c.w('wish'), [-5, 1.5, 1], 1.1); } });
  shot({ line: 'It only costs one Robux.', set: town, sfx: [['pop', 'robux']], cam: { pos: [-2.4, 5.6, 5.4], look: [-3.4, 5.3, 0.8], fov: 55, blur: 0.6, push: 0.05 },
    act(lt, c) { if (lt > c.w('robux')) { coinFly.visible = true; const k = E.back(remap(lt, c.w('robux'), c.w('robux') + 0.25)); coinFly.position.set(-2.6, 5.4, 2.4); coinFly.scale.setScalar(Math.max(0.001, k * 1.2)); coinFly.rotation.y = c.t * 3; } } });
  shot({ line: 'But every wish takes something away.', set: town, sfx: [['sad', 'away', 0.6]], cam: { pos: [-5, 7.4, 9], look: [-4.4, 6.4, -0.6], fov: 58, blur: 0.5, push: 0.06 },
    act(lt, c) { if (lt > c.w('away')) vm.userData.show(Math.floor(c.t * 6) % 2 ? 'off' : 'idle'); } });

  // ───────── SAM + MIA
  shot({ line: 'My name is Sam,', set: school, sfx: [['pop', 'sam', 0.6]], cam: frame(0, 3, { size: 'medium', side: 8 }),
    act(lt, c) { S.sam.reset().place(0, 3, 0).pose('open').setFace(lt < c.w('sam') ? 'smile' : 'grin').idle(c.t); if (lt > c.w('sam')) { S.sam.pose('wave', remap(lt, c.w('sam'), c.w('sam') + 0.15)); S.sam.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } } });
  shot({ line: 'and I had exactly one Robux left.', set: school, sfx: [['ding', 'one', 0.5]], cam: frame(0, 3, { size: 'close', side: -14 }),
    act(lt, c) { S.sam.reset().place(0, 3, -0.15).pose({ aR: [80, -8] }).setFace(lt < c.w('one') ? 'neutral' : 'worried').idle(c.t); S.sam.coin.visible = true; S.sam.coin.rotation.z = c.t * 2; } });
  shot({ line: "My best friend Mia told me, Don't do it.", set: school, sfx: [['pop', 'mia', 0.6]], cam: frame(0, 2.6, { size: 'full', side: -8, dist: 0.9 }),
    act(lt, c) { S.mia.reset().place(-1.6, 2.6, 0.45).pose(lt < c.w("don't") ? 'hips' : 'open', 0.8).setFace(lt < c.w("don't") ? 'smile' : 'serious').idle(c.t); if (lt > c.w('told')) S.mia.talk(c.t);
      S.sam.reset().place(1.6, 2.6, -0.45).setFace('neutral').idle(c.t); } });
  shot({ line: 'But I was tired of being invisible.', set: hall, cam: { pos: [0, 4.6, 15], look: [0, 3.8, 0], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { H.sam.reset().place(0, 1, 0).pose('slump').setFace('sad').idle(c.t);
      for (const [k, x0, z, dir] of [['amy', -9, 3, 1], ['ben', 10, 2.6, -1], ['zoe', -14, 2.2, 1], ['guy', 13, 3.4, -1]]) H[k].reset().place(x0 + dir * lt * 4.5, z, dir * Math.PI / 2).walk(c.t).setFace('grin'); } });
  shot({ line: 'So I put in my last Robux', set: town, sfx: [['tick', 'put'], ['ding', 'robux', 0.6]], cam: { pos: [1.4, 5, 7.4], look: [-3.4, 4.6, 0.8], fov: 58, blur: 0.4, push: 0.03 },
    act(lt, c) { const tIn = c.w('robux'); T.sam.reset().place(SX, SZ - 0.6, -0.85).pose({ aR: [95, 6] }, remap(lt, 0, 0.4)).setFace('serious').idle(c.t);
      if (lt < tIn) T.sam.coin.visible = true; else { coinFly.visible = lt < tIn + 0.35; const k = remap(lt, tIn, tIn + 0.35); coinFly.position.set(lerp(-2.6, -3.4, k), 4.9, lerp(1.9, 0.9, k)); coinFly.rotation.set(0, -0.85, 0); coinFly.scale.setScalar(1 - k * 0.5); } } });
  shot({ line: 'and wished to be popular.', set: town, sfx: [['sparkle', 'popular'], ['pop', 'popular', 0.6]], cam: frame(SX, SZ, { size: 'medium', side: 24 }),
    act(lt, c) { const tp = c.w('popular'); vm.userData.show(lt < tp ? 'idle' : 'granted'); T.sam.reset().place(SX, SZ, -0.5).pose({ aL: [100, -40], aR: [100, -40] }).setFace(lt < tp ? 'sleepy' : 'wow').idle(c.t); T.sp.at(lt - tp, [SX, 0, SZ]); } });

  // ───────── POPULAR
  shot({ line: 'The next morning, everyone at school knew my name.', set: school, sfx: [['whoosh', 0, 0.7], ['pop', 'name']], cam: frame(0, 3, { size: 'full', side: 6, dist: 1.2 }),
    act(lt, c) { const tn = c.w('knew'); S.sam.reset().place(0, 3, 0).setFace(lt < tn ? 'neutral' : 'grin').idle(c.t); if (lt > tn) S.sam.pose('wave', remap(lt, tn, tn + 0.2));
      for (const [k, x, z] of [['amy', -3.6, 4.5], ['ben', 3.6, 4.2], ['zoe', -6, 2], ['guy', 6, 2.2]]) { const a = S[k].reset().place(x, z, x < 0 ? 0.6 : -0.6).setFace(lt < tn ? 'neutral' : 'grin').idle(c.t); if (lt > tn) { a.pose('wave', remap(lt, tn, tn + 0.2)); a.armR.rotation.z += Math.sin(c.t * 14 + x) * 0.3; } } } });
  shot({ line: 'Kids gave me gifts.', set: hall, sfx: [['pop', 'gave'], ['pop', 'gifts']], cam: { pos: [0, 4.2, 12.5], look: [0, 3.2, 1], fov: 60, blur: 0.25, push: 0.03 },
    act(lt, c) { H.sam.reset().place(0, 1.2, 0).pose('carry').setFace('love').idle(c.t); gifts.visible = lt > c.w('gifts'); gifts.position.set(0, 0, -1.8); H.puff.at(lt - c.w('gifts'), [0, 0, 1.8]);
      crowd(H, lt, c, 'grin'); for (const k of ['amy', 'ben']) H[k].pose('reach', 0.6); } });
  shot({ line: 'They followed me everywhere.', set: hall, sfx: [['whoosh', 0, 0.5]], cam: { pos: [14, 4.4, 15], look: [14, 3.6, 1], fov: 60, blur: 0.15, push: 0, to: { pos: [5, 4.4, 15], look: [5, 3.6, 1] }, ease: 'lin' },
    act(lt, c) { const x = 13 - lt * 7.5; H.sam.reset().place(x, 1.8, -Math.PI / 2).walk(c.t).setFace('smug');
      [['amy', 2.2, 0.6], ['ben', 3.2, 2.8], ['zoe', 4.4, 1.2], ['guy', 5.4, 2.6]].forEach(([k, dx, z]) => H[k].reset().place(x + dx, z, -Math.PI / 2).walk(c.t + dx).setFace('love')); } });

  // ───────── MIA FORGETS
  shot({ line: 'Then I saw Mia in the hallway.', set: hall, cam: { pos: [-4, 4.4, 14], look: [-7, 3.6, 0], fov: 60, blur: 0.2, push: 0.03 },
    act(lt, c) { H.mia.reset().place(-9 + lt * 1.5, 0.5, Math.PI / 2).walk(c.t, 0.7).setFace('neutral'); H.sam.reset().place(-1.5, 3, -Math.PI * 0.6).setFace(lt < c.w('mia') ? 'grin' : 'happy').idle(c.t); } });
  shot({ line: 'I waved at her.', set: hall, cam: frame(0, 2, { size: 'medium', side: 14 }),
    act(lt, c) { H.sam.reset().place(0, 2, -0.3).setFace('grin').pose('wave', remap(lt, c.w('waved') - 0.1, c.w('waved') + 0.1)).idle(c.t); H.sam.armR.rotation.z += Math.sin(c.t * 14) * 0.3; } });
  shot({ line: 'She just looked at me and said,', set: hall, cam: frame(-1, 1, { size: 'close', side: -12 }),
    act(lt, c) { H.mia.reset().place(-1, 1, 0.4).setFace(lt < c.w('looked') ? 'neutral' : 'blank').idle(c.t, 0.4); } });
  shot({ line: 'Sorry, do I know you?', set: hall, sfx: [['tick', 'know']], cam: frame(-1, 1, { size: 'face', side: 8, push: 0.06 }),
    act(lt, c) { H.mia.reset().place(-1, 1, 0.25).setFace('say').talk(c.t, 0.6); H.mia.head.rotation.z = 0.1; } });
  shot({ line: 'My heart dropped.', set: hall, sfx: [['fall', 'dropped'], ['sad', 'dropped', 0.6]], cam: frame(0, 2, { size: 'face', side: -14, push: 0.08 }),
    act(lt, c) { H.sam.reset().place(0, 2, -0.2).setFace(lt < c.w('dropped') ? 'shock' : 'cry'); H.dots.at(lt - c.w('dropped'), H.sam, 2); } });
  shot({ line: 'The machine took my best friend.', set: town, sfx: [['thud', 'machine']], cam: { pos: [-6.2, 5.8, 10], look: [-5, 5.6, -0.6], fov: 58, blur: 0.4, push: 0.07 },
    act(lt, c) { vm.userData.show('granted'); } });

  // ───────── UNDO
  shot({ line: 'I ran back to the machine', set: town, sfx: [['whoosh', 'ran']], cam: { pos: [8, 4.4, 16], look: [0, 3.6, 1], fov: 60, blur: 0.15, push: 0.02 },
    act(lt, c) { T.sam.reset().place(10 - lt * 9, SZ, -Math.PI / 2).run(c.t).setFace('worried'); T.puff.at(lt, [10, 0, SZ]); vm.userData.show('granted'); } });
  shot({ line: 'and banged on the glass.', set: town, sfx: [['thud', 'banged', 1.2], ['thud', 'glass', 1.2]], cam: { pos: [2.4, 4.8, 9], look: [-3.6, 4, 0], fov: 60, blur: 0.25, push: 0.03 },
    act(lt, c) { vm.userData.show('granted'); const hit = Math.max(0, Math.sin((lt - c.w('banged')) * 18)); T.sam.reset().place(SX - 0.6, SZ - 0.9, -0.8).pose({ aL: [100 + hit * 40, 10], aR: [100 + hit * 40, 10] }).setFace('angry').idle(c.t);
      if (lt > c.w('banged')) vm.position.x = -5 + Math.sin(c.t * 70) * 0.06 * hit; } });
  shot({ line: "I don't want to be popular!", set: town, cam: frame(SX, SZ, { size: 'close', side: 20 }),
    act(lt, c) { vm.userData.show('granted'); T.sam.reset().place(SX, SZ, -0.45).pose('open', 0.8).setFace('angry').talk(c.t, 1.4).idle(c.t); } });
  shot({ line: 'I want my friend back!', set: town, sfx: [['pop', 'back', 0.6]], cam: frame(SX, SZ, { size: 'face', side: -6, push: 0.07 }),
    act(lt, c) { vm.userData.show('granted'); T.sam.reset().place(SX, SZ, -0.35).setFace(lt < c.w('back') ? 'say' : 'cry').talk(c.t, 1.2); } });
  shot({ line: 'The screen flashed, Wish undone.', set: town, sfx: [['pop', 'flashed'], ['sparkle', 'undone']], flash: lt => 0, cam: { pos: [-2.6, 6.8, 5.6], look: [-3.4, 6.2, 0.8], fov: 55, blur: 0.5, push: 0.05 },
    act(lt, c) { const tf = c.w('flashed'); vm.userData.show(lt < tf ? 'granted' : lt < c.w('wish') ? (Math.floor(c.t * 12) % 2 ? 'off' : 'undone') : 'undone'); } });

  // ───────── FORGOTTEN, EXCEPT MIA
  shot({ line: 'Suddenly, everyone forgot me again.', set: hall, sfx: [['whoosh', 'forgot']], cam: { pos: [0, 4.6, 15], look: [0, 3.8, 0], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { const tf = c.w('forgot'); H.sam.reset().place(0, 1, 0).setFace(lt < tf ? 'grin' : 'sad').idle(c.t); if (lt > tf) H.sam.pose('slump', remap(lt, tf, tf + 0.3));
      gifts.visible = lt < tf; gifts.position.set(0, 0, -1.8); H.puff.at(lt - tf, [0, 0, 1.8]);
      if (lt < tf) crowd(H, lt, c, 'grin'); else for (const [k, x, z, dir] of [['amy', -3.2, 1.2, -1], ['ben', 3.2, 1, 1], ['zoe', -2.2, -1.4, -1], ['guy', 2.4, -1.6, 1]]) H[k].reset().place(x + dir * (lt - tf) * 5, z, dir * Math.PI / 2).walk(c.t).setFace('neutral'); } });
  shot({ line: 'Except Mia.', set: hall, sfx: [['ding', 'mia', 0.6]], cam: frame(-1, 1, { size: 'medium', side: 10 }),
    act(lt, c) { H.mia.reset().place(-1, 1, 0.3).setFace(lt < c.w('mia') ? 'neutral' : 'grin').idle(c.t); if (lt > c.w('mia')) H.mia.pose('wave', remap(lt, c.w('mia'), c.w('mia') + 0.15)); } });
  shot({ line: 'She ran up and hugged me.', set: hall, sfx: [['whoosh', 'ran', 0.6], ['ding', 'hugged', 0.5]], cam: { pos: [0.4, 4.4, 10], look: [0, 4, 0.6], fov: 58, blur: 0.35 },
    act(lt, c) { const th = c.w('hugged'), k = E.out(remap(lt, 0, th)); H.mia.reset().place(lerp(-8, -1.25, k), lerp(1, 1.4, k), 1.1).setFace('happy').idle(c.t); if (k < 1) H.mia.run(c.t); else H.mia.pose('hug');
      H.sam.reset().place(1.25, 0.2 + 1.2, -1.1).setFace(lt < th ? 'shock' : 'happy').idle(c.t); if (lt > th) H.sam.pose('hug', remap(lt, th, th + 0.2)); } });

  // ───────── BUTTON: the remote
  shot({ line: 'Then she pulled out a tiny remote.', set: town, sfx: [['pop', 'remote']], cam: frame(1.6, 3, { size: 'close', side: -14 }),
    act(lt, c) { vm.userData.show('off', false); const tr = c.w('pulled'); T.mia.reset().place(1.6, 3, -0.4).setFace('smirk').idle(c.t).pose({ aR: [75, -10] }, remap(lt, tr, tr + 0.25)); T.mia.remote.visible = lt > tr + 0.1;
      T.sam.reset().place(SX, SZ + 0.5, 0.6).setFace('sus').idle(c.t); } });
  shot({ line: 'She pressed a button,', set: town, sfx: [['tick', 'pressed']], cam: frame(1.6, 3, { size: 'medium', side: -34, push: 0.05 }),
    act(lt, c) { vm.userData.show('off', false); T.mia.reset().place(1.6, 3, -0.4).setFace('smirk').pose({ aR: [75, -10], aL: [70, 20] }); T.mia.remote.visible = true; if (lt > c.w('pressed')) T.mia.armL.rotation.x += 0.12; } });
  shot({ line: 'and the vending machine lit up.', set: town, sfx: [['sparkle', 'lit'], ['ding', 'up', 0.6]], flash: lt => 0, cam: { pos: [0.6, 5.4, 15], look: [-3, 4.6, 0], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { const tl = c.w('lit'); vm.userData.show(lt < tl ? 'off' : 'idle', lt > tl); T.sp.at(lt - tl, [-5, 1.5, 1], 1.1);
      T.mia.reset().place(1.6, 3, -0.6).setFace('smirk').pose({ aR: [75, -10] }).idle(c.t); T.mia.remote.visible = true; T.sam.reset().place(SX, SZ + 0.5, 0.4).setFace(lt < tl ? 'sus' : 'shock').idle(c.t); if (lt > tl) T.sam.lookAt(-5, -0.6); T.bang.at(lt - tl - 0.1, T.sam, 1.4); } });
  shot({ line: 'She smiled and said,', set: town, sfx: [['pop', 'smiled', 0.6]], cam: frame(1.6, 3, { size: 'close', side: 10 }),
    act(lt, c) { T.mia.reset().place(1.6, 3, -0.3).setFace(lt < c.w('smiled') ? 'smirk' : 'grin').idle(c.t); T.mia.remote.visible = true; T.mia.pose({ aR: [60, -10] }); } });
  shot({ line: 'I built it.', set: town, cam: frame(1.6, 3, { size: 'face', side: -8, push: 0.05 }),
    act(lt, c) { T.mia.reset().place(1.6, 3, -0.2).setFace('say').talk(c.t, 0.6); } });
  shot({ line: "I just wanted to see if you'd choose me.", set: town, sfx: [['ding', 'choose', 0.5]], cam: { pos: [0.2, 4.4, 13.5], look: [0, 3.7, 2.8], fov: 58, blur: 0.3, push: 0.03 },
    act(lt, c) { vm.userData.show('idle'); const tc = c.w('choose'); T.mia.reset().place(1.6, 3, -0.6).setFace(lt < tc ? 'say' : 'love').idle(c.t); if (lt < tc) T.mia.talk(c.t, 0.6);
      T.sam.reset().place(-1.6, 3, 0.6).setFace(lt < tc ? 'shock' : 'happy').idle(c.t); } });
});
