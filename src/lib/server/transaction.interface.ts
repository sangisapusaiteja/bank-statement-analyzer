export interface Transaction {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  amount: number;
  currency: string;
  balance: number;
  referenceNumber: string;
  merchant: string;
  normalizedMerchant: string;
  category: string;
  transactionType: string;
  person: string;
  isDuplicate: boolean;
  isRecurring: boolean;
  sourceFile: string;
}

export interface VendorSummary {
  vendor: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  transactionCount: number;
  category: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  debitTotal: number;
  creditTotal: number;
  transactionCount: number;
}

export interface SummaryData {
  totalTransactions: number;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  topVendors: { vendor: string; total: number }[];
  topCategories: { category: string; total: number }[];
  largestExpense: Transaction | null;
  largestCredit: Transaction | null;
  mostFrequentMerchant: string;
  averageDailySpend: number;
}

export interface AnalysisResult {
  transactions: Transaction[];
  vendors: VendorSummary[];
  categories: CategorySummary[];
  monthly: MonthlySummary[];
  summary: SummaryData;
}
