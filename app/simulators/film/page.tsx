import Simulator from '@/simulators/film/components/Simulator';
import type { Locale } from '@/simulators/film/lib/simulation';

export default async function FilmSimulatorPage({searchParams}: {searchParams: Promise<{lang?:string}>}) {
  const {lang} = await searchParams;
  const initialLanguage:Locale=lang==='id'||lang==='zhTW'?lang:'en';
  return <Simulator initialLanguage={initialLanguage}/>;
}
