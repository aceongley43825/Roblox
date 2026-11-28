// story.js: "In this town, every time you tell a lie, your legs get longer." (town-story-shorts style)
//
// THE SCRIPT (approved):
//   In this town, every time you tell a lie, your legs get longer. The only way to shrink back down is to tell the
//   truth. That's why the mailman is twelve feet tall, and why the mayor has to duck under the stoplights. My name is
//   Sam, and I had never told a single lie, so my legs were normal. Then one morning, my little sister Ruby kicked her
//   soccer ball into Mom's favorite vase. She grabbed my arm and begged me, Please don't tell. So when Mom asked, Sam,
//   do you know who did this, I said, No idea. [hold] My legs shot up two feet. Mom stared at me. Ruby stared at me.
//   I said, It's just a growth spurt. Another foot. By dinner, I was bumping my head on the ceiling fan, and that
//   night I had to sleep with my feet out the window. The next morning, I told Mom the truth. My legs shrank back
//   down. Mom hugged me. Then she turned to Ruby and asked, Is that true? Ruby said, Nope. And her legs grew so long,
//   she stepped right over the house. [hold]
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, skyDome, hills, house, arc, handheld, follow, drone } from './town.js';
import { TEX, floor, room, counter, table, windowPane, bed, tree, bush, lampPost } from './sets.js';
import { makeSparkles, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, glow, at, grp, mat, canvasTex, PRE } from './util.js';

// ── leg length. L = 1 is normal; legs pivot at the hip, so stretching them means raising the hip by the extra length.
const legs = (av, L) => { av.legL.scale.y = av.legR.scale.y = L; av.hip.position.y += 2 * (L - 1); return av; };
// the lie beat: face snaps to a scream, arms flare, legs stretch from -> to with an overshoot, sparkles at the feet
function growLegs(av, sp, lt, t0, from, to, restFace = 'gasp', dur = 0.45) {
  const dt = lt - t0; if (dt < 0) { legs(av, from); return from; }
  const L = lerp(from, to, E.back(remap(dt, 0.04, dur))); legs(av, L);
  if (dt < 0.5) { av.setFace(to > from ? 'scream' : 'wow'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.5) * Math.PI)); } else av.setFace(restFace);
  if (sp) sp.at(dt, av.root.position.toArray(), av.root.scale.x * (1 + Math.max(from, to) * 0.25)); return L;
}
// a camera framed on a character whose legs are L long (everything above the hip is raised by 2(L-1))
const F = (x, z, L, s, o = {}) => frame(x, z, { ...o, y: (o.y || 0) + 2 * (L - 1) * s });

