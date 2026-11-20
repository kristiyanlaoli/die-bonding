export type Stage = 'dispense' | 'pickup' | 'align' | 'place' | 'cure' | 'inspect';
export type DispensePattern = 'single' | 'five' | 'x';
export type SubstrateType = 'leadframe' | 'laminate';
export type ViewMode = 'assembly' | 'transparent' | 'cross';
export type CameraPreset = 'iso' | 'top' | 'front' | 'side';
export type Locale = 'id' | 'en' | 'zhTW';

export type Parameters = {
  dieWidth: number;       // mm
  dieHeight: number;      // mm
  substrate: SubstrateType;
  pattern: DispensePattern;
  volume: number;         // nL
  viscosity: number;      // Pa·s, illustrative
  nozzleHeight: number;   // mm
  force: number;          // N
  offsetX: number;        // µm
  offsetY: number;        // µm
  imbalance: number;      // %
  targetBLT: number;      // µm
  cureTemp: number;       // °C
  cureTime: number;       // min
  cureMethod: 'thermal' | 'uv';
  adhesiveType: 'thermal_epoxy' | 'uv_edge';
};

export const DEFAULT_PARAMS: Parameters = {
  dieWidth: 4,
  dieHeight: 4,
  substrate: 'leadframe',
  pattern: 'five',
  volume: 460,
  viscosity: 14,
  nozzleHeight: 0.16,
  force: 2.2,
  offsetX: 5,
  offsetY: -3,
  imbalance: 4,
  targetBLT: 25,
  cureTemp: 165,
  cureTime: 45,
  cureMethod: 'thermal',
  adhesiveType: 'thermal_epoxy',
};

export const STAGES: { id: Stage; name: string; short: string; duration: number; device: string; explanation: string; purpose: string; issue: string }[] = [
  { id: 'dispense', name: 'Epoxy Dispensing', short: 'Dispense', duration: 7, device: 'Programmable dispensing nozzle', explanation: 'The nozzle deposits epoxy paste onto the substrate die pad, following a programmable dispensing pattern.', purpose: 'Deliver a consistent adhesive volume and distribution before die placement.', issue: 'Incorrect volume or pattern can cause poor coverage, excessive fillet or adhesive bleed.' },
  { id: 'pickup', name: 'Die Pick-up', short: 'Pick', duration: 5.5, device: 'Wafer tape, ejector pin, vacuum collet', explanation: 'An ejector pin lifts a good die from the dicing tape; a vacuum collet picks it up with its active face upward.', purpose: 'Transfer the selected die without damaging or contaminating its surfaces.', issue: 'Incorrect pick-up force may cause chipping or die loss.' },
  { id: 'align', name: 'Optical Alignment', short: 'Align', duration: 4, device: 'Vision cameras and precision motion stage', explanation: 'The bond head moves the die above the target and aligns it to the die pad using reference marks.', purpose: 'Minimize X/Y placement error before the die touches the epoxy.', issue: 'Placement offsets can reduce edge clearance and downstream assembly yield.' },
  { id: 'place', name: 'Placement & Spreading', short: 'Place', duration: 7, device: 'Servo-controlled bonding head', explanation: 'The die contacts and compresses the epoxy. The paste spreads under the die and can form a fillet around the edges.', purpose: 'Create controlled bond line thickness, coverage and a stable mechanical connection.', issue: 'Insufficient coverage, excessive bleed, uneven BLT and die tilt are key process risks.' },
  { id: 'cure', name: 'Adhesive Curing', short: 'Cure', duration: 5, device: 'Temperature-controlled curing station', explanation: 'Thermal energy or compatible UV exposure hardens the adhesive in this accelerated, educational visualization.', purpose: 'Develop a durable bond by curing the adhesive with a suitable material-specific process.', issue: 'An inadequate cure can reduce adhesion and long-term reliability.' },
  { id: 'inspect', name: 'Final Inspection', short: 'Inspect', duration: 4, device: 'Optical and simulated cross-section inspection', explanation: 'Inspect the completed die attach and review modeled bond line thickness, placement error, fillet and defect indicators.', purpose: 'Understand how process inputs influence estimated bonding outcomes.', issue: 'Reported void percentage and delamination risk here are heuristic estimates, not measured inspections.' },
];

export const PRESETS: { key: string; name: string; description: string; overrides: Partial<Parameters> }[] = [
  { key: 'ideal', name: 'Nominal Process', description: 'Balanced dispensing, alignment and bond force', overrides: {} },
  { key: 'low', name: 'Insufficient Epoxy', description: 'Low adhesive volume results in incomplete coverage', overrides: { volume: 185, pattern: 'single', force: 1.3 } },
  { key: 'high', name: 'Excess Epoxy', description: 'Excess adhesive expands beyond the intended die region', overrides: { volume: 850, force: 3.5 } },
  { key: 'misalign', name: 'Misalignment', description: 'X/Y offset is introduced deliberately', overrides: { offsetX: 150, offsetY: -130 } },
  { key: 'tilt', name: 'Die Tilt', description: 'Strong dispensing asymmetry creates uneven bonding', overrides: { imbalance: 85, pattern: 'single', force: 1.2 } },
  { key: 'void', name: 'Potential Voids', description: 'High viscosity and low force increase void indicators', overrides: { viscosity: 35, force: 0.65, pattern: 'single', imbalance: 35 } },
];

