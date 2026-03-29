import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month') || new Date().getMonth() + 1;
    const year = searchParams.get('year') || new Date().getFullYear();

    const url = userId 
      ? `${BACKEND_URL}/performance/scorecard/${userId}?month=${month}&year=${year}`
      : `${BACKEND_URL}/performance/scorecard`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Performance scorecard error:', error);
    return NextResponse.json({ error: 'Failed to fetch scorecard' }, { status: 500 });
  }
}