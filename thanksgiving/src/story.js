// story.js: "The Turkey Mayor" (town-story-shorts style, ~60 s)
//
// THE SCRIPT:
//   In this town, the turkeys cook Thanksgiving dinner, not the people. Every year, the biggest turkey in town,
//   Mayor Gobbles, walks door to door with a clipboard and asks every family one question. What are you thankful
//   for? If he likes your answer, you're invited to his feast. If he doesn't, you're on the menu. [hold] My name is
//   Max, and I was never scared, because my family always just says "each other." But this year, when Gobbles
//   knocked on our door, my dad was watching football, and he yelled, "I'm thankful for turkey sandwiches!" [hold]
//   Gobbles slowly wrote something on his clipboard. Then he looked at me. I panicked and said the first thing in
//   my head. "I'm thankful for you, Mayor Gobbles." He stared at me for a really long time. Then his eyes filled
//   with tears, and he hugged me. That night, my mom, my sister and I ate the best dinner of our lives at his feast.
//   Everything was perfect, except for one thing. The main course was sitting in a giant pie dish, waving at me.
//   It was my dad. [hold]
import * as THREE from 'three';
import { start, shot, frame } from './core.js';
import { makeAvatar } from './avatar.js';
import { TOWN, makeNarrator, hatOn, house, skyDome, hills, handheld, follow, whip, drone, makeVeil } from './town.js';
import { makeSparkles } from './fx.js';
import { remap, E, lerp, clamp, box, glow, mat, at, grp, sign, shade, canvasTex, PRE } from './util.js';
import { TEX, floor, bush, tree, lampPost, sofa, tv, rug } from './sets.js';

// ───────────── props for this story
function pumpkin(s = 1) { const g = grp(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.9 * s, 16, 12), mat('#e8792a')); b.scale.y = 0.75; b.position.y = 0.65 * s; b.castShadow = true; g.add(b, at(box(0.18 * s, 0.5 * s, 0.18 * s, '#4a6a2a'), 0, 1.35 * s, 0)); return g; }
function hay() { return grp(at(box(3, 1.6, 1.8, '#d9b25a', 0.15), 0, 0.8, 0)); }
// a clipboard with a list that can be redrawn: clip.draw(state)
function clipboard(w = 3, h = 4) {
  const c = document.createElement('canvas'); c.width = 384; c.height = 512; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.84), new THREE.MeshLambertMaterial({ map: t })); paper.position.set(0, -h * 0.03, 0.09);
  const G = grp(box(w, h, 0.14, '#9a6a3a', 0.05), paper, at(box(w * 0.4, h * 0.08, 0.2, '#c0c4cc', 0.03), 0, h * 0.46, 0.08));
  let last = '';
  G.draw = (k = 0, x = 0) => { // k: how much of the red line is written (0..1); x: show the big X (0..1)
    const key = k.toFixed(2) + x.toFixed(2); if (key === last) return; last = key;
    g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, 384, 512); g.fillStyle = '#2a2a2a'; g.textAlign = 'left';
    g.font = '800 38px Montserrat'; g.fillText('THANKFUL LIST', 28, 62); g.fillRect(28, 76, 328, 4);
    g.font = '700 32px Montserrat';
    const rows = [['SMITHS', 'ok'], ['LEES', 'ok'], ['PARKS', 'no'], ["MAX'S HOUSE", '']];
    rows.forEach(([n, m], i) => { const y = 140 + i * 70; g.fillStyle = '#2a2a2a'; g.fillText(n, 28, y); if (m === 'ok') { g.strokeStyle = '#2f9e55'; g.lineWidth = 8; g.beginPath(); g.moveTo(300, y - 14); g.lineTo(316, y); g.lineTo(346, y - 32); g.stroke(); } if (m === 'no') { g.strokeStyle = '#d23a3a'; g.lineWidth = 8; g.beginPath(); g.moveTo(300, y - 30); g.lineTo(340, y + 4); g.moveTo(340, y - 30); g.lineTo(300, y + 4); g.stroke(); } });
    if (k > 0) { g.save(); g.beginPath(); g.rect(0, 0, 28 + 330 * k, 512); g.clip(); g.fillStyle = '#d23a3a'; g.font = '800 30px Montserrat'; g.fillText('DAD: "TURKEY', 28, 420); g.fillText('SANDWICHES"', 28, 458); g.restore(); }
    if (x > 0) { g.strokeStyle = '#d23a3a'; g.lineWidth = 12; g.globalAlpha = x; g.beginPath(); g.moveTo(290, 330); g.lineTo(356, 384); g.moveTo(356, 330); g.lineTo(290, 384); g.stroke(); g.globalAlpha = 1; }
    t.needsUpdate = true;
  };
  G.draw(0, 0); return G;
}
// giant pie dish: ceramic dish + crust rim + pumpkin filling
function pieDish(r = 2.8) {
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.86, 1.1, 32), mat('#f1ebe0')); dish.position.y = 0.55; dish.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, 0.38, 10, 32), mat('#d9a24a')); rim.rotation.x = Math.PI / 2; rim.position.y = 1.15;
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.1, 32), mat('#c8662a')); fill.position.y = 1.0;
  return grp(dish, rim, fill);
}