export const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);
export const smooth = (t: number) => { const s = clamp(t, 0, 1); return s * s * (3 - 2 * s); };

export type Results = {
  blt: number;
  coverage: number;
  voids: number;
  fillet: number;
  placementError: number;
  tilt: number;
  bleed: 'Low' | 'Elevated' | 'High';
  delamination: 'Low' | 'Elevated' | 'High';
  status: 'PASS' | 'FAIL';
  issues: { code: string; title: string; detail: string }[];
  effectiveVolume: number;
};


function localizedIssueText(locale: Locale, code: string, value: string) {
  const messages = {
    id: {
      coverage: ['Insufficient adhesive coverage', `${value}% (minimum 90%). Epoxy tidak cukup menutupi bagian bawah die; coba tambah volume atau bonding force.`],
      fillet: ['Excessive fillet / adhesive bleed', `${value} µm (maksimum 220 µm). Epoxy terlalu banyak keluar dari tepi die; kurangi volume epoxy.`],
      placement: ['Die misalignment', `${value} µm (maksimum 50 µm). Posisi die bergeser dari target; koreksi X/Y offset.`],
      tilt: ['Excessive die tilt', `${value}° (maksimum 0.170°). Die terlalu miring; periksa keseragaman dispensing dan bonding force.`],
      voids: ['High estimated void content', `${value}% (maksimum 4.5%). Risiko rongga udara meningkat; periksa viscosity, coverage, dan bonding force.`],
      blt: ['Bond Line Thickness out of range', `${value} µm (rentang BLT di luar target). Sesuaikan volume epoxy, luas die, dan target BLT.`],
      cure: ['Incomplete adhesive curing', `${value}% cured (minimum 95%). Periksa suhu, waktu, atau lanjutkan animasi curing.`],
    },
    en: {
      coverage: ['Insufficient adhesive coverage', `${value}% (minimum 90%). The epoxy does not cover enough of the die underside; increase dispense volume or bonding force.`],
      fillet: ['Excessive fillet / adhesive bleed', `${value} µm (maximum 220 µm). Too much epoxy squeezes out from the die edge; reduce epoxy volume.`],
      placement: ['Die misalignment', `${value} µm (maximum 50 µm). The die is offset from the target; correct the X/Y placement offset.`],
      tilt: ['Excessive die tilt', `${value}° (maximum 0.170°). The die is too tilted; check dispensing uniformity and bonding force.`],
      voids: ['High estimated void content', `${value}% (maximum 4.5%). The air-void risk is high; review viscosity, coverage, and bonding force.`],
      blt: ['Bond Line Thickness out of range', `${value} µm (BLT outside the target range). Adjust epoxy volume, die size, and target BLT.`],
      cure: ['Incomplete adhesive curing', `${value}% cured (minimum 95%). Check the cure temperature, cure time, or continue the curing animation.`],
    },
    zhTW: {
      coverage: ['膠體覆蓋不足', `${value}%（最低 90%）。環氧膠未充分覆蓋晶粒底部，請增加點膠量或貼裝壓力。`],
      fillet: ['膠邊過大／溢膠', `${value} µm（最大 220 µm）。晶粒邊緣擠出過多膠體，請降低點膠量。`],
      placement: ['晶粒對位偏移', `${value} µm（最大 50 µm）。晶粒位置偏離目標，請修正 X/Y 偏移量。`],
      tilt: ['晶粒傾斜過大', `${value}°（最大 0.170°）。晶粒傾斜過大，請檢查點膠均勻性與貼裝壓力。`],
      voids: ['空洞率估計過高', `${value}%（最大 4.5%）。空氣空洞風險偏高，請檢查黏度、覆蓋率與貼裝壓力。`],
      blt: ['鍵合層厚度超出範圍', `${value} µm（BLT 超出目標範圍）。請調整膠量、晶粒尺寸與目標 BLT。`],
      cure: ['固化不完全', `${value}% 已固化（最低 95%）。請檢查固化溫度、時間，或繼續播放固化動畫。`],
    },
  } as const;
  const pack = messages[locale][code as keyof typeof messages['id']];
  return { title: pack[0], detail: pack[1] };
}

/**
 * Educational parametric heuristic; not CFD, calibrated material data or SEMI acceptance criteria.
 * Volume balance and film thickness are internally consistent after simplified partitioning.
 * For a W×H mm² die, volume [nL] / area [mm²] = equivalent film thickness [µm].
 */
