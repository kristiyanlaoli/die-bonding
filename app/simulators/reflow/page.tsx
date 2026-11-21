import Simulator from '@/simulators/reflow/components/Simulator';
import type { Locale } from '@/simulators/reflow/lib/simulation';

export default async function ReflowSimulatorPage({searchParams}: {searchParams: Promise<{lang?:string}>}) {
  const {lang} = await searchParams;
  const initialLanguage:Locale=lang==='id'||lang==='zhTW'?lang:'en';
  return <Simulator initialLanguage={initialLanguage}/>;
}
