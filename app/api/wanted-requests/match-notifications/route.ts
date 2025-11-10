import { NextRequest, NextResponse } from 'next/server';
import { getActiveMatchNotifications, dismissNotification, getActiveNotificationCount } from '@/lib/services/wantedMatching';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

// GET: Fetch active match notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('countOnly') === 'true';

    if (countOnly) {
      const count = await getActiveNotificationCount();
      return NextResponse.json({ count });
    }

    const notifications = await getActiveMatchNotifications();
    return NextResponse.json({ notifications });

  } catch (error) {
    logger.error('Error in GET /api/wanted-requests/match-notifications', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Dismiss a notification
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const result = await dismissNotification(notificationId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to dismiss notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Error in POST /api/wanted-requests/match-notifications', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Clean up old notifications (for maintenance)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you can implement this check based on your admin logic)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Import the cleanup function dynamically to avoid issues
    const { cleanupOldNotifications } = await import('@/lib/services/wantedMatching');
    await cleanupOldNotifications();

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Error in DELETE /api/wanted-requests/match-notifications', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}