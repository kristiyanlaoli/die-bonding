'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Atom, CheckCircle2, CircleDot, Cpu, FlaskConical, Gauge, Layers3, Move3D, Play, ThermometerSun, Waypoints } from 'lucide-react';
import LanguageFlag from '@/simulators/paste/components/LanguageFlag';
import ProcessVisual from './ProcessVisual';

type Language = 'en' | 'id' | 'zhTW';
type Kind = 'paste' | 'film' | 'reflow' | 'tcb';
const processes: {kind:Kind; index:string; label:string; tech:string; symbol:typeof Cpu}[] = [
  {kind:'paste',index:'01',label:'PASTE',tech:'Conventional',symbol:FlaskConical},
  {kind:'film',index:'02',label:'FILM',tech:'Conventional',symbol:Layers3},
  {kind:'reflow',index:'03',label:'MASS REFLOW',tech:'Flip Chip',symbol:Waypoints},
  {kind:'tcb',index:'04',label:'TCB',tech:'Flip Chip',symbol:ThermometerSun},
];
const COPY = {
 en: {
  status:'INTERACTIVE PROCESS LEARNING · 3D LABORATORY',navLab:'THE BONDING LAB',navSim:'SIMULATORS',heroLead:'Explore semiconductor',heroAccent:'die bonding.',
  intro:'Four bonding technologies, one interactive learning environment. Explore each process step-by-step, adjust engineering parameters, and understand what makes a reliable connection.',
  explore:'EXPLORE ALL TECHNOLOGIES', choose:'Choose your bonding process', chooseSub:'Select a simulation to open its dedicated 3D workstation.',
  tags:['4 PROCESS MODELS','3 LANGUAGES','INTERACTIVE 3D'], open:'Launch simulator', preview:'LIVE SIMULATION',
  cards:{
    paste:{title:'Paste Adhesive',subtitle:'Conventional die attach',desc:'Follow epoxy dispensing, die pickup, placement, curing, and visual inspection.',stages:'Dispense · Pick · Place · Cure',focus:'Epoxy paste · Fillet · BLT'},
    film:{title:'Die Attach Film',subtitle:'Pre-laminated adhesive',desc:'Watch film lamination, wafer dicing, film-backed die pick-up, bonding, and curing.',stages:'Lamination · Dicing · Attach',focus:'DAF · Compression · Coverage'},
    reflow:{title:'Flip Chip Mass Reflow',subtitle:'Collective solder interconnection',desc:'Explore wide-area flux spray, die flipping, reflow heating, cleaning, and capillary underfill.',stages:'Spray · Flip · Reflow · Underfill',focus:'Solder joints · Wetting · Voids'},
    tcb:{title:'Thermo-Compression Bonding',subtitle:'Local heat and bonding force',desc:'See NCP deposits spread from the same dispensed material during initial chip contact and local bonding.',stages:'NCP · Contact · Press · Cure',focus:'Force · Pulse heat · NCP'},
  },
  featuresTitle:'Built to understand the process',featuresIntro:'Each simulation preserves its own process model, parameters, and inspection rules.',
  features:[['ENGINEERING CONTROLS','Tune geometry, material properties, force and temperature.'],['VISUAL PROCESS FLOW','Play, pause, scrub and examine each 3D process stage.'],['INSPECTION INSIGHTS','Explore illustrative PASS / FAIL outcomes and their causes.']],
  footTitle:'Start with any process.',footText:'Switch between technologies at any time using the in-simulator navigation. No separate apps needed.',
  all:'Compare all four technologies',start:'Start simulation',languageLabel:'Select language',footNote:'Educational / conceptual models · Not validated manufacturing recipes',
 },
 id: {
  status:'PEMBELAJARAN PROSES INTERAKTIF · LABORATORIUM 3D',navLab:'LAB DIE BONDING',navSim:'SIMULATOR',heroLead:'Jelajahi teknologi',heroAccent:'die bonding.',
  intro:'Empat teknologi bonding dalam satu platform pembelajaran interaktif. Ikuti proses tahap demi tahap, atur parameter teknik, dan pahami faktor penentu kualitas sambungan.',
  explore:'JELAJAHI SEMUA TEKNOLOGI',choose:'Pilih proses die bonding',chooseSub:'Pilih salah satu simulasi untuk membuka ruang kerja 3D khusus.',
  tags:['4 MODEL PROSES','3 BAHASA','3D INTERAKTIF'],open:'Buka simulator',preview:'SIMULASI LANGSUNG',
  cards:{
    paste:{title:'Paste Adhesive',subtitle:'Die attach konvensional',desc:'Pelajari dispensing epoxy, pick-up die, placement, curing, dan inspeksi visual.',stages:'Dispense · Pick · Place · Cure',focus:'Epoxy paste · Fillet · BLT'},
    film:{title:'Die Attach Film',subtitle:'Perekat film yang dilaminasi',desc:'Amati lamination film, wafer dicing, pick-up die berfilm, bonding, dan curing.',stages:'Laminasi · Dicing · Attach',focus:'DAF · Kompresi · Coverage'},
    reflow:{title:'Flip Chip Mass Reflow',subtitle:'Penyambungan solder bersama',desc:'Jelajahi flux spray menyeluruh, pembalikan die, reflow, cleaning, dan capillary underfill.',stages:'Spray · Flip · Reflow · Underfill',focus:'Solder joint · Wetting · Void'},
    tcb:{title:'Thermo-Compression Bonding',subtitle:'Panas lokal dan gaya bonding',desc:'Lihat deposit NCP yang sama menyebar saat kontak awal die, dilanjutkan bonding dengan panas lokal.',stages:'NCP · Contact · Press · Cure',focus:'Gaya · Pulse heat · NCP'},
  },
  featuresTitle:'Dibuat untuk memahami proses',featuresIntro:'Setiap simulator mempertahankan model, parameter, dan evaluasi inspeksinya masing-masing.',
  features:[['KONTROL ENGINEERING','Atur geometri, material, gaya, dan temperatur.'],['ALUR PROSES VISUAL','Putar, jeda, geser timeline, dan amati setiap tahap 3D.'],['ANALISIS INSPEKSI','Eksplorasi hasil PASS / FAIL edukatif dan penyebabnya.']],
  footTitle:'Mulai dari proses mana pun.',footText:'Kamu bisa berpindah teknologi melalui menu navigasi di dalam simulator. Tidak perlu aplikasi terpisah.',
  all:'Bandingkan keempat teknologi',start:'Mulai simulasi',languageLabel:'Pilih bahasa',footNote:'Model edukatif / konseptual · Bukan resep manufaktur tervalidasi',
 },
 zhTW: {
  status:'互動式製程學習 · 3D 實驗室',navLab:'晶粒接合實驗室',navSim:'模擬器',heroLead:'探索半導體',heroAccent:'晶粒接合技術。',
  intro:'四種接合技術，整合於同一互動學習平台。逐步了解各製程、調整工程參數，並理解可靠接合的關鍵因素。',
  explore:'探索四種製程',choose:'選擇晶粒接合製程',chooseSub:'選擇模擬器，開啟專屬的 3D 製程工作區。',
  tags:['4 種製程模型','3 種語言','互動式 3D'],open:'開啟模擬器',preview:'即時模擬',
  cards:{
    paste:{title:'膏狀膠材接合',subtitle:'傳統晶粒貼合',desc:'體驗環氧膠點膠、取晶、貼合、固化與視覺檢查。',stages:'點膠 · 取晶 · 貼合 · 固化',focus:'環氧膠 · 膠邊 · 膠層厚度'},
    film:{title:'晶粒貼合膠膜',subtitle:'預先貼合的膠膜',desc:'觀察膠膜貼合、晶圓切割、帶膜取晶、接合及固化。',stages:'貼膜 · 切割 · 貼合',focus:'DAF · 壓縮 · 覆蓋率'},
    reflow:{title:'覆晶整批迴焊',subtitle:'批量焊料互連',desc:'體驗大面積助焊劑噴塗、翻晶、迴焊、清潔及毛細底部填膠。',stages:'噴塗 · 翻晶 · 迴焊 · 底部填膠',focus:'焊點 · 潤濕 · 空洞'},
    tcb:{title:'熱壓接合（TCB）',subtitle:'局部加熱與壓合力',desc:'觀察原本點膠的 NCP 在初始接觸時持續擴散，再以局部加熱完成接合。',stages:'NCP · 接觸 · 熱壓 · 固化',focus:'壓力 · 脈衝加熱 · NCP'},
  },
  featuresTitle:'深入理解製程原理',featuresIntro:'各模擬器保留各自的製程模型、參數與品質判斷規則。',
  features:[['工程參數控制','調整尺寸、材料特性、壓力和溫度。'],['視覺化製程','播放、暫停、拖曳時間軸並觀察 3D 製程。'],['檢測結果分析','探索教學用 PASS / FAIL 結果及其原因。']],
  footTitle:'從任何製程開始。',footText:'可使用模擬器上方的導覽列切換技術，不必開啟不同網站。',
  all:'比較四種接合技術',start:'開始模擬',languageLabel:'選擇語言',footNote:'教學／概念模型 · 並非經驗證的製造參數',
 }
} as const;

