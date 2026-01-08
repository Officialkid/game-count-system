import { NextResponse } from 'next/server';

// Coffee support API disabled: use Ko-fi overlay instead
export async function POST() {
  return NextResponse.json({ error: 'Support endpoint disabled. Please use Ko-fi.' }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: 'Support endpoint disabled. Please use Ko-fi.' }, { status: 410 });
}
