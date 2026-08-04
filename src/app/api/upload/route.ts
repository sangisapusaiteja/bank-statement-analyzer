import { NextRequest, NextResponse } from 'next/server';
import { GenericParser } from '@/lib/server/generic.parser';
import { HDFCParser } from '@/lib/server/hdfc.parser';
import { MerchantService } from '@/lib/server/merchant.service';
import { CategoryService } from '@/lib/server/category.service';
import { TransactionService } from '@/lib/server/transaction.service';
import { ReportService } from '@/lib/server/report.service';
import { ExcelService } from '@/lib/server/excel.service';
import { InsightsService } from '@/lib/server/insights.service';
import { BankParser } from '@/lib/server/bank-parser.interface';
import { Transaction } from '@/lib/server/transaction.interface';

async function extractTextWithPdfjs(buffer: ArrayBuffer, password?: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    password,
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
  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const password = (formData.get('password') as string) || '';

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
    }

    const parsers: BankParser[] = [new HDFCParser(), new GenericParser()];
    const merchantService = new MerchantService();
    const categoryService = new CategoryService();
    const transactionService = new TransactionService();
    const reportService = new ReportService();
    const excelService = new ExcelService();
    const insightsService = new InsightsService();

    const allTransactions: Transaction[] = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ message: `Invalid file type: ${file.name}. Only PDF files are allowed.` }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();

      let text = '';
      try {
        text = await extractTextWithPdfjs(buffer, password || undefined);
      } catch (err: any) {
        if (err?.name === 'PasswordException') {
          return NextResponse.json({ message: `Password-protected PDF: ${file.name}. Provide the correct password.` }, { status: 400 });
        }
        return NextResponse.json({ message: err.message || `Could not extract text from: ${file.name}` }, { status: 400 });
      }

      if (!text || text.trim().length < 50) {
        return NextResponse.json({ message: `No text could be extracted from: ${file.name}` }, { status: 400 });
      }

      let transactions: Transaction[] = [];
      for (const parser of parsers) {
        if (parser.canParse(text)) {
          transactions = parser.parse(text, file.name);
          break;
        }
      }

      if (transactions.length === 0) {
        return NextResponse.json({ message: `No transactions found in: ${file.name}` }, { status: 400 });
      }

      allTransactions.push(...transactions);
    }

    if (allTransactions.length === 0) {
      return NextResponse.json({ message: 'No transactions could be extracted' }, { status: 400 });
    }

    const enriched = allTransactions.map((t) => ({ ...t, normalizedMerchant: merchantService.normalize(t.merchant) }));
    const categorized = enriched.map((t) => ({ ...t, category: categoryService.detect(t.normalizedMerchant, t.description) }));
    const withPerson = categorized.map((t) => ({ ...t, person: transactionService.detectPerson(t.description) }));
    const deduped = transactionService.detectDuplicates(withPerson);
    const withRecurring = transactionService.detectRecurring(deduped);

    const analysis = reportService.buildAnalysis(withRecurring);
    const insights = insightsService.generate(analysis);
    const xlsxBuffer = await excelService.generateReport(analysis);

    const base64 = Buffer.from(xlsxBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.summary,
        vendors: analysis.vendors,
        categories: analysis.categories,
        monthly: analysis.monthly,
        transactions: analysis.transactions.map((t) => ({
          ...t,
          date: t.date.toISOString(),
        })),
        insights,
      },
      excelBase64: base64,
      filename: `BankStatement_Report_${Date.now()}.xlsx`,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'An error occurred' }, { status: 500 });
  }
}
