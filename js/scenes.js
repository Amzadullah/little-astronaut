// Procedural Three.js scenes — no external textures needed, so it works offline too.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let current = null;

function noiseTexture(colors, opts = {}) {
  const { w = 512, h = 256, blobs = 220, bands = false, seed = 1 } = opts;
  let r = seed;
  const rand = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = colors[0]; g.fillRect(0, 0, w, h);
  if (bands) {
    for (let y = 0; y < h; y += 4 + rand() * 14) {
      g.fillStyle = colors[1 + Math.floor(rand() * (colors.length - 1))];
      g.globalAlpha = 0.35 + rand() * 0.5;
      g.fillRect(0, y, w, 3 + rand() * 12);
    }
  }
  for (let i = 0; i < blobs; i++) {
    g.globalAlpha = 0.25 + rand() * 0.6;
    g.fillStyle = colors[1 + Math.floor(rand() * (colors.length - 1))];
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 4 + rand() * 40, 3 + rand() * 22, rand() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const TEX = {
  earth: () => noiseTexture(['#1f5fa8', '#2e8b57', '#3a9d5d', '#c2b280', '#2a6fbf'], { blobs: 160, seed: 7 }),
  clouds: () => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d'); let r = 3; const rand = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + rand() * 0.5})`; g.beginPath(); g.ellipse(rand() * 512, rand() * 256, 10 + rand() * 50, 3 + rand() * 10, 0, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); return t;
  },
  moon: () => noiseTexture(['#9a9a9a', '#7d7d7d', '#b5b5b5', '#6b6b6b'], { blobs: 300, seed: 11 }),
  mars: () => noiseTexture(['#b5502c', '#8e3b1f', '#d0784a', '#6e2c16', '#c96a3c'], { blobs: 260, seed: 5 }),
  sun: () => noiseTexture(['#ffb000', '#ff7a00', '#ffd34d', '#ff5a00'], { blobs: 400, seed: 2 }),
  jupiter: () => noiseTexture(['#c9a37a', '#e3cfb1', '#a8784f', '#f0e2c8', '#b5653d'], { bands: true, blobs: 30, seed: 9 }),
  saturn: () => noiseTexture(['#e0c48f', '#cfae73', '#f2dcae'], { bands: true, blobs: 10, seed: 4 }),
  venus: () => noiseTexture(['#e8c27a', '#d9a95b', '#f3d9a0'], { bands: true, blobs: 60, seed: 6 }),
  ice: () => noiseTexture(['#7fd3e6', '#5fb8d1', '#a6e6f2'], { bands: true, blobs: 20, seed: 8 }),
  neptune: () => noiseTexture(['#3355cc', '#2a46aa', '#5577ee'], { bands: true, blobs: 30, seed: 10 }),
  mercury: () => noiseTexture(['#8c8075', '#6f655c', '#a69a8e'], { blobs: 250, seed: 12 }),
  exo: () => noiseTexture(['#5a2a82', '#2c7da0', '#8a4fbf', '#1f4e6e'], { bands: true, blobs: 80, seed: 13 }),
};

function starfield(count = 1500, radius = 200) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.6 + Math.random() * 0.4));
    pos.set([v.x, v.y, v.z], i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true }));
}

function planet(radius, tex, emissive = false) {
  const mat = emissive
    ? new THREE.MeshBasicMaterial({ map: tex })
    : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
}

function rocket() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.2, roughness: 0.5 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xff7a1a });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 32), white); g.add(body);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.2, 32), orange); tank.position.y = -1.2; g.add(tank);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 32), white); nose.position.y = 2.6; g.add(nose);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.7), orange);
    fin.position.set(Math.cos(i * Math.PI / 2) * 0.6, -1.7, Math.sin(i * Math.PI / 2) * 0.6);
    fin.rotation.y = -i * Math.PI / 2; g.add(fin);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 24), new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.85 }));
  flame.rotation.x = Math.PI; flame.position.y = -2.8; flame.name = 'flame'; g.add(flame);
  const win = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, emissive: 0x113355 }));
  win.position.set(0, 1.1, 0.47); g.add(win);
  return g;
}

function astronaut(goldVisor = true) {
  const g = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), suit); head.position.y = 1.6; g.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: goldVisor ? 0xd4a017 : 0x223355, metalness: 0.9, roughness: 0.15 }));
  visor.rotation.x = Math.PI / 2; visor.position.set(0, 1.62, 0.2); g.add(visor);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.8, 8, 16), suit); torso.position.y = 0.5; g.add(torso);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.4), new THREE.MeshStandardMaterial({ color: 0xcccccc })); pack.position.set(0, 0.6, -0.55); g.add(pack);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.05), new THREE.MeshStandardMaterial({ color: 0x1e88e5 })); panel.position.set(0, 0.6, 0.55); g.add(panel);
  [-1, 1].forEach(s => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.8, 6, 12), suit); arm.position.set(s * 0.75, 0.5, 0); arm.rotation.z = s * 0.35; g.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.8, 6, 12), suit); leg.position.set(s * 0.28, -0.6, 0); g.add(leg);
  });
  return g;
}

