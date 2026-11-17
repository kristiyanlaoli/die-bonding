'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity, AlertTriangle, Check, CheckCircle2, ChevronDown,
  CircleHelp, ClipboardList, Clock3, Cpu, Crosshair, Droplets,
  Eye, Gauge, Layers, Maximize2, Move3D, Pause, Play, RotateCcw,
  ScanLine, Settings2, SkipBack, SkipForward, SlidersHorizontal,
  Thermometer, Timer, WandSparkles, XCircle, Zap
} from 'lucide-react';
import {
  CameraPreset, clamp, computeResults, DEFAULT_PARAMS, getCureFraction,
  Parameters, PRESETS, Results, STAGES, Stage, temperatureAt, ViewMode
} from '@/lib/simulation';

const SimulationScene = dynamic(() => import('@/components/SimulationScene'), {
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

export default function Simulator() {
  const [params, setParams] = useState<Parameters>(DEFAULT_PARAMS);
  const [preset, setPreset] = useState('ideal');
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [panelTab, setPanelTab] = useState<'process' | 'material'>('process');
  const [viewMode, setViewMode] = useState<ViewMode>('assembly');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [showLabels, setShowLabels] = useState(true);
  const [eventLog, setEventLog] = useState<string[]>(['Simulation initialized · Ready to dispense epoxy']);
  const lastIndex = useRef(0);
  const lastTick = useRef<number | null>(null);

  const { index: stageIndex, progress } = locatePlayhead(playhead);
  const stage = STAGES[stageIndex];
  const completed = playhead >= totalDuration;
  const cureFactor = stageIndex < 4 ? 1 : getCureFraction(params, stageIndex > 4 ? 1 : progress);
  const results = useMemo(() => computeResults(params, cureFactor), [params, cureFactor]);
  const projectedResults = useMemo(() => computeResults(params, getCureFraction(params, 1)), [params]);
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
    if (!found) return;
    setParams({ ...DEFAULT_PARAMS, ...found.overrides });
    setPreset(key);
    setPlayhead(0);
    setPlaying(false);
    setViewMode('assembly');
    addLog(`Preset loaded · ${found.name}`);
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
    addLog('Process reset · Stage 01');
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
      setEventLog(old => [`Stage ${String(stageIndex + 1).padStart(2, '0')} · ${STAGES[stageIndex].name}`, ...old].slice(0, 7));
    }
  }, [stageIndex]);

  const statusClass = displayedResults.status.toLowerCase();
  const statusIcon = displayedResults.status === 'PASS' ? <CheckCircle2 size={17}/> : <XCircle size={17}/>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-group"><div className="brand-symbol"><Cpu size={22}/></div>
        <div><div className="brand-title">DIE BONDING <span>LAB</span></div><div className="brand-subtitle">Semiconductor Assembly · Interactive Digital Twin</div></div>
      </div>
      <div className="topbar-middle"><span className="live-pill"><span/> SIMULATION ONLINE</span><span className="divider-dot">/</span><span>PASTE TYPE ADHESIVE</span></div>
      <div className="topbar-right"><span className="model-pill"><Activity size={14}/> EDUCATIONAL MODEL</span></div>
    </header>

    <main className="workspace">
      <aside className="left-panel">
        <div className="aside-top"><span className="eyebrow">WORKFLOW / 01</span><h2>Bonding process</h2><p>Conventional die attach · Face up</p></div>
        <nav className="stage-list" aria-label="Process stages">
          {STAGES.map((step, i) => <button type="button" key={step.id} className={`stage-item ${i === stageIndex ? 'active' : ''} ${i < stageIndex ? 'finished' : ''}`} onClick={() => jump(i)}>
            <span className="stage-line" />
            <span className="stage-icon">{i < stageIndex ? <Check size={15}/> : iconForStage(i)}</span>
            <span className="stage-content"><span className="stage-num">STEP {String(i + 1).padStart(2, '0')}</span><strong>{step.short}</strong></span>
            {i === stageIndex && <span className="stage-active-dot" />}
          </button>)}
        </nav>
        <div className="aside-separator" />
        <div className="preset-section"><div className="section-title"><WandSparkles size={15}/> PROCESS SCENARIOS</div>
          <div className="preset-list">{PRESETS.map(s => <button key={s.key} type="button" title={s.description} className={`preset-button ${preset === s.key ? 'selected' : ''}`} onClick={() => selectPreset(s.key)}><span className={`preset-dot ${s.key}`}/><span>{s.name}</span>{preset === s.key && <Check size={13}/>}</button>)}</div>
        </div>
        <div className="aside-notice"><CircleHelp size={18}/><span>Try <b>Excess Epoxy</b> or <b>Die Tilt</b>, then compare the section view and quality indicators.</span></div>
      </aside>

      <section className="center-column">
        <div className="viewport-panel">
          <div className="viewport-top">
            <div className="viewport-title"><span className="viewport-title-dot"/><div><span className="eyebrow">LIVE PROCESS VIEW</span><h1>{stage.name}</h1></div></div>
            <div className="camera-select"><button aria-label="Isometric camera" title="Isometric view" className={cameraPreset === 'iso' ? 'current' : ''} onClick={() => { setCameraPreset('iso'); setViewMode('assembly'); }}>ISO</button><button title="Top view" className={cameraPreset === 'top' ? 'current' : ''} onClick={() => { setCameraPreset('top'); setViewMode('assembly'); }}>TOP</button><button title="Front view" className={cameraPreset === 'front' ? 'current' : ''} onClick={() => { setCameraPreset('front'); setViewMode('assembly'); }}>FRONT</button><button title="Side view" className={cameraPreset === 'side' ? 'current' : ''} onClick={() => { setCameraPreset('side'); setViewMode('assembly'); }}>SIDE</button></div>
          </div>
          <div className="viewport-stage"><SimulationScene params={params} results={displayedResults} stage={stage.id as Stage} progress={progress} viewMode={viewMode} cameraPreset={cameraPreset} showLabels={showLabels}/>
            <div className="viewport-overlay-left"><div className="floating-stat"><div className="floating-label">CURRENT STEP</div><strong>{String(stageIndex + 1).padStart(2, '0')} <span>/ 06</span></strong></div><div className="floating-stat"><div className="floating-label">STEP PROGRESS</div><strong>{Math.round(progress * 100)}<span> %</span></strong></div></div>
            <div className="viewport-overlay-right"><span className="dimension-chip">Die {formatNumber(params.dieWidth)} × {formatNumber(params.dieHeight)} mm</span><span className="dimension-chip">{params.substrate === 'leadframe' ? 'Cu Leadframe' : 'Laminate'}</span></div>
            {stageIndex === 5 && <div className={`viewport-verdict ${statusClass}`} aria-live="polite">
              {statusIcon}<span><strong>{displayedResults.status}</strong><small>{displayedResults.issues.length === 0 ? 'All inspection checks satisfied' : `${displayedResults.issues.length} failed inspection check${displayedResults.issues.length !== 1 ? 's' : ''}`}</small></span>
            </div>}
            {viewMode === 'cross' && <div className="cross-caption"><span>SECTION VIEW</span><b>Bond Line Thickness ≈ {formatNumber(displayedResults.blt)} µm</b><small>Adhesive gap and die tilt are exaggerated for visibility.</small></div>}
          </div>
          <div className="viewport-bottom"><div className="view-buttons"><button className={viewMode === 'assembly' ? 'selected' : ''} onClick={() => setViewMode('assembly')}><Layers size={15}/> Assembly</button><button className={viewMode === 'transparent' ? 'selected' : ''} onClick={() => setViewMode('transparent')}><Eye size={15}/> Transparent</button><button disabled={stageIndex < 3 || (stageIndex === 3 && progress < .45)} title={stageIndex < 3 ? 'Cross-section becomes available during placement' : 'Inspect the bonded adhesive'} className={viewMode === 'cross' ? 'selected' : ''} onClick={() => setViewMode('cross')}><ScanLine size={15}/> Cross-section</button></div><button title="Toggle viewport labels" className="label-toggle" onClick={() => setShowLabels(!showLabels)}><Eye size={14}/> {showLabels ? 'Hide' : 'Show'} labels</button></div>
        </div>

        <div className="playback-panel">
          <div className="playback-bar-top"><span><b>PROCESS TIMELINE</b><small>STEP {String(stageIndex + 1).padStart(2, '0')} / 06 · {stage.short.toUpperCase()}</small></span><span className="timer-text"><Clock3 size={14}/> {formatNumber(playhead, 1)}s / {formatNumber(totalDuration, 1)}s <span>SIM TIME</span></span></div>
          <input className="timeline-range" aria-label="Process timeline" type="range" min="0" max={totalDuration} step="0.01" value={playhead} onChange={e => { const t = Number(e.target.value); setPlayhead(t); setPlaying(false); if (t < elapsedStarts[3]) setViewMode('assembly'); }} style={{ '--percent': `${playhead / totalDuration * 100}%` } as React.CSSProperties}/>
          <div className="timeline-markers">{STAGES.map((s, i) => <button key={s.id} className={stageIndex === i ? 'current' : ''} onClick={() => jump(i)}>{s.short}</button>)}</div>
          <div className="player-controls"><div className="player-group"><button className="icon-button" title="Previous stage" aria-label="Previous stage" onClick={() => jump(stageIndex - 1)} disabled={stageIndex === 0 && progress === 0}><SkipBack size={17}/></button><button className="icon-button" title="Reset" aria-label="Reset" onClick={reset}><RotateCcw size={17}/></button><button className="play-btn" onClick={() => { if (completed) setPlayhead(0); setPlaying(!playing || completed); }}>{playing ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}{playing ? 'Pause Simulation' : completed ? 'Replay Simulation' : 'Run Simulation'}</button><button className="icon-button" title="Next stage" aria-label="Next stage" onClick={() => jump(stageIndex + 1)} disabled={stageIndex === 5}><SkipForward size={17}/></button></div><div className="speed-control"><span>SPEED</span>{[.5, 1, 2, 4].map(n => <button key={n} className={speed === n ? 'current' : ''} onClick={() => setSpeed(n)}>{n}×</button>)}</div></div>
        </div>

        <div className="lower-grid"><article className="info-panel"><div className="info-heading"><span className="eyebrow">ENGINEERING EXPLANATION</span><span className="info-step">0{stageIndex + 1}</span></div><h3>{stage.name}</h3><p>{stage.explanation}</p><div className="info-line"><CheckCircle2 size={16}/><span>{stage.purpose}</span></div><div className="info-line caution"><AlertTriangle size={16}/><span>{stage.issue}</span></div><div className="equipment-tag"><Settings2 size={13}/> {stage.device}</div></article>
        <article className="log-panel"><div className="info-heading"><span className="eyebrow">EVENT MONITOR</span><span className="log-running"><span/> {playing ? 'RUNNING' : 'READY'}</span></div><h3>System log</h3><div className="log-lines">{eventLog.map((s, i) => <div className="log-entry" key={`${s}-${i}`}><span>{i === 0 ? '›' : '·'}</span>{s}</div>)}</div></article></div>
      </section>

      <aside className="right-panel"><div className="settings-head"><div><div className="eyebrow">EQUIPMENT CONFIGURATION</div><h2>Process controls</h2></div><SlidersHorizontal size={19}/></div>
        <div className="tabs"><button className={panelTab === 'process' ? 'active' : ''} onClick={() => setPanelTab('process')}>Process</button><button className={panelTab === 'material' ? 'active' : ''} onClick={() => setPanelTab('material')}>Material & Cure</button></div>
        <div className="settings-scroll">
          {panelTab === 'process' ? <div className="input-stack">
            <div className="settings-section-label"><Layers size={14}/> DIE & SUBSTRATE</div>
            <div className="double-controls"><RangeField label="Die width" value={params.dieWidth} onChange={v => update('dieWidth', v)} min={2} max={7} step={.25} unit="mm"/><RangeField label="Die length" value={params.dieHeight} onChange={v => update('dieHeight', v)} min={2} max={7} step={.25} unit="mm"/></div>
            <SelectField label="Substrate type" value={params.substrate} onChange={v => update('substrate', v)} options={[{ value: 'leadframe', label: 'Copper leadframe' }, { value: 'laminate', label: 'Organic laminate' }]}/>
            <div className="settings-divider"/>
            <div className="settings-section-label"><Droplets size={14}/> DISPENSING</div>
            <SelectField label="Dispense pattern" value={params.pattern} onChange={v => update('pattern', v)} options={[{ value: 'single', label: 'Single Dot' }, { value: 'five', label: 'Five Dot' }, { value: 'x', label: 'X Pattern' }]}/>
            <RangeField label="Epoxy volume" value={params.volume} onChange={v => update('volume', v)} min={80} max={1200} step={10} unit="nL" hint="Total deposited adhesive volume. 1 nL = 0.001 mm³."/>
            <RangeField label="Nozzle gap" value={params.nozzleHeight} onChange={v => update('nozzleHeight', v)} min={.08} max={.4} step={.01} unit="mm"/>
            <RangeField label="Dispense imbalance" value={params.imbalance} onChange={v => update('imbalance', v)} min={0} max={100} unit="%" hint="Simplified asymmetry factor used to estimate die tilt."/>
            <div className="settings-divider"/>
            <div className="settings-section-label"><Crosshair size={14}/> PLACEMENT</div>
            <RangeField label="Bonding force" value={params.force} onChange={v => update('force', v)} min={.5} max={7} step={.1} unit="N"/>
            <RangeField label="X placement offset" value={params.offsetX} onChange={v => update('offsetX', v)} min={-250} max={250} step={5} unit="µm"/>
            <RangeField label="Y placement offset" value={params.offsetY} onChange={v => update('offsetY', v)} min={-250} max={250} step={5} unit="µm"/>
            <RangeField label="Target BLT" value={params.targetBLT} onChange={v => update('targetBLT', v)} min={10} max={80} step={1} unit="µm"/>
          </div> : <div className="input-stack"><div className="settings-section-label"><Droplets size={14}/> EPOXY PROPERTIES</div>
            <SelectField label="Adhesive preset" value={params.adhesiveType} onChange={v => { setParams(prev => ({ ...prev, adhesiveType: v, cureMethod: v === 'uv_edge' ? 'uv' : 'thermal' })); setPreset('custom'); }} options={[{ value: 'thermal_epoxy', label: 'Thermal-cure epoxy' }, { value: 'uv_edge', label: 'UV edge-access adhesive (illustrative)' }]} hint="UV example assumes a UV-compatible adhesive and an accessible light path at the exposed adhesive edge. UV does not transmit through opaque silicon."/>
            <RangeField label="Epoxy viscosity" value={params.viscosity} onChange={v => update('viscosity', v)} min={2} max={40} step={1} unit="Pa·s"/>
            <div className="settings-divider"/>
            <div className="settings-section-label"><Thermometer size={14}/> CURING RECIPE</div>
            <SelectField label="Cure mode" value={params.cureMethod} onChange={v => update('cureMethod', v)} options={params.adhesiveType === 'thermal_epoxy' ? [{ value: 'thermal', label: 'Thermal cure (epoxy)' }] : [{ value: 'uv', label: 'UV edge-access cure' }]}/>
            {params.cureMethod === 'thermal' && <RangeField label="Cure temperature" value={params.cureTemp} onChange={v => update('cureTemp', v)} min={100} max={220} step={5} unit="°C"/>}
            <RangeField label="Cure duration" value={params.cureTime} onChange={v => update('cureTime', v)} min={10} max={90} step={5} unit="min"/>
            <div className="material-card"><CircleHelp size={17}/><p>{params.adhesiveType === 'thermal_epoxy' ? 'Thermal curing is shown in accelerated time. Recipe values are illustrative and must be validated against the adhesive supplier’s specification.' : 'The optional UV example represents a compatible adhesive cured at a light-accessible edge. It does not depict light passing through the opaque silicon die.'}</p></div>
            <div className="settings-divider"/><div className="settings-section-label"><Gauge size={14}/> LIVE CURING READOUT</div>
            <div className="live-readouts"><div><span>Chamber temp.</span><strong>{currentTemp} °C</strong></div><div><span>Estimated cure</span><strong>{curePercentage}%</strong></div></div>
            <div className="cure-progress"><span style={{ width: `${curePercentage}%` }}/></div>
          </div>}
        </div>
        <div className="results-panel"><div className="results-heading"><div><span className="eyebrow">MODELED OUTPUTS</span><h2>Bond quality</h2></div><span className={`status-chip ${statusClass}`}>{statusIcon} {displayedResults.status}</span></div>
          <div className="metrics-grid"><Metric label="BOND LINE THICKNESS" value={displayedResults.blt} unit="µm" detail="Estimated film gap" severity={displayedResults.issues.some(x => x.code === 'blt') ? 'bad' : 'good'}/><Metric label="ADHESIVE COVERAGE" value={displayedResults.coverage} unit="%" detail="Estimated die area" severity={displayedResults.issues.some(x => x.code === 'coverage') ? 'bad' : 'good'}/><Metric label="FILLET WIDTH" value={displayedResults.fillet} unit="µm" detail="Modeled squeeze-out" severity={displayedResults.issues.some(x => x.code === 'fillet') ? 'bad' : 'good'}/><Metric label="PLACEMENT ERROR" value={displayedResults.placementError} unit="µm" detail="X/Y deviation" severity={displayedResults.issues.some(x => x.code === 'placement') ? 'bad' : 'good'}/><Metric label="DIE TILT" value={displayedResults.tilt} unit="°" detail="Simplified tilt" severity={displayedResults.issues.some(x => x.code === 'tilt') ? 'bad' : 'good'}/><Metric label="ESTIMATED VOIDS" value={displayedResults.voids} unit="%" detail="Heuristic only" severity={displayedResults.issues.some(x => x.code === 'voids') ? 'bad' : 'good'}/></div>
          <div className="risk-row"><span>BLEED RISK</span><strong className={displayedResults.bleed.toLowerCase()}>{displayedResults.bleed}</strong><span>DELAMINATION</span><strong className={displayedResults.delamination.toLowerCase()}>{displayedResults.delamination}</strong></div>
          <section className={`inspection-summary ${statusClass}`} aria-label="Inspection verdict" aria-live="polite">
            <div className="inspection-summary-head">{statusIcon}<div><strong>{displayedResults.status === 'PASS' ? 'PASS — Bonding successful' : 'FAIL — Bonding unsuccessful'}</strong><span>{displayedResults.issues.length === 0 ? 'Seluruh parameter lolos batas simulasi.' : `${displayedResults.issues.length} parameter tidak memenuhi batas simulasi.`}</span></div></div>
            {displayedResults.issues.length > 0 ? <ul className="issue-list">{displayedResults.issues.map(issue => <li key={issue.code}><strong>{issue.title}</strong><span>{issue.detail}</span></li>)}</ul> : <p className="pass-detail">Coverage, BLT, fillet, placement, tilt, void, dan curing memenuhi batas edukatif yang ditentukan.</p>}
          </section>
          <div className="disclaimer">{stageIndex < 4 ? 'Projected after full cure. ' : stageIndex === 4 ? 'Cure is still in progress. ' : ''}PASS/FAIL and measurements are educational estimates—not industrial qualification limits.</div>
        </div>
      </aside>
    </main>
    <footer className="app-footer"><span><Zap size={12}/> EPOXY DIE ATTACH LAB</span><span>PROCESS: DISPENSE → PICK → ALIGN → PLACE → CURE → INSPECT</span><span>SIMULATION MODEL v1.1 · EDUCATIONAL ONLY</span></footer>
  </div>;
}