start(() => {
  // ── props
  const soccerTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#f6f6f6'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1b1f'; for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { const x = i * 32 + (j % 2) * 16 + 8, y = 20 + j * 44; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); } g.fill(); } });
  const soccer = () => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 14), new THREE.MeshLambertMaterial({ map: soccerTex })); b.castShadow = true; return b; };
  const vaseTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2f62c9'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f4f1ea'; g.lineWidth = 7; for (let y = 50; y < h; y += 64) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x / 20) * 12); g.stroke(); } g.fillStyle = '#f4f1ea'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(20 + i * 44, 82, 9, 0, 7); g.fill(); } });
  const vase = () => { const p = [[0.01, 0], [0.5, 0.05], [0.9, 0.5], [1.0, 1.0], [0.85, 1.6], [0.45, 2.0], [0.4, 2.5], [0.62, 2.75]].map(([x, y]) => new THREE.Vector2(x, y)); const m = new THREE.Mesh(new THREE.LatheGeometry(p, 32), new THREE.MeshLambertMaterial({ map: vaseTex, side: THREE.DoubleSide })); m.castShadow = true; return grp(m); };
  const shards = () => { const g = grp(); [[0, 0, 0.5, 0.3], [0.9, 0.5, 0.4, 1.1], [-0.8, 0.9, 0.35, 2.2], [0.4, 1.6, 0.45, 0.7], [-1.4, -0.2, 0.3, 1.7], [1.6, 1.4, 0.3, 2.8], [-0.3, 2.3, 0.25, 0.4]].forEach(([x, z, s, r], i) => { const b = box(s * 1.6, 0.14, s, mat(i % 2 ? '#2f62c9' : '#f4f1ea')); b.position.set(x, 0.08, z); b.rotation.y = r; g.add(b); }); return g; };
  const stoplight = () => { const g = grp(at(box(0.5, 14, 0.5, '#2a2c33'), 0, 7, 0), at(box(0.35, 0.35, 15, '#2a2c33'), 0, 13.6, 7.5));
    for (const z of [2.6, 11]) { g.add(at(box(1.3, 3.2, 1.2, '#f2c230'), 0, 12, z)); [['#ff3b30', 13.0], ['#ffb02a', 12.0], ['#3ad46a', 11.0]].forEach(([c, y], i) => g.add(at(box(0.8, 0.8, 0.12, i === 2 ? glow(c, 1.8) : mat('#4a3a2a')), 0.66, y, z))); }
    return g; };
  const ceilingFan = () => { const g = grp(at(box(0.2, 1.0, 0.2, '#e8e2d6'), 0, -0.5, 0), at(box(1.0, 0.4, 1.0, '#c9a46a', 0.15), 0, -1.1, 0), at(new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), glow('#fff2d0', 1.6)), 0, -1.45, 0));
    const blades = grp(); for (let i = 0; i < 4; i++) { const b = box(3.6, 0.1, 0.9, '#9a6a3a', 0.04); b.position.set(Math.cos(i * Math.PI / 2) * 2.2, 0, Math.sin(i * Math.PI / 2) * 2.2); b.rotation.y = -i * Math.PI / 2; blades.add(b); }
    blades.position.y = -1.0; g.add(blades); g.blades = blades; return g; };

  // ── sets
  const streetN = TOWN.street({ time: 'night', lit: 0.6 });
  const streetD = TOWN.street({ time: 'day' }); streetD.group.add(at(stoplight(), 4, 0, 2.0));
  function home(time) { // Sam's house from the front yard: house at z = -6 (front wall z = -1), lawn, path, fence, trees
    const night = time === 'night', g = grp(skyDome(night ? 'night' : 'day'), hills(night ? '#1d3320' : '#5c8a4a'));
    g.add(at(floor(300, 200, TEX.grass(night ? '#2b4a26' : '#5aa04a'), 6), 0, -0.03, -20), at(floor(3, 12, TEX.concrete(night ? '#8a8c92' : '#d9d4ca'), 3), 0, 0.01, 5), at(floor(300, 10, TEX.road(), 6), 0, 0.0, 16));
    g.add(at(house({ color: '#e09a6a', lit: night ? 1 : 0, seed: 3, roof: night ? '#252a36' : '#5a3a2e', door: '#2f62c9' }), 0, 0, -6));
    g.add(at(house({ color: '#8fbf9a', lit: night ? 0.4 : 0, seed: 8, roof: night ? '#252a36' : '#5a3a2e' }), -24, 0, -9), at(house({ color: '#b07ad0', lit: night ? 0.5 : 0, seed: 12, roof: night ? '#252a36' : '#5a3a2e' }), 24, 0, -9));
    g.add(at(tree(10, night ? '#24452a' : '#3f9b3f'), -11, 0, -2), at(tree(9, night ? '#24452a' : '#3f9b3f'), 12, 0, -1), at(bush(night ? '#24452a' : '#3f9b3f'), -4, 0, 0.5), at(bush(night ? '#24452a' : '#3f9b3f'), 4, 0, 0.5), at(lampPost(10), 8, 0, 10));
    if (night) { const L = new THREE.PointLight('#ffd9a0', 220, 30, 2); L.position.set(8, 10.2, 10); g.add(L); }
    return { group: g, light: night ? 'townNight' : 'overcast' };
  }
  const homeD = home('day'), homeN = home('night');
  // the night exterior gag: two long legs sticking out of the upper right window (x 4.4, y 8, front wall z -1)
  for (const dx of [-0.55, 0.55]) homeN.group.add(at(box(1, 1, 7.5, mat('#33467e')), 4.4 + dx, 7.9, 2.6), at(box(1.1, 1.2, 1.7, mat('#e8e8ea'), 0.2), 4.4 + dx, 8.0, 6.9), at(box(1.12, 0.3, 1.72, mat('#c9c9cc')), 4.4 + dx, 7.45, 6.9));
  function kitchen(dinner) { // morning kitchen (vase on a stand) / the same kitchen at dinner (table). Ceiling at y 13, fan above (0, 1)
    const g = room({ floorTex: TEX.checker('#ffffff', '#f2c9a0'), tile: 4, wallColor: '#f4dcae', trim: '#c98a4a', trimY: 3.4, w: 34, d: 24, h: 13, lights: 0, ceiling: '#efe6d6' });
    g.add(at(counter(10, '#ffffff', '#5a8fd8'), -10, 0, -4.6), at(grp(at(box(4, 8.4, 3, '#f4f4f6', 0.2), 0, 4.2, 0), at(box(0.2, 2.4, 0.3, '#b9bcc4'), 1.5, 5.2, 1.6)), 11.5, 0, -4.2), at(windowPane(5, 4, dinner ? '#1a2340' : '#bfe6ff'), 3, 7.6, -5.85));
    const stand = at(box(1.5, 3.6, 1.5, '#e9e2d2', 0.06), -4, 1.8, -3.6), v = at(vase(), -4, 3.6, -3.6), sh = at(shards(), -4, 0, -2.6); g.add(stand, v, sh);
    const fan = at(ceilingFan(), 0, 13, 1); g.add(fan);
    if (dinner) { g.add(at(table(9, 4, '#b9783f', 2.7), 0, 0, 4.2)); for (const x of [-3, 0, 3]) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 20), mat('#ffffff')), x, 2.9, 4.2), at(box(0.9, 0.3, 0.6, '#d9763a', 0.1), x, 3.05, 4.2)); }
    return { group: g, light: dinner ? 'warm' : 'indoor', vase: v, shards: sh, reset() { v.visible = false; sh.visible = true; }, whole() { v.visible = true; sh.visible = false; }, update(t) { fan.blades.rotation.y = t * (dinner ? 5 : 2.4); } };
  }
  const kitM = kitchen(false), kitE = kitchen(true);
  const bedN = TOWN.roomNight({ wall: '#7a6a4f', rug: '#d9b33a' });
  bedN.group.add(at(bed('#c33a3a'), 7.5, 0, 0, Math.PI / 2), at(windowPane(3.2, 2.6, '#1a2340'), 14.85, 3.4, 0, -Math.PI / 2));

  // ── cast: one copy per set, same options everywhere
  const cast = (set) => {
    const c = {
      me: makeNarrator({ color: '#3553b8', print: 'honest' }),
      ruby: makeAvatar({ seed: 7, skin: 'light', hair: 'ponytail', hairColor: '#7a3a1a', top: 'tee', topColor: '#ff6fa8', bottom: 'shorts', bottomColor: '#7a4fd0', height: 0.8, face: 'cute' }),
      mom: makeAvatar({ seed: 8, skin: 'light', hair: 'long', hairColor: '#5a3018', top: 'cardigan', topColor: '#2fa88a', bottom: 'slacks', bottomColor: '#3a3f5a' }),
      mail: makeAvatar({ seed: 9, skin: 'brown', hair: 'short', top: 'shirt', topColor: '#5f8fe0', bottom: 'shorts', bottomColor: '#2e3f6a', cap: '#2e3f6a', backpack: '#8a5a34' }),
      mayor: makeAvatar({ seed: 10, skin: 'fair', hair: 'short', hairColor: '#cfcfd4', top: 'suit', topColor: '#2b2f3e', bottom: 'slacks', bottomColor: '#2b2f3e', glasses: true }),
      guy: makeAvatar({ seed: 4, skin: 'tan', hair: 'spiky', hairColor: '#e8a03a', top: 'stripes', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3a4f7a' }),
    };
    const hat = grp(at(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 24), mat('#16161a')), 0, 1.75, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 24), mat('#16161a')), 0, 1.18, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.25, 24), mat('#c33a3a')), 0, 1.3, 0)); c.mayor.head.add(hat); c.mayor.hair.visible = false;
    for (const a of Object.values(c)) { set.group.add(a.root); PRE.push(() => { a.legL.scale.y = a.legR.scale.y = 1; a.root.rotation.z = 0; }); }
    const b = soccer(); b.visible = false; set.group.add(b); PRE.push(() => { b.visible = false; });
    return { ...c, ball: b, sp: makeSparkles(set.group), puff: makePuff(set.group) };
  };
  const SN = cast(streetN), SD = cast(streetD), HD = cast(homeD), HN = cast(homeN), KM = cast(kitM), KE = cast(kitE), BN = cast(bedN);
  const TALL = 2.15, TALLER = 2.7, HUGE = 4.1; // Sam after "No idea", after "growth spurt", by dinner

  // ── ACT 1: the rule
  shot({ line: 'In this town,', set: streetN, sfx: [['whoosh', 0]], cam: drone([0, 4, -4], { h: 32, back: 46, drift: [8, -2, -8], fov: 52 }),
    act(lt, c) { SN.guy.reset().place(-6 + lt * 3, 4.5, Math.PI / 2).walk(c.t); SN.mom.reset().place(14 - lt * 3, 4, -Math.PI / 2).walk(c.t, 0.9); } });
  shot({ line: 'every time you tell a lie,', set: streetN, cam: frame(6, 4, { size: 'close', side: -14 }),
    act(lt, c) { SN.guy.reset().place(6, 4, -0.15).pose('open', 0.6).setFace(lt < c.w('lie') ? 'talk' : 'smug').talk(c.t); } });
  shot({ line: 'your legs get longer.', set: streetN, sfx: [['rise', 'longer', 0.8], ['sparkle', 'longer', 0.6]], cam: frame(6, 4, { size: 'full', h: 1.5, side: 16, push: 0.05 }),
    act(lt, c) { SN.guy.reset().place(6, 4, 0.2).idle(c.t); growLegs(SN.guy, SN.sp, lt, c.w('longer'), 1, 2.4, 'gasp'); } });
  shot({ line: 'The only way to shrink back down', set: streetN, sfx: [['fall', 'down', 0.8]], cam: frame(6, 4, { size: 'full', h: 1.5, side: -18, push: 0.04 }),
    act(lt, c) { SN.guy.reset().place(6, 4, -0.2).idle(c.t); if (lt < c.w('down')) { legs(SN.guy, 2.4).setFace('uneasy'); } else growLegs(SN.guy, SN.sp, lt, c.w('down'), 2.4, 1, 'joy'); } });
  shot({ line: 'is to tell the truth.', set: streetN, sfx: [['ding', 'truth', 0.6]], cam: frame(6, 4, { size: 'close', side: 10, push: 0.1 }),
    act(lt, c) { SN.guy.reset().place(6, 4, 0.1).pose('open', 0.5).setFace(lt < c.w('truth') ? 'say' : 'joy').talk(c.t); } });
  shot({ line: "That's why the mailman", set: streetD, sfx: [['whoosh', 0, 0.5]], cam: { pos: [-3, 1.2, 11], look: [1, 8.5, 4.5], fov: 60, blur: 0.1, push: 0.06 },
    act(lt, c) { SD.mail.reset().place(-1 + lt * 3, 4.5, Math.PI / 2).walk(c.t, 0.55, 30).setFace('smile'); legs(SD.mail, 4.6); } });
  shot({ line: 'is twelve feet tall,', set: streetD, cam: { pos: [2, 7.5, 33], look: [2, 7, 4], fov: 54, blur: 0.1, push: 0.05 },
    act(lt, c) { SD.mail.reset().place(-1 + lt * 2, 4.5, Math.PI / 2).walk(c.t, 0.55, 30).setFace('smile'); legs(SD.mail, 4.6); SD.guy.reset().place(5, 4.6, -0.5).setFace('wow').pose({ head: [-25, 0, 0] }).idle(c.t); } });
  shot({ line: 'and why the mayor', set: streetD, cam: { pos: [-2, 11.4, 10], look: [-3, 11.6, 4.6], fov: 50, blur: 0.4, push: 0.08 },
    act(lt, c) { SD.mayor.reset().place(-3, 4.6, 0.3).pose('wave', 0.8).setFace('grin').idle(c.t); legs(SD.mayor, 4.8); } });
  shot({ line: 'has to duck under the stoplights.', set: streetD, sfx: [['thud', 'stoplights', 0.4]], cam: { pos: [3, 6, 30], look: [3, 8, 3], fov: 52, blur: 0, push: 0.05 },
    act(lt, c) { const x = -5 + remap(lt, 0, c.d) * 11, k = clamp(1 - Math.abs(x - 3.6) / 3.2) ; SD.mayor.reset().place(x, 4.6, Math.PI / 2).walk(c.t, 0.5, 26).pose({ lean: [55 * E.inOut(k), 0], head: [-15 * k, 0, 0] }).setFace(k > 0.3 ? 'worried' : 'grin'); legs(SD.mayor, 4.8); } });
  shot({ line: 'My name is Sam,', set: streetD, sfx: [['pop', 'sam', 0.5]], cam: frame(-4, 4, { size: 'close', side: -12 }),
    act(lt, c) { SD.me.reset().place(-4, 4, -0.1).setFace(lt < c.w('sam') ? 'calm' : 'joy').idle(c.t); } });
  shot({ line: 'and I had never told a single lie,', set: streetD, cam: frame(-4, 4, { size: 'medium', side: 16 }),
    act(lt, c) { SD.me.reset().place(-4, 4, 0.25).pose('open', 0.7).setFace('joy').talk(c.t); } });
  shot({ line: 'so my legs were normal.', set: streetD, cam: frame(2, 4, { size: 'full', side: 8, low: 0.2 }),
    act(lt, c) { SD.me.reset().place(2, 4, -0.1).pose('hips').setFace(lt < c.w('normal') ? 'calm' : 'winkjoy').idle(c.t); } });

  // ── ACT 2: the vase, the lie, the legs
  shot({ line: 'Then one morning,', set: homeD, sfx: [['whoosh', 0, 0.5]], cam: drone([0, 4, -6], { h: 30, back: 44, drift: [-8, -2, -6], fov: 52 }) });
  shot({ line: 'my little sister Ruby', set: kitM, cam: frame(3, 2.5, { size: 'close', h: 0.8, side: 12 }),
    act(lt, c) { kitM.whole(); KM.ruby.reset().place(3, 2.5, 0.1).pose('wave', 0.8).setFace('cute').idle(c.t); KM.ball.visible = true; KM.ball.position.set(3.9, 0.5, 3.4); } });
  shot({ line: 'kicked her soccer ball', set: kitM, sfx: [['thud', 'kicked', 0.5], ['whoosh', 'ball', 0.6]], cam: frame(3, 2.5, { size: 'full', h: 0.8, side: -72, push: 0.08 }),
    act(lt, c) { kitM.whole(); const tk = c.w('kicked'), k = Math.sin(remap(lt, tk - 0.15, tk + 0.35) * Math.PI); KM.ruby.reset().place(3, 2.5, -2.29).pose({ lR: 75 * k, aL: [30 * k, 20], aR: [-20 * k, 20] }).setFace('laugh');
      const ry = -2.29, foot = [3 + Math.sin(ry) * 0.7, 0.4, 2.5 + Math.cos(ry) * 0.7]; if (lt < tk + 0.1) { KM.ball.visible = true; KM.ball.position.set(...foot); } else arc(KM.ball, lt, tk + 0.1, 0.9, foot, [-4, 4.4, -3.6], 2.5); } });
  shot({ line: "into Mom's favorite vase.", set: kitM, sfx: [['thud', 'vase', 1], ['pop', 'vase', 0.6]], cam: { pos: [-0.5, 4.6, 4.5], look: [-4, 4.2, -3.6], fov: 52, blur: 0.3, push: 0.1 },
    act(lt, c) { const tv = c.w('vase'); if (lt < tv) { kitM.whole(); arc(KM.ball, lt, tv - 0.5, 0.5, [0.5, 3.6, 2], [-4, 4.4, -3.6], 1.2); } else { KM.puff.at(lt - tv, [-4, 3.6, -3.4]); KM.ball.visible = true; const k = remap(lt, tv, tv + 0.6); KM.ball.position.set(-4 + k * 2, 3.6 - k * 3.1 + Math.sin(k * Math.PI) * 1.2, -3.2 + k * 1.5); } } });
  shot({ line: 'She grabbed my arm', set: kitM, cam: frame(1.2, 2.5, { size: 'medium', side: 14 }),
    act(lt, c) { KM.me.reset().place(2.4, 2.5, -0.5).setFace('uneasy').idle(c.t); KM.ruby.reset().place(0.2, 2.8, 0.9).pose('reach', 0.9).setFace('worried').idle(c.t); } });
  shot({ line: 'and begged me,', set: kitM, cam: frame(0.2, 2.8, { size: 'close', h: 0.8, side: -16, y: 0.2 }),
    act(lt, c) { KM.ruby.reset().place(0.2, 2.8, -0.2).pose('reach', 0.7).setFace('cry').idle(c.t); } });
  shot({ line: "Please don't tell.", set: kitM, sfx: [['sad', 'tell', 0.35]], cam: frame(0.2, 2.8, { size: 'face', h: 0.8, side: 10, push: 0.1 }),
    act(lt, c) { KM.ruby.reset().place(0.2, 2.8, 0.1).pose({ head: [-14, 0, 6] }).setFace('cry').talk(c.t); } });
  shot({ line: 'So when Mom asked,', set: kitM, cam: { pos: [6, 6, 17], look: [0, 4, -1], fov: 56, blur: 0.1, push: 0.06 },
    act(lt, c) { KM.mom.reset().place(-6 + remap(lt, 0, 0.7) * 2, 0.6, 0.6).walk(c.t * (lt < 0.7 ? 1 : 0)).pose('hips', remap(lt, 0.6, 1)).setFace('sus'); KM.me.reset().place(2.4, 2.5, -0.6).setFace('uneasy').idle(c.t); KM.ruby.reset().place(0.6, 3.2, -0.9).pose('shy').setFace('worried').idle(c.t); } });
  shot({ line: 'Sam, do you know who did this,', set: kitM, cam: frame(-4, 0.6, { size: 'close', side: 18 }),
    act(lt, c) { KM.mom.reset().place(-4, 0.6, 0.5).pose('point', 0.7).setFace('sus').talk(c.t); } });
  shot({ line: 'I said,', set: kitM, cam: frame(2.4, 2.5, { size: 'close', side: -12 }),
    act(lt, c) { KM.me.reset().place(2.4, 2.5, -0.3).setFace('uneasy').idle(c.t); } });
  shot({ line: 'No idea. //', set: kitM, cam: frame(2.4, 2.5, { size: 'face', side: 8, push: 0.12 }),
    act(lt, c) { KM.me.reset().place(2.4, 2.5, -0.1).pose('shrug').setFace(lt < c.w('idea') + 0.3 ? 'say' : 'smirk').talk(c.t, lt < c.w('idea') + 0.3 ? 1 : 0); } });
  shot({ line: 'My legs shot up two feet.', set: kitM, sfx: [['rise', 'shot', 0.9], ['sparkle', 'shot', 0.6]], cam: frame(2.4, 2.5, { size: 'full', h: 1.6, side: -18, push: 0.04 }),
    act(lt, c) { KM.me.reset().place(2.4, 2.5, 0.15).idle(c.t); growLegs(KM.me, KM.sp, lt, c.w('shot'), 1, TALL, 'gasp'); } });
  shot({ line: 'Mom stared at me.', set: kitM, cam: frame(-4, 0.6, { size: 'close', side: -14, push: 0.1 }),
    act(lt, c) { KM.mom.reset().place(-4, 0.6, 0.5).pose({ head: [-22, 0, 0], aL: [0, 8], aR: [0, 8] }).setFace(lt < c.w('stared') ? 'sus' : 'shock').idle(c.t, 0.3); } });
  shot({ line: 'Ruby stared at me.', set: kitM, cam: frame(0.6, 3.2, { size: 'close', h: 0.8, side: 14, push: 0.1 }),
    act(lt, c) { KM.ruby.reset().place(0.6, 3.2, -0.3).pose({ head: [-26, 0, 0] }).setFace(lt < c.w('stared') ? 'worried' : 'gasp').idle(c.t, 0.3); } });
  shot({ line: "I said, It's just a growth spurt.", set: kitM, cam: F(2.4, 2.5, TALL, 1, { size: 'medium', side: 16 }),
    act(lt, c) { KM.me.reset().place(2.4, 2.5, 0.2).pose('shrug', 0.8).setFace(lt < c.w('growth') ? 'say' : 'smirk').talk(c.t); legs(KM.me, TALL); } });
  shot({ line: 'Another foot.', set: kitM, sfx: [['boing', 'foot', 0.9]], cam: frame(2.4, 2.5, { size: 'full', h: 1.8, side: -12, low: 0.3, push: 0.04 }),
    act(lt, c) { KM.me.reset().place(2.4, 2.5, -0.15).idle(c.t); growLegs(KM.me, KM.sp, lt, c.w('foot'), TALL, TALLER, 'worried'); } });
  shot({ line: 'By dinner,', set: kitE, sfx: [['tick', 0, 0.6]], cam: { pos: [0, 9, 24], look: [0, 6, 1], fov: 56, blur: 0, push: 0.05 },
    act(lt, c) { KE.me.reset().place(0, 1, 0).setFace('worried').idle(c.t); legs(KE.me, HUGE); KE.mom.reset().place(-5, 6.5, 2.6).setFace('sus').pose({ head: [-20, 0, 0] }); KE.ruby.reset().place(4.5, 6.5, -2.4).setFace('worried').pose({ head: [-25, 0, 0] }); } });
  shot({ line: 'I was bumping my head', set: kitE, sfx: [['thud', 'bumping', 0.9], ['thud', 'head', 0.7]], cam: { pos: [-2, 6.5, 13], look: [0, 9.6, 1], fov: 54, blur: 0.15, push: 0.07 },
    act(lt, c) { const b = Math.max(Math.exp(-Math.max(0, lt - c.w('bumping')) * 9) * (lt >= c.w('bumping') ? 1 : 0), Math.exp(-Math.max(0, lt - c.w('head')) * 9) * (lt >= c.w('head') ? 1 : 0)); KE.me.reset().place(0, 1, 0.1).pose({ head: [18 * b, 0, -8 * b] }).setFace(b > 0.3 ? 'scream' : 'worried').idle(c.t); legs(KE.me, HUGE); KE.me.hip.position.y -= b * 0.25; } });
  shot({ line: 'on the ceiling fan,', set: kitE, cam: { pos: [3.5, 10.6, 7.5], look: [0, 11.3, 1], fov: 50, blur: 0.3, push: 0.1 },
    act(lt, c) { KE.me.reset().place(0, 1, 0.25).pose({ head: [10, 0, -6] }).setFace('cry').idle(c.t); legs(KE.me, HUGE); } });
  shot({ line: 'and that night', set: homeN, sfx: [['whoosh', 0, 0.4]], cam: drone([0, 5, -6], { h: 26, back: 40, drift: [6, -2, -6], fov: 52 }) });
  shot({ line: 'I had to sleep with my feet', set: bedN, cam: { pos: [3, 7, 17], look: [10, 3.4, 0], fov: 54, blur: 0.1, push: 0.06 },
    act(lt, c) { BN.me.reset().place(16, 0, 0, 3.2).setFace('sleepy').idle(c.t, 0.3); legs(BN.me, HUGE); BN.me.root.rotation.z = Math.PI / 2; BN.me.hip.position.y += Math.sin(c.t * 1.6) * 0.04; } });
  shot({ line: 'out the window.', set: homeN, sfx: [['pop', 'window', 0.4]], cam: { pos: [17, 6, 13], look: [4, 8, 3], fov: 54, blur: 0.15, push: 0.1 } });

  // ── ACT 3: the truth, and the twist on Ruby
  shot({ line: 'The next morning,', set: homeD, sfx: [['whoosh', 0, 0.4]], cam: { pos: [-14, 3, 24], look: [0, 6, -4], fov: 56, blur: 0, push: 0.06 } });
  shot({ line: 'I told Mom the truth.', set: kitM, cam: { pos: [-4, 5, 22], look: [0, 6.2, 1], fov: 56, blur: 0.1, push: 0.06 },
    act(lt, c) { KM.me.reset().place(1.6, 1.5, -0.4).pose('shy').setFace('sad').talk(c.t); legs(KM.me, HUGE); KM.mom.reset().place(-2.6, 2.2, 0.7).pose({ head: [-24, 0, 0] }).setFace('sus').idle(c.t); } });
  shot({ line: 'My legs shrank back down.', set: kitM, sfx: [['fall', 'shrank', 0.9], ['sparkle', 'shrank', 0.6]], cam: frame(1.6, 1.5, { size: 'full', h: 2.0, side: 14, push: 0.03 }),
    act(lt, c) { KM.me.reset().place(1.6, 1.5, 0.1).idle(c.t); growLegs(KM.me, KM.sp, lt, c.w('shrank'), HUGE, 1, 'joy', 0.6); } });
  shot({ line: 'Mom hugged me.', set: kitM, sfx: [['ding', 'hugged', 0.5]], cam: frame(0, 1.5, { size: 'medium', side: 6 }),
    act(lt, c) { const k = remap(lt, 0, c.w('hugged') + 0.2); KM.me.reset().place(0.85, 1.5, -Math.PI / 2).pose('hug', k).setFace('joy').idle(c.t); KM.mom.reset().place(-0.85, 1.5, Math.PI / 2).pose('hug', k).setFace('happy').idle(c.t); } });
  shot({ line: 'Then she turned to Ruby', set: kitM, cam: { pos: [-9, 5.5, 13], look: [-1, 3.4, 1.5], fov: 54, blur: 0.15, push: 0.07 },
    act(lt, c) { const k = E.inOut(remap(lt, c.w('turned'), c.w('turned') + 0.4)); KM.mom.reset().place(-2.5, 1, lerp(Math.PI / 2, Math.PI * 0.85, k)).setFace(k > 0.5 ? 'sus' : 'happy').idle(c.t); KM.ruby.reset().place(-3.4, 4.6, 2.6).pose('shy').setFace('uneasy').idle(c.t); KM.me.reset().place(0.2, 1, -0.6).setFace('calm').idle(c.t); } });
  shot({ line: 'and asked, Is that true?', set: kitM, cam: frame(-2.5, 1, { size: 'close', side: 30 }),
    act(lt, c) { KM.mom.reset().place(-2.5, 1, 0.9).pose('hips').setFace('sus').talk(c.t); } });
  shot({ line: 'Ruby said,', set: kitM, cam: frame(-3.4, 4.6, { size: 'close', h: 0.8, side: -10 }),
    act(lt, c) { KM.ruby.reset().place(-3.4, 4.6, -0.2).pose('shy').setFace('uneasy').idle(c.t); } });
  shot({ line: 'Nope.', set: kitM, cam: frame(-3.4, 4.6, { size: 'face', h: 0.8, side: 8, push: 0.12 }),
    act(lt, c) { KM.ruby.reset().place(-3.4, 4.6, 0.1).setFace('winkjoy').talk(c.t); } });
  shot({ line: 'And her legs grew so long,', set: kitM, sfx: [['rise', 'grew', 1], ['sparkle', 'grew', 0.7], ['thud', 'long', 0.8]], cam: { pos: [-3.4, 3.5, 19], look: [-3.4, 6.5, 4.6], fov: 60, blur: 0, push: 0.03 },
    act(lt, c) { const tg = c.w('grew'), k = E.out(remap(lt, tg, c.d)); KM.ruby.reset().place(-3.4, 4.6, 0).idle(c.t); legs(KM.ruby, lerp(1, 7.5, k)); KM.ruby.setFace(lt < tg ? 'winkjoy' : 'scream'); KM.sp.at(lt - tg, KM.ruby.root.position.toArray(), 1.4); KM.mom.reset().place(-7.5, 3.5, 0.6).pose({ head: [-30, 0, 0] }).setFace('shock'); } });
  shot({ line: 'she stepped right over the house. ///', set: homeD, sfx: [['thud', 'stepped', 0.9], ['thud', 'house', 0.9]], cam: { pos: [30, 5, 26], look: [0, 13, -6], fov: 62, blur: 0, push: 0.04 },
    act(lt, c) { const ts = c.w('stepped'), k = E.inOut(remap(lt, ts - 0.2, c.w('house') + 0.5)), a = Math.sin(k * Math.PI) * 0.62;
      HD.ruby.reset().place(0, lerp(-24, 12, k), 0).setFace(k < 0.95 ? 'laugh' : 'winkjoy'); HD.ruby.legL.rotation.x = -a; HD.ruby.legR.rotation.x = a; HD.ruby.armL.rotation.x = a * 0.8; HD.ruby.armR.rotation.x = -a * 0.8; legs(HD.ruby, 15); HD.ruby.hip.position.y -= (1 - Math.cos(a)) * 30 * 0.9; } });
});