function station() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.4 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a3a8a, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide });
  const truss = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 0.2), metal); g.add(truss);
  const mod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.5, 24), metal); mod1.rotation.x = Math.PI / 2; g.add(mod1);
  const mod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 24), metal); mod2.position.z = 1.8; mod2.rotation.x = Math.PI / 2; g.add(mod2);
  [-3.5, -2.3, 2.3, 3.5].forEach(x => {
    [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.6), panelMat); p.position.set(x, 0, s * 1.5); p.rotation.x = Math.PI / 2; g.add(p); });
  });
  return g;
}

function rover() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 1.4), new THREE.MeshStandardMaterial({ color: 0xe8e8e8 })); body.position.y = 0.6; g.add(body);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: 0x8d6e63 })); deck.position.y = 0.9; g.add(deck);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0xcccccc })); mast.position.set(0.7, 1.5, 0.4); g.add(mast);
  const cam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x555555 })); cam.position.set(0.7, 2.1, 0.4); g.add(cam);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  [-0.8, 0, 0.8].forEach(x => [-0.8, 0.8].forEach(z => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 20), wheelMat); w.rotation.x = Math.PI / 2; w.position.set(x, 0.25, z); w.name = 'wheel'; g.add(w);
  }));
  return g;
}

function ground(color) {
  const geo = new THREE.PlaneGeometry(60, 60, 60, 60);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 0.4) * 0.15 + Math.cos(p.getY(i) * 0.3) * 0.2 + Math.random() * 0.08);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.rotation.x = -Math.PI / 2; return m;
}

function habitat() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 }));
  g.add(dome);
  const green = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.4, 24, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x7ee08a, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  green.rotation.z = Math.PI / 2; green.position.set(3, 0, 0); g.add(green);
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.9), new THREE.MeshStandardMaterial({ color: 0x1a3a8a, metalness: 0.5 }));
    p.position.set(-3 - i * 1.6, 0.7, 1); p.rotation.x = -0.4; p.name = 'panel'; g.add(p);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7), new THREE.MeshStandardMaterial({ color: 0x999999 })); leg.position.set(-3 - i * 1.6, 0.35, 1); g.add(leg);
  }
  return g;
}