export default function Landing({initialLanguage='en'}:{initialLanguage?:Language}){
  const [language,setLanguage]=useState<Language>(initialLanguage);
  const t=COPY[language];
  const firstLink=`/simulators/paste?lang=${language}`;
  return <div className="landing-page">
    <div className="landing-topbar">
      <Link href={`/?lang=${language}`} className="landing-brand"><span className="landing-brand-icon"><Cpu size={23} strokeWidth={1.7}/></span><span><strong>DIE BONDING <em>LAB</em></strong><small>SEMICONDUCTOR PROCESS SIMULATIONS</small></span></Link>
      <div className="landing-top-right"><span className="landing-header-tag"><CircleDot size={13}/>{t.navSim}</span>
        <div className="lang-switch" role="group" aria-label={t.languageLabel}>{(['en','id','zhTW'] as const).map(lang=><button type="button" key={lang} title={{en:'English',id:'Bahasa Indonesia',zhTW:'繁體中文（台灣）'}[lang]} aria-label={{en:'English',id:'Bahasa Indonesia',zhTW:'Traditional Chinese (Taiwan)'}[lang]} aria-pressed={language===lang} className={language===lang?'active':''} onClick={()=>setLanguage(lang)}><LanguageFlag language={lang}/></button>)}</div>
      </div>
    </div>
    <main>
      <section className="landing-hero">
        <div className="hero-lattice" aria-hidden="true"/>
        <div className="hero-glow" aria-hidden="true"/>
        <div className="hero-content">
          <div className="hero-eyebrow"><span className="hero-signal"/>{t.status}</div>
          <h1>{t.heroLead}<br/><span>{t.heroAccent}</span></h1>
          <p>{t.intro}</p>
          <div className="hero-tags">{t.tags.map((tag,i)=><span key={tag}>{i===0?<Layers3 size={15}/>:i===1?<Atom size={15}/>:<Move3D size={15}/>} {tag}</span>)}</div>
          <a className="landing-primary" href="#technologies">{t.explore}<ArrowRight size={17}/></a>
        </div>
        <div className="hero-schematic" aria-hidden="true"><div className="schematic-card"><div className="schematic-head"><span className="signal-three"><i/><i/><i/></span><span>3D PROCESS WORKSTATION</span><span className="mini-live">● LIVE</span></div><ProcessVisual kind="tcb"/><div className="schematic-footer"><span>PROCESS 04 / TCB</span><span>FORCE + HEAT + DWELL</span></div></div><span className="schematic-floating">4 × TECHNOLOGIES</span></div>
      </section>
      <section id="technologies" className="landing-catalog">
        <div className="section-kicker"><span className="kicker-line"/> {t.choose.toUpperCase()}</div>
        <div className="catalog-heading"><div><h2>{t.choose}</h2><p>{t.chooseSub}</p></div><div className="catalog-count"><b>04</b><small>SIMULATORS</small></div></div>
        <div className="process-grid">{processes.map(item=>{
          const Icon=item.symbol;const card=t.cards[item.kind];
          return <Link key={item.kind} href={`/simulators/${item.kind}?lang=${language}`} className={`process-card card-${item.kind}`} aria-label={`${t.open}: ${card.title}`}>
            <div className="card-art"><ProcessVisual kind={item.kind}/><span className="card-number">{item.index} / 04</span><span className="card-mode"><span className="mode-dot"/>{t.preview}</span></div>
            <div className="card-content"><div className="card-eyebrow"><Icon size={16}/>{item.tech.toUpperCase()} <span>· {item.label}</span></div><div className="card-title-row"><h3>{card.title}</h3><span className="card-launch"><ArrowUpRight size={19}/></span></div><span className="card-subtitle">{card.subtitle}</span><p>{card.desc}</p><div className="card-timeline"><Waypoints size={13}/>{card.stages}</div><div className="card-bottom"><span><Gauge size={14}/>{card.focus}</span><span className="card-link">{t.open}<ArrowRight size={15}/></span></div></div>
          </Link>;
        })}</div>
      </section>
      <section className="landing-features"><div className="features-header"><div className="section-kicker"><span className="kicker-line"/> ENGINEERING LEARNING</div><h2>{t.featuresTitle}</h2><p>{t.featuresIntro}</p></div><div className="feature-grid">{t.features.map(([title,description],i)=><div key={title} className="feature-card"><div className="feature-icon">{i===0?<Gauge size={21}/>:i===1?<Play size={21}/>:<CheckCircle2 size={21}/>}</div><span>0{i+1}</span><h3>{title}</h3><p>{description}</p></div>)}</div></section>
      <section className="landing-cta"><div className="cta-badge"><Cpu size={24}/></div><div><h2>{t.footTitle}</h2><p>{t.footText}</p></div><Link href={firstLink} className="landing-primary">{t.start}<ArrowRight size={17}/></Link></section>
    </main>
    <footer className="landing-footer"><div><Cpu size={16}/> DIE BONDING LAB <span> / FOUR TECHNOLOGIES · ONE WORKSPACE</span></div><span>{t.footNote}</span></footer>
  </div>;
}
