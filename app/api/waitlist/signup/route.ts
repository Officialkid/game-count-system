/**
 * Waitlist Signup API
 * POST /api/waitlist/signup
 * 
 * Handles premium features waitlist signups
 * Fields: name, email, phone, whatsapp_opt_in, consent, source
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db-client';
import { successResponse, errorResponse } from '@/lib/api-responses';

// Validation schema
const WaitlistSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .transform(s => s.trim()),
  email: z.string()
    .email('Invalid email address')
    .transform(s => s.toLowerCase().trim()),
  phone: z.string()
    .optional()
    .transform(s => s?.trim() || null),
  whatsapp_opt_in: z.boolean().default(false),
  consent: z.boolean().refine(v => v === true, {
    message: 'You must consent to be added to the waitlist'
  }),
  source: z.enum(['expired-event', 'landing-page', 'premium-page', 'other']).default('expired-event'),
});

type WaitlistInput = z.infer<typeof WaitlistSchema>;

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        errorResponse('BAD_REQUEST', 'Invalid JSON in request body'),
        { status: 400 }
      );
    }

    // Validate input
    let validated: WaitlistInput;
    try {
      validated = WaitlistSchema.parse(body);
    } catch (error: any) {
      const fieldErrors = error.errors?.[0]?.message || 'Validation failed';
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', fieldErrors),
        { status: 400 }
      );
    }

    // Check if email already exists (case-insensitive)
    const existing = await query(
      'SELECT id FROM waitlist WHERE LOWER(email) = $1',
      [validated.email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        errorResponse('CONFLICT', 'This email is already on the waitlist'),
        { status: 409 }
      );
    }

    // Insert into waitlist
    const result = await query(
      `INSERT INTO waitlist (name, email, phone, whatsapp_opt_in, consent, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, created_at`,
      [
        validated.name,
        validated.email,
        validated.phone,
        validated.whatsapp_opt_in,
        validated.consent,
        validated.source,
      ]
    );

    const entry = result.rows[0];

    // Log for analytics
    console.log(`[WAITLIST] New signup: ${validated.email} (${validated.source})`);

    // TODO: Send confirmation email
    // TODO: Sync to Google Sheets (if configured)

    return NextResponse.json(
      successResponse({
        message: 'Successfully added to waitlist!',
        email: entry.email,
        id: entry.id,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[WAITLIST] Signup error:', error);

    // Handle duplicate email from database constraint
    if (error.code === '23505') {
      return NextResponse.json(
        errorResponse('CONFLICT', 'This email is already on the waitlist'),
        { status: 409 }
      );
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to add to waitlist'),
      { status: 500 }
    );
  }
}

/**
 * GET /api/waitlist/signup
 * Health check endpoint (optional)
 */
export async function GET(request: Request) {
  return NextResponse.json(
    successResponse({
      message: 'Waitlist signup endpoint is active',
      methods: ['POST'],
    }),
    { status: 200 }
  );
}
