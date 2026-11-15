import React, { useEffect, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Region, REGIONS } from '../lib/twin';
import { BODY_MIN, BODY_MAX, BODY_POS, BODY_IDX } from '../data/bodyMesh';

// A real 3D hologram: a human body mesh drawn as a glowing grid, with organ shapes inside.
// Drag to turn it, tap a part to pick it. If anything fails, onFail() is called so the screen falls back to the flat 2D hologram.
type Props = { w: number; h: number; sel: Region; onPick: (r: Region) => void; glow: number; reduce: boolean; onFail: () => void };
const colOf = (r: Region) => REGIONS.find((x) => x.k === r)!.c;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decode(s: string): Uint8Array {
  const lut: Record<string, number> = {}; for (let i = 0; i < 64; i++) lut[B64[i]] = i;
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0; const out = new Uint8Array((s.length / 4) * 3 - pad);
  let o = 0; for (let i = 0; i < s.length; i += 4) {
    const n = (lut[s[i]] << 18) | (lut[s[i + 1]] << 12) | ((lut[s[i + 2]] || 0) << 6) | (lut[s[i + 3]] || 0);
    if (o < out.length) out[o++] = (n >> 16) & 255; if (o < out.length) out[o++] = (n >> 8) & 255; if (o < out.length) out[o++] = n & 255;
  }
  return out;
}
function bodyGeometry(): THREE.BufferGeometry {
  const pb = decode(BODY_POS), ib = decode(BODY_IDX);
  const q = new Int16Array(pb.buffer, pb.byteOffset, pb.byteLength / 2); const ix = new Uint16Array(ib.buffer, ib.byteOffset, ib.byteLength / 2);
  const pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i += 3) for (let k = 0; k < 3; k++) pos[i + k] = BODY_MIN[k] + ((q[i + k] + 32767) / 65534) * (BODY_MAX[k] - BODY_MIN[k]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(ix, 1)); g.computeVertexNormals(); return g;
}

