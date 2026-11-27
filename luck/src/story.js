// story.js: "In this town, everyone has a luck percentage floating above their head."
// Sets, cast, then one shot() per picture. The spoken script is the shots' `line` strings joined in order.
// '//' after a word = 0.6 s silent hold, '///' = 1.0 s.
import * as THREE from 'three';
import { start, shot, frame, LIGHTS } from './core.js';
import { makeAvatar, FACES } from './avatar.js';
import { room, TEX, door, windowPane, chair } from './sets.js';
import { makeSparkles } from './fx.js';
import { TOWN, makeNarrator, handheld, follow, drone } from './town.js';
import { remap, E, lerp, box, at, grp, sign, glow, mat, clamp, PRE } from './util.js';

// ───────────── looks for this story
LIGHTS.office = { amb: 0.75, hemi: 0.55, sun: 1.0, dir: [8, 16, 10], sunColor: '#ffe0b0', bg: '#151a2c', exposure: 1.02 };
LIGHTS.officeDark = { amb: 0.42, hemi: 0.3, sun: 0.6, dir: [8, 16, 10], sunColor: '#ff9a9a', bg: '#08080c', exposure: 1.0 };
LIGHTS.flashback = { amb: 0.95, hemi: 0.7, sun: 1.5, dir: [12, 9, 10], sunColor: '#ffcf8a', bg: '#3a2a1a', exposure: 1.0 };
LIGHTS.void = { amb: 0.32, hemi: 0.26, sun: 0.55, dir: [-4, 14, -10], sunColor: '#ff8080', bg: '#000000', exposure: 1.0 };
FACES.stare = ['round', 'none', 'line'];

// ───────────── the luck percentage that floats above every head
const tagColor = v => v >= 100 ? '#ffcf3a' : v >= 60 ? '#5dff8a' : v >= 30 ? '#ffe45c' : v >= 10 ? '#ff9a3c' : '#ff4040';
const fmt = v => Math.round(v).toLocaleString('en-US') + '%';
function luckTag(parent) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 220; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  s.visible = false; parent.add(s); PRE.push(() => { s.visible = false; });
  let last = ''; const v3 = new THREE.Vector3();
  return {
    // set(avatar | [x,y,z], value, { text, color, size, glow, dy, shake })
    set(who, val, o = {}) {
      const txt = o.text ?? fmt(val), col = o.color || tagColor(val), key = txt + col;
      if (key !== last) { last = key; g.clearRect(0, 0, 640, 220); g.font = '900 150px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        g.strokeStyle = '#14101a'; g.lineWidth = 26; g.strokeText(txt, 320, 118); g.fillStyle = col; g.fillText(txt, 320, 118); tex.needsUpdate = true; }
      let sc = 1;
      if (Array.isArray(who)) v3.set(who[0], who[1], who[2]);
      else { who.root.updateMatrixWorld(true); who.head.getWorldPosition(v3); sc = who.root.scale.x; v3.y += (2.15 + (o.dy || 0)) * sc; }
      if (o.shake) v3.x += Math.sin(o.shake * 61) * 0.06;
      const k = (o.size || 1) * sc; s.scale.set(3.2 * k, 1.1 * k, 1); s.position.copy(v3);
      s.material.color.setScalar(o.glow || (val >= 100 ? 1.9 : 1.25)); s.material.opacity = o.opacity ?? 1; s.visible = true; return s;
    } };
}
// golden luck orbs streaming from one point to another (the transfer)
function makeOrbs(parent, n = 9) {
  const g = grp(), os = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), glow('#ffd24a', 2.4)); g.add(m); os.push(m); }
  g.visible = false; parent.add(g); PRE.push(() => { g.visible = false; });
  return { at(lt, a, b, o = {}) { g.visible = true; const sp = o.speed || 0.9, h = o.h ?? 3; os.forEach((m, i) => { const k = ((lt * sp + i / n) % 1 + 1) % 1; m.position.set(lerp(a[0], b[0], k), lerp(a[1], b[1], k) + Math.sin(k * Math.PI) * h, lerp(a[2], b[2], k)); m.scale.setScalar((o.size || 1) * (0.6 + 0.6 * Math.sin(k * Math.PI))); }); } };
}
// phone with a glowing screen (screens: off / transfer / unlucky)
function makePhone(scale = 1) {
  const body = box(2.2, 4.2, 0.26, '#15161a', 0.22), g = grp(body), scr = {};
  const mk = (k, lines, bg, fg) => { const s = sign(lines, 1.9, 3.8, { bg, fg, glowing: true, weight: 900 }); s.material.color.setScalar(1.12); s.position.z = 0.15; s.visible = false; g.add(s); scr[k] = s; };
  mk('off', ['', '11:58', 'PM', ''], '#101626', '#cfd8ff');
  mk('transfer', ['TOWN ALERT', '', 'LUCK', 'TRANSFER', 'COMPLETE', ''], '#0c1f14', '#5dff8a');
  mk('unlucky', ['TOWN ALERT', '', 'THE', 'UNLUCKY ONE', 'HAS', 'ARRIVED'], '#220606', '#ff3a3a');
  g.scale.setScalar(scale); g.visible = false; PRE.push(() => { g.visible = false; for (const k in scr) scr[k].visible = false; });
  return { group: g, show(k) { g.visible = true; scr[k].visible = true; return g; } };
}
function topHat() {
  const m = mat('#141418'), g = grp();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.08, 28), m); brim.position.y = 1.18;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 1.1, 28), m); crown.position.y = 1.76;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.675, 0.675, 0.24, 28), mat('#e2b23a')); band.position.y = 1.36;
  for (const x of [brim, crown, band]) { x.castShadow = true; g.add(x); } return g;
}

