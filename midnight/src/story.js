// story.js: "In this town, every night at midnight, someone gets replaced."
// Sets, cast, then one shot() per picture. The spoken script is the shots' `line` strings joined in order.
import { start, shot, frame, LIGHTS } from './core.js';
import { makeAvatar, FACES } from './avatar.js';
import { SETS, room, TEX, counter, door, chair, sky, lampPost, plant, bookshelf } from './sets.js';
import { makeSparkles, makeBulb, makePuff, makeEmote, grow } from './fx.js';
import { remap, E, lerp, box, at, grp, sign, glow } from './util.js';

// copies: wide white eyes with pin pupils. 'stare' = flat mouth, 'creep' = the too-big grin
FACES.stare = ['round', 'none', 'line'];
FACES.creep = ['round', 'none', 'grin'];
// a dim house at night, still bright enough for the toy look
LIGHTS.dim = { amb: 0.95, hemi: 0.7, sun: 0.95, dir: [-6, 18, 12], sunColor: '#dfe4ff', bg: '#1b2236', exposure: 1.0 };
LIGHTS.night = { amb: 0.8, hemi: 0.6, sun: 0.9, dir: [-6, 16, 8], sunColor: '#a9bcff', bg: '#16203a', exposure: 1.0 };

start(() => {
  // ── sets
  const town = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['TOYS', '#bfe3ff', '#2f7de1'], ['DINER', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['PETS', '#e4d0ff', '#7b3fc4']] });
  town.light = 'night'; town.group.remove(town.group.children[0]); town.group.add(sky('#0a1434', '#33447e'));
  const clockA = sign('11:59', 3.4, 1.5, { bg: '#121216', fg: '#ff3b30', border: '#444' }), clockB = sign('12:00', 3.4, 1.5, { bg: '#121216', fg: '#ff3b30', border: '#444' });
  town.group.add(at(box(0.35, 9.4, 0.35, '#17181c'), -6, 4.7, 1.5), at(box(3.8, 1.9, 0.4, '#17181c'), -6, 10.1, 1.5), at(clockA, -6, 10.1, 1.72), at(clockB, -6, 10.1, 1.72));
  town.reset = () => { clockA.visible = true; clockB.visible = false; };

  const bed = SETS.bedroom({ poster: 'GAME\nNIGHT', bed: '#2fae3a' });

  const kitchen = { group: room({ floorTex: TEX.checker('#ffffff', '#c9ced8'), tile: 4, wallColor: '#fff0d2', trim: '#7cc2b4', trimY: 4.4, w: 34, d: 24, lights: 1 }), light: 'dim' };
  const bDoor = door('BASEMENT', '#7a5634');
  kitchen.group.add(at(counter(13, '#ffffff', '#8a909a'), -7, 0, -5), at(box(3.6, 8, 2.2, '#e9eef2', 0.2), 3.2, 4, -4.9), at(box(0.2, 2.2, 0.3, '#9aa0aa'), 1.7, 4.6, -3.7),
    at(sign(['LOVE YOU', 'BUDDY!', '- MOM'], 2.1, 1.9, { bg: '#fff27a', fg: '#d1304a' }), 3.6, 5.2, -3.78), at(bDoor, 11, 0, -5.9),
    at(sign('12:03', 2.6, 1.2, { bg: '#ffffff', fg: '#222', border: '#7a5634' }), -7, 9.2, -5.85), at(sign(['LOCK UP', 'BY 11:59!'], 3.6, 2, { bg: '#e84b4b', fg: '#fff' }), -13, 7.6, -5.85), at(plant(), -15, 0, -4.6));
  kitchen.reset = () => { bDoor.position.x = 11; };

  const base = { group: room({ floorTex: TEX.concrete('#8f9096'), tile: 5, wallColor: '#7d8290', trim: '#5a5f6b', trimY: 4, ceiling: '#4a4e57', w: 30, d: 22, lights: 1 }), light: 'dim' };
  const ropes = grp(at(box(2.3, 0.28, 1.3, '#c08a4c'), 0, 2.7, -1), at(box(2.3, 0.28, 1.3, '#c08a4c'), 0, 3.5, -1), at(box(1.9, 0.28, 1.2, '#c08a4c'), 0, 2.2, 0.2));
  base.group.add(at(chair('#7a5634'), 0, 0, -1), ropes, at(door('', '#7a5634'), 9, 0, -5.9), at(sign('STORAGE', 4, 1.2, { bg: '#f2b01e', fg: '#2a1a00' }), -9, 9, -5.85),
    at(box(3, 2.4, 2.4, '#b9874e', 0.1), -10, 1.2, -4), at(box(2.4, 2, 2, '#c89a60', 0.1), -10, 3.4, -4.2), at(box(2.6, 2.2, 2.2, '#b9874e', 0.1), -6.6, 1.1, -4.4), at(bookshelf(4, 6), 13, 0, -5));
  base.reset = () => { ropes.visible = true; };

  const school = SETS.schoolFront({ name: 'OAK RIDGE SCHOOL' });

  // ── cast: identical options in every set
  const OPT = {
    jake: { seed: 1, skin: 'light', hair: 'short', hairColor: '#4a2c18', top: 'hoodie', topColor: '#2fae3a', bottom: 'jeans', bottomColor: '#4f79a7' },
    mom: { seed: 2, skin: 'fair', hair: 'long', hairColor: '#7a4a2e', top: 'cardigan', topColor: '#f4f1ea', inner: '#c0392b', sleeves: 'long', bottom: 'slacks', bottomColor: '#3a4a6b', shoe: '#2a2a30', sole: '#111' },
    leo: { seed: 3, skin: 'brown', hair: 'dreads', hairColor: '#1b1210', top: 'zip', topColor: '#940c1b', sleeves: 'long', bottom: 'joggers', bottomColor: '#15151a' },
    nate: { seed: 4, skin: 'tan', hair: 'buzz', hairColor: '#2a1a10', top: 'vest', topColor: '#f2b01e', sleeves: 'long', bottom: 'cargo', bottomColor: '#5b5f44', shoe: '#6b4a2a' },
    lady: { seed: 5, skin: 'deep', hair: 'bob', hairColor: '#17110f', top: 'sweater', topColor: '#7b3fc4', sleeves: 'long', bottom: 'skirt', bottomColor: '#22262b' },
    kid: { seed: 6, skin: 'light', hair: 'spiky', hairColor: '#e8632b', top: 'stripes', topColor: '#f4f4f4', bottom: 'jeans', bottomColor: '#274b8f', height: 0.8 },
  };
  const cast = set => {
    const c = {}; for (const [k, o] of Object.entries(OPT)) { c[k] = makeAvatar(o); set.group.add(c[k].root); }
    c.fake = makeAvatar(OPT.mom); set.group.add(c.fake.root);
    return { ...c, sp: makeSparkles(set.group), bulb: makeBulb(set.group), puff: makePuff(set.group), bang: makeEmote(set.group, '!'), q: makeEmote(set.group, '?', '#2f7de1') };
  };
  const T = cast(town), B = cast(bed), K = cast(kitchen), S = cast(base), D = cast(school);
  const glitch = (av, t, amt = 1) => { const f = Math.floor(t * 14); av.setFace(['creep', 'stare', 'scream', 'blank', 'creep', 'shock'][f % 6]); av.root.position.x += Math.sin(t * 97) * 0.18 * amt; av.head.rotation.z += Math.sin(t * 71) * 0.25 * amt; };

  // ───────── HOOK: night street, clock, someone gets replaced
  shot({ line: 'In this town,', set: town, sfx: [['whoosh', 0]], cam: { pos: [2, 4.4, 24], look: [0, 6.4, 0], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) { T.nate.reset().place(-3 + lt * 4.5, 3.5, Math.PI / 2).walk(c.t).setFace('grin'); T.lady.reset().place(8, 1, -0.5).setFace('smile').idle(c.t); } });
  shot({ line: 'every night at midnight,', set: town, sfx: [['tick', 'every'], ['tick', 'night'], ['thud', 'midnight', 1.2]], cam: { pos: [-4.4, 7.4, 8.5], look: [-6, 9.6, 1.5], fov: 58, blur: 0.5, push: 0.06 },
    act(lt, c) { if (lt >= c.w('midnight')) { town.group.children; clockA.visible = false; clockB.visible = true; } } });
  shot({ line: 'someone gets replaced.', set: town, sfx: [['sparkle', 'replaced'], ['pop', 'replaced', 0.6]], cam: frame(2, 3, { size: 'medium', side: 10 }),
    act(lt, c) { T.nate.reset().place(2, 3, 0).idle(c.t).setFace('grin'); if (!grow(T.nate, T.sp, lt, c.w('replaced'), 1, 1, 'creep')) T.nate.pose('open', 0.4); } });
  shot({ line: 'Nobody knows who will disappear,', set: town, cam: { pos: [-6, 4.2, 15], look: [-2, 4.4, 2], fov: 60, blur: 0.15, push: 0, to: { pos: [4, 4.2, 15], look: [3, 4.4, 2] }, ease: 'lin' },
    act(lt, c) { T.lady.reset().place(-4, 2, 0.3).setFace('worried').idle(c.t); T.lady.head.rotation.y += Math.sin(c.t * 3) * 0.6; T.kid.reset().place(0.5, 3.5, -0.2).setFace('worried').pose('shy').idle(c.t); T.kid.head.rotation.y += Math.sin(c.t * 3 + 2) * 0.6; T.nate.reset().place(5, 2, -0.3).setFace('creep').idle(c.t, 0.3); } });
  shot({ line: 'or who will take their place.', set: town, cam: frame(5, 2, { size: 'face', side: -12, push: 0.06 }),
    act(lt, c) { T.nate.reset().place(5, 2, -0.1).setFace('creep').idle(c.t, 0.2); } });
  shot({ line: "That's why everyone locks their doors", set: town, sfx: [['thud', 'doors', 0.8]], cam: { pos: [-11, 4, 12], look: [-16.5, 4, -1], fov: 60, blur: 0.2, push: 0.02 },
    act(lt, c) { const k = remap(lt, 0, c.w('doors')); T.lady.reset().place(-14 - k * 2.5, 4 - k * 5.2, Math.PI * 0.9).run(c.t).setFace('worried'); if (k >= 1) T.lady.root.visible = false; T.kid.reset().place(-11.5, 5, -0.6).run(c.t).place(-11.5 - lt * 2, 5 - lt * 3, Math.PI * 0.85).run(c.t).setFace('shock'); } });
  shot({ line: 'at eleven fifty-nine.', set: town, sfx: [['tick', 'eleven']], cam: { pos: [-5.6, 9.6, 5.2], look: [-6, 10.1, 1.5], fov: 58, blur: 0.6, push: 0.05 } });

  // ───────── JAKE + LEO
  shot({ line: 'My name is Jake,', set: bed, cam: frame(3, 2, { size: 'medium', side: 8 }),
    act(lt, c) { B.jake.reset().place(3, 2, 0).pose('open').setFace(lt < c.w('jake') ? 'smile' : 'grin').idle(c.t); if (lt > c.w('jake')) { B.jake.pose('wave', remap(lt, c.w('jake'), c.w('jake') + 0.15)); B.jake.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } } });
  shot({ line: 'and I never believed the rumors.', set: bed, cam: frame(3, 2, { size: 'close', side: -16, low: 0.25 }),
    act(lt, c) { B.jake.reset().place(3, 2, -0.2).setFace(lt < c.w('never') ? 'smirk' : 'smug').idle(c.t); if (lt > c.w('never')) B.jake.pose('shrug', remap(lt, c.w('never'), c.w('never') + 0.2)); } });
  shot({ line: 'My best friend Leo did.', set: school, cam: frame(-2, 2, { size: 'close', side: 14 }),
    act(lt, c) { D.leo.reset().place(-2, 2, 0.15).setFace(lt < c.w('did') ? 'worried' : 'serious').pose('shy', 0.6).idle(c.t); D.kid.reset().place(6, -2, -0.4).walk(c.t).place(6 - lt * 2, -2, -Math.PI / 2).walk(c.t).setFace('smile'); } });
  shot({ line: 'He said the copies always get one tiny thing wrong.', set: school, cam: { pos: [0.6, 4.3, 11.5], look: [0, 4.1, 2], fov: 58, blur: 0.4 },
    act(lt, c) { D.leo.reset().place(-2.3, 2, 0.5).pose('open', 0.8).setFace(lt < c.w('said') + 0.15 ? 'serious' : 'say').talk(c.t).idle(c.t); if (lt > c.w('tiny')) D.leo.pose({ aR: [120, 6] }, remap(lt, c.w('tiny'), c.w('tiny') + 0.15));
      D.jake.reset().place(2.3, 2, -0.5).setFace(lt < c.w('wrong') ? 'sus' : 'smirk').idle(c.t); } });

  // ───────── THE NIGHT
  shot({ line: 'Until one night,', set: bed, light: 'night', cam: { pos: [-3.6, 8.4, 1.6], look: [-8, 3, -1.2], fov: 60, blur: 0.3 },
    act(lt, c) { B.jake.reset().place(-8, 2.6, 0, 2.75).setFace('sleepy'); B.jake.root.rotation.x = -Math.PI / 2; B.jake.hip.position.y += Math.sin(c.t * 2) * 0.04; } });
  shot({ line: 'I woke up to screaming downstairs.', set: bed, light: 'night', sfx: [['pop', 'woke'], ['whoosh', 'screaming', 0.8]], cam: frame(-8, 0.8, { size: 'close', y: 0.5, side: 18 }),
    act(lt, c) { const up = c.w('woke'); if (lt < up) { B.jake.reset().place(-8, 2.6, 0, 2.75).setFace('sleepy'); B.jake.root.rotation.x = -Math.PI / 2; }
      else { B.jake.reset().place(-8, 0.6, 0, 0.5).sit(1.7).setFace(lt < c.w('screaming') ? 'shock' : 'worried').idle(c.t); B.jake.pose({ aL: [60, 30], aR: [60, 30] }); B.bang.at(lt - c.w('screaming'), B.jake, 2); } } });
  shot({ line: 'I ran down', set: kitchen, sfx: [['whoosh', 0]], cam: { pos: [12, 4, 12], look: [12, 3.6, 1], fov: 60, blur: 0.2, push: 0, to: { pos: [5, 4, 12], look: [5, 3.6, 1] }, ease: 'lin' },
    act(lt, c) { K.jake.reset().place(14 - lt * 9, 2, -Math.PI / 2).run(c.t).setFace('worried'); } });
  shot({ line: 'and saw my mom standing in the kitchen.', set: kitchen, cam: { pos: [7, 5, 14], look: [-1, 4, -1], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { K.mom.reset().place(-3, -1, 0.15).setFace('stare'); K.jake.reset().place(5, 4, -Math.PI * 0.72).setFace('worried').idle(c.t); } });
  shot({ line: 'But something was wrong.', set: kitchen, sfx: [['sad', 'wrong', 0.6]], cam: frame(5, 3, { size: 'close', side: 28 }),
    act(lt, c) { K.jake.reset().place(5, 3, -0.45).setFace(lt < c.w('wrong') ? 'worried' : 'shock', { lx: -1 }).idle(c.t); } });
  shot({ line: "She wasn't moving.", set: kitchen, cam: frame(-3, -1, { size: 'full', side: -8, push: 0.02 }),
    act(lt, c) { K.mom.reset().place(-3, -1, 0.15).setFace('stare'); } });
  shot({ line: 'She was just staring at me.', set: kitchen, sfx: [['tick', 'staring']], cam: frame(-3, -1, { size: 'face', side: 6, push: 0.07 }),
    act(lt, c) { K.mom.reset().place(-3, -1, 0.15).setFace('stare'); } });
  shot({ line: 'I asked, Mom, are you okay?', set: kitchen, cam: frame(4, 2, { size: 'close', side: 22 }),
    act(lt, c) { K.jake.reset().place(4, 2, -0.5).pose('open', 0.6).setFace(lt < c.w('mom') ? 'worried' : 'say').idle(c.t); if (lt > c.w('mom')) K.jake.talk(c.t); } });
  shot({ line: 'She smiled and said,', set: kitchen, sfx: [['pop', 'smiled', 0.7]], cam: frame(-3, -1, { size: 'close', side: -10 }),
    act(lt, c) { K.mom.reset().place(-3, -1, 0.15).setFace(lt < c.w('smiled') ? 'stare' : 'creep'); } });
  shot({ line: 'Of course, sweetie.', set: kitchen, sfx: [['pop', 'sweetie']], cam: frame(-3, -1, { size: 'face', side: 10, low: 0.3, push: 0.05 }),
    act(lt, c) { K.mom.reset().place(-3, -1, 0.15).setFace(lt < c.w('sweetie') + 0.3 ? 'say' : 'creep'); if (lt < c.w('sweetie') + 0.3) K.mom.talk(c.t, 0.5); } });
  shot({ line: 'My mom never calls me sweetie.', set: kitchen, cam: frame(4, 2, { size: 'face', side: -14, push: 0.06 }),
    act(lt, c) { K.jake.reset().place(4, 2, -0.3).setFace(lt < c.w('never') ? 'sus' : 'serious').idle(c.t, 0.5); } });
  shot({ line: 'She calls me buddy.', set: kitchen, cam: { pos: [3.1, 5.1, 2], look: [3.6, 5.1, -3.8], fov: 58, blur: 0.3, push: 0.04 } });
  shot({ line: 'Then I heard screaming again.', set: kitchen, sfx: [['pop', 'screaming']], cam: frame(4, 2, { size: 'medium', side: 18 }),
    act(lt, c) { K.jake.reset().place(4, 2, -0.3).setFace(lt < c.w('screaming') ? 'serious' : 'shock').idle(c.t); if (lt > c.w('screaming')) { K.jake.head.rotation.y = -0.9 * remap(lt, c.w('screaming'), c.w('screaming') + 0.12); K.bang.at(lt - c.w('screaming'), K.jake, 2); } } });
  shot({ line: 'It was coming from the basement.', set: kitchen, sfx: [['thud', 'coming'], ['thud', 'basement']], cam: { pos: [8.6, 4.8, 5], look: [11, 5.6, -5.5], fov: 60, blur: 0.25, push: 0.04 },
    act(lt, c) { bDoor.position.x = 11 + Math.sin(c.t * 70) * 0.06 * (Math.sin(c.t * 5) > 0 ? 1 : 0.2); } });

  // ───────── THE BASEMENT
  shot({ line: 'I opened the door,', set: base, sfx: [['whoosh', 'door', 0.7]], cam: frame(8, -1.5, { size: 'full', side: -14 }),
    act(lt, c) { S.jake.reset().place(9, -4 + lt * 2.2, 0.6).walk(c.t, 0.8).setFace('worried'); } });
  shot({ line: 'and there was my real mom,', set: base, cam: { pos: [3, 4.2, 12], look: [0, 3.2, -1], fov: 60, blur: 0.2, push: 0.03 },
    act(lt, c) { S.mom.reset().place(0, -1, 0).sit(1.5).setFace('cry').idle(c.t); S.mom.pose({ aL: [10, -8], aR: [10, -8] }); S.jake.reset().place(7, 2.5, -Math.PI * 0.6).setFace(lt < c.w('real') ? 'worried' : 'shock').idle(c.t); } });
  shot({ line: 'tied to a chair.', set: base, cam: { pos: [-1.2, 3, 5.4], look: [0, 2.8, -1], fov: 58, blur: 0.6, push: 0.05 },
    act(lt, c) { S.mom.reset().place(0, -1, 0).sit(1.5).setFace('cry').idle(c.t); S.mom.pose({ aL: [10, -8], aR: [10, -8] }); S.mom.hip.rotation.z = Math.sin(c.t * 9) * 0.05; } });
  shot({ line: 'She whispered, Jake, run.', set: base, cam: frame(0, -1, { size: 'face', y: -0.4, side: 14 }),
    act(lt, c) { S.mom.reset().place(0, -1, 0).sit(1.5).setFace(lt < c.w('jake') ? 'worried' : 'say').idle(c.t); S.mom.pose({ aL: [10, -8], aR: [10, -8] }); if (lt > c.w('jake')) S.mom.talk(c.t, 0.6); } });
  shot({ line: 'I turned around.', set: base, sfx: [['whoosh', 'turned', 0.6]], cam: frame(4, 1.5, { size: 'close', side: 12 }),
    act(lt, c) { const k = E.out(remap(lt, c.w('turned'), c.w('turned') + 0.35)); S.jake.reset().place(4, 1.5, lerp(-1.1, 0.7, k)).setFace(k < 1 ? 'worried' : 'shock').idle(c.t); } });
  shot({ line: 'The other mom was right behind me.', set: base, sfx: [['thud', 'behind', 1.2]], cam: frame(6.5, -2.5, { size: 'medium', side: -10, low: 0.42 }),
    act(lt, c) { S.fake.reset().place(6.5, -2.5, -0.15).setFace('creep').idle(c.t, 0.25); } });
  shot({ line: 'Still smiling.', set: base, cam: frame(6.5, -2.5, { size: 'face', side: 8, push: 0.07 }),
    act(lt, c) { S.fake.reset().place(6.5, -2.5, -0.05).setFace('creep'); } });
  shot({ line: "And that's when I had an idea.", set: base, sfx: [['ding', 'idea']], cam: frame(4, 1.5, { size: 'close', side: -14 }),
    act(lt, c) { S.jake.reset().place(4, 1.5, 0.3).setFace(lt < c.w('idea') ? 'worried' : 'smirk').idle(c.t); S.bulb.at(lt - c.w('idea'), S.jake); } });
  shot({ line: "I said, Mom, what's my favorite food?", set: base, cam: frame(4, 1.5, { size: 'medium', side: 20 }),
    act(lt, c) { S.jake.reset().place(4, 1.5, 0.6).setFace(lt < c.w('mom') ? 'smirk' : 'say').idle(c.t); if (lt > c.w('mom')) S.jake.talk(c.t); if (lt > c.w('favorite')) S.jake.pose('point', remap(lt, c.w('favorite'), c.w('favorite') + 0.15)); } });
  shot({ line: 'She froze.', set: base, sfx: [['tick', 'froze']], cam: frame(6.5, -2.5, { size: 'close', side: -6, push: 0.07 }),
    act(lt, c) { S.fake.reset().place(6.5, -2.5, -0.05).setFace(lt < c.w('froze') ? 'creep' : 'stare'); } });
  shot({ line: 'Her face started glitching.', set: base, sfx: [['tick', 'face'], ['tick', 'started'], ['tick', 'glitching'], ['pop', 'glitching', 0.6]], cam: frame(6.5, -2.5, { size: 'face', side: 10, push: 0.05 }),
    act(lt, c) { S.fake.reset().place(6.5, -2.5, -0.05).setFace('stare'); if (lt > c.w('glitching')) glitch(S.fake, c.t); else if (lt > c.w('started')) glitch(S.fake, c.t, 0.3); } });
  shot({ line: 'Pizza, she said.', set: base, cam: frame(6.5, -2.5, { size: 'close', side: -14 }),
    act(lt, c) { S.fake.reset().place(6.5, -2.5, -0.1).pose('open', 0.5).setFace(lt < c.w('she') ? 'say' : 'creep').talk(c.t, 0.6); if (Math.floor(c.t * 6) % 4 === 0) glitch(S.fake, c.t, 0.5); } });
  shot({ line: "Wrong. It's tacos.", set: base, sfx: [['pop', 'wrong']], cam: frame(4, 1.5, { size: 'close', side: 14, low: 0.3 }),
    act(lt, c) { S.jake.reset().place(4, 1.5, 0.5).pose('point').setFace(lt < c.w('tacos') ? 'smug' : 'grin').idle(c.t); if (lt > c.w('tacos')) S.jake.talk(c.t); } });
  shot({ line: 'Suddenly she flickered, sparkled, and disappeared.', set: base, sfx: [['tick', 'flickered'], ['sparkle', 'sparkled'], ['whoosh', 'disappeared'], ['pop', 'disappeared', 0.6]], cam: frame(6.5, -2.5, { size: 'full', side: -8 }),
    act(lt, c) { const tf = c.w('flickered'), ts = c.w('sparkled'), td = c.w('disappeared'); S.fake.reset().place(6.5, -2.5, -0.05).setFace(lt < ts ? 'stare' : 'scream');
      if (lt > tf) glitch(S.fake, c.t, 0.6); if (lt > tf && lt < td && Math.floor(c.t * 18) % 3 === 0) S.fake.root.visible = false;
      if (lt > ts) S.fake.pose({ aL: [20, 70], aR: [20, 70] }); S.sp.at(lt - ts, [6.5, 0, -2.5]);
      const k = E.in(remap(lt, td, td + 0.3)); if (k >= 1) S.fake.root.visible = false; else S.fake.size(1 - k * 0.999); S.puff.at(lt - td - 0.2, [6.5, 0, -2.5]); } });
  shot({ line: 'I untied my real mom,', set: base, cam: frame(0.8, -0.6, { size: 'medium', side: -8 }),
    act(lt, c) { S.mom.reset().place(0, -1, 0).sit(1.5).setFace(lt < c.w('real') ? 'worried' : 'happy').idle(c.t); S.jake.reset().place(2.5, -0.6, -1.35).pose('reach', 0.35).setFace('serious').idle(c.t); if (lt > c.w('real')) { ropes.visible = false; S.jake.setFace('smile'); } S.puff.at(lt - c.w('real'), [0, 2.3, -0.6]); } });
  shot({ line: 'and she hugged me.', set: base, sfx: [['ding', 'hugged', 0.5]], cam: { pos: [0.4, 4.4, 9.5], look: [0, 4.1, 0.2], fov: 58, blur: 0.4 },
    act(lt, c) { const k = remap(lt, 0, c.w('hugged') + 0.1); S.mom.reset().place(-1.25, 0.2, 1.1).pose('hug', k).setFace(lt < c.w('hugged') ? 'happy' : 'love').idle(c.t); S.jake.reset().place(1.25, 0.2, -1.1).pose('hug', k).setFace(lt < c.w('hugged') ? 'smile' : 'happy').idle(c.t); ropes.visible = false; } });

  // ───────── BUTTON: the next morning
  shot({ line: 'The next morning, I told Leo everything.', set: school, sfx: [['whoosh', 0, 0.6]], cam: frame(0, 2, { size: 'full', side: 6 }),
    act(lt, c) { D.jake.reset().place(1.6, 2, -0.6).pose('open').setFace(lt < c.w('told') ? 'grin' : 'talk').idle(c.t); if (lt > c.w('told')) D.jake.talk(c.t); D.leo.reset().place(-1.6, 2, 0.6).setFace('neutral').idle(c.t); D.kid.reset().place(-9 + lt * 3, -1, Math.PI / 2).walk(c.t).setFace('smile'); } });
  shot({ line: 'He just stared at me.', set: school, cam: frame(-1.9, 2, { size: 'face', side: 12, push: 0.07 }),
    act(lt, c) { D.leo.reset().place(-1.9, 2, 0.35).setFace(lt < c.w('stared') ? 'neutral' : 'stare'); } });
  shot({ line: 'Then he smiled and said,', set: school, sfx: [['pop', 'smiled', 0.7]], cam: frame(-1.9, 2, { size: 'close', side: -10 }),
    act(lt, c) { D.leo.reset().place(-1.9, 2, 0.2).setFace(lt < c.w('smiled') ? 'stare' : 'creep').idle(c.t, 0.2); } });
  shot({ line: 'I believe you, sweetie.', set: school, sfx: [['pop', 'sweetie'], ['thud', 'sweetie', 0.8]], cam: frame(-1.9, 2, { size: 'face', side: 6, low: 0.35, push: 0.06 }),
    act(lt, c) { D.leo.reset().place(-1.9, 2, 0.1).setFace(lt < c.w('sweetie') + 0.25 ? 'say' : 'creep'); if (lt < c.w('sweetie') + 0.25) D.leo.talk(c.t, 0.5); } });
});