const BUILDERS = {
  earth(ctx) { const e = planet(2, TEX.earth()); const c = planet(2.04, TEX.clouds()); c.material.transparent = true; ctx.spin.push([e, 0.003], [c, 0.004]); ctx.scene.add(e, c); },
  earthorbit(ctx) {
    BUILDERS.earth(ctx);
    const sat = new THREE.Group();
    sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.7 })));
    const pn = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: 0x1a3a8a })); sat.add(pn);
    ctx.scene.add(sat); ctx.tick.push(t => sat.position.set(Math.cos(t * 0.6) * 3, Math.sin(t * 0.6) * 0.8, Math.sin(t * 0.6) * 3));
  },
  stars(ctx) { ctx.scene.add(starfield(4000, 80)); ctx.camera.position.set(0, 0, 1); ctx.tick.push(t => { ctx.scene.rotation.y = t * 0.02; }); },
  sun(ctx) {
    const s = planet(2.4, TEX.sun(), true); ctx.scene.add(s); ctx.spin.push([s, 0.002]);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(2.9, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.18 }));
    ctx.scene.add(glow); ctx.tick.push(t => glow.scale.setScalar(1 + Math.sin(t * 2) * 0.03));
  },
  solar(ctx) {
    const sun = planet(1.2, TEX.sun(), true); ctx.scene.add(sun);
    ctx.scene.add(new THREE.PointLight(0xffffff, 60, 0, 1.4));
    const defs = [[0.15, 2.2, TEX.mercury], [0.25, 3, TEX.venus], [0.27, 3.9, TEX.earth], [0.2, 4.8, TEX.mars], [0.7, 6.4, TEX.jupiter], [0.6, 8, TEX.saturn], [0.4, 9.4, TEX.ice], [0.4, 10.6, TEX.neptune]];
    defs.forEach(([r, d, tx], i) => {
      const p = planet(r, tx()); ctx.scene.add(p);
      const ring = new THREE.Mesh(new THREE.RingGeometry(d - 0.01, d + 0.01, 128), new THREE.MeshBasicMaterial({ color: 0x5566aa, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
      ring.rotation.x = Math.PI / 2; ctx.scene.add(ring);
      const speed = 1.2 / Math.pow(d, 1.5); const off = i * 1.7;
      ctx.tick.push(t => p.position.set(Math.cos(t * speed * 3 + off) * d, 0, Math.sin(t * speed * 3 + off) * d));
    });
    ctx.camera.position.set(0, 9, 14); ctx.noDirLight = true;
  },
  planets(ctx) {
    const defs = [[0.4, TEX.mercury], [0.6, TEX.venus], [0.6, TEX.earth], [0.45, TEX.mars], [1.6, TEX.jupiter], [1.3, TEX.saturn], [0.9, TEX.ice], [0.9, TEX.neptune]];
    let x = -9;
    defs.forEach(([r, tx], i) => {
      const p = planet(r, tx()); x += r + 0.5; p.position.x = x; x += r; ctx.scene.add(p); ctx.spin.push([p, 0.005]);
      if (i === 5) { const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.5, 64), new THREE.MeshStandardMaterial({ color: 0xd9c08a, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })); ring.rotation.x = Math.PI / 2.3; ring.position.copy(p.position); ctx.scene.add(ring); }
    });
    ctx.camera.position.set(0, 2, 13);
  },
  moon(ctx) { const m = planet(2, TEX.moon()); ctx.scene.add(m); ctx.spin.push([m, 0.002]); const e = planet(0.5, TEX.earth()); e.position.set(-5, 2, -6); ctx.scene.add(e); },
  moonbase(ctx) {
    ctx.scene.add(ground(0x888888)); ctx.camera.position.set(4, 3, 7);
    const lander = new THREE.Group();
    lander.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 1, 8), new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.7 })));
    const top = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0xdddddd })); top.position.y = 0.9; lander.add(top);
    lander.position.y = 1; ctx.scene.add(lander);
    const a = astronaut(); a.scale.setScalar(0.5); a.position.set(2, 0.6, 1); ctx.scene.add(a);
    const e = planet(0.8, TEX.earth()); e.position.set(-6, 6, -12); ctx.scene.add(e);
  },
  mars(ctx) { const m = planet(2, TEX.mars()); ctx.scene.add(m); ctx.spin.push([m, 0.003]); },
  marsdust(ctx) {
    ctx.scene.background = new THREE.Color(0x4a2a1a); ctx.scene.fog = new THREE.Fog(0x8a5a3a, 2, 22);
    ctx.scene.add(ground(0xa0522d)); const r = rover(); ctx.scene.add(r); ctx.camera.position.set(4, 2.5, 6);
    const geo = new THREE.BufferGeometry(); const n = 1500; const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 30, Math.random() * 6, (Math.random() - 0.5) * 30], i * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd2a679, size: 0.08 })); ctx.scene.add(dust);
    ctx.tick.push(t => { dust.position.x = (t * 2) % 10 - 5; });
  },
  rocket(ctx) {
    const r = rocket(); ctx.scene.add(r); ctx.camera.position.set(0, 0, 9);
    ctx.tick.push(t => { r.rotation.y = t * 0.5; r.position.y = Math.sin(t) * 0.3; const f = r.getObjectByName('flame'); f.scale.y = 1 + Math.sin(t * 20) * 0.15; });
  },
  astronaut(ctx) { const a = astronaut(); ctx.scene.add(a); ctx.camera.position.set(0, 1, 6); ctx.tick.push(t => { a.position.y = Math.sin(t) * 0.25; a.rotation.y = Math.sin(t * 0.4) * 0.6; a.rotation.z = Math.sin(t * 0.7) * 0.1; }); const e = planet(3, TEX.earth()); e.position.set(4, -5, -8); ctx.scene.add(e); },
  suit(ctx) { const a = astronaut(true); a.scale.setScalar(1.3); ctx.scene.add(a); ctx.camera.position.set(0, 1.5, 6); ctx.spin.push([a, 0.006]); },
  station(ctx) { const s = station(); ctx.scene.add(s); ctx.camera.position.set(3, 3, 8); ctx.tick.push(t => { s.rotation.y = t * 0.15; }); const e = planet(6, TEX.earth()); e.position.set(0, -9, -4); ctx.scene.add(e); ctx.spin.push([e, 0.001]); },
  rover(ctx) {
    ctx.scene.background = new THREE.Color(0xc9a27e); ctx.scene.add(ground(0xb5602f));
    const r = rover(); ctx.scene.add(r); ctx.camera.position.set(4, 2.5, 5);
    ctx.tick.push(t => { r.position.x = Math.sin(t * 0.3) * 3; r.children.filter(c => c.name === 'wheel').forEach(w => { w.rotation.y = t * 2; }); });
  },
  outpost(ctx) {
    ctx.scene.background = new THREE.Color(0xc9a27e); ctx.scene.fog = new THREE.Fog(0xc9a27e, 10, 40);
    ctx.scene.add(ground(0xb5602f)); const h = habitat(); ctx.scene.add(h); ctx.camera.position.set(2, 4, 10);
    const r = rover(); r.scale.setScalar(0.6); r.position.set(3, 0, 3); ctx.scene.add(r);
  },
  galaxy(ctx) {
    const n = 12000; const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); const col = new Float32Array(n * 3);
    const inner = new THREE.Color(0xffd27f), outer = new THREE.Color(0x5b7cff);
    for (let i = 0; i < n; i++) {
      const arm = i % 3; const r = Math.pow(Math.random(), 1.5) * 8; const ang = arm * (Math.PI * 2 / 3) + r * 0.9;
      const sx = (Math.random() - 0.5) * 0.8 * (1 + r * 0.1), sz = (Math.random() - 0.5) * 0.8 * (1 + r * 0.1);
      pos.set([Math.cos(ang) * r + sx, (Math.random() - 0.5) * 0.3, Math.sin(ang) * r + sz], i * 3);
      const c = inner.clone().lerp(outer, r / 8); col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const g = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    ctx.scene.add(g); ctx.camera.position.set(0, 7, 9); ctx.spin.push([g, 0.0015]);
  },
  blackhole(ctx) {
    const hole = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), new THREE.MeshBasicMaterial({ color: 0x000000 })); ctx.scene.add(hole);
    const c = document.createElement('canvas'); c.width = 256; c.height = 1; const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 256, 0); grd.addColorStop(0, '#fff6d0'); grd.addColorStop(0.3, '#ffae42'); grd.addColorStop(0.7, '#c2410c'); grd.addColorStop(1, 'rgba(80,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 1);
    const tex = new THREE.CanvasTexture(c);
    const geo = new THREE.RingGeometry(1.3, 4, 128, 1);
    const uv = geo.attributes.uv; const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (r - 1.3) / 2.7, 0.5); }
    const disk = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, blending: THREE.AdditiveBlending }));
    disk.rotation.x = Math.PI / 2.2; ctx.scene.add(disk); ctx.spin.push([disk, 0.01]);
    ctx.camera.position.set(0, 2, 8);
  },
  exoplanet(ctx) {
    const star = planet(1.5, noiseTexture(['#ff6b3d', '#ff9a5a', '#e0482a'], { blobs: 300, seed: 3 }), true); star.position.set(-4, 0, -3); ctx.scene.add(star);
    const p = planet(1, TEX.exo()); ctx.scene.add(p); ctx.spin.push([p, 0.006]);
    ctx.tick.push(t => p.position.set(-4 + Math.cos(t * 0.4) * 6, 0, -3 + Math.sin(t * 0.4) * 6));
    ctx.camera.position.set(0, 3, 10);
  },
};

