// story.js: "In this town, everybody has a number over their head." (Jake / HUSS!)
// One shot() per picture. `line` = words spoken in that shot (cuts land on its first word).
// '//' after a word = 0.6 s silent hold, '///' = 1.0 s. ALL-CAPS words show in caps (catchphrase).
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, ball, dribble, arc, handheld, follow, whip, drone, makeVeil, goldfishBowl } from './town.js';
import { makeSparkles, makePuff } from './fx.js';
import { chair, bench } from './sets.js';
import { remap, E, lerp, clamp, at, box, glow, PRE } from './util.js';

// ── the number over everyone's head: a glowing billboard that follows an avatar (or any object with .root)
function makeTag(parent) {
  const c = document.createElement('canvas'); c.width = 768; c.height = 160; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  s.visible = false; parent.add(s); PRE.push(() => { s.visible = false; });
  let last = '';
  return {
    show(av, val, o = {}) {
      const text = typeof val === 'number' ? Math.round(val).toLocaleString('en-US') : String(val);
      const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
      const col = o.col || (n < 10 ? '#ff4d4d' : n >= 1e6 ? '#7dffa8' : n < 5000 ? '#ffe46a' : '#ffffff');
      const key = text + col;
      if (key !== last) {
        last = key; g.clearRect(0, 0, 768, 160); let fs = 124; g.font = `900 ${fs}px Montserrat`;
        while (g.measureText(text).width > 700 && fs > 40) { fs -= 4; g.font = `900 ${fs}px Montserrat`; }
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.strokeStyle = '#0d1020'; g.lineWidth = 20; g.strokeText(text, 384, 86); g.fillStyle = col; g.fillText(text, 384, 86); t.needsUpdate = true;
      }
      const sc = av.root.scale.x, p = av.root.position, k = o.size || 1;
      s.position.set(p.x + (o.dx || 0), p.y + (o.y ?? 6.55) * sc, p.z + (o.dz || 0)); s.scale.set(4.8 * 0.8 * k * sc, 0.8 * k * sc, 1);
      s.material.color.setScalar(o.glow ?? 1.35); s.visible = true; return s;
    },
  };
}
// count-up / pop helpers
const count = (lt, t0, t1, a, b) => lerp(a, b, E.in(remap(lt, t0, t1)));
const popK = (lt, t0) => (lt >= t0 ? 1 + 0.6 * (1 - E.out(remap(lt, t0, t0 + 0.22))) : 1);

