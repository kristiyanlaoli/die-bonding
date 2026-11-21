import Landing from '@/components/Landing';

type Locale = 'en' | 'id' | 'zhTW';
export default async function Home({searchParams}: {searchParams:Promise<{lang?:string}>}) {
  const {lang}=await searchParams;
  const initialLanguage:Locale=lang==='id'||lang==='zhTW'?lang:'en';
  return <Landing initialLanguage={initialLanguage}/>;
}
