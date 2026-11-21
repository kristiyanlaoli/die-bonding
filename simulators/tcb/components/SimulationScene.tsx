'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect } from 'react';
import { CameraPreset, Parameters, Results, Stage, ViewMode, clamp, lerp, smooth, bondFormation } from '@/simulators/tcb/lib/simulation';
import { getSceneLayout } from '@/simulators/tcb/lib/sceneLayout';

type SceneProps = {
  params: Parameters; results: Results; stage: Stage; progress: number;
  viewMode: ViewMode; cameraPreset: CameraPreset; showLabels: boolean;
  sceneLabels?: { leftAssembly: string; leftCross: string; rightAssembly: string; rightCross: string };
};
const PAD=.34, TAPE=.02;
const dieThickness=(p:Parameters)=>.25+p.waferThickness*.0012;
const pitchVisual=(p:Parameters)=>Math.min(p.dieWidth,p.dieHeight)*.19;
const bumpRadius=(p:Parameters)=>pitchVisual(p)*Math.min(.96,p.bumpDiameter/p.pitch)*.5;
const rawGap=(p:Parameters)=>Math.max(.19,bumpRadius(p)*2);
const finalGap=(p:Parameters,r:Results)=>rawGap(p)*r.standoff/p.bumpDiameter;
const bumps=(p:Parameters)=>Array.from({length:25},(_,i)=>[(i%5-2)*pitchVisual(p),(Math.floor(i/5)-2)*pitchVisual(p)] as const);
const dx=(p:Parameters,n:number)=>n/p.pitch*pitchVisual(p);