export function mountScene(container, type) {
  disposeScene();
  if (!container) return;
  const w = container.clientWidth || 300, h = container.clientHeight || 260;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  container.innerHTML = ''; container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500);
  camera.position.set(0, 0, 7);
  const ctx = { scene, camera, spin: [], tick: [], noDirLight: false };
  if (!['stars', 'galaxy', 'marsdust', 'rover', 'outpost'].includes(type)) scene.add(starfield());
  (BUILDERS[type] || BUILDERS.earth)(ctx);
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  if (!ctx.noDirLight) { const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(5, 3, 5); scene.add(d); }
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 0.5; controls.maxDistance = 40;
  const clock = new THREE.Clock(); let raf;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    ctx.spin.forEach(([o, s]) => { o.rotation.y += s; });
    ctx.tick.forEach(fn => fn(t));
    controls.update(); renderer.render(scene, camera);
  };
  loop();
  const onResize = () => { const W = container.clientWidth, H = container.clientHeight; if (!W || !H) return; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(onResize); ro.observe(container);
  current = { renderer, raf: () => raf, ro, scene };
}

export function disposeScene() {
  if (!current) return;
  cancelAnimationFrame(current.raf());
  current.ro.disconnect();
  current.scene.traverse(o => { o.geometry?.dispose?.(); const m = o.material; if (m) { (Array.isArray(m) ? m : [m]).forEach(x => { x.map?.dispose?.(); x.dispose(); }); } });
  current.renderer.dispose();
  current.renderer.domElement.remove();
  current = null;
}
