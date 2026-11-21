'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SuiteBar from '@/components/SuiteBar';
import LanguageFlag from '@/simulators/paste/components/LanguageFlag';
import {
  Activity, AlertTriangle, Check, CheckCircle2, ChevronDown,
  CircleHelp, ClipboardList, Clock3, Cpu, Crosshair, Droplets,
  Eye, Gauge, Layers, Maximize2, Move3D, Pause, Play, RotateCcw,
  ScanLine, Settings2, SkipBack, SkipForward, SlidersHorizontal,
  Thermometer, Timer, WandSparkles, XCircle, Zap
} from 'lucide-react';
import {
  CameraPreset, clamp, computeResults, DEFAULT_PARAMS, getCureFraction,
  Parameters, PRESETS, Results, STAGES, Stage, temperatureAt, ViewMode, Locale
} from '@/simulators/paste/lib/simulation';

const SimulationScene = dynamic(() => import('@/simulators/paste/components/SimulationScene'), {
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
    loadingScene: 'Menyiapkan viewport proses 3D…',
    brandSubtitle: 'Perakitan semikonduktor · Kembaran digital interaktif',
    simOnline: 'SIMULASI ONLINE',
    pasteType: 'ADHESIVE TIPE PASTE',
    educationalModel: 'MODEL EDUKATIF',
    workflow: 'ALUR / 01',
    bondingProcess: 'Proses bonding',
    conventionalFaceUp: 'Die attach konvensional · Face up',
    processStages: 'Tahapan proses',
    processScenarios: 'SKENARIO PROSES',
    asideNotice: 'Coba preset Excess Epoxy atau Die Tilt, lalu bandingkan section view dan indikator kualitas.',
    liveProcessView: 'TAMPILAN PROSES LANGSUNG',
    currentStep: 'STEP SAAT INI',
    stepProgress: 'PROGRES STEP',
    cuLeadframe: 'Leadframe Cu',
    laminate: 'Laminate',
    allChecksSatisfied: 'Seluruh pemeriksaan inspeksi lolos',
    failedChecks: (n:number)=> `${n} pemeriksaan inspeksi gagal`,
    sectionView: 'SECTION VIEW',
    bltApprox: 'Bond Line Thickness ≈',
    crossNote: 'Celah adhesive dan die tilt dibesarkan agar lebih mudah dilihat.',
    assembly: 'Assembly',
    transparent: 'Transparan',
    crossSection: 'Cross-section',
    crossSectionDisabled: 'Cross-section tersedia saat placement',
    inspectBonded: 'Periksa adhesive yang sudah dibonding',
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
    materialAndCure: 'Material & Cure',
    dieAndSubstrate: 'DIE & SUBSTRATE',
    dieWidth: 'Lebar die',
    dieLength: 'Panjang die',
    substrateType: 'Tipe substrate',
    copperLeadframe: 'Leadframe tembaga',
    organicLaminate: 'Laminate organik',
    dispensing: 'DISPENSING',
    dispensePattern: 'Pola dispense',
    singleDot: 'Satu titik',
    fiveDot: 'Lima titik',
    xPattern: 'Pola X',
    epoxyVolume: 'Volume epoxy',
    epoxyVolumeHint: 'Total volume adhesive yang didepositkan. 1 nL = 0.001 mm³.',
    nozzleGap: 'Jarak nozzle',
    dispenseImbalance: 'Ketidakseimbangan dispense',
    imbalanceHint: 'Faktor asimetri sederhana untuk memperkirakan die tilt.',
    placement: 'PLACEMENT',
    bondingForce: 'Bonding force',
    xPlacementOffset: 'Offset placement X',
    yPlacementOffset: 'Offset placement Y',
    targetBLT: 'Target BLT',
    epoxyProperties: 'PROPERTI EPOXY',
    adhesivePreset: 'Preset adhesive',
    thermalEpoxy: 'Epoxy thermal-cure',
    uvEdgeAdhesive: 'Adhesive UV edge-access (ilustratif)',
    adhesiveHint: 'Contoh UV mengasumsikan adhesive yang kompatibel UV dan jalur cahaya pada tepi adhesive yang terbuka. UV tidak menembus silikon opak.',
    epoxyViscosity: 'Viskositas epoxy',
    curingRecipe: 'RESEP CURING',
    cureMode: 'Mode curing',
    thermalCure: 'Thermal cure (epoxy)',
    uvCure: 'UV edge-access cure',
    cureTemperature: 'Suhu curing',
    cureDuration: 'Durasi curing',
    thermalNote: 'Thermal curing ditampilkan dalam waktu dipercepat. Nilai recipe bersifat ilustratif dan harus divalidasi dengan spesifikasi pemasok adhesive.',
    uvNote: 'Contoh UV mewakili adhesive yang kompatibel dan disinari dari tepi yang dapat dijangkau cahaya. Ini tidak menunjukkan cahaya menembus silikon opak.',
    liveCuringReadout: 'PEMBACAAN CURING LANGSUNG',
    chamberTemp: 'Suhu chamber',
    estimatedCure: 'Estimasi cure',
    modeledOutputs: 'OUTPUT TERHITUNG',
    bondQuality: 'Kualitas bonding',
    metricEstimatedFilmGap: 'Perkiraan celah film',
    metricEstimatedDieArea: 'Perkiraan area die',
    metricSqueezeOut: 'Perkiraan squeeze-out',
    metricXYDeviation: 'Deviasi X/Y',
    metricSimplifiedTilt: 'Tilt sederhana',
    metricHeuristicOnly: 'Hanya heuristik',
    metricBLT: 'BOND LINE THICKNESS',
    metricCoverage: 'ADHESIVE COVERAGE',
    metricFillet: 'FILLET WIDTH',
    metricPlacementError: 'PLACEMENT ERROR',
    metricTilt: 'DIE TILT',
    metricVoids: 'ESTIMATED VOIDS',
    bleedRisk: 'RISIKO BLEED',
    delamination: 'DELAMINATION',
    low: 'Rendah', elevated: 'Sedang', high: 'Tinggi',
    inspectionVerdict: 'Verdict inspeksi',
    passSuccessful: 'PASS — Bonding berhasil',
    failUnsuccessful: 'FAIL — Bonding gagal',
    passAllParams: 'Semua parameter lolos batas simulasi.',
    failParamCount: (n:number)=> `${n} parameter tidak memenuhi batas simulasi.`,
    passDetail: 'Coverage, BLT, fillet, placement, tilt, void, dan curing memenuhi batas edukatif yang ditentukan.',
    projectedAfterFullCure: 'Diproyeksikan setelah full cure. ',
    cureInProgress: 'Curing masih berlangsung. ',
    disclaimer: 'PASS/FAIL dan semua nilai adalah estimasi edukatif—bukan batas kualifikasi industri.',
    footerProcess: 'PROSES: DISPENSE → PICK → ALIGN → PLACE → CURE → INSPECT',
    footerModel: 'MODEL SIMULASI v1.6 · KHUSUS EDUKASI',
    languageLabel: 'Bahasa',
    sceneLeftAssembly: 'ASSEMBLY · PROSEDURAL 3D',
    sceneLeftCross: 'SECTION VIEW · CELAH ADHESIVE DIBESARKAN',
    sceneRightAssembly: 'GESER UNTUK ORBIT · SCROLL UNTUK ZOOM',
    sceneRightCross: 'INSPEKSI BLT / FILLET',
    logInit: 'Simulasi diinisialisasi · Siap melakukan dispense epoxy',
    logPresetLoaded: (name:string)=> `Preset dimuat · ${name}`,
    logProcessReset: 'Proses direset · Step 01',
    logStage: (n:number, name:string)=> `Step ${String(n).padStart(2,'0')} · ${name}`,
  },
  en: {
    loadingScene: 'Preparing 3D process viewport…',
    brandSubtitle: 'Semiconductor assembly · Interactive digital twin',
    simOnline: 'SIMULATION ONLINE',
    pasteType: 'PASTE TYPE ADHESIVE', educationalModel: 'EDUCATIONAL MODEL', workflow: 'WORKFLOW / 01', bondingProcess: 'Bonding process', conventionalFaceUp: 'Conventional die attach · Face up', processStages: 'Process stages', processScenarios: 'PROCESS SCENARIOS', asideNotice: 'Try the Excess Epoxy or Die Tilt preset, then compare the section view and quality indicators.', liveProcessView: 'LIVE PROCESS VIEW', currentStep: 'CURRENT STEP', stepProgress: 'STEP PROGRESS', cuLeadframe: 'Cu Leadframe', laminate: 'Laminate', allChecksSatisfied: 'All inspection checks satisfied', failedChecks: (n:number)=> `${n} failed inspection check${n !== 1 ? 's' : ''}`, sectionView: 'SECTION VIEW', bltApprox: 'Bond Line Thickness ≈', crossNote: 'The adhesive gap and die tilt are exaggerated for visibility.', assembly: 'Assembly', transparent: 'Transparent', crossSection: 'Cross-section', crossSectionDisabled: 'Cross-section becomes available during placement', inspectBonded: 'Inspect the bonded adhesive', hideLabels: 'Hide', showLabels: 'Show', labels: 'labels', processTimeline: 'PROCESS TIMELINE', simTime: 'SIM TIME', previousStage: 'Previous stage', reset: 'Reset', runSimulation: 'Run Simulation', pauseSimulation: 'Pause Simulation', replaySimulation: 'Replay Simulation', nextStage: 'Next stage', speed: 'SPEED', engineeringExplanation: 'Engineering Explanation', eventMonitor: 'Event Monitor', running: 'RUNNING', ready: 'READY', systemLog: 'System log', equipmentConfiguration: 'EQUIPMENT CONFIGURATION', processControls: 'Process controls', process: 'Process', materialAndCure: 'Material & Cure', dieAndSubstrate: 'DIE & SUBSTRATE', dieWidth: 'Die width', dieLength: 'Die length', substrateType: 'Substrate type', copperLeadframe: 'Copper leadframe', organicLaminate: 'Organic laminate', dispensing: 'DISPENSING', dispensePattern: 'Dispense pattern', singleDot: 'Single Dot', fiveDot: 'Five Dot', xPattern: 'X Pattern', epoxyVolume: 'Epoxy volume', epoxyVolumeHint: 'Total deposited adhesive volume. 1 nL = 0.001 mm³.', nozzleGap: 'Nozzle gap', dispenseImbalance: 'Dispense imbalance', imbalanceHint: 'Simplified asymmetry factor used to estimate die tilt.', placement: 'PLACEMENT', bondingForce: 'Bonding force', xPlacementOffset: 'X placement offset', yPlacementOffset: 'Y placement offset', targetBLT: 'Target BLT', epoxyProperties: 'EPOXY PROPERTIES', adhesivePreset: 'Adhesive preset', thermalEpoxy: 'Thermal-cure epoxy', uvEdgeAdhesive: 'UV edge-access adhesive (illustrative)', adhesiveHint: 'The UV example assumes a UV-compatible adhesive and a light path at the exposed adhesive edge. UV does not pass through opaque silicon.', epoxyViscosity: 'Epoxy viscosity', curingRecipe: 'CURING RECIPE', cureMode: 'Cure mode', thermalCure: 'Thermal cure (epoxy)', uvCure: 'UV edge-access cure', cureTemperature: 'Cure temperature', cureDuration: 'Cure duration', thermalNote: 'Thermal curing is shown in accelerated time. Recipe values are illustrative and must be validated against the adhesive supplier’s specification.', uvNote: 'The optional UV example represents a compatible adhesive cured at a light-accessible edge. It does not depict light passing through the opaque silicon die.', liveCuringReadout: 'LIVE CURING READOUT', chamberTemp: 'Chamber temp.', estimatedCure: 'Estimated cure', modeledOutputs: 'MODELED OUTPUTS', bondQuality: 'Bond quality', metricEstimatedFilmGap: 'Estimated film gap', metricEstimatedDieArea: 'Estimated die area', metricSqueezeOut: 'Modeled squeeze-out', metricXYDeviation: 'X/Y deviation', metricSimplifiedTilt: 'Simplified tilt', metricHeuristicOnly: 'Heuristic only', metricBLT: 'BOND LINE THICKNESS', metricCoverage: 'ADHESIVE COVERAGE', metricFillet: 'FILLET WIDTH', metricPlacementError: 'PLACEMENT ERROR', metricTilt: 'DIE TILT', metricVoids: 'ESTIMATED VOIDS', bleedRisk: 'BLEED RISK', delamination: 'DELAMINATION', low: 'Low', elevated: 'Elevated', high: 'High', inspectionVerdict: 'Inspection verdict', passSuccessful: 'PASS — Bonding successful', failUnsuccessful: 'FAIL — Bonding unsuccessful', passAllParams: 'All parameters satisfy the simulation limits.', failParamCount: (n:number)=> `${n} parameter${n !== 1 ? 's' : ''} failed the simulation limits.`, passDetail: 'Coverage, BLT, fillet, placement, tilt, voids, and curing all satisfy the defined educational limits.', projectedAfterFullCure: 'Projected after full cure. ', cureInProgress: 'Cure is still in progress. ', disclaimer: 'PASS/FAIL and all measurements are educational estimates—not industrial qualification limits.', footerProcess: 'PROCESS: DISPENSE → PICK → ALIGN → PLACE → CURE → INSPECT', footerModel: 'SIMULATION MODEL v1.6 · EDUCATIONAL ONLY', languageLabel: 'Language', sceneLeftAssembly: 'ASSEMBLY · PROCEDURAL 3D', sceneLeftCross: 'SECTION VIEW · ADHESIVE GAP EXAGGERATED', sceneRightAssembly: 'DRAG TO ORBIT · SCROLL TO ZOOM', sceneRightCross: 'BLT / FILLET INSPECTION', logInit: 'Simulation initialized · Ready to dispense epoxy', logPresetLoaded: (name:string)=> `Preset loaded · ${name}`, logProcessReset: 'Process reset · Stage 01', logStage: (n:number, name:string)=> `Stage ${String(n).padStart(2,'0')} · ${name}`,
  },
  zhTW: {
    loadingScene: '正在準備 3D 製程視窗…', brandSubtitle: '半導體封裝組裝 · 互動式數位分身', simOnline: '模擬上線中', pasteType: 'PASTE 類型黏著劑', educationalModel: '教學模型', workflow: '流程 / 01', bondingProcess: '鍵合流程', conventionalFaceUp: '傳統晶粒貼裝 · 正面朝上', processStages: '流程階段', processScenarios: '製程情境', asideNotice: '可試試 Excess Epoxy 或 Die Tilt 預設，再比較截面視圖與品質指標。', liveProcessView: '即時製程視圖', currentStep: '目前步驟', stepProgress: '步驟進度', cuLeadframe: '銅導線架', laminate: '基板', allChecksSatisfied: '所有檢查皆通過', failedChecks: (n:number)=> `${n} 項檢查未通過`, sectionView: '截面視圖', bltApprox: '鍵合層厚度 ≈', crossNote: '為了方便觀察，黏著層間隙與晶粒傾斜已放大顯示。', assembly: '組裝', transparent: '透明', crossSection: '截面', crossSectionDisabled: '截面模式會在貼裝階段後開放', inspectBonded: '檢視已鍵合的黏著層', hideLabels: '隱藏', showLabels: '顯示', labels: '標籤', processTimeline: '製程時間軸', simTime: '模擬時間', previousStage: '上一階段', reset: '重設', runSimulation: '執行模擬', pauseSimulation: '暫停模擬', replaySimulation: '重新播放', nextStage: '下一階段', speed: '速度', engineeringExplanation: '工程說明', eventMonitor: '事件監控', running: '執行中', ready: '就緒', systemLog: '系統紀錄', equipmentConfiguration: '設備設定', processControls: '流程控制', process: '流程', materialAndCure: '材料與固化', dieAndSubstrate: '晶粒與基板', dieWidth: '晶粒寬度', dieLength: '晶粒長度', substrateType: '基板類型', copperLeadframe: '銅導線架', organicLaminate: '有機基板', dispensing: '點膠', dispensePattern: '點膠圖樣', singleDot: '單點', fiveDot: '五點', xPattern: 'X 形圖樣', epoxyVolume: '環氧膠量', epoxyVolumeHint: '總點膠量。1 nL = 0.001 mm³。', nozzleGap: '噴嘴間隙', dispenseImbalance: '點膠不均', imbalanceHint: '用於估算晶粒傾斜的簡化不對稱因子。', placement: '貼裝', bondingForce: '貼裝壓力', xPlacementOffset: 'X 貼裝偏移', yPlacementOffset: 'Y 貼裝偏移', targetBLT: '目標 BLT', epoxyProperties: '環氧膠特性', adhesivePreset: '黏著劑預設', thermalEpoxy: '熱固化環氧膠', uvEdgeAdhesive: 'UV 邊緣照射黏著劑（示意）', adhesiveHint: 'UV 範例假設使用可 UV 固化黏著劑，且光線可從外露膠邊照射。UV 不會穿透不透明矽晶粒。', epoxyViscosity: '環氧膠黏度', curingRecipe: '固化條件', cureMode: '固化模式', thermalCure: '熱固化（epoxy）', uvCure: 'UV 邊緣固化', cureTemperature: '固化溫度', cureDuration: '固化時間', thermalNote: '熱固化以加速時間顯示。配方數值僅供教學示意，實際上需依黏著劑供應商規格驗證。', uvNote: '此 UV 範例表示可從可照射邊緣進行固化的相容黏著劑，不表示 UV 光可穿透不透明矽晶粒。', liveCuringReadout: '即時固化讀值', chamberTemp: '腔體溫度', estimatedCure: '估計固化率', modeledOutputs: '模擬輸出', bondQuality: '鍵合品質', metricEstimatedFilmGap: '估計膠層間隙', metricEstimatedDieArea: '估計晶粒覆蓋面積', metricSqueezeOut: '模擬溢膠', metricXYDeviation: 'X/Y 偏差', metricSimplifiedTilt: '簡化傾斜', metricHeuristicOnly: '僅為啟發式估算', metricBLT: '鍵合層厚度', metricCoverage: '膠體覆蓋率', metricFillet: '膠邊寬度', metricPlacementError: '貼裝誤差', metricTilt: '晶粒傾斜', metricVoids: '估計空洞率', bleedRisk: '溢膠風險', delamination: '分層風險', low: '低', elevated: '中', high: '高', inspectionVerdict: '檢查結果', passSuccessful: 'PASS — 鍵合成功', failUnsuccessful: 'FAIL — 鍵合失敗', passAllParams: '所有參數皆符合模擬限制。', failParamCount: (n:number)=> `${n} 項參數不符合模擬限制。`, passDetail: '覆蓋率、BLT、膠邊、貼裝、傾斜、空洞與固化皆符合設定的教學限制。', projectedAfterFullCure: '以下為完全固化後之預估。', cureInProgress: '固化仍在進行中。 ', disclaimer: 'PASS/FAIL 與所有數值皆為教學估算，並非工業量產品質判定標準。', footerProcess: '流程：點膠 → 取晶 → 對位 → 貼裝 → 固化 → 檢查', footerModel: '模擬模型 v1.6 · 僅供教學使用', languageLabel: '語言', sceneLeftAssembly: '組裝 · 程序化 3D', sceneLeftCross: '截面視圖 · 黏著層間隙已放大', sceneRightAssembly: '拖曳旋轉 · 滾輪縮放', sceneRightCross: 'BLT / 膠邊檢查', logInit: '模擬已初始化 · 可開始點膠', logPresetLoaded: (name:string)=> `已載入預設 · ${name}`, logProcessReset: '流程已重設 · Step 01', logStage: (n:number, name:string)=> `步驟 ${String(n).padStart(2,'0')} · ${name}`,
  },
} as const;

