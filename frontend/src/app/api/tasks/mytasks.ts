import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GET /api/tasks/my-tasks - Get tasks assigned to current user
export async function GET_myTasks(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const url = status 
      ? `${BACKEND_URL}/tasks/my-tasks?status=${status}`
      : `${BACKEND_URL}/tasks/my-tasks`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('My tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks/[id]/approve
export async function POST_approve(request: NextRequest) {
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

// POST /api/tasks/[id]/complete
export async function POST_complete(request: NextRequest) {
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