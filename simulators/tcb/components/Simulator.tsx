'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SuiteBar from '@/components/SuiteBar';
import LanguageFlag from '@/simulators/tcb/components/LanguageFlag';
import {
  Activity, AlertTriangle, Check, CheckCircle2, ChevronDown,
  CircleHelp, ClipboardList, Clock3, Cpu, Crosshair, Droplets,
  Eye, Gauge, Layers, Maximize2, Move3D, Pause, Play, RotateCcw,
  ScanLine, Settings2, SkipBack, SkipForward, SlidersHorizontal,
  Thermometer, Timer, WandSparkles, XCircle, Zap
} from 'lucide-react';
import {
  CameraPreset, clamp, computeResults, DEFAULT_PARAMS, getCureFraction,
  Parameters, PRESETS, Results, STAGES, Stage, temperatureAt, pulseTemperature, ViewMode, Locale
} from '@/simulators/tcb/lib/simulation';

const SimulationScene = dynamic(() => import('@/simulators/tcb/components/SimulationScene'), {
  ssr: false,
  loading: () => <div className="scene-loading">Preparing 3D process viewport…</div>,
});

const durations = STAGES.map(s => s.duration);
const elapsedStarts = durations.map((_, i) => durations.slice(0, i).reduce((a, b) => a + b, 0));
const totalDuration = durations.reduce((a, b) => a + b, 0);

function locatePlayhead(t: number): { index: number; progress: number } {
  if (t >= totalDuration) return { index: STAGES.length - 1, progress: 1 };
  for (let i = durations.length - 1; i >= 0; i--) {
    if (t >= elapsedStarts[i]) return { index: i, progress: clamp((t - elapsedStarts[i]) / durations[i], 0, 1) };
  }
  return { index: 0, progress: 0 };
}

function formatNumber(v: number, digits = 1) { return Number(v.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits }); }

function RangeField({ label, value, onChange, min, max, step = 1, unit, hint }: {
  label: string; value: number; onChange: (n: number) => void; min: number; max: number;
  step?: number; unit: string; hint?: string;
}) {
  const pct = clamp((value - min) / (max - min) * 100, 0, 100);
  return <label className="range-field">
    <span className="range-title"><span>{label}{hint && <span className="field-hint" title={hint}><CircleHelp size={12}/></span>}</span><b>{formatNumber(value, step < 1 ? 2 : 1)} <small>{unit}</small></b></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ '--percent': `${pct}%` } as React.CSSProperties}/>
    <span className="range-limits"><span>{min}</span><span>{max}</span></span>
  </label>;
}

