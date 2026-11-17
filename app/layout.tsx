import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Die Bonding Lab | Paste Adhesive Simulation',
  description: 'Interactive 3D educational simulator for conventional epoxy paste die bonding. Dispense, pick, align, place, cure and inspect.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
