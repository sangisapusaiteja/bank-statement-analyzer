import { BankParser } from './bank-parser.interface';
import { Transaction } from './transaction.interface';

export class HDFCParser implements BankParser {
  bankName = 'HDFC';

  canParse(text: string): boolean {
    return text.includes('HDFC BANK') || text.includes('HDFC Bank') || text.includes('HDFC');
  }

  parse(text: string, sourceFile: string): Transaction[] {
    const transactions: Transaction[] = [];

    // Each transaction line looks like:
    // 27/07/26   UPI-N16 FOOD COURT-313678988206971@CNRB-   0000169677758135   27/07/26   80.00   152,756.65
    // 01/08/26   NEFT CR-UTIB0002890-MS. M/S BHARGO INNOV   AXOBU21330175638   01/08/26   4,839.00   147,629.78
    //
    // Pattern: date, narration, ref no, value date, amount (withdrawal or deposit), closing balance
    // The PDF has 3 columns (Withdrawal, Deposit, Balance) but the zero column is omitted in text
    const regex = /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+([A-Za-z0-9]{10,})\s+\d{2}\/\d{2}\/\d{2}\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
      const dateStr = match[1];
      const fullNarration = match[2].trim();
      const refNo = match[3];
      const amountStr = match[4];
      const balanceStr = match[5];

      const date = this.parseDate(dateStr);
      const amount = this.parseAmount(amountStr);
      const balance = this.parseAmount(balanceStr);

      const merchant = this.extractMerchant(fullNarration);

      transactions.push({
        date,
        description: fullNarration,
        debit: 0,
        credit: 0,
        amount,
        currency: 'INR',
        balance,
        referenceNumber: refNo,
        merchant,
        normalizedMerchant: '',
        category: '',
        transactionType: '',
        person: '',
        isDuplicate: false,
        isRecurring: false,
        sourceFile,
      });
    }

    // Determine credit/debit by comparing each balance to the previous one
    // Extract opening balance from the statement summary
    const openingBal = this.extractOpeningBalance(text);

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const absAmount = Math.abs(t.amount);

      if (i === 0 && openingBal > 0) {
        // First transaction: compare to opening balance
        // If balance + amount == opening, it's a debit (balance decreased)
        // If balance - amount == opening, it's a credit (balance increased)
        if (Math.abs(t.balance + absAmount - openingBal) < 0.01) {
          t.debit = absAmount; t.credit = 0; t.transactionType = 'Debit';
        } else {
          t.credit = absAmount; t.debit = 0; t.transactionType = 'Credit';
        }
      } else if (i > 0) {
        const prevBalance = transactions[i - 1].balance;
        const balanceDiff = Math.round((t.balance - prevBalance) * 100) / 100;
        if (balanceDiff > 0) {
          t.credit = absAmount; t.debit = 0; t.transactionType = 'Credit';
        } else {
          t.debit = absAmount; t.credit = 0; t.transactionType = 'Debit';
        }
      } else {
        // Fallback: keyword detection
        if (/NEFT CR|CREDIT|INTEREST|DEPOSIT/i.test(t.description)) {
          t.credit = absAmount; t.debit = 0; t.transactionType = 'Credit';
        } else {
          t.debit = absAmount; t.credit = 0; t.transactionType = 'Debit';
        }
      }
    }

    return transactions;
  }

  private extractMerchant(narration: string): string {
    // UPI format: UPI-MERCHANT-REF@BANK or UPI-PERSON-REF@BANK
    if (narration.toUpperCase().startsWith('UPI')) {
      // Remove "UPI-" prefix
      const afterUpi = narration.replace(/^UPI[- ]/i, '');
      // Split by first dash that has a number after it (the reference)
      // Merchant name is everything before the first occurrence of a digit sequence
      const merchantMatch = afterUpi.match(/^([A-Za-z\s.&]+?)(?:\s*-\s*\d|@|$)/);
      if (merchantMatch) {
        return merchantMatch[1].trim();
      }
      // Fallback: take everything before @ or first -
      return afterUpi.split(/[@-]/)[0]?.trim() || afterUpi;
    }

    // NEFT CR format: NEFT CR-BANKCODE-MS. COMPANY NAME-REF
    if (narration.toUpperCase().startsWith('NEFT CR')) {
      const parts = narration.split('-');
      // Skip NEFT CR, bank code, take the company name
      if (parts.length >= 3) {
        return parts.slice(2).join('-').replace(/-[\w\d]+$/, '').trim();
      }
      return narration.replace(/^NEFT CR[- ]/i, '').trim();
    }

    return narration.split(/[-@]/)[0]?.trim() || narration;
  }

  private parseDate(str: string): Date {
    const parts = str.split('/');
    return new Date(2000 + parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  private parseAmount(str: string): number {
    return parseFloat(str.replace(/,/g, ''));
  }

  private extractOpeningBalance(text: string): number {
    // HDFC statement summary: "STATEMENT SUMMARY :-  Opening Balance   Dr Count   Cr Count   Debits   Credits   Closing Bal  152,836.65   42   4   17,704.87   5,189.00   140,320.78"
    // The opening balance is the first number after "Opening Balance" in the summary section
    const summarySection = text.match(/STATEMENT\s*SUMMARY[\s\S]{0,500}/i);
    if (summarySection) {
      const nums = summarySection[0].match(/[\d,]+\.\d{2}/g);
      if (nums && nums.length >= 5) {
        return this.parseAmount(nums[0]); // Opening Balance
      }
    }
    return 0;
  }
}
