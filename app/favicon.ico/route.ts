import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { join } from 'path';

export async function GET() {
  const filePath = join(process.cwd(), 'public', 'favicon.svg');
  const svg = await readFile(filePath);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