// ───────────── the turkey (Mayor Gobbles and friends): blocky, ~8.5 units tall (people are ~5.4)
function makeTurkey(o = {}) {
  const { body = '#7a4a2a', hat = 'top', sash = true, seed = 1 } = o;
  const root = grp(), hip = grp(); root.add(hip);
  const legL = grp(at(box(0.38, 2.3, 0.38, '#e8a23a'), 0, -1.15, 0), at(box(0.9, 0.18, 1.1, '#e8a23a'), 0, -2.25, 0.3)); legL.position.set(0.8, 2.35, 0);
  const legR = grp(at(box(0.38, 2.3, 0.38, '#e8a23a'), 0, -1.15, 0), at(box(0.9, 0.18, 1.1, '#e8a23a'), 0, -2.25, 0.3)); legR.position.set(-0.8, 2.35, 0);
  root.add(legL, legR);
  const torso = at(box(4, 3.6, 3.4, body, 0.7), 0, 4.1, 0), breast = at(box(3, 2.6, 0.3, shade(body, 0.18), 0.12), 0, 4.0, 1.66);
  hip.add(torso, breast);
  if (sash) { const s = at(box(0.6, 4.2, 0.1, '#c8283a'), 0, 4.2, 1.86); s.rotation.z = 0.62; hip.add(s); const b = at(sign('MAYOR', 1.8, 0.5, { bg: '#e2b23a', fg: '#5a1a10' }), 0.1, 3.3, 1.92); hip.add(b); }
  // tail fan
  const fan = grp(); fan.position.set(0, 4.2, -1.6); fan.rotation.x = -0.25;
  const fc = ['#6b3a1e', '#d9822b', '#a0522d', '#f2b01e', '#a0522d', '#d9822b', '#6b3a1e'];
  for (let i = 0; i < 7; i++) { const f = grp(at(box(1.15, 4.6, 0.22, fc[i], 0.1), 0, 2.6, 0), at(box(1.15, 0.6, 0.24, '#f4ead8', 0.08), 0, 4.8, 0)); f.rotation.z = (i - 3) * 0.32; fan.add(f); }
  hip.add(fan);
  // wings (pivot at the shoulder)
  const wing = s => { const w = grp(at(box(0.5, 2.8, 2.3, shade(body, -0.12), 0.2), 0, -1.3, 0)); w.position.set(s * 2.15, 5.3, 0.1); hip.add(w); return w; };
  const wingL = wing(1), wingR = wing(-1);
  // head
  const head = grp(); head.position.set(0, 5.6, 0.9); hip.add(head);
  head.add(at(box(1.1, 1.8, 1.1, '#d8645a', 0.3), 0, 0.9, 0), at(box(1.7, 1.6, 1.7, '#e0786a', 0.35), 0, 2.2, 0.15));
  head.add(at(box(0.55, 0.4, 0.9, '#f2c230', 0.1), 0, 2.0, 1.25), at(box(0.34, 1.0, 0.34, '#d0283a', 0.12), 0.05, 1.45, 1.15));
  const eyes = [], pupils = [], brows = [], tears = [];
  for (const s of [-1, 1]) {
    const e = at(box(0.46, 0.52, 0.06, '#ffffff'), s * 0.42, 2.45, 1.02); const p = at(box(0.22, 0.26, 0.06, '#151515'), s * 0.42, 2.42, 1.06);
    const b = at(box(0.56, 0.13, 0.08, '#151515'), s * 0.42, 2.86, 1.04); const t = at(box(0.16, 0.9, 0.06, glow('#58b8ff', 1.2)), s * 0.42, 1.85, 1.07);
    head.add(e, p, b, t); eyes.push(e); pupils.push(p); brows.push(b); tears.push(t);
  }
  if (hat === 'top') head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.14, 24), mat('#16161a')), 0, 3.05, 0.1), at(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 1.6, 24), mat('#16161a')), 0, 3.85, 0.1), at(new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.3, 24), mat('#e2b23a')), 0, 3.25, 0.1));
  if (hat === 'chef') { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.8, 1.3, 20), mat('#ffffff')); ch.position.set(0, 3.6, 0.1); const puff = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 10), mat('#ffffff')); puff.scale.y = 0.6; puff.position.set(0, 4.35, 0.1); head.add(ch, puff); }
  const clip = clipboard(1.7, 2.3); clip.position.set(-0.35, -2.6, 1.1); clip.rotation.set(-1.0, 0, 0); wingR.add(clip); clip.visible = false;
  const tw = {
    root, head, wingL, wingR, clip,
    place(x, z, ry = 0, y = 0) { root.position.set(x, y, z); root.rotation.set(0, ry, 0); return tw; },
    size(s) { root.scale.setScalar(s); return tw; },
    reset() { root.visible = true; hip.position.set(0, 0, 0); hip.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0); wingL.rotation.set(0, 0, 0.12); wingR.rotation.set(0, 0, -0.12); fan.scale.setScalar(1); clip.visible = false; return tw.face('normal'); },
    // face: normal | narrow (suspicious) | stare (wide, frozen) | cry | happy | look (pupils to one side)
    face(n, lx = 0) {
      for (let i = 0; i < 2; i++) { const s = i ? 1 : -1; eyes[i].scale.set(1, 1, 1); pupils[i].scale.set(1, 1, 1); pupils[i].position.x = s * 0.42 + lx * 0.12; pupils[i].position.y = 2.42; brows[i].rotation.z = 0; brows[i].position.y = 2.86; tears[i].visible = false; }
      if (n === 'narrow') for (let i = 0; i < 2; i++) { const s = i ? 1 : -1; eyes[i].scale.y = 0.45; pupils[i].scale.y = 0.6; brows[i].rotation.z = s * 0.45; brows[i].position.y = 2.66; }
      if (n === 'stare') for (let i = 0; i < 2; i++) { eyes[i].scale.set(1.25, 1.3, 1); pupils[i].scale.set(0.6, 0.6, 1); brows[i].position.y = 3.0; }
      if (n === 'cry') for (let i = 0; i < 2; i++) { const s = i ? 1 : -1; brows[i].rotation.z = -s * 0.4; tears[i].visible = true; pupils[i].scale.set(1.2, 1.3, 1); }
      if (n === 'happy') for (let i = 0; i < 2; i++) { eyes[i].scale.y = 0.25; pupils[i].scale.y = 0.0001; brows[i].position.y = 3.0; }
      return tw;
    },
    idle(t, amt = 1) { const s = seed * 1.3; hip.position.y += Math.sin(t * 2.4 + s) * 0.05 * amt; head.rotation.x += Math.sin(t * 1.7 + s) * 0.05 * amt; head.rotation.z += Math.sin(t * 1.1 + s) * 0.04 * amt; fan.scale.setScalar(1 + Math.sin(t * 3 + s) * 0.03 * amt); return tw; },
    talk(t) { head.rotation.x += Math.sin(t * 14) * 0.06; return tw; },
    walk(t, sp = 1) { const ph = t * 6 * sp, k = Math.sin(ph); legL.rotation.x = k * 0.5; legR.rotation.x = -k * 0.5; hip.rotation.z = k * 0.08; hip.position.y += Math.abs(Math.cos(ph)) * 0.15; head.position.z = 0.9 + Math.sin(ph * 2) * 0.25; return tw; },
    holdClip(k = 1) { clip.visible = true; wingR.rotation.x = -1.0 * k; return tw; },
    write(t) { tw.holdClip(1); wingL.rotation.x = -1.1 + Math.sin(t * 9) * 0.12; wingL.rotation.z = -0.55; head.rotation.x += 0.35; return tw; },
    hug(k) { wingL.rotation.x = -1.3 * k; wingR.rotation.x = -1.3 * k; wingL.rotation.z = 0.12 - 0.9 * k; wingR.rotation.z = -0.12 + 0.9 * k; return tw; },
    wave(t) { wingL.rotation.z = 1.9 + Math.sin(t * 9) * 0.3; return tw; },
    lookAt(x, z) { const dx = x - root.position.x, dz = z - root.position.z; head.rotation.y = clamp(Math.atan2(dx, dz) - root.rotation.y, -0.9, 0.9); return tw; },
  };
  PRE.push(() => { root.visible = false; });
  tw.reset(); return tw;
}