function SelectField<T extends string>({ label, value, onChange, options, hint }: {
  label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: string;
}) {
  return <label className="select-field"><span>{label}{hint && <span className="field-hint" title={hint}><CircleHelp size={12}/></span>}</span>
    <span className="select-wrap"><select value={value} onChange={e => onChange(e.target.value as T)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={14}/></span>
  </label>;
}

function Metric({ label, value, unit, detail, severity }: { label: string; value: number | string; unit?: string; detail?: string; severity?: 'good' | 'warn' | 'bad' }) {
  return <div className="metric">
    <div className="metric-name">{label}<span className={`indicator ${severity || 'neutral'}`}/></div>
    <div className="metric-value">{typeof value === 'number' ? formatNumber(value, 1) : value}<small>{unit}</small></div>
    {detail && <div className="metric-detail">{detail}</div>}
  </div>;
}



type Language = Locale;

const UI_COPY = {
id: {
  isoTitle: "Isometrik",
  topTitle: "Atas",
  frontTitle: "Depan",
  sideTitle: "Samping",
  iso: "ISO",
  top: "ATAS",
  front: "DEPAN",
  side: "SISI",
  waferThickness: "Ketebalan wafer",
  step: "TAHAP",
  die: "Die",
  brandSubtitle: 'Perakitan semikonduktor · Kembaran digital interaktif',
  simOnline: 'SIMULASI ONLINE',
  educationalModel: 'MODEL EDUKATIF',
  workflow: 'ALUR / 01',
  bondingProcess: 'Proses bonding',
  processStages: 'Tahapan proses',
  processScenarios: 'SKENARIO PROSES',
  liveProcessView: 'TAMPILAN PROSES LANGSUNG',
  currentStep: 'STEP SAAT INI',
  stepProgress: 'PROGRES STEP',
  allChecksSatisfied: 'Seluruh pemeriksaan inspeksi lolos',
  failedChecks: (n:number)=> `${n} pemeriksaan inspeksi gagal`,
  sectionView: 'SECTION VIEW',
  assembly: 'Assembly',
  transparent: 'Transparan',
  crossSection: 'Cross-section',
  hideLabels: 'Sembunyikan',
  showLabels: 'Tampilkan',
  labels: 'label',
  processTimeline: 'TIMELINE PROSES',
  simTime: 'WAKTU SIM',
  previousStage: 'Step sebelumnya',
  reset: 'Reset',
  runSimulation: 'Jalankan Simulasi',
  pauseSimulation: 'Jeda Simulasi',
  replaySimulation: 'Ulangi Simulasi',
  nextStage: 'Step berikutnya',
  speed: 'KECEPATAN',
  engineeringExplanation: 'Penjelasan Engineering',
  eventMonitor: 'Monitor Event',
  running: 'BERJALAN',
  ready: 'SIAP',
  systemLog: 'Log sistem',
  equipmentConfiguration: 'KONFIGURASI PERALATAN',
  processControls: 'Kontrol proses',
  process: 'Process',
  dieAndSubstrate: 'DIE & SUBSTRATE',
  dieWidth: 'Lebar die',
  dieLength: 'Panjang die',
  placement: 'PLACEMENT',
  bondingForce: "Gaya bonding",
  xPlacementOffset: 'Offset placement X',
  yPlacementOffset: 'Offset placement Y',
  cureTemperature: 'Suhu curing',
  cureDuration: 'Durasi curing',
  chamberTemp: "Suhu setpoint",
  estimatedCure: 'Estimasi cure',
  modeledOutputs: 'OUTPUT TERHITUNG',
  bondQuality: 'Kualitas bonding',
  metricXYDeviation: 'Deviasi X/Y',
  metricHeuristicOnly: 'Hanya heuristik',
  metricPlacementError: 'PLACEMENT ERROR',
  metricVoids: 'ESTIMATED VOIDS',
  delamination: 'DELAMINATION',
  low: 'Rendah',
  elevated: 'Sedang',
  high: 'Tinggi',
  inspectionVerdict: 'Verdict inspeksi',
  passSuccessful: 'PASS — Bonding berhasil',
  failUnsuccessful: 'FAIL — Bonding gagal',
  passAllParams: 'Semua parameter lolos batas simulasi.',
  failParamCount: (n:number)=> `${n} parameter tidak memenuhi batas simulasi.`,
  projectedAfterFullCure: 'Diproyeksikan setelah full cure. ',
  cureInProgress: 'Curing masih berlangsung. ',
  disclaimer: 'PASS/FAIL dan semua nilai adalah estimasi edukatif—bukan batas kualifikasi industri.',
  languageLabel: 'Bahasa',
  sceneLeftAssembly: 'ASSEMBLY · PROSEDURAL 3D',
  sceneRightAssembly: 'GESER UNTUK ORBIT · SCROLL UNTUK ZOOM',
  logPresetLoaded: (name:string)=> `Preset dimuat · ${name}`,
  logProcessReset: 'Proses direset · Step 01',
  logStage: (n:number, name:string)=> `Step ${String(n).padStart(2,'0')} · ${name}`,
  pasteType: "FLIP CHIP · THERMO-COMPRESSION BONDING",
  conventionalFaceUp: "Flip chip dengan NCP · Panas lokal + tekanan",
  asideNotice: "Coba bonding dingin, gaya berlebih, atau void NCP, lalu amati sambungan.",
  filmLegend: "Perak: microbump · Jingga: NCP sebelum bonding · Emas: pad · Toska: dicing tape",
  nextBackend: "Tidak ada underfill kapiler setelah bonding pada alur NCP ini",
  bltApprox: "Tinggi sambungan TCB ≈",
  crossNote: "Contoh satu baris microbump; ukuran diperbesar agar terlihat.",
  crossSectionDisabled: "Penampang tersedia saat proses bonding TCB",
  inspectBonded: "Periksa sambungan TCB dan NCP",
  materialAndCure: "Panas & NCP",
  dispensing: "MICROBUMP & DISPENSING NCP",
  bumpDiameter: "Diameter microbump",
  pitch: "Pitch bump",
  fluxAmount: "Jumlah dispense NCP (relatif)",
  reflowRecipe: "PEMANASAN HEAD / STAGE TCB",
  peakTemp: "Suhu puncak pulse head",
  tal: "Waktu tekan (dwell)",
  cleaning: "Suhu heated stage",
  underfill: "PROPERTI ALIRAN NCP",
  underfillVolume: "Jumlah NCP sebelum bonding",
  viscosity: "Viskositas NCP",
  curingRecipe: "CURING NCP",
  thermalNote: "Model edukatif TCB berbantu NCP. Head memberikan panas lokal, bonding force, dan dwell, sedangkan substrate dipanaskan. Tidak ada oven mass reflow atau underfill kapiler setelah bonding. Resep nyata harus divalidasi dengan pemasok material.",
  liveCuringReadout: "PEMBACAAN SUHU LOKAL",
  metricBLT: "TINGGI SAMBUNGAN",
  metricEstimatedFilmGap: "Estimasi celah microbump",
  metricCoverage: "CAKUPAN NCP",
  metricEstimatedDieArea: "Estimasi area terisi",
  metricFillet: "RISIKO BRIDGING",
  metricSqueezeOut: "Indikator heuristik",
  metricOpens: "RISIKO OPEN JOINT",
  metricResidue: "NCP MELUBER",
  bleedRisk: "RISIKO KERUSAKAN DIE",
  passDetail: "Sambungan lokal, alignment, NCP, dan curing memenuhi batas ilustratif.",
  footerProcess: "NCP → FLIP → ALIGN → CONTACT → TEKAN & PANAS → CURE → INSPEKSI",
  footerModel: "FLIP CHIP TCB v1.2 · MODEL EDUKATIF",
  sceneLeftCross: "PENAMPANG · CELAH NCP DIPERBESAR",
  sceneRightCross: "SAMBUNGAN TCB / NCP",
  logInit: "Simulasi siap · Dispensing NCP",
  substrateType: "Substrate laminate dengan pemanas",
  laminate: "Laminate organik",
},
en: {
  isoTitle: "Isometric view",
  topTitle: "Top view",
  frontTitle: "Front view",
  sideTitle: "Side view",
  iso: "ISO",
  top: "TOP",
  front: "FRONT",
  side: "SIDE",
  waferThickness: "Wafer thickness",
  step: "STEP",
  die: "Die",
  brandSubtitle: 'Semiconductor assembly · Interactive digital twin',
  simOnline: 'SIMULATION ONLINE',
  educationalModel: 'EDUCATIONAL MODEL',
  workflow: 'WORKFLOW / 01',
  bondingProcess: 'Bonding process',
  processStages: 'Process stages',
  processScenarios: 'PROCESS SCENARIOS',
  liveProcessView: 'LIVE PROCESS VIEW',
  currentStep: 'CURRENT STEP',
  stepProgress: 'STEP PROGRESS',
  allChecksSatisfied: 'All inspection checks satisfied',
  failedChecks: (n:number)=> `${n} failed inspection check${n !== 1 ? 's' : ''}`,
  sectionView: 'SECTION VIEW',
  assembly: 'Assembly',
  transparent: 'Transparent',
  crossSection: 'Cross-section',
  hideLabels: 'Hide',
  showLabels: 'Show',
  labels: 'labels',
  processTimeline: 'PROCESS TIMELINE',
  simTime: 'SIM TIME',
  previousStage: 'Previous stage',
  reset: 'Reset',
  runSimulation: 'Run Simulation',
  pauseSimulation: 'Pause Simulation',
  replaySimulation: 'Replay Simulation',
  nextStage: 'Next stage',
  speed: 'SPEED',
  engineeringExplanation: 'Engineering Explanation',
  eventMonitor: 'Event Monitor',
  running: 'RUNNING',
  ready: 'READY',
  systemLog: 'System log',
  equipmentConfiguration: 'EQUIPMENT CONFIGURATION',
  processControls: 'Process controls',
  process: 'Process',
  dieAndSubstrate: 'DIE & SUBSTRATE',
  dieWidth: 'Die width',
  dieLength: 'Die length',
  placement: 'PLACEMENT',
  bondingForce: "Bonding force",
  xPlacementOffset: 'X placement offset',
  yPlacementOffset: 'Y placement offset',
  cureTemperature: 'Cure temperature',
  cureDuration: 'Cure duration',
  chamberTemp: "Thermal setpoint",
  estimatedCure: 'Estimated cure',
  modeledOutputs: 'MODELED OUTPUTS',
  bondQuality: 'Bond quality',
  metricXYDeviation: 'X/Y deviation',
  metricHeuristicOnly: "Heuristic only",
  metricPlacementError: 'PLACEMENT ERROR',
  metricVoids: 'ESTIMATED VOIDS',
  delamination: 'DELAMINATION',
  low: 'Low',
  elevated: 'Elevated',
  high: 'High',
  inspectionVerdict: 'Inspection verdict',
  passSuccessful: 'PASS — Bonding successful',
  failUnsuccessful: 'FAIL — Bonding unsuccessful',
  passAllParams: 'All parameters satisfy the simulation limits.',
  failParamCount: (n:number)=> `${n} parameter${n !== 1 ? 's' : ''} failed the simulation limits.`,
  projectedAfterFullCure: 'Projected after full cure. ',
  cureInProgress: 'Cure is still in progress. ',
  disclaimer: 'PASS/FAIL and all measurements are educational estimates—not industrial qualification limits.',
  languageLabel: 'Language',
  sceneLeftAssembly: 'ASSEMBLY · PROCEDURAL 3D',
  sceneRightAssembly: 'DRAG TO ORBIT · SCROLL TO ZOOM',
  logPresetLoaded: (name:string)=> `Preset loaded · ${name}`,
  logProcessReset: 'Process reset · Stage 01',
  logStage: (n:number, name:string)=> `Stage ${String(n).padStart(2,'0')} · ${name}`,
  pasteType: "FLIP CHIP · THERMO-COMPRESSION BONDING",
  conventionalFaceUp: "NCP-assisted flip chip · Local heat + force",
  asideNotice: "Try a cold bond, excessive force, or NCP voids; then inspect the joints and NCP.",
  filmLegend: "Silver: microbumps · Amber: pre-applied NCP · Gold: pads · Teal: dicing tape",
  nextBackend: "No post-bond capillary underfill in this illustrated NCP flow",
  bltApprox: "TCB joint stand-off ≈",
  crossNote: "Representative microbump row; dimensions magnified for clarity.",
  crossSectionDisabled: "Cross-section available from TCB bonding",
  inspectBonded: "Inspect TCB joints and non-conductive paste",
  materialAndCure: "Heat & NCP",
  dispensing: "MICROBUMPS & NCP DISPENSING",
  bumpDiameter: "Microbump diameter",
  pitch: "Bump pitch",
  fluxAmount: "NCP dispense amount (relative)",
  reflowRecipe: "LOCAL TCB HEAD / STAGE HEAT",
  peakTemp: "Pulse-head peak temperature",
  tal: "Bonding dwell time",
  cleaning: "Heated stage temperature",
  underfill: "NCP FLOW PROPERTIES",
  underfillVolume: "Pre-bond NCP amount (relative)",
  viscosity: "NCP viscosity",
  curingRecipe: "NCP CURING RECIPE",
  thermalNote: "This is an educational NCP-assisted TCB model: the head applies local pulse heat, controlled force and dwell while the substrate is heated. No mass reflow oven or post-bond capillary underfill is used. Actual process settings require material/vendor validation.",
  liveCuringReadout: "LOCAL THERMAL READOUT",
  metricBLT: "JOINT STAND-OFF",
  metricEstimatedFilmGap: "Modeled compressed bump gap",
  metricCoverage: "NCP COVERAGE",
  metricEstimatedDieArea: "Predicted filled area",
  metricFillet: "BRIDGING RISK",
  metricSqueezeOut: "Heuristic indicator",
  metricOpens: "OPEN JOINT RISK",
  metricResidue: "NCP OVERFLOW",
  bleedRisk: "DIE DAMAGE RISK",
  passDetail: "Local interconnect, alignment, NCP coverage/void and cure checks satisfy the illustrative criteria.",
  footerProcess: "NCP → FLIP → ALIGN → CONTACT → TCB PULSE → NCP CURE → INSPECT",
  footerModel: "FLIP CHIP TCB v1.2 · EDUCATIONAL MODEL",
  sceneLeftCross: "SECTION · NCP GAP EXAGGERATED",
  sceneRightCross: "TCB JOINT / NCP",
  logInit: "Simulation ready · NCP dispensing",
  substrateType: "Heated organic laminate substrate",
  laminate: "Organic laminate",
},
zhTW: {
  isoTitle: "等角視圖",
  topTitle: "俯視圖",
  frontTitle: "正視圖",
  sideTitle: "側視圖",
  iso: "等角",
  top: "俯視",
  front: "正視",
  side: "側視",
  waferThickness: "晶圓厚度",
  step: "步驟",
  die: "晶粒",
  brandSubtitle: '半導體封裝組裝 · 互動式數位分身',
  simOnline: '模擬上線中',
  educationalModel: '教學模型',
  workflow: '流程 / 01',
  bondingProcess: '鍵合流程',
  processStages: '流程階段',
  processScenarios: '製程情境',
  liveProcessView: '即時製程視圖',
  currentStep: '目前步驟',
  stepProgress: '步驟進度',
  allChecksSatisfied: '所有檢查皆通過',
  failedChecks: (n:number)=> `${n} 項檢查未通過`,
  sectionView: '截面視圖',
  assembly: '組裝',
  transparent: '透明',
  crossSection: '截面',
  hideLabels: '隱藏',
  showLabels: '顯示',
  labels: '標籤',
  processTimeline: '製程時間軸',
  simTime: '模擬時間',
  previousStage: '上一階段',
  reset: '重設',
  runSimulation: '執行模擬',
  pauseSimulation: '暫停模擬',
  replaySimulation: '重新播放',
  nextStage: '下一階段',
  speed: '速度',
  engineeringExplanation: '工程說明',
  eventMonitor: '事件監控',
  running: '執行中',
  ready: '就緒',
  systemLog: '系統紀錄',
  equipmentConfiguration: '設備設定',
  processControls: '流程控制',
  process: '流程',
  dieAndSubstrate: '晶粒與基板',
  dieWidth: '晶粒寬度',
  dieLength: '晶粒長度',
  placement: '貼裝',
  bondingForce: "固晶力",
  xPlacementOffset: 'X 貼裝偏移',
  yPlacementOffset: 'Y 貼裝偏移',
  cureTemperature: '固化溫度',
  cureDuration: '固化時間',
  chamberTemp: "溫度設定值",
  estimatedCure: '估計固化率',
  modeledOutputs: '模擬輸出',
  bondQuality: '鍵合品質',
  metricXYDeviation: 'X/Y 偏差',
  metricHeuristicOnly: '僅為啟發式估算',
  metricPlacementError: '貼裝誤差',
  metricVoids: '估計空洞率',
  delamination: '分層風險',
  low: '低',
  elevated: '中',
  high: '高',
  inspectionVerdict: '檢查結果',
  passSuccessful: 'PASS — 鍵合成功',
  failUnsuccessful: 'FAIL — 鍵合失敗',
  passAllParams: '所有參數皆符合模擬限制。',
  failParamCount: (n:number)=> `${n} 項參數不符合模擬限制。`,
  projectedAfterFullCure: '以下為完全固化後之預估。',
  cureInProgress: '固化仍在進行中。 ',
  disclaimer: 'PASS/FAIL 與所有數值皆為教學估算，並非工業量產品質判定標準。',
  languageLabel: '語言',
  sceneLeftAssembly: '組裝 · 程序化 3D',
  sceneRightAssembly: '拖曳旋轉 · 滾輪縮放',
  logPresetLoaded: (name:string)=> `已載入預設 · ${name}`,
  logProcessReset: '流程已重設 · Step 01',
  logStage: (n:number, name:string)=> `步驟 ${String(n).padStart(2,'0')} · ${name}`,
  pasteType: "覆晶 · 熱壓鍵合（TCB）",
  conventionalFaceUp: "非導電膠輔助覆晶 · 局部加熱與壓合",
  asideNotice: "可試試低溫鍵合、過大壓力或 NCP 空洞，再檢查接點。",
  filmLegend: "銀色：微凸塊 · 橘色：預塗 NCP · 金色：焊墊 · 青色：切割膠帶",
  nextBackend: "此 NCP 流程不需要鍵合後毛細底部填膠",
  bltApprox: "TCB 接點間隙 ≈",
  crossNote: "代表性微凸塊列；尺寸已放大以利觀察。",
  crossSectionDisabled: "TCB 壓合階段可使用截面視圖",
  inspectBonded: "檢查 TCB 接點與非導電膠",
  materialAndCure: "熱與 NCP",
  dispensing: "微凸塊與 NCP 點膠",
  bumpDiameter: "微凸塊直徑",
  pitch: "凸塊間距",
  fluxAmount: "NCP 點膠量（相對）",
  reflowRecipe: "TCB 局部加熱條件",
  peakTemp: "壓合頭脈衝峰值溫度",
  tal: "熱壓保持時間",
  cleaning: "加熱載台溫度",
  underfill: "NCP 流動特性",
  underfillVolume: "鍵合前 NCP 用量",
  viscosity: "NCP 黏度",
  curingRecipe: "NCP 固化",
  thermalNote: "此為非導電膠輔助 TCB 教學模型。壓合頭提供局部脈衝加熱、壓力與保持時間，基板由載台加熱。沒有整體回焊爐或鍵合後毛細填膠。實際製程條件須依材料與設備供應商驗證。",
  liveCuringReadout: "局部溫度讀值",
  metricBLT: "接點間隙高度",
  metricEstimatedFilmGap: "估計壓縮後接點間隙",
  metricCoverage: "NCP 覆蓋率",
  metricEstimatedDieArea: "估計填膠面積",
  metricFillet: "橋接風險",
  metricSqueezeOut: "啟發式指標",
  metricOpens: "開路風險",
  metricResidue: "NCP 溢膠",
  bleedRisk: "晶粒受損風險",
  passDetail: "接點、對位、NCP 覆蓋／空洞與固化符合教學設定條件。",
  footerProcess: "NCP 點膠 → 翻晶 → 對位 → 接觸 → 熱壓 → 固化 → 檢查",
  footerModel: "覆晶 TCB v1.2 · 教學模型",
  sceneLeftCross: "截面 · NCP 間隙已放大",
  sceneRightCross: "TCB 接點／NCP",
  logInit: "模擬就緒 · NCP 點膠",
  substrateType: "加熱式有機封裝基板",
  laminate: "有機封裝基板",
}
} as const;
const STAGE_COPY = {"en": {"ncp": {"name": "NCP dispensing", "short": "NCP", "device": "Programmable non-conductive paste dispenser", "explanation": "NCP is dispensed onto a heated substrate before the bumped die is placed.", "purpose": "Place NCP between the microbumps before flip-chip thermo-compression.", "issue": "Too little NCP can leave voids; excess can overflow outside the die."}, "pickup": {"name": "Die pick-up & flip", "short": "Flip", "device": "Ejector pins and flipping collet", "explanation": "Ejector pins release a bumped die from dicing tape. The vacuum collet lifts and flips it 180° so the bumps face down.", "purpose": "Present the microbumps toward the substrate pads without damaging the die.", "issue": "Mishandling can damage the bumps or silicon die."}, "align": {"name": "Optical alignment", "short": "Align", "device": "Vision alignment stage", "explanation": "The TCB head positions the die above the NCP-coated substrate and aligns bumps to substrate pads.", "purpose": "Minimize lateral X/Y placement errors.", "issue": "Offset may cause weak contacts, opens, or bridges."}, "contact": {"name": "Initial die contact", "short": "Contact", "device": "Precision bonding head and heated stage", "explanation": "The face-down die approaches NCP and pads. The paste begins to spread as the microbumps touch the substrate.", "purpose": "Establish controlled first contact before the heat-and-pressure pulse.", "issue": "Uneven contact can trap air or reduce NCP coverage."}, "bond": {"name": "Thermo-compression bonding", "short": "TCB", "device": "Pulsed heated bonding head (force + time)", "explanation": "A single heated head applies local pulse heat and sustained pressure to the die while the substrate stage is heated. Microbumps compress and bond; pre-applied NCP spreads around them.", "purpose": "Form local electrical interconnects while controlling joint gap and NCP distribution.", "issue": "Insufficient heat/force/dwell produces weak joints. Excess compression may damage die or bridge bumps."}, "cure": {"name": "NCP curing", "short": "Cure", "device": "Heated substrate / material-specific cure", "explanation": "Heat completes the curing of the NCP already between the die and substrate. There is no later capillary-underfill dispense step.", "purpose": "Harden NCP to support the interconnects mechanically.", "issue": "Incomplete NCP cure can increase delamination and reliability risk."}, "inspect": {"name": "Final inspection", "short": "Inspect", "device": "Optical / cross-section inspection (conceptual)", "explanation": "Inspect modeled bump stand-off, possible opens, bridges, NCP coverage, voids, overflow and curing.", "purpose": "Understand how thermal, mechanical and paste parameters affect modeled bond quality.", "issue": "This PASS/FAIL screen is heuristic, not a measured production inspection."}}, "id": {"ncp": {"name": "Dispensing NCP", "short": "NCP", "device": "Nozzle non-conductive paste", "explanation": "NCP diaplikasikan pada substrate yang dipanaskan sebelum die berbump dipasang.", "purpose": "Menempatkan NCP di antara microbump sebelum thermo-compression bonding.", "issue": "NCP kurang menimbulkan void; kelebihan NCP dapat meluber ke tepi die."}, "pickup": {"name": "Pengambilan & flip die", "short": "Flip", "device": "Ejector pin dan vacuum collet", "explanation": "Ejector membantu melepas die dari dicing tape. Collet mengangkat dan memutarnya 180° sehingga microbump menghadap ke bawah.", "purpose": "Menghadapkan microbump ke pad substrate tanpa merusak die.", "issue": "Penanganan yang kurang baik dapat merusak bump atau silikon."}, "align": {"name": "Optical alignment", "short": "Align", "device": "Sistem kamera vision", "explanation": "Bonding head menyelaraskan microbump dengan pad substrate yang telah dilapisi NCP.", "purpose": "Meminimalkan offset X/Y sebelum bonding.", "issue": "Misalignment dapat menimbulkan open atau bridging."}, "contact": {"name": "Kontak awal die", "short": "Contact", "device": "Bonding head presisi dan heated stage", "explanation": "Die menghadap ke bawah dan mendekati NCP; paste mulai tersebar dan bump menyentuh pad.", "purpose": "Membentuk kontak awal sebelum pulsa panas dan tekanan.", "issue": "Kontak tidak merata dapat menjebak udara dan mengurangi coverage."}, "bond": {"name": "Thermo-compression bonding", "short": "TCB", "device": "Bonding head berpemanas (gaya + waktu)", "explanation": "Satu head memanaskan secara lokal dengan pulse heat sambil memberi bonding force dan dwell. Microbump tertekan dan menyambung; NCP tersebar di celah.", "purpose": "Membentuk interkoneksi listrik dengan stand-off dan sebaran NCP terkontrol.", "issue": "Panas/tekanan/dwell kurang menyebabkan sambungan lemah; berlebih dapat merusak die."}, "cure": {"name": "Curing NCP", "short": "Cure", "device": "Heated stage dan curing material", "explanation": "NCP yang sudah berada di antara die dan substrate disembuhkan melalui pemanasan. Tidak ada dispensing underfill kapiler sesudahnya.", "purpose": "Mengeraskan NCP untuk menopang sambungan secara mekanik.", "issue": "Curing kurang meningkatkan risiko delaminasi."}, "inspect": {"name": "Inspeksi akhir", "short": "Inspect", "device": "Inspeksi optik dan penampang (konseptual)", "explanation": "Periksa stand-off, open, bridge, coverage NCP, void, overflow, dan curing berdasarkan model.", "purpose": "Memahami dampak panas, gaya, waktu dan material terhadap kualitas bonding.", "issue": "PASS/FAIL bersifat estimasi heuristik, bukan inspeksi manufaktur nyata."}}, "zhTW": {"ncp": {"name": "NCP 點膠", "short": "NCP", "device": "可程式化非導電膠點膠機", "explanation": "在放置微凸塊晶粒之前，先將 NCP 點在加熱的封裝基板上。", "purpose": "在熱壓鍵合前，於微凸塊之間提供非導電膠。", "issue": "膠量不足容易形成空洞，過量則可能溢膠。"}, "pickup": {"name": "取晶與翻晶", "short": "翻晶", "device": "頂針與真空翻晶吸嘴", "explanation": "頂針協助晶粒脫離切割膠帶，真空吸嘴取晶後翻轉 180°，使微凸塊朝下。", "purpose": "讓微凸塊朝向基板焊墊，同時避免損壞晶粒。", "issue": "取放不當可能傷害微凸塊或矽晶粒。"}, "align": {"name": "光學對位", "short": "對位", "device": "視覺對位系統", "explanation": "TCB 貼合頭將晶粒移至已塗 NCP 的基板上方，使微凸塊對準焊墊。", "purpose": "盡量降低 X/Y 對位誤差。", "issue": "對位偏移可能造成開路或橋接。"}, "contact": {"name": "初始接觸", "short": "接觸", "device": "精密熱壓頭與加熱載台", "explanation": "倒裝晶粒靠近非導電膠與焊墊，NCP 開始擴散，微凸塊接觸基板。", "purpose": "在熱壓脈衝之前建立受控的初始接觸。", "issue": "接觸不均可能造成氣泡或覆蓋不足。"}, "bond": {"name": "熱壓鍵合", "short": "TCB", "device": "脈衝加熱熱壓頭（壓力、時間）", "explanation": "單一熱壓頭提供局部脈衝熱與持續壓力，載台加熱基板；微凸塊受壓形成接點，預塗 NCP 在間隙內擴散。", "purpose": "建立電性接點並控制接點高度及 NCP 分佈。", "issue": "熱量、壓力或時間不足可能接觸不良；過量可能傷晶或橋接。"}, "cure": {"name": "NCP 固化", "short": "固化", "device": "加熱載台／材料專用固化", "explanation": "以加熱完成晶粒與基板之間 NCP 的固化，沒有鍵合後毛細填膠步驟。", "purpose": "使 NCP 硬化，以提供接點機械支撐。", "issue": "固化不足會增加分層與可靠性風險。"}, "inspect": {"name": "最終檢查", "short": "檢查", "device": "光學／截面檢查（概念）", "explanation": "檢視估算出的接點高度、開路、橋接、NCP 覆蓋率、空洞、溢膠與固化狀況。", "purpose": "理解熱、機械與膠體參數對鍵合品質的影響。", "issue": "PASS/FAIL 僅為啟發式估算，並非量產實測。"}}} as const;
const PRESET_COPY = {"en": {"ideal": {"name": "Nominal TCB", "description": "Balanced local heat, pressure and NCP"}, "low": {"name": "Cold / short bond", "description": "Insufficient local heating and bonding dwell"}, "weak": {"name": "Insufficient pressure", "description": "Microbumps do not form reliable contact"}, "high": {"name": "Die damage / overforce", "description": "Excessive pressure on a small die"}, "misalign": {"name": "Misalignment", "description": "Large X/Y die-to-pad offset"}, "void": {"name": "NCP voids", "description": "Insufficient paste and high viscosity"}, "overflow": {"name": "NCP overflow", "description": "Excess paste and pressure"}, "cure": {"name": "Incomplete NCP cure", "description": "Insufficient curing temperature and time"}}, "id": {"ideal": {"name": "TCB nominal", "description": "Panas lokal, tekanan dan NCP seimbang"}, "low": {"name": "Bonding dingin / singkat", "description": "Panas lokal atau dwell tidak cukup"}, "weak": {"name": "Tekanan kurang", "description": "Kontak microbump tidak sempurna"}, "high": {"name": "Die rusak / overforce", "description": "Tekanan berlebihan pada die kecil"}, "misalign": {"name": "Misalignment", "description": "Offset X/Y berlebihan"}, "void": {"name": "Void NCP", "description": "Paste terlalu sedikit dan viskositas tinggi"}, "overflow": {"name": "NCP meluber", "description": "NCP terlalu banyak dan tekanan berlebihan"}, "cure": {"name": "Curing NCP kurang", "description": "Suhu dan waktu curing kurang"}}, "zhTW": {"ideal": {"name": "標準 TCB", "description": "局部加熱、壓力與 NCP 適當"}, "low": {"name": "低溫／短時間熱壓", "description": "局部加熱或保持時間不足"}, "weak": {"name": "壓力不足", "description": "微凸塊接觸不可靠"}, "high": {"name": "晶粒損壞／壓力過大", "description": "小晶粒承受過高壓力"}, "misalign": {"name": "對位偏移", "description": "X/Y 焊墊對位誤差過大"}, "void": {"name": "NCP 空洞", "description": "膠量不足且黏度過高"}, "overflow": {"name": "NCP 溢膠", "description": "膠量與壓力過大"}, "cure": {"name": "NCP 固化不足", "description": "固化溫度及時間不足"}}} as const;
function riskText(language: Language, value: 'Low' | 'Elevated' | 'High') {
  const t = UI_COPY[language];
  return value === 'Low' ? t.low : value === 'Elevated' ? t.elevated : t.high;
}

function iconForStage(index: number) {
  switch (index) {
    case 0: return <Settings2 size={16}/>;
    case 1: return <Layers size={16}/>;
    case 2: return <ScanLine size={16}/>;
    case 3: return <Move3D size={16}/>;
    case 4: return <Thermometer size={16}/>;
    case 5: return <Gauge size={16}/>;
    case 6: return <ScanLine size={16}/>;
    default: return <ScanLine size={16}/>;
  }
}

export default function Simulator({ initialLanguage = 'en' }: { initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [params, setParams] = useState<Parameters>(DEFAULT_PARAMS);
  const [preset, setPreset] = useState('ideal');
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [panelTab, setPanelTab] = useState<'process' | 'material'>('process');
  const [viewMode, setViewMode] = useState<ViewMode>('assembly');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [showLabels, setShowLabels] = useState(true);
  const [detailPanel, setDetailPanel] = useState<'engineering' | 'events' | null>(null);
  const [eventLog, setEventLog] = useState<{type:'init'|'reset'|'preset'|'stage';key?:string;index?:number}[]>([{type:'init'}]);
  const lastIndex = useRef(0);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.lang = language === 'zhTW' ? 'zh-TW' : language;
  }, [language]);

  const t = UI_COPY[language];
  const stageDefs = useMemo(() => STAGES.map(s => ({ ...s, ...STAGE_COPY[language][s.id] })), [language]);
  const presetDefs = useMemo(() => PRESETS.map(s => ({ ...s, ...((PRESET_COPY[language] as Record<string,{name:string;description:string}>)[s.key] || { name: s.name, description: s.description }) })), [language]);
  const sceneLabels = useMemo(() => ({ leftAssembly: t.sceneLeftAssembly, leftCross: t.sceneLeftCross, rightAssembly: t.sceneRightAssembly, rightCross: t.sceneRightCross }), [t]);
  const { index: stageIndex, progress } = locatePlayhead(playhead);
  const stage = stageDefs[stageIndex];
  const completed = playhead >= totalDuration;
  const cureFactor = stageIndex < 5 ? 1 : getCureFraction(params, stageIndex > 5 ? 1 : progress);
  const results = useMemo(() => computeResults(params, cureFactor, language), [params, cureFactor, language]);
  const projectedResults = useMemo(() => computeResults(params, getCureFraction(params, 1), language), [params, language]);
  const displayedResults: Results = stageIndex < 5 ? projectedResults : results;
  const currentTemp = stage.id === 'bond' ? Math.round(pulseTemperature(params,progress)) : stage.id === 'cure' ? temperatureAt(params,progress) : params.stageTemp;
  const curePercentage = stageIndex < 5 ? 0 : Math.round(getCureFraction(params, stageIndex === 5 ? progress : 1) * 100);

  function update<K extends keyof Parameters>(key: K, value: Parameters[K]) {
    setParams(old => ({ ...old, [key]: value }));
    setPreset('custom');
  }
  function addLog(message: (typeof eventLog)[number]) { setEventLog(old => [message, ...old].slice(0, 7)); }
  function selectPreset(key: string) {
    const found = PRESETS.find(item => item.key === key);
    const localized = presetDefs.find(item => item.key === key);
    if (!found) return;
    setParams({ ...DEFAULT_PARAMS, ...found.overrides });
    setPreset(key);
    setPlayhead(0);
    setPlaying(false);
    setViewMode('assembly');
    addLog({type:'preset',key});
  }
  function jump(index: number) {
    const i = clamp(index, 0, STAGES.length - 1);
    setPlayhead(elapsedStarts[i]);
    setPlaying(false);
    if (i < 4) setViewMode('assembly');
  }
  function reset() {
    setPlayhead(0);
    setPlaying(false);
    setViewMode('assembly');
    addLog({type:'reset'});
  }

  useEffect(() => {
    if (!playing) { lastTick.current = null; return; }
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = lastTick.current === null ? 0 : Math.min(.12, (now - lastTick.current) / 1000);
      lastTick.current = now;
      setPlayhead(prev => Math.min(totalDuration, prev + delta * speed));
    }, 33);
    return () => { window.clearInterval(timer); lastTick.current = null; };
  }, [playing, speed]);

  useEffect(() => {
    if (completed && playing) setPlaying(false);
  }, [completed, playing]);


  useEffect(() => {
    if (stageIndex !== lastIndex.current) {
      lastIndex.current = stageIndex;
      setEventLog(old => [{type:'stage' as const,index:stageIndex}, ...old].slice(0, 7));
    }
  }, [stageIndex]);

  const statusClass = displayedResults.status.toLowerCase();
  const statusIcon = displayedResults.status === 'PASS' ? <CheckCircle2 size={17}/> : <XCircle size={17}/>;

  return <div className="sim-frame" data-kind="tcb">
    <SuiteBar kind="tcb" language={language}/>
    <div className="app-shell">
    <header className="topbar">
      <div className="brand-group"><div className="brand-symbol"><Cpu size={22}/></div>
        <div><div className="brand-title">FLIP CHIP <span>TCB LAB</span></div><div className="brand-subtitle">{t.brandSubtitle}</div></div>
      </div>
      <div className="topbar-middle"><span className="live-pill"><span/> {t.simOnline}</span><span className="divider-dot">/</span><span>{t.pasteType}</span></div>
      <div className="topbar-right"><div className="lang-switch" role="group" aria-label={t.languageLabel}>
        {([{ code: 'en', name: 'English' }, { code: 'id', name: 'Bahasa Indonesia' }, { code: 'zhTW', name: '繁體中文（台灣）' }] as const).map(({ code, name }) =>
          <button key={code} type="button" className={language === code ? 'active' : ''} aria-pressed={language === code} aria-label={name} title={name} onClick={() => setLanguage(code)}><LanguageFlag language={code}/></button>
        )}
      </div><span className="model-pill"><Activity size={14}/> {t.educationalModel}</span></div>
    </header>

    <main className="workspace">
      <aside className="left-panel">
        <div className="aside-top"><span className="eyebrow">{t.workflow}</span><h2>{t.bondingProcess}</h2><p>{t.conventionalFaceUp}</p></div>
        <nav className="stage-list" aria-label={t.processStages}>
          {STAGES.map((step, i) => <button type="button" key={step.id} className={`stage-item ${i === stageIndex ? 'active' : ''} ${i < stageIndex ? 'finished' : ''}`} onClick={() => jump(i)}>
            <span className="stage-line" />
            <span className="stage-icon">{i < stageIndex ? <Check size={15}/> : iconForStage(i)}</span>
            <span className="stage-content"><span className="stage-num">{t.step} {String(i + 1).padStart(2, '0')}</span><strong>{stageDefs[i].short}</strong></span>
            {i === stageIndex && <span className="stage-active-dot" />}
          </button>)}
        </nav>
        <div className="aside-separator" />
        <div className="preset-section"><div className="section-title"><WandSparkles size={15}/> {t.processScenarios}</div>
          <div className="preset-list">{presetDefs.map(s => <button key={s.key} type="button" title={s.description} className={`preset-button ${preset === s.key ? 'selected' : ''}`} onClick={() => selectPreset(s.key)}><span className={`preset-dot ${s.key}`}/><span>{s.name}</span>{preset === s.key && <Check size={13}/>}</button>)}</div>
        </div>
        <div className="aside-notice"><CircleHelp size={18}/><span>{t.asideNotice}</span></div>
      </aside>

      <section className="center-column">
        <div className="viewport-panel">
          <div className="viewport-top">
            <div className="viewport-title"><span className="viewport-title-dot"/><div><span className="eyebrow">{t.liveProcessView}</span><h1>{stage.name}</h1></div></div>
            <div className="camera-select"><button aria-label={t.isoTitle} title={t.isoTitle} className={cameraPreset === 'iso' ? 'current' : ''} onClick={() => { setCameraPreset('iso'); setViewMode('assembly'); }}>{t.iso}</button><button title={t.topTitle} className={cameraPreset === 'top' ? 'current' : ''} onClick={() => { setCameraPreset('top'); setViewMode('assembly'); }}>{t.top}</button><button title={t.frontTitle} className={cameraPreset === 'front' ? 'current' : ''} onClick={() => { setCameraPreset('front'); setViewMode('assembly'); }}>{t.front}</button><button title={t.sideTitle} className={cameraPreset === 'side' ? 'current' : ''} onClick={() => { setCameraPreset('side'); setViewMode('assembly'); }}>{t.side}</button></div>
          </div>
          <div className="viewport-stage"><SimulationScene params={params} results={displayedResults} stage={stage.id as Stage} progress={progress} viewMode={viewMode} cameraPreset={cameraPreset} showLabels={showLabels} sceneLabels={sceneLabels}/>
            <div className="viewport-overlay-left"><div className="floating-stat"><div className="floating-label">{t.currentStep}</div><strong>{String(stageIndex + 1).padStart(2, '0')} <span>/ {String(STAGES.length).padStart(2,'0')}</span></strong></div><div className="floating-stat"><div className="floating-label">{t.stepProgress}</div><strong>{Math.round(progress * 100)}<span> %</span></strong></div></div>
            <div className="viewport-overlay-right"><span className="dimension-chip">{t.die} {formatNumber(params.dieWidth)} × {formatNumber(params.dieHeight)} mm</span><span className="dimension-chip">{t.laminate}</span>{(stage.id==='bond'||stage.id==='cure')&&<span className="dimension-chip"><Thermometer size={11}/> {currentTemp} °C</span>}</div>
            {stageIndex === 6 && <div className={`viewport-verdict ${statusClass}`} aria-live="polite">
              {statusIcon}<span><strong>{displayedResults.status}</strong><small>{displayedResults.issues.length === 0 ? t.allChecksSatisfied : t.failedChecks(displayedResults.issues.length)}</small>{displayedResults.issues.length>0&&<small>{displayedResults.issues.map(i=>i.title).join(' · ')}</small>}</span>
            </div>}
            {viewMode === 'cross' && <div className="cross-caption"><span>{t.sectionView}</span><b>{t.bltApprox} {formatNumber(displayedResults.standoff)} µm</b><small>{t.crossNote}</small></div>}
          </div>
          <div className="film-legend">{t.filmLegend}{stageIndex===6&&<span> · {t.nextBackend}</span>}</div><div className="viewport-bottom"><div className="view-buttons"><button className={viewMode === 'assembly' ? 'selected' : ''} onClick={() => setViewMode('assembly')}><Layers size={15}/> {t.assembly}</button><button className={viewMode === 'transparent' ? 'selected' : ''} onClick={() => setViewMode('transparent')}><Eye size={15}/> {t.transparent}</button><button disabled={stageIndex < 4} title={stageIndex < 4 ? t.crossSectionDisabled : t.inspectBonded} className={viewMode === 'cross' ? 'selected' : ''} onClick={() => setViewMode('cross')}><ScanLine size={15}/> {t.crossSection}</button></div><button title={showLabels?t.hideLabels:t.showLabels} className="label-toggle" onClick={() => setShowLabels(!showLabels)}><Eye size={14}/> {showLabels ? t.hideLabels : t.showLabels} {t.labels}</button></div>
        </div>

        <div className="playback-panel">
          <div className="playback-bar-top"><span><b>{t.processTimeline}</b><small>{t.step} {String(stageIndex + 1).padStart(2, '0')} / 07 · {stage.short.toUpperCase()}</small></span><span className="timer-text"><Clock3 size={14}/> {formatNumber(playhead, 1)}s / {formatNumber(totalDuration, 1)}s <span>{t.simTime}</span></span></div>
          <input className="timeline-range" aria-label={t.processTimeline} type="range" min="0" max={totalDuration} step="0.01" value={playhead} onChange={e => { const t = Number(e.target.value); setPlayhead(t); setPlaying(false); if (t < elapsedStarts[4]) setViewMode('assembly'); }} style={{ '--percent': `${playhead / totalDuration * 100}%` } as React.CSSProperties}/>
          <div className="timeline-markers">{stageDefs.map((s, i) => <button key={s.id} className={stageIndex === i ? 'current' : ''} onClick={() => jump(i)}>{s.short}</button>)}</div>
          <div className="player-controls"><div className="player-group"><button className="icon-button" title={t.previousStage} aria-label={t.previousStage} onClick={() => jump(stageIndex - 1)} disabled={stageIndex === 0 && progress === 0}><SkipBack size={17}/></button><button className="icon-button" title={t.reset} aria-label={t.reset} onClick={reset}><RotateCcw size={17}/></button><button className="play-btn" onClick={() => { if (completed) {setPlayhead(0);setViewMode('assembly');} setPlaying(!playing || completed); }}>{playing ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}{playing ? t.pauseSimulation : completed ? t.replaySimulation : t.runSimulation}</button><button className="icon-button" title={t.nextStage} aria-label={t.nextStage} onClick={() => jump(stageIndex + 1)} disabled={stageIndex === 6}><SkipForward size={17}/></button></div><div className="speed-control"><span>{t.speed}</span>{[.5, 1, 2, 4].map(n => <button key={n} className={speed === n ? 'current' : ''} onClick={() => setSpeed(n)}>{n}×</button>)}</div></div>
        </div>

        <div className="detail-tools" onKeyDown={e => { if (e.key === 'Escape') setDetailPanel(null); }}>
          <div className="detail-toolbar" aria-label={t.engineeringExplanation}>
            <button type="button" aria-expanded={detailPanel === 'engineering'} aria-controls="engineering-details" className={detailPanel === 'engineering' ? 'active' : ''} onClick={() => setDetailPanel(old => old === 'engineering' ? null : 'engineering')}><CircleHelp size={14}/> {t.engineeringExplanation} <ChevronDown size={13} className="detail-chevron"/></button>
            <button type="button" aria-expanded={detailPanel === 'events'} aria-controls="event-details" className={detailPanel === 'events' ? 'active' : ''} onClick={() => setDetailPanel(old => old === 'events' ? null : 'events')}><Activity size={14}/> {t.eventMonitor} <span className="detail-count">{eventLog.length}</span><ChevronDown size={13} className="detail-chevron"/></button>
          </div>
          {detailPanel === 'engineering' && <div className="detail-drawer" id="engineering-details"><article className="info-panel"><div className="info-heading"><span className="eyebrow">{t.engineeringExplanation.toUpperCase()}</span><span className="info-step">0{stageIndex + 1}</span></div><h3>{stage.name}</h3><p>{stage.explanation}</p><div className="info-line"><CheckCircle2 size={16}/><span>{stage.purpose}</span></div><div className="info-line caution"><AlertTriangle size={16}/><span>{stage.issue}</span></div><div className="equipment-tag"><Settings2 size={13}/> {stage.device}</div></article></div>}
          {detailPanel === 'events' && <div className="detail-drawer" id="event-details"><article className="log-panel"><div className="info-heading"><span className="eyebrow">{t.eventMonitor.toUpperCase()}</span><span className="log-running"><span/> {playing ? t.running : t.ready}</span></div><h3>{t.systemLog}</h3><div className="log-lines">{eventLog.map((s, i) => <div className="log-entry" key={i}><span>{i === 0 ? '›' : '·'}</span>{s.type==='init'?t.logInit:s.type==='reset'?t.logProcessReset:s.type==='preset'?t.logPresetLoaded(presetDefs.find(p=>p.key===s.key)?.name||''):t.logStage((s.index??0)+1,stageDefs[s.index??0].name)}</div>)}</div></article></div>}
        </div>
      </section>

      <aside className="right-panel"><div className="settings-head"><div><div className="eyebrow">{t.equipmentConfiguration}</div><h2>{t.processControls}</h2></div><SlidersHorizontal size={19}/></div>
        <div className="tabs"><button className={panelTab === 'process' ? 'active' : ''} onClick={() => setPanelTab('process')}>{t.process}</button><button className={panelTab === 'material' ? 'active' : ''} onClick={() => setPanelTab('material')}>{t.materialAndCure}</button></div>
        <div className="settings-scroll">
          {panelTab === 'process' ? <div className="input-stack">
            <div className="settings-section-label"><Layers size={14}/> {t.dieAndSubstrate}</div>
            <div className="double-controls"><RangeField label={t.dieWidth} value={params.dieWidth} onChange={v => update('dieWidth', v)} min={2} max={7} step={.25} unit="mm"/><RangeField label={t.dieLength} value={params.dieHeight} onChange={v => update('dieHeight', v)} min={2} max={7} step={.25} unit="mm"/></div>
            <div className="material-card"><p>{t.substrateType}</p></div>
            <RangeField label={t.waferThickness} value={params.waferThickness} onChange={v => update('waferThickness', v)} min={50} max={300} step={10} unit="µm"/>
            <div className="settings-divider"/><div className="settings-section-label"><Layers size={14}/> {t.dispensing}</div>
            <RangeField label={t.bumpDiameter} value={params.bumpDiameter} onChange={v => update('bumpDiameter', v)} min={50} max={160} step={5} unit="µm"/>
            <RangeField label={t.pitch} value={params.pitch} onChange={v => update('pitch', v)} min={150} max={400} step={10} unit="µm"/>
            <RangeField label={t.fluxAmount} value={params.ncpVolume} onChange={v => update('ncpVolume', v)} min={40} max={160} step={5} unit="%"/>
            <div className="settings-divider"/><div className="settings-section-label"><Crosshair size={14}/> {t.placement}</div>
            <RangeField label={t.bondingForce} value={params.force} onChange={v => update('force', v)} min={.5} max={12} step={.5} unit="N"/>
            <RangeField label={t.xPlacementOffset} value={params.offsetX} onChange={v => update('offsetX', v)} min={-250} max={250} step={5} unit="µm"/>
            <RangeField label={t.yPlacementOffset} value={params.offsetY} onChange={v => update('offsetY', v)} min={-250} max={250} step={5} unit="µm"/>
          </div> : <div className="input-stack">
            <div className="settings-section-label"><Thermometer size={14}/> {t.reflowRecipe}</div>
            <RangeField label={t.cleaning} value={params.stageTemp} onChange={v => update('stageTemp', v)} min={50} max={150} step={5} unit="°C"/>
            <RangeField label={t.peakTemp} value={params.headTemp} onChange={v => update('headTemp', v)} min={180} max={350} step={5} unit="°C"/>
            <RangeField label={t.tal} value={params.dwell} onChange={v => update('dwell', v)} min={.5} max={10} step={.5} unit="s"/>
            <div className="settings-divider"/><div className="settings-section-label"><Droplets size={14}/> {t.underfill}</div>
            <RangeField label={t.viscosity} value={params.viscosity} onChange={v => update('viscosity', v)} min={1} max={12} step={.5} unit="Pa·s"/>
            <div className="settings-divider"/><div className="settings-section-label"><Thermometer size={14}/> {t.curingRecipe}</div>
            <RangeField label={t.cureTemperature} value={params.cureTemp} onChange={v => update('cureTemp', v)} min={100} max={210} step={5} unit="°C"/>
            <RangeField label={t.cureDuration} value={params.cureTime} onChange={v => update('cureTime', v)} min={10} max={90} step={5} unit="min"/>
            <div className="material-card"><CircleHelp size={17}/><p>{t.thermalNote}</p></div>
            <div className="settings-divider"/><div className="settings-section-label"><Gauge size={14}/> {t.liveCuringReadout}</div>
            <div className="live-readouts"><div><span>{t.chamberTemp}</span><strong>{currentTemp} °C</strong></div><div><span>{t.estimatedCure}</span><strong>{curePercentage}%</strong></div></div>
            <div className="cure-progress"><span style={{ width: `${curePercentage}%` }}/></div>
          </div>}
        </div>
        <div className="results-panel"><div className="results-heading"><div><span className="eyebrow">{t.modeledOutputs}</span><h2>{t.bondQuality}</h2></div><span className={`status-chip ${statusClass}`}>{statusIcon} {displayedResults.status}</span></div>
          <div className="metrics-grid"><Metric label={t.metricBLT} value={displayedResults.standoff} unit="µm" detail={t.metricEstimatedFilmGap} severity={displayedResults.issues.some(x => x.code === 'opens') ? 'bad' : 'good'}/><Metric label={t.metricCoverage} value={displayedResults.coverage} unit="%" detail={t.metricEstimatedDieArea} severity={displayedResults.issues.some(x => x.code === 'coverage') ? 'bad' : 'good'}/><Metric label={t.metricFillet} value={displayedResults.bridge} unit="%" detail={t.metricSqueezeOut} severity={displayedResults.issues.some(x => x.code === 'bridge') ? 'bad' : 'good'}/><Metric label={t.metricPlacementError} value={displayedResults.placementError} unit="µm" detail={t.metricXYDeviation} severity={displayedResults.issues.some(x => x.code === 'placement') ? 'bad' : 'good'}/><Metric label={t.metricOpens} value={displayedResults.opens} unit="%" detail={t.metricHeuristicOnly} severity={displayedResults.issues.some(x => x.code === 'opens') ? 'bad' : 'good'}/><Metric label={t.metricVoids} value={displayedResults.voids} unit="%" detail={t.metricHeuristicOnly} severity={displayedResults.issues.some(x => x.code === 'voids') ? 'bad' : 'good'}/><Metric label={t.metricResidue} value={displayedResults.overflow} unit="%" detail={t.metricHeuristicOnly} severity={displayedResults.issues.some(x=>x.code==='overflow')?'bad':'good'}/></div>
          <div className="risk-row"><span>{t.bleedRisk}</span><strong className={displayedResults.damage.toLowerCase()}>{riskText(language, displayedResults.damage)}</strong><span>{t.delamination}</span><strong className={displayedResults.delamination.toLowerCase()}>{riskText(language, displayedResults.delamination)}</strong></div>
          <section className={`inspection-summary ${statusClass}`} aria-label={t.inspectionVerdict} aria-live="polite">
            <div className="inspection-summary-head">{statusIcon}<div><strong>{displayedResults.status === 'PASS' ? t.passSuccessful : t.failUnsuccessful}</strong><span>{displayedResults.issues.length === 0 ? t.passAllParams : t.failParamCount(displayedResults.issues.length)}</span></div></div>
            {displayedResults.issues.length > 0 ? <ul className="issue-list">{displayedResults.issues.map(issue => <li key={issue.code}><strong>{issue.title}</strong><span>{issue.detail}</span></li>)}</ul> : <p className="pass-detail">{t.passDetail}</p>}
          </section>
          <div className="disclaimer">{stageIndex < 5 ? t.projectedAfterFullCure : stageIndex === 5 ? t.cureInProgress : ''}{t.disclaimer}</div>
        </div>
      </aside>
    </main>
    <footer className="app-footer"><span><Zap size={12}/> FLIP CHIP TCB LAB</span><span>{t.footerProcess}</span><span>{t.footerModel}</span></footer>
    </div>
  </div>;
}
