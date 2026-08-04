import { Transaction, AnalysisResult } from './transaction.interface';

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  category: string;
}

export class InsightsService {
  generate(data: AnalysisResult): Insight[] {
    const insights: Insight[] = [];
    const { transactions, monthly, summary, vendors, categories } = data;

    const totalDebit = summary.totalDebit;
    const totalCredit = summary.totalCredit;

    if (totalCredit > totalDebit) {
      insights.push({ type: 'positive', message: `Your income (${this.fmt(totalCredit)}) exceeds expenses (${this.fmt(totalDebit)}). You're saving ${this.fmt(totalCredit - totalDebit)}.`, category: 'Overview' });
    } else {
      insights.push({ type: 'negative', message: `Your expenses (${this.fmt(totalDebit)}) exceed income (${this.fmt(totalCredit)}). Consider reducing spending.`, category: 'Overview' });
    }

    const foodCat = categories.find(c => c.category === 'Food');
    const prevFood = foodCat ? foodCat.total : 0;
    const shoppingCat = categories.find(c => c.category === 'Shopping');
    const largestCategory = categories[0];
    if (largestCategory) {
      insights.push({ type: 'neutral', message: `Largest spending category is ${largestCategory.category} at ${this.fmt(largestCategory.total)}.`, category: 'Categories' });
    }

    const swiggy = vendors.find(v => v.vendor === 'Swiggy');
    if (swiggy) {
      insights.push({ type: 'neutral', message: `You spent ${this.fmt(swiggy.debitTotal)} on Swiggy across ${swiggy.transactionCount} orders.`, category: 'Food' });
    }

    const zomato = vendors.find(v => v.vendor === 'Zomato');
    if (zomato) {
      insights.push({ type: 'neutral', message: `Zomato expenses: ${this.fmt(zomato.debitTotal)} (${zomato.transactionCount} orders).`, category: 'Food' });
    }

    const amazon = vendors.find(v => v.vendor === 'Amazon');
    if (amazon) {
      insights.push({ type: 'neutral', message: `Amazon spending: ${this.fmt(amazon.debitTotal)} across ${amazon.transactionCount} transactions.`, category: 'Shopping' });
    }

    const salaryTxns = transactions.filter(t => t.category === 'Salary');
    if (salaryTxns.length > 0) {
      const salaryAmounts = salaryTxns.map(t => t.credit).filter(c => c > 0);
      if (salaryAmounts.length > 1) {
        const avg = salaryAmounts.reduce((a, b) => a + b, 0) / salaryAmounts.length;
        const consistent = salaryAmounts.every(s => Math.abs(s - avg) / avg < 0.05);
        if (consistent) {
          insights.push({ type: 'positive', message: `Your salary is consistent every month at around ${this.fmt(avg)}.`, category: 'Salary' });
        } else {
          insights.push({ type: 'neutral', message: `Average salary: ${this.fmt(avg)}. Salary amounts vary month to month.`, category: 'Salary' });
        }
      }
      const salaryDates = salaryTxns.map(t => new Date(t.date).getDate());
      const uniqueDates = [...new Set(salaryDates)];
      if (uniqueDates.length <= 3) {
        insights.push({ type: 'positive', message: `Salary is credited around day ${uniqueDates.join(', ')} of each month.`, category: 'Salary' });
      }
    }

    const recurringTxns = transactions.filter(t => t.isRecurring);
    const recurringVendors = [...new Set(recurringTxns.map(t => t.normalizedMerchant))];
    if (recurringVendors.length > 0) {
      insights.push({ type: 'neutral', message: `Detected ${recurringVendors.length} recurring payments: ${recurringVendors.slice(0, 5).join(', ')}${recurringVendors.length > 5 ? '...' : ''}.`, category: 'Recurring' });
    }

    const netflix = vendors.find(v => v.vendor === 'Netflix');
    if (netflix) {
      insights.push({ type: 'neutral', message: `Netflix subscription detected: ${this.fmt(netflix.debitTotal)} total spent.`, category: 'Subscriptions' });
    }
    const spotify = vendors.find(v => v.vendor === 'Spotify');
    if (spotify) {
      insights.push({ type: 'neutral', message: `Spotify subscription: ${this.fmt(spotify.debitTotal)} total.`, category: 'Subscriptions' });
    }
    const prime = vendors.find(v => v.vendor === 'Amazon Prime');
    if (prime) {
      insights.push({ type: 'neutral', message: `Amazon Prime subscription: ${this.fmt(prime.debitTotal)} total.`, category: 'Subscriptions' });
    }

    const atmTxns = transactions.filter(t => t.category === 'ATM');
    if (atmTxns.length > 0) {
      const atmTotal = atmTxns.reduce((s, t) => s + t.debit, 0);
      insights.push({ type: 'negative', message: `ATM withdrawals: ${atmTxns.length} transactions totaling ${this.fmt(atmTotal)}.`, category: 'ATM' });
    }

    const investmentTxns = transactions.filter(t => t.category === 'Investment');
    if (investmentTxns.length > 0) {
      const invTotal = investmentTxns.reduce((s, t) => s + t.debit, 0);
      insights.push({ type: 'positive', message: `Investments detected: ${this.fmt(invTotal)} across ${investmentTxns.length} transactions.`, category: 'Investment' });
    }

    const emiKeywords = ['emi', 'loan', 'finance', 'equated'];
    const emiTxns = transactions.filter(t => emiKeywords.some(k => t.description.toLowerCase().includes(k)));
    if (emiTxns.length > 0) {
      const emiTotal = emiTxns.reduce((s, t) => s + t.debit, 0);
      insights.push({ type: 'neutral', message: `EMI/Loan payments: ${emiTxns.length} payments totaling ${this.fmt(emiTotal)}.`, category: 'Loans' });
    }

    const bankChargeKeywords = ['sms charge', 'debit card charge', 'maintenance', 'gst', 'penalty', 'service charge', 'annual fee'];
    const bankCharges = transactions.filter(t => bankChargeKeywords.some(k => t.description.toLowerCase().includes(k)));
    if (bankCharges.length > 0) {
      const chargeTotal = bankCharges.reduce((s, t) => s + t.debit, 0);
      insights.push({ type: 'negative', message: `Bank charges: ${this.fmt(chargeTotal)} (${bankCharges.length} charges).`, category: 'Bank Charges' });
    }

    const fuelCat = categories.find(c => c.category === 'Fuel');
    if (fuelCat) {
      insights.push({ type: 'neutral', message: `Fuel expenses: ${this.fmt(fuelCat.total)} across ${fuelCat.count} transactions.`, category: 'Fuel' });
    }

    const travelCat = categories.find(c => c.category === 'Travel');
    if (travelCat) {
      insights.push({ type: 'neutral', message: `Travel spending: ${this.fmt(travelCat.total)} (${travelCat.count} transactions).`, category: 'Travel' });
    }

    const entertainmentCat = categories.find(c => c.category === 'Entertainment');
    if (entertainmentCat) {
      insights.push({ type: 'neutral', message: `Entertainment spending: ${this.fmt(entertainmentCat.total)}.`, category: 'Entertainment' });
    }

    const billsCat = categories.find(c => c.category === 'Bills');
    if (billsCat) {
      insights.push({ type: 'neutral', message: `Bills & utilities: ${this.fmt(billsCat.total)} (${billsCat.count} payments).`, category: 'Bills' });
    }

    const largeTxns = transactions.filter(t => t.debit > totalDebit * 0.1);
    if (largeTxns.length > 0) {
      insights.push({ type: 'neutral', message: `${largeTxns.length} large transactions (>10% of total spending) detected.`, category: 'Large Transactions' });
    }

    const personMap = new Map<string, { sent: number; received: number; count: number }>();
    for (const t of transactions) {
      if (t.person) {
        const e = personMap.get(t.person) || { sent: 0, received: 0, count: 0 };
        if (t.debit > 0) e.sent += t.debit;
        if (t.credit > 0) e.received += t.credit;
        e.count++;
        personMap.set(t.person, e);
      }
    }
    const topPerson = [...personMap.entries()].sort((a, b) => b[1].sent - a[1].sent)[0];
    if (topPerson) {
      insights.push({ type: 'neutral', message: `Highest transactions with ${topPerson[0]}: ${this.fmt(topPerson[1].sent)} sent, ${this.fmt(topPerson[1].received)} received (${topPerson[1].count} txns).`, category: 'Person' });
    }

    if (monthly.length >= 2) {
      const last = monthly[monthly.length - 1];
      const prev = monthly[monthly.length - 2];
      if (last && prev && prev.debitTotal > 0) {
        const change = ((last.debitTotal - prev.debitTotal) / prev.debitTotal) * 100;
        if (Math.abs(change) > 10) {
          insights.push({
            type: change > 0 ? 'negative' : 'positive',
            message: `Spending ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(0)}% compared to previous month.`,
            category: 'Trends',
          });
        }
      }
    }

    const avgDaily = summary.averageDailySpend;
    if (avgDaily > 0) {
      insights.push({ type: 'neutral', message: `Average daily spend: ${this.fmt(avgDaily)}.`, category: 'Overview' });
    }

    return insights;
  }

  private fmt(n: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }
}
