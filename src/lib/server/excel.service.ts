import ExcelJS from 'exceljs';
import { Transaction, AnalysisResult } from './transaction.interface';

function safeNum(v: number | undefined | null): number {
  if (v == null || isNaN(v) || !isFinite(v)) return 0;
  return v;
}

function safeStr(v: any): string {
  if (v == null) return '';
  return String(v);
}

function fmtDate(d: Date | string): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.toISOString().split('T')[0];
}

export class ExcelService {
  async generateReport(data: AnalysisResult): Promise<ExcelJS.Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'StatementAnalytics';
    wb.created = new Date();

    this.addSheet(wb, 'Summary', ['Metric', 'Value'], [
      ['Total Transactions', data.summary.totalTransactions],
      ['Total Credits', safeNum(data.summary.totalCredit)],
      ['Total Debits', safeNum(data.summary.totalDebit)],
      ['Net Balance', safeNum(data.summary.netBalance)],
      ['Average Daily Spend', safeNum(data.summary.averageDailySpend)],
      ['Most Frequent Merchant', safeStr(data.summary.mostFrequentMerchant)],
      ['Largest Expense', data.summary.largestExpense ? `${safeStr(data.summary.largestExpense.normalizedMerchant)}: ${safeNum(data.summary.largestExpense.debit)}` : 'N/A'],
      ['Largest Credit', data.summary.largestCredit ? `${safeStr(data.summary.largestCredit.normalizedMerchant)}: ${safeNum(data.summary.largestCredit.credit)}` : 'N/A'],
    ]);

    const catTotal = data.categories.reduce((s, x) => s + safeNum(x.total), 0);
    this.addSheet(wb, 'Dashboard Data', ['Category', 'Total', 'Count', 'Percentage'],
      data.categories.map(c => [c.category, safeNum(c.total), c.count, catTotal > 0 ? `${((safeNum(c.total) / catTotal) * 100).toFixed(1)}%` : '0%'])
    );

    this.addSheet(wb, 'All Transactions',
      ['Date', 'Description', 'Merchant', 'Category', 'Debit', 'Credit', 'Amount', 'Currency', 'Balance', 'Ref No', 'Type', 'Person', 'Duplicate', 'Recurring'],
      data.transactions.map(t => [fmtDate(t.date), t.description, t.normalizedMerchant, t.category, safeNum(t.debit), safeNum(t.credit), safeNum(t.amount), t.currency, safeNum(t.balance), t.referenceNumber, t.transactionType, t.person, t.isDuplicate ? 'Yes' : '', t.isRecurring ? 'Yes' : ''])
    );

    const creditTxns = data.transactions.filter(t => safeNum(t.credit) > 0);
    this.addSheet(wb, 'Income', ['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Ref No', 'Person'],
      creditTxns.map(t => [fmtDate(t.date), t.description, t.normalizedMerchant, t.category, safeNum(t.credit), t.referenceNumber, t.person])
    );

    const debitTxns = data.transactions.filter(t => safeNum(t.debit) > 0);
    this.addSheet(wb, 'Expenses', ['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Ref No', 'Person'],
      debitTxns.map(t => [fmtDate(t.date), t.description, t.normalizedMerchant, t.category, safeNum(t.debit), t.referenceNumber, t.person])
    );

