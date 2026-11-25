// story.js: "In my town, every time you tell a lie, you shrink."
// Sets, cast, then one shot() per picture. The spoken script is the shots' `line` strings joined in order.
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, room, TEX, door, bookshelf, plant, building, tree } from './sets.js';
import { makeSparkles, makeBulb, makePuff, makeEmote, grow } from './fx.js';
import { remap, E, lerp, box, at, grp, sign, glow, mat, PRE } from './util.js';

const MAXS = 0.64, BIG = 1.7, TINY = 0.135;   // Max's normal height, Max grown, Tyler at pencil size

// golden ruler: glowing bar with dark tick marks
function ruler() {
  const g = grp(box(0.42, 0.1, 2.8, glow('#ffc928', 1.7)));
  for (let i = 0; i < 9; i++) g.add(at(box(i % 2 ? 0.14 : 0.24, 0.12, 0.05, '#6a4a00'), -0.12 + (i % 2 ? 0.05 : 0), 0.02, -1.2 + i * 0.3));
  return g;
}
function pencil() {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 6), mat('#ffc928')); body.position.y = 0.36;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), mat('#f1c79a')); tip.position.y = 0.73;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 6), mat('#222')); lead.position.y = 0.79;
  const eraser = box(0.12, 0.06, 0.12, '#ff8fa8'); eraser.position.y = 0.03; const band = box(0.13, 0.04, 0.13, '#c9c9cf'); band.position.y = 0.07;
  for (const m of [body, tip]) m.castShadow = true; return grp(body, tip, lead, eraser, band);
}
function chest() { // wooden box with a lid that hinges at the back
  const lid = grp(at(box(2.6, 0.4, 1.7, '#9a5d2c', 0.06), 0, 0.2, 0.85), at(box(0.4, 0.3, 0.12, '#e8c24a'), 0, 0.05, 1.72)); lid.position.set(0, 1.4, -0.85);
  const g = grp(at(box(2.6, 1.4, 1.7, '#b06a32', 0.06), 0, 0.7, 0), at(box(2.7, 0.18, 1.8, '#e8c24a'), 0, 1.0, 0), lid);
  const r = ruler(); r.position.set(0, 1.2, 0); r.rotation.y = 0.15; g.add(r); g.userData = { lid, ruler: r }; return g;
}