function Die({p,faceUp=false,gap,joined=0,fade=false,r}:{p:Parameters;faceUp?:boolean;gap:number;joined?:number;fade?:boolean;r?:Results}){
  const h=dieThickness(p),rad=bumpRadius(p),sign=faceUp?1:-1;
  return <group>
    <mesh castShadow receiveShadow><boxGeometry args={[p.dieWidth,h,p.dieHeight]}/><meshPhysicalMaterial color="#375d80" metalness={.44} roughness={.29} transparent={fade} opacity={fade ? .28 : 1} depthWrite={!fade}/></mesh>
    <mesh position={[0,sign*(h/2+.009),0]}><boxGeometry args={[p.dieWidth*.95,.018,p.dieHeight*.95]}/><meshStandardMaterial color="#7097b9" metalness={.36} transparent={fade} opacity={fade ? .3 : 1} depthWrite={!fade}/></mesh>
    {bumps(p).map(([x,z],i)=>{
      const missing=!!r&&r.opens>2&&i<Math.max(1,Math.round(r.opens*.25))&&joined>.5;
      return <group key={i} position={[x,sign*h/2,z]}>
        <mesh position={[0,sign*.012,0]}><cylinderGeometry args={[rad*1.08,rad*1.08,.034,14]}/><meshStandardMaterial color="#d0a363" metalness={.7}/></mesh>
        <mesh position={[0,sign*gap*.5,0]} scale={[rad*(1+joined*.08),gap*(missing ? .40 : 1)*.5,rad*(1+joined*.08)]}>
          <sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={missing?'#a77768':joined>.85?'#c9d9e5':'#a6b5c2'} metalness={.79} roughness={.22}/>
        </mesh>
      </group>;
    })}
    {r&&r.bridge>2&&joined>.5&&[-1,0,1].slice(0,Math.min(3,Math.ceil(r.bridge/12))).map((z,i)=><mesh key={i} position={[pitchVisual(p)*.5,sign*(h/2+gap*.5),z*pitchVisual(p)]}><boxGeometry args={[pitchVisual(p)*1.26,gap*.42,rad*1.2]}/><meshStandardMaterial color="#d0dce4" metalness={.78}/></mesh>)}
  </group>;
}
function Wafer({p,eject=0,center=true}:{p:Parameters;eject?:number;center?:boolean}){
  const l=getSceneLayout(p),y=TAPE+dieThickness(p)/2;
  return <group position={[l.waferX,0,0]}>
    <mesh position={[0,TAPE-.03,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[l.tapeRadius,72]}/><meshPhysicalMaterial color="#3b8994" transparent opacity={.45} side={2} depthWrite={false}/></mesh>
    <mesh position={[0,-.05,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[l.tapeRadius+.14,.19,12,72]}/><meshStandardMaterial color="#b7c3ce" metalness={.86} roughness={.26}/></mesh>
    <mesh position={[0,-.84,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[l.tapeRadius-.32,l.baseRadius,72]}/><meshStandardMaterial color="#273a4b" side={2}/></mesh>
    {[-1,0,1].flatMap(ix=>[-1,0,1].map(iz=>!center&&ix===0&&iz===0?null:<group key={`${ix}-${iz}`} position={[ix*(p.dieWidth+.42),y,iz*(p.dieHeight+.42)]}><Die p={p} faceUp gap={rawGap(p)}/></group>))}
    <group position={[0,eject,0]}>
      <mesh position={[0,-.79,0]}><boxGeometry args={[p.dieWidth*.6,.14,p.dieHeight*.6]}/><meshStandardMaterial color="#94a9b6" metalness={.8}/></mesh>
      <mesh position={[-p.dieWidth*.42,-.80,0]}><boxGeometry args={[p.dieWidth*.83,.16,.34]}/><meshStandardMaterial color="#7f95a6" metalness={.7}/></mesh>
      {[-1,1].flatMap(ix=>[-1,1].map(iz=><mesh key={`${ix}-${iz}`} position={[ix*p.dieWidth*.2,-.41,iz*p.dieHeight*.2]}><cylinderGeometry args={[.07,.07,.8,16]}/><meshStandardMaterial color="#d1e0e6" metalness={.88}/></mesh>))}
    </group>
  </group>;
}
function NCP({p,r,spread=0,cured=false,fade=false,section=false,dots=9}:{p:Parameters;r?:Results;spread?:number;cured?:boolean;fade?:boolean;section?:boolean;dots?:number}){
  // Pre-applied NCP. The same dispensed deposits remain visible and then spread under compression.
  const fraction=r?.coverage??99;
  const g=r?finalGap(p,r):rawGap(p);
  const w=p.dieWidth*(fraction/100);
  const color=cured?'#5081a2':'#d89b50';
  const dotPatterns:[[number,number],...Array<[number,number]>]=[[0,0],[-.34,-.28],[.34,-.28],[-.34,.28],[.34,.28],[0,-.34],[0,.34],[-.18,0],[.18,0]];
  const radius=Math.min(.62,Math.min(p.dieWidth,p.dieHeight)*.135);
  const grow=smooth(clamp(spread,0,1));
  const dotFade=section?0:clamp(1-grow/.72,0,1);
  const bodyRamp=section?1:clamp((grow-.06)/.94,0,1);
  const fullW=lerp(Math.min(radius*2.1,p.dieWidth*.18),w,grow);
  const fullH=lerp(Math.min(radius*2.1,p.dieHeight*.18),p.dieHeight,grow);
  const bodyOpacity=(fade || section ? .34 : .8)*bodyRamp;

  return <group position={[dx(p,p.offsetX),0,dx(p,p.offsetY)]}>
    {!section && dotPatterns.slice(0,dots).map(([px,pz],i)=>{
      const sxBase=(i===0||i>=7)?1.28:1.08;
      const szBase=(i===0||i>=5)?1.28:1.08;
      const sx=lerp(sxBase,sxBase*1.85,grow);
      const sz=lerp(szBase,szBase*1.85,grow);
      const localY=PAD+lerp(.11,g*.48,grow);
      return <group key={i} position={[px*lerp(p.dieWidth,p.dieWidth*.82,grow),localY,pz*lerp(p.dieHeight,p.dieHeight*.82,grow)]}>
        <mesh position={[0,-.016,0]} scale={[sx,1,sz]}>
          <cylinderGeometry args={[radius*.66,radius*.82,lerp(.035,.022,grow),22]}/>
          <meshPhysicalMaterial color={color} transparent opacity={(fade ? .28 : .54)*dotFade} roughness={.36} metalness={.02} depthWrite={false}/>
        </mesh>
        <mesh scale={[sx,lerp(.56,.18,grow),sz]}>
          <sphereGeometry args={[radius,24,16]}/>
          <meshPhysicalMaterial color={color} transparent opacity={(fade ? .34 : .92)*dotFade} roughness={.18} metalness={.02} depthWrite={false}/>
        </mesh>
      </group>;
    })}

    <mesh position={[0,PAD+g*.46,0]}>
      <boxGeometry args={[fullW,g*.92,section ? 1.15 : fullH]}/>
      <meshPhysicalMaterial color={color} transparent opacity={bodyOpacity} roughness={.28} metalness={.02} depthWrite={false}/>
    </mesh>

    {!section && bodyRamp>.05 && <mesh position={[0,PAD+.028,0]} rotation={[-Math.PI/2,0,0]}>
      <planeGeometry args={[fullW*.99,fullH*.99]}/>
      <meshBasicMaterial color={cured?'#5f8aad':'#e2a55a'} transparent opacity={(fade ? .12 : .16+.16*grow)*bodyRamp}/>
    </mesh>}

    {!section && grow<.97 && [[-.28,-.22],[.28,-.22],[-.28,.22],[.28,.22],[0,0]].map(([ox,oz],i)=>{
      const localW=fullW*(i===4 ? .32 : .24);
      const localH=fullH*(i===4 ? .32 : .24);
      return <mesh key={i} position={[ox*fullW,PAD+g*.50,oz*fullH]} scale={[localW,g*.48,localH]}>
        <sphereGeometry args={[1,18,14]}/>
        <meshPhysicalMaterial color={color} transparent opacity={(fade ? .18 : .34+.14*(1-grow))*bodyRamp} roughness={.18} metalness={.02} depthWrite={false}/>
      </mesh>;
    })}

    {(r?.overflow??0)>10&&spread>.75&&<mesh position={[0,PAD+.075,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[Math.min(p.dieWidth,p.dieHeight)*.54,Math.min(p.dieWidth,p.dieHeight)*.54+(r?.overflow??0)*.006,64]}/><meshPhysicalMaterial color="#db9650" side={2} transparent opacity={.7}/></mesh>}
    {(r?.voids??0)>5&&grow>.6&&[0,1,2].map((i)=><mesh key={i} position={[-fullW/2+(i-1)*fullW*.27,PAD+g*.5,section ? -.1 : (i-1)*fullH*.2]}><sphereGeometry args={[g*.22,12,10]}/><meshBasicMaterial color="#132c3c"/></mesh>)}
  </group>;
}

function Board({p,hot=false}:{p:Parameters;hot?:boolean}){
  const l=getSceneLayout(p),rad=bumpRadius(p);
  return <group>
    <mesh position={[0,-.08,0]} castShadow receiveShadow><boxGeometry args={[l.substrateWidth,.68,l.substrateDepth]}/><meshStandardMaterial color="#235f54" roughness={.42}/></mesh>
    <mesh position={[0,-.46,0]}><boxGeometry args={[l.substrateWidth+.8,.1,l.substrateDepth+.7]}/><meshStandardMaterial color={hot?'#a66a40':'#142636'} emissive={hot?'#7d351a':'#000000'} emissiveIntensity={hot ? .22 : 0}/></mesh>
    {bumps(p).map(([x,z],i)=><mesh key={i} position={[x,PAD-.005,z]}><cylinderGeometry args={[rad*1.13,rad*1.13,.085,16]}/><meshStandardMaterial color="#d7a35c" metalness={.75} roughness={.32}/></mesh>)}
    {[-1,1].flatMap(ix=>[-1,1].map(iz=><group key={`${ix}-${iz}`} position={[ix*(p.dieWidth/2+.26),PAD,iz*(p.dieHeight/2+.26)]}><mesh><boxGeometry args={[.23,.02,.032]}/><meshBasicMaterial color="#71ebf0"/></mesh><mesh><boxGeometry args={[.032,.02,.23]}/><meshBasicMaterial color="#71ebf0"/></mesh></group>))}
  </group>;
}
function Nozzle({x=0,y=1.6,z=0}:{x?:number;y?:number;z?:number}){
  return <group position={[x,y,z]}><mesh position={[0,.82,0]}><cylinderGeometry args={[.22,.3,1.28,20]}/><meshStandardMaterial color="#aebfcd" metalness={.75}/></mesh><mesh position={[0,.10,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.21,.53,20]}/><meshStandardMaterial color="#a0b1c0" metalness={.72}/></mesh><mesh position={[0,-.21,0]}><cylinderGeometry args={[.05,.05,.14,12]}/><meshStandardMaterial color="#d8a65c" metalness={.58}/></mesh></group>;
}
function Head({p,hot=0,mode='bond'}:{p:Parameters;hot?:number;mode?:'pickup'|'bond'}){
  const small=mode==='pickup';const w=small?Math.min(1.1,p.dieWidth*.56):p.dieWidth*1.09;
  const d=small?Math.min(1.1,p.dieHeight*.56):p.dieHeight*1.09;
  return <group>
    <mesh position={[0,.19,0]} castShadow><boxGeometry args={[w,.26,d]}/><meshStandardMaterial color={hot>.15?'#d8b08c':'#acbfcc'} metalness={.68} roughness={.23} emissive="#fa612e" emissiveIntensity={hot*.30}/></mesh>
    {!small&&<mesh position={[0,.37,0]}><boxGeometry args={[w*.96,.07,d*.96]}/><meshStandardMaterial color={hot>.1?'#f1a55a':'#587487'} emissive="#ff761e" emissiveIntensity={hot*.9}/></mesh>}
    <mesh position={[0,.76,0]}><cylinderGeometry args={[small ? .26 : .35,small ? .32 : .45,.88,24]}/><meshStandardMaterial color="#8da4b5" metalness={.83} roughness={.25}/></mesh>
    <mesh position={[0,1.37,0]}><cylinderGeometry args={[.18,.18,.47,20]}/><meshStandardMaterial color="#c4d0dc" metalness={.78}/></mesh>
    {hot>.2&&!small&&[-1,1].map(ix=><mesh key={ix} position={[ix*w*.53,.28,0]}><boxGeometry args={[.07,.12,d*.7]}/><meshBasicMaterial color="#ff914f"/></mesh>)}
  </group>;
}
function Heater({p,hot=0}:{p:Parameters;hot?:number}){
  const l=getSceneLayout(p);
  return <group>
    <mesh position={[0,-.62,0]}><boxGeometry args={[l.substrateWidth+1,.24,l.substrateDepth+1]}/><meshStandardMaterial color="#415369" metalness={.5} emissive="#ce4d24" emissiveIntensity={hot*.25}/></mesh>
    {[-1,1].map(iz=><mesh key={iz} position={[0,-.47,iz*(l.substrateDepth/2+.28)]}><boxGeometry args={[l.substrateWidth,.04,.08]}/><meshStandardMaterial color={hot>.1?'#ff9d5d':'#668092'} emissive="#e45b22" emissiveIntensity={hot*.8}/></mesh>)}
    {hot>.25&&<pointLight color="#f28d57" position={[0,1.3,0]} intensity={hot*2} distance={15}/>}
  </group>;
}
function Ground(){return <group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.05,0]} receiveShadow><planeGeometry args={[180,180]}/><meshStandardMaterial color="#0b1522"/></mesh><gridHelper args={[100,100,'#254054','#192e40']} position={[0,-1.04,0]}/></group>}
function Package({p,r,joined=1,ncp=1,cured=false,transparent=false}:{p:Parameters;r:Results;joined?:number;ncp?:number;cured?:boolean;transparent?:boolean}){
  const gap=lerp(rawGap(p),finalGap(p,r),joined),h=dieThickness(p);
  return <group><Board p={p}/><NCP p={p} r={r} spread={ncp} cured={cured} fade={transparent}/><group position={[dx(p,p.offsetX),PAD+gap+h/2,dx(p,p.offsetY)]}><Die p={p} gap={gap} joined={joined} fade={transparent} r={r}/></group></group>;
}
function ForceArrows({p,intensity}:{p:Parameters;intensity:number}){
  if(intensity<.15)return null;
  return <group>{[-1,1].map((i)=><group key={i} position={[i*p.dieWidth*.68,2.3-intensity*.3,0]}><mesh position={[0,.36,0]}><cylinderGeometry args={[.04,.04,.55,12]}/><meshBasicMaterial color="#7ce7ef"/></mesh><mesh rotation={[Math.PI,0,0]} position={[0,-.02,0]}><coneGeometry args={[.12,.24,12]}/><meshBasicMaterial color="#7ce7ef"/></mesh></group>)}</group>;
}
function Assembly({p,r,stage,progress:t,mode}:{p:Parameters;r:Results;stage:Stage;progress:number;mode:ViewMode}){
  const l=getSceneLayout(p),h=dieThickness(p),g=rawGap(p),transparent=mode==='transparent';
  const px=dx(p,p.offsetX),pz=dx(p,p.offsetY),travel=Math.max(p.dieWidth,p.dieHeight)*.62+2.8;
  const lift=.24*smooth((t-.15)/.18),eject=stage==='pickup'?lift*(1-smooth((t-.34)/.16)):0;
  let x=l.waferX,y=TAPE+h/2,z=0,flip=0;
  if(stage==='pickup') {y+=lift+travel*smooth((t-.30)/.33);x+=p.dieWidth*.68*smooth((t-.52)/.17);flip=Math.PI*smooth((t-.59)/.33);}
  if(stage==='align'){x=lerp(l.waferX+p.dieWidth*.68,l.substrateX+px,smooth(t));y=lerp(TAPE+h/2+.24+travel,PAD+g+h/2+2.35,smooth(t));z=lerp(0,pz,smooth(t));flip=Math.PI;}
  if(stage==='contact'){x=l.substrateX+px;z=pz;y=PAD+g+h/2+2.35*(1-smooth(t/.82));flip=Math.PI;}
  const compressed=stage==='bond'?smooth((t-.22)/.60):1;
  const gap=lerp(g,finalGap(p,r),compressed);
  const hot=stage==='bond'?smooth((t-.12)/.23)*(1-smooth((t-.78)/.20)):0;
  const showWafer=stage==='ncp'||stage==='pickup'||stage==='align';
  return <group><Ground/>
    {showWafer&&<Wafer p={p} eject={eject} center={stage==='ncp'}/>}
    {stage==='ncp'&&<group position={[l.substrateX,0,0]}><Board p={p} hot/><Heater p={p} hot={.45}/><NCP p={p} spread={0} dots={Math.min(9,Math.floor(clamp(t,0,1)*9)+1)}/>{(()=>{const points=[[0,0],[-.28,-.28],[.28,-.28],[-.28,.28],[.28,.28]];const ix=Math.min(4,Math.floor(t*5));const [a,b]=points[ix];return <Nozzle x={a*p.dieWidth} z={b*p.dieHeight} y={1.1+1.2*(1-smooth(t/.1)+smooth((t-.9)/.1))}/>})()}</group>}
    {(stage==='pickup'||stage==='align'||stage==='contact')&&<>
      <group position={[l.substrateX,0,0]}><Board p={p} hot/><Heater p={p} hot={.35}/><NCP p={p} spread={stage==='contact'?smooth(t/.82)*.82:0}/></group>
      <group position={[x,y,z]} rotation={[0,0,flip]}><Die p={p} faceUp gap={g} fade={transparent}/></group>
      {(stage==='pickup'||stage==='align'||stage==='contact')&&<group position={[x,y+h/2+.07,z]}><Head p={p} mode="pickup"/></group>}
      {stage==='align'&&<group position={[l.substrateX,.5,0]}><mesh><boxGeometry args={[p.dieWidth+1,.024,.026]}/><meshBasicMaterial color="#6ceeff"/></mesh><mesh><boxGeometry args={[.026,.024,p.dieHeight+1]}/><meshBasicMaterial color="#6ceeff"/></mesh></group>}
    </>}
    {stage==='bond'&&<group position={[l.substrateX,0,0]}>
      <Board p={p} hot/><Heater p={p} hot={.55+hot*.45}/>
      <NCP p={p} r={r} spread={lerp(.78,1,compressed)} fade={transparent}/>
      <group position={[px,PAD+gap+h/2,pz]}><Die p={p} gap={gap} joined={compressed} fade={transparent} r={r}/><group position={[0,h/2,0]}><Head p={p} hot={hot}/></group></group>
      <ForceArrows p={p} intensity={smooth((t-.11)/.32)*(1-smooth((t-.85)/.12))}/>
    </group>}
    {(stage==='cure'||stage==='inspect')&&<group position={[l.substrateX,0,0]}><Package p={p} r={r} joined={1} ncp={1} cured={stage==='inspect'||t>.65} transparent={transparent}/>{stage==='cure'&&<Heater p={p} hot={.45+Math.sin(Math.PI*t)*.5}/>}</group>}
  </group>;
}
function CrossSection({p,r,stage,progress}:{p:Parameters;r:Results;stage:Stage;progress:number}){
  const h=dieThickness(p),g=finalGap(p,r),rad=bumpRadius(p),w=p.dieWidth;
  const cured=stage==='inspect'||stage==='cure'&&progress>.65;
  return <group><Ground/>
    <mesh position={[0,-.1,0]}><boxGeometry args={[w+2,.72,1.25]}/><meshStandardMaterial color="#235f54"/></mesh>
    <mesh position={[dx(p,p.offsetX),PAD+g+h/2,0]}><boxGeometry args={[w,h,1.25]}/><meshStandardMaterial color="#557a9c" metalness={.43}/></mesh>
    <NCP p={p} r={r} spread={1} cured={cured} section/>
    {[-2,-1,0,1,2].map((i,n)=><group key={i}><mesh position={[i*pitchVisual(p),PAD-.035,0]}><boxGeometry args={[rad*2.3,.065,1.26]}/><meshStandardMaterial color="#d6a45e" metalness={.8}/></mesh>
      <mesh position={[i*pitchVisual(p)+dx(p,p.offsetX),PAD+g*(r.opens>2&&n===0?.67:.5),0]} scale={[rad*1.05,g*(r.opens>2&&n===0?.45:1)/2,.57]}><sphereGeometry args={[1,20,12]}/><meshStandardMaterial color="#c7d5e1" metalness={.78}/></mesh></group>)}
    {r.bridge>2&&<mesh position={[dx(p,p.offsetX)+pitchVisual(p)*.5,PAD+g*.5,0]}><boxGeometry args={[pitchVisual(p)*1.3,g*.4,1.1]}/><meshStandardMaterial color="#cad9e2" metalness={.8}/></mesh>}
    <mesh position={[-w/2-.38,PAD+g/2,.68]}><boxGeometry args={[.023,g,.02]}/><meshBasicMaterial color="#70e2ed"/></mesh>
    {[-1,1].map(s=><mesh key={s} position={[-w/2-.38,PAD+g/2+s*g/2,.68]}><boxGeometry args={[.22,.02,.025]}/><meshBasicMaterial color="#70e2ed"/></mesh>)}
  </group>;
}
function cameraRegion(p:Parameters,stage:Stage){const l=getSceneLayout(p);if(stage==='align')return {x:l.centerX,w:l.fullWidth,d:l.fullDepth};if(stage==='pickup')return {x:l.waferX,w:l.baseRadius*2,d:l.baseRadius*2};return {x:l.substrateX,w:l.substrateWidth+2,d:l.substrateDepth+2};}
function FitCamera({p,mode,preset,stage}:{p:Parameters;mode:ViewMode;preset:CameraPreset;stage:Stage}){
  const {camera,size}=useThree();const region=cameraRegion(p,stage),cross=mode==='cross';const target:[number,number,number]=cross?[0,.14,0]:[region.x,.9,0];
  const fov=cross?38:43,aspect=Math.max(.2,size.width/Math.max(1,size.height));const tan=Math.tan(fov*Math.PI/360);
  const halfWidth=cross?(Math.max(3,p.dieWidth*1.4)+3)/2:region.w/2,halfDepth=cross?2:region.d/2;
  const distance=cross?Math.max(10,halfWidth/(tan*aspect)*1.24):Math.max(stage==='pickup'?23:12,halfWidth/(tan*aspect)*1.23,halfDepth/tan*1.12);
  useEffect(()=>{
    const dirs:Record<CameraPreset,[number,number,number]>={iso:[.37,.39,.83],top:[0,1,.001],front:[0,.13,1],side:[1,.16,0]};
    const dir=cross?[0,.19,1]:dirs[preset];const scale=distance/Math.hypot(...dir);
    camera.position.set(target[0]+dir[0]*scale,target[1]+dir[1]*scale,target[2]+dir[2]*scale);camera.lookAt(...target);camera.updateProjectionMatrix();
  },[camera,target[0],target[1],target[2],distance,cross,preset]);return null;
}
export default function SimulationScene({params,results,stage,progress,viewMode,cameraPreset,showLabels,sceneLabels}:SceneProps){
  const cross=viewMode==='cross',l=getSceneLayout(params),target:[number,number,number]=cross?[0,.14,0]:[cameraRegion(params,stage).x,.9,0];
  const maxOrbit=Math.max(48,l.fullWidth*2.7);
  return <div className="scene-root">
    <Canvas key={`${viewMode}-${cameraPreset}-${stage}`} shadows dpr={[1,1.75]} camera={{position:[0,15,28],fov:cross?38:43,near:.08,far:400}} gl={{antialias:true,alpha:false}}>
      <color attach="background" args={['#0c1725']}/><fog attach="fog" args={['#0c1725',90,260]}/>
      <ambientLight intensity={1.05}/><hemisphereLight args={['#b8efff','#0a1421',2.25]}/><directionalLight position={[5,14,9]} intensity={2.6} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={35} shadow-camera-bottom={-35}/><directionalLight position={[-9,7,-6]} color="#4da6cb" intensity={.9}/>
      {cross?<CrossSection p={params} r={results} stage={stage} progress={progress}/>:<Assembly p={params} r={results} stage={stage} progress={progress} mode={viewMode}/>}
      <OrbitControls makeDefault target={target} minDistance={cross?6:7} maxDistance={maxOrbit} maxPolarAngle={Math.PI*.91} enableDamping dampingFactor={.08}/><FitCamera p={params} mode={viewMode} preset={cameraPreset} stage={stage}/>
    </Canvas>
    {showLabels&&<><div className="scene-label scene-label-left"><span className="tiny-dot"/> {cross?(sceneLabels?.leftCross??'SECTION · NCP GAP EXAGGERATED'):(sceneLabels?.leftAssembly??'ASSEMBLY · PROCEDURAL 3D')}</div><div className="scene-label scene-label-right">{cross?(sceneLabels?.rightCross??'TCB JOINT / NCP INSPECTION'):(sceneLabels?.rightAssembly??'DRAG TO ORBIT · SCROLL TO ZOOM')}</div></>}
  </div>;
}
