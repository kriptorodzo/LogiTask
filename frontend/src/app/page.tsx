'use client';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import PageShell from '@/components/PageShell';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <PageShell title="Dashboard" subtitle="Overview of your logistics operations">
      <Dashboard />
    </PageShell>
  );
}