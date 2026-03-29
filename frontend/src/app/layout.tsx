import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/Provider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { headers } from 'next/headers';

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
  // Get base URL for canonical
  const headersList = headers();
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const host = headersList.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={baseUrl} />
        <link rel="preconnect" href={baseUrl} />
        <link rel="dns-prefetch" href={baseUrl} />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <Provider>{children}</Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
}