const STAGE_COPY: Record<Language, Record<Stage, { name: string; short: string; device: string; explanation: string; purpose: string; issue: string }>> = {
  id: {
    dispense: { name: 'Dispensing Epoxy', short: 'Dispense', device: 'Nozzle dispensing terprogram', explanation: 'Nozzle mendepositkan epoxy paste ke die pad substrate mengikuti pola dispensing yang dapat diprogram.', purpose: 'Memberikan volume dan distribusi adhesive yang konsisten sebelum die ditempatkan.', issue: 'Volume atau pola yang salah dapat menyebabkan coverage buruk, fillet berlebih, atau adhesive bleed.' },
    pickup: { name: 'Pick-up Die', short: 'Pick', device: 'Wafer tape, ejector pin, vacuum collet', explanation: 'Ejector pin mengangkat die baik dari dicing tape, lalu vacuum collet mengambilnya dengan sisi aktif tetap menghadap ke atas.', purpose: 'Memindahkan die yang dipilih tanpa merusak atau mengkontaminasi permukaannya.', issue: 'Gaya pick-up yang salah dapat menyebabkan chipping atau die terlepas.' },
    align: { name: 'Optical Alignment', short: 'Align', device: 'Kamera vision dan motion stage presisi', explanation: 'Bond head memindahkan die ke atas target dan menyelaraskannya terhadap die pad menggunakan reference mark.', purpose: 'Meminimalkan error penempatan X/Y sebelum die menyentuh epoxy.', issue: 'Offset placement dapat mengurangi edge clearance dan yield perakitan berikutnya.' },
    place: { name: 'Placement & Spreading', short: 'Place', device: 'Bonding head servo-controlled', explanation: 'Die menyentuh dan menekan epoxy. Paste menyebar di bawah die dan dapat membentuk fillet di sekeliling tepinya.', purpose: 'Menciptakan bond line thickness, coverage, dan koneksi mekanik yang terkontrol.', issue: 'Coverage kurang, bleed berlebih, BLT tidak merata, dan die tilt adalah risiko proses utama.' },
    cure: { name: 'Adhesive Curing', short: 'Cure', device: 'Stasiun curing dengan kontrol suhu', explanation: 'Energi panas atau paparan UV yang kompatibel mengeraskan adhesive dalam visualisasi edukatif yang dipercepat ini.', purpose: 'Membentuk ikatan yang tahan lama dengan mengeringkan adhesive menggunakan proses yang sesuai material.', issue: 'Curing yang tidak memadai dapat mengurangi adhesi dan keandalan jangka panjang.' },
    inspect: { name: 'Final Inspection', short: 'Inspect', device: 'Inspeksi optik dan simulasi cross-section', explanation: 'Periksa hasil die attach yang sudah selesai dan tinjau BLT, placement error, fillet, dan indikator defect yang termodelkan.', purpose: 'Memahami bagaimana input proses memengaruhi hasil bonding yang diestimasi.', issue: 'Persentase void dan risiko delaminasi yang ditampilkan adalah estimasi heuristik, bukan hasil pengukuran inspeksi nyata.' },
  },
  en: Object.fromEntries(STAGES.map(s => [s.id, { name: s.name, short: s.short, device: s.device, explanation: s.explanation, purpose: s.purpose, issue: s.issue }])) as any,
  zhTW: {
    dispense: { name: '環氧膠點膠', short: '點膠', device: '可程式化點膠噴嘴', explanation: '噴嘴依照可程式化點膠圖樣，將環氧膠點在基板的 die pad 上。', purpose: '在貼裝晶粒前提供穩定一致的膠量與分佈。', issue: '若膠量或圖樣不正確，可能造成覆蓋不足、膠邊過大或溢膠。' },
    pickup: { name: '晶粒取件', short: '取晶', device: '晶圓膠帶、頂針、真空吸嘴', explanation: '頂針先將良品晶粒從切割膠帶頂起，再由真空吸嘴以主動面朝上的方式取走。', purpose: '在不損傷或污染晶粒表面的前提下移動選定晶粒。', issue: '取件力量不當可能造成崩邊或掉晶。' },
    align: { name: '光學對位', short: '對位', device: '視覺相機與高精度移動平台', explanation: '貼裝頭將晶粒移動到目標上方，並利用對位標記將其對準 die pad。', purpose: '在晶粒接觸膠體前，將 X/Y 貼裝誤差降到最低。', issue: '貼裝偏移會降低邊界間距，並影響後續組裝良率。' },
    place: { name: '貼裝與擴散', short: '貼裝', device: '伺服控制貼裝頭', explanation: '晶粒接觸並壓縮膠體，膠料在晶粒下方擴散，並可能在邊緣形成膠邊。', purpose: '建立可控的鍵合層厚度、覆蓋率與穩定的機械連接。', issue: '覆蓋不足、溢膠、BLT 不均與晶粒傾斜是主要製程風險。' },
    cure: { name: '黏著劑固化', short: '固化', device: '溫控固化站', explanation: '在此加速的教學視覺化中，以熱能或相容 UV 曝光讓黏著劑硬化。', purpose: '透過適合材料的固化流程，建立耐久的鍵合。', issue: '固化不足可能降低黏著力與長期可靠度。' },
    inspect: { name: '最終檢查', short: '檢查', device: '光學與模擬截面檢查', explanation: '檢查完成的 die attach，並查看模擬出的 BLT、貼裝誤差、膠邊與缺陷指標。', purpose: '了解製程輸入如何影響估算出的鍵合結果。', issue: '此處顯示的空洞率與分層風險為啟發式估算，並非實測檢查結果。' },
  },
};