start(() => {
  // ── sets
  const streetN = TOWN.street({ time: 'night', lit: 0.5 });
  const streetD = TOWN.street({ time: 'day' });
  const streetS = TOWN.street({ time: 'sunset' });
  const bedroom = TOWN.roomNight({ wall: '#3e4f8f', bed: '#c33a3a', shelf: true });

  // the blacked-out street: sky dome can vanish, a giant number over the clouds, a gold shield, the thing at the end of the road
  const streetX = TOWN.street({ time: 'night', lit: 0.25 });
  const skyX = streetX.group.children[0], lampsX = []; streetX.group.traverse(o => { if (o.isPointLight) lampsX.push(o); });
  const giant = sign('0% LUCK', 150, 44, { bg: '#000000', fg: '#ff2a2a', glowing: true, weight: 900 }); giant.material.color.setScalar(1.7); giant.material.transparent = true; giant.material.toneMapped = false;
  giant.position.set(0, 160, -240); giant.lookAt(0, 3, 22); streetX.group.add(giant);
  const clouds = grp(); { const cm = mat('#2c2232', { emissive: new THREE.Color('#1c0b12') }); for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), cm); s.scale.set(26 + (i % 4) * 7, 6 + (i % 3) * 2, 14); s.position.set(-150 + i * 23, 100 + (i % 3) * 6, -160 - (i % 4) * 14); clouds.add(s); } }
  streetX.group.add(clouds);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(46, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd24a').multiplyScalar(1.4), transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  const domeLines = new THREE.Mesh(dome.geometry, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe58a').multiplyScalar(1.6), wireframe: true, transparent: true, opacity: 0.22, toneMapped: false }));
  const domeG = grp(dome, domeLines); domeG.position.set(0, 0, 4); streetX.group.add(domeG);
  const redGlow = new THREE.PointLight('#ff2020', 0, 40, 1.6); redGlow.position.set(-46, 6, 13); streetX.group.add(redGlow);
  const horizon = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 12), glow('#ff2020', 1.6)); horizon.scale.set(1.6, 0.5, 1); horizon.position.set(-150, 2, 13); streetX.group.add(horizon);
  streetX.reset = () => { skyX.visible = false; giant.visible = false; giant.material.opacity = 1; clouds.visible = true; domeG.visible = false; redGlow.intensity = 0; horizon.visible = false; lampsX.forEach(l => { l.intensity = 0; }); };
  const nightLamps = () => { skyX.visible = true; lampsX.forEach(l => { l.intensity = 220; }); };

  // the mayor's office: desk on the left (mayor faces +x), visitor on the right, window on the right wall, door at the back
  const office = { group: room({ floorTex: TEX.wood('#6b3f24'), tile: 6, wallColor: '#7a2f3a', trim: '#e2b23a', trimY: 3.2, ceiling: '#2a1a1e', w: 34, d: 24, h: 13, lights: 1 }), light: 'office' };
  const OG = office.group;
  OG.add(at(box(3.6, 2.7, 8.6, '#5a3420', 0.08), -6, 1.35, 2), at(box(4.0, 0.3, 9.0, '#3e2214', 0.06), -6, 2.85, 2));
  OG.add(at(sign('MAYOR', 3.2, 1.0, { bg: '#e2b23a', fg: '#3a1e0e' }), -3.98, 1.9, 2, Math.PI / 2));
  OG.add(at(box(0.9, 0.6, 1.2, '#e2b23a', 0.1), -6.2, 3.3, 4.8), at(box(1.6, 0.12, 1.1, '#f4efe6'), -6, 3.06, 0.2));
  OG.add(at(chair('#8a1f2a', 1.6), -10.4, 0, 2, Math.PI / 2));
  const portraits = [['2014', '120%'], ['2019', '480%'], ['2024', '1,000%']];
  portraits.forEach((p, i) => OG.add(at(box(3.6, 4.4, 0.2, '#c9962a', 0.05), -12 + i * 4.6, 8.6, -5.85), at(sign(['MAYOR', p[0], p[1]], 3.1, 3.9, { bg: '#f2e6c8', fg: '#7a1f12' }), -12 + i * 4.6, 8.6, -5.72)));
  const flag = (x) => grp(at(box(0.18, 9, 0.18, '#d8c070'), x, 4.5, -4.6), at(box(2.6, 1.7, 0.08, '#3553b8'), x + 1.4, 8, -4.6), at(box(2.6, 0.5, 0.1, '#e2b23a'), x + 1.4, 8, -4.6));
  OG.add(flag(-15.5), flag(3.4), at(door('MAYOR', '#4a2a18'), 10, 0, -5.9));
  const winN = windowPane(6, 5, '#1f2a55'), winX = windowPane(6, 5, '#050507');
  OG.add(at(winN, 16.85, 7, 2, -Math.PI / 2), at(winX, 16.85, 7, 2, -Math.PI / 2));
  OG.add(at(box(0.6, 0.06, 3.2, '#e2b23a'), 16.6, 4.2, 2, -Math.PI / 2));
  office.reset = () => { winN.visible = true; winX.visible = false; };
  const blackWindow = () => { winN.visible = false; winX.visible = true; };
  const officePhone = makePhone(1); OG.add(at(officePhone.group, 5, 4.7, 10));

  // ── cast: identical options in every set
  const OPT = {
    friend: { seed: 2, skin: 'tan', hair: 'curly', hairColor: '#2a1a12', top: 'hoodie', topColor: '#e94b3c', bottom: 'jeans', bottomColor: '#3a4f7a' },
    mayor: { seed: 7, skin: 'fair', hair: 'short', hairColor: '#a7a7ae', top: 'cardigan', topColor: '#232a4a', inner: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#1c2038', shoe: '#111', sole: '#111', glasses: true },
    ava: { seed: 4, skin: 'light', hair: 'spiky', hairColor: '#e8a03a', top: 'tee', topColor: '#7fc98a', bottom: 'shorts', bottomColor: '#3a6a3a' },
    zoe: { seed: 5, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#f2d33c', bottom: 'jeans', bottomColor: '#3f74c8' },
    gran: { seed: 3, skin: 'fair', hair: 'bob', hairColor: '#d8d8dc', top: 'cardigan', topColor: '#b58ad6', bottom: 'plain', bottomColor: '#8a6aa8', glasses: true },
    ned: { seed: 6, skin: 'deep', hair: 'buzz', hairColor: '#17110f', top: 'vest', topColor: '#e8632b', sleeves: 'long', bottom: 'cargo', bottomColor: '#5b5f44', shoe: '#6b4a2a' },
    shade: { seed: 9, skin: '#0b0b0e', hair: 'bald', top: 'plain', topColor: '#08080a', bottom: 'plain', bottomColor: '#08080a', shoe: '#050505', sole: '#050505', face: 'blank' },
  };
  const cast = set => {
    const X = { tag: {}, ph: {} };
    X.me = makeNarrator({ color: '#3553b8', print: 'lucky' });
    for (const [k, o] of Object.entries(OPT)) X[k] = makeAvatar(o);
    X.mayor.head.add(topHat()); X.mayor.hip.add(at((() => { const s = box(0.34, 2.7, 1.06, '#e2b23a'); s.rotation.z = 0.72; return s; })(), 0, 1, 0));
    for (const s of [-1, 1]) X.shade.head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glow('#ff2020', 3)), s * 0.22, 0.64, 0.6));
    for (const k of ['me', ...Object.keys(OPT)]) {
      set.group.add(X[k].root); X.tag[k] = luckTag(set.group);
      const p = makePhone(0.3); p.group.rotation.set(Math.PI / 2 - 0.2, 0, 0); p.group.position.set(0, -0.55, 0.1); X[k].handR.add(p.group); X.ph[k] = p;
    }
    X.sp = makeSparkles(set.group); X.orbs = makeOrbs(set.group); X.orbs2 = makeOrbs(set.group); X.orbs3 = makeOrbs(set.group);
    return X;
  };
  const N = cast(streetN), D = cast(streetD), S = cast(streetS), B = cast(bedroom), X = cast(streetX), O = cast(office);
  const L = { me: 64, friend: 87, ava: 72, zoe: 95, gran: 58, ned: 81, mayor: 1000 };
  const tag = (C, k, v, o = {}) => C.tag[k].set(C[k], v ?? L[k], k === 'mayor' ? { ...o, dy: (o.dy || 0) + 1.3 } : o);
  const count = (lt, t0, dur, a, b) => lerp(a, b, E.inOut(remap(lt, t0, t0 + dur)));
  // close-up of a head with room for its number: frame() lifted so the tag stays in the picture
  const up = (cam, dy = 0.9) => ({ ...cam, pos: [cam.pos[0], cam.pos[1] + dy, cam.pos[2]], look: [cam.look[0], cam.look[1] + dy, cam.look[2]] });
  const MAYOR = [-9, 2, Math.PI / 2], ME = [2.2, 2, -Math.PI / 2];   // office marks
  const mayorAt = (C, face, t, o = {}) => { C.mayor.reset().place(MAYOR[0], MAYOR[1], MAYOR[2] + (o.turn || 0)).setFace(face).idle(t); tag(C, 'mayor', o.val, o.tag); return C.mayor; };
  const meAt = (C, face, t, o = {}) => { C.me.reset().place(o.x ?? ME[0], o.z ?? ME[1], o.ry ?? ME[2]).setFace(face).idle(t); tag(C, 'me', o.val, o.tag); return C.me; };
  const townsfolk = (C, t, o = {}) => ['ava', 'zoe', 'gran', 'ned'].forEach((k, i) => { const x = (o.x0 ?? -14) + i * (o.gap ?? 7) + (o.walk ? t * 1.6 * (i % 2 ? 1 : -1) % 6 : 0); const a = C[k].reset().place(x, o.z ?? (3.4 + (i % 2) * 1.6), o.ry ?? (i % 2 ? 0.4 : -0.4)).setFace(o.face || 'calm'); if (o.walk) a.walk(t + i, 0.8); else a.idle(t + i); tag(C, k, o.vals ? o.vals[i] : L[k], { size: o.size || 1 }); });

  // ───────── ACT 1: the rule
  shot({ line: 'In this town,', set: streetN, sfx: [['whoosh', 0]], cam: drone([0, 3, 4], { h: 26, back: 40, drift: [8, -2, -6], fov: 52 }),
    act(lt, c) { townsfolk(N, c.t, { walk: true, x0: -16, gap: 8, size: 2.2, face: 'joy' }); N.me.reset().place(4 + lt * 1.5, 5, Math.PI / 2).walk(c.t).setFace('calm'); tag(N, 'me', 64, { size: 2.2 }); } });
  shot({ line: 'everyone has a luck percentage', set: streetN, cam: up(frame(-2, 4, { size: 'medium', side: -14 }), 0.7),
    act(lt, c) { N.ava.reset().place(-2, 4, -0.2).pose('open', 0.5).setFace('joy').talk(c.t); tag(N, 'ava'); N.ned.reset().place(4.5, 1.5, -0.5).setFace('calm').idle(c.t); tag(N, 'ned'); } });
  shot({ line: 'floating above their head.', set: streetN, sfx: [['pop', 'floating', 0.7]], cam: { pos: [6.6, 5.6, 9.6], look: [5, 6.6, 3.5], fov: 48, blur: 0.4, push: 0.1 },
    act(lt, c) { N.gran.reset().place(5, 3.5, 0.2).setFace('calm').idle(c.t); tag(N, 'gran', 58, { dy: Math.sin(c.t * 3) * 0.08 }); } });
  shot({ line: 'The higher your percentage,', set: streetN, cam: up(frame(0, 4, { size: 'close', side: 12 }), 0.9),
    act(lt, c) { N.zoe.reset().place(0, 4, 0.1).setFace('joy').idle(c.t); tag(N, 'zoe', count(lt, 0, 0.8, 80, 95)); } });
  shot({ line: 'the luckier you are.', set: streetN, sfx: [['sparkle', 'luckier', 0.6]], cam: up(frame(0, 4, { size: 'medium', side: -18, low: 0.3 }), 0.6),
    act(lt, c) { N.zoe.reset().place(0, 4, -0.2).pose('cheer').setFace('winkjoy').idle(c.t); tag(N, 'zoe', 95); N.sp.at(lt - c.w('luckier'), [0, 0, 4], 1); } });
  shot({ line: "But there's one person", set: streetN, cam: { pos: [-14, 5, 20], look: [2, 4.5, 2], fov: 54, blur: 0.15, push: 0.05 },
    act(lt, c) { townsfolk(N, c.t, { x0: -12, gap: 4.5, z: 6, ry: 0.9, face: 'uneasy' }); N.mayor.reset().place(8, 1.5, -0.7).setFace('smug').idle(c.t); tag(N, 'mayor', 1000); } });
  shot({ line: 'whose percentage makes absolutely no sense.', set: streetN, sfx: [['tick', 'absolutely'], ['tick', 'sense']], cam: { pos: [6.8, 7.0, 10.5], look: [8, 7.3, 1.5], fov: 46, blur: 0.5, push: 0.11 },
    act(lt, c) { N.mayor.reset().place(8, 1.5, -0.1).setFace('smug').idle(c.t); tag(N, 'mayor', 1000, { shake: c.t }); } });
  shot({ line: 'The mayor has 1,000% luck.', set: streetN, sfx: [['ding', 'luck', 0.8], ['sparkle', 'luck', 0.6]], cam: up(frame(8, 1.5, { size: 'full', side: 14, low: 0.45 }), 1.0),
    act(lt, c) { N.mayor.reset().place(8, 1.5, -0.25).pose(lt < c.w('luck') ? 'hips' : 'open', 0.9).setFace('smug').idle(c.t); tag(N, 'mayor', 1000, { size: 1.3 }); N.sp.at(lt - c.w('luck'), [8, 0, 1.5], 1.1); } });
  shot({ line: "Nobody knows how that's possible.", set: streetN, cam: up(frame(-3, 4, { size: 'close', side: -10 }), 0.8),
    act(lt, c) { N.me.reset().place(-3, 4, 0.15).pose('shrug', remap(lt, 0.1, 0.4)).setFace('uneasy').idle(c.t); tag(N, 'me', 64); } });

  // ───────── ACT 2: the friend, the pattern
  shot({ line: 'Last week,', set: streetD, sfx: [['whoosh', 0, 0.6]], cam: drone([0, 2, 4], { h: 32, back: 48, drift: [-8, -2, -6], fov: 52 }),
    act(lt, c) { townsfolk(D, c.t, { walk: true, x0: -10, gap: 7, size: 2.4 }); D.friend.reset().place(-2 + lt * 2, 4.6, Math.PI / 2).walk(c.t).setFace('joy'); tag(D, 'friend', 87, { size: 2.4 }); } });
  shot({ line: 'my best friend', set: streetD, cam: up(frame(-1, 4, { size: 'close', side: 12 }), 0.9),
    act(lt, c) { D.friend.reset().place(-1, 4, 0.1).pose('wave', 0.9).setFace('joy').idle(c.t); D.friend.armR.rotation.z += Math.sin(c.t * 14) * 0.25; tag(D, 'friend', 87); } });
  shot({ line: 'went from 87% luck', set: streetD, cam: { pos: [-0.6, 6.1, 7.6], look: [-1, 6.4, 4], fov: 44, blur: 0.5, push: 0.1 },
    act(lt, c) { D.friend.reset().place(-1, 4, 0).setFace('joy').idle(c.t); tag(D, 'friend', 87); } });
  shot({ line: 'to 2% overnight.', set: bedroom, sfx: [['fall', 'overnight', 0.8]], cam: up(frame(-9, 2, { size: 'medium', side: 18, y: 0.8 }), 0.4),
    act(lt, c) { const v = count(lt, c.w('overnight') - 0.3, 0.7, 87, 2); B.friend.reset().place(-9, 2, 0.3).sit(2.3).setFace(v > 40 ? 'sleepy' : 'worried').idle(c.t, 0.4); tag(B, 'friend', v); } });
  shot({ line: 'And by the afternoon,', set: streetS, cam: follow(lt => [3 + lt * 2.4, 0, 4.4], [-5, 3.6, 10], { lookY: 4.2 }),
    act(lt, c) { S.me.reset().place(3 + lt * 2.4, 4.4, Math.PI / 2 - 0.3).walk(c.t).setFace('calm'); tag(S, 'me', 64); } });
  shot({ line: 'he had disappeared.', set: bedroom, sfx: [['sad', 'disappeared', 0.7]], cam: { pos: [-3, 5, 12], look: [-8, 4, 0], fov: 56, blur: 0.15, push: 0.07 },
    act(lt, c) { B.tag.friend.set([-9, 6.6 + Math.sin(c.t * 2) * 0.1, 2], 2, { glow: 1.0, opacity: 0.85 }); } });
  shot({ line: 'I started checking', set: streetD, cam: up(frame(2, 4, { size: 'close', side: -12 }), 0.8),
    act(lt, c) { D.me.reset().place(2, 4, -0.1).pose('think').setFace('uneasy').idle(c.t); tag(D, 'me', 64); } });
  shot({ line: "everyone's percentages.", set: streetD, cam: handheld(follow(lt => [-12 + lt * 5, 0, 8], [0, 5.4, 6], { lookY: 5.6, fov: 56 }), 0.8),
    act(lt, c) { townsfolk(D, c.t, { x0: -14, gap: 5, z: 3, ry: 0.1, vals: [41, 33, 28, 39], face: 'uneasy' }); } });
  shot({ line: 'People were losing luck', set: streetD, sfx: [['fall', 'losing', 0.6]], cam: up(frame(-4, 3.5, { size: 'medium', side: 16 }), 0.7),
    act(lt, c) { D.ava.reset().place(-4, 3.5, 0.2).pose('slump', 0.7).setFace('sad').idle(c.t); tag(D, 'ava', count(lt, c.w('losing'), 0.8, 41, 23)); D.ned.reset().place(2, 1, -0.3).setFace('sad').idle(c.t); tag(D, 'ned', count(lt, c.w('losing') + 0.2, 0.8, 39, 18)); } });
  shot({ line: 'every single day.', set: streetS, cam: up(frame(3, 4, { size: 'medium', side: -14 }), 0.7),
    act(lt, c) { S.gran.reset().place(3, 4, -0.2).pose('shy').setFace('worried').idle(c.t); tag(S, 'gran', Math.round(count(lt, 0, c.d, 28, 9))); } });
  shot({ line: 'Then I noticed something terrifying.', set: streetN, sfx: [['thud', 'terrifying', 0.9]], cam: up(frame(0, 4, { size: 'close', side: 10, push: 0.12 }), 0.8),
    act(lt, c) { N.me.reset().place(0, 4, 0).setFace(lt < c.w('terrifying') ? 'uneasy' : 'gasp').idle(c.t); tag(N, 'me', 64); } });
  shot({ line: "Every time someone's luck dropped,", set: streetN, sfx: [['fall', 'dropped', 0.7]], cam: up(frame(-2, 4, { size: 'medium', side: -12 }), 1.4),
    act(lt, c) { N.zoe.reset().place(-2, 4, 0.2).setFace(lt < c.w('dropped') ? 'calm' : 'sad').idle(c.t); tag(N, 'zoe', count(lt, c.w('dropped'), 0.7, 60, 44)); if (lt > c.w('dropped')) N.orbs.at(lt, [-2, 6.8, 4], [12, 14, -6], { h: 2 }); } });
  shot({ line: "the mayor's went up.", set: office, sfx: [['rise', 'up', 0.8]], cam: up(frame(MAYOR[0], MAYOR[1], { size: 'medium', facing: MAYOR[2], side: 16 }), 1.0),
    act(lt, c) { mayorAt(O, lt < c.w('up') ? 'calm' : 'smug', c.t, { val: count(lt, c.w('up'), 0.7, 1000, 1016) }); O.orbs.at(lt, [16, 8, 2], [-9, 6.8, 2], { h: 1.5 }); } });

  // ───────── ACT 3: the office
  shot({ line: "I knew something wasn't right,", set: streetN, cam: handheld(follow(lt => [-4 + lt * 3.2, 0, 4.2], [4, 3.4, 9], { lookY: 4.4 }), 0.8),
    act(lt, c) { N.me.reset().place(-4 + lt * 3.2, 4.2, Math.PI / 2).walk(c.t, 1.2).setFace('mad'); tag(N, 'me', 64); } });
  shot({ line: 'so I went straight to his office.', set: office, sfx: [['thud', 'office', 0.8]], cam: { pos: [-4, 9, 17], look: [3, 4, -2], fov: 56, blur: 0.1, push: 0.05 },
    act(lt, c) { const k = remap(lt, 0, c.d * 0.85); O.me.reset().place(lerp(10, ME[0], k), lerp(-4, ME[1], k), lerp(0, ME[2], k)).walk(c.t, 1.1).setFace('mad'); tag(O, 'me', 64); mayorAt(O, 'gasp', c.t); } });
  shot({ line: 'I demanded to know', set: office, cam: up(frame(ME[0], ME[1], { size: 'close', facing: ME[2], side: -10 }), 0.8),
    act(lt, c) { meAt(O, 'angry', c.t).pose('point', 0.9).talk(c.t); } });
  shot({ line: 'what was happening.', set: office, cam: up(frame(MAYOR[0], MAYOR[1], { size: 'medium', facing: MAYOR[2], side: -14 }), 0.8),
    act(lt, c) { mayorAt(O, 'sus', c.t); } });
  shot({ line: 'He finally admitted the truth.', set: office, cam: up(frame(MAYOR[0], MAYOR[1], { size: 'close', facing: MAYOR[2], side: 10 }), 0.8),
    act(lt, c) { mayorAt(O, lt < c.w('admitted') ? 'sus' : 'serious', c.t).pose('slump', 0.4); } });
  shot({ line: 'Years ago,', set: office, light: 'flashback', sfx: [['whoosh', 0, 0.6]], cam: { pos: [6, 6.5, 14], look: [-6, 4.5, 1], fov: 52, blur: 0.15, push: 0.06 },
    act(lt, c) { mayorAt(O, 'calm', c.t, { val: 50 }); } });
  shot({ line: "he discovered a way to steal people's luck.", set: office, light: 'flashback', sfx: [['sparkle', 'discovered', 0.6], ['pop', 'steal', 0.6]], cam: up(frame(MAYOR[0], MAYOR[1], { size: 'medium', facing: MAYOR[2], side: -18 }), 0.8),
    act(lt, c) { mayorAt(O, lt < c.w('steal') ? 'wow' : 'smirk', c.t, { val: 50 }).pose('carry', 0.8); O.sp.at(lt - c.w('discovered'), [-7.4, 2, 2], 0.7);
      O.orbs.at(lt * 0.4, [-6.9, 5.2, 1.6], [-6.9, 5.2, 2.4], { h: 0.4, size: 0.45 }); } });
  shot({ line: "Every time someone's percentage dropped,", set: streetN, sfx: [['fall', 'dropped', 0.6]], cam: up(frame(3, 4, { size: 'close', side: 14 }), 1.1),
    act(lt, c) { N.ned.reset().place(3, 4, -0.1).setFace(lt < c.w('dropped') ? 'calm' : 'worried').idle(c.t); tag(N, 'ned', count(lt, c.w('dropped'), 0.6, 52, 37)); if (lt > c.w('dropped')) N.orbs.at(lt, [3, 6.8, 4], [-12, 15, -8], { h: 2 }); } });
  shot({ line: 'their luck was transferred to him.', set: streetN, sfx: [['rise', 'transferred', 0.7]], cam: drone([0, 3, 2], { h: 28, back: 40, drift: [6, -2, -4], fov: 54 }),
    act(lt, c) { townsfolk(N, c.t, { x0: -16, gap: 9, vals: [33, 29, 18, 37], size: 2.2, face: 'sad' }); const hall = [26, 12, -10];
      N.orbs.at(lt, [-16, 7, 3.4], hall, { h: 8 }); N.orbs2.at(lt + 0.3, [-7, 7, 5], hall, { h: 6 }); N.orbs3.at(lt + 0.6, [11, 7, 5], hall, { h: 4 }); N.mayor.reset().place(26, -2, -0.6).pose('cheer', 0.6).setFace('smug').idle(c.t); tag(N, 'mayor', 1000, { size: 2.2 }); } });
  shot({ line: 'He had been doing it for years.', set: office, cam: { pos: [-7.4, 8.4, 2.6], look: [-7.4, 8.6, -5.8], fov: 52, blur: 0.25, push: 0.1, to: { pos: [-5, 8.4, 2.6], look: [-5, 8.6, -5.8] }, ease: 'lin' } });
  shot({ line: "But he needed everyone's luck", set: office, cam: up(frame(MAYOR[0], MAYOR[1], { size: 'close', facing: MAYOR[2], side: -12 }), 0.8),
    act(lt, c) { mayorAt(O, 'smug', c.t).pose('think', 0.7); } });
  shot({ line: 'to reach 0%', set: office, sfx: [['tick', 'reach'], ['tick', '0%']], cam: up(frame(ME[0], ME[1], { size: 'close', facing: ME[2], side: 12 }), 0.8),
    act(lt, c) { meAt(O, lt < c.w('0%') ? 'uneasy' : 'gasp', c.t); } });
  shot({ line: 'to complete his plan.', set: office, cam: up(frame(MAYOR[0], MAYOR[1], { size: 'face', facing: MAYOR[2], side: 8, push: 0.12 }), 1.2),
    act(lt, c) { mayorAt(O, 'smirk', c.t, { tag: { size: 0.8 } }); } });

  shot({ line: 'I looked outside.', set: office, cam: { pos: [7.2, 6.4, 5.4], look: [15.5, 6.3, 1.6], fov: 54, blur: 0.2, push: 0.07 },
    act(lt, c) { O.me.reset().place(13.8, 2, Math.PI / 2 - 0.15).setFace('uneasy').idle(c.t); tag(O, 'me', 64); } });
  shot({ line: "Everyone's percentage was now 0%. //", set: streetX, sfx: [['thud', '0%', 1.0]], cam: { pos: [3, 7, 30], look: [-1, 4.5, 4], fov: 54, blur: 0.1, push: 0.06 },
    act(lt, c) { nightLamps(); const z = lt >= c.w('0%'); townsfolk(X, c.t, { x0: -7, gap: 4.2, size: 1.4, vals: z ? [0, 0, 0, 0] : [6, 4, 3, 5], face: z ? 'stare' : 'sad' }); X.friend.root.visible = false; } });
  shot({ line: 'Suddenly, my phone buzzed.', set: office, sfx: [['tick', 'phone'], ['tick', 'buzzed'], ['tick', 0.95], ['tick', 1.1]], cam: up(frame(13.8, 2, { size: 'close', facing: -Math.PI / 2 + 0.4, side: 6 }), 0.4),
    act(lt, c) { const me = O.me.reset().place(13.8, 2, -Math.PI / 2 + 0.4).pose('carry', lt < c.w('phone') ? 0.2 : 0.75).setFace(lt < c.w('buzzed') ? 'uneasy' : 'gasp').idle(c.t); tag(O, 'me', 0);
      const g = O.ph.me.show('off'); if (lt > c.w('buzzed')) g.position.x = Math.sin(c.t * 90) * 0.06; else g.position.x = 0; } });
  shot({ line: 'A notification appeared:', set: office, sfx: [['pop', 'appeared', 0.8]], cam: { pos: [5, 3.9, 16.5], look: [5, 4.1, 10], fov: 46, blur: 0.6, push: 0.08 },
    act(lt, c) { officePhone.show(lt < c.w('appeared') ? 'off' : 'transfer'); officePhone.group.position.x = 5 + (lt < c.w('appeared') ? Math.sin(c.t * 90) * 0.05 : 0); } });
  shot({ line: '"LUCK TRANSFER COMPLETE."', set: office, sfx: [['ding', 'complete', 0.8]], cam: { pos: [5, 4.1, 14.4], look: [5, 4.0, 10], fov: 44, blur: 0.7, push: 0.1 },
    act(lt, c) { officePhone.show('transfer'); officePhone.group.position.x = 5; } });
  shot({ line: 'I looked at the mayor.', set: office, cam: up(frame(ME[0], ME[1], { size: 'close', facing: ME[2], side: -12 }), 0.8),
    act(lt, c) { meAt(O, 'uneasy', c.t, { val: 0 }); } });
  shot({ line: 'He started laughing.', set: office, sfx: [['boing', 'laughing', 0.5]], cam: up(frame(MAYOR[0], MAYOR[1], { size: 'medium', facing: MAYOR[2], side: 14 }), 0.8),
    act(lt, c) { mayorAt(O, lt < c.w('laughing') ? 'smirk' : 'laugh', c.t).pose('hips', 0.8).talk(c.t, 2.2); } });
  shot({ line: 'I asked him what was so funny.', set: office, cam: up(frame(ME[0], ME[1], { size: 'medium', facing: ME[2], side: 14 }), 0.8),
    act(lt, c) { meAt(O, 'mad', c.t, { val: 0 }).pose('open', 0.6).talk(c.t); } });
  shot({ line: 'He said,', set: office, cam: up(frame(MAYOR[0], MAYOR[1], { size: 'close', facing: MAYOR[2], side: -8 }), 0.8),
    act(lt, c) { mayorAt(O, 'smirk', c.t); } });
  shot({ line: '"You actually thought I was stealing luck', set: office, cam: up(frame(MAYOR[0], MAYOR[1], { size: 'medium', facing: MAYOR[2], side: 18, low: 0.3 }), 0.8),
    act(lt, c) { mayorAt(O, 'say', c.t).pose('open', 0.8).talk(c.t); } });
  shot({ line: 'for myself?"', set: office, cam: up(frame(MAYOR[0], MAYOR[1], { size: 'face', facing: MAYOR[2], side: -6, push: 0.12 }), 1.2),
    act(lt, c) { mayorAt(O, 'serious', c.t, { tag: { size: 0.8 } }); } });

  // ───────── ACT 4: the sky
  shot({ line: 'Suddenly, the sky turned completely black.', set: streetX, sfx: [['thud', 'black', 1.2]], cam: { pos: [2, 3.2, 24], look: [0, 22, -40], fov: 60, blur: 0, push: 0.04 },
    act(lt, c) { const blk = lt >= c.w('black'); if (!blk) nightLamps(); c.shot.light = blk ? 'void' : 'townNight'; townsfolk(X, c.t, { x0: -10, gap: 6, vals: [0, 0, 0, 0], face: blk ? 'gasp' : 'stare' }); } });
  shot({ line: 'A giant percentage appeared', set: streetX, light: 'void', sfx: [['rise', 'appeared', 0.7]], cam: { pos: [0, 3, 22], look: [0, 85, -150], fov: 62, blur: 0, push: 0.03 },
    act(lt, c) { giant.visible = lt >= c.w('appeared') - 0.1; giant.material.opacity = remap(lt, c.w('appeared') - 0.1, c.w('appeared') + 0.4); } });
  shot({ line: 'above the clouds.', set: streetX, light: 'void', cam: { pos: [-8, 4, 24], look: [0, 110, -200], fov: 64, blur: 0, push: 0.03 },
    act(lt, c) { giant.visible = true; townsfolk(X, c.t, { x0: -14, gap: 6, vals: [0, 0, 0, 0], face: 'gasp' }); X.ava.head.rotation.x -= 0.5; X.zoe.head.rotation.x -= 0.5; } });
  shot({ line: '0% LUCK. //', set: streetX, light: 'void', sfx: [['thud', 'luck', 1.2]], cam: { pos: [0, 150, 40], look: [0, 160, -240], fov: 52, blur: 0, push: 0.08 },
    act(lt, c) { giant.visible = true; } });
  shot({ line: 'The mayor smiled and said:', set: office, light: 'officeDark', cam: up(frame(MAYOR[0], MAYOR[1], { size: 'close', facing: MAYOR[2], side: 10 }), 0.8),
    act(lt, c) { blackWindow(); mayorAt(O, lt < c.w('smiled') ? 'serious' : 'smile', c.t); } });
  shot({ line: '"I wasn\'t stealing your luck', set: office, light: 'officeDark', cam: up(frame(MAYOR[0], MAYOR[1], { size: 'medium', facing: MAYOR[2], side: -14 }), 0.8),
    act(lt, c) { blackWindow(); mayorAt(O, 'say', c.t).pose('open', 0.5).talk(c.t); } });
  shot({ line: 'to save myself..."', set: office, light: 'officeDark', cam: up(frame(ME[0], ME[1], { size: 'close', facing: ME[2], side: 10 }), 0.8),
    act(lt, c) { blackWindow(); meAt(O, 'uneasy', c.t, { val: 0 }); } });
  shot({ line: '"I was collecting enough luck', set: office, light: 'officeDark', sfx: [['sparkle', 'collecting', 0.5]], cam: up(frame(MAYOR[0], MAYOR[1], { size: 'medium', facing: MAYOR[2], side: 16, low: 0.35 }), 0.9),
    act(lt, c) { blackWindow(); mayorAt(O, 'serious', c.t, { tag: { size: 1.2 } }).pose('reach', 0.7).talk(c.t); O.orbs.at(lt, [-4, 9, 8], [-9, 8, 2], { h: 1, size: 0.55 }); } });
  shot({ line: 'to protect us', set: streetX, light: 'void', sfx: [['rise', 'protect', 0.7]], cam: drone([0, 2, 4], { h: 48, back: 112, drift: [6, -2, -6], fov: 50 }),
    act(lt, c) { domeG.visible = true; dome.material.opacity = 0.1 * remap(lt, 0, 0.4); domeLines.material.opacity = 0.22 * remap(lt, 0, 0.4); townsfolk(X, c.t, { x0: -12, gap: 7, vals: [0, 0, 0, 0], size: 2.2, face: 'gasp' }); } });
  shot({ line: "from what's coming.\"", set: streetX, light: 'void', sfx: [['thud', 'coming', 0.6]], cam: { pos: [-6, 3.4, 13], look: [-60, 3, 13], fov: 50, blur: 0, push: 0.05 },
    act(lt, c) { horizon.visible = true; } });
  shot({ line: 'Then every phone in town', set: streetX, light: 'void', sfx: [['tick', 'phone'], ['tick', 'town']], cam: { pos: [-1, 5.8, 22], look: [-1, 4.2, 3], fov: 56, blur: 0.15, push: 0.07 },
    act(lt, c) { ['ava', 'zoe', 'gran', 'ned'].forEach((k, i) => { X[k].reset().place(-10 + i * 6, 3.6 + (i % 2) * 1.4, (i % 2 ? 0.25 : -0.25)).pose('carry', 0.7).setFace('stare').idle(c.t + i); tag(X, k, 0); X.ph[k].show(lt < c.w('phone') ? 'off' : 'unlucky'); }); } });
  shot({ line: 'received the same message:', set: streetX, light: 'void', cam: up(frame(0, 4, { size: 'close', side: 12 }), 0.3),
    act(lt, c) { X.gran.reset().place(0, 4, 0.1).pose('carry', 0.75).setFace(lt < c.w('message') ? 'stare' : 'gasp').idle(c.t); tag(X, 'gran', 0); X.ph.gran.show('unlucky'); } });
  shot({ line: '"THE UNLUCKY ONE', set: office, light: 'officeDark', sfx: [['thud', 'unlucky', 0.8]], cam: { pos: [5, 4.1, 14.4], look: [5, 4.0, 10], fov: 44, blur: 0.7, push: 0.1 },
    act(lt, c) { blackWindow(); officePhone.show('unlucky'); officePhone.group.position.x = 5; } });
  shot({ line: 'HAS ARRIVED." ///', set: streetX, light: 'void', sfx: [['thud', 'arrived', 1.2]], cam: { pos: [-14, 3.4, 13.6], look: [-46, 4.6, 13], fov: 48, blur: 0, push: 0.05 },
    act(lt, c) { redGlow.intensity = 260; X.shade.reset().place(-46, 13, Math.PI / 2).size(1.5).setFace('blank').idle(c.t, 0.2); tag(X, 'shade', 0, { text: '???', color: '#ff2a2a', glow: 1.8 }); } });
  shot({ line: 'And for the first time in history...', set: office, light: 'officeDark', cam: up(frame(MAYOR[0], MAYOR[1], { size: 'close', facing: MAYOR[2], side: -10 }), 1.0),
    act(lt, c) { blackWindow(); mayorAt(O, 'worried', c.t, { val: 1000 }); } });
  shot({ line: "The mayor's percentage", set: office, light: 'officeDark', sfx: [['fall', 'percentage', 0.9]], cam: { pos: [-2.2, 7.4, 2.8], look: [-9, 7.5, 2], fov: 46, blur: 0.5, push: 0.1 },
    act(lt, c) { blackWindow(); mayorAt(O, 'worried', c.t, { val: count(lt, c.w('percentage'), c.d - c.w('percentage') + 0.3, 1000, 310), tag: { shake: c.t } }); } });
  shot({ line: 'dropped to zero.', set: office, light: 'officeDark', sfx: [['thud', 'zero', 1.2]], cam: up(frame(MAYOR[0], MAYOR[1], { size: 'close', facing: MAYOR[2], side: 8, push: 0.1 }), 1.0),
    act(lt, c) { blackWindow(); const v = count(lt, 0, c.w('zero') + 0.15, 310, 0); mayorAt(O, v > 0.5 ? 'worried' : 'gasp', c.t, { val: v }); } });
});
