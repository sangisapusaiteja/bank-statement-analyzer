import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const password = (formData.get('password') as string) || '';

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
    }

    const file = files[0];
    const buffer = await file.arrayBuffer();

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      password: password || undefined,
      useSystemFonts: true,
      disableWorker: true,
      isEvalSupported: false,
    } as any);
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      for (const item of content.items as any[]) {
        text += item.str + ' ';
      }
      text += '\n';
    }

    const lines = text.trim().split('\n').filter(l => l.trim()).slice(0, 100);

    return NextResponse.json({
      totalChars: text.length,
      totalLines: lines.length,
      sampleLines: lines.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Error' }, { status: 500 });
  }
}