// ───────────── sets for this story
function porch(color, seed) { // night: one house with a lit porch, path, pumpkins and hay bales
  const g = grp(skyDome('night', seed), hills('#1d3320'), at(floor(200, 140, TEX.grass('#2b4a26'), 6), 0, -0.03, -20), at(floor(4, 14, TEX.concrete('#8a8c92'), 3), 0, 0.02, 6));
  g.add(at(house({ w: 18, h: 11, d: 10, color, lit: 1, seed, door: '#6a2a1a' }), 0, 0, -6));
  g.add(at(house({ color: '#3e66c9', lit: 0.6, seed: seed + 3 }), -24, 0, -9), at(house({ color: '#d9b56a', lit: 0.6, seed: seed + 5 }), 24, 0, -9));
  const L = new THREE.PointLight('#ffcf8a', 260, 24, 2); L.position.set(0, 6.5, 1.5); g.add(L, at(box(0.6, 0.8, 0.6, glow('#ffe2a8', 2)), -2.2, 5.2, -0.8));
  g.add(at(pumpkin(1), -3.5, 0, 1.2), at(pumpkin(0.7), -4.6, 0, 1.8), at(pumpkin(1.1), 3.6, 0, 1.3), at(hay(), 5.8, 0, 0.6), at(bush('#24452a'), -7, 0, 0.5), at(bush('#24452a'), 8.5, 0, 0.4), at(lampPost(10), 9, 0, 9));
  const clip = clipboard(3, 4); g.add(at(clip, 40, 4, 0));  // insert prop, framed alone off to the side
  g.add(at(box(4, 8, 0.2, '#1a2340'), 40, 4, -0.5));
  return { group: g, light: 'townNight', clip };
}

