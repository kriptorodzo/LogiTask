import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Helper function to forward requests to backend
async function forwardToBackend(
  method: string,
  path: string,
  session: any,
  body?: any
) {
  const url = `${BACKEND_URL}${path}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

// ============================================
// EMAILS API
// ============================================

export async function GET_emails(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    const response = await fetch(`${BACKEND_URL}/emails?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Emails API error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

// ============================================
// TASKS API
// ============================================

export async function GET_tasks(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    const response = await fetch(`${BACKEND_URL}/tasks?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST_taskApprove(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, assigneeId } = body;

    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ assigneeId }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Task approve error:', error);
    return NextResponse.json({ error: 'Failed to approve task' }, { status: 500 });
  }
}

export async function POST_taskComplete(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, result } = body;

    const response = await fetch(`${BACKEND_URL}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ result }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Task complete error:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}

// ============================================
// REPORTS API
// ============================================

export async function GET_reports(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    const response = await fetch(`${BACKEND_URL}/reports/overview?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function GET_reportsOtif(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    const response = await fetch(`${BACKEND_URL}/reports/otif?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('OTIF Reports API error:', error);
    return NextResponse.json({ error: 'Failed to fetch OTIF data' }, { status: 500 });
  }
}

// ============================================
// PERFORMANCE API
// ============================================

export async function GET_performanceScorecard(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month') || new Date().getMonth() + 1;
    const year = searchParams.get('year') || new Date().getFullYear();

    const response = await fetch(
      `${BACKEND_URL}/performance/scorecard/${userId}?month=${month}&year=${year}`,
      {
        headers: { 'Authorization': `Bearer ${session.accessToken}` },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Performance scorecard error:', error);
    return NextResponse.json({ error: 'Failed to fetch scorecard' }, { status: 500 });
  }
}

export async function GET_performanceLeaderboard(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const response = await fetch(`${BACKEND_URL}/performance/leaderboard?period=${period}`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Performance leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

// ============================================
// NOTIFICATIONS API
// ============================================

export async function GET_notifications(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    const response = await fetch(`${BACKEND_URL}/notifications?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// ============================================
// USERS API
// ============================================

export async function GET_users(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/users`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function GET_coordinators(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/users/coordinators`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Coordinators API error:', error);
    return NextResponse.json({ error: 'Failed to fetch coordinators' }, { status: 500 });
  }
}