start(() => {
  // ── sets
  const town = SETS.street({ shops: [['CANDY', '#ffd0e4', '#e8458b'], ['TOYS', '#bfe3ff', '#2f7de1'], ['PIZZA', '#fff0b8', '#e8632b'], ['GAMES', '#d6f2c4', '#2e9e59'], ['PETS', '#e4d0ff', '#7b3fc4']] });
  const school = SETS.schoolFront({ name: 'TRUTH VALLEY SCHOOL' });
  const cls = SETS.classroom({ board: ['MATH TEST', '7 x 8 = ?'] });
  cls.reset = () => { cls.desks.visible = false; };
  const tPencil = pencil(); cls.group.add(at(tPencil, -1.0, 0, 1.25)); PRE.push(() => { tPencil.visible = false; });

  const garage = { group: room({ floorTex: TEX.concrete('#a9abb2'), tile: 5, wallColor: '#c7ccd6', trim: '#e8632b', trimY: 4, ceiling: '#8d929c', w: 34, d: 24, lights: 1 }), light: 'indoor' };
  const box1 = chest(); garage.group.add(at(box1, 0, 0, -1.5));
  garage.group.add(at(box(12, 4, 7, '#d93b3b', 0.6), -11, 2.4, -1.5), at(box(8, 2.6, 5.6, '#b82d2d', 0.6), -11.5, 5.4, -1.5),
    ...[[-15, 1.5], [-7, 1.5], [-15, -4.5], [-7, -4.5]].map(p => at(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 18), mat('#1b1c20')).rotateX(Math.PI / 2), p[0], 1.1, p[1] + 0.3)),
    at(bookshelf(5, 6), 10, 0, -5), at(sign(['KEEP', 'OUT!'], 3, 2.2, { bg: '#ffd400', fg: '#1b1b1b', border: '#1b1b1b' }), 4, 8, -5.85), at(sign('TYLER\'S STUFF', 4.4, 1, { bg: '#2f7de1', fg: '#fff' }), 0, 4.2, -5.85));
  garage.reset = () => { box1.userData.lid.rotation.x = 0; box1.userData.ruler.visible = true; };

  // ── cast: identical options in every set
  const OPT = {
    max: { seed: 1, skin: 'light', hair: 'messy', hairColor: '#6b3d1f', top: 'hoodie', topColor: '#f26a1b', bottom: 'jeans', bottomColor: '#3f64a8', height: MAXS },
    tyler: { seed: 2, skin: 'light', hair: 'swoop', hairColor: '#2a1a10', top: 'jersey', topColor: '#2f7de1', number: '1', bottom: 'joggers', bottomColor: '#1d1f26' },
    teach: { seed: 3, skin: 'deep', hair: 'bob', hairColor: '#17110f', top: 'cardigan', topColor: '#2e9e59', inner: '#f4f1ea', sleeves: 'long', bottom: 'slacks', bottomColor: '#3a4a6b', shoe: '#2a2a30', sole: '#111', glasses: true },
    amy: { seed: 4, skin: 'tan', hair: 'ponytail', hairColor: '#3a2212', top: 'stripes', topColor: '#ff7aa8', stripe: '#ffffff', bottom: 'skirt', bottomColor: '#5b3fa0' },
    ben: { seed: 5, skin: 'brown', hair: 'curly', hairColor: '#17110f', top: 'tee', topColor: '#2ebd5a', bottom: 'shorts', bottomColor: '#25427a' },
    zoe: { seed: 6, skin: 'fair', hair: 'buns', hairColor: '#e8b04a', top: 'dress', topColor: '#9b59d6', bottom: 'skirt', bottomColor: '#9b59d6' },
    guy: { seed: 7, skin: 'tan', hair: 'buzz', hairColor: '#2a1a10', top: 'vest', topColor: '#f2b01e', sleeves: 'long', bottom: 'cargo', bottomColor: '#5b5f44', cap: '#e8413c' },
  };
  const cast = set => {
    const c = {}; for (const [k, o] of Object.entries(OPT)) { c[k] = makeAvatar(o); set.group.add(c[k].root); }
    for (const k of ['max', 'tyler']) { const r = ruler(); r.position.set(0, -0.1, 0.9); c[k].handR.add(r); c[k].ruler = r; PRE.push(() => { r.visible = false; }); }
    return { ...c, sp: makeSparkles(set.group), sp2: makeSparkles(set.group, 9), bulb: makeBulb(set.group), puff: makePuff(set.group), bang: makeEmote(set.group, '!'), q: makeEmote(set.group, '?', '#2f7de1') };
  };
  const T = cast(town), S = cast(school), C = cast(cls), G = cast(garage);
  // classroom line-up (standing in front of the board, facing camera)
  const X = { teach: -9, amy: -5.5, tyler: -1.5, max: 3, ben: 7, zoe: 10.5 }, Z = 1;
  const kids = (lt, c, face, o = {}) => { for (const k of ['amy', 'ben', 'zoe']) { const a = C[k].reset().place(X[k], Z + (k === 'ben' ? -0.6 : 0), k === 'amy' ? 0.25 : -0.25).setFace(typeof face === 'function' ? face(k) : face).idle(c.t); if (o.laugh) { a.hip.position.y += Math.abs(Math.sin(c.t * 9 + X[k])) * 0.18; a.pose({ aL: [30, 20], aR: [30, 20] }, 0.8); } if (o.gasp) a.pose({ aL: [130, -20], aR: [130, -20] }, remap(lt, o.gasp, o.gasp + 0.15)); } };

  // ───────── HOOK: the town rule
  shot({ line: 'In my town,', set: town, sfx: [['whoosh', 0]], cam: { pos: [2, 4.6, 26], look: [0, 6, 0], fov: 60, blur: 0.1, push: 0.03 },
    act(lt, c) { T.guy.reset().place(-6 + lt * 4.5, 3, Math.PI / 2).walk(c.t).setFace('grin'); T.amy.reset().place(7, 1.5, -0.4).setFace('smile').idle(c.t); T.ben.reset().place(3, 2, 0.2).setFace('grin').idle(c.t); } });
  shot({ line: 'every time you tell a lie,', set: town, sfx: [['pop', 'lie', 0.7]], cam: frame(3, 2, { size: 'medium', side: 12 }),
    act(lt, c) { T.ben.reset().place(3, 2, 0.1).pose('open', 0.7).setFace(lt < c.w('lie') ? 'say' : 'smug').idle(c.t); if (lt < c.w('lie')) T.ben.talk(c.t); } });
  shot({ line: 'you shrink.', set: town, sfx: [['fall', 'shrink'], ['sparkle', 'shrink', 0.8]], cam: frame(3, 2, { size: 'full', side: 8, push: 0.02 }),
    act(lt, c) { T.ben.reset().place(3, 2, 0.1).idle(c.t); grow(T.ben, T.sp, lt, c.w('shrink'), 1, 0.5, 'shock'); } });
  shot({ line: 'Tell the truth,', set: town, cam: frame(3, 2, { size: 'close', h: 0.5, side: -10 }),
    act(lt, c) { T.ben.reset().size(0.5).place(3, 2, 0.1).pose('open', 0.6).setFace('say').talk(c.t).idle(c.t); } });
  shot({ line: 'and you grow back.', set: town, sfx: [['rise', 'grow'], ['sparkle', 'grow']], cam: frame(3, 2, { size: 'full', side: -6, push: 0.02 }),
    act(lt, c) { T.ben.reset().place(3, 2, 0.1).idle(c.t); grow(T.ben, T.sp, lt, c.w('grow'), 0.5, 1, 'grin'); } });

  // ───────── MAX + TYLER
  shot({ line: 'My name is Max,', set: school, sfx: [['pop', 'max', 0.6]], cam: frame(0, 3, { size: 'medium', h: MAXS, dist: 1.25, side: 8 }),
    act(lt, c) { S.max.reset().size(MAXS).place(0, 3, 0).pose('open').setFace(lt < c.w('max') ? 'smile' : 'grin').idle(c.t); if (lt > c.w('max')) { S.max.pose('wave', remap(lt, c.w('max'), c.w('max') + 0.15)); S.max.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } } });
  shot({ line: 'and I was the shortest kid in school.', set: school, sfx: [['sad', 'shortest', 0.6]], cam: frame(0, 3, { size: 'full', side: -6 }),
    act(lt, c) { S.max.reset().size(MAXS).place(0, 3, 0).setFace(lt < c.w('shortest') ? 'smile' : 'sad').idle(c.t); if (lt > c.w('shortest')) S.max.pose('slump', remap(lt, c.w('shortest'), c.w('shortest') + 0.2));
      S.amy.reset().place(-2.8, 2.6, 0.3).setFace('smile').idle(c.t); S.ben.reset().place(2.8, 2.6, -0.3).setFace('grin').idle(c.t); } });
  shot({ line: 'Not because I lied.', set: school, cam: frame(0, 3, { size: 'close', h: MAXS, dist: 1.25, side: 14 }),
    act(lt, c) { S.max.reset().size(MAXS).place(0, 3, 0.2).setFace('serious').idle(c.t); S.max.head.rotation.y += Math.sin(c.t * 12) * 0.25 * (lt < c.w('lied') + 0.4 ? 1 : 0); } });
  shot({ line: 'Because my brother Tyler lied about me.', set: school, sfx: [['thud', 'tyler']], cam: frame(-1, 2, { size: 'medium', side: -12, low: 0.3 }),
    act(lt, c) { S.tyler.reset().place(-1, 2, 0.1).pose('hips').setFace(lt < c.w('tyler') ? 'neutral' : 'smug').idle(c.t); } });
  shot({ line: 'He told everyone I cheated on the math test.', set: cls, sfx: [['pop', 'cheated']], cam: { pos: [-0.4, 5.6, 17], look: [-0.4, 4.6, 0], fov: 60, blur: 0.15, push: 0.02 },
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0.35).pose('open', 0.7).setFace('say').talk(c.t).idle(c.t); if (lt > c.w('cheated')) { C.tyler.setFace('smug').pose({ aL: [88, 0] }, remap(lt, c.w('cheated'), c.w('cheated') + 0.15)); C.tyler.root.rotation.y = 0.9; }
      C.max.reset().size(MAXS).place(X.max, Z, -0.3).setFace(lt < c.w('cheated') ? 'neutral' : 'shock').idle(c.t); kids(lt, c, 'neutral'); } });
  shot({ line: 'The whole class laughed.', set: cls, sfx: [['pop', 'laughed', 0.7]], cam: { pos: [3, 5.2, 16], look: [3, 3.8, 0], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { const l = lt > c.w('laughed'); kids(lt, c, l ? 'laugh' : 'smile', { laugh: l }); C.max.reset().size(MAXS).place(X.max, Z, 0).setFace('cry').idle(c.t); } });
  shot({ line: "But Tyler didn't shrink.", set: cls, cam: frame(X.tyler, Z, { size: 'full', side: 10 }),
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0.1).pose('hips').setFace('smug').idle(c.t); } });
  shot({ line: 'Not even a little.', set: cls, sfx: [['tick', 'little']], cam: frame(X.tyler, Z, { size: 'face', side: -8, push: 0.06 }),
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0).setFace('smug'); } });
  shot({ line: "That's weird, I thought.", set: cls, sfx: [['pop', 'weird']], cam: frame(X.max, Z, { size: 'close', h: MAXS, dist: 1.25, side: 14 }),
    act(lt, c) { C.max.reset().size(MAXS).place(X.max, Z, -0.2).pose('hips').setFace('sus').idle(c.t); C.q.at(lt - c.w('weird'), C.max, 3); } });
  shot({ line: 'Everyone shrinks when they lie.', set: cls, cam: frame(X.max, Z, { size: 'face', h: MAXS, dist: 1.25, side: -12, push: 0.05 }),
    act(lt, c) { C.max.reset().size(MAXS).place(X.max, Z, 0.1).setFace('serious').idle(c.t); } });

  // ───────── THE GARAGE
  shot({ line: 'So I followed him home.', set: town, sfx: [['whoosh', 0, 0.6]], cam: { pos: [6, 4, 16], look: [6, 3.4, 2], fov: 60, blur: 0.15, push: 0, to: { pos: [-2, 4, 16], look: [-2, 3.4, 2] }, ease: 'lin' },
    act(lt, c) { T.tyler.reset().place(4 - lt * 3.8, 2, -Math.PI / 2).walk(c.t).setFace('smug'); T.max.reset().size(MAXS).place(10 - lt * 3.8, 3, -Math.PI / 2).walk(c.t, 0.8, 20).setFace('sus'); T.max.hip.position.y -= 0.3; } });
  shot({ line: 'He went into the garage', set: garage, cam: { pos: [6, 4.5, 15], look: [2, 3.6, 0], fov: 60, blur: 0.2, push: 0.03 },
    act(lt, c) { G.tyler.reset().place(6.5 - lt * 3.5, 3, -Math.PI * 0.62).walk(c.t).setFace('neutral'); } });
  shot({ line: 'and opened a secret box.', set: garage, sfx: [['thud', 'opened'], ['pop', 'box', 0.6]], cam: { pos: [-3.2, 5.4, 7.5], look: [1, 2.2, -0.6], fov: 60, blur: 0.25, push: 0.03 },
    act(lt, c) { const k = E.out(remap(lt, c.w('opened'), c.w('opened') + 0.5)); box1.userData.lid.rotation.x = -k * 1.9; G.tyler.reset().place(2.3, 0.4, -2.25).pose('reach', 0.6 + 0.4 * k).setFace('smug'); } });
  shot({ line: 'Inside was a glowing golden ruler.', set: garage, sfx: [['sparkle', 'glowing'], ['ding', 'ruler', 0.5]], cam: { pos: [1.2, 4.4, 3.8], look: [0, 1.25, -1.5], fov: 55, blur: 0.8, push: 0.06 },
    act(lt, c) { box1.userData.lid.rotation.x = -1.9; G.sp.at(lt - c.w('glowing'), [0, -1.5, -1.3], 0.55); } });
  shot({ line: 'Every time he lied,', set: garage, cam: frame(0, 2, { size: 'medium', side: -14 }),
    act(lt, c) { box1.userData.lid.rotation.x = -1.9; box1.userData.ruler.visible = false; G.tyler.reset().place(0, 2, 0.2).pose('open', 0.6).setFace('smug').talk(c.t).idle(c.t); G.tyler.ruler.visible = true; } });
  shot({ line: 'he touched it,', set: garage, sfx: [['sparkle', 'touched', 0.6]], cam: frame(0, 2, { size: 'close', side: 10 }),
    act(lt, c) { box1.userData.lid.rotation.x = -1.9; box1.userData.ruler.visible = false; G.tyler.reset().place(0, 2, 0.1).pose({ aR: [70, -10], aL: [60, -30] }).setFace(lt < c.w('touched') ? 'smug' : 'grin').idle(c.t); G.tyler.ruler.visible = true; G.sp.at(lt - c.w('touched'), [0, 0, 2.6], 0.6); } });
  shot({ line: 'and stayed the same size.', set: garage, cam: frame(0, 2, { size: 'full', side: -6, push: 0.02 }),
    act(lt, c) { box1.userData.lid.rotation.x = -1.9; box1.userData.ruler.visible = false; G.tyler.reset().place(0, 2, 0).pose('hips').setFace('smug').idle(c.t); G.tyler.ruler.visible = true; } });
  shot({ line: 'I grabbed the ruler and ran.', set: garage, sfx: [['pop', 'grabbed'], ['whoosh', 'ran']], cam: { pos: [4.5, 3.4, 10], look: [2.2, 2.2, 0], fov: 60, blur: 0.2, push: 0.02 },
    act(lt, c) { box1.userData.lid.rotation.x = -1.9; box1.userData.ruler.visible = lt < c.w('grabbed'); const r = lt - c.w('ran');
      if (r < 0) { G.max.reset().size(MAXS).place(1.2, 1.2, Math.PI * 0.9).pose('reach', 0.7).setFace('sus'); if (lt > c.w('grabbed')) { G.max.ruler.visible = true; G.max.setFace('grin'); } }
      else { G.max.reset().size(MAXS).place(1.2 + r * 9, 1.2 + r * 2, Math.PI / 2).run(c.t).setFace('grin').pose({ aR: [100, 0] }); G.max.ruler.visible = true; G.puff.at(r, [1.2, 0, 1.2]); } } });

  // ───────── THE NEXT DAY
  shot({ line: 'The next day at school,', set: school, sfx: [['whoosh', 0, 0.7]], cam: { pos: [0, 9, 34], look: [0, 7, -6], fov: 60, blur: 0.05, push: 0.05 },
    act(lt, c) { S.ben.reset().place(-6 + lt * 3, 3, Math.PI / 2).walk(c.t).setFace('grin'); S.zoe.reset().place(8 - lt * 3, 4, -Math.PI / 2).walk(c.t).setFace('smile'); } });
  shot({ line: 'Tyler stood up and said,', set: cls, cam: frame(X.tyler, Z, { size: 'medium', side: 12 }),
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0.1).setFace('smug').idle(c.t); C.tyler.jump(remap(lt, c.w('stood'), c.w('stood') + 0.35), 0.4); C.tyler.pose('open', remap(lt, c.w('said') - 0.2, c.w('said'))); } });
  shot({ line: 'Max is a cheater.', set: cls, sfx: [['pop', 'cheater']], cam: frame(X.tyler, Z, { size: 'close', side: -10 }),
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0.25).pose('point').setFace('say').talk(c.t).idle(c.t); } });
  shot({ line: 'Suddenly he shrank.', set: cls, sfx: [['fall', 'shrank'], ['sparkle', 'shrank']], cam: frame(X.tyler, Z, { size: 'full', side: 6, push: 0.01 }),
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0.1).idle(c.t); grow(C.tyler, C.sp, lt, c.w('shrank'), 1, 0.55, 'shock'); } });
  shot({ line: 'And shrank.', set: cls, sfx: [['fall', 'shrank'], ['sparkle', 'shrank', 0.7]], cam: frame(X.tyler, Z, { size: 'full', h: 0.55, side: -6, push: 0.01 }),
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0).idle(c.t); grow(C.tyler, C.sp, lt, c.w('shrank'), 0.55, 0.28, 'worried'); } });
  shot({ line: 'Until he was the size of a pencil.', set: cls, sfx: [['fall', 'until', 0.7], ['pop', 'pencil']], cam: frame(X.tyler, Z, { size: 'full', h: 0.22, side: 14, low: 0.05, blur: 0.6 }),
    act(lt, c) { tPencil.visible = true; C.tyler.reset().place(X.tyler, Z, 0.1); grow(C.tyler, C.sp, lt, c.w('until'), 0.28, TINY, 'worried'); } });
  shot({ line: 'The whole class gasped.', set: cls, sfx: [['pop', 'gasped', 0.7]], cam: { pos: [3, 5.2, 16], look: [3, 3.8, 0], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { const g = c.w('gasped'); kids(lt, c, () => lt < g ? 'neutral' : 'shock', { gasp: g }); C.teach.reset().place(X.teach, -1, 0.4).setFace(lt < g ? 'neutral' : 'wow').idle(c.t); C.max.reset().size(MAXS).place(X.max, Z, -0.2).setFace('smirk').idle(c.t); } });
  shot({ line: 'Then I said, I never cheated.', set: cls, cam: frame(X.max, Z, { size: 'close', h: MAXS, dist: 1.25, side: -14 }),
    act(lt, c) { C.max.reset().size(MAXS).place(X.max, Z, -0.2).pose('open', 0.6).setFace(lt < c.w('never') ? 'smirk' : 'say').idle(c.t); if (lt > c.w('never')) C.max.talk(c.t); } });
  shot({ line: 'And I grew taller than everyone.', set: cls, sfx: [['rise', 'grew'], ['sparkle', 'grew'], ['boing', 'taller', 0.5]], cam: { pos: [4.4, 1.6, 15], look: [3, 5.4, 0], fov: 60, blur: 0.15, push: 0.01 },
    act(lt, c) { C.max.reset().place(X.max, Z, -0.1).idle(c.t); grow(C.max, C.sp, lt, c.w('grew'), MAXS, BIG, 'grin'); if (lt > c.w('grew') + 0.5) C.max.pose('flex', remap(lt, c.w('grew') + 0.5, c.w('grew') + 0.7));
      kids(lt, c, 'wow'); } });
  shot({ line: 'Tyler squeaked, Okay, okay, I lied!', set: cls, sfx: [['pop', 'squeaked'], ['pop', 'lied', 0.6]], cam: frame(X.tyler, Z, { size: 'close', h: TINY, side: 8, low: 0.05, blur: 0.6 }),
    act(lt, c) { tPencil.visible = true; C.tyler.reset().size(TINY).place(X.tyler, Z, 0.1).pose(lt < c.w('okay') ? 'shy' : 'cheer').setFace(lt < c.w('okay') ? 'cry' : 'say').idle(c.t); if (lt > c.w('okay')) C.tyler.talk(c.t, 1.5); C.tyler.hip.position.y += Math.abs(Math.sin(c.t * 11)) * 0.25 * (lt > c.w('okay') ? 1 : 0); } });
  shot({ line: 'And he grew back.', set: cls, sfx: [['rise', 'grew'], ['sparkle', 'grew']], cam: frame(X.tyler, Z, { size: 'full', side: -8, push: 0.01 }),
    act(lt, c) { C.tyler.reset().place(X.tyler, Z, 0.1).idle(c.t); grow(C.tyler, C.sp, lt, c.w('grew'), TINY, 1, 'happy'); } });

  // ───────── BUTTON: the teacher
  shot({ line: 'Then the teacher looked at me and asked,', set: cls, cam: frame(X.teach, -1, { size: 'medium', side: 14 }),
    act(lt, c) { C.teach.reset().place(X.teach, -1, 0.5).pose('hips').setFace(lt < c.w('looked') ? 'neutral' : 'sus').idle(c.t); } });
  shot({ line: 'Max, where did you get that ruler?', set: cls, sfx: [['tick', 'ruler']], cam: frame(X.teach, -1, { size: 'close', side: -10 }),
    act(lt, c) { C.teach.reset().place(X.teach, -1, 0.45).pose('point', remap(lt, c.w('ruler') - 0.2, c.w('ruler'))).setFace('say').talk(c.t).idle(c.t); } });
  shot({ line: 'I said, I found it.', set: cls, cam: frame(X.max, Z, { size: 'close', h: BIG, dist: 1.25, side: 12 }),
    act(lt, c) { C.max.reset().size(BIG).place(X.max, Z, -0.3).pose({ aR: [70, -10] }).setFace(lt < c.w('found') ? 'smirk' : 'say').idle(c.t); C.max.ruler.visible = true; if (lt > c.w('found')) C.max.talk(c.t); } });
  shot({ line: 'And I shrank.', set: cls, sfx: [['fall', 'shrank'], ['sparkle', 'shrank'], ['sad', 'shrank', 0.5]], cam: frame(X.max, Z, { size: 'full', h: 0.9, side: -6, push: 0.01 }),
    act(lt, c) { C.max.reset().place(X.max, Z, 0).idle(c.t); C.max.ruler.visible = true; const done = lt > c.w('shrank') + 0.5; grow(C.max, C.sp, lt, c.w('shrank'), BIG, 0.3, done ? 'cry' : 'shock'); } });
});
