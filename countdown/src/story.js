// story.js: "The Countdown" (town-story-shorts style).
//
// THE SCRIPT (approved):
//   In this town, everyone has a countdown above their head. Nobody knows where they came from, but everyone knows
//   what happens when yours reaches zero. You disappear. My countdown said eighteen years, so I wasn't worried.
//   But one morning, something strange happened. Everyone's countdown went down by one day, like always. But mine
//   went UP by ten years. I thought it was a glitch, until I noticed something. Nobody else could see my countdown
//   anymore. I ran to the mayor's office and demanded answers. He looked at me and went completely silent. Then he
//   locked the doors. He told me the countdowns weren't counting down to our deaths. They were counting down to the
//   day we were supposed to disappear. I asked him why mine was going up. He looked terrified. Then he whispered,
//   "Because you're not supposed to disappear." Suddenly, every countdown in town changed to zero. Everyone vanished.
//   Everyone except me, and the mayor. Then my phone rang. It was the mayor calling. But he was standing right in
//   front of me, and his phone was still in his pocket. The voice on the phone whispered, "Don't turn around."
import * as THREE from 'three';
import { start, shot, frame, scene, LIGHTS } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, handheld, follow, drone } from './town.js';
import { makeSparkles, makePuff, makeEmote } from './fx.js';
import { room, TEX, windowPane, door, bookshelf, plant } from './sets.js';
import { remap, E, lerp, clamp, box, glow, at, grp, sign, mat, canvasTex, PRE } from './util.js';

// ── the countdown tag: a glowing digital timer floating above a head (a sprite, so it always faces the camera)
function tag(av, base, o = {}) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 150; const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  sp.material.color.setScalar(1.35); sp.scale.set(2.5, 0.73, 1); sp.position.y = o.y || 6.55; av.root.add(sp);
  let cur = null;
  const T = {
    sprite: sp, base, color: o.color || '#ff4a4a',
    set(text, color = T.color) {
      const key = text + color; if (key === cur) return T; cur = key;
      g.clearRect(0, 0, 512, 150);
      g.fillStyle = 'rgba(12,10,22,0.82)'; g.beginPath(); g.roundRect(6, 10, 500, 130, 34); g.fill();
      g.strokeStyle = color; g.lineWidth = 6; g.globalAlpha = 0.85; g.stroke(); g.globalAlpha = 1;
      let size = 92; g.font = `900 ${size}px Montserrat`; while (g.measureText(text).width > 450) { size -= 4; g.font = `900 ${size}px Montserrat`; }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = color; g.shadowBlur = 18; g.fillStyle = color; g.fillText(text, 256, 80);
      g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillText(text, 256, 80);
      tex.needsUpdate = true; return T;
    },
    op(a) { sp.material.opacity = a; return T; },
  };
  PRE.push(() => { sp.visible = true; T.op(1); T.set(T.base, T.color); });
  return T.set(base);
}
const ymd = (y, d) => `${y}Y ${String(d).padStart(3, '0')}D`;
const clock = s => '00:00:' + String(Math.max(0, Math.ceil(s))).padStart(2, '0');
const ghost = (t) => 0.22 + 0.18 * (Math.sin(t * 31) > 0.3 ? 1 : 0);          // my tag after nobody can see it: flickering, faint

// camera helper: kit frame() lifted by dy so the tag above the head stays in the picture
const fr = (x, z, o = {}, dy = 0.7) => { const c = frame(x, z, o); c.pos[1] += dy; c.look[1] += dy; return c; };

