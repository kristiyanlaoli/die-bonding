import Simulator from '@/simulators/paste/components/Simulator';
import type { Locale } from '@/simulators/paste/lib/simulation';

export default async function PasteSimulatorPage({searchParams}: {searchParams: Promise<{lang?:string}>}) {
  const {lang} = await searchParams;
  const initialLanguage:Locale=lang==='id'||lang==='zhTW'?lang:'en';
  return <Simulator initialLanguage={initialLanguage}/>;
}