export function computeResults(p: Parameters, cureProgress = 1, locale: Locale = 'id'): Results {
  const area = p.dieWidth * p.dieHeight;
  const perimeter = 2 * (p.dieWidth + p.dieHeight);
  const intendedVolume = Math.max(1, area * p.targetBLT);
  const volumeRatio = p.volume / intendedVolume;
  const patternBonus = p.pattern === 'five' ? 4 : p.pattern === 'x' ? 2 : -4;
  const coverage = clamp(90 + (volumeRatio - 1) * 25 + (p.force - 2) * 4 - (p.viscosity - 12) * 0.7 + patternBonus - p.imbalance * 0.08, 35, 99.7);
  const filmFraction = clamp(0.91 - 0.07 * Math.max(0, volumeRatio - 1), 0.67, 0.97);
  const blt = clamp(p.volume * filmFraction / (area * coverage / 100), 4, 100);
  const filmVolume = Math.min(p.volume, area * coverage / 100 * blt);
  const excessVolume = Math.max(0, p.volume - filmVolume);
  const fillet = clamp(excessVolume / (perimeter * 0.02), 0, 900); // nL/mm² = µm
  const placementError = Math.hypot(p.offsetX, p.offsetY);
  const tilt = clamp(0.012 + p.imbalance * 0.0038 + Math.max(0, 85 - coverage) * 0.008 + Math.max(0, 1.5 - p.force) * 0.018, 0.01, 0.65);
  const voids = clamp(0.4 + (100 - coverage) * 0.13 + Math.max(0, p.viscosity - 12) * 0.3 + Math.max(0, 1.5 - p.force) * 1.4 + p.imbalance * 0.025, 0.2, 35);
  const bleed: Results['bleed'] = fillet > 380 ? 'High' : fillet > 220 ? 'Elevated' : 'Low';
  const delamination: Results['delamination'] = cureProgress < 0.75 || voids > 11 || coverage < 72 ? 'High' : voids > 4.5 || coverage < 90 || cureProgress < 0.95 ? 'Elevated' : 'Low';
  // Single source of truth for the binary PASS/FAIL inspection readout.
  // These are illustrative teaching limits, NOT manufacturing acceptance standards.
  const issues: Results['issues'] = [];
  if (coverage < 90) {
    const msg = localizedIssueText(locale, 'coverage', coverage.toFixed(1));
    issues.push({ code: 'coverage', title: msg.title, detail: msg.detail });
  }
  if (fillet > 220) {
    const msg = localizedIssueText(locale, 'fillet', fillet.toFixed(1));
    issues.push({ code: 'fillet', title: msg.title, detail: msg.detail });
  }
  if (placementError > 50) {
    const msg = localizedIssueText(locale, 'placement', placementError.toFixed(1));
    issues.push({ code: 'placement', title: msg.title, detail: msg.detail });
  }
  if (tilt > 0.17) {
    const msg = localizedIssueText(locale, 'tilt', tilt.toFixed(3));
    issues.push({ code: 'tilt', title: msg.title, detail: msg.detail });
  }
  if (voids > 4.5) {
    const msg = localizedIssueText(locale, 'voids', voids.toFixed(1));
    issues.push({ code: 'voids', title: msg.title, detail: msg.detail });
  }
  const minBLT = p.targetBLT * 0.70;
  const maxBLT = p.targetBLT * 1.50;
  if (blt < minBLT || blt > maxBLT) {
    const msg = localizedIssueText(locale, 'blt', blt.toFixed(1));
    issues.push({ code: 'blt', title: msg.title, detail: locale === 'id' ? `${blt.toFixed(1)} µm (rentang ${minBLT.toFixed(1)}–${maxBLT.toFixed(1)} µm). Sesuaikan volume epoxy, luas die, dan target BLT.` : locale === 'en' ? `${blt.toFixed(1)} µm (range ${minBLT.toFixed(1)}–${maxBLT.toFixed(1)} µm). Adjust epoxy volume, die size, and target BLT.` : `${blt.toFixed(1)} µm（範圍 ${minBLT.toFixed(1)}–${maxBLT.toFixed(1)} µm）。請調整膠量、晶粒尺寸與目標 BLT。`});
  }
  if (cureProgress < 0.95) {
    const msg = localizedIssueText(locale, 'cure', (cureProgress * 100).toFixed(0));
    issues.push({ code: 'cure', title: msg.title, detail: msg.detail });
  }
  const status: Results['status'] = issues.length === 0 ? 'PASS' : 'FAIL';
  return { blt, coverage, voids, fillet, placementError, tilt, bleed, delamination, status, issues, effectiveVolume: filmVolume };
}

export function getCureFraction(p: Parameters, progress: number): number {
  const tempFactor = p.cureMethod === 'uv'
    ? (p.adhesiveType === 'uv_edge' ? 1 : 0)
    : (p.adhesiveType === 'thermal_epoxy' ? clamp((p.cureTemp - 115) / 50, 0.1, 1.35) : 0);
  const timeFactor = p.cureTime / 45;
  return clamp(progress * tempFactor * timeFactor, 0, 1);
}

export function temperatureAt(p: Parameters, progress: number) {
  if (p.cureMethod === 'uv') return 25;
  return Math.round(25 + (p.cureTemp - 25) * smooth(progress / 0.65));
}
