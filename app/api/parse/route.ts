import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const parser = new PDFParse({ data: buffer });
    try {
      const data = await parser.getText();
      return NextResponse.json({ text: data.text });
    } finally {
      await parser.destroy();
    }
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 });
  }
}
