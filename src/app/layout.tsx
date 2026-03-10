import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import SessionProvider from '@/components/SessionProvider';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OncoFHIR Lens',
  description: 'Genomic variant analysis for clinical decision support',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={jakarta.className}>
        <SessionProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
