import Simulator from '@/simulators/tcb/components/Simulator';
import type { Locale } from '@/simulators/tcb/lib/simulation';

export default async function TcbSimulatorPage({searchParams}: {searchParams: Promise<{lang?:string}>}) {
  const {lang} = await searchParams;
  const initialLanguage:Locale=lang==='id'||lang==='zhTW'?lang:'en';
  return <Simulator initialLanguage={initialLanguage}/>;
}
