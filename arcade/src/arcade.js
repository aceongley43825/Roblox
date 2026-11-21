// arcade.js: the arcade layer for this story (cabinets with live screens, pinball, the arcade room,
// crown, top hat, grad cap, screwdriver). Built on the kit + town layer, no kit edits.
import * as THREE from 'three';
import { LIGHTS } from './core.js';
import { canvasTex, mat, glow, box, at, grp, sign, rng, shade, PRE } from './util.js';
import { TEX, room, floor } from './sets.js';

Object.assign(LIGHTS, {
  arcade: { amb: 0.6, hemi: 0.45, sun: 0.65, dir: [8, 16, 12], sunColor: '#d9ccff', bg: '#120f22', exposure: 1.06 },
  arcadeDay: { amb: 0.95, hemi: 0.75, sun: 0.95, dir: [8, 16, 12], sunColor: '#fff2dc', bg: '#120f22', exposure: 1.02 },
  arcadeSunset: { amb: 0.75, hemi: 0.55, sun: 0.9, dir: [14, 8, 6], sunColor: '#ffc28a', bg: '#120f22', exposure: 1.04 },
});

const fmt = n => Math.round(n).toLocaleString('en-US');
// live arcade screen: scr.set(mode, data, t). modes: game | scores | score | ooo | off
export function screenTex(seed = 1, W = 512, H = 400) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; let last = '';
  const r = rng(seed), stars = Array.from({ length: 50 }, () => [r() * W, r() * H, r() < 0.2 ? 3 : 2]);
  const hue = ['#ff4fd8', '#5ef2ff', '#ffe14a', '#7dff7a'][seed % 4];
  const txt = (s, x, y, size, col, al = 'center') => { g.font = `900 ${size}px Montserrat`; g.textAlign = al; g.fillStyle = col; g.fillText(s, x, y); };
  function set(mode, d = {}, time = 0) {
    const key = mode + JSON.stringify(d) + (mode === 'game' || d.flash ? Math.floor(time * 12) : ''); if (key === last) return; last = key;
    g.fillStyle = '#07061a'; g.fillRect(0, 0, W, H);
    if (mode === 'off') { g.fillStyle = '#05050a'; g.fillRect(0, 0, W, H); }
    else if (mode === 'ooo') { for (let y = 0; y < H; y += 6) { g.fillStyle = `rgba(255,255,255,${0.04 + ((y * 7 + Math.floor(time * 20) * 13) % 17) / 200})`; g.fillRect(0, y, W, 3); } txt('OUT OF', W / 2, 180, 62, '#ff5a5a'); txt('ORDER', W / 2, 250, 62, '#ff5a5a'); }
    else if (mode === 'game') {
      for (const s of stars) { g.fillStyle = '#ffffff88'; g.fillRect(s[0], (s[1] + time * 60) % H, s[2], s[2]); }
      const ox = Math.sin(time * 1.6 + seed) * 50;
      for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) { const x = 86 + col * 64 + ox, y = 90 + row * 46; g.fillStyle = ['#ff4fd8', '#5ef2ff', '#ffe14a'][row]; g.fillRect(x - 16, y - 10, 32, 18); g.fillRect(x - 22, y + (Math.floor(time * 4) % 2 ? 4 : -4), 6, 10); g.fillRect(x + 16, y + (Math.floor(time * 4) % 2 ? 4 : -4), 6, 10); g.fillStyle = '#07061a'; g.fillRect(x - 9, y - 5, 5, 5); g.fillRect(x + 4, y - 5, 5, 5); }
      const sx = W / 2 + Math.sin(time * 3.1 + seed * 2) * 170; g.fillStyle = '#7dff7a'; g.fillRect(sx - 26, H - 52, 52, 18); g.fillRect(sx - 8, H - 66, 16, 16);
      for (let b = 0; b < 3; b++) { const by = H - 80 - ((time * 600 + b * 110) % 300); g.fillStyle = '#ffffff'; g.fillRect(sx - 2 + Math.sin(b) * 4, by, 4, 14); }
      txt('SCORE ' + String(Math.floor(d.score ?? 12340)).padStart(7, '0'), 20, 40, 28, '#ffffff', 'left'); txt('HI 9999990', W - 20, 40, 28, hue, 'right');
    } else if (mode === 'scores') {
      txt('HIGH SCORES', W / 2, 62, 46, '#ff4fd8');
      (d.rows || []).forEach((row, i) => { const y = 122 + i * 54, col = row[2] || (i === 0 ? '#ffe14a' : '#5ef2ff'); txt(`${i + 1}`, 60, y, 36, col, 'left'); txt(row[0], 120, y, 36, col, 'left'); txt(row[1], W - 40, y, 36, col, 'right'); });
    } else if (mode === 'score') {
      txt(d.label || 'SCORE', W / 2, 92, 44, '#5ef2ff'); txt(fmt(d.score || 0), W / 2, 236, d.score >= 1e6 ? 92 : 104, '#ffe14a');
      if (d.flash && Math.floor(time * 6) % 2 === 0) txt('NEW HIGH SCORE!', W / 2, 330, 40, '#ff4fd8');
    }
    t.needsUpdate = true;
  }
  set('game', {}, seed);
  return { tex: t, set };
}