    const salaryTxns = data.transactions.filter(t => t.category === 'Salary');
    this.addSheet(wb, 'Salary', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      salaryTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.credit || t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const upiTxns = data.transactions.filter(t => (t.description || '').toLowerCase().includes('upi'));
    this.addSheet(wb, 'UPI', ['Date', 'Description', 'Debit', 'Credit', 'Person', 'Ref No'],
      upiTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), safeNum(t.credit), t.person, t.referenceNumber])
    );

    const neftTxns = data.transactions.filter(t => (t.description || '').toUpperCase().includes('NEFT'));
    this.addSheet(wb, 'NEFT', ['Date', 'Description', 'Debit', 'Credit', 'Ref No'],
      neftTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), safeNum(t.credit), t.referenceNumber])
    );

    const impsTxns = data.transactions.filter(t => (t.description || '').toUpperCase().includes('IMPS'));
    this.addSheet(wb, 'IMPS', ['Date', 'Description', 'Debit', 'Credit', 'Ref No'],
      impsTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), safeNum(t.credit), t.referenceNumber])
    );

    const rtgsTxns = data.transactions.filter(t => (t.description || '').toUpperCase().includes('RTGS'));
    this.addSheet(wb, 'RTGS', ['Date', 'Description', 'Debit', 'Credit', 'Ref No'],
      rtgsTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), safeNum(t.credit), t.referenceNumber])
    );

    const atmTxns = data.transactions.filter(t => t.category === 'ATM');
    this.addSheet(wb, 'ATM', ['Date', 'Description', 'Amount', 'Location', 'Ref No'],
      atmTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.merchant, t.referenceNumber])
    );

    const cashTxns = data.transactions.filter(t => (t.description || '').toLowerCase().includes('cash') || t.category === 'ATM');
    this.addSheet(wb, 'Cash', ['Date', 'Description', 'Debit', 'Credit', 'Ref No'],
      cashTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), safeNum(t.credit), t.referenceNumber])
    );

    const transferTxns = data.transactions.filter(t => t.category === 'Transfer');
    this.addSheet(wb, 'Transfers', ['Date', 'Description', 'Debit', 'Credit', 'Person', 'Ref No'],
      transferTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), safeNum(t.credit), t.person, t.referenceNumber])
    );

    const investmentTxns = data.transactions.filter(t => t.category === 'Investment');
    this.addSheet(wb, 'Investments', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      investmentTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const billsTxns = data.transactions.filter(t => t.category === 'Bills');
    this.addSheet(wb, 'Bills', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      billsTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const foodTxns = data.transactions.filter(t => t.category === 'Food');
    this.addSheet(wb, 'Food', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      foodTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const fuelTxns = data.transactions.filter(t => t.category === 'Fuel');
    this.addSheet(wb, 'Fuel', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      fuelTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const shoppingTxns = data.transactions.filter(t => t.category === 'Shopping');
    this.addSheet(wb, 'Shopping', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      shoppingTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const travelTxns = data.transactions.filter(t => t.category === 'Travel');
    this.addSheet(wb, 'Travel', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      travelTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const subKeywords = ['netflix', 'spotify', 'youtube', 'prime', 'hotstar', 'disney', 'canva', 'adobe', 'google one', 'chatgpt', 'openai'];
    const subTxns = data.transactions.filter(t => subKeywords.some(k => (t.description || '').toLowerCase().includes(k) || (t.normalizedMerchant || '').toLowerCase().includes(k)));
    this.addSheet(wb, 'Subscriptions', ['Date', 'Description', 'Amount', 'Merchant', 'Ref No'],
      subTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.normalizedMerchant, t.referenceNumber])
    );

    const chargeKeywords = ['sms charge', 'debit card charge', 'maintenance', 'gst', 'penalty', 'service charge', 'annual fee'];
    const chargeTxns = data.transactions.filter(t => chargeKeywords.some(k => (t.description || '').toLowerCase().includes(k)));
    this.addSheet(wb, 'Bank Charges', ['Date', 'Description', 'Amount', 'Ref No'],
      chargeTxns.map(t => [fmtDate(t.date), t.description, safeNum(t.debit), t.referenceNumber])
    );

    this.addPersonWiseSheet(wb, data.transactions);
    this.addMerchantWiseSheet(wb, data.transactions);
    this.addSheet(wb, 'Monthly Summary', ['Month', 'Year', 'Income', 'Expense', 'Savings', 'Transactions'],
      data.monthly.map(m => [m.month, m.year, safeNum(m.creditTotal), safeNum(m.debitTotal), safeNum(m.creditTotal - m.debitTotal), m.transactionCount])
    );

    const catTotal2 = data.categories.reduce((s, x) => s + safeNum(x.total), 0);
    this.addSheet(wb, 'Category Summary', ['Category', 'Total Amount', 'Transactions', 'Percentage'],
      data.categories.map(c => [c.category, safeNum(c.total), c.count, catTotal2 > 0 ? `${((safeNum(c.total) / catTotal2) * 100).toFixed(1)}%` : '0%'])
    );

    const recurringTxns = data.transactions.filter(t => t.isRecurring);
    const recMap = new Map<string, { total: number; count: number; avg: number; category: string }>();
    for (const t of recurringTxns) {
      const e = recMap.get(t.normalizedMerchant) || { total: 0, count: 0, avg: 0, category: t.category };
      e.total += safeNum(t.debit);
      e.count++;
      recMap.set(t.normalizedMerchant, e);
    }
    this.addSheet(wb, 'Recurring Payments', ['Merchant', 'Category', 'Total', 'Count', 'Monthly Avg'],
      Array.from(recMap.entries()).map(([name, v]) => [name, v.category, safeNum(v.total), v.count, v.count > 0 ? Math.round((safeNum(v.total) / v.count) * 100) / 100 : 0])
    );

    const largeTxns = [...data.transactions].sort((a, b) => Math.max(safeNum(b.debit), safeNum(b.credit)) - Math.max(safeNum(a.debit), safeNum(a.credit))).slice(0, 20);
    this.addSheet(wb, 'Large Transactions', ['#', 'Date', 'Description', 'Merchant', 'Debit', 'Credit'],
      largeTxns.map((t, i) => [i + 1, fmtDate(t.date), t.description, t.normalizedMerchant, safeNum(t.debit), safeNum(t.credit)])
    );

    this.addSheet(wb, 'Charts Data', ['Monthly Spending', 'Income', 'Expense'],
      data.monthly.map(m => [`${m.month} ${m.year}`, safeNum(m.creditTotal), safeNum(m.debitTotal)])
    );
    this.addData(wb, 'Charts Data', ['Category Distribution', 'Amount'],
      data.categories.map(c => [c.category, safeNum(c.total)])
    );
    this.addData(wb, 'Charts Data', ['Top 10 Vendors', 'Total'],
      data.vendors.slice(0, 10).map(v => [v.vendor, safeNum(v.debitTotal) + safeNum(v.creditTotal)])
    );

    this.addVendorReportsSheet(wb, data.transactions);
    this.addCategoryReportsSheet(wb, data.transactions);
    this.addMonthlyReportsSheet(wb, data.transactions);
    this.addVendorBasedTransactionsSheet(wb, data.transactions);

    return await wb.xlsx.writeBuffer();
  }

  private addPersonWiseSheet(wb: ExcelJS.Workbook, transactions: Transaction[]) {
    const sheet = wb.addWorksheet('Person Wise');
    const personMap = new Map<string, Transaction[]>();
    for (const t of transactions) {
      if (t.person) {
        if (!personMap.has(t.person)) personMap.set(t.person, []);
        personMap.get(t.person)!.push(t);
      }
    }
    if (personMap.size === 0) {
      sheet.addRow(['No person-to-person transactions found']);
      return;
    }
    let first = true;
    for (const [person, txns] of personMap) {
      if (!first) sheet.addRow([]);
      first = false;
      const hr = sheet.addRow([`${person} - ${txns.length} transactions`]);
      hr.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
      const cr = sheet.addRow(['Date', 'Amount', 'Type', 'Remark', 'Reference', 'Balance']);
      cr.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      cr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      txns.forEach((t, i) => {
        const r = sheet.addRow([fmtDate(t.date), safeNum(t.debit || t.credit), t.debit > 0 ? 'Debit' : 'Credit', t.description, t.referenceNumber, safeNum(t.balance)]);
        r.font = { size: 10, name: 'Calibri' };
        if ((i + 1) % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      });
    }
    this.autoFit(sheet);
  }

  private addMerchantWiseSheet(wb: ExcelJS.Workbook, transactions: Transaction[]) {
    const sheet = wb.addWorksheet('Merchant Wise');
    const groups = this.groupBy(transactions, 'normalizedMerchant');
    let first = true;
    for (const [merchant, txns] of groups) {
      if (!first) sheet.addRow([]);
      first = false;
      const total = txns.reduce((s, t) => s + safeNum(t.debit), 0);
      const avg = txns.length > 0 ? total / txns.length : 0;
      const debits = txns.map(t => safeNum(t.debit));
      const highest = debits.length > 0 ? Math.max(...debits) : 0;
      const positiveDebits = debits.filter(d => d > 0);
      const lowest = positiveDebits.length > 0 ? Math.min(...positiveDebits) : 0;
      const hr = sheet.addRow([`${merchant} - ${txns.length} transactions`]);
      hr.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
      sheet.addRow(['Transactions', 'Total', 'Average', 'Highest', 'Lowest']);
      sheet.addRow([txns.length, safeNum(total), Math.round(avg * 100) / 100, safeNum(highest), safeNum(lowest)]);
    }
    this.autoFit(sheet);
  }

  private addVendorReportsSheet(wb: ExcelJS.Workbook, transactions: Transaction[]) {
    const sheet = wb.addWorksheet('Vendor Reports');
    const groups = this.groupBy(transactions, 'normalizedMerchant');
    let first = true;
    for (const [vendor, txns] of groups) {
      if (!first) sheet.addRow([]);
      first = false;
      const headerRow = sheet.addRow([`${vendor} - ${txns.length} transactions`]);
      headerRow.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
      headerRow.height = 22;
      const colRow = sheet.addRow(['Date', 'Description', 'Debit', 'Credit', 'Running Balance', 'Ref No']);
      colRow.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      colRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      let runningBalance = 0;
      let totalDebit = 0, totalCredit = 0;
      txns.forEach((t, i) => {
        runningBalance += safeNum(t.credit) - safeNum(t.debit);
        if (safeNum(t.debit) > 0) totalDebit += safeNum(t.debit);
        if (safeNum(t.credit) > 0) totalCredit += safeNum(t.credit);
        const r = sheet.addRow([fmtDate(t.date), t.description, safeNum(t.debit), safeNum(t.credit), runningBalance, t.referenceNumber]);
        r.font = { size: 10, name: 'Calibri' };
        if ((i + 1) % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        if (safeNum(t.debit) > 0) r.getCell(3).font = { color: { argb: 'FF0000' }, size: 10, name: 'Calibri' };
        if (safeNum(t.credit) > 0) r.getCell(4).font = { color: { argb: '008000' }, size: 10, name: 'Calibri' };
      });
      const totalRow = sheet.addRow(['TOTAL', '', safeNum(totalDebit), safeNum(totalCredit), '', '']);
      totalRow.font = { bold: true, size: 10, name: 'Calibri' };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    }
    this.autoFit(sheet);
  }

  private addCategoryReportsSheet(wb: ExcelJS.Workbook, transactions: Transaction[]) {
    const sheet = wb.addWorksheet('Category Reports');
    const groups = this.groupBy(transactions, 'category');
    let first = true;
    for (const [category, txns] of groups) {
      if (!first) sheet.addRow([]);
      first = false;
      const headerRow = sheet.addRow([`${category} - ${txns.length} transactions`]);
      headerRow.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
      headerRow.height = 22;
      const colRow = sheet.addRow(['Date', 'Description', 'Vendor', 'Debit', 'Credit', 'Ref No']);
      colRow.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      colRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      let totalDebit = 0, totalCredit = 0;
      txns.forEach((t, i) => {
        if (safeNum(t.debit) > 0) totalDebit += safeNum(t.debit);
        if (safeNum(t.credit) > 0) totalCredit += safeNum(t.credit);
        const r = sheet.addRow([fmtDate(t.date), t.description, t.normalizedMerchant, safeNum(t.debit), safeNum(t.credit), t.referenceNumber]);
        r.font = { size: 10, name: 'Calibri' };
        if ((i + 1) % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        if (safeNum(t.debit) > 0) r.getCell(4).font = { color: { argb: 'FF0000' }, size: 10, name: 'Calibri' };
        if (safeNum(t.credit) > 0) r.getCell(5).font = { color: { argb: '008000' }, size: 10, name: 'Calibri' };
      });
      const totalRow = sheet.addRow(['TOTAL', '', '', safeNum(totalDebit), safeNum(totalCredit), '']);
      totalRow.font = { bold: true, size: 10, name: 'Calibri' };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    }
    this.autoFit(sheet);
  }

  private addMonthlyReportsSheet(wb: ExcelJS.Workbook, transactions: Transaction[]) {
    const sheet = wb.addWorksheet('Monthly Reports');
    const groups = this.groupByMonth(transactions);
    let first = true;
    for (const mg of groups) {
      if (!first) sheet.addRow([]);
      first = false;
      const label = `${mg.month} ${mg.year} - ${mg.transactions.length} transactions`;
      const headerRow = sheet.addRow([label]);
      headerRow.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
      headerRow.height = 22;
      const colRow = sheet.addRow(['Date', 'Description', 'Vendor', 'Category', 'Debit', 'Credit', 'Balance']);
      colRow.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      colRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      let totalDebit = 0, totalCredit = 0;
      mg.transactions.forEach((t, i) => {
        if (safeNum(t.debit) > 0) totalDebit += safeNum(t.debit);
        if (safeNum(t.credit) > 0) totalCredit += safeNum(t.credit);
        const r = sheet.addRow([fmtDate(t.date), t.description, t.normalizedMerchant, t.category, safeNum(t.debit), safeNum(t.credit), safeNum(t.balance)]);
        r.font = { size: 10, name: 'Calibri' };
        if ((i + 1) % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        if (safeNum(t.debit) > 0) r.getCell(5).font = { color: { argb: 'FF0000' }, size: 10, name: 'Calibri' };
        if (safeNum(t.credit) > 0) r.getCell(6).font = { color: { argb: '008000' }, size: 10, name: 'Calibri' };
      });
      const totalRow = sheet.addRow(['TOTAL', '', '', '', safeNum(totalDebit), safeNum(totalCredit), '']);
      totalRow.font = { bold: true, size: 10, name: 'Calibri' };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    }
    this.autoFit(sheet);
  }

  private addVendorBasedTransactionsSheet(wb: ExcelJS.Workbook, transactions: Transaction[]) {
    const sheet = wb.addWorksheet('Vendor Based Txns');
    const groups = this.groupBy(transactions, 'normalizedMerchant');
    let first = true;
    for (const [vendor, txns] of groups) {
      if (!first) sheet.addRow([]);
      first = false;
      const hr = sheet.addRow([`${vendor} - ${txns.length} transactions`]);
      hr.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
      hr.height = 22;
      const cr = sheet.addRow(['Date', 'Description', 'Category', 'Debit', 'Credit', 'Amount', 'Balance', 'Ref No', 'Person']);
      cr.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      cr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      let totalDebit = 0, totalCredit = 0;
      txns.forEach((t, i) => {
        if (safeNum(t.debit) > 0) totalDebit += safeNum(t.debit);
        if (safeNum(t.credit) > 0) totalCredit += safeNum(t.credit);
        const r = sheet.addRow([fmtDate(t.date), t.description, t.category, safeNum(t.debit), safeNum(t.credit), safeNum(t.amount), safeNum(t.balance), t.referenceNumber, t.person]);
        r.font = { size: 10, name: 'Calibri' };
        if ((i + 1) % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        if (safeNum(t.debit) > 0) r.getCell(4).font = { color: { argb: 'FF0000' }, size: 10, name: 'Calibri' };
        if (safeNum(t.credit) > 0) r.getCell(5).font = { color: { argb: '008000' }, size: 10, name: 'Calibri' };
      });
      const tr = sheet.addRow(['TOTAL', '', '', safeNum(totalDebit), safeNum(totalCredit), '', '', '', '']);
      tr.font = { bold: true, size: 10, name: 'Calibri' };
      tr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    }
    this.autoFit(sheet);
  }

  private addSheet(wb: ExcelJS.Workbook, name: string, headers: string[], rows: any[][]) {
    const sheet = wb.addWorksheet(name.substring(0, 31));
    const hr = sheet.addRow(headers);
    hr.font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
    hr.alignment = { horizontal: 'center', vertical: 'middle' };
    hr.height = 20;
    rows.forEach((row, ri) => {
      const r = sheet.addRow(row);
      r.font = { size: 10, name: 'Calibri' };
      r.alignment = { vertical: 'middle' };
      if ((ri + 2) % 2 === 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    });
    this.autoFit(sheet);
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: headers.length } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  private addData(wb: ExcelJS.Workbook, sheetName: string, headers: string[], rows: any[][]) {
    const sheet = wb.getWorksheet(sheetName);
    if (!sheet) return;
    sheet.addRow([]);
    sheet.addRow(headers).font = { bold: true };
    rows.forEach(r => sheet.addRow(r));
    this.autoFit(sheet);
  }

  private autoFit(sheet: ExcelJS.Worksheet) {
    sheet.columns.forEach(col => {
      let max = 0;
      if (col.eachCell) col.eachCell({ includeEmpty: true }, (cell: any) => { max = Math.max(max, (cell.value?.toString() || '').length); });
      col.width = Math.min(Math.max(max + 2, 10), 40);
    });
  }

  private groupBy(transactions: Transaction[], key: 'normalizedMerchant' | 'category'): Map<string, Transaction[]> {
    const map = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const k = t[key];
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return map;
  }

  private groupByMonth(transactions: Transaction[]): Array<{ month: string; year: number; transactions: Transaction[] }> {
    const map = new Map<string, { month: string; year: number; transactions: Transaction[] }>();
    for (const t of transactions) {
      const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
      if (!map.has(key)) map.set(key, { month: t.date.toLocaleString('default', { month: 'long' }), year: t.date.getFullYear(), transactions: [] });
      map.get(key)!.transactions.push(t);
    }
    return Array.from(map.values());
  }
}
