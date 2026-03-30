import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/Provider';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppShell from '@/components/AppShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'LogiTask - Logistics Task Management',
  description: 'Automated logistics email task management system',
  keywords: ['logistics', 'task management', 'email automation', 'OTIF'],
  authors: [{ name: 'LogiTask Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow',
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
          <Provider>
            <AppShell>{children}</AppShell>
          </Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}