export type Stage = 'ncp' | 'pickup' | 'align' | 'contact' | 'bond' | 'cure' | 'inspect';
export type Locale = 'en' | 'id' | 'zhTW';
export type ViewMode = 'assembly' | 'transparent' | 'cross';
export type CameraPreset = 'iso' | 'top' | 'front' | 'side';
export type Parameters = {
  dieWidth: number; dieHeight: number; waferThickness: number;
  bumpDiameter: number; pitch: number;
  ncpVolume: number; viscosity: number;
  stageTemp: number; headTemp: number;
  force: number; dwell: number; offsetX: number; offsetY: number;
  cureTemp: number; cureTime: number;
};
export const DEFAULT_PARAMS: Parameters = {
  dieWidth: 4, dieHeight: 4, waferThickness: 150,
  bumpDiameter: 100, pitch: 200,
  ncpVolume: 100, viscosity: 3,
  stageTemp: 110, headTemp: 280,
  force: 4, dwell: 5, offsetX: 5, offsetY: -3,
  cureTemp: 150, cureTime: 60,
};
export const STAGES: {id: Stage; duration: number; name: string; short: string}[] = [
  {id:'ncp',duration:6,name:'NCP dispensing',short:'NCP'},
  {id:'pickup',duration:7,name:'Die pick-up & flipping',short:'Flip'},
  {id:'align',duration:4,name:'Optical alignment',short:'Align'},
  {id:'contact',duration:5,name:'Initial die contact',short:'Contact'},
  {id:'bond',duration:9,name:'Thermo-compression bonding',short:'TCB'},
  {id:'cure',duration:6,name:'NCP curing',short:'Cure'},
  {id:'inspect',duration:4,name:'Final inspection',short:'Inspect'},
];
export const PRESETS: {key: string;name:string;description:string;overrides:Partial<Parameters>}[] = [
  {key:'ideal',name:'Nominal TCB',description:'Balanced NCP, local heat, force and time',overrides:{}},
  {key:'low',name:'Cold / short bond',description:'Insufficient local heating or dwell',overrides:{headTemp:205,dwell:1.2}},
  {key:'weak',name:'Insufficient pressure',description:'Low compression force produces weak contact',overrides:{force:0.8}},
  {key:'high',name:'Die damage / overforce',description:'Excessive contact pressure on a small die',overrides:{force:11,dieWidth:2,dieHeight:2}},
  {key:'misalign',name:'Misalignment',description:'Large X/Y die-to-pad placement error',overrides:{offsetX:130,offsetY:-95}},
  {key:'void',name:'NCP voids',description:'Low NCP volume and high viscosity',overrides:{ncpVolume:55,viscosity:10}},
  {key:'overflow',name:'NCP overflow',description:'Excess NCP and excessive pressure',overrides:{ncpVolume:155,force:9}},
  {key:'cure',name:'Incomplete NCP cure',description:'Insufficient curing temperature and time',overrides:{cureTemp:105,cureTime:15}},
];
export const clamp = (v:number, lo:number, hi:number) => Math.max(lo,Math.min(hi,v));
export const lerp = (a:number,b:number,t:number) => a+(b-a)*clamp(t,0,1);
export const smooth = (t:number) => {const s=clamp(t,0,1);return s*s*(3-2*s);};

// Head temperature is an illustrative *local* pulse; substrate temperature is distinct.
// The figures and bounds below are NOT recommended real TCB recipes.
export function pulseTemperature(p:Parameters,t:number){
  return t < .16 ? lerp(p.stageTemp,p.stageTemp+(p.headTemp-p.stageTemp)*.3,smooth(t/.16))
    : t < .40 ? lerp(p.stageTemp+(p.headTemp-p.stageTemp)*.3,p.headTemp,smooth((t-.16)/.24))
    : t < .74 ? p.headTemp
    : lerp(p.headTemp,p.stageTemp,smooth((t-.74)/.26));
}
export function getCureFraction(p:Parameters,t:number){
  return clamp(t * clamp((p.cureTemp-90)/60,0,1.5) * p.cureTime/60,0,1);
}
export function temperatureAt(p:Parameters,t:number){return Math.round(lerp(p.stageTemp,p.cureTemp,smooth(t/.65)));}
export function bondFormation(p:Parameters){
  const thermal=clamp((p.headTemp-205)/65,0,1.25) * clamp(p.dwell/4,0,1.35) * clamp((p.stageTemp-40)/65,.45,1.4);
  const mechanical=clamp(p.force/3.5,0,1.35);
  // Both heat and pressure are necessary: strong heat cannot fully compensate for zero contact force.
  return clamp(Math.sqrt(thermal)*Math.pow(mechanical,.75),0,1);
}
export type Results={
  standoff:number;coverage:number;voids:number;bridge:number;opens:number;
  placementError:number;overflow:number;bondFormation:number;
  damage:'Low'|'Elevated'|'High';delamination:'Low'|'Elevated'|'High';
  status:'PASS'|'FAIL';issues:{code:string;title:string;detail:string}[];
};
/**
 * Schematic educational indicators for pre-applied non-conductive paste (NCP)
 * and locally heated thermo-compression bonding. Not a coupled thermo-mechanical,
 * capillary-flow, solder-metallurgy or calibrated manufacturing model.
 */
