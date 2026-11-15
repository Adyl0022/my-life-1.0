import React, { useEffect, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Region, REGIONS } from '../lib/twin';

// A real 3D hologram built from simple shapes (no model file). Drag to turn it, tap a part to pick it.
// If anything fails, onFail() is called so the screen falls back to the flat 2D hologram.
type Props = { w: number; h: number; sel: Region; onPick: (r: Region) => void; glow: number; reduce: boolean; onFail: () => void };
const colOf = (r: Region) => REGIONS.find((x) => x.k === r)!.c;

export function Hologram3D({ w, h, sel, onPick, glow, reduce, onFail }: Props) {
  const st = useRef({ sel, glow, reduce, onPick, onFail }); st.current = { sel, glow, reduce, onPick, onFail };
  const api = useRef<{ pick: (x: number, y: number) => Region | null; spin: (dx: number) => void } | null>(null);
  const raf = useRef(0); const dead = useRef(false);
  useEffect(() => () => { dead.current = true; cancelAnimationFrame(raf.current); }, []);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { (pan as any).t0 = Date.now(); (pan as any).mv = 0; (pan as any).x = e.nativeEvent.locationX; (pan as any).y = e.nativeEvent.locationY; },
    onPanResponderMove: (_, g) => { const p: any = pan; const dx = g.dx - (p.last || 0); p.last = g.dx; p.mv += Math.abs(dx); if (api.current) api.current.spin(dx); },
    onPanResponderRelease: () => {
      const p: any = pan; const quick = Date.now() - p.t0 < 350 && p.mv < 8; p.last = 0;
      if (quick && api.current) { const r = api.current.pick(p.x, p.y); if (r) st.current.onPick(r); }
    },
  })).current;

  const onCtx = (gl: any) => {
    try {
      const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
      const canvas: any = { width: W, height: H, style: {}, clientWidth: W, clientHeight: H, addEventListener() {}, removeEventListener() {}, getContext: () => gl };
      const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true });
      renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 50); cam.position.set(0, -0.05, 8.3); cam.lookAt(0, -0.1, 0);
      const g = new THREE.Group(); scene.add(g);
      const mats: { r: Region; m: THREE.MeshBasicMaterial; kind: 'fill' | 'wire' }[] = [];
      const picks: Record<string, THREE.Object3D[]> = { body: [], brain: [], heart: [], lungs: [], muscles: [] };
      const add = (geo: THREE.BufferGeometry, r: Region, p: [number, number, number], o?: { s?: [number, number, number]; rz?: number }) => {
        const c = new THREE.Color(colOf(r));
        const fill = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
        const wire = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.4, wireframe: true, depthWrite: false });
        const a = new THREE.Mesh(geo, fill), b = new THREE.Mesh(geo, wire);
        [a, b].forEach((m) => { m.position.set(p[0], p[1], p[2]); if (o && o.s) m.scale.set(o.s[0], o.s[1], o.s[2]); if (o && o.rz) m.rotation.z = o.rz; g.add(m); });
        mats.push({ r, m: fill, kind: 'fill' }, { r, m: wire, kind: 'wire' }); picks[r].push(a);
      };
      const cap = (rad: number, len: number) => new THREE.CapsuleGeometry(rad, len, 4, 10);
      const sph = (rad: number) => new THREE.SphereGeometry(rad, 14, 10);
      // shell (whole body)
      add(sph(0.27), 'body', [0, 1.74, 0]);
      add(new THREE.CylinderGeometry(0.09, 0.1, 0.2, 10), 'body', [0, 1.42, 0]);
      add(cap(0.34, 0.85), 'body', [0, 0.88, 0], { s: [1.15, 1, 0.7] });
      add(sph(0.32), 'body', [0, 0.22, 0], { s: [1.2, 0.8, 0.78] });
      add(cap(0.085, 0.5), 'body', [-0.7, 0.45, 0], { rz: 0.08 }); add(cap(0.085, 0.5), 'body', [0.7, 0.45, 0], { rz: -0.08 });
      add(cap(0.11, 0.7), 'body', [-0.22, -1.42, 0]); add(cap(0.11, 0.7), 'body', [0.22, -1.42, 0]);
      add(sph(0.12), 'body', [-0.22, -1.98, 0.08], { s: [1, 0.6, 1.6] }); add(sph(0.12), 'body', [0.22, -1.98, 0.08], { s: [1, 0.6, 1.6] });
      // muscles: upper arms and thighs
      add(cap(0.115, 0.5), 'muscles', [-0.63, 1.05, 0], { rz: 0.12 }); add(cap(0.115, 0.5), 'muscles', [0.63, 1.05, 0], { rz: -0.12 });
      add(cap(0.17, 0.62), 'muscles', [-0.22, -0.5, 0]); add(cap(0.17, 0.62), 'muscles', [0.22, -0.5, 0]);
      // organs
      add(sph(0.19), 'brain', [0, 1.78, 0], { s: [1, 0.85, 1] });
      add(sph(0.2), 'lungs', [-0.2, 1.15, 0.02], { s: [0.9, 1.5, 0.8] }); add(sph(0.2), 'lungs', [0.2, 1.15, 0.02], { s: [0.9, 1.5, 0.8] });
      add(sph(0.13), 'heart', [0.1, 1.08, 0.12], { s: [1, 1.15, 0.9] });
      // floor rings and a moving scan ring
      const ring = (r0: number, r1: number, c: number, o: number) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 64), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m; };
      const r1 = ring(1.2, 1.24, 0x5ee7df, 0.7); r1.position.y = -2.12; scene.add(r1);
      const r2 = ring(0.8, 0.83, 0xb794ff, 0.7); r2.position.y = -2.12; scene.add(r2);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshBasicMaterial({ color: 0x5ee7df, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = -2.12; scene.add(disc);
      const scan = ring(0.5, 0.56, 0x8fe9e2, 0.55); scene.add(scan); scan.scale.set(1.25, 1.25, 1);
      const ray = new THREE.Raycaster();
      let ry = 0.5; let vel = 0; let t = 0; let last = Date.now();

      api.current = {
        spin: (dx: number) => { ry += dx * 0.012; vel = dx * 0.012; },
        pick: (x: number, y: number) => {
          const v = new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1); ray.setFromCamera(v, cam); g.updateMatrixWorld(true);
          for (const r of ['heart', 'brain', 'lungs', 'muscles', 'body'] as Region[]) { if (ray.intersectObjects(picks[r], false).length) return r; }
          return null;
        },
      };
      const loop = () => {
        if (dead.current) return;
        const now = Date.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        const s = st.current;
        if (!s.reduce) { ry += 0.35 * dt + vel; vel *= 0.92; scan.position.y = 1.95 - ((t * 0.55) % 1) * 4.1; } else scan.position.y = -3;
        g.rotation.y = ry; r1.rotation.z = t * 0.4; r2.rotation.z = -t * 0.6;
        const pulse = s.reduce ? 1 : 0.5 + 0.5 * Math.sin(t * 4);
        for (const { r, m, kind } of mats) {
          const on = s.sel === r; const dimOthers = s.sel !== 'body' && !on && r !== 'body';
          const base = r === 'body' ? 0.03 + 0.09 * s.glow : r === 'muscles' ? 0.05 : 0.12;
          const wb = r === 'body' ? 0.1 + 0.3 * s.glow : r === 'muscles' ? 0.22 : (dimOthers ? 0.25 : 0.5);
          m.opacity = kind === 'fill' ? base + (on ? 0.22 + 0.2 * pulse : 0) : wb + (on ? 0.45 * pulse : 0);
        }
        renderer.render(scene, cam);
        if (gl.endFrameEXP) gl.endFrameEXP();
        raf.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { st.current.onFail(); }
  };
  return (
    <View style={{ width: w, height: h, alignSelf: 'center' }}>
      <GLView style={{ width: w, height: h }} onContextCreate={onCtx} />
      <View {...pan.panHandlers} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
    </View>
  );
}
