import { Transaction } from './transaction.interface';

export class TransactionService {
  detectPerson(description: string): string {
    const upiMatch = description.match(/upi\s+(?:to|from|pay)\s+([A-Za-z\s]+?)(?:\s*-\s*[0-9]|$|\s+[A-Z0-9]{2,})/i);
    if (upiMatch) {
      const name = upiMatch[1].trim();
      if (name.length > 0 && name.length < 30) return this.titleCase(name);
    }
    const payMatch = description.match(/paid\s+(?:to\s+)?([A-Za-z\s]+?)(?:\s+(?:via|by|on|for|upi)|$)/i);
    if (payMatch) {
      const name = payMatch[1].trim();
      if (name.length > 0 && name.length < 30) return this.titleCase(name);
    }
    return '';
  }

  detectDuplicates(transactions: Transaction[]): Transaction[] {
    const seen = new Map<string, number>();
    return transactions.map((t) => {
      const key = `${t.date.toISOString()}|${t.merchant}|${t.amount}|${t.description}`;
      const count = (seen.get(key) || 0) + 1;
      seen.set(key, count);
      return { ...t, isDuplicate: count > 1 };
    });
  }

  detectRecurring(transactions: Transaction[]): Transaction[] {
    const merchantMonths = new Map<string, Set<string>>();
    for (const t of transactions) {
      const key = t.normalizedMerchant;
      const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
      if (!merchantMonths.has(key)) merchantMonths.set(key, new Set());
      merchantMonths.get(key)!.add(monthKey);
    }
    return transactions.map((t) => {
      const months = merchantMonths.get(t.normalizedMerchant)?.size || 0;
      return { ...t, isRecurring: months >= 2 };
    });
  }

  private titleCase(str: string): string {
    return str.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
  }
}
