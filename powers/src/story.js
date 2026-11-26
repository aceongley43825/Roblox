// story.js: "In this town, every kid gets a superpower on their tenth birthday."
// Sets, cast, then one shot() per picture. The spoken script is the shots' `line` strings joined in order.
import * as THREE from 'three';
import { start, shot, frame, LIGHTS } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, sky, building, door, bench, table } from './sets.js';
import { makeSparkles, makePuff, makeEmote, makeBulb } from './fx.js';
import { remap, E, lerp, clamp, box, at, grp, sign, glow, mat, PRE } from './util.js';

LIGHTS.night = { amb: 0.85, hemi: 0.6, sun: 0.9, dir: [-6, 16, 8], sunColor: '#a9bcff', bg: '#16203a', exposure: 1.0 };
LIGHTS.blackout = { amb: 0.38, hemi: 0.28, sun: 0.4, dir: [-6, 16, 8], sunColor: '#6f82c8', bg: '#05070f', exposure: 0.95 };
LIGHTS.bright = { amb: 1.25, hemi: 0.9, sun: 1.3, dir: [-6, 16, 8], sunColor: '#fff1c4', bg: '#1d2a4a', exposure: 1.05 };

// street lamp with a lit head and a dark head, switched per frame
function lamp(h = 9) {
  const on = box(1.1, 1.3, 1.1, glow('#fff3c4', 1.5)), off = box(1.1, 1.3, 1.1, '#3a3d48');
  const haloT = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,240,190,0.9)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })());
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); halo.scale.setScalar(5);
  const g = grp(at(box(0.3, h, 0.3, '#17181c'), 0, h / 2, 0), at(on, 0, h + 0.5, 0), at(off, 0, h + 0.5, 0), at(box(1.4, 0.25, 1.4, '#17181c'), 0, h + 1.25, 0), at(halo, 0, h + 0.5, 0));
  g.userData.set = k => { on.visible = halo.visible = k > 0; off.visible = !on.visible; on.material.color.setRGB(1, 0.95, 0.77).multiplyScalar(1.5 * Math.max(k, 0.01)); halo.material.opacity = Math.min(1, k); halo.scale.setScalar(4 + 2 * k); };
  return g;
}
// every glowing material in a group (shop windows, signs that glow) dimmed or boosted together
function glowGroup(root) { const L = []; root.traverse(o => { if (o.isMesh && o.material && o.material.type === 'MeshBasicMaterial' && o.material.toneMapped === false) L.push([o.material, o.material.color.clone()]); }); return k => { for (const [m, c] of L) m.color.copy(c).multiplyScalar(k); }; }
function cake() { return grp(at(box(3, 1.2, 3, '#ff9fc6', 0.2), 0, 0.6, 0), at(box(3.1, 0.25, 3.1, '#ffffff', 0.1), 0, 1.25, 0), ...[-0.6, 0.6].map(x => at(box(0.18, 0.7, 0.18, '#5ab0ff'), x, 1.7, 0)), ...[-0.6, 0.6].map(x => at(box(0.16, 0.26, 0.16, glow('#ffb43a', 1.6)), x, 2.2, 0)), at(sign('10', 1.2, 0.8, { bg: '#ffffff', fg: '#e8458b' }), 0, 0.6, 1.52)); }
function medal() { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 24), glow('#ffcf33', 1.4)); d.rotation.x = Math.PI / 2; return grp(at(box(0.16, 0.7, 0.04, '#e8413c'), -0.2, 0.35, 0), at(box(0.16, 0.7, 0.04, '#2f7de1'), 0.2, 0.35, 0), d); }

