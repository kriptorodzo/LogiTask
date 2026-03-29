import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import TopBar from '@/components/TopBar';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <TopBar 
        title="Dashboard" 
        subtitle="Overview of your logistics operations"
        breadcrumbs={[
          { label: 'Dashboard' }
        ]}
      />
      <div className="page-content">
        <Dashboard />
      </div>
    </>
  );
}