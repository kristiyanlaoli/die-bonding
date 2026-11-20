'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { CameraPreset, Parameters, Results, Stage, ViewMode, STAGES, clamp, lerp, smooth } from '@/lib/simulation';
import { getSceneLayout } from '@/lib/sceneLayout';

type SceneProps = {
  params: Parameters;
  results: Results;
  stage: Stage;
  progress: number;
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  showLabels: boolean;
  sceneLabels?: { leftAssembly: string; leftCross: string; rightAssembly: string; rightCross: string };
};

const COPPER = '#bc8054';
const EPOXY = '#f3a445';
const SILICON = '#26384d';
const PAD_HEIGHT = 0.33;
const DIE_THICK = 0.37;

function EpoxyMaterial({ cured = false, transparent = false }: { cured?: boolean; transparent?: boolean }) {
  return <meshPhysicalMaterial color={cured ? '#c88445' : EPOXY} roughness={cured ? 0.4 : 0.19} metalness={0.06} transparent opacity={transparent ? 0.47 : 0.89} clearcoat={cured ? .2 : .9} clearcoatRoughness={0.12} />;
}

function SiliconDie({ width, depth, fade = false }: { width: number; depth: number; fade?: boolean }) {
  const pads = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < 7; i++) {
      const x = -width * 0.41 + i * (width * .82 / 6);
      pos.push([x, DIE_THICK / 2 + 0.008, -depth * .40]);
      pos.push([x, DIE_THICK / 2 + 0.008, depth * .40]);
    }
    for (let i = 1; i < 6; i++) {
      const z = -depth * .40 + i * (depth * .8 / 6);
      pos.push([-width * .41, DIE_THICK / 2 + .008, z]);
      pos.push([width * .41, DIE_THICK / 2 + .008, z]);
    }
    return pos;
  }, [width, depth]);
  return <group>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width, DIE_THICK, depth]} />
      <meshPhysicalMaterial color={SILICON} metalness={.46} roughness={.24} transparent={fade} opacity={fade ? .24 : 1} />
    </mesh>
    <mesh position={[0, DIE_THICK / 2 + .007, 0]}>
      <boxGeometry args={[width * .78, .011, depth * .76]} />
      <meshStandardMaterial color="#315776" metalness={.75} roughness={.30} transparent={fade} opacity={fade ? .19 : 1} />
    </mesh>
    {pads.map((pos, i) => <mesh key={i} position={pos}>
      <boxGeometry args={[Math.max(.045, width * .048), .019, Math.max(.045, depth * .048)]} />
      <meshStandardMaterial color="#f0c781" metalness={.85} roughness={.20} transparent={fade} opacity={fade ? .4 : 1} />
    </mesh>)}
    <mesh position={[0, -DIE_THICK / 2 - .003, 0]}>
      <boxGeometry args={[width * .98, .009, depth * .98]} />
      <meshStandardMaterial color="#b3c4d4" metalness={.7} roughness={.36} transparent={fade} opacity={fade ? .25 : 1} />
    </mesh>
  </group>;
}

