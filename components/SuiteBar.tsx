'use client';

import Link from 'next/link';
import { ChevronDown, House, Layers3 } from 'lucide-react';

type Kind = 'paste' | 'film' | 'reflow' | 'tcb';
type Language = 'en' | 'id' | 'zhTW';
const kinds: { key: Kind; title: string; compact: string }[] = [
  { key: 'paste', title: 'Paste Adhesive', compact: 'Paste' },
  { key: 'film', title: 'Die Attach Film', compact: 'Film / DAF' },
  { key: 'reflow', title: 'Flip Chip Mass Reflow', compact: 'Mass Reflow' },
  { key: 'tcb', title: 'Thermo-Compression', compact: 'TCB' },
];
export default function SuiteBar({kind, language}: {kind: Kind; language: Language}) {
  const current = kinds.find(x => x.key===kind)!;
  return <div className="suite-bar">
    <Link className="suite-home" href={`/?lang=${language}`} aria-label="Back to Die Bonding Lab home">
      <House size={15}/><span>DIE BONDING LAB</span><span className="suite-tag">/ ALL PROCESSES</span>
    </Link>
    <nav className="suite-links" aria-label="Switch bonding process">
      {kinds.map(item => <Link key={item.key} href={`/simulators/${item.key}?lang=${language}`} className={kind===item.key?'selected':''} aria-current={kind===item.key?'page':undefined}>{item.compact}</Link>)}
    </nav>
    <details className="suite-navigation-mobile">
      <summary><Layers3 size={14}/>{current.compact}<ChevronDown size={14}/></summary>
      <nav className="mobile-menu" aria-label="Switch bonding process">
        <Link href={`/?lang=${language}`}><House size={13} style={{verticalAlign:'middle',marginRight:8}}/>All simulators</Link>
        {kinds.map(item => <Link key={item.key} href={`/simulators/${item.key}?lang=${language}`} className={kind===item.key?'selected':''} aria-current={kind===item.key?'page':undefined}>{item.title}</Link>)}
      </nav>
    </details>
  </div>;
}
