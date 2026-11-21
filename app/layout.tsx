import type { Metadata } from 'next';
import './globals.css';

export const metadata:Metadata = {
  title: 'Die Bonding Lab | Four Interactive 3D Simulators',
  description: 'Explore four semiconductor die bonding processes in one interactive 3D laboratory: Paste Adhesive, Die Attach Film, Flip Chip Mass Reflow and Thermo-Compression Bonding.',
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
