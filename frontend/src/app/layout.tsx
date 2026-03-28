import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/Provider';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Logistics Email Processor',
  description: 'Automated logistics email task management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Provider>{children}</Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}