function TapeStage({ params, picked, eject }: { params: Parameters; picked: boolean; eject: number }) {
  const dieW = params.dieWidth;
  const dieH = params.dieHeight;
  const layout = getSceneLayout(params);
  const gridStepX = Math.min(dieW + .42, layout.tapeRadius * .62);
  const gridStepZ = Math.min(dieH + .42, layout.tapeRadius * .62);
  const dieY = .12;
  const lift = smooth(eject);
  const pinLift = lift * .22;
  const armLift = lift * .14;
  const pinOffsets = [
    [-dieW * .18, -dieH * .18],
    [dieW * .18, -dieH * .18],
    [-dieW * .18, dieH * .18],
    [dieW * .18, dieH * .18],
  ];

  return <group position={[layout.waferX, 0, 0]}>
    <mesh position={[0, -.44, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[layout.tapeRadius, layout.tapeRadius, .28, 64]} />
      <meshStandardMaterial color="#27374a" metalness={.75} roughness={.39} />
    </mesh>
    <mesh position={[0, -.20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[layout.tapeRadius - .09, 64]} />
      <meshPhysicalMaterial color="#3c8a95" transparent opacity={.22} side={2} roughness={.26} />
    </mesh>
    <mesh position={[0, -.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[layout.tapeRadius + .14, .18, 10, 60]} />
      <meshStandardMaterial color="#a4b4c4" metalness={.83} roughness={.26} />
    </mesh>

    {[-1, 0, 1].flatMap(ix => [-1, 0, 1].map(iz => {
      if (ix === 0 && iz === 0) return null;
      return <group key={`${ix}-${iz}`} position={[ix * gridStepX, dieY, iz * gridStepZ]}>
        <SiliconDie width={dieW} depth={dieH} fade />
      </group>;
    }))}

    <group position={[0, -.005, 0]}>
      {[-1, 1].flatMap(ix => [-1, 1].map(iz => <group key={`pick-${ix}-${iz}`} position={[ix * (dieW / 2 + .10), 0, iz * (dieH / 2 + .10)]}>
        <mesh><boxGeometry args={[.18, .012, .03]} /><meshBasicMaterial color="#79f0f4" /></mesh>
        <mesh><boxGeometry args={[.03, .012, .18]} /><meshBasicMaterial color="#79f0f4" /></mesh>
      </group>))}
    </group>

    <group position={[0, -.62 + armLift, 0]}>
      <mesh position={[-dieW * .32 - .95, 0, 0]} castShadow>
        <boxGeometry args={[1.75, .16, .42]} />
        <meshStandardMaterial color="#667989" metalness={.78} roughness={.28} />
      </mesh>
      <mesh position={[-dieW * .23 - .2, .12, 0]} castShadow>
        <boxGeometry args={[dieW * .56 + 1.2, .08, .22]} />
        <meshStandardMaterial color="#a7bac7" metalness={.82} roughness={.24} />
      </mesh>
      <mesh position={[0, .20 + pinLift * .4, 0]} castShadow>
        <boxGeometry args={[Math.max(.72, dieW * .54), .08, Math.max(.72, dieH * .54)]} />
        <meshStandardMaterial color="#c8d6df" metalness={.85} roughness={.21} />
      </mesh>
      {pinOffsets.map(([x, z], i) => <mesh key={i} position={[x, .39 + pinLift, z]} castShadow>
        <cylinderGeometry args={[.065, .065, .5 + pinLift * .9, 16]} />
        <meshStandardMaterial color="#dfe8ef" metalness={.88} roughness={.2} />
      </mesh>)}
      <mesh position={[-dieW * .85 - 1.1, -.08, 0]}>
        <cylinderGeometry args={[Math.max(.34, dieW * .08), Math.max(.34, dieW * .08), .4, 20]} />
        <meshStandardMaterial color="#334658" metalness={.62} roughness={.33} />
      </mesh>
    </group>

    <mesh position={[0, -.76, 0]}>
      <cylinderGeometry args={[layout.baseRadius - .12, layout.baseRadius, .34, 32]} />
      <meshStandardMaterial color="#101d2b" metalness={.42} roughness={.45} />
    </mesh>
  </group>;
}

function Substrate({ p }: { p: Parameters }) {
  const lead = p.substrate === 'leadframe';
  const layout = getSceneLayout(p);
  return <group position={[layout.substrateX, 0, 0]}>
    <mesh position={[0, -.065, 0]} castShadow receiveShadow>
      <boxGeometry args={[layout.substrateWidth, .62, layout.substrateDepth]} />
      <meshStandardMaterial color={lead ? '#45566a' : '#235b55'} metalness={lead ? .72 : .17} roughness={.38} />
    </mesh>
    {lead ? <>
      <mesh position={[0, .279, 0]} receiveShadow>
        <boxGeometry args={[p.dieWidth + 1, .11, p.dieHeight + 1]} />
        <meshStandardMaterial color="#bd895a" metalness={.89} roughness={.22} />
      </mesh>
      {[-1, 1].flatMap(side => [-2, -1, 0, 1, 2].map(j => <mesh key={`lead-${side}-${j}`} position={[side * (p.dieWidth / 2 + 1.22), .255, j * .61]}>
        <boxGeometry args={[.65, .08, .33]} />
        <meshStandardMaterial color="#d1a178" metalness={.84} roughness={.24} />
      </mesh>))}
    </> : <>
      <mesh position={[0, .278, 0]}>
        <boxGeometry args={[p.dieWidth + 1, .11, p.dieHeight + 1]} />
        <meshStandardMaterial color="#a87d53" metalness={.72} roughness={.29} />
      </mesh>
      {Array.from({ length: 10 }, (_, k) => <mesh key={k} position={[-layout.substrateWidth * .44 + k * layout.substrateWidth * .088, .255, -layout.substrateDepth * .43]}>
        <boxGeometry args={[.23, .02, .8]} />
        <meshStandardMaterial color="#d0a260" metalness={.81} roughness={.27} />
      </mesh>)}
    </>}
    {[-1, 1].flatMap(ix => [-1, 1].map(iz => <group key={`fid-${ix}-${iz}`} position={[ix * (p.dieWidth / 2 + .28), .342, iz * (p.dieHeight / 2 + .28)]}>
      <mesh><boxGeometry args={[.17, .012, .025]} /><meshBasicMaterial color="#7cedee" /></mesh>
      <mesh><boxGeometry args={[.025, .012, .17]} /><meshBasicMaterial color="#7cedee" /></mesh>
    </group>))}
    <mesh position={[0, -.41, 0]} receiveShadow>
      <boxGeometry args={[layout.substrateWidth + .8, .09, layout.substrateDepth + .7]} />
      <meshStandardMaterial color="#142336" metalness={.4} roughness={.57} />
    </mesh>
  </group>;
}

function DispensedPaste({ p, progress }: { p: Parameters; progress: number }) {
  const pts = useMemo(() => {
    if (p.pattern === 'single') return [[0, 0]];
    if (p.pattern === 'five') return [[0, 0], [-.28, -.28], [.28, -.28], [-.28, .28], [.28, .28]];
    return Array.from({ length: 26 }, (_, i) => {
      const t = i < 13 ? i / 12 : (i - 13) / 12;
      const s = (t - .5) * 1.45;
      return [s, i < 13 ? s : -s];
    });
  }, [p.pattern]);
  const amount = Math.min(pts.length, Math.ceil(progress * pts.length));
  const radius = p.pattern === 'x' ? .17 : p.pattern === 'single' ? .65 : .40;
  const scale = clamp(Math.sqrt(p.volume / 460), .65, 1.45);
  return <group position={[getSceneLayout(p).substrateX, PAD_HEIGHT + .085, 0]}>
    {pts.slice(0, amount).map((pt, i) => <mesh key={i} position={[pt[0] * p.dieWidth * .68, .03, pt[1] * p.dieHeight * .68]} scale={[scale, .3 + p.volume / 1350, scale]} castShadow>
      <sphereGeometry args={[radius, 16, 10]} />
      <EpoxyMaterial />
    </mesh>)}
  </group>;
}

function SpreadPaste({ p, r, fraction, cured, transparent }: { p: Parameters; r: Results; fraction: number; cured: boolean; transparent: boolean }) {
  const amount = smooth(fraction);
  const root = Math.sqrt(r.coverage / 100);
  const width = lerp(p.dieWidth * .3, p.dieWidth * root, amount);
  const depth = lerp(p.dieHeight * .30, p.dieHeight * root, amount);
  const film = lerp(.44, clamp(r.blt * .0075, .105, .58), amount);
  const y = PAD_HEIGHT + film / 2;
  const fillet = clamp(r.fillet / 1000, 0, .60) * amount;
  return <group position={[getSceneLayout(p).substrateX + p.offsetX / 1000, 0, p.offsetY / 1000]}>
    <mesh castShadow receiveShadow position={[0, y, 0]}>
      <boxGeometry args={[width, film, depth]} />
      <EpoxyMaterial cured={cured} transparent={transparent} />
    </mesh>
    {fillet > .045 && <group position={[0, PAD_HEIGHT + film * .30, 0]}>
      {[-1, 1].map(side => <mesh key={`x${side}`} position={[side * (width / 2 + fillet / 4), 0, 0]}>
        <boxGeometry args={[fillet / 2, film * .57, depth + fillet]} />
        <EpoxyMaterial cured={cured} transparent={transparent} />
      </mesh>)}
      {[-1, 1].map(side => <mesh key={`z${side}`} position={[0, 0, side * (depth / 2 + fillet / 4)]}>
        <boxGeometry args={[width + fillet, film * .57, fillet / 2]} />
        <EpoxyMaterial cured={cured} transparent={transparent} />
      </mesh>)}
    </group>}
    {r.voids > 4 && amount > .35 && Array.from({ length: Math.min(9, Math.floor(r.voids / 2)) }, (_, i) => {
      const x = Math.sin(i * 8.7 + 1) * width * .35;
      const z = Math.cos(i * 7.3 + 2) * depth * .33;
      return <mesh key={i} position={[x, PAD_HEIGHT + film * .47, z]}>
        <sphereGeometry args={[.04 + r.voids / 420, 10, 8]} />
        <meshBasicMaterial color="#152333" />
      </mesh>;
    })}
  </group>;
}

function Nozzle({ p, progress }: { p: Parameters; progress: number }) {
  const down = smooth(progress / .18);
  const up = smooth((progress - .84) / .16);
  const y = lerp(4.7, 1.05 + p.nozzleHeight, down) + up * 2.9;
  const t = clamp((progress - .18) / .66, 0, 1);
  let dx = 0; let dz = 0;
  if (p.pattern === 'five') {
    const pts = [[0, 0], [-.28, -.28], [.28, -.28], [-.28, .28], [.28, .28]];
    const id = Math.min(pts.length - 1, Math.floor(t * pts.length));
    dx = pts[id][0] * p.dieWidth * .68;
    dz = pts[id][1] * p.dieHeight * .68;
  } else if (p.pattern === 'x') {
    const diagonal = t < .5 ? (t * 2 - .5) : ((t - .5) * 2 - .5);
    dx = diagonal * p.dieWidth * .98;
    dz = (t < .5 ? diagonal : -diagonal) * p.dieHeight * .98;
  }
  return <group position={[getSceneLayout(p).substrateX + dx, y, dz]}>
    <mesh position={[0, .85, 0]} castShadow>
      <cylinderGeometry args={[.27, .32, 1.6, 24]} />
      <meshStandardMaterial color="#a2b6c7" metalness={.85} roughness={.20} />
    </mesh>
    <mesh position={[0, -.15, 0]} rotation={[Math.PI, 0, 0]} castShadow>
      <coneGeometry args={[.26, .79, 20]} />
      <meshStandardMaterial color="#dde6e8" metalness={.8} roughness={.22} />
    </mesh>
    <mesh position={[0, -0.57, 0]}>
      <cylinderGeometry args={[.048, .065, .22, 16]} />
      <meshStandardMaterial color={EPOXY} metalness={.12} roughness={.16} />
    </mesh>
    <mesh position={[0, 1.72, 0]}>
      <cylinderGeometry args={[.43, .43, .25, 24]} />
      <meshStandardMaterial color="#304e6b" metalness={.66} roughness={.26} />
    </mesh>
  </group>;
}

function Collet({ x, y, z }: { x: number; y: number; z: number }) {
  return <group position={[x, y + .58, z]}>
    <mesh castShadow position={[0, .4, 0]}>
      <cylinderGeometry args={[.48, .62, .76, 24]} />
      <meshStandardMaterial color="#9cb5cb" metalness={.82} roughness={.26} />
    </mesh>
    <mesh castShadow position={[0, .92, 0]}>
      <cylinderGeometry args={[.26, .26, .42, 24]} />
      <meshStandardMaterial color="#d3e4ed" metalness={.76} roughness={.20} />
    </mesh>
    <mesh position={[0, -.06, 0]}>
      <cylinderGeometry args={[.53, .31, .27, 24]} />
      <meshStandardMaterial color="#536d80" metalness={.75} roughness={.27} />
    </mesh>
    <mesh position={[0, -.21, 0]}>
      <cylinderGeometry args={[.26, .26, .025, 24]} />
      <meshStandardMaterial color="#293442" metalness={.28} roughness={.59} />
    </mesh>
    <mesh position={[0, .8, 0]}>
      <boxGeometry args={[.57, .08, .57]} />
      <meshStandardMaterial color="#00d7e7" emissive="#057a93" emissiveIntensity={.48} />
    </mesh>
  </group>;
}

function AlignmentOverlay({ p, progress }: { p: Parameters; progress: number }) {
  const glow = .3 + Math.sin(progress * 10) * .20;
  return <group position={[getSceneLayout(p).substrateX, 1.05, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[Math.max(p.dieWidth, p.dieHeight) * .62, Math.max(p.dieWidth, p.dieHeight) * .63, 64]} />
      <meshBasicMaterial color="#64f3f5" side={2} transparent opacity={.75 + glow * .2} />
    </mesh>
    <mesh><boxGeometry args={[p.dieWidth + .8, .009, .018]} /><meshBasicMaterial color="#4cf1f0" transparent opacity={.62} /></mesh>
    <mesh><boxGeometry args={[.018, .009, p.dieHeight + .8]} /><meshBasicMaterial color="#4cf1f0" transparent opacity={.62} /></mesh>
    {[-1, 1].flatMap(x => [-1, 1].map(z => <mesh key={`${x}-${z}`} position={[x * p.dieWidth * .51, 0, z * p.dieHeight * .51]}>
      <sphereGeometry args={[.075, 10, 8]} />
      <meshBasicMaterial color="#64f3f5" />
    </mesh>))}
  </group>;
}

function CureChamber({ progress, p }: { progress: number; p: Parameters }) {
  const glow = smooth(progress);
  return <group position={[getSceneLayout(p).substrateX, 1.5, 0]}>
    <mesh position={[0, .40, 0]}>
      <boxGeometry args={[getSceneLayout(p).substrateWidth + .7, 3.75, getSceneLayout(p).substrateDepth + .8]} />
      <meshPhysicalMaterial color={p.cureMethod === 'thermal' ? '#ed9747' : '#6fc5ff'} transparent opacity={.055 + glow * .040} roughness={.1} side={2} depthWrite={false} />
    </mesh>
    {[-1, 1].map(s => <mesh key={s} position={[s * (getSceneLayout(p).substrateWidth / 2 - .2), 2.2, 0]}>
      <boxGeometry args={[.06, .09, getSceneLayout(p).substrateDepth - .3]} />
      <meshBasicMaterial color={p.cureMethod === 'thermal' ? '#f9a35d' : '#a3a6ff'} transparent opacity={.55 + glow * .4} />
    </mesh>)}
    <pointLight intensity={1.1 * glow} color={p.cureMethod === 'thermal' ? '#ff8b3c' : '#779aff'} position={[0, 1.7, 0]} distance={10} />
  </group>;
}

function Ground() {
  return <group>
    <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#0b1522" roughness={.89} metalness={.07} />
    </mesh>
    {Array.from({ length: 33 }, (_, i) => <group key={i}>
      <mesh position={[-16 + i, -.994, 0]}>
        <boxGeometry args={[.012, .002, 21]} />
        <meshBasicMaterial color="#233c50" transparent opacity={.25} />
      </mesh>
      <mesh position={[0, -.993, -10 + i * .625]}>
        <boxGeometry args={[33, .002, .012]} />
        <meshBasicMaterial color="#233c50" transparent opacity={.23} />
      </mesh>
    </group>)}
  </group>;
}

function getDiePose(stage: Stage, progress: number, p: Parameters, r: Results) {
  const layout = getSceneLayout(p);
  const px = layout.substrateX + p.offsetX / 1000;
  const pz = p.offsetY / 1000;
  const film = clamp(r.blt * .0075, .105, .58);
  const bondedY = PAD_HEIGHT + film + DIE_THICK / 2;
  const ix = STAGES.findIndex(s => s.id === stage);
  if (ix === 0) return { x: layout.waferX, y: .12, z: 0 };
  if (ix === 1) return { x: layout.waferX, y: .12 + smooth((progress - .22) / .7) * 2.85, z: 0 };
  if (ix === 2) return { x: lerp(layout.waferX, px, smooth(progress)), y: 2.97, z: lerp(0, pz, smooth(progress)) };
  if (ix === 3) return { x: px, y: lerp(2.97, bondedY, smooth(progress / .87)), z: pz };
  return { x: px, y: bondedY, z: pz };
}

function getColletPose(stage: Stage, progress: number, p: Parameters, r: Results) {
  const layout = getSceneLayout(p);
  const diePose = getDiePose(stage, progress, p, r);
  const ix = STAGES.findIndex(s => s.id === stage);
  if (ix === 1 && progress < .30) {
    return {
      x: layout.waferX,
      y: lerp(3.2, .22, smooth(progress / .30)),
      z: 0,
    };
  }
  return diePose;
}

function Assembly({ p, r, stage, progress, viewMode }: { p: Parameters; r: Results; stage: Stage; progress: number; viewMode: ViewMode }) {
  const stageIndex = STAGES.findIndex(s => s.id === stage);
  const pose = getDiePose(stage, progress, p, r);
  const colletPose = getColletPose(stage, progress, p, r);
  const picked = stageIndex > 1 || (stageIndex === 1 && progress > .30);
  const deposited = stageIndex > 0 ? 1 : smooth((progress - .19) / .64);
  const spread = stageIndex < 3 ? 0 : stageIndex === 3 ? smooth((progress - .45) / .5) : 1;
  const pasteCured = stageIndex > 4 || stageIndex === 4 && progress > .75;
  const dieTilt = spread > .7 ? r.tilt * Math.PI / 180 * 7 : 0;
  const showCollet = stageIndex === 1 || stageIndex === 2 || (stageIndex === 3 && progress < .92);
  const eject = stage === 'pickup' ? smooth(progress / .35) : 0;

  return <group>
    <Ground />
    <Substrate p={p} />
    <TapeStage params={p} picked={picked} eject={eject} />
    {stage === 'dispense' && <Nozzle p={p} progress={progress} />}
    {deposited > 0 && spread < .002 && <DispensedPaste p={p} progress={deposited} />}
    {spread > .002 && <SpreadPaste p={p} r={r} fraction={spread} cured={pasteCured} transparent={viewMode === 'transparent'} />}
    <group position={[pose.x, pose.y, pose.z]} rotation={[0, 0, dieTilt]}>
      <SiliconDie width={p.dieWidth} depth={p.dieHeight} fade={viewMode === 'transparent' && spread > .7} />
    </group>
    {showCollet && <Collet x={colletPose.x} y={colletPose.y} z={colletPose.z} />}
    {stage === 'align' && <AlignmentOverlay p={p} progress={progress} />}
    {stage === 'cure' && <CureChamber p={p} progress={progress} />}
    {stageIndex >= 3 && <group position={[getSceneLayout(p).substrateX, PAD_HEIGHT + .02, 0]}>
      <mesh position={[-p.dieWidth / 2 - .35, .005, 0]}><boxGeometry args={[.035, .016, p.dieHeight + .4]} /><meshBasicMaterial color="#59d8e7" transparent opacity={.68} /></mesh>
      <mesh position={[p.dieWidth / 2 + .35, .005, 0]}><boxGeometry args={[.035, .016, p.dieHeight + .4]} /><meshBasicMaterial color="#59d8e7" transparent opacity={.68} /></mesh>
    </group>}
  </group>;
}

function CrossSection({ p, r }: { p: Parameters; r: Results }) {
  const w = Math.max(3, p.dieWidth * 1.4);
  const epH = clamp(r.blt * .011, .15, .85);
  const scale = Math.sqrt(r.coverage / 100);
  const fillet = clamp(r.fillet / 1000, .07, 1.1);
  return <group>
    <Ground />
    <mesh castShadow receiveShadow position={[0, -.31, 0]}>
      <boxGeometry args={[w + 3, .7, 1.75]} />
      <meshStandardMaterial color={p.substrate === 'leadframe' ? COPPER : '#257567'} roughness={.32} metalness={.62} />
    </mesh>
    <mesh position={[0, epH / 2 + .04, 0]}>
      <boxGeometry args={[w * scale, epH, 1.73]} />
      <EpoxyMaterial cured />
    </mesh>
    {r.voids > 4 && Array.from({ length: Math.min(8, Math.ceil(r.voids / 2)) }, (_, i) => <mesh key={i} position={[Math.sin(i * 4) * w * .31, .03 + epH * .52, .89]}>
      <sphereGeometry args={[.05 + r.voids / 220, 12, 8]} />
      <meshBasicMaterial color="#1a2935" />
    </mesh>)}
    {[-1, 1].map(s => <mesh key={s} position={[s * (w * scale / 2 + fillet / 4), epH * .36 + .04, 0]}>
      <boxGeometry args={[fillet / 2, epH * .72, 1.73]} />
      <EpoxyMaterial cured />
    </mesh>)}
    <group position={[p.offsetX / 1000, epH + .04 + DIE_THICK / 2, 0]} rotation={[0, 0, r.tilt * Math.PI / 180 * 7]}>
      <SiliconDie width={w} depth={1.72} />
    </group>
    <mesh position={[-w * .62, epH / 2 + .04, .94]}>
      <boxGeometry args={[.025, epH, .02]} />
      <meshBasicMaterial color="#68e3f2" />
    </mesh>
    <mesh position={[-w * .62, epH + .04, .94]}>
      <boxGeometry args={[.31, .025, .03]} />
      <meshBasicMaterial color="#68e3f2" />
    </mesh>
    <mesh position={[-w * .62, .04, .94]}>
      <boxGeometry args={[.31, .025, .03]} />
      <meshBasicMaterial color="#68e3f2" />
    </mesh>
  </group>;
}

/** Refit the camera whenever the die changes size or the viewport is resized. */
function FitCamera({ p, mode, preset }: { p: Parameters; mode: ViewMode; preset: CameraPreset }) {
  const { camera, size } = useThree();
  const layout = getSceneLayout(p);
  const cross = mode === 'cross';
  const target: [number, number, number] = cross ? [0, .10, 0] : [layout.centerX, .10, 0];
  const fov = cross ? 38 : 43;
  const aspect = Math.max(.55, size.width / Math.max(1, size.height));
  const halfWidth = cross ? (Math.max(3, p.dieWidth * 1.4) + 3) / 2 : layout.fullWidth / 2;
  const halfDepth = cross ? 2 : layout.fullDepth / 2;
  const verticalTan = Math.tan(fov * Math.PI / 360);
  // Keep both objects visible even when a wide die increases tape diameter.
  const distance = cross
    ? Math.max(10, halfWidth / (verticalTan * aspect) * 1.24)
    : Math.max(20, halfWidth / (verticalTan * aspect) * 1.23, halfDepth / verticalTan * .85);

  useEffect(() => {
    const orbit: Record<CameraPreset, [number, number, number]> = {
      iso: [.37, .39, .83], top: [0, 1, .001],
      front: [0, .13, 1], side: [1, .16, 0],
    };
    const direction = cross ? [0, .19, 1] : orbit[preset];
    const length = Math.hypot(...direction);
    const scale = distance / length;
    camera.position.set(target[0] + direction[0] * scale, target[1] + direction[1] * scale, target[2] + direction[2] * scale);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, target[0], target[1], target[2], distance, cross, preset]);
  return null;
}

export default function SimulationScene({ params, results, stage, progress, viewMode, cameraPreset, showLabels, sceneLabels }: SceneProps) {
  const cross = viewMode === 'cross';
  const layout = getSceneLayout(params);
  const target: [number, number, number] = cross ? [0, .1, 0] : [layout.centerX, .1, 0];
  const maxOrbit = Math.max(48, layout.fullWidth * 2.6);
  return <div className="scene-root">
    <Canvas key={`${viewMode}-${cameraPreset}`} shadows dpr={[1, 1.75]} camera={{ position: [0, 15, 28], fov: cross ? 38 : 43, near: .08, far: 400 }} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={['#0c1725']} />
      <fog attach="fog" args={['#0c1725', 50, 120]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#b8efff', '#0a1421', 2.25]} />
      <directionalLight position={[5, 14, 9]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={35} shadow-camera-bottom={-35} />
      <directionalLight position={[-9, 7, -6]} color="#4da6cb" intensity={.9} />
      {cross ? <CrossSection p={params} r={results} /> : <Assembly p={params} r={results} stage={stage} progress={progress} viewMode={viewMode} />}
      <OrbitControls makeDefault target={target} minDistance={cross ? 6 : 7} maxDistance={maxOrbit} maxPolarAngle={Math.PI * .91} enableDamping dampingFactor={.08} />
      <FitCamera p={params} mode={viewMode} preset={cameraPreset} />
    </Canvas>
    {showLabels && <>
      <div className="scene-label scene-label-left"><span className="tiny-dot" /> {cross ? (sceneLabels?.leftCross ?? 'SECTION VIEW · ADHESIVE GAP EXAGGERATED') : (sceneLabels?.leftAssembly ?? 'ASSEMBLY · PROCEDURAL 3D')}</div>
      <div className="scene-label scene-label-right">{cross ? (sceneLabels?.rightCross ?? 'BLT / FILLET INSPECTION') : (sceneLabels?.rightAssembly ?? 'DRAG TO ORBIT · SCROLL TO ZOOM')}</div>
    </>}
  </div>;
}