const VERT = `varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FRAG = `precision highp float; varying vec3 vN; varying vec3 vV; varying vec3 vP;
uniform float uGlow; uniform float uScan; uniform float uMus; uniform float uBody; uniform vec3 uCol; uniform vec3 uMusCol;
float ln(float v, float w){ float f = fract(v); float d = min(f, 1.0 - f); return 1.0 - smoothstep(0.0, w, d); }
void main(){
  float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  float grid = max(ln(vP.y * 38.0, 0.07), ln(vP.x * 38.0 + vP.z * 12.0, 0.07)) * 0.55;
  float sc = exp(-pow((vP.y - uScan) * 16.0, 2.0));
  float armM = step(0.17, abs(vP.x)) * step(abs(vP.x), 0.62) * step(1.33, vP.y) * step(vP.y, 1.58);
  float legM = step(abs(vP.x), 0.2) * step(0.5, vP.y) * step(vP.y, 0.93);
  float mus = clamp(armM + legM, 0.0, 1.0);
  vec3 c = mix(uCol, uMusCol, mus * (0.35 + 0.65 * uMus));
  float a = (0.05 + fr * 0.75 + grid * (0.35 + 0.65 * uGlow)) * (0.45 + 0.55 * uBody) + sc * 0.55 + mus * uMus * 0.35;
  gl_FragColor = vec4(c * (0.7 + fr), clamp(a, 0.0, 0.95));
}`;

export function Hologram3D({ w, h, sel, onPick, glow, reduce, onFail }: Props) {
  const st = useRef({ sel, glow, reduce, onPick, onFail }); st.current = { sel, glow, reduce, onPick, onFail };
  const api = useRef<{ pick: (x: number, y: number) => Region | null; spin: (dx: number) => void } | null>(null);
  const raf = useRef(0); const dead = useRef(false);
  useEffect(() => () => { dead.current = true; cancelAnimationFrame(raf.current); }, []);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderTerminationRequest: () => false, onShouldBlockNativeResponder: () => true,
    onPanResponderGrant: (e) => { const p: any = pan; p.t0 = Date.now(); p.mv = 0; p.last = 0; p.x = e.nativeEvent.locationX; p.y = e.nativeEvent.locationY; },
    onPanResponderMove: (_, g) => { const p: any = pan; const dx = g.dx - (p.last || 0); p.last = g.dx; p.mv += Math.abs(dx); if (api.current) api.current.spin(dx); },
    onPanResponderRelease: () => {
      const p: any = pan; const quick = Date.now() - p.t0 < 350 && p.mv < 8;
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
      const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 50); cam.position.set(0, -0.05, 8.6); cam.lookAt(0, -0.1, 0);
      const g = new THREE.Group(); scene.add(g);
      const S = 2.05; const body = new THREE.Group(); body.scale.set(S, S, S); body.position.y = -2.0; g.add(body);
      const uni = { uGlow: { value: 0.5 }, uScan: { value: 0 }, uMus: { value: 0 }, uBody: { value: 1 }, uCol: { value: new THREE.Color(0x5ee7df) }, uMusCol: { value: new THREE.Color(0xffc46b) } };
      const shell = new THREE.Mesh(bodyGeometry(), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: uni, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      body.add(shell);
      const picks: Record<string, THREE.Object3D[]> = { body: [shell], brain: [], heart: [], lungs: [], muscles: [] };
      const organMats: { r: Region; m: THREE.MeshBasicMaterial; kind: 'fill' | 'wire' }[] = [];
      const organ = (geo: THREE.BufferGeometry, r: Region, p: [number, number, number], s?: [number, number, number], show = true) => {
        const c = new THREE.Color(colOf(r));
        const fill = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
        const wire = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.6, wireframe: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const a = new THREE.Mesh(geo, fill), b = new THREE.Mesh(geo, wire);
        [a, b].forEach((m) => { m.position.set(p[0], p[1], p[2]); if (s) m.scale.set(s[0], s[1], s[2]); m.visible = show; body.add(m); });
        if (show) organMats.push({ r, m: fill, kind: 'fill' }, { r, m: wire, kind: 'wire' }); picks[r].push(a);
      };
      const sph = (r: number) => new THREE.SphereGeometry(r, 12, 9);
      organ(sph(0.075), 'brain', [0, 1.69, 0.0], [1, 0.85, 1.1]);
      organ(sph(0.06), 'lungs', [-0.075, 1.3, 0.0], [0.8, 1.55, 0.8]); organ(sph(0.06), 'lungs', [0.075, 1.3, 0.0], [0.8, 1.55, 0.8]);
      organ(sph(0.045), 'heart', [0.035, 1.27, 0.03], [1, 1.1, 0.9]);
      // invisible touch zones for the arms and thighs
      const cp = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 3, 6);
      [-1, 1].forEach((sx) => { const a = new THREE.Mesh(cp(0.06, 0.3), new THREE.MeshBasicMaterial()); a.rotation.z = Math.PI / 2; a.position.set(sx * 0.36, 1.46, 0); a.visible = false; body.add(a); picks.muscles.push(a);
        const t = new THREE.Mesh(cp(0.1, 0.34), new THREE.MeshBasicMaterial()); t.position.set(sx * 0.1, 0.72, 0); t.visible = false; body.add(t); picks.muscles.push(t); });
      // floor rings, orbit rings and a scan ring
      const ring = (r0: number, r1: number, c: number, o: number) => new THREE.Mesh(new THREE.RingGeometry(r0, r1, 72), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      const fl: THREE.Mesh[] = [ring(1.55, 1.59, 0x5ee7df, 0.8), ring(1.2, 1.23, 0x7c9cff, 0.7), ring(0.85, 0.88, 0xb794ff, 0.8), ring(0.4, 0.43, 0x5ee7df, 0.8)];
      fl.forEach((m) => { m.rotation.x = -Math.PI / 2; m.position.y = -2.08; scene.add(m); });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.55, 48), new THREE.MeshBasicMaterial({ color: 0x3aa6ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); disc.rotation.x = -Math.PI / 2; disc.position.y = -2.08; scene.add(disc);
      const orb1 = ring(1.95, 1.965, 0x5ee7df, 0.22); orb1.rotation.set(1.2, 0.3, 0); scene.add(orb1);
      const orb2 = ring(1.75, 1.765, 0xb794ff, 0.2); orb2.rotation.set(1.5, -0.5, 0.6); scene.add(orb2);
      const ray = new THREE.Raycaster(); let ry = 0.4; let vel = 0; let t = 0; let last = Date.now();
      api.current = {
        spin: (dx: number) => { ry += dx * 0.012; vel = dx * 0.012; },
        pick: (x: number, y: number) => {
          ray.setFromCamera(new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), cam); scene.updateMatrixWorld(true);
          for (const r of ['heart', 'brain', 'lungs', 'muscles', 'body'] as Region[]) { if (ray.intersectObjects(picks[r], false).length) return r; }
          return null;
        },
      };
      const loop = () => {
        if (dead.current) return;
        const now = Date.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        const s = st.current;
        if (!s.reduce) { ry += 0.3 * dt + vel; vel *= 0.92; uni.uScan.value = 1.85 - ((t * 0.45) % 1) * 1.9; } else uni.uScan.value = -5;
        g.rotation.y = ry; fl[1].rotation.z = t * 0.3; fl[2].rotation.z = -t * 0.5; orb1.rotation.z = t * 0.25; orb2.rotation.z = -t * 0.2;
        const pulse = s.reduce ? 1 : 0.5 + 0.5 * Math.sin(t * 4);
        uni.uGlow.value = s.glow; uni.uMus.value = s.sel === 'muscles' ? 0.6 + 0.4 * pulse : 0; uni.uBody.value = s.sel === 'body' ? 1 : 0.6;
        for (const { r, m, kind } of organMats) { const on = s.sel === r; m.opacity = kind === 'fill' ? 0.22 + (on ? 0.3 + 0.25 * pulse : 0) : (on ? 0.7 + 0.3 * pulse : 0.5); }
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
