import { Transaction, VendorSummary, CategorySummary, MonthlySummary, SummaryData, AnalysisResult } from './transaction.interface';

export class ReportService {
  buildAnalysis(transactions: Transaction[]): AnalysisResult {
    const vendors = this.buildVendorSummary(transactions);
    const categories = this.buildCategorySummary(transactions);
    const monthly = this.buildMonthlySummary(transactions);
    const summary = this.buildSummary(transactions, vendors, categories);
    return { transactions, vendors, categories, monthly, summary };
  }

  private buildVendorSummary(transactions: Transaction[]): VendorSummary[] {
    const map = new Map<string, { debit: number; credit: number; count: number; category: string }>();
    for (const t of transactions) {
      const key = t.normalizedMerchant;
      const existing = map.get(key) || { debit: 0, credit: 0, count: 0, category: t.category };
      existing.debit += t.debit;
      existing.credit += t.credit;
      existing.count++;
      if (!map.has(key)) map.set(key, existing);
    }
    return Array.from(map.entries()).map(([vendor, data]) => ({
      vendor, debitTotal: Math.round(data.debit * 100) / 100, creditTotal: Math.round(data.credit * 100) / 100,
      balance: Math.round((data.credit - data.debit) * 100) / 100, transactionCount: data.count, category: data.category,
    })).sort((a, b) => b.debitTotal - a.debitTotal);
  }

  private buildCategorySummary(transactions: Transaction[]): CategorySummary[] {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of transactions) {
      const key = t.category;
      const existing = map.get(key) || { total: 0, count: 0 };
      existing.total += t.debit + t.credit;
      existing.count++;
      if (!map.has(key)) map.set(key, existing);
    }
    return Array.from(map.entries()).map(([category, data]) => ({
      category, total: Math.round(data.total * 100) / 100, count: data.count,
    })).sort((a, b) => b.total - a.total);
  }

  private buildMonthlySummary(transactions: Transaction[]): MonthlySummary[] {
    const map = new Map<string, { debit: number; credit: number; count: number; month: string; year: number }>();
    for (const t of transactions) {
      const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
      const existing = map.get(key) || { debit: 0, credit: 0, count: 0, month: t.date.toLocaleString('default', { month: 'long' }), year: t.date.getFullYear() };
      existing.debit += t.debit;
      existing.credit += t.credit;
      existing.count++;
      if (!map.has(key)) map.set(key, existing);
    }
    return Array.from(map.values()).map((d) => ({
      month: d.month, year: d.year, debitTotal: Math.round(d.debit * 100) / 100, creditTotal: Math.round(d.credit * 100) / 100, transactionCount: d.count,
    })).sort((a, b) => a.year - b.year || new Date(`${a.month} 1`).getMonth() - new Date(`${b.month} 1`).getMonth());
  }

  private buildSummary(transactions: Transaction[], vendors: VendorSummary[], categories: CategorySummary[]): SummaryData {
    const totalDebit = Math.round(transactions.reduce((s, t) => s + t.debit, 0) * 100) / 100;
    const totalCredit = Math.round(transactions.reduce((s, t) => s + t.credit, 0) * 100) / 100;
    const sortedByDebit = [...transactions].sort((a, b) => b.debit - a.debit);
    const sortedByCredit = [...transactions].sort((a, b) => b.credit - a.credit);
    const merchantFreq = new Map<string, number>();
    for (const t of transactions) merchantFreq.set(t.normalizedMerchant, (merchantFreq.get(t.normalizedMerchant) || 0) + 1);
    let mostFreq = '', maxFreq = 0;
    for (const [m, c] of merchantFreq) { if (c > maxFreq) { maxFreq = c; mostFreq = m; } }
    const dateRange = transactions.length > 0 ? Math.max(1, Math.ceil((transactions[transactions.length - 1].date.getTime() - transactions[0].date.getTime()) / (1000 * 60 * 60 * 24))) : 1;
    return {
      totalTransactions: transactions.length, totalDebit, totalCredit, netBalance: Math.round((totalCredit - totalDebit) * 100) / 100,
      topVendors: vendors.slice(0, 10).map((v) => ({ vendor: v.vendor, total: v.debitTotal + v.creditTotal })),
      topCategories: categories.slice(0, 10).map((c) => ({ category: c.category, total: c.total })),
      largestExpense: sortedByDebit[0] || null, largestCredit: sortedByCredit[0] || null,
      mostFrequentMerchant: mostFreq, averageDailySpend: Math.round((totalDebit / dateRange) * 100) / 100,
    };
  }
}