// arcade cabinet facing +z (rotate with at(.., ry)). o: color, art, title, seed, light (screen glow on the player), screen mode
export function cabinet(o = {}) {
  const col = o.color || '#3a2bd6', art = o.art || '#ff4fd8', g = grp(), sc = screenTex(o.seed || 1);
  g.add(at(box(3.2, 3.5, 2.6, col, 0.06), 0, 1.75, 0));                                                      // base
  const panel = at(box(3.5, 0.36, 1.5, shade(col, -0.25), 0.05), 0, 3.62, 1.0); panel.rotation.x = 0.18; g.add(panel);
  g.add(at(box(0.12, 0.55, 0.12, '#1a1a1a'), -0.9, 4.0, 1.15)); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), mat('#e82a2a')); knob.position.set(-0.9, 4.32, 1.15); knob.castShadow = true; g.add(knob); g.knob = knob;
  g.buttons = ['#ffe14a', '#5ef2ff', '#ff4fd8'].map((c, i) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 16), glow(c, 1.3)); b.position.set(0.1 + i * 0.5, 3.86, 1.1 - i * 0.05); g.add(b); return b; });
  g.add(at(box(3.2, 3.9, 2.0, col, 0.06), 0, 5.8, -0.3));                                                    // upper body
  const bezel = at(box(2.85, 2.3, 0.1, '#0b0b12'), 0, 5.45, 0.72); g.add(bezel); PRE.push(() => { bezel.visible = true; });   // bezel
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.0), new THREE.MeshBasicMaterial({ map: sc.tex, toneMapped: false, color: new THREE.Color(1.12, 1.12, 1.12) })); scr.position.set(0, 5.45, 0.78); g.add(scr);
  const mq = sign(o.title || 'STAR BLAST', 3.2, 0.95, { bg: '#16122e', fg: art, glowing: true }); mq.position.set(0, 7.95, 0.72); g.add(mq);
  g.add(at(box(3.3, 0.25, 2.2, shade(col, -0.3)), 0, 8.55, -0.3));
  for (const s of [-1, 1]) { g.add(at(box(0.06, 6.5, 0.5, glow(art, 1.2)), s * 1.63, 4.6, 0.4)); }               // neon side trims
  g.add(at(box(0.9, 0.5, 0.06, '#c9c9d4'), 0, 2.4, 1.31), at(box(0.5, 0.12, 0.08, glow('#ffd23f', 1.2)), 0, 2.4, 1.36)); // coin door
  // repair door on the lower front, hinged at its left edge
  const door = grp(at(box(2.4, 1.6, 0.1, shade(col, -0.12)), 1.2, 0, 0)); door.position.set(-1.2, 1.1, 1.33); g.add(door); g.door = door;
  const inside = grp(at(box(2.3, 1.5, 0.06, '#101018'), 0, 0, 0), at(box(0.8, 0.5, 0.06, glow('#3cff8a', 0.9)), -0.4, 0.2, 0.05), at(box(0.5, 0.3, 0.06, glow('#ff5a5a', 0.9)), 0.6, -0.3, 0.05), at(box(1.8, 0.06, 0.06, '#ffd23f'), 0, -0.1, 0.06)); inside.position.set(0, 1.1, 1.29); inside.visible = false; g.add(inside); g.inside = inside;
  if (o.light) { const L = new THREE.PointLight(o.lightColor || '#8fd8ff', 30, 12, 2); L.position.set(0, 5.4, 2.4); g.add(L); g.glowLight = L; }
  g.screen = sc; g.screenPos = [0, 5.45, 0.78];
  g.peek = () => { bezel.visible = false; };   // screen-camera shots: hide the bezel so a camera inside the cabinet sees out
  g.open = k => { door.rotation.y = -k * 1.9; inside.visible = k > 0.02; };
  g.mash = (t, on = 1) => { g.buttons.forEach((b, i) => { b.position.y = 3.86 - (on && Math.sin(t * 30 + i * 2.1) > 0.3 ? 0.07 : 0); }); knob.position.x = -0.9 + (on ? Math.sin(t * 17) * 0.12 : 0); };
  g.open(0); return g;
}
// pinball machine facing +z: tilted glowing playfield + backbox with a score screen
export function pinball(o = {}) {
  const col = o.color || '#d6331f', g = grp(), sc = screenTex(o.seed || 7);
  const body = grp(at(box(2.6, 1.2, 5.2, col, 0.05), 0, 0, 0));
  const pfTex = canvasTex(256, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1060'); gr.addColorStop(1, '#0b2a6a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 9; i++) { c.fillStyle = ['#ff4fd8', '#5ef2ff', '#ffe14a'][i % 3]; c.beginPath(); c.arc(40 + r() * 176, 60 + r() * 300, 14 + r() * 12, 0, 7); c.fill(); } c.fillStyle = '#ffffff'; c.fillRect(70, 440, 50, 10); c.fillRect(136, 440, 50, 10); });
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.9), new THREE.MeshBasicMaterial({ map: pfTex, toneMapped: false, color: new THREE.Color(1.1, 1.1, 1.1) })); pf.rotation.x = -Math.PI / 2; pf.position.y = 0.62; body.add(pf);
  const balls = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat('#e8e8f0', { emissive: new THREE.Color('#888') })); balls.position.set(0.3, 0.76, 0.4); body.add(balls); g.ball = balls;
  body.position.set(0, 3.0, 0); body.rotation.x = -0.1; g.add(body);
  for (const [x, z] of [[-1.1, 2.3], [1.1, 2.3], [-1.1, -2.3], [1.1, -2.3]]) g.add(at(box(0.25, 3, 0.25, '#1a1a1a'), x, 1.4, z));
  g.add(at(box(2.6, 2.6, 0.7, col, 0.05), 0, 5.0, -2.5));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), new THREE.MeshBasicMaterial({ map: sc.tex, toneMapped: false })); scr.position.set(0, 5.0, -2.13); g.add(scr);
  g.flippers = [-0.5, 0.5].map(x => { const f = box(0.7, 0.12, 0.16, '#ffffff'); f.position.set(x, 3.72, 2.0); g.add(f); return f; });
  g.screen = sc; g.flip = t => { g.flippers.forEach((f, i) => { f.rotation.y = (i ? -1 : 1) * (Math.sin(t * 14 + i) > 0.4 ? 0.6 : 0); }); balls.position.set(Math.sin(t * 5) * 0.8, 0.76, Math.cos(t * 3.7) * 1.8); };
  return g;
}
// arcade room: neon purple, checker carpet, cabinets on the walls, one big window whose sky changes (set.sky('day'|'sunset'|'night'))
export function arcadeRoom() {
  const carpet = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#1b1440'; c.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 40; i++) { c.fillStyle = ['#ff4fd8', '#5ef2ff', '#ffe14a', '#7dff7a'][i % 4]; const x = r() * w, y = r() * h; if (i % 2) c.fillRect(x, y, 10, 4); else { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); } } });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
  const g = room({ floorTex: carpet, tile: 6, wallColor: '#2c2152', trim: '#4a2f8a', trimY: 0.8, w: 40, d: 26, h: 12.5, lights: 0, ceiling: '#0d0b18' });
  // neon strips
  g.add(at(box(40, 0.18, 0.18, glow('#ff4fd8', 1.6)), 0, 11.2, -5.85), at(box(40, 0.12, 0.12, glow('#5ef2ff', 1.6)), 0, 10.6, -5.85));
  const ns = sign('ARCADE', 7, 1.7, { bg: '#16122e', fg: '#5ef2ff', glowing: true }); ns.position.set(-10, 8.6, -5.8); g.add(ns);
  const ns2 = sign('HIGH SCORE CLUB', 7.5, 1.1, { bg: '#16122e', fg: '#ffe14a', glowing: true }); ns2.position.set(13, 8.8, -5.8); g.add(ns2);
  // window (sky swaps per shot)
  const skies = {}; for (const [k, a, b] of [['day', '#6fb6ee', '#cfe8ff'], ['sunset', '#f28a5a', '#ffd2a0'], ['night', '#0e1530', '#2a3766']]) skies[k] = canvasTex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); c.fillStyle = gr; c.fillRect(0, 0, w, h); if (k === 'night') { const r = rng(4); for (let i = 0; i < 40; i++) { c.fillStyle = '#fff'; c.fillRect(r() * w, r() * h * 0.7, 2, 2); } c.beginPath(); c.arc(190, 60, 18, 0, 7); c.fill(); } if (k === 'day') { c.fillStyle = 'rgba(255,255,255,0.8)'; for (const [x, y] of [[60, 70], [170, 120]]) for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(x + j * 18, y + (j % 2) * 6, 24, 12, 0, 0, 7); c.fill(); } } if (k === 'sunset') { c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(128, 200, 34, 0, 7); c.fill(); } c.fillStyle = '#141020'; for (let i = 0; i < 8; i++) c.fillRect(i * 34, h - 40 - (i * 37 % 50), 30, 60); });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), new THREE.MeshBasicMaterial({ map: skies.night, toneMapped: false })); win.position.set(4.5, 6.4, -5.84);
  g.add(win, at(box(7.5, 0.35, 0.3, '#f0eaff'), 4.5, 3.75, -5.8), at(box(7.5, 0.35, 0.3, '#f0eaff'), 4.5, 9.05, -5.8), at(box(0.35, 5.6, 0.3, '#f0eaff'), 0.85, 6.4, -5.8), at(box(0.35, 5.6, 0.3, '#f0eaff'), 8.15, 6.4, -5.8), at(box(0.2, 5.3, 0.2, '#f0eaff'), 4.5, 6.4, -5.8));
  const winLight = new THREE.PointLight('#ffffff', 0, 30, 1.6); winLight.position.set(4.5, 6.5, -3.5); g.add(winLight);
  // wall cabinets
  const cols = ['#d6331f', '#1f8ad6', '#7a2bd6', '#1fae5a', '#d68a1f', '#d61f8a'], titles = ['ROCKET RUN', 'PIXEL PUNCH', 'GALAXY 9', 'TURBO KART', 'MEGA MAZE', 'DINO DASH'];
  [-17, -13.4, -9.8, -6.2, 11.6, 15.2].forEach((x, i) => g.add(at(cabinet({ color: cols[i], art: ['#5ef2ff', '#ffe14a', '#ff4fd8'][i % 3], title: titles[i], seed: i + 2 }), x, 0, -4.5)));
  g.add(at(cabinet({ color: '#1f8ad6', title: 'BLOK BOWL', seed: 9 }), -19, 0, 2, Math.PI / 2), at(cabinet({ color: '#d6331f', title: 'ZAP ZONE', seed: 10 }), 19, 0, 2, -Math.PI / 2));
  // neon colour lights
  for (const [x, c] of [[-12, '#ff4fd8'], [12, '#5ef2ff']]) { const L = new THREE.PointLight(c, 160, 30, 2); L.position.set(x, 9, 2); g.add(L); }
  const hero = cabinet({ color: '#3a2bd6', title: 'STAR BLAST', seed: 1, light: true }); g.add(at(hero, -2, 0, 0, Math.PI / 2));
  const set = { group: g, light: 'arcade', hero, win };
  set.sky = k => { win.material.map = skies[k]; win.material.needsUpdate = true; winLight.color.set(k === 'day' ? '#dff0ff' : k === 'sunset' ? '#ffb070' : '#6070c0'); winLight.intensity = k === 'night' ? 20 : 140; };
  set.sky('night'); return set;
}
export function crown(color = '#f2c230') { const g = grp(); const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.36, 24, 1, true), mat(color, { side: THREE.DoubleSide, emissive: new THREE.Color(color).multiplyScalar(0.2) })); ring.position.y = 1.32; g.add(ring); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, s = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 6), mat(color)); s.position.set(Math.sin(a) * 0.6, 1.66, Math.cos(a) * 0.6); g.add(s); } const gem = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glow('#ff3b5c', 1.2)); gem.position.set(0, 1.34, 0.63); g.add(gem); return g; }
export function topHat() { return grp(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 24), mat('#16161c')), 0, 1.75, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 28), mat('#16161c')), 0, 1.22, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.22, 24), mat('#c33a3a')), 0, 1.38, 0)); }
export function gradCap() { const g = grp(at(box(1.4, 0.08, 1.4, '#16161c'), 0, 0.35, 0), at(box(0.7, 0.3, 0.7, '#16161c'), 0, 0.18, 0), at(box(0.05, 0.6, 0.05, '#ffd23f'), 0.6, 0.1, 0.6)); g.rotation.y = 0.5; return g; }
export function screwdriver() { const g = grp(at(box(0.32, 0.9, 0.32, '#e8b41e', 0.1), 0, -0.2, 0), at(box(0.1, 1.2, 0.1, '#c9ccd4'), 0, -1.2, 0)); g.rotation.x = -1.2; return g; }