start(() => {
  // ── sets
  const night = TOWN.street({ time: 'night', litAll: true });
  const day = TOWN.street({ time: 'day', lit: 0 });
  const office = (() => {
    const g = room({ floorTex: TEX.wood('#5a3a24'), tile: 6, wallColor: '#6e4b3a', trim: '#3e2a20', trimY: 0.6, w: 30, d: 22, h: 12, lights: 0, ceiling: '#21160f' });
    const deskG = grp(at(box(10, 0.35, 3.6, '#4a2c18', 0.06), 0, 3.1, 0), at(box(9.6, 2.9, 3.2, '#5c3720', 0.04), 0, 1.45, -0.1));
    deskG.add(at(sign('MAYOR', 3, 0.7, { bg: '#d9b24a', fg: '#2a1a0c' }), 0, 2.2, 1.55), at(box(1.4, 0.15, 1, '#e8e2d0'), -2.6, 3.35, 0.3), at(box(0.25, 1.6, 0.25, '#2a2a2a'), 3.4, 4, -0.6), at(box(1.6, 0.6, 1.6, glow('#ffe2a8', 1.6)), 3.4, 4.9, -0.6));
    g.add(at(deskG, 0, 0, -1.5));
    g.add(at(windowPane(6, 5, '#9fc7e8'), -6, 7, -5.85), at(bookshelf(5, 8), 9.5, 0, -5.2), at(plant(), -12, 0, -4));
    const pole = grp(at(box(0.18, 9, 0.18, '#d9b24a'), 0, 4.5, 0), at(box(3, 2, 0.06, '#3a6fd6'), 1.6, 7.8, 0)); g.add(at(pole, -11, 0, -3));
    g.add(at(sign(['TOWN OF', 'EVERTON'], 4, 1.6, { bg: '#2a1a12', fg: '#d9b24a', border: '#d9b24a' }), 3, 8.6, -5.85));
    const dr = door('', '#4a2a18'); g.add(at(dr, 14.85, 0, 2, -Math.PI / 2));
    const bolt = box(1.2, 0.35, 0.3, '#c9c9cf', 0.05); g.add(bolt);
    const lamp = new THREE.PointLight('#ffe0b0', 300, 40, 2); lamp.position.set(0, 11, 4); g.add(lamp, at(new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), glow('#fff2d0', 2)), 0, 11.3, 4));
    return { group: g, light: 'warm', bolt, lamp, reset() { bolt.position.set(14.6, 4.2, 3.6); lamp.intensity = 300; } };
  })();

  // ── cast: one copy per set, identical options
  const people = {
    gran: [{ seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true }, 2, 140],
    milo: [{ seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' }, 64, 210],
    dad: [{ seed: 4, skin: 'light', hair: 'short', hairColor: '#5a3a1a', top: 'shirt', topColor: '#5fa86a', bottom: 'jeans', bottomColor: '#2f3f5a', cap: '#2f5fc4' }, 31, 5],
    girl: [{ seed: 5, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' }, 70, 322],
    old: [{ seed: 7, skin: 'light', hair: 'bald', hairColor: '#cfcfcf', top: 'sweater', topColor: '#7a5a3a', bottom: 'plain', bottomColor: '#4a4a52', glasses: true }, 0, 0],
  };
  const cast = (set, office = false) => {
    const me = makeNarrator({ color: '#3553b8', print: 'tick tock' }); set.group.add(me.root);
    const C = { me, meTag: tag(me, ymd(18, 0), { y: 6.9 }), sp: makeSparkles(set.group), puffs: [0, 1, 2, 3, 4, 5].map(i => makePuff(set.group, i + 2)), q: makeEmote(set.group, '?', '#ffd23f') };
    if (office) {
      C.mayor = makeAvatar({ seed: 9, skin: 'fair', hair: 'swoop', hairColor: '#9a9aa2', top: 'suit', topColor: '#262b3f', tie: '#b3202a', bottom: 'plain', bottomColor: '#1f2333', shoe: '#1a1a1a', height: 1.08, face: 'serious' });
      set.group.add(C.mayor.root); C.mayorTag = tag(C.mayor, ymd(41, 90));
      const pp = grp(at(box(0.42, 0.7, 0.1, '#4a4a58', 0.04), 0, 0, 0), at(box(0.34, 0.58, 0.02, '#0a0a0e'), 0, 0, 0.06)); C.mayor.root.add(at(pp, 0.55, 1.75, 0.6)); pp.rotation.z = 0.15; C.pocketPhone = pp;
      // the thing behind me: a tall dark figure with two glowing eyes
      C.shadow = makeAvatar({ seed: 13, skin: '#121218', hair: 'bald', top: 'plain', topColor: '#0c0c10', bottom: 'plain', bottomColor: '#0c0c10', shoe: '#000', sole: '#000', face: 'blank', height: 1.45 });
      for (const s of [-1, 1]) C.shadow.head.add(at(box(0.16, 0.07, 0.04, glow('#ff2a2a', 3)), s * 0.22, 0.68, 0.63));
      set.group.add(C.shadow.root);
      // my phone
      const ph = grp(at(box(0.62, 1.15, 0.1, '#15151a', 0.06), 0, 0, 0));
      const scr = sign(['MAYOR', 'calling...'], 0.52, 1.0, { bg: '#1d6b3a', fg: '#ffffff', glowing: true }); scr.position.z = 0.056; ph.add(scr);
      set.group.add(ph); C.phone = ph; PRE.push(() => { ph.visible = false; });
    } else {
      for (const [k, [opts, y, d]] of Object.entries(people)) { const a = makeAvatar(opts); set.group.add(a.root); C[k] = a; C[k + 'Tag'] = tag(a, ymd(y, d)); }
      C.oldTag.base = clock(3);
    }
    return C;
  };
  const N = cast(night), D = cast(day), O = cast(office, true);
  const NB = ['gran', 'milo', 'dad', 'girl'];
  const vanish = (X, a, i, dt) => { if (dt >= 0) { a.root.visible = false; X.puffs[i].at(dt, [a.root.position.x, 0.5, a.root.position.z]); X.puffs[i].at(dt, [a.root.position.x, 2.5, a.root.position.z]); } };
  const crowdLine = (X, t, faces = ['calm'], walk = 0, lt = 0) => NB.forEach((k, i) => { const x = [-2.2, 0.8, 3.6, 6.2][i] + walk * lt * (i % 2 ? 1 : -1) * 1.6; X[k].reset().place(x, 3.5 + (i % 2) * 1.6, walk ? (i % 2 ? Math.PI / 2 : -Math.PI / 2) : (i - 1.5) * 0.25).setFace(faces[i % faces.length]); walk ? X[k].walk(t, 0.7) : X[k].idle(t); });

  // ── ACT 1: the rule (night)
  shot({ line: 'In this town,', set: night, sfx: [['whoosh', 0]], cam: drone([0, 4, 2], { h: 26, back: 40, drift: [8, -2, -8], fov: 52 }),
    act(lt, c) { crowdLine(N, c.t, ['calm'], 1, lt); N.me.reset().place(4, 4.5, 0.3).idle(c.t); } });
  shot({ line: 'everyone has a countdown above their head.', set: night, cam: { pos: [2, 7, 19], look: [2, 5, 4], fov: 56, blur: 0.1, push: 0.06 },
    act(lt, c) { crowdLine(N, c.t, ['calm', 'smile']); } });
  shot({ line: 'Nobody knows where they came from,', set: night, cam: { pos: [-1.6, 6.6, 9.5], look: [-2, 6.2, 3.5], fov: 44, blur: 0.4, push: 0.09 },
    act(lt, c) { N.gran.reset().place(-2, 3.5, 0.1).setFace('calm').idle(c.t); } });
  shot({ line: 'but everyone knows what happens', set: night, cam: fr(-2, 4, { size: 'close', side: 14 }),
    act(lt, c) { N.dad.reset().place(-2, 4, 0.2).pose('shy').setFace('worried').idle(c.t); N.dadTag.set(ymd(31, 5)); } });
  shot({ line: 'when yours reaches zero.', set: night, sfx: [['tick', 0, 0.7], ['tick', 'zero', 0.9]], cam: fr(13, 4.5, { size: 'close', side: -12, push: 0.1, dist: 1.15 }, 1.2),
    act(lt, c) { N.old.reset().place(13, 4.5, -0.1).setFace(lt < c.w('zero') ? 'worried' : 'shock').idle(c.t, 0.5); N.oldTag.set(clock(2 - lt * 2 / c.w('zero'))); } });
  shot({ line: 'You disappear. //', set: night, sfx: [['pop', 'disappear', 1.1], ['sparkle', 'disappear', 0.6]], cam: fr(13, 4.5, { size: 'medium', side: 10, push: 0.06 }, 0.8),
    act(lt, c) { const v = lt - c.w('disappear') - 0.15; N.old.reset().place(13, 4.5, 0).setFace('scream').pose({ aL: [20, 60], aR: [20, 60] }); N.oldTag.set(clock(0)); vanish(N, N.old, 0, v); N.sp.at(v, [13, 0, 4.5], 1); } });
  shot({ line: 'My countdown said eighteen years,', set: night, cam: fr(4, 4.5, { size: 'close', side: -10 }, 0.9),
    act(lt, c) { N.me.reset().place(4, 4.5, -0.1).setFace('calm').idle(c.t); } });
  shot({ line: "so I wasn't worried.", set: night, cam: fr(4, 4.5, { size: 'medium', side: 16 }, 0.6),
    act(lt, c) { N.me.reset().place(4, 4.5, 0.25).pose('shrug', 0.9).setFace('joy').talk(c.t); } });

  // ── ACT 2: the morning (day)
  shot({ line: 'But one morning,', set: day, sfx: [['whoosh', 0, 0.7]], cam: drone([0, 4, 2], { h: 30, back: 44, drift: [-8, -2, -8], fov: 52 }),
    act(lt, c) { crowdLine(D, c.t, ['calm'], 1, lt); } });
  shot({ line: 'something strange happened.', set: day, cam: follow(lt => [0 + lt * 2.4, 0, 4.5], [-4, 4.4, 9], { lookY: 4.6 }),
    act(lt, c) { D.me.reset().place(0 + lt * 2.4, 4.5, Math.PI / 2 - 0.4).walk(c.t, 0.9).setFace(lt < c.w('strange') ? 'calm' : 'uneasy'); } });
  shot({ line: "Everyone's countdown went down by one day,", set: day, sfx: [['tick', 'down', 0.8]], cam: { pos: [2, 7, 19], look: [2, 5, 4], fov: 56, blur: 0.1, push: 0.06 },
    act(lt, c) { const after = lt >= c.w('down'); crowdLine(D, c.t, ['calm', 'smile']); NB.forEach(k => { const [, y, d] = people[k]; D[k + 'Tag'].set(ymd(y, after ? d - 2 : d - 1)); }); } });
  shot({ line: 'like always.', set: day, cam: fr(-2, 3.5, { size: 'close', side: 12 }),
    act(lt, c) { D.gran.reset().place(-2, 3.5, 0.15).pose('wave', 0.8).setFace('smile').idle(c.t); D.granTag.set(ymd(2, 138)); } });
  shot({ line: 'But mine went UP', set: day, sfx: [['rise', 'up', 0.9]], cam: fr(2, 4.5, { size: 'close', side: -14, push: 0.1 }, 1.0),
    act(lt, c) { const k = E.out(remap(lt, c.w('up'), c.w('up') + 0.55)); D.me.reset().place(2, 4.5, -0.15).setFace(lt < c.w('up') ? 'uneasy' : 'gasp').idle(c.t, 0.5); D.meTag.set(ymd(Math.round(lerp(18, 28, k)), 0), k > 0 ? '#4dff88' : '#ff4a4a'); } });
  shot({ line: 'by ten years.', set: day, sfx: [['ding', 0.1, 0.6]], cam: { pos: [2.6, 7.2, 8.6], look: [2, 6.9, 4.5], fov: 42, blur: 0.5, push: 0.12 },
    act(lt, c) { D.me.reset().place(2, 4.5, 0).setFace('gasp'); D.meTag.set(ymd(28, 0), '#4dff88'); } });
  shot({ line: 'I thought it was a glitch,', set: day, cam: fr(2, 4.5, { size: 'medium', side: 18 }, 0.6),
    act(lt, c) { D.me.reset().place(2, 4.5, 0.3).pose('think').setFace('sus').idle(c.t); D.meTag.set(ymd(28, 0), '#4dff88'); } });
  shot({ line: 'until I noticed something.', set: day, cam: fr(2, 4.5, { size: 'close', side: -8, push: 0.11 }, 0.8),
    act(lt, c) { D.me.reset().place(2, 4.5, -0.1).setFace(lt < c.w('noticed') ? 'calm' : 'uneasy').idle(c.t, 0.5); D.meTag.set(ymd(28, 0), '#4dff88'); } });
  shot({ line: 'Nobody else could see my countdown anymore.', set: day, sfx: [['pop', 'see', 0.6]], cam: { pos: [1.5, 5.8, 17], look: [1.5, 5, 4], fov: 48, blur: 0.3, push: 0.06 },
    act(lt, c) { D.me.reset().place(4, 4.5, -0.5).setFace('worried').idle(c.t); D.meTag.set(ymd(28, 0), '#4dff88').op(ghost(c.t)); D.milo.reset().place(-1, 4.8, 0.9).setFace('sus').lookAt(4, 4.5).idle(c.t); D.q.at(lt - c.w('see'), D.milo); } });

  // ── ACT 3: the mayor
  shot({ line: "I ran to the mayor's office", set: day, sfx: [['whoosh', 0, 0.7]], cam: handheld(follow(lt => [-4 + lt * 9, 0, 4.5], [-5, 3.8, 10], { lookY: 4.4 }), 1.3),
    act(lt, c) { D.me.reset().place(-4 + lt * 9, 4.5, Math.PI / 2 - 0.25).run(c.t).setFace('worried'); D.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88'); } });
  shot({ line: 'and demanded answers.', set: office, sfx: [['thud', 'demanded', 0.8]], cam: { pos: [-7, 6, 14], look: [0, 4.4, 1], fov: 54, blur: 0.15, push: 0.08 },
    act(lt, c) { O.me.reset().place(-3, 4, 0.7).pose('point').setFace('mad').talk(c.t); O.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88'); O.mayor.reset().place(1.5, -4.4, -0.2).setFace('serious').idle(c.t, 0.4); } });
  shot({ line: 'He looked at me', set: office, cam: fr(1.5, -4.4, { size: 'close', side: -16, h: 1.08 }, 0.6),
    act(lt, c) { O.mayor.reset().place(1.5, -4.4, -0.35).setFace('serious').idle(c.t, 0.4); } });
  shot({ line: 'and went completely silent.', set: office, cam: fr(1.5, -4.4, { size: 'face', side: 8, h: 1.08, push: 0.06 }, 0.3),
    act(lt, c) { O.mayor.reset().place(1.5, -4.4, -0.1).setFace('blank'); } });
  shot({ line: 'Then he locked the doors.', set: office, sfx: [['thud', 'locked', 1.2]], cam: { pos: [9.5, 5, 0.2], look: [14.7, 4.3, 3.8], fov: 50, blur: 0.25, push: 0.1 },
    act(lt, c) { const k = E.inOut(remap(lt, c.w('locked'), c.w('locked') + 0.25)); office.bolt.position.set(14.6, 4.2, lerp(4.6, 3.6, k)); O.mayor.reset().place(12.6, 5.6, 2.2).pose({ aR: [85, -5] }).setFace('serious'); } });
  shot({ line: 'He told me the countdowns', set: office, cam: fr(3, 1.5, { size: 'medium', side: -14, h: 1.08 }, 0.5),
    act(lt, c) { office.bolt.position.set(14.6, 4.2, 3.6); O.mayor.reset().place(3, 1.5, -0.5).pose('open', 0.6).setFace('say').talk(c.t); } });
  shot({ line: "weren't counting down to our deaths.", set: office, cam: fr(-2, 3, { size: 'close', side: 14 }, 0.7),
    act(lt, c) { O.me.reset().place(-2, 3, 0.45).setFace('worried').idle(c.t, 0.6); O.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88'); } });
  shot({ line: 'They were counting down to the day', set: office, cam: fr(3, 1.5, { size: 'close', side: -10, h: 1.08, push: 0.09 }, 0.6),
    act(lt, c) { O.mayor.reset().place(3, 1.5, -0.4).setFace('serious').talk(c.t, 0.6); } });
  shot({ line: 'we were supposed to disappear.', set: office, cam: { pos: [3.3, 7.0, 6.8], look: [3, 6.6, 1.5], fov: 42, blur: 0.5, push: 0.1 },
    act(lt, c) { O.mayor.reset().place(3, 1.5, -0.3).setFace('serious'); O.mayorTag.set(lt < c.w('disappear') ? ymd(41, 90) : (Math.floor(c.t * 12) % 2 ? ymd(41, 90) : '??Y ???D')); } });
  shot({ line: 'I asked him why mine was going up.', set: office, cam: fr(-2, 3, { size: 'medium', side: 18 }, 0.7),
    act(lt, c) { O.me.reset().place(-2, 3, 0.6).pose({ aR: [160, 10] }).setFace('say').talk(c.t); O.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88'); } });
  shot({ line: 'He looked terrified.', set: office, sfx: [['fall', 'terrified', 0.7]], cam: fr(3, 1.5, { size: 'close', side: 12, h: 1.08, push: 0.12 }, 0.4),
    act(lt, c) { O.mayor.reset().place(3, 1.5, -0.5).pose('shy').setFace(lt < c.w('terrified') ? 'serious' : 'worried').idle(c.t, 1.6); } });
  shot({ line: 'Then he whispered,', set: office, cam: { pos: [-3.2, 5.8, 10.5], look: [0.8, 4.8, 2.6], fov: 50, blur: 0.3, push: 0.07 },
    act(lt, c) { O.me.reset().place(-0.6, 3.6, 0.9).setFace('worried'); O.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88'); O.mayor.reset().place(2, 2.4, -0.9).pose({ head: [14, 0, 0], lean: [14, 0] }).setFace('worried').talk(c.t, 0.4); } });
  shot({ line: '"Because you\'re not supposed to disappear." //', set: office, cam: fr(2, 2.4, { size: 'face', side: -6, h: 1.08, push: 0.05 }, 0.25),
    act(lt, c) { O.mayor.reset().place(2, 2.4, -0.1).pose({ head: [8, 0, 0] }).setFace(lt < c.w('disappear') + 0.4 ? 'say' : 'shock').talk(c.t, lt < c.w('disappear') + 0.4 ? 0.5 : 0); } });

  // ── ACT 4: zero
  shot({ line: 'Suddenly, every countdown in town', set: day, sfx: [['whoosh', 0, 0.8]], cam: drone([2, 4, 3], { h: 17, back: 27, drift: [4, -2, -5], fov: 52 }),
    act(lt, c) { crowdLine(D, c.t, ['calm'], 1, lt); D.old.reset().place(22, 4, 0).idle(c.t); D.oldTag.base = ymd(55, 12); NB.forEach(k => { const [, y, d] = people[k]; D[k + 'Tag'].set(ymd(y, d - 1)); }); D.oldTag.set(ymd(55, 12)); } });
  shot({ line: 'changed to zero.', set: day, sfx: [['tick', 'zero', 1.2]], cam: { pos: [-1.6, 6.6, 9.5], look: [-2, 6.2, 3.5], fov: 44, blur: 0.4, push: 0.09 },
    act(lt, c) { const z = lt >= c.w('zero'); D.gran.reset().place(-2, 3.5, 0.1).setFace(z ? 'shock' : 'calm'); D.granTag.set(z ? '00:00:00' : ymd(2, 138), z && Math.floor(c.t * 10) % 2 ? '#ffffff' : '#ff4a4a'); } });
  shot({ line: 'Everyone vanished. //', set: day, sfx: [['pop', 'vanished', 1], ['pop', 0.75, 0.8], ['sparkle', 'vanished', 0.7]], cam: { pos: [2, 6.5, 19], look: [2, 4.2, 3.5], fov: 58, blur: 0.1, push: 0.05 },
    act(lt, c) { crowdLine(D, c.t, ['shock', 'scream']); NB.forEach((k, i) => { D[k + 'Tag'].set('00:00:00'); vanish(D, D[k], i, lt - c.w('vanished') - i * 0.12); }); } });
  shot({ line: 'Everyone except me,', set: office, sfx: [['sad', 'me', 0.5]], cam: fr(-1, 3.2, { size: 'close', side: -12 }, 0.7),
    act(lt, c) { O.me.reset().place(-1, 3.2, 0.35).setFace('gasp').idle(c.t, 0.4); O.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88'); } });
  shot({ line: 'and the mayor.', set: office, cam: fr(2.5, 1.2, { size: 'medium', side: 10, h: 1.08, push: 0.08 }, 0.4),
    act(lt, c) { O.mayor.reset().place(2.5, 1.2, -0.3).setFace('blank'); O.mayorTag.sprite.visible = false; } });
  shot({ line: 'Then my phone rang.', set: office, sfx: [['ding', 'rang', 0.9], ['ding', 0.85, 0.7]], cam: { pos: [-1.1, 4.4, 6.0], look: [-1, 3.9, 3.9], fov: 46, blur: 0.6, push: 0.1 },
    act(lt, c) { O.me.reset().place(-1, 3.2, 0.2).pose({ aR: [60, -10] }).setFace('gasp'); const sh = lt > c.w('rang') ? Math.sin(c.t * 70) * 0.04 : 0; O.phone.visible = true; O.phone.position.set(-1.25 + sh, 3.95, 4.2); O.phone.rotation.set(-0.35, 0, sh * 2); } });
  shot({ line: 'It was the mayor calling.', set: office, sfx: [['ding', 0, 0.6]], cam: { pos: [-1.0, 4.25, 5.6], look: [-1.25, 3.95, 4.2], fov: 40, blur: 0.4, push: 0.12 },
    act(lt, c) { O.me.reset().place(-1, 3.2, 0.2).pose({ aR: [60, -10] }).setFace('gasp'); const sh = Math.sin(c.t * 70) * 0.03; O.phone.visible = true; O.phone.position.set(-1.25 + sh, 3.95, 4.2); O.phone.rotation.set(-0.35, 0, sh * 2); } });
  shot({ line: 'But he was standing right in front of me,', set: office, cam: { pos: [-2.6, 5.6, 7.8], look: [2.2, 4.6, 0.6], fov: 50, blur: 0.25, push: 0.06 },
    act(lt, c) { O.me.reset().place(-1.2, 4.2, Math.PI - 0.5).setFace('gasp'); O.mayor.reset().place(2.2, 0.6, -0.35).setFace(lt < 0.9 ? 'blank' : 'smile'); O.mayorTag.sprite.visible = false; } });
  shot({ line: 'and his phone was still in his pocket.', set: office, cam: { pos: [3.8, 3.4, 7.2], look: [2.8, 2.6, 1.2], fov: 48, blur: 0.25, push: 0.1 },
    act(lt, c) { O.mayor.reset().place(2.5, 1.2, -0.3).setFace('smile'); O.mayorTag.sprite.visible = false; } });
  shot({ line: 'The voice on the phone whispered,', set: office, cam: fr(-1, 3.2, { size: 'close', side: 14 }, 0.5),
    act(lt, c) { O.me.reset().place(-1, 3.2, 0.3).pose({ aR: [150, -35] }).setFace('worried').idle(c.t, 0.4); O.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88'); } });
  shot({ line: '"Don\'t turn around." ///', set: office, tail: 1.5, sfx: [['thud', 'around', 1.3]], cam: fr(-1, 3.2, { size: 'close', side: -6, push: 0.08, focus: null }, 0.4),
    act(lt, c) {
      const dark = lt >= c.w('around') + 0.5; office.lamp.intensity = dark ? 0 : 300;
      if (dark) { const B = LIGHTS.blackout; for (const l of scene.children) { if (l.isAmbientLight) l.intensity = B.amb; if (l.isHemisphereLight) l.intensity = B.hemi; if (l.isDirectionalLight) { l.intensity = B.sun; l.color.set(B.sunColor); } } scene.background = new THREE.Color(B.bg); }
      O.me.reset().place(-1, 3.2, 0.1).pose({ aR: [150, -35] }).setFace(dark ? 'shock' : 'worried').idle(c.t, dark ? 0 : 0.4); O.meTag.op(ghost(c.t)).set(ymd(28, 0), '#4dff88');
      O.shadow.reset().place(1.3, -0.6, -0.15).setFace('blank'); O.shadow.root.visible = dark || Math.floor(c.t * 15) % 7 === 0;
    } });
});