start(() => {
  // ── sets
  const street = TOWN.street({ time: 'night', lit: 0.7 });
  for (const x of [-34, -21, -9, 4, 15, 27]) street.group.add(at(pumpkin(0.8 + (x % 3 === 0 ? 0.2 : 0)), x, 0, 2.6));
  const kitchen = TOWN.roomNight({ wall: '#8f6a3a', floor: '#6a4428', rug: '#c8662a' });
  kitchen.group.add(at(box(6, 3.4, 3, '#e8e8ea', 0.15), -5, 1.7, -3.5), at(box(6, 0.2, 3, '#2a2a30'), -5, 3.45, -3.5));
  const pot = grp(at(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.1, 1.6, 20), mat('#4a4f5a')), 0, 0.8, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 20), mat('#e8a23a')), 0, 1.5, 0));
  kitchen.group.add(at(pot, -5.5, 3.5, -3.3), at(box(0.2, 3, 0.2, '#b9783f'), -5.2, 5.4, -3.0));
  const steam = makeSparkles(kitchen.group, 4, 10);
  const neighbors = porch('#c97a8e', 2), home = porch('#7aa0d8', 6);
  const living = { group: (() => { const r = TOWN.roomNight({ wall: '#7a4a5a', floor: '#8a5a34', rug: '#3f6fd6' }); return r.group; })(), light: 'roomNight' };
  living.group.add(at(sofa('#c8662a'), -2, 0, -2.8), at(tv(), 10, 0, 1, -Math.PI / 2));
  living.group.add(at(box(0.06, 2.6, 4.8, glow('#3fae4a', 1.2)), 9.84, 3.3, 1), at(box(0.07, 0.12, 4.6, glow('#ffffff', 1.4)), 9.82, 3.3, 1), at(box(0.07, 2.4, 0.12, glow('#ffffff', 1.4)), 9.82, 3.3, 1));
  const tvLight = new THREE.PointLight('#9fe0a0', 140, 22, 2); tvLight.position.set(7, 4, 1); living.group.add(tvLight);
  const feast = TOWN.partyTable({ wall: '#b8743a' });
  const pie = pieDish(2.8); feast.group.add(at(pie, 0, 2.93, 0)); PRE.push(() => { pie.visible = false; });
  feast.group.add(at(pumpkin(1.2), -12, 0, -4), at(pumpkin(0.9), 12.5, 0, -3), at(hay(), -14, 0, -7), at(hay(), 14, 0, -7));
  const menu = sign("TONIGHT'S\nMENU\n\nTHE PARKS\n+ GRAVY", 4.2, 5.4, { bg: '#2a1a12', fg: '#f2d6a0', border: '#e2b23a' });
  feast.group.add(at(menu, -26, 4.2, 2), at(box(0.2, 4, 0.2, '#6a4428'), -26, 1.5, 1.8));
  const feastDrone = TOWN.partyTable({ wall: '#b8743a' });

  // ── cast: one copy per set, identical options
  const cast = (set) => {
    const c = {
      me: makeNarrator({ color: '#3553b8', print: 'thankful' }),
      mom: makeAvatar({ seed: 2, skin: 'light', hair: 'bob', hairColor: '#6a3a1a', top: 'cardigan', topColor: '#2f9e55', bottom: 'jeans', bottomColor: '#3a4f7a' }),
      sis: makeAvatar({ seed: 3, skin: 'light', hair: 'buns', hairColor: '#6a3a1a', top: 'tee', topColor: '#ff7ac2', bottom: 'skirt', bottomColor: '#8a4fd0', height: 0.85 }),
      dad: makeAvatar({ seed: 4, skin: 'light', hair: 'short', hairColor: '#3a2416', top: 'jersey', topColor: '#d23a3a', number: '12', bottom: 'jeans', bottomColor: '#2a3a5a', cap: '#d23a3a' }),
      n1: makeAvatar({ seed: 5, skin: 'brown', hair: 'afro', hairColor: '#1b1210', top: 'sweater', topColor: '#e8a23a', bottom: 'slacks', bottomColor: '#4a3a2a' }),
      n2: makeAvatar({ seed: 6, skin: 'tan', hair: 'ponytail', hairColor: '#1b1210', top: 'hoodie', topColor: '#7ab8ff', bottom: 'jeans', bottomColor: '#3f74c8' }),
      gob: makeTurkey({ seed: 1 }),
      chef: makeTurkey({ seed: 2, hat: 'chef', sash: false, body: '#8a5a34' }),
      guest: makeTurkey({ seed: 3, hat: 'none', sash: false, body: '#6a3a22' }),
    };
    for (const a of Object.values(c)) set.group.add(a.root);
    return { ...c, sp: makeSparkles(set.group), veil: makeVeil(set.group) };
  };
  const S = cast(street), K = cast(kitchen), N = cast(neighbors), H = cast(home), L = cast(living), F = cast(feast), FD = cast(feastDrone);
  // feast seating: back side of the table (z = -3, facing the camera)
  const seat = (X, who, faces, t, hats = true) => who.forEach((k, i) => { const a = X[k]; a.reset().place(-4.4 + i * 4.4, -3.1, 0).sit(1.6).setFace(faces[i % faces.length]).idle(t, 0.6); });
  const dadInPie = (X, t, face = 'grin') => { pie.visible = true; X.dad.reset().place(0, 0.2, 0, 3.4).sit(0.1).pose({ aR: [165, 28] }).setFace(face); X.dad.armR.rotation.z += Math.sin(t * 9) * 0.3; return X.dad; };
  [F, FD].forEach(X => { hatOn(X.me, '#f2b01e'); hatOn(X.mom, '#2b7de0'); hatOn(X.sis, '#ff6fd8'); });

  // ── ACT 1: the rule
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: drone([0, 4, 0], { h: 32, back: 46, drift: [8, -2, -8], fov: 52 }),
    act(lt, c) { S.gob.reset().place(-6 + lt * 2.5, 4, Math.PI / 2).walk(c.t).holdClip(); } });
  shot({ line: 'the turkeys cook Thanksgiving dinner,', set: kitchen, cam: { pos: [2.5, 5.2, 13], look: [-2.2, 5.6, -1.5], fov: 54, blur: 0.2, push: 0.07 },
    act(lt, c) { K.chef.reset().place(-1.2, -1.5, -0.35).idle(c.t).face('happy'); K.chef.wingR.rotation.x = -1.2 + Math.sin(c.t * 6) * 0.25; steam.at(lt, [-5.5, 6, -3.3], 1); } });
  shot({ line: 'not the people.', set: kitchen, cam: frame(4, 3, { size: 'medium', side: -16 }),
    act(lt, c) { K.n1.reset().place(3, 3, -0.3).pose('shy').setFace('worried').idle(c.t); K.n2.reset().place(6, 2.5, -0.5).pose('shy').setFace('gasp').idle(c.t); K.chef.reset().place(-1.2, -1.5, 0.6).idle(c.t).face('narrow'); } });
  shot({ line: 'Every year, the biggest turkey in town,', set: street, sfx: [['thud', 'biggest', 0.6]], cam: { pos: [6, 1.2, 18], look: [2, 7, 4], fov: 56, blur: 0.1, push: 0.06 },
    act(lt, c) { S.gob.reset().place(2, 4, 0.25).idle(c.t).holdClip(0.6); S.n2.reset().place(-6, 4.5, 0.4).setFace('worried').idle(c.t).size(1); } });
  shot({ line: 'Mayor Gobbles,', set: street, sfx: [['ding', 'gobbles', 0.6]], cam: { pos: [2.8, 7.4, 12.5], look: [2, 7.6, 4], fov: 46, blur: 0.6, push: 0.1 },
    act(lt, c) { S.gob.reset().place(2, 4, -0.1).idle(c.t).face(lt < c.w('gobbles') ? 'normal' : 'happy'); } });
  shot({ line: 'walks door to door', set: street, cam: handheld(follow(lt => [-14 + lt * 3.2, 0, 4], [-6, 5, 15], { lookY: 5, fov: 56 }), 0.8),
    act(lt, c) { S.gob.reset().place(-14 + lt * 3.2, 4, Math.PI / 2).walk(c.t).holdClip(); } });
  shot({ line: 'with a clipboard', set: neighbors, cam: { pos: [40, 4, 5.2], look: [40, 4, 0], fov: 50, blur: 0.2, push: 0.1 },
    act(lt, c) { neighbors.clip.draw(0, 0); } });
  shot({ line: 'and asks every family one question.', set: neighbors, cam: { pos: [-15, 6, 15], look: [1.5, 4, 2], fov: 52, blur: 0.1, push: 0.05 },
    act(lt, c) { N.gob.reset().place(3.5, 5, -2.4).idle(c.t).talk(c.t).holdClip(); N.n1.reset().place(-1, 0.6, 0.3).setFace('worried').idle(c.t); N.n2.reset().place(1.6, 0.8, 0.1).setFace('gasp').idle(c.t); } });
  shot({ line: 'What are you thankful for?', set: neighbors, cam: { pos: [1.2, 7.6, 14.5], look: [3.5, 7.8, 5], fov: 46, blur: 0.6, push: 0.08 },
    act(lt, c) { N.gob.reset().place(3.5, 5, -0.25).idle(c.t).talk(c.t).holdClip().face('narrow'); } });
  shot({ line: 'If he likes your answer,', set: neighbors, sfx: [['pop', 'likes', 0.5]], cam: frame(0.3, 0.7, { size: 'medium', side: 10, facing: 0 }),
    act(lt, c) { N.n1.reset().place(-1, 0.6, 0.3).pose('open').setFace('say').talk(c.t); N.n2.reset().place(1.6, 0.8, 0.1).setFace(lt < c.w('likes') ? 'calm' : 'joy').idle(c.t); } });
  shot({ line: "you're invited to his feast.", set: feast, sfx: [['sparkle', 'feast', 0.6]], cam: { pos: [4, 9.5, 19], look: [0, 3.5, -2], fov: 56, blur: 0.1, push: 0.05 },
    act(lt, c) { feast.update(c.t); seat(F, ['n1', 'n2'], ['joy', 'winkjoy'], c.t); F.n1.root.position.x = -4.4; F.n2.root.position.x = 4.4; F.gob.reset().place(-10, -1, 0.9).idle(c.t).face('happy').wave(c.t); F.guest.reset().place(10, -1, -0.9).idle(c.t).face('happy'); F.root; } });
  shot({ line: "If he doesn't,", set: neighbors, cam: frame(3.5, 5, { size: 'close', h: 1.6, y: 2.4, side: -20 }),
    act(lt, c) { N.gob.reset().place(3.5, 5, -0.4).idle(c.t, 0.4).face('narrow').holdClip(); } });
  shot({ line: "you're on the menu. //", set: feast, sfx: [['thud', 'menu', 0.9]], cam: { pos: [-26, 4.6, 8.2], look: [-26, 4.2, 2], fov: 50, blur: 0.25, push: 0.1 },
    act(lt, c) { feast.update(c.t); } });

  // ── ACT 2: Max, and the big mistake
  shot({ line: 'My name is Max,', set: home, cam: frame(0, 3.2, { size: 'close', side: -12 }),
    act(lt, c) { H.me.reset().place(0, 3.2, -0.1).setFace('calm').idle(c.t); } });
  shot({ line: 'and I was never scared,', set: home, cam: frame(0, 3.2, { size: 'medium', side: 16 }),
    act(lt, c) { H.me.reset().place(0, 3.2, 0.2).pose('hips').setFace(lt < c.w('never') ? 'calm' : 'joy').idle(c.t); } });
  shot({ line: 'because my family always just says', set: living, cam: frame(-1, 1.5, { size: 'wide', side: -8 }),
    act(lt, c) { L.mom.reset().place(-5, 1.5, 0.2).setFace('smile').idle(c.t); L.dad.reset().place(-1, 1.2, 0).setFace('smile').idle(c.t); L.sis.reset().place(2.6, 1.8, -0.2).setFace('smile').idle(c.t); L.me.reset().place(5.6, 1.8, -0.3).setFace('calm').idle(c.t); } });
  shot({ line: '"each other."', set: living, sfx: [['sparkle', 'other', 0.4]], cam: frame(-3, 1.4, { size: 'medium', side: 12, dist: 1.3 }),
    act(lt, c) { L.mom.reset().place(-5, 1.5, 0.2).pose('hug').setFace('say').talk(c.t); L.dad.reset().place(-1, 1.2, 0).pose('hug').setFace('grin').idle(c.t); } });
  shot({ line: 'But this year,', set: street, cam: { pos: [-30, 9, 24], look: [-10, 6, -8], fov: 52, blur: 0, push: 0.06 },
    act(lt, c) { S.gob.reset().place(-14 + lt * 3, 4, Math.PI / 2).walk(c.t).holdClip(); } });
  shot({ line: 'when Gobbles knocked on our door,', set: home, sfx: [['thud', 'knocked', 0.8], ['thud', 'our', 0.6]], cam: drone([0, 4, 2], { h: 24, back: 34, drift: [6, -2, -6], fov: 50 }),
    act(lt, c) { H.gob.reset().place(0, 4.2, Math.PI).idle(c.t).holdClip(); if (lt > c.w('knocked')) { H.gob.wingL.rotation.x = -1.4 + Math.abs(Math.sin(c.t * 12)) * 0.4; } } });
  shot({ line: 'my dad was watching football,', set: living, cam: frame(-2, -2.6, { size: 'full', side: 34, y: 0.5 }),
    act(lt, c) { L.dad.reset().place(-2, -2.6, 0.9).sit(1.3).setFace('grin').idle(c.t); } });
  shot({ line: 'and he yelled,', set: living, cam: frame(-2, -2.6, { size: 'medium', side: -10, y: 0.4, push: 0.1 }),
    act(lt, c) { L.dad.reset().place(-2, -2.6, 0.3).sit(1.3).pose('cheer').setFace('talk').talk(c.t); } });
  shot({ line: '"I\'m thankful', set: living, cam: frame(-2, -2.6, { size: 'close', side: 14, y: 0.4 }),
    act(lt, c) { L.dad.reset().place(-2, -2.6, 0.3).sit(1.3).pose('cheer').setFace('laugh').talk(c.t); } });
  shot({ line: 'for turkey sandwiches!" //', set: home, sfx: [['thud', 'sandwiches', 0.6]], cam: frame(0, 4.2, { size: 'close', h: 1.6, y: 2.4, side: 16 }),
    act(lt, c) { H.gob.reset().place(0, 4.2, 0.1).face(lt < c.w('turkey') ? 'normal' : 'stare').holdClip(); if (lt < c.w('sandwiches')) H.gob.idle(c.t, 0.5); } });
  shot({ line: 'Gobbles slowly wrote something', set: home, cam: frame(0, 4.2, { size: 'full', h: 1.2, side: -24 }),
    act(lt, c) { H.gob.reset().place(0, 4.2, 0.2).face('narrow').write(c.t); } });
  shot({ line: 'on his clipboard.', set: home, sfx: [['tick', 'clipboard', 0.6]], cam: { pos: [40, 4, 5.4], look: [40, 3.6, 0], fov: 50, blur: 0.2, push: 0.1 },
    act(lt, c) { home.clip.draw(clamp(lt / (c.d * 0.9)), clamp((lt - c.d * 0.7) / 0.15)); } });
  shot({ line: 'Then he looked at me.', set: home, cam: { pos: [1.6, 7.6, 11.4], look: [0, 7.8, 4], fov: 44, blur: 0.6, push: 0.12 },
    act(lt, c) { H.gob.reset().place(0, 4.2, 0.1).idle(c.t, 0.3).face('narrow', lt < c.w('looked') ? -1 : 0.8).holdClip(); H.gob.head.rotation.y = lt < c.w('looked') ? -0.5 : 0.25; } });
  shot({ line: 'I panicked', set: home, sfx: [['pop', 0, 0.4]], cam: frame(-3, 1.8, { size: 'close', side: 12 }),
    act(lt, c) { H.me.reset().place(-3, 1.8, 0.4).setFace('gasp').idle(c.t, 0.3); } });
  shot({ line: 'and said the first thing in my head.', set: home, cam: frame(-3, 1.8, { size: 'medium', side: -18 }),
    act(lt, c) { H.me.reset().place(-3, 1.8, 0.6).pose('shy').setFace('uneasy').idle(c.t); H.gob.reset().place(1.5, 5.6, -1.6).face('narrow').holdClip(); } });
  shot({ line: '"I\'m thankful for you,', set: home, cam: frame(-3, 1.8, { size: 'close', side: 8, push: 0.1 }),
    act(lt, c) { H.me.reset().place(-3, 1.8, 0.6).pose('open', 0.8).setFace('say').talk(c.t); } });
  shot({ line: 'Mayor Gobbles."', set: home, cam: frame(-3, 1.8, { size: 'close', side: -14 }),
    act(lt, c) { H.me.reset().place(-3, 1.8, 0.6).pose('open', 0.8).setFace('grin').idle(c.t); } });
  shot({ line: 'He stared at me', set: home, cam: { pos: [-1.6, 7.6, 11.8], look: [0, 7.7, 4], fov: 44, blur: 0.6, push: 0.08 },
    act(lt, c) { H.gob.reset().place(0, 4.2, -0.3).face('stare').holdClip(); } });
  shot({ line: 'for a really long time.', set: home, cam: { pos: [0.8, 7.8, 11.2], look: [0, 7.8, 4], fov: 46, blur: 0.7, push: 0.05 },
    act(lt, c) { H.gob.reset().place(0, 4.2, -0.3).face('stare').holdClip(); } });
  shot({ line: 'Then his eyes filled with tears,', set: home, sfx: [['sad', 'tears', 0.5]], cam: { pos: [-1.8, 7.4, 11.4], look: [0, 7.6, 4], fov: 44, blur: 0.6, push: 0.1 },
    act(lt, c) { H.gob.reset().place(0, 4.2, -0.3).face(lt < c.w('tears') ? 'stare' : 'cry').idle(c.t, 0.6).holdClip(); } });
  shot({ line: 'and he hugged me.', set: home, sfx: [['sparkle', 'hugged', 0.7]], cam: { pos: [-1.4, 5.2, 17], look: [-1.4, 4.6, 3], fov: 52, blur: 0.15, push: 0.07 },
    act(lt, c) { const k = E.inOut(remap(lt, 0, 0.5)); H.gob.reset().place(1.4 - k * 0.8, 3, -Math.PI / 2).face('cry').hug(k).idle(c.t); H.me.reset().place(-3.2, 3, Math.PI / 2).pose('hug').setFace(lt < c.w('hugged') ? 'gasp' : 'joy').idle(c.t); H.sp.at(lt - c.w('hugged'), [-1.4, 4, 3], 0.9); } });

  // ── ACT 3: the feast, and the twist
  shot({ line: 'That night,', set: feastDrone, sfx: [['whoosh', 0]], cam: drone([0, 2, 0], { h: 28, back: 36, drift: [-6, -2, -6], fov: 52 }),
    act(lt, c) { feastDrone.update(c.t); seat(FD, ['mom', 'me', 'sis'], ['joy'], c.t); FD.gob.reset().place(-10, -1, 0.9).idle(c.t).face('happy'); FD.guest.reset().place(10, -1, -0.9).idle(c.t).face('happy'); } });
  shot({ line: 'my mom, my sister and I', set: feast, cam: { pos: [1.5, 8.5, 13], look: [0, 4.5, -3], fov: 50, blur: 0.2, push: 0.06 },
    act(lt, c) { feast.update(c.t); seat(F, ['mom', 'me', 'sis'], ['joy', 'joy', 'winkjoy'], c.t); F.dad.root.visible = false; } });
  shot({ line: 'ate the best dinner of our lives', set: feast, cam: frame(0, -3.1, { size: 'close', side: -12, y: 1.5 }),
    act(lt, c) { feast.update(c.t); seat(F, ['mom', 'me', 'sis'], ['joy', 'joy', 'joy'], c.t); F.me.pose({ aR: [70 + Math.sin(c.t * 10) * 20, 4] }); F.me.talk(c.t); } });
  shot({ line: 'at his feast.', set: feast, cam: frame(-10, -1, { size: 'full', h: 1.5, side: 22 }),
    act(lt, c) { feast.update(c.t); F.gob.reset().place(-10, -1, 0.9).idle(c.t).face('happy').wave(c.t); seat(F, ['mom', 'me', 'sis'], ['joy'], c.t); } });
  shot({ line: 'Everything was perfect,', set: feast, cam: frame(0, -3.1, { size: 'close', side: 14, y: 1.5 }),
    act(lt, c) { feast.update(c.t); seat(F, ['mom', 'me', 'sis'], ['joy', 'joy', 'joy'], c.t); } });
  shot({ line: 'except for one thing.', set: feast, cam: frame(0, -3.1, { size: 'close', side: -6, y: 1.5, push: 0.12 }),
    act(lt, c) { feast.update(c.t); seat(F, ['mom', 'me', 'sis'], ['joy', lt < c.w('one') ? 'calm' : 'uneasy', 'joy'], c.t); } });
  shot({ line: 'The main course', set: feast, cam: { pos: [2, 6.2, 8], look: [0, 3.6, 0], fov: 48, blur: 0.3, push: 0.08 },
    act(lt, c) { feast.update(c.t); dadInPie(F, c.t * 0.0, 'grin').pose('idle'); F.dad.root.visible = false; } });
  shot({ line: 'was sitting in a giant pie dish,', set: feast, cam: { pos: [-5, 6.5, 12], look: [0, 4.6, 0], fov: 50, blur: 0.2, push: 0.07 },
    act(lt, c) { feast.update(c.t); dadInPie(F, c.t, 'smile'); F.dad.pose('idle'); F.dad.idle(c.t); } });
  shot({ line: 'waving at me.', set: feast, sfx: [['boing', 'waving', 0.5]], cam: frame(0, 0.2, { size: 'medium', y: 3.4, side: 14 }),
    act(lt, c) { feast.update(c.t); dadInPie(F, c.t, 'grin'); } });
  shot({ line: 'It was my dad. ///', set: feast, sfx: [['pop', 'dad', 0.5]], cam: frame(0, 0.2, { size: 'close', y: 3.4, side: -10, push: 0.1 }),
    act(lt, c) { feast.update(c.t); dadInPie(F, c.t, lt < c.w('dad') ? 'grin' : 'winkjoy'); } });
});