const PRESET_COPY: Record<Language, Record<string, { name: string; description: string }>> = {
  id: { ideal: { name: 'Proses Nominal', description: 'Dispensing, alignment, dan bond force seimbang' }, low: { name: 'Epoxy Kurang', description: 'Volume adhesive rendah menghasilkan coverage yang tidak lengkap' }, high: { name: 'Epoxy Berlebih', description: 'Adhesive berlebih meluas di luar area die yang diinginkan' }, misalign: { name: 'Misalignment', description: 'Offset X/Y sengaja ditambahkan' }, tilt: { name: 'Die Tilt', description: 'Asimetri dispensing kuat menciptakan bonding tidak merata' }, void: { name: 'Potensi Void', description: 'Viskositas tinggi dan force rendah meningkatkan indikator void' } },
  en: { ideal: { name: 'Nominal Process', description: 'Balanced dispensing, alignment and bond force' }, low: { name: 'Insufficient Epoxy', description: 'Low adhesive volume results in incomplete coverage' }, high: { name: 'Excess Epoxy', description: 'Excess adhesive expands beyond the intended die region' }, misalign: { name: 'Misalignment', description: 'X/Y offset is introduced deliberately' }, tilt: { name: 'Die Tilt', description: 'Strong dispensing asymmetry creates uneven bonding' }, void: { name: 'Potential Voids', description: 'High viscosity and low force increase void indicators' } },
  zhTW: { ideal: { name: '標準製程', description: '點膠、對位與貼裝壓力皆平衡' }, low: { name: '膠量不足', description: '膠量過低導致覆蓋不完全' }, high: { name: '膠量過多', description: '過多膠體擴散到預期晶粒區域之外' }, misalign: { name: '對位偏移', description: '故意加入 X/Y 偏移' }, tilt: { name: '晶粒傾斜', description: '點膠不對稱造成鍵合不均' }, void: { name: '空洞風險', description: '高黏度與低壓力會提高空洞指標' } },
};

