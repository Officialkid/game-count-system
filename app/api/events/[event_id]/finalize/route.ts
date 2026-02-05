import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validateAdminToken, prepareEventForResponse } from '@/lib/firebase-helpers';

/**
 * POST /api/events/[event_id]/finalize
 * Marks an event as finalized (admin only)
 * Once finalized, the event shows "Final Results" instead of "Live Scores"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { event_id: string } }
) {
  try {
    const event_id = params.event_id;

    // Require admin token via header
    const admin_token = request.headers.get('x-admin-token');
    if (!admin_token) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'X-ADMIN-TOKEN header required'
          }
        },
        { status: 401 }
      );
    }

    // Verify admin token
    const isValid = await validateAdminToken(event_id, admin_token);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Invalid admin token or access denied'
          }
        },
        { status: 403 }
      );
    }

    // Get event to check status
    const eventDoc = await db.collection('events').doc(event_id).get();
    
    if (!eventDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Event not found'
          }
        },
        { status: 404 }
      );
    }

    const event = eventDoc.data();

    // Expired events cannot be finalized
    if (event?.status === 'expired' || event?.status === 'archived') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'GONE',
            message: 'Event expired'
          }
        },
        { status: 410 }
      );
    }

    // Check if already finalized
    if (event?.isFinalized) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'CONFLICT',
            message: 'Event already finalized'
          }
        },
        { status: 409 }
      );
    }

    // Finalize the event using transaction
    await db.runTransaction(async (transaction: any) => {
      const eventRef = db.collection('events').doc(event_id);
      const eventSnapshot = await transaction.get(eventRef);
      
      if (!eventSnapshot.exists) {
        throw new Error('Event not found');
      }
      
      // Update event as finalized
      transaction.update(eventRef, {
        isFinalized: true,
        finalizedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // Optional: Recalculate all team totals for accuracy
      const teamsSnapshot = await eventRef.collection('teams').get();
      
      for (const teamDoc of teamsSnapshot.docs) {
        const scoresSnapshot = await teamDoc.ref.collection('scores').get();
        const totalPoints = scoresSnapshot.docs.reduce(
          (sum: number, scoreDoc: any) => sum + (scoreDoc.data().points || 0),
          0
        );
        
        transaction.update(teamDoc.ref, {
          totalPoints,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    });

    // Get updated event
    const updatedDoc = await db.collection('events').doc(event_id).get();
    const updatedEvent = prepareEventForResponse({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          event: {
            id: updatedEvent.id,
            name: updatedEvent.name,
            isFinalized: updatedEvent.isFinalized,
            finalizedAt: updatedEvent.finalizedAt
          },
          message: 'Event finalized successfully'
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Finalize event error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to finalize event',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[event_id]/finalize
 * Unfinalize an event (admin only) - allows re-opening for edits
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { event_id: string } }
) {
  try {
    const event_id = params.event_id;
    const { searchParams } = new URL(request.url);
    const admin_token = request.headers.get('x-admin-token') || searchParams.get('admin_token');

    if (!admin_token) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin token required'
          }
        },
        { status: 401 }
      );
    }

    // Verify admin token
    const isValid = await validateAdminToken(event_id, admin_token);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Invalid admin token or access denied'
          }
        },
        { status: 403 }
      );
    }

    // Unfinalize the event
    await db.collection('events').doc(event_id).update({
      isFinalized: false,
      finalizedAt: null,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Get updated event
    const updatedDoc = await db.collection('events').doc(event_id).get();
    
    if (!updatedDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Event not found'
          }
        },
        { status: 404 }
      );
    }

    const updatedEvent = prepareEventForResponse({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          event: {
            id: updatedEvent.id,
            name: updatedEvent.name,
            isFinalized: updatedEvent.isFinalized
          },
          message: 'Event unfinalized successfully'
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Unfinalize event error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unfinalize event',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
}
