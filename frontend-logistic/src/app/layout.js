import './globals.css';
import { Montserrat } from 'next/font/google';
import Sidebar from '../components/Sidebar';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'LogiTrack — Admin Dashboard',
  description: 'Sistem manajemen pengiriman dan logistik',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={montserrat.variable}>
      <body style={{ fontFamily: 'var(--font-montserrat)', background: '#F5EFE6' }}>
        <div className="flex min-h-screen bg-cream-100">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col min-h-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}