function riskText(language: Language, value: 'Low' | 'Elevated' | 'High') {
  const t = UI_COPY[language];
  return value === 'Low' ? t.low : value === 'Elevated' ? t.elevated : t.high;
}

function iconForStage(index: number) {
  switch (index) {
    case 0: return <Droplets size={16}/>;
    case 1: return <Layers size={16}/>;
    case 2: return <Crosshair size={16}/>;
    case 3: return <Move3D size={16}/>;
    case 4: return <Thermometer size={16}/>;
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
  const [eventLog, setEventLog] = useState<string[]>([]);
  const lastIndex = useRef(0);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.lang = language === 'zhTW' ? 'zh-TW' : language;
  }, [language]);

  const t = UI_COPY[language];
  const stageDefs = useMemo(() => STAGES.map(s => ({ ...s, ...STAGE_COPY[language][s.id] })), [language]);
  const presetDefs = useMemo(() => PRESETS.map(s => ({ ...s, ...(PRESET_COPY[language][s.key] || { name: s.name, description: s.description }) })), [language]);
  const sceneLabels = useMemo(() => ({ leftAssembly: t.sceneLeftAssembly, leftCross: t.sceneLeftCross, rightAssembly: t.sceneRightAssembly, rightCross: t.sceneRightCross }), [t]);
  const { index: stageIndex, progress } = locatePlayhead(playhead);
  const stage = stageDefs[stageIndex];
  const completed = playhead >= totalDuration;
  const cureFactor = stageIndex < 4 ? 1 : getCureFraction(params, stageIndex > 4 ? 1 : progress);
  const results = useMemo(() => computeResults(params, cureFactor, language), [params, cureFactor, language]);
  const projectedResults = useMemo(() => computeResults(params, getCureFraction(params, 1), language), [params, language]);
  const displayedResults: Results = stageIndex < 4 ? projectedResults : results;
  const currentTemp = stageIndex < 4 ? 25 : stageIndex === 4 ? temperatureAt(params, progress) : params.cureMethod === 'thermal' ? params.cureTemp : 25;
  const curePercentage = stageIndex < 4 ? 0 : Math.round(getCureFraction(params, stageIndex === 4 ? progress : 1) * 100);

  function update<K extends keyof Parameters>(key: K, value: Parameters[K]) {
    setParams(old => ({ ...old, [key]: value }));
    setPreset('custom');
  }
  function addLog(message: string) { setEventLog(old => [message, ...old].slice(0, 7)); }
  function selectPreset(key: string) {
    const found = PRESETS.find(item => item.key === key);
    const localized = presetDefs.find(item => item.key === key);
    if (!found) return;
    setParams({ ...DEFAULT_PARAMS, ...found.overrides });
    setPreset(key);
    setPlayhead(0);
    setPlaying(false);
    setViewMode('assembly');
    addLog(t.logPresetLoaded(localized?.name || found.name));
  }
  function jump(index: number) {
    const i = clamp(index, 0, STAGES.length - 1);
    setPlayhead(elapsedStarts[i]);
    setPlaying(false);
    if (i < 3) setViewMode('assembly');
  }
  function reset() {
    setPlayhead(0);
    setPlaying(false);
    setViewMode('assembly');
    addLog(t.logProcessReset);
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
    setEventLog([t.logInit]);
    lastIndex.current = stageIndex;
  }, [language]);

  useEffect(() => {
    if (stageIndex !== lastIndex.current) {
      lastIndex.current = stageIndex;
      setEventLog(old => [t.logStage(stageIndex + 1, stageDefs[stageIndex].name), ...old].slice(0, 7));
    }
  }, [stageIndex, language, stageDefs, t]);

  const statusClass = displayedResults.status.toLowerCase();
  const statusIcon = displayedResults.status === 'PASS' ? <CheckCircle2 size={17}/> : <XCircle size={17}/>;

  return <div className="sim-frame" data-kind="paste">
    <SuiteBar kind="paste" language={language}/>
    <div className="app-shell">
    <header className="topbar">
      <div className="brand-group"><div className="brand-symbol"><Cpu size={22}/></div>
        <div><div className="brand-title">DIE BONDING <span>LAB</span></div><div className="brand-subtitle">{t.brandSubtitle}</div></div>
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
            <span className="stage-content"><span className="stage-num">STEP {String(i + 1).padStart(2, '0')}</span><strong>{stageDefs[i].short}</strong></span>
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
            <div className="camera-select"><button aria-label="Isometric camera" title="Isometric view" className={cameraPreset === 'iso' ? 'current' : ''} onClick={() => { setCameraPreset('iso'); setViewMode('assembly'); }}>ISO</button><button title="Top view" className={cameraPreset === 'top' ? 'current' : ''} onClick={() => { setCameraPreset('top'); setViewMode('assembly'); }}>TOP</button><button title="Front view" className={cameraPreset === 'front' ? 'current' : ''} onClick={() => { setCameraPreset('front'); setViewMode('assembly'); }}>FRONT</button><button title="Side view" className={cameraPreset === 'side' ? 'current' : ''} onClick={() => { setCameraPreset('side'); setViewMode('assembly'); }}>SIDE</button></div>
          </div>
          <div className="viewport-stage"><SimulationScene params={params} results={displayedResults} stage={stage.id as Stage} progress={progress} viewMode={viewMode} cameraPreset={cameraPreset} showLabels={showLabels} sceneLabels={sceneLabels}/>
            <div className="viewport-overlay-left"><div className="floating-stat"><div className="floating-label">{t.currentStep}</div><strong>{String(stageIndex + 1).padStart(2, '0')} <span>/ 06</span></strong></div><div className="floating-stat"><div className="floating-label">{t.stepProgress}</div><strong>{Math.round(progress * 100)}<span> %</span></strong></div></div>
            <div className="viewport-overlay-right"><span className="dimension-chip">Die {formatNumber(params.dieWidth)} × {formatNumber(params.dieHeight)} mm</span><span className="dimension-chip">{params.substrate === 'leadframe' ? t.cuLeadframe : t.laminate}</span></div>
            {stageIndex === 5 && <div className={`viewport-verdict ${statusClass}`} aria-live="polite">
              {statusIcon}<span><strong>{displayedResults.status}</strong><small>{displayedResults.issues.length === 0 ? t.allChecksSatisfied : t.failedChecks(displayedResults.issues.length)}</small></span>
            </div>}
            {viewMode === 'cross' && <div className="cross-caption"><span>{t.sectionView}</span><b>{t.bltApprox} {formatNumber(displayedResults.blt)} µm</b><small>{t.crossNote}</small></div>}
          </div>
          <div className="viewport-bottom"><div className="view-buttons"><button className={viewMode === 'assembly' ? 'selected' : ''} onClick={() => setViewMode('assembly')}><Layers size={15}/> {t.assembly}</button><button className={viewMode === 'transparent' ? 'selected' : ''} onClick={() => setViewMode('transparent')}><Eye size={15}/> {t.transparent}</button><button disabled={stageIndex < 3 || (stageIndex === 3 && progress < .45)} title={stageIndex < 3 ? t.crossSectionDisabled : t.inspectBonded} className={viewMode === 'cross' ? 'selected' : ''} onClick={() => setViewMode('cross')}><ScanLine size={15}/> {t.crossSection}</button></div><button title={t.languageLabel} className="label-toggle" onClick={() => setShowLabels(!showLabels)}><Eye size={14}/> {showLabels ? t.hideLabels : t.showLabels} {t.labels}</button></div>
        </div>

        <div className="playback-panel">
          <div className="playback-bar-top"><span><b>{t.processTimeline}</b><small>STEP {String(stageIndex + 1).padStart(2, '0')} / 06 · {stage.short.toUpperCase()}</small></span><span className="timer-text"><Clock3 size={14}/> {formatNumber(playhead, 1)}s / {formatNumber(totalDuration, 1)}s <span>{t.simTime}</span></span></div>
          <input className="timeline-range" aria-label="Process timeline" type="range" min="0" max={totalDuration} step="0.01" value={playhead} onChange={e => { const t = Number(e.target.value); setPlayhead(t); setPlaying(false); if (t < elapsedStarts[3]) setViewMode('assembly'); }} style={{ '--percent': `${playhead / totalDuration * 100}%` } as React.CSSProperties}/>
          <div className="timeline-markers">{stageDefs.map((s, i) => <button key={s.id} className={stageIndex === i ? 'current' : ''} onClick={() => jump(i)}>{s.short}</button>)}</div>
          <div className="player-controls"><div className="player-group"><button className="icon-button" title={t.previousStage} aria-label={t.previousStage} onClick={() => jump(stageIndex - 1)} disabled={stageIndex === 0 && progress === 0}><SkipBack size={17}/></button><button className="icon-button" title={t.reset} aria-label={t.reset} onClick={reset}><RotateCcw size={17}/></button><button className="play-btn" onClick={() => { if (completed) setPlayhead(0); setPlaying(!playing || completed); }}>{playing ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}{playing ? t.pauseSimulation : completed ? t.replaySimulation : t.runSimulation}</button><button className="icon-button" title={t.nextStage} aria-label={t.nextStage} onClick={() => jump(stageIndex + 1)} disabled={stageIndex === 5}><SkipForward size={17}/></button></div><div className="speed-control"><span>{t.speed}</span>{[.5, 1, 2, 4].map(n => <button key={n} className={speed === n ? 'current' : ''} onClick={() => setSpeed(n)}>{n}×</button>)}</div></div>
        </div>

        <div className="detail-tools" onKeyDown={e => { if (e.key === 'Escape') setDetailPanel(null); }}>
          <div className="detail-toolbar" aria-label="Process information">
            <button type="button" aria-expanded={detailPanel === 'engineering'} aria-controls="engineering-details" className={detailPanel === 'engineering' ? 'active' : ''} onClick={() => setDetailPanel(old => old === 'engineering' ? null : 'engineering')}><CircleHelp size={14}/> {t.engineeringExplanation} <ChevronDown size={13} className="detail-chevron"/></button>
            <button type="button" aria-expanded={detailPanel === 'events'} aria-controls="event-details" className={detailPanel === 'events' ? 'active' : ''} onClick={() => setDetailPanel(old => old === 'events' ? null : 'events')}><Activity size={14}/> {t.eventMonitor} <span className="detail-count">{eventLog.length}</span><ChevronDown size={13} className="detail-chevron"/></button>
          </div>
          {detailPanel === 'engineering' && <div className="detail-drawer" id="engineering-details"><article className="info-panel"><div className="info-heading"><span className="eyebrow">{t.engineeringExplanation.toUpperCase()}</span><span className="info-step">0{stageIndex + 1}</span></div><h3>{stage.name}</h3><p>{stage.explanation}</p><div className="info-line"><CheckCircle2 size={16}/><span>{stage.purpose}</span></div><div className="info-line caution"><AlertTriangle size={16}/><span>{stage.issue}</span></div><div className="equipment-tag"><Settings2 size={13}/> {stage.device}</div></article></div>}
          {detailPanel === 'events' && <div className="detail-drawer" id="event-details"><article className="log-panel"><div className="info-heading"><span className="eyebrow">{t.eventMonitor.toUpperCase()}</span><span className="log-running"><span/> {playing ? t.running : t.ready}</span></div><h3>{t.systemLog}</h3><div className="log-lines">{eventLog.map((s, i) => <div className="log-entry" key={`${s}-${i}`}><span>{i === 0 ? '›' : '·'}</span>{s}</div>)}</div></article></div>}
        </div>
      </section>

      <aside className="right-panel"><div className="settings-head"><div><div className="eyebrow">{t.equipmentConfiguration}</div><h2>{t.processControls}</h2></div><SlidersHorizontal size={19}/></div>
        <div className="tabs"><button className={panelTab === 'process' ? 'active' : ''} onClick={() => setPanelTab('process')}>{t.process}</button><button className={panelTab === 'material' ? 'active' : ''} onClick={() => setPanelTab('material')}>{t.materialAndCure}</button></div>
        <div className="settings-scroll">
          {panelTab === 'process' ? <div className="input-stack">
            <div className="settings-section-label"><Layers size={14}/> {t.dieAndSubstrate}</div>
            <div className="double-controls"><RangeField label={t.dieWidth} value={params.dieWidth} onChange={v => update('dieWidth', v)} min={2} max={7} step={.25} unit="mm"/><RangeField label={t.dieLength} value={params.dieHeight} onChange={v => update('dieHeight', v)} min={2} max={7} step={.25} unit="mm"/></div>
            <SelectField label={t.substrateType} value={params.substrate} onChange={v => update('substrate', v)} options={[{ value: 'leadframe', label: t.copperLeadframe }, { value: 'laminate', label: t.organicLaminate }]}/>
            <div className="settings-divider"/>
            <div className="settings-section-label"><Droplets size={14}/> {t.dispensing}</div>
            <SelectField label={t.dispensePattern} value={params.pattern} onChange={v => update('pattern', v)} options={[{ value: 'single', label: t.singleDot }, { value: 'five', label: t.fiveDot }, { value: 'x', label: t.xPattern }]}/>
            <RangeField label={t.epoxyVolume} value={params.volume} onChange={v => update('volume', v)} min={80} max={1200} step={10} unit="nL" hint={t.epoxyVolumeHint}/>
            <RangeField label={t.nozzleGap} value={params.nozzleHeight} onChange={v => update('nozzleHeight', v)} min={.08} max={.4} step={.01} unit="mm"/>
            <RangeField label={t.dispenseImbalance} value={params.imbalance} onChange={v => update('imbalance', v)} min={0} max={100} unit="%" hint={t.imbalanceHint}/>
            <div className="settings-divider"/>
            <div className="settings-section-label"><Crosshair size={14}/> {t.placement}</div>
            <RangeField label={t.bondingForce} value={params.force} onChange={v => update('force', v)} min={.5} max={7} step={.1} unit="N"/>
            <RangeField label={t.xPlacementOffset} value={params.offsetX} onChange={v => update('offsetX', v)} min={-250} max={250} step={5} unit="µm"/>
            <RangeField label={t.yPlacementOffset} value={params.offsetY} onChange={v => update('offsetY', v)} min={-250} max={250} step={5} unit="µm"/>
            <RangeField label={t.targetBLT} value={params.targetBLT} onChange={v => update('targetBLT', v)} min={10} max={80} step={1} unit="µm"/>
          </div> : <div className="input-stack"><div className="settings-section-label"><Droplets size={14}/> {t.epoxyProperties}</div>
            <SelectField label={t.adhesivePreset} value={params.adhesiveType} onChange={v => { setParams(prev => ({ ...prev, adhesiveType: v, cureMethod: v === 'uv_edge' ? 'uv' : 'thermal' })); setPreset('custom'); }} options={[{ value: 'thermal_epoxy', label: t.thermalEpoxy }, { value: 'uv_edge', label: t.uvEdgeAdhesive }]} hint={t.adhesiveHint}/>
            <RangeField label={t.epoxyViscosity} value={params.viscosity} onChange={v => update('viscosity', v)} min={2} max={40} step={1} unit="Pa·s"/>
            <div className="settings-divider"/>
            <div className="settings-section-label"><Thermometer size={14}/> {t.curingRecipe}</div>
            <SelectField label={t.cureMode} value={params.cureMethod} onChange={v => update('cureMethod', v)} options={params.adhesiveType === 'thermal_epoxy' ? [{ value: 'thermal', label: t.thermalCure }] : [{ value: 'uv', label: t.uvCure }]}/>
            {params.cureMethod === 'thermal' && <RangeField label={t.cureTemperature} value={params.cureTemp} onChange={v => update('cureTemp', v)} min={100} max={220} step={5} unit="°C"/>}
            <RangeField label={t.cureDuration} value={params.cureTime} onChange={v => update('cureTime', v)} min={10} max={90} step={5} unit="min"/>
            <div className="material-card"><CircleHelp size={17}/><p>{params.adhesiveType === 'thermal_epoxy' ? t.thermalNote : t.uvNote}</p></div>
            <div className="settings-divider"/><div className="settings-section-label"><Gauge size={14}/> {t.liveCuringReadout}</div>
            <div className="live-readouts"><div><span>{t.chamberTemp}</span><strong>{currentTemp} °C</strong></div><div><span>{t.estimatedCure}</span><strong>{curePercentage}%</strong></div></div>
            <div className="cure-progress"><span style={{ width: `${curePercentage}%` }}/></div>
          </div>}
        </div>
        <div className="results-panel"><div className="results-heading"><div><span className="eyebrow">{t.modeledOutputs}</span><h2>{t.bondQuality}</h2></div><span className={`status-chip ${statusClass}`}>{statusIcon} {displayedResults.status}</span></div>
          <div className="metrics-grid"><Metric label={t.metricBLT} value={displayedResults.blt} unit="µm" detail={t.metricEstimatedFilmGap} severity={displayedResults.issues.some(x => x.code === 'blt') ? 'bad' : 'good'}/><Metric label={t.metricCoverage} value={displayedResults.coverage} unit="%" detail={t.metricEstimatedDieArea} severity={displayedResults.issues.some(x => x.code === 'coverage') ? 'bad' : 'good'}/><Metric label={t.metricFillet} value={displayedResults.fillet} unit="µm" detail={t.metricSqueezeOut} severity={displayedResults.issues.some(x => x.code === 'fillet') ? 'bad' : 'good'}/><Metric label={t.metricPlacementError} value={displayedResults.placementError} unit="µm" detail={t.metricXYDeviation} severity={displayedResults.issues.some(x => x.code === 'placement') ? 'bad' : 'good'}/><Metric label={t.metricTilt} value={displayedResults.tilt} unit="°" detail={t.metricSimplifiedTilt} severity={displayedResults.issues.some(x => x.code === 'tilt') ? 'bad' : 'good'}/><Metric label={t.metricVoids} value={displayedResults.voids} unit="%" detail={t.metricHeuristicOnly} severity={displayedResults.issues.some(x => x.code === 'voids') ? 'bad' : 'good'}/></div>
          <div className="risk-row"><span>{t.bleedRisk}</span><strong className={displayedResults.bleed.toLowerCase()}>{riskText(language, displayedResults.bleed)}</strong><span>{t.delamination}</span><strong className={displayedResults.delamination.toLowerCase()}>{riskText(language, displayedResults.delamination)}</strong></div>
          <section className={`inspection-summary ${statusClass}`} aria-label={t.inspectionVerdict} aria-live="polite">
            <div className="inspection-summary-head">{statusIcon}<div><strong>{displayedResults.status === 'PASS' ? t.passSuccessful : t.failUnsuccessful}</strong><span>{displayedResults.issues.length === 0 ? t.passAllParams : t.failParamCount(displayedResults.issues.length)}</span></div></div>
            {displayedResults.issues.length > 0 ? <ul className="issue-list">{displayedResults.issues.map(issue => <li key={issue.code}><strong>{issue.title}</strong><span>{issue.detail}</span></li>)}</ul> : <p className="pass-detail">{t.passDetail}</p>}
          </section>
          <div className="disclaimer">{stageIndex < 4 ? t.projectedAfterFullCure : stageIndex === 4 ? t.cureInProgress : ''}{t.disclaimer}</div>
        </div>
      </aside>
    </main>
    <footer className="app-footer"><span><Zap size={12}/> EPOXY DIE ATTACH LAB</span><span>{t.footerProcess}</span><span>{t.footerModel}</span></footer>
    </div>
  </div>;
}