start(() => {
  // ── sets
  const streetN = TOWN.street({ time: 'night' });
  const streetS = TOWN.street({ time: 'sunset', seed: 6 });
  const streetD = TOWN.street({ time: 'day', seed: 8 });
  const streetL = TOWN.street({ time: 'night', litAll: true, seed: 5 });
  const pool = TOWN.pool();
  const party = TOWN.partyTable({ wall: '#b886b4' });
  const bedroom = TOWN.roomNight({ wall: '#3e4f8f', bed: '#c33a3a', shelf: true });
  const granRoom = TOWN.roomNight({ wall: '#7a4f6f', rug: '#7fc98a', floor: '#7a4a2a' });
  const courtN = TOWN.court({ time: 'night', banner: 'CITY FINALS' });
  const courtS = TOWN.court({ time: 'sunset', banner: 'CITY FINALS' });
  const courtD = TOWN.court({ time: 'day', banner: 'CITY FINALS' });

  // extra props: lawn chairs + a bench under the lamp on the night street, a mirror in the bedroom, grandma's armchair
  for (const S of [streetN, streetL]) { S.group.add(at(chair('#f2b01e', 1.5), -5, 0, 0.5), at(chair('#2b7de0', 1.5), -1.5, 0, 0.5), at(chair('#d9466a', 1.5), 26, 0, 0.5)); }
  streetN.group.add(at(bench('#b9783f'), 12, 0, 2));
  const mirror = new THREE.Group(); mirror.add(at(box(4.8, 7, 0.3, '#d9b33a'), 0, 0, 0), at(box(4.0, 6.2, 0.1, glow('#9fb4d8', 0.9)), 0, 0, 0.2)); bedroom.group.add(at(mirror, 0, 4.8, -5.7));
  const mframe = new THREE.Group(); { const m = '#d9b33a', W = 0.72, H = 1.28, b = 0.16; mframe.add(at(box(W + 2 * b, b, 0.05, m), 0, H / 2 + b / 2, 0), at(box(W + 2 * b, b, 0.05, m), 0, -H / 2 - b / 2, 0), at(box(b, H, 0.05, m), -W / 2 - b / 2, 0, 0), at(box(b, H, 0.05, m), W / 2 + b / 2, 0, 0)); mframe.add(at(box(4, 0.8, 0.05, '#121624'), 0, H / 2 + b + 0.4, 0), at(box(4, 0.8, 0.05, '#121624'), 0, -H / 2 - b - 0.4, 0), at(box(0.8, 4, 0.05, '#121624'), -W / 2 - b - 0.4, 0, 0), at(box(0.8, 4, 0.05, '#121624'), W / 2 + b + 0.4, 0, 0)); }
  mframe.visible = false; bedroom.group.add(mframe); PRE.push(() => { mframe.visible = false; });
  granRoom.group.add(at(chair('#8a4fd0', 1.5), 0, 0, 0));

  // ── cast: one copy per set, identical looks
  const LOOK = {
    tyler: { seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' },
    linda: { seed: 7, skin: 'fair', hair: 'long', hairColor: '#e8c060', top: 'sweater', topColor: '#3fae8a', bottom: 'skirt', bottomColor: '#2f5a7a' },
    gran: { seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true },
    fan1: { seed: 4, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' },
    fan2: { seed: 5, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' },
    fan3: { seed: 8, skin: 'deep', hair: 'short', hairColor: '#111111', top: 'shirt', topColor: '#7ab8ff', bottom: 'slacks', bottomColor: '#333a48' },
    fan4: { seed: 9, skin: 'light', hair: 'ponytail', hairColor: '#7a3a1a', top: 'stripes', topColor: '#ffffff', stripe: '#e94b5f', bottom: 'jeans', bottomColor: '#4f79a7' },
  };
  const cast = (set, names) => {
    const X = {};
    for (const n of names) { X[n] = n === 'me' ? makeNarrator({ color: '#3553b8' }) : makeAvatar(LOOK[n]); set.group.add(X[n].root); }
    X.ball = ball(); X.ball.visible = false; set.group.add(X.ball); PRE.push(() => { X.ball.visible = false; });
    X.sp = makeSparkles(set.group); X.sp2 = makeSparkles(set.group, 5); X.puff = makePuff(set.group); X.veil = makeVeil(set.group);
    X.tag = Array.from({ length: 8 }, () => makeTag(set.group));
    return X;
  };
  const FANS = ['fan1', 'fan2', 'fan3', 'fan4'];
  const SN = cast(streetN, ['me', 'linda', ...FANS]), SS = cast(streetS, ['me', 'tyler']), SD = cast(streetD, ['me', 'tyler']);
  const SL = cast(streetL, ['me', 'tyler', 'linda', 'gran', ...FANS]), PO = cast(pool, FANS), PT = cast(party, []);
  const BR = cast(bedroom, ['me']), GR = cast(granRoom, ['gran']);
  const CN = cast(courtN, ['me', 'tyler']), CD = cast(courtD, ['me', 'tyler']), CS = cast(courtS, ['me', 'tyler', 'linda', 'gran', ...FANS]);
  const bowlP = goldfishBowl(); party.group.add(bowlP); const bowlN = goldfishBowl(); streetN.group.add(bowlN);
  const swim = (b, t) => { b.fish.position.set(Math.sin(t * 1.3) * 0.6, 1.5 + Math.sin(t * 2.1) * 0.15, Math.cos(t * 1.3) * 0.3); b.fish.rotation.y = -Math.cos(t * 1.3) > 0 ? 0 : Math.PI; };
  const bowlTag = b => ({ root: b });
  PRE.push(() => { bowlN.visible = false; });
  const pushup = (av, t, x, z, ry = 0, rate = 7) => { av.reset().place(x, z, ry, 1.15 + Math.abs(Math.sin(t * rate)) * 0.45); av.root.rotation.order = 'YXZ'; av.root.rotation.x = 1.38; av.pose({ aL: [86, 10], aR: [86, 10], head: [-40, 0, 0] }); return av; };

  // ─────────────────────────────── ACT 1: the rule
  // 1 HOOK: drone over the night street, everyone strolling or lounging with a number over their head
  shot({ line: 'In this town, everybody has a number over their head.', set: streetN, sfx: [['whoosh', 0, 0.6]],
    cam: drone([0, 3, 2], { h: 22, back: 30, drift: [6, -3, -8], fov: 52 }),
    act(lt, c) {
      SN.fan1.reset().place(-12 + lt * 2.6, 4.2, Math.PI / 2).walk(c.t, 0.8).setFace('calm'); SN.tag[0].show(SN.fan1, 18250);
      SN.fan2.reset().place(-5, 0.5, 0).sit(1.5).setFace('calm').idle(c.t); SN.tag[1].show(SN.fan2, 22904, { y: 6.3 });
      SN.fan3.reset().place(-1.5, 0.5, 0).sit(1.5).setFace('happy').idle(c.t); SN.tag[2].show(SN.fan3, 15600, { y: 6.3 });
      SN.fan4.reset().place(9 - lt * 2.2, 4.8, -Math.PI / 2).walk(c.t, 0.7).setFace('calm'); SN.tag[3].show(SN.fan4, 27331);
    } });
  // 2 close-up on one stroller under the lamp
  shot({ line: 'Days left to live.', set: streetN,
    cam: frame(4.5, 4.4, { size: 'close', side: -12, low: 0.2, push: 0.08, dist: 1.25 }),
    act(lt, c) { SN.fan1.reset().place(4.5, 4.4, 0.2).setFace('calm').idle(c.t); SN.tag[0].show(SN.fan1, 18250, { size: 0.72 }); } });
  // 3 the consequence: thousands of days, so the whole town just parties by the pool
  shot({ line: 'Most have thousands. Nobody hurries.', set: pool, sfx: [['pop', 'nobody', 0.5]],
    cam: { pos: [-3, 7.5, 21], look: [0, 3.2, 3], fov: 56, blur: 0.15 },
    act(lt, c) {
      PO.fan1.reset().place(-7, 8.5, 0.3).pose('cheer').setFace('joy').idle(c.t); PO.fan1.armL.rotation.z += Math.sin(c.t * 9) * 0.3; PO.tag[0].show(PO.fan1, 18250);
      PO.fan2.reset().place(-2.5, 9.5, -0.2).pose('wave').setFace('happy').idle(c.t); PO.tag[1].show(PO.fan2, 22904);
      PO.fan3.reset().place(7, -3.5, 0.2, -1.2).pose('open', 0.6).setFace('calm').idle(c.t); PO.tag[2].show(PO.fan3, 15600);
      PO.fan4.reset().place(4, 8.8, -0.4).sit(0.4).setFace(lt < c.w('nobody') ? 'calm' : 'sleepy').idle(c.t); PO.tag[3].show(PO.fan4, 27331, { y: 5.6 });
    } });
  // 4 the exception (no number over his head: you can't see your own)
  shot({ line: 'Except me.', set: streetN, sfx: [['pop', 'me', 0.6]],
    cam: frame(-8, 4, { size: 'close', side: -10 }),
    act(lt, c) { SN.me.reset().place(-8, 4, -0.15).setFace(lt < c.w('me') ? 'calm' : 'winkjoy').idle(c.t); } });
  // 5 CATCHPHRASE: low hero angle, night court, dribble
  shot({ line: 'HUSS! HUSS!', set: courtN, sfx: [['thud', 0, 0.6], ['thud', 0.42, 0.6], ['thud', 0.84, 0.6]],
    cam: frame(0, 2, { size: 'full', side: 12, low: 0.45 }),
    act(lt, c) { CN.me.reset().place(0, 2, -0.3).pose({ aR: [40, 10] }).setFace('joy').idle(c.t); dribble(CN.me, CN.ball, c.t); } });
  // 6 name + attitude
  shot({ line: "I'm Jake. I don't waste days.", set: courtN,
    cam: frame(0, 2, { size: 'close', side: -14 }),
    act(lt, c) { CN.me.reset().place(0, 2, 0.1).pose('open', 0.6).setFace(lt < c.w('waste') ? 'say' : 'joy').talk(c.t); } });
  // 7 list: Linda lounging in a lawn chair
  shot({ line: 'Neighbor Linda? Twelve thousand.', set: streetN,
    cam: frame(-5, 0.5, { size: 'medium', side: 28, y: 0.3, low: 0.02 }),
    act(lt, c) { SN.linda.reset().place(-5, 0.5, 0).sit(1.5).pose({ aR: [150, 20] }).setFace('calm').idle(c.t); SN.linda.armR.rotation.z -= Math.sin(c.t * 6) * 0.25; SN.tag[0].show(SN.linda, lt < c.w('twelve') ? '?' : 12000, { y: 6.3, size: popK(lt, c.w('twelve')) }); } });
  // 8 list: grandma in her armchair
  shot({ line: 'Grandma? Nine thousand.', set: granRoom,
    cam: frame(0, 0, { size: 'medium', side: -30, y: 0.3, low: 0.02 }),
    act(lt, c) { GR.gran.reset().place(0, 0, 0).sit(1.5).setFace('sleepy').idle(c.t, 0.5); GR.tag[0].show(GR.gran, lt < c.w('nine') ? '?' : 9000, { y: 6.3, size: popK(lt, c.w('nine')) }); } });
  // 9 list: the planted absurd item, at a party, sitting on a pizza
  shot({ line: "The mayor's goldfish? Forty thousand.", set: party, sfx: [['pop', 'forty', 0.7]],
    cam: { pos: [3, 7, 11], look: [0, 5.2, 0], fov: 50, blur: 0.5, push: 0.1 },
    act(lt, c) { bowlP.position.set(0, 3.06, 0); swim(bowlP, c.t); PT.tag[0].show(bowlTag(bowlP), lt < c.w('forty') ? '?' : 40000, { y: 4.4, size: 0.8 * popK(lt, c.w('forty')) }); } });

  // ─────────────────────────────── ACT 2: the countdown
  // 10 sunset walk home, something's off
  shot({ line: 'But yesterday, I noticed something strange.', set: streetS,
    cam: (lt, s) => follow(l => [2 + l * 2.6, 0, 4.2], [-3, 3.6, 9.5], { lookY: 3.6, blur: 0.35 })(lt),
    act(lt, c) { SS.me.reset().place(2 + lt * 2.6, 4.2, Math.PI / 2 - 0.4).walk(c.t, 0.85).setFace(lt < c.w('strange') ? 'calm' : 'uneasy'); if (lt > c.w('strange')) SS.me.lookAt(14, 4.2); } });
  // 11 best friend, close, tiny red number
  shot({ line: 'My best friend Tyler had three days left.', set: streetS, sfx: [['sad', 'three', 0.5]],
    cam: frame(4, 4.2, { size: 'close', side: 12, push: 0.08, dist: 1.25 }),
    act(lt, c) { SS.tyler.reset().place(4, 4.2, -0.1).setFace('joy').idle(c.t); SS.tag[0].show(SS.tyler, 3, { size: popK(lt, c.w('three')) }); } });
  // 12 warning him: two-shot
  shot({ line: 'I warned him.', set: streetS,
    cam: frame(1, 4.2, { size: 'medium', side: 14, dist: 1.15 }),
    act(lt, c) { SS.me.reset().place(-1, 4.2, 0.9).pose('point').setFace('worried').talk(c.t); SS.tyler.reset().place(3.2, 4.2, -0.9).setFace('calm').idle(c.t); SS.tag[0].show(SS.tyler, 3); } });
  // 13 he laughs it off
  shot({ line: "He laughed. You're crazy, Jake.", set: streetS, sfx: [['pop', 'laughed', 0.5]],
    cam: frame(3.2, 4.2, { size: 'close', side: -18, dist: 1.25 }),
    act(lt, c) { SS.tyler.reset().place(3.2, 4.2, -0.5).pose(lt < c.w("you're") ? 'hips' : 'shrug').setFace(lt < c.w("you're") ? 'laugh' : 'say').talk(c.t, 1.6); SS.tag[0].show(SS.tyler, 3); } });
  // 14 next morning (overcast day), the number drops 3 -> 2 on "two"
  shot({ line: 'Next morning, it dropped to two.', set: streetD, sfx: [['fall', 'dropped', 0.6], ['pop', 'two', 0.8]],
    cam: frame(0, 4.2, { size: 'close', side: 8, low: 0.2, dist: 1.25 }),
    act(lt, c) { SD.tyler.reset().place(0, 4.2, 0).setFace('calm').idle(c.t); SD.tag[0].show(SD.tyler, lt < c.w('two') ? 3 : 2, { size: popK(lt, c.w('two')) }); SD.puff.at(lt - c.w('two'), [0, 6.4, 4.2]); } });
  // 15 panic
  shot({ line: 'I started panicking.', set: streetD,
    cam: frame(-3, 4.2, { size: 'close', side: -16, push: 0.11 }),
    act(lt, c) { SD.me.reset().place(-3, 4.2, 0.2).pose({ aL: [150, 30], aR: [150, 30] }).setFace(lt < c.w('panicking') ? 'worried' : 'gasp').idle(c.t, 2); SD.me.hip.position.x += Math.sin(c.t * 40) * 0.04; } });
  // 16 the mirror (over the shoulder), then a silent hold
  shot({ line: 'Then I looked in the mirror. //', set: bedroom,
    cam: { pos: [2.6, 5.6, 7], look: [0, 4.6, -5.7], fov: 56, blur: 0.4 },
    act(lt, c) { const k = remap(lt, 0, 0.8); BR.me.reset().place(0.8, lerp(3, 0.5, k), Math.PI); if (k < 1) BR.me.walk(c.t, 0.8); else BR.me.idle(c.t, 0.3); } });
  // 17 the reflection: his own number, 1
  shot({ line: 'My number was one. ///', set: bedroom, sfx: [['thud', 'one', 1]],
    cam: { pos: [0.8, 4.5, -4.6], look: [0.8, 4.0, 0.5], fov: 60, blur: 0.3, push: 0.0, to: { pos: [0.8, 4.6, -3.7] }, ease: 'lin' },
    act(lt, c) { BR.me.reset().place(0.8, 0.5, Math.PI).setFace(lt < c.w('one') ? 'calm' : 'gasp'); if (lt < c.w('one')) BR.me.idle(c.t, 0.5); BR.tag[0].show(BR.me, 1, { y: 5.85, size: 0.6 * popK(lt, c.w('one')) });
      mframe.visible = true; mframe.position.copy(c.camera.position); mframe.quaternion.copy(c.camera.quaternion); mframe.translateZ(-1.2); } });

  // ─────────────────────────────── ACT 3: hustle montage
  // 18 resolve
  shot({ line: 'So I did what I do best.', set: bedroom,
    cam: frame(-2, 3, { size: 'close', side: 16, push: 0.08, dist: 1.25 }),
    act(lt, c) { BR.me.reset().place(-2, 3, 0.1).setFace(lt < c.w('best') ? 'serious' : 'smirk').idle(c.t); BR.tag[0].show(BR.me, 1); } });
  // 19 CATCHPHRASE, day court, low hero
  shot({ line: 'HUSS!', set: courtD, sfx: [['thud', 0, 0.6], ['thud', 0.42, 0.6]],
    cam: frame(-6, 2, { size: 'full', side: -14, low: 0.45 }),
    act(lt, c) { CD.me.reset().place(-6, 2, 0.3).pose({ aR: [40, 10] }).setFace('joy').idle(c.t); dribble(CD.me, CD.ball, c.t); CD.tag[0].show(CD.me, 1); } });
  // 20 dragging Tyler onto the court
  shot({ line: 'I dragged Tyler to the court.', set: courtD,
    cam: (lt) => ({ pos: [-9.5 + lt * 3.2, 4.5, 17], look: [-9.5 + lt * 3.2, 3.2, 3], fov: 58, blur: 0.2, push: 0 }),
    act(lt, c) { const x = -9 + lt * 3.2; CD.me.reset().place(x, 3, Math.PI / 2).walk(c.t, 0.9).setFace('joy'); CD.me.armL.rotation.x = -1.4; CD.tyler.reset().place(x - 3.4, 3, Math.PI / 2).walk(c.t, 0.5, 18).pose('slump', 0.7).setFace('sleepy'); CD.tyler.armR.rotation.x = -1.4; CD.tag[0].show(CD.me, 1); CD.tag[1].show(CD.tyler, 2); } });
  // 21 push-ups (day)
  shot({ line: 'Push-ups.', set: courtD,
    cam: { pos: [3.2, 3.8, 12], look: [2.4, 2.0, 0.5], fov: 52, blur: 0.3 },
    act(lt, c) { pushup(CD.tyler, c.t, 0, 0.5, Math.PI / 2).setFace('worried'); CD.tag[1].show(CD.tyler, 2, { y: 3.2, dx: 3.2 }); CD.me.reset().place(-2.5, -2.5, 0.9).pose('hips').setFace('joy').talk(c.t); CD.tag[0].show(CD.me, 1); } });
  // 22 sprints (sunset, long shadows)
  shot({ line: 'Sprints.', set: courtS, sfx: [['whoosh', 0, 0.5]],
    cam: (lt, s) => follow(l => [-10 + l * 14, 0, 2], [5, 2.8, 10], { lookY: 3, blur: 0.15 })(lt),
    act(lt, c) { const x = -10 + lt * 14; CS.tyler.reset().place(x, 2, Math.PI / 2).run(c.t, 1.2).setFace('gasp'); CS.me.reset().place(x - 3, -0.5, Math.PI / 2).run(c.t, 1.2).setFace('joy'); CS.tag[0].show(CS.tyler, 2); CS.tag[1].show(CS.me, 1); } });
  // 23 free throws (night), HUSS! as it drops in
  shot({ line: 'Free throws. HUSS!', set: courtN, sfx: [['whoosh', 'huss', 0.4], ['ding', 'huss', 0.5]],
    cam: { pos: [8, 5.6, 5.5], look: [29, 8.5, 0], fov: 56, blur: 0.1, push: 0.05 },
    act(lt, c) { const t0 = Math.max(0.1, c.w('huss') - 0.55); CN.tyler.reset().place(18, 1, Math.PI / 2).pose(lt < t0 ? { aL: [150, 10], aR: [150, 10] } : 'cheer').setFace(lt < c.w('huss') ? 'serious' : 'joy'); if (lt >= t0) CN.tyler.jump(remap(lt, t0, t0 + 0.4), 0.8); CN.tag[0].show(CN.tyler, 2);
      if (lt < t0) { CN.ball.visible = true; CN.ball.position.set(18.6, 8.2, 1); } else arc(CN.ball, lt, t0, 0.55, [18.6, 8.2, 1], [29, 9.9, 0], 3.5); if (lt > t0 + 0.55) { CN.ball.visible = true; CN.ball.position.set(29, 9.9 - (lt - t0 - 0.55) * 9, 0); } } });
  // 24 the numbers go up (sparkles), both of them
  shot({ line: 'Every time we hustled, our numbers went up.', set: courtN, sfx: [['rise', 'hustled', 0.6], ['sparkle', 'up', 0.8]],
    cam: frame(0, 2, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { const t0 = c.w('hustled'); CN.me.reset().place(-1.6, 2, 0.25).pose('flex').setFace('joy').idle(c.t); CN.tyler.reset().place(1.6, 2, -0.25).pose('flex').setFace(lt < c.w('up') ? 'gasp' : 'joy').idle(c.t);
      CN.tag[0].show(CN.me, count(lt, t0, c.d - 0.15, 1, 480)); CN.tag[1].show(CN.tyler, count(lt, t0, c.d - 0.15, 2, 512)); CN.sp.at(lt - c.w('up'), [-1.6, 0, 2]); CN.sp2.at(lt - c.w('up'), [1.6, 0, 2]); } });

  // ─────────────────────────────── ACT 4: the finals
  const crowd = (X, set, faces, lt, c, nums = [18250, 22904, 15600, 27331, 12000, 9000]) => {
    const bl = set.bleachers, who = [...FANS, 'linda', 'gran'], ks = [0.3, 0.42, 0.55, 0.68, 0.36, 0.62], rows = [0, 1, 0, 1, 2, 2];
    who.forEach((n, i) => { const p = bl.seat(ks[i], rows[i]); const f = typeof faces === 'function' ? faces(i) : faces; X[n].reset().place(p[0], p[2] - 19, 0, p[1]).sit(0).pose(f === 'laugh' ? (i % 2 ? 'point' : 'hips') : f === 'gasp' ? 'idle' : i % 2 ? 'cheer' : 'wave', 0.8).setFace(f).idle(c.t, f === 'gasp' ? 0.2 : 1); X.tag[2 + i].show(X[n], nums[i], { y: 5.1, size: 0.85 }); });
  };
  // 25 drone over the court at sunset, banner, crowd
  shot({ line: 'Then came the city finals.', set: courtS, sfx: [['whoosh', 0, 0.5]],
    cam: drone([0, 2, -6], { h: 30, back: 44, drift: [-8, -4, -8] }),
    act(lt, c) { crowd(CS, courtS, 'joy', lt, c); CS.me.reset().place(-3, 3, 0.6).setFace('calm').idle(c.t); CS.tyler.reset().place(1, 3, -0.4).setFace('calm').idle(c.t); CS.tag[0].show(CS.tyler, 512); CS.tag[1].show(CS.me, 480); courtS.scoreboard.set('GUEST', 0, 'HOME', 0, '10:00'); } });
  // 26 the crowd laughs at their small numbers
  shot({ line: 'Everybody laughed at our tiny numbers.', set: courtS, sfx: [['boing', 'laughed', 0.4]],
    cam: { pos: [0, 4.5, -4], look: [0, 3.6, -20], fov: 58, blur: 0.25 },
    act(lt, c) { crowd(CS, courtS, 'laugh', lt, c); for (const n of [...FANS, 'linda']) CS[n].talk(c.t, 2.5); courtS.scoreboard.set('GUEST', 0, 'HOME', 0, '10:00'); } });
  // 27 Tyler gets the ball
  shot({ line: 'Tyler got the ball.', set: courtS,
    cam: frame(4, 3, { size: 'close', side: -12, dist: 1.25 }),
    act(lt, c) { CS.tyler.reset().place(4, 3, -0.2).pose({ aR: [40, 10] }).setFace(lt < c.w('ball') ? 'serious' : 'smirk').idle(c.t); dribble(CS.tyler, CS.ball, c.t); CS.tag[0].show(CS.tyler, 512); } });
  // 28 action: handheld follow, whip to the hoop, ball in
  shot({ line: 'HUSS!', set: courtS, sfx: [['whoosh', 0.2], ['sparkle', 0.45, 0.7], ['thud', 0, 0.5]],
    cam: (lt, s) => lt < s.d * 0.42 ? handheld(follow(l => [6 + l * 24, 0, 2], [-2, 3.2, 11]), 1.4)(lt, s) : whip([18, 6, 11], [13, 4, 2], [29, 9.9, 0], s.d * 0.42, { dur: s.d * 0.3 })(lt),
    act(lt, c) { const tw = c.d * 0.42, x = 6 + Math.min(lt, tw) * 24; CS.tyler.reset().place(x, 2, Math.PI / 2 - 0.3).run(c.t).setFace('joy'); CS.tag[0].show(CS.tyler, 512); if (lt < tw) dribble(CS.tyler, CS.ball, c.t); else arc(CS.ball, lt, tw, c.d * 0.52, [x + 1, 6, 2], [29, 9.9, 0], 4); courtS.scoreboard.set('GUEST', 38, 'HOME', 48, '0:02'); } });
  // 29 scoreboard insert: fifty points
  shot({ line: 'Fifty points.', set: courtS, sfx: [['ding', 'points']],
    cam: { pos: [17, 14.4, -0.5], look: [29, 14.6, -1.6], fov: 40, blur: 0.15, push: 0.12 },
    act(lt, c) { courtS.scoreboard.set('GUEST', 38, 'HOME', lt < c.w('points') ? 48 : 50, '0:00'); } });
  // 30 silence, shocked fan, hold
  shot({ line: 'The crowd went silent. //', set: courtS,
    cam: frame(-8.8, -18.8, { size: 'close', y: 1.1, side: 10, push: 0.09 }),
    act(lt, c) { crowd(CS, courtS, i => (i === 0 ? 'gasp' : 'gasp'), lt, c); courtS.scoreboard.set('GUEST', 38, 'HOME', 50, '0:00'); } });
  // 31 Tyler's number skyrockets; the camera dives into the hedge at the end (fly-through to act 5)
  shot({ line: "Tyler's number? Ten thousand.", set: courtS, sfx: [['sparkle', 'ten', 0.9], ['whoosh', 1.3, 0.6]],
    cam: (lt, s) => { const k = E.in(remap(lt, s.d - 0.38, s.d)); const b = frame(0, 3, { size: 'close', side: 10, dist: 1.3 }); return { pos: [lerp(b.pos[0], 0.4, k), lerp(b.pos[1], 4.6, k), lerp(b.pos[2], 3.6, k)], look: b.look, fov: 60, blur: 0.7, push: 0.07 }; },
    act(lt, c) { const t0 = c.w('ten'); CS.tyler.reset().place(0, 3, 0).pose(lt < t0 ? 'idle' : 'cheer').setFace(lt < t0 ? 'calm' : 'joy').idle(c.t); if (lt > t0) CS.tyler.jump(remap(lt, t0, t0 + 0.4), 0.6); CS.tag[0].show(CS.tyler, lt < t0 ? 512 : count(lt, t0, t0 + 0.35, 512, 10000), { size: 0.75 * popK(lt, t0 + 0.35) }); CS.sp.at(lt - t0, [0, 0, 3]); CS.veil.at(lt - (c.d - 0.33), c.camera); courtS.scoreboard.set('GUEST', 38, 'HOME', 50, '0:00'); } });

  // ─────────────────────────────── ACT 5: the reversal
  // 32 next night: Jake walks home, the lawn chairs are empty
  shot({ line: 'The next night, something was wrong.', set: streetN,
    cam: (lt) => ({ pos: [2 + lt * 2.2, 4.2, 10], look: [-5.5 + lt * 2.2, 3.2, 2], fov: 56, blur: 0.25, push: 0 }),
    act(lt, c) { SN.me.reset().place(-4 + lt * 2.2, 4.4, Math.PI / 2 - 0.2).walk(c.t, 0.8).setFace(lt < c.w('wrong') ? 'calm' : 'uneasy'); if (lt > c.w('wrong')) SN.me.lookAt(-3, 0); SN.tag[0].show(SN.me, 9000); } });
  // 33 drone: every window lit
  shot({ line: 'Then I heard it from every window.', set: streetL,
    cam: drone([0, 6, -8], { h: 28, back: 44, drift: [6, -2, -8], fov: 54 }),
    act(lt, c) { SL.me.reset().place(-2, 4.4, 0.2).setFace('uneasy').idle(c.t); SL.tag[0].show(SL.me, 9000); } });
  // 34 CATCHPHRASE from the houses; Jake's gasp, hold
  shot({ line: 'HUSS! //', set: streetL, sfx: [['thud', 0, 0.8]],
    cam: frame(-2, 4.4, { size: 'close', side: -14, push: 0.09, dist: 1.25 }),
    act(lt, c) { SL.me.reset().place(-2, 4.4, 0.25).setFace('gasp').idle(c.t, 0.2); SL.tag[0].show(SL.me, 9000, { size: 0.8 }); } });
  // 35 Linda doing push-ups on the lawn, number climbing
  shot({ line: 'Linda, push-ups.', set: streetL, sfx: [['rise', 'push-ups', 0.4]],
    cam: { pos: [-2.4, 3.8, 11.5], look: [-2.6, 2.0, 0.3], fov: 52, blur: 0.3 },
    act(lt, c) { pushup(SL.linda, c.t, -5, 0.3, Math.PI / 2, 8).setFace('angry'); SL.tag[1].show(SL.linda, count(lt, 0, c.d, 12000, 480000), { y: 3.4, dx: 3 }); } });
  // 36 Grandma sprinting down the sidewalk
  shot({ line: 'Grandma, sprints.', set: streetL, sfx: [['whoosh', 0, 0.6]],
    cam: (lt, s) => handheld(follow(l => [10 + l * 12, 0, 4.4], [5, 2.6, 9], { lookY: 3.6 }), 1.2)(lt, s),
    act(lt, c) { SL.gran.reset().place(10 + lt * 12, 4.4, Math.PI / 2).run(c.t, 1.3).setFace('angry'); SL.tag[2].show(SL.gran, count(lt, 0, c.d, 9000, 390000)); } });
  // 37 the whole town: a million days each
  shot({ line: 'Now everybody has a million days.', set: streetL, sfx: [['sparkle', 'million', 0.6]],
    cam: drone([2, 3, 2], { h: 24, back: 32, drift: [-6, -2, -6], fov: 54 }),
    act(lt, c) { const m = c.w('million'); const v = k => (lt < m ? 400000 + k * 37000 : 1000000);
      SL.gran.reset().place(-12 + lt * 9, 4.6, Math.PI / 2).run(c.t, 1.3).setFace('angry'); SL.tag[2].show(SL.gran, v(0));
      pushup(SL.linda, c.t, -5, 0.8, 0.3, 8).setFace('angry'); SL.tag[1].show(SL.linda, v(1), { y: 3.4, dz: 1.2 });
      SL.fan1.reset().place(8 - lt * 8, 4.2, -Math.PI / 2).run(c.t, 1.3).setFace('angry'); SL.tag[3].show(SL.fan1, v(2));
      SL.fan2.reset().place(4, 0.8, 0).pose('flex').setFace('angry'); SL.fan2.jump(Math.abs(Math.sin(c.t * 5)), 0.8); SL.tag[4].show(SL.fan2, v(3));
      pushup(SL.fan3, c.t + 0.3, 10, 0.8, -0.3, 8).setFace('angry'); SL.tag[5].show(SL.fan3, v(4), { y: 3.4, dz: 1.2 });
      SL.tyler.reset().place(-1, 0.8, 0).pose('cheer').setFace('angry'); SL.tyler.jump(Math.abs(Math.sin(c.t * 5 + 1)), 0.8); SL.tag[6].show(SL.tyler, lt < m ? 10000 : 1000000); } });
  // 38 the cost: "which is great" on a laugh
  shot({ line: 'Which is great,', set: streetN,
    cam: frame(-8, 4, { size: 'close', side: 12, dist: 1.25 }),
    act(lt, c) { SN.me.reset().place(-8, 4, -0.1).pose('open', 0.6).setFace('joy').talk(c.t); SN.tag[0].show(SN.me, 1000000, { size: 0.7 }); } });
  // 39 ...alone on the bench
  shot({ line: "except nobody's free anymore.", set: streetN, sfx: [['sad', 'anymore', 0.6]],
    cam: { pos: [12, 4.4, 14], look: [12, 2.8, 2], fov: 54, blur: 0.2, push: 0.06 },
    act(lt, c) { SN.me.reset().place(11, 2.3, 0).sit(1.4).pose('slump', 0.8).setFace('sad').idle(c.t, 0.4); SN.tag[0].show(SN.me, 1000000, { y: 6.5, size: 0.75 }); } });

  // ─────────────────────────────── BUTTON: the goldfish
  // 40 the only one still chilling: the mayor's goldfish on the bench next to him
  shot({ line: "The only one still chilling? The mayor's goldfish.", set: streetN, sfx: [['pop', 'goldfish', 0.7]],
    cam: { pos: [10.5, 4.6, 13], look: [12.3, 3.2, 2.3], fov: 54, blur: 0.25 },
    act(lt, c) { const g = c.w('goldfish'); SN.me.reset().place(11, 2.3, lt < g ? 0 : 0.5).sit(1.4).pose(lt < g ? 'slump' : 'idle', 0.8).setFace(lt < g ? 'sad' : 'calm').idle(c.t, 0.4); SN.tag[0].show(SN.me, 1000000, { y: 6.5, size: 0.75 });
      bowlN.visible = true; bowlN.position.set(13.4, 1.53, 2.3); swim(bowlN, c.t); SN.tag[1].show(bowlTag(bowlN), 40000, { y: 3.9, size: 0.6 }); } });
  // 41 bowl close-up
  shot({ line: 'Forty thousand days. Zero hustle.', set: streetN,
    cam: { pos: [14.4, 4.4, 9.5], look: [13.4, 3.9, 2.3], fov: 50, blur: 0.7, push: 0.1 },
    act(lt, c) { bowlN.visible = true; bowlN.position.set(13.4, 1.53, 2.3); swim(bowlN, c.t * 0.5); SN.tag[1].show(bowlTag(bowlN), 40000, { y: 3.9, size: 0.6 }); } });
  // 42 final: Jake raises the bowl, catchphrase, hard cut
  shot({ line: 'Respect. HUSS!', set: streetN, sfx: [['pop', 'huss', 0.8]],
    cam: frame(12, 2.3, { size: 'full', side: 10, low: 0.3, push: 0.09 }),
    act(lt, c) { const h = c.w('huss'); SN.me.reset().place(11, 2.3, 0.3).sit(1.4).pose(lt < h ? 'idle' : { aR: [165, 20], aL: [10, 6] }, 1).setFace(lt < h ? 'calm' : 'winkjoy').idle(c.t); SN.tag[0].show(SN.me, 1000000, { y: 6.5, size: 0.75 });
      bowlN.visible = true; bowlN.position.set(13.4, 1.53, 2.3); swim(bowlN, c.t); SN.tag[1].show(bowlTag(bowlN), 40000, { y: 3.9, size: 0.6 }); } });
});
