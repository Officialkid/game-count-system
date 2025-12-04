// app/api/events/[eventId]/stream/route.ts
import { NextRequest } from 'next/server';
import { subscribe } from '@/lib/sse';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

// Store active connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;

  // Basic rate limiting: 120 connections per minute per IP
  const rl = checkRateLimit(request, { limit: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetTime!, 'Too many stream connections');
  }

  // Create a stream
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to map
      if (!connections.has(eventId)) {
        connections.set(eventId, new Set());
      }
      connections.get(eventId)!.add(controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', eventId })}\n\n`));

      // Subscribe to SSE channel for this event
      const unsubscribe = subscribe(`event:${eventId}`, (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      });

      // Send keepalive every 30 seconds
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
        } catch (error) {
          clearInterval(keepalive);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch (error) {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Broadcasting moved to lib/sse via publish()
