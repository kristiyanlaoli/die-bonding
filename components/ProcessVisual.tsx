import type { ReactNode } from 'react';

type Kind = 'paste' | 'film' | 'reflow' | 'tcb';
const solder = '#e0edf3';
export default function ProcessVisual({kind}:{kind:Kind}) {
  const prefix=kind;
  const bumps: ReactNode[]=[];
  for(let z=0;z<3;z++)for(let x=0;x<7;x++)bumps.push(<g key={`${x}-${z}`}>
    <rect x={128+x*32} y={146+z*4} width="12" height="10" rx="5" fill={solder} opacity={z===0?1:.24}/>
    <ellipse cx={134+x*32} cy={151+z*4} rx="5" ry="3.5" fill="#96b9d4" opacity={z===0?1:.12}/>
  </g>);
  return <svg className="process-visual" viewBox="0 0 470 235" role="img" aria-label={{paste:'Epoxy dispensing and conventional die attachment',film:'Die with pre-laminated adhesive film',reflow:'Flip chip solder bumps and thermal mass reflow',tcb:'Local thermal compression head bonding flip chip'}[kind]}>
    <defs>
      <linearGradient id={`${prefix}-bg`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#19344a"/><stop offset=".58" stopColor="#101f30"/><stop offset="1" stopColor="#0a1728"/></linearGradient>
      <linearGradient id={`${prefix}-silicon`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#8db9d7"/><stop offset=".55" stopColor="#477694"/><stop offset="1" stopColor="#214768"/></linearGradient>
      <linearGradient id={`${prefix}-substrate`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#5a9b89"/><stop offset="1" stopColor="#215f55"/></linearGradient>
      <linearGradient id={`${prefix}-amber`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fbe3a5"/><stop offset="1" stopColor="#d49246"/></linearGradient>
      <linearGradient id={`${prefix}-head`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d6e7ef"/><stop offset="1" stopColor="#6a879b"/></linearGradient>
      <pattern id={`${prefix}-grid`} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#28485a" strokeWidth=".6" opacity=".42"/></pattern>
      <filter id={`${prefix}-glow`}><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <rect width="470" height="235" rx="12" fill={`url(#${prefix}-bg)`}/>
    <rect width="470" height="235" rx="12" fill={`url(#${prefix}-grid)`}/>
    <ellipse cx="235" cy="211" rx="172" ry="18" fill="#020e18" opacity=".46"/>
    <g>
      <path d="M82 182l296 0 22 12-296 0z" fill="#133d39"/>
      <path d="M82 172h296v16H82z" fill={`url(#${prefix}-substrate)`}/>
      <path d="M82 172l22-11h296l-22 11z" fill="#6aaa98"/>
      <path d="M101 179h273" stroke="#84c9b0" opacity=".32" strokeWidth="1"/>
      {Array.from({length:7},(_,i)=><rect key={i} x={123+i*32} y="156" width="17" height="5" rx="2" fill="#e0ab62"/>)}
    </g>
    {kind==='paste' && <g>
      <path d="M139 104h212l14 12H126z" fill="#b2cfdf"/>
      <rect x="126" y="116" width="239" height="27" rx="2" fill={`url(#${prefix}-silicon)`}/>
      <rect x="142" y="143" width="207" height="5" rx="2.5" fill="#d89b50"/>
      <path d="M148 148q13-19 26 0q13-17 26 0q13-21 26 0q13-16 26 0q13-21 26 0q13-19 26 0q13-20 26 0" stroke="#f2bb6e" strokeWidth="8" fill="none" strokeLinecap="round"/>
      <rect x="53" y="20" width="20" height="54" rx="6" fill={`url(#${prefix}-head)`}/>
      <path d="M52 74h22L65 92h-5z" fill="#c2d6e0"/>
      <path d="M62 97c-3 7-6 12-6 17a6 6 0 0012 0c0-5-3-10-6-17z" fill="#f3bc69"/>
      <path d="M62 122v26" stroke="#d6a057" strokeDasharray="4 5" strokeWidth="2"/>
      <path d="M404 106v40m-5-6 5 6 5-6" stroke="#66dde7" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
    </g>}
    {kind==='film' && <g>
      <path d="M135 90h208l16 12H119z" fill="#b2cfdf"/>
      <rect x="119" y="102" width="240" height="31" fill={`url(#${prefix}-silicon)`}/>
      <rect x="119" y="133" width="240" height="11" rx="2" fill={`url(#${prefix}-amber)`}/>
      <path d="M119 144h240" stroke="#ffe6b3" strokeWidth="2"/>
      <path d="M239 59v28m-7-7 7 7 7-7" fill="none" stroke="#70e7ee" strokeWidth="2.6" strokeLinecap="round"/>
      <rect x="213" y="28" width="52" height="10" rx="4" fill="#9fb8c9"/>
      <rect x="229" y="9" width="20" height="23" rx="5" fill="#6d8fa3"/>
      <path d="M119 149c80 0 154 0 240 0" stroke="#e7b473" strokeWidth="2" strokeDasharray="8 7"/>
      <circle cx="388" cy="102" r="19" fill="#e1a259" opacity=".13" stroke="#e6ad6a" strokeWidth="1.5"/>
      <path d="M378 102h20m-10-10v20" stroke="#e6ad6a" strokeWidth="2"/>
    </g>}
    {kind==='reflow' && <g>
      <path d="M117 78h234l12 14H105z" fill="#adcddd"/>
      <rect x="105" y="92" width="258" height="37" rx="2" fill={`url(#${prefix}-silicon)`}/>
      <path d="M115 127h240" stroke="#93b0c3" strokeWidth="3"/>
      {bumps}
      <path d="M114 160h241" stroke="#f3b969" strokeWidth="7" strokeLinecap="round" opacity=".72"/>
      <path d="M145 63c-17-14 9-17-1-36M235 63c-17-14 9-17-1-36M325 63c-17-14 9-17-1-36" fill="none" stroke="#ffb36c" opacity=".9" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="235" cy="52" r="47" fill="#ffad62" opacity=".07" filter={`url(#${prefix}-glow)`}/>
      <path d="M377 100h42" stroke="#72e1ed" strokeDasharray="4 5" strokeWidth="2"/>
      <text x="235" y="214" textAnchor="middle" fill="#a9c5d6" fontSize="12" letterSpacing="2">SOLDER · REFLOW · UNDERFILL</text>
    </g>}
    {kind==='tcb' && <g>
      <path d="M127 106h216l14 11H113z" fill="#aecbdc"/>
      <rect x="113" y="117" width="244" height="26" fill={`url(#${prefix}-silicon)`}/>
      {Array.from({length:7},(_,i)=><ellipse key={i} cx={132+i*34} cy="149" rx="7" ry="9" fill="#d0e1eb"/>)}
      <path d="M124 161h221" stroke="#e0a35d" strokeWidth="8" opacity=".85" strokeLinecap="round"/>
      <path d="M184 54h109v32H184z" fill={`url(#${prefix}-head)`}/>
      <rect x="180" y="84" width="117" height="13" rx="3" fill="#e5a369"/>
      <path d="M234 8v46" stroke="#abc5d3" strokeWidth="21"/>
      <path d="M234 18v30" stroke="#f8c186" strokeWidth="4"/>
      <path d="M165 40v47m-6-7 6 7 6-7M315 40v47m-6-7 6 7 6-7" stroke="#6de2ed" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M196 103c-5-7 6-10 2-18M236 103c-5-7 6-10 2-18M276 103c-5-7 6-10 2-18" stroke="#f9b467" strokeWidth="2" fill="none"/>
      <text x="234" y="214" textAnchor="middle" fill="#a9c5d6" fontSize="12" letterSpacing="2">FORCE · HEAT · DWELL</text>
    </g>}
    <path d="M16 18h10M16 18v10M454 18h-10M454 18v10M16 218h10M16 218v-10M454 218h-10M454 218v-10" stroke="#4ba1ad" strokeWidth="1.4" opacity=".5" fill="none"/>
  </svg>;
}