export function computeResults(p:Parameters,cure=1,locale:Locale='en'):Results{
  const placementError=Math.hypot(p.offsetX,p.offsetY);
  const ratio=p.bumpDiameter/p.pitch;
  const formation=bondFormation(p);
  const opens=clamp((1-formation)*28 + Math.max(0,placementError-p.pitch*.20)*.13,0,100);
  const bridge=clamp(Math.max(0,ratio-.67)*95 + Math.max(0,p.force-7)*1.9 + Math.max(0,placementError-p.pitch*.32)*.11,0,100);
  const coverage=clamp(99-Math.max(0,92-p.ncpVolume)*.7-Math.max(0,p.viscosity-4)*3.1-Math.max(0,1.5-p.force)*2.1,25,100);
  const voids=clamp(.6+(100-coverage)*.29+Math.max(0,p.viscosity-5)*.5,0,100);
  const overflow=clamp(Math.max(0,p.ncpVolume-120)*.52+Math.max(0,p.force-7)*2.2,0,100);
  const standoff=clamp(p.bumpDiameter*(1-.20*formation-.025*Math.max(0,p.force-4)),p.bumpDiameter*.45,p.bumpDiameter);
  const pressure=p.force/(p.dieWidth*p.dieHeight);
  const damage:Results['damage'] = pressure>.65 || p.headTemp>330 || p.dwell>9.2 ? 'High' : pressure>.46 || p.headTemp>315 || p.dwell>8.5 ? 'Elevated' : 'Low';
  const delamination:Results['delamination']=cure<.85||voids>10||coverage<85?'High':cure<.95||voids>5||overflow>12?'Elevated':'Low';
  const issues:Results['issues']=[];
  const add=(code:string,bad:boolean,value:string,translations:[string,string][])=>{
    if(bad){const [title,detail]=translations[locale==='en'?0:locale==='id'?1:2];issues.push({code,title,detail:`${value} · ${detail}`});}
  };
  add('opens',opens>2,`${opens.toFixed(1)}% / ≤2%`,[
    ['Poor joint formation / open risk','Increase appropriate local head temperature, pressure or bonding dwell; verify pad metallization.'],
    ['Sambungan lemah / risiko open','Periksa suhu head lokal, bonding force dan dwell; validasi metalisasi pad.'],
    ['接點形成不足／開路風險','請檢查局部加熱溫度、貼合壓力、時間與焊墊金屬層。']]);
  add('bridge',bridge>2,`${bridge.toFixed(1)}% / ≤2%`,[
    ['Interconnect bridging','Review bump diameter, pitch, placement offset and compression force.'],
    ['Risiko bridging interkoneksi','Periksa diameter bump, pitch, offset dan gaya kompresi.'],
    ['接點橋接風險','請檢查凸塊直徑、間距、對位偏移和壓合力。']]);
  add('placement',placementError>p.pitch*.25,`${placementError.toFixed(1)} µm / ≤${(p.pitch*.25).toFixed(1)} µm`,[
    ['Die misalignment','Correct vision alignment and X/Y motion offsets.'],
    ['Die tidak sejajar','Koreksi alignment vision dan offset X/Y.'],
    ['晶粒對位不準','請修正視覺對位與 X/Y 移動偏移。']]);
  add('coverage',coverage<95,`${coverage.toFixed(1)}% / ≥95%`,[
    ['Insufficient NCP coverage','Adjust pre-bond NCP dispense amount, viscosity and compression.'],
    ['Cakupan NCP kurang','Sesuaikan jumlah NCP, viskositas dan kompresi.'],
    ['非導電膠覆蓋不足','請調整 NCP 點膠量、黏度與壓合條件。']]);
  add('voids',voids>5,`${voids.toFixed(1)}% / ≤5%`,[
    ['NCP void risk','Review NCP volume, viscosity, contact spreading and trapped air.'],
    ['Risiko void NCP','Periksa volume NCP, viskositas, penyebaran dan udara terjebak.'],
    ['非導電膠空洞風險','請檢查 NCP 膠量、黏度、流動及殘留空氣。']]);
  add('overflow',overflow>10,`${overflow.toFixed(1)}% / ≤10%`,[
    ['Excess NCP overflow','Reduce NCP dispense amount or excessive bonding pressure.'],
    ['NCP meluber berlebih','Kurangi volume NCP atau gaya bonding yang terlalu besar.'],
    ['NCP 溢膠過多','請降低非導電膠用量或過大的壓合力。']]);
  add('damage',damage==='High',`${p.force.toFixed(1)} N / ${pressure.toFixed(2)} N/mm²`,[
    ['High die / joint damage risk','Reduce pressure or excessive peak-head heat and dwell.'],
    ['Risiko kerusakan die / joint','Kurangi tekanan, panas head, atau dwell yang berlebihan.'],
    ['晶粒／接點受損風險高','請降低壓合力、過高的加熱溫度或時間。']]);
  add('cure',cure<.95,`${(cure*100).toFixed(0)}% / ≥95%`,[
    ['Incomplete NCP curing','Validate curing temperature and duration against NCP supplier requirements.'],
    ['Curing NCP tidak lengkap','Validasi suhu dan durasi curing sesuai spesifikasi pemasok NCP.'],
    ['NCP 固化不足','請依非導電膠供應商規格確認固化溫度與時間。']]);
  return {standoff,coverage,voids,bridge,opens,placementError,overflow,bondFormation:formation,damage,delamination,status:issues.length?'FAIL':'PASS',issues};
}