start(() => {
  // ── sets
  const day = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['TOYS', '#bfe3ff', '#2f7de1'], ['HEROES', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['PETS', '#e4d0ff', '#7b3fc4']] });
  const dayBench = bench(); day.group.add(dayBench); day.reset = () => { at(dayBench, -3, 0, 2.5); dayBench.rotation.z = 0; };

  const party = SETS.livingRoom({ wall: '#dff0ff', sofa: '#7b3fc4' });
  party.group.add(at(table(6, 3.2, '#ffffff', 2.7), 0, 0, 1.5), at(cake(), 0, 2.85, 1.5), at(sign('HAPPY 10TH JAY!', 9, 1.6, { bg: '#ffcf33', fg: '#e8458b' }), -1, 11.2, -5.85));

  const park = SETS.park(); park.light = 'night'; park.group.remove(park.group.children[0]); park.group.add(sky('#0a1434', '#33447e'));
  const parkDay = SETS.park();

  const night = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['TOYS', '#bfe3ff', '#2f7de1'], ['HEROES', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['PETS', '#e4d0ff', '#7b3fc4']] });
  night.group.remove(night.group.children[0]); night.light = 'night';
  const townGlow = glowGroup(night.group); night.group.add(sky('#0a1434', '#33447e'));
  const LX = [-14, -5, 4, 13], lamps = LX.map(x => { const l = lamp(); night.group.add(at(l, x, 0, 3.2)); return l; });
  let lampK = [1, 1, 1, 1], townK = 1;
  night.reset = () => { lampK = [1, 1, 1, 1]; townK = 1; };
  night.update = () => { lamps.forEach((l, i) => l.userData.set(lampK[i])); townGlow(townK); };

  const plant = { group: grp(sky('#0a1434', '#33447e'), at(new THREE.Mesh(new THREE.PlaneGeometry(200, 120), mat('#2e6b34')).rotateX(-Math.PI / 2), 0, -0.02, -20), at(box(60, 0.1, 14, '#8f9096'), 0, 0.02, 2)), light: 'blackout' };
  plant.group.add(at(building(30, 13, 10, '#9aa0aa', { sign: 'POWER PLANT', signFg: '#2a2a33', windows: [4, 2], door: false }), 0, 0, -9));
  const pDoor = door('', '#6a6e78'); plant.group.add(pDoor);
  const gen = grp(at(box(6, 4.2, 3.6, '#f2b01e', 0.2), 0, 2.1, 0), at(sign(['DANGER', 'HIGH VOLTAGE'], 3.6, 1.4, { bg: '#1b1b1b', fg: '#ffcf33' }), 0, 2.4, 1.82));
  const coils = [-1.8, 0, 1.8].map(x => { const on = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 16), glow('#7fe8ff', 1.8)), off = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 16), mat('#4a5060')); gen.add(at(on, x, 5.4, 0), at(off, x, 5.4, 0)); return [on, off]; });
  plant.group.add(at(gen, 9, 0, -1)); for (let x = -26; x <= 26; x += 4) plant.group.add(at(box(0.2, 3, 0.2, '#8a8f99'), x, 1.5, 7.5)); plant.group.add(at(box(52, 0.15, 0.1, '#8a8f99'), 0, 2.6, 7.5));
  const plantGlow = glowGroup(plant.group); let genOn = 0;
  plant.reset = () => { at(pDoor, 0, 0, -3.7); pDoor.rotation.set(0, 0, 0); genOn = 0; };
  plant.update = () => { for (const [on, off] of coils) { on.visible = genOn > 0; off.visible = !on.visible; } plantGlow(0.15 + genOn); };

  const hall = SETS.schoolFront({ name: 'SPARK CITY SCHOOL' });

  // ── cast: identical options in every set
  const OPT = {
    jay: { seed: 1, skin: 'light', hair: 'swoop', hairColor: '#1b1210', top: 'hoodie', topColor: '#ffcf33', bottom: 'jeans', bottomColor: '#3a5a9a' },
    sis: { seed: 2, skin: 'light', hair: 'ponytail', hairColor: '#1b1210', top: 'jersey', topColor: '#e8413c', number: '5', bottom: 'shorts', bottomColor: '#22262b', height: 0.92 },
    noah: { seed: 3, skin: 'deep', hair: 'dreads', hairColor: '#17110f', top: 'zip', topColor: '#2e9e59', sleeves: 'long', bottom: 'joggers', bottomColor: '#15151a' },
    mayor: { seed: 4, skin: 'fair', hair: 'bald', top: 'suit', topColor: '#22305a', tie: '#e8413c', sleeves: 'long', bottom: 'slacks', bottomColor: '#22305a', shoe: '#1b1b1b', sole: '#111', glasses: true },
    amy: { seed: 5, skin: 'tan', hair: 'bob', hairColor: '#3a2212', top: 'stripes', topColor: '#ff7aa8', stripe: '#ffffff', bottom: 'skirt', bottomColor: '#5b3fa0' },
    ben: { seed: 6, skin: 'brown', hair: 'curly', hairColor: '#17110f', top: 'tee', topColor: '#2f7de1', bottom: 'cargo', bottomColor: '#5b5f44' },
    guy: { seed: 7, skin: 'fair', hair: 'spiky', hairColor: '#e8632b', top: 'vest', topColor: '#7b3fc4', sleeves: 'long', bottom: 'jeans', bottomColor: '#274b8f' },
  };
  const cast = set => {
    const c = {}; for (const [k, o] of Object.entries(OPT)) { c[k] = makeAvatar(o); set.group.add(c[k].root); }
    const m = medal(); m.position.set(0, 0.25, 0.53); c.jay.torso.add(m); c.jay.medal = m; PRE.push(() => { m.visible = false; });
    return { ...c, sp: makeSparkles(set.group), sp2: makeSparkles(set.group, 7), puff: makePuff(set.group), puff2: makePuff(set.group, 8), bang: makeEmote(set.group, '!'), q: makeEmote(set.group, '?', '#2f7de1'), dots: makeEmote(set.group, '...', '#555'), bulb: makeBulb(set.group) };
  };
  const D = cast(day), P = cast(party), K = cast(park), Kd = cast(parkDay), N = cast(night), W = cast(plant), S = cast(hall);
  const zoom = (av, puff, c, x, z, dir, lt) => { av.reset().place(x, z, dir * Math.PI / 2).run(c.t, 1.6).setFace('grin'); av.hip.rotation.x = 0.4; puff.at((lt * 4) % 0.6, [x - dir * 1.5, 0, z]); };
  const crowdNight = (C, lt, c, face, o = {}) => { for (const [k, x, z, ry] of [['amy', -6, 2, 0.4], ['ben', 6, 2.4, -0.4], ['guy', -3.5, 4.6, 0.2], ['noah', 3.5, 4.8, -0.2], ['sis', 8.5, 4.2, -0.5]]) { const a = C[k].reset().place(x, z, ry).setFace(face).idle(c.t); if (o.cheer) { a.pose('cheer', 0.9); a.hip.position.y += Math.abs(Math.sin(c.t * 8 + x)) * 0.3; } if (o.scared) { a.pose({ aL: [140, -10], aR: [140, -10] }); a.hip.position.x = Math.sin(c.t * 40 + x) * 0.05; } } };

  // ───────── HOOK: powers on the street
  shot({ line: 'In this town,', set: day, sfx: [['whoosh', 0]], cam: { pos: [2, 4.6, 26], look: [0, 5.6, 0], fov: 60, blur: 0.1, push: 0.03 },
    act(lt, c) { zoom(D.amy, D.puff, c, -14 + lt * 30, 3.5, 1, lt); D.guy.reset().place(4, 1.5, -0.2).setFace('grin').idle(c.t); D.guy.root.position.y = 2 + Math.sin(c.t * 2) * 0.3; D.sp.at((lt * 1.2) % 1, [4, 2, 1.5], 0.8); } });
  shot({ line: 'every kid gets a superpower on their tenth birthday.', set: day, sfx: [['pop', 'superpower'], ['sparkle', 'superpower'], ['boing', 'birthday', 0.5]], cam: frame(-3, 3.2, { size: 'full', side: -10, dist: 1.25 }),
    act(lt, c) { const tu = c.w('superpower'), k = E.back(remap(lt, tu, tu + 0.5)); D.ben.reset().place(-3, 3.2, 0).pose(lt < tu ? 'idle' : 'cheer').setFace(lt < tu ? 'smile' : 'grin').idle(c.t); dayBench.position.set(-3, 2 + k * 4.2, 3.2); D.sp.at(lt - tu, [-3, 0, 3.2]); } });

  // ───────── JAY'S BIRTHDAY
  shot({ line: 'My name is Jay,', set: party, sfx: [['pop', 'jay', 0.6]], cam: frame(0, 4.4, { size: 'medium', side: 8 }),
    act(lt, c) { P.jay.reset().place(0, 4.4, 0).pose('open').setFace(lt < c.w('jay') ? 'smile' : 'grin').idle(c.t); if (lt > c.w('jay')) { P.jay.pose('wave', remap(lt, c.w('jay'), c.w('jay') + 0.15)); P.jay.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } } });
  shot({ line: 'and today I turned ten.', set: party, sfx: [['ding', 'ten', 0.6]], cam: { pos: [1.2, 6, 11.5], look: [0, 4.4, 2.5], fov: 58, blur: 0.25, push: 0.03 },
    act(lt, c) { P.jay.reset().place(0, 4.4, Math.PI).setFace('grin'); P.jay.root.rotation.y = 0; P.jay.pose('cheer', remap(lt, c.w('ten'), c.w('ten') + 0.2)).idle(c.t);
      for (const [k, x] of [['sis', -4], ['noah', 4], ['amy', -7], ['ben', 7]]) P[k].reset().place(x, 3.4, x < 0 ? 0.5 : -0.5).setFace('grin').idle(c.t); P.sp.at(lt - c.w('ten'), [0, 0, 4.4], 0.9); } });
  shot({ line: 'My sister got super speed.', set: parkDay, sfx: [['whoosh', 'super'], ['whoosh', 'speed']], cam: { pos: [0, 4.4, 18], look: [0, 3.4, 1], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) { const x = -12 + ((lt - c.w('super')) * 16); if (lt > c.w('super')) zoom(Kd.sis, Kd.puff, c, x, 2, 1, lt); else Kd.sis.reset().place(-2.5, 2, 0.4).setFace('smile').idle(c.t); Kd.jay.reset().place(2.8, 1, -0.4).setFace(lt < c.w('speed') ? 'neutral' : 'wow').idle(c.t); } });
  shot({ line: 'My best friend Noah got super strength.', set: day, sfx: [['thud', 'strength', 1.2]], cam: frame(-3, 3.2, { size: 'full', side: 10, low: 0.2, dist: 1.3 }),
    act(lt, c) { const ts = c.w('strength'), k = E.back(remap(lt, ts - 0.3, ts + 0.2)); D.noah.reset().place(-3, 3.2, 0).pose({ aL: [lerp(60, 175, k), 20], aR: [lerp(60, 175, k), 20] }).setFace(lt < ts ? 'serious' : 'grin').idle(c.t); dayBench.position.set(-3, lerp(1.2, 6.4, k), 3.2); } });
  shot({ line: 'I waited all day.', set: party, cam: frame(-4, -2.6, { size: 'full', y: -0.6, side: -28 }),
    act(lt, c) { P.jay.reset().place(-4, -2.6, 0).sit(1.3).setFace('neutral').idle(c.t); P.jay.pose({ aL: [60, -20], aR: [60, -20] }); P.jay.head.rotation.x = 0.2 + Math.sin(c.t * 1.5) * 0.05; } });
  shot({ line: 'Nothing happened.', set: party, sfx: [['sad', 'happened', 0.6]], cam: frame(-4, -2.6, { size: 'close', y: -0.6, side: 10 }),
    act(lt, c) { P.jay.reset().place(-4, -2.6, 0).sit(1.3).setFace(lt < c.w('happened') ? 'serious' : 'sad').idle(c.t); P.dots.at(lt - c.w('happened'), P.jay, 2); P.jay.pose({ aR: [100, 30] }); } });
  shot({ line: 'Everyone laughed and called me Powerless Jay.', set: hall, sfx: [['pop', 'laughed', 0.7], ['sad', 'powerless', 0.5]], cam: { pos: [0, 4.6, 17], look: [0, 3.6, 2], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { const tl = c.w('laughed'); S.jay.reset().place(0, 3, 0).setFace(lt < tl ? 'neutral' : 'cry').idle(c.t); if (lt > tl) S.jay.pose('slump', remap(lt, tl, tl + 0.3));
      for (const [k, x, z] of [['amy', -3.4, 2], ['ben', 3.4, 2.2], ['guy', -6, 4], ['sis', 6, 4.2]]) { const a = S[k].reset().place(x, z, x < 0 ? 0.6 : -0.6).setFace(lt < tl ? 'smile' : 'laugh').idle(c.t); if (lt > tl) { a.pose({ aL: [30, 20], aR: [80, 4] }, 0.9); a.hip.position.y += Math.abs(Math.sin(c.t * 9 + x)) * 0.2; } } } });

  // ───────── THE NIGHT
  shot({ line: 'That night, I sat alone in the park', set: park, cam: { pos: [-2, 4.2, 12], look: [-7, 2.8, -1.4], fov: 60, blur: 0.2, push: 0.03 },
    act(lt, c) { K.jay.reset().place(-7, -1.4, 0).sit(1.3).setFace('sad').idle(c.t); K.jay.pose({ aL: [40, -10], aR: [40, -10] }); } });
  shot({ line: 'and wished for any power at all.', set: park, sfx: [['sparkle', 'power', 0.5]], cam: frame(-7, -1.4, { size: 'close', y: -0.6, side: -14 }),
    act(lt, c) { K.jay.reset().place(-7, -1.4, 0).sit(1.3).setFace('sleepy').idle(c.t); K.jay.pose({ aL: [28, -18], aR: [28, -18] }); K.sp.at(lt - c.w('power'), [-7, -0.8, -1.2], 0.5); } });
  shot({ line: 'Suddenly, every light in town went out.', set: night, sfx: [['thud', 'out', 1.3]], light: 'night', cam: { pos: [0, 7, 30], look: [0, 6, 0], fov: 60, blur: 0.05, push: 0.04 },
    act(lt, c) { const to = c.w('out'); if (lt > to) { townK = 0.08; lampK = [0, 0, 0, 0]; c.shot.light = 'blackout'; } else { c.shot.light = 'night'; if (lt > to - 0.4) { const f = Math.floor(c.t * 20) % 2; townK = f ? 1 : 0.2; lampK = [f, 1 - f, f, 1 - f]; } } } });
  shot({ line: 'People started screaming.', set: night, light: 'blackout', sfx: [['pop', 'screaming']], cam: { pos: [0, 4.6, 17], look: [0, 3.6, 2], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { townK = 0.08; lampK = [0, 0, 0, 0]; crowdNight(N, lt, c, lt < c.w('screaming') ? 'worried' : 'scream', { scared: lt > c.w('screaming') }); } });
  shot({ line: 'Noah tried to fix the power plant,', set: plant, cam: { pos: [3, 4.4, 14], look: [0, 4, -3], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { W.noah.reset().place(0.4, -1.4, Math.PI).setFace('serious'); W.noah.pose({ aL: [100, 10], aR: [100, 10] }); W.noah.root.rotation.y = Math.PI; } });
  shot({ line: 'but he just ripped the door off.', set: plant, sfx: [['thud', 'ripped', 1.3], ['whoosh', 'off', 0.6]], cam: frame(0.4, -0.6, { size: 'full', side: 20, dist: 1.2 }),
    act(lt, c) { const tr = c.w('ripped'), k = E.out(remap(lt, tr, tr + 0.4)); W.noah.reset().place(0.4, lerp(-1.4, 1.2, k), lerp(Math.PI, 0.2, k)).pose({ aL: [lerp(100, 170, k), 10], aR: [lerp(100, 170, k), 10] }).setFace(lt < tr ? 'serious' : 'shock');
      if (lt > tr) { pDoor.position.set(lerp(0, 0.6, k), lerp(0, 5.6, k), lerp(-3.7, 1.2, k)); pDoor.rotation.set(lerp(0, -Math.PI / 2, k), 0, 0); W.bang.at(lt - tr - 0.3, W.noah, 1.4); } W.puff.at(lt - tr, [0, 0, -3]); } });
  shot({ line: 'My sister ran so fast she crashed into a tree.', set: night, light: 'blackout', sfx: [['whoosh', 'ran'], ['thud', 'crashed', 1.3], ['boing', 'tree', 0.6]], cam: { pos: [-8, 4.2, 22], look: [-15, 3.2, 8], fov: 60, blur: 0.15, push: 0.02 },
    act(lt, c) { townK = 0.08; lampK = [0, 0, 0, 0]; const tc = c.w('crashed'); if (lt < tc) zoom(N.sis, N.puff, c, -2 - (lt / tc) * 13.6, 8, -1, lt);
      else { const k = E.out(remap(lt, tc, tc + 0.3)); N.sis.reset().place(-15.6 + k * 1.6, 8, -Math.PI / 2 + 0.3).setFace('shock'); N.sis.root.rotation.z = -k * 1.4; N.sis.root.position.y = Math.sin(k * Math.PI) * 1.2; N.puff.at(lt - tc, [-16.2, 1, 8]); N.q.at(lt - tc - 0.3, N.sis, 2); } } });

  // ───────── JAY'S POWER
  shot({ line: 'Then I noticed something.', set: night, light: 'blackout', sfx: [['ding', 'noticed', 0.6]], cam: frame(-3, 1.4, { size: 'close', side: -20 }),
    act(lt, c) { townK = 0.08; lampK = [0, 0, 0, 0]; lampK[1] = remap(lt, c.w('noticed'), c.w('noticed') + 0.25); N.jay.reset().place(-3, 1.4, -0.3).setFace(lt < c.w('noticed') ? 'worried' : 'wow').idle(c.t); N.jay.head.rotation.x = -0.4 * remap(lt, c.w('noticed'), c.w('noticed') + 0.2); } });
  shot({ line: 'Wherever I walked, the lamps turned back on.', set: night, light: 'blackout', sfx: [['pop', 'walked', 0.5], ['pop', 'lamps', 0.5], ['pop', 'turned', 0.5], ['sparkle', 'on', 0.7]], cam: { pos: [-15, 5.4, 19], look: [-15, 5.2, 2], fov: 60, blur: 0.15, push: 0, to: { pos: [10, 5.4, 19], look: [10, 5.2, 2] }, ease: 'lin' },
    act(lt, c) { townK = 0.08; const x = -18 + lt * 10; N.jay.reset().place(x, 1.4, Math.PI / 2).walk(c.t).setFace('grin'); lampK = LX.map(lx => clamp((x - lx + 2.5) / 0.8)); N.sp.at((lt * 1.6) % 1, [x, 0, 1.4], 0.5); } });
  shot({ line: 'I ran to the power plant', set: plant, sfx: [['whoosh', 'ran']], cam: { pos: [16, 4.4, 18], look: [6, 3.6, 2], fov: 60, blur: 0.15, push: 0.02 },
    act(lt, c) { W.jay.reset().place(18 - lt * 8, 3, -Math.PI * 0.6).run(c.t).setFace('serious'); W.puff.at((lt * 3) % 0.6, [19.5 - lt * 8, 0, 3]); } });
  shot({ line: 'and put my hands on the generator.', set: plant, sfx: [['thud', 'hands', 0.8], ['rise', 'generator']], cam: { pos: [2.6, 4.8, 5.2], look: [8.8, 3.4, 0.2], fov: 60, blur: 0.3, push: 0.04 },
    act(lt, c) { const th = c.w('hands'); W.jay.reset().place(8.6, 2.4, Math.PI).setFace('serious').pose({ aL: [lerp(20, 95, remap(lt, th - 0.3, th)), 10], aR: [lerp(20, 95, remap(lt, th - 0.3, th)), 10] }); W.jay.root.rotation.y = Math.PI;
      genOn = remap(lt, c.w('generator'), c.w('generator') + 0.5) * 0.8; W.sp.at(lt - c.w('generator'), [9, 1, 1.4], 0.8); } });
  shot({ line: 'The whole town lit up brighter than ever.', set: night, light: 'bright', sfx: [['sparkle', 'lit'], ['ding', 'brighter', 0.6]], flash: lt => Math.max(0, 0.7 - lt * 1.4), cam: { pos: [0, 9, 34], look: [0, 6, 0], fov: 60, blur: 0.05, push: 0.05 },
    act(lt, c) { townK = 2.2; lampK = [2, 2, 2, 2]; N.sp.at(lt - c.w('lit'), [-6, 4, -1], 2); N.sp2.at(lt - c.w('brighter'), [8, 4, -1], 2); } });
  shot({ line: 'Everyone cheered my name.', set: night, light: 'bright', sfx: [['pop', 'cheered'], ['pop', 'name', 0.6]], cam: { pos: [0, 4.4, 17], look: [0, 3.6, 2], fov: 60, blur: 0.15, push: 0.03 },
    act(lt, c) { townK = 2; lampK = [1.6, 1.6, 1.6, 1.6]; crowdNight(N, lt, c, lt < c.w('cheered') ? 'smile' : 'grin', { cheer: lt > c.w('cheered') }); N.jay.reset().place(0, 1, 0).setFace('happy').idle(c.t); } });

  // ───────── BUTTON: the sneeze
  shot({ line: 'The mayor gave me a medal and said,', set: night, light: 'bright', sfx: [['ding', 'medal']], cam: frame(0, 1.6, { size: 'full', side: 10, dist: 0.95 }),
    act(lt, c) { townK = 2; lampK = [1.6, 1.6, 1.6, 1.6]; const tm = c.w('medal'); N.mayor.reset().place(-1.5, 1.6, 0.6).pose('reach', lt < tm ? remap(lt, 0, tm) * 0.6 : 0.6 - remap(lt, tm, tm + 0.3) * 0.6).setFace('smile').idle(c.t);
      N.jay.reset().place(1.5, 1.6, -0.6).setFace(lt < tm ? 'smile' : 'grin').idle(c.t); N.jay.medal.visible = lt > tm; N.sp.at(lt - tm, [1.5, 1, 1.6], 0.5); } });
  shot({ line: 'Your power is light.', set: night, light: 'bright', cam: frame(-1.5, 1.6, { size: 'close', side: -12 }),
    act(lt, c) { townK = 2; lampK = [1.6, 1.6, 1.6, 1.6]; N.mayor.reset().place(-1.5, 1.6, 0.4).pose('open', 0.6).setFace('say').talk(c.t).idle(c.t); } });
  shot({ line: 'I smiled.', set: night, light: 'bright', sfx: [['pop', 'smiled', 0.6]], cam: frame(1.5, 1.6, { size: 'close', side: 12 }),
    act(lt, c) { townK = 2; lampK = [1.6, 1.6, 1.6, 1.6]; N.jay.reset().place(1.5, 1.6, -0.3).setFace(lt < c.w('smiled') ? 'smile' : 'grin').idle(c.t); N.jay.medal.visible = true; } });
  let tSneeze = 9;
  shot({ line: 'Then I sneezed.', set: night, light: 'bright', sfx: [['whoosh', 'sneezed', 0.8], ['pop', 'sneezed']], cam: frame(1.5, 1.6, { size: 'face', side: -8, push: 0.06 }),
    act(lt, c) { townK = 2; lampK = [1.6, 1.6, 1.6, 1.6]; const ts = c.w('sneezed'); N.jay.reset().place(1.5, 1.6, -0.2).setFace(lt < ts - 0.25 ? 'grin' : lt < ts ? 'sleepy' : 'scream'); N.jay.medal.visible = true;
      if (lt > ts - 0.25 && lt < ts) N.jay.head.rotation.x = -0.35; else if (lt > ts) N.jay.head.rotation.x = 0.35 * (1 - remap(lt, ts, ts + 0.3)); } });
  shot({ line: 'And every light in town exploded.', set: night, sfx: [['thud', 'exploded', 1.4], ['sparkle', 'exploded'], ['pop', 'exploded', 0.8]], flash: lt => (lt > tSneeze ? Math.max(0, 0.9 - (lt - tSneeze) * 3) : 0), cam: { pos: [0, 7, 30], look: [0, 6, 0], fov: 60, blur: 0.05, push: 0.04 },
    act(lt, c) { const te = c.w('exploded'); tSneeze = te; if (lt < te) { townK = 2; lampK = [1.6, 1.6, 1.6, 1.6]; c.shot.light = 'bright'; } else { townK = 0.05; lampK = [0, 0, 0, 0]; c.shot.light = 'blackout'; }
      N.sp.at(lt - te, [-14, 6, 3.2], 1.2); N.sp2.at(lt - te - 0.08, [13, 6, 3.2], 1.2); crowdNight(N, lt, c, lt < te ? 'grin' : 'shock'); N.jay.reset().place(0, 1, 0).setFace(lt < te ? 'grin' : 'worried').idle(c.t); N.jay.medal.visible = true; } });
});
