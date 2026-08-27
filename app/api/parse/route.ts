import { NextResponse } from 'next/server';

// Server-side parsing is disabled as PDF text extraction is handled client-side
// to prevent Vercel Serverless environment canvas/DOMMatrix issues.
export async function POST() {
  return NextResponse.json(
    { error: 'Server-side parsing is disabled. Client-side PDF parsing is used instead.' },
    { status: 400 }
  );
}
