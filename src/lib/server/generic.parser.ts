import { BankParser } from './bank-parser.interface';
import { Transaction } from './transaction.interface';

export class GenericParser implements BankParser {
  bankName = 'Generic';

  canParse(_text: string): boolean {
    return true;
  }

  parse(text: string, sourceFile: string): Transaction[] {
    const transactions: Transaction[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const txn = this.tryParseLine(trimmed, sourceFile);
      if (txn) transactions.push(txn);
    }

    return transactions;
  }

  private tryParseLine(line: string, sourceFile: string): Transaction | null {
    const patterns = [
      // dd-Mon-YYYY with Cr/Dr
      /(\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s+(Cr|Dr|CREDIT|DEBIT)\s*([\d,]+\.?\d*)?/i,
      // dd/mm/yyyy with Cr/Dr
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s+(Cr|Dr|CREDIT|DEBIT)\s*([\d,]+\.?\d*)?/i,
      // dd-Mon with Cr/Dr
      /^(\d{1,2}[-/][A-Za-z]{3})\s+(.+?)\s+([\d,]+\.?\d*)\s+(Cr|Dr|CREDIT|DEBIT)\s*([\d,]+\.?\d*)?/i,
      // dd/mm/yy with two amounts (debit credit)
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/,
      // dd-Mon with two amounts
      /^(\d{1,2}[-/][A-Za-z]{3})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/,
      // Date followed by description then amount (no Cr/Dr indicator)
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s*$/,
      // UPI transaction line: date, UPI ref, name, amount
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(UPI[^0-9]+?)([\d,]+\.?\d*)/i,
      // Simple: date + description + amount (no decimals)
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+)\s*$/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const date = this.parseDate(match[1]);
        const description = match[2].trim();
        const amount = this.parseAmount(match[3]);
        const isCredit = match[4] ? /cr|credit/i.test(match[4]) : false;
        const balance = match[5] ? this.parseAmount(match[5]) : 0;

        let debit = 0, credit = 0;
        if (match[4] && /cr|credit/i.test(match[4])) {
          credit = amount;
        } else if (match[4] && /dr|debit/i.test(match[4])) {
          debit = amount;
        } else {
          debit = amount;
        }

        const merchant = this.extractMerchant(description);

        return {
          date, description,
          debit, credit,
          amount: debit || credit,
          currency: 'INR',
          balance,
          referenceNumber: '',
          merchant,
          normalizedMerchant: '',
          category: '',
          transactionType: credit > 0 ? 'Credit' : 'Debit',
          person: '',
          isDuplicate: false,
          isRecurring: false,
          sourceFile,
        };
      }
    }
    return null;
  }

  private extractMerchant(description: string): string {
    const cleaned = description.replace(/^UPI[- ]/i, '').replace(/^NEFT[- ]/i, '').replace(/^RTGS[- ]/i, '').replace(/^IMPS[- ]/i, '').trim();
    const parts = cleaned.split(/[-@/]/);
    return parts[0]?.trim() || cleaned;
  }

  private parseDate(str: string): Date {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const parts = str.split(/[\/-]/);
    if (parts.length === 3) {
      if (isNaN(parseInt(parts[1]))) {
        const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
        return new Date(year, months[parts[1].toLowerCase()] ?? 0, parseInt(parts[0]));
      }
      if (parts[2].length === 2) parts[2] = '20' + parts[2];
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    if (parts.length === 2) {
      return new Date(2025, months[parts[1].toLowerCase()] ?? 0, parseInt(parts[0]));
    }
    return new Date();
  }

  private parseAmount(str: string): number {
    return parseFloat(str.replace(/,/g, ''));
  }
}
