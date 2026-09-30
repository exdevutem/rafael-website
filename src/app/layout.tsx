import { SessionProvider } from '@/shared/auth/session';
import '@/shared/auth/login.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Footer from '@/shared/layouts/footer/footer';
import Sidebar from '@/shared/layouts/sidebar/sidebar';
import './globals.css';
export const metadata: Metadata = {
  title: 'Rafael | ExDev',
  description: 'Plataforma interna de administración del club ExDev.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="rf-skip" href="#contenido">
          Saltar al contenido
        </a>
        <SessionProvider>
          <Sidebar />
          <div className="rafael-body">
            <main id="contenido" className="rafael-content">
              {children}
            </main>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
