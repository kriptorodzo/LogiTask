import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GET /api/inbound/summary - Get manager dashboard summary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(session as any)?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/inbound/summary`, {
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Inbound summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbound summary' },
      { status: 500 }
    );
  }
}