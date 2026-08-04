'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Wallet, Receipt, AlertTriangle, Repeat,
  ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, PieChartIcon,
  BarChart3, LineChart as LineChartIcon, Search, Lightbulb, Calendar,
  Banknote, CreditCard, Landmark, PiggyBank, Home, Car, Shield,
  Smartphone, Coffee, Zap, Gift, Users, Building, Briefcase,
  Clock, ArrowUpDown, Filter, Download, Sun, Moon,
} from 'lucide-react';

interface Transaction {
  date: string;
  description: string;
  debit: number;
  credit: number;
  amount: number;
  merchant: string;
  normalizedMerchant: string;
  category: string;
  person: string;
  isDuplicate: boolean;
  isRecurring: boolean;
  sourceFile: string;
  balance?: number;
}

interface VendorSummary {
  vendor: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  transactionCount: number;
  category: string;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

interface MonthlySummary {
  month: string;
  year: number;
  debitTotal: number;
  creditTotal: number;
  transactionCount: number;
}

interface SummaryData {
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

interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  category: string;
}

interface AnalysisData {
  summary: SummaryData;
  vendors: VendorSummary[];
  categories: CategorySummary[];
  monthly: MonthlySummary[];
  transactions: Transaction[];
  insights?: Insight[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', Shopping: '#ec4899', Fuel: '#eab308', Bills: '#3b82f6',
  Entertainment: '#8b5cf6', Travel: '#14b8a6', Healthcare: '#ef4444',
  Salary: '#22c55e', Transfer: '#06b6d4', Investment: '#6366f1', ATM: '#6b7280', Others: '#78716c',
};

const COLORS = Object.values(CATEGORY_COLORS);

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function categoryColor(cat: string) { return CATEGORY_COLORS[cat] || '#78716c'; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-xl text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

export default function Dashboard({ data }: { data: AnalysisData }) {
  const { summary, categories, monthly, vendors, transactions } = data;
  const insights = data.insights || [];
  const [chartView, setChartView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const goTo = (type: string, name?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (name) params.set('name', name);
    router.push(`/detail?${params.toString()}`);
  };

  const flagged = useMemo(() => transactions.filter((t) => t.isDuplicate || t.isRecurring), [transactions]);
  const duplicates = useMemo(() => transactions.filter((t) => t.isDuplicate), [transactions]);
  const recurring = useMemo(() => transactions.filter((t) => t.isRecurring), [transactions]);

  const sortedMonthly = useMemo(() => [...monthly].sort((a, b) => a.year - b.year || new Date(`${a.month} 1`).getMonth() - new Date(`${b.month} 1`).getMonth()), [monthly]);

  const topVendorsByCount = useMemo(() =>
    [...vendors].sort((a, b) => b.transactionCount - a.transactionCount).slice(0, 10), [vendors]);

  const categoryBreakdown = useMemo(() =>
    categories.map((c) => ({ ...c, fill: categoryColor(c.category) })), [categories]);

  const dailySpendData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const key = formatDate(t.date);
      map.set(key, (map.get(key) || 0) + t.debit);
    }
    return Array.from(map.entries()).map(([date, spend]) => ({ date, spend: Math.round(spend * 100) / 100 })).slice(-30);
  }, [transactions]);

  const personData = useMemo(() => {
    const map = new Map<string, { sent: number; received: number; count: number }>();
    for (const t of transactions) {
      if (t.person) {
        const e = map.get(t.person) || { sent: 0, received: 0, count: 0 };
        if (t.debit > 0) e.sent += t.debit;
        if (t.credit > 0) e.received += t.credit;
        e.count++;
        map.set(t.person, e);
      }
    }
    return Array.from(map.entries()).map(([name, v]) => ({
      name, sent: Math.round(v.sent * 100) / 100, received: Math.round(v.received * 100) / 100,
      net: Math.round((v.received - v.sent) * 100) / 100, count: v.count,
    })).sort((a, b) => b.sent - a.sent);
  }, [transactions]);

  const weekDayData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    const totals = new Array(7).fill(0);
    for (const t of transactions) {
      const day = new Date(t.date).getDay();
      counts[day]++;
      totals[day] += t.debit;
    }
    return days.map((d, i) => ({ day: d, count: counts[i], total: Math.round(totals[i] * 100) / 100 }));
  }, [transactions]);

  const salaryData = useMemo(() => {
    const salaryTxns = transactions.filter(t => t.category === 'Salary' && t.credit > 0);
    if (salaryTxns.length === 0) return null;
    const byMonth = new Map<string, { salary: number; date: string }>();
    for (const t of salaryTxns) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, { salary: (byMonth.get(key)?.salary || 0) + t.credit, date: t.date });
    }
    const months = Array.from(byMonth.entries()).sort();
    const salaries = months.map(([k, v]) => ({ month: k, salary: v.salary }));
    const avg = salaries.reduce((s, x) => s + x.salary, 0) / salaries.length;
    const employer = salaryTxns[0]?.description?.match(/salary\s*(?:from|by|credited\s*by)?\s*([A-Za-z\s.]+)/i)?.[1]?.trim() || 'Employer';
    return { employer, avg, salaries, dates: salaryTxns.map(t => new Date(t.date).getDate()) };
  }, [transactions]);

  const recurringPayments = useMemo(() => {
    const recTxns = transactions.filter(t => t.isRecurring);
    const map = new Map<string, { total: number; count: number; avg: number; category: string }>();
    for (const t of recTxns) {
      const e = map.get(t.normalizedMerchant) || { total: 0, count: 0, avg: 0, category: t.category };
      e.total += t.debit;
      e.count++;
      map.set(t.normalizedMerchant, e);
    }
    return Array.from(map.entries()).map(([name, v]) => ({ ...v, avg: Math.round((v.total / v.count) * 100) / 100, name })).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const subscriptionKeywords = ['netflix', 'spotify', 'youtube', 'prime', 'hotstar', 'disney', 'canva', 'adobe', 'google one', 'chatgpt', 'openai', 'apple music', 'amazon music', 'sony liv', 'zee5', 'voot', 'alt balaji', 'eros now', 'hungama', 'jiosaavn', 'wynk', 'gaana'];
  const subscriptions = useMemo(() => {
    return transactions.filter(t => subscriptionKeywords.some(k => t.description.toLowerCase().includes(k) || t.normalizedMerchant.toLowerCase().includes(k)));
  }, [transactions]);

  const largeTxns = useMemo(() => {
    return [...transactions].sort((a, b) => Math.max(b.debit, b.credit) - Math.max(a.debit, a.credit)).slice(0, 20);
  }, [transactions]);

  const atmTxns = useMemo(() => transactions.filter(t => t.category === 'ATM'), [transactions]);
  const atmSummary = useMemo(() => {
    if (atmTxns.length === 0) return null;
    const total = atmTxns.reduce((s, t) => s + t.debit, 0);
    const byMonth = new Map<string, number>();
    for (const t of atmTxns) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      byMonth.set(key, (byMonth.get(key) || 0) + t.debit);
    }
    return { total, count: atmTxns.length, avg: total / atmTxns.length, monthly: Array.from(byMonth.entries()).map(([m, v]) => ({ month: m, total: v })) };
  }, [atmTxns]);

  const investmentTxns = useMemo(() => transactions.filter(t => t.category === 'Investment'), [transactions]);
  const investmentSummary = useMemo(() => {
    if (investmentTxns.length === 0) return null;
    const total = investmentTxns.reduce((s, t) => s + t.debit, 0);
    const byType = new Map<string, number>();
    for (const t of investmentTxns) {
      const type = t.normalizedMerchant;
      byType.set(type, (byType.get(type) || 0) + t.debit);
    }
    return { total, count: investmentTxns.length, byType: Array.from(byType.entries()).map(([k, v]) => ({ name: k, total: v })) };
  }, [investmentTxns]);

  const emiTxns = useMemo(() => {
    const emiKeywords = ['emi', 'loan', 'finance', 'equated'];
    return transactions.filter(t => emiKeywords.some(k => t.description.toLowerCase().includes(k)));
  }, [transactions]);

  const bankCharges = useMemo(() => {
    const chargeKeywords = ['sms charge', 'debit card charge', 'maintenance', 'gst', 'penalty', 'service charge', 'annual fee', 'commission', 'processing fee'];
    return transactions.filter(t => chargeKeywords.some(k => t.description.toLowerCase().includes(k)));
  }, [transactions]);

  const incomeSources = useMemo(() => {
    const creditTxns = transactions.filter(t => t.credit > 0);
    const map = new Map<string, number>();
    for (const t of creditTxns) {
      const cat = t.category === 'Salary' ? 'Salary' : t.category === 'Transfer' ? 'Transfer' : t.normalizedMerchant.includes('Interest') ? 'Interest' : t.description.toLowerCase().includes('refund') ? 'Refund' : t.description.toLowerCase().includes('cash deposit') ? 'Cash Deposit' : t.category;
      map.set(cat, (map.get(cat) || 0) + t.credit);
    }
    return Array.from(map.entries()).map(([k, v]) => ({ source: k, total: v })).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + t.debit);
    }
    return Array.from(map.entries()).map(([date, spend]) => ({ date, spend }));
  }, [transactions]);

  const filteredTxns = useMemo(() => {
    if (!searchQuery) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.normalizedMerchant.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.person?.toLowerCase().includes(q) ||
      formatCurrency(t.debit).includes(q) ||
      formatCurrency(t.credit).includes(q)
    );
  }, [transactions, searchQuery]);

  const timelineData = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const openingBalance = transactions.length > 0 ? (transactions[0].balance || 0) : 0;
  const closingBalance = transactions.length > 0 ? (transactions[transactions.length - 1].balance || 0) : 0;
  const savings = summary.totalCredit - summary.totalDebit;

  return (
    <div className="space-y-6">
      {/* Section 1: Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Credits</CardTitle></CardHeader><CardContent><div className="text-lg font-bold text-green-500">{formatCurrency(summary.totalCredit)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Debits</CardTitle></CardHeader><CardContent><div className="text-lg font-bold text-red-500">{formatCurrency(summary.totalDebit)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Closing Balance</CardTitle></CardHeader><CardContent><div className={cn('text-lg font-bold', closingBalance >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(closingBalance)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Opening Balance</CardTitle></CardHeader><CardContent><div className="text-lg font-bold">{formatCurrency(openingBalance)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Savings</CardTitle></CardHeader><CardContent><div className={cn('text-lg font-bold', savings >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(savings)}</div></CardContent></Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Net Cash Flow</CardTitle></CardHeader><CardContent><div className={cn('text-lg font-bold', summary.netBalance >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(summary.netBalance)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Daily Spend</CardTitle></CardHeader><CardContent><div className="text-lg font-bold">{formatCurrency(summary.averageDailySpend)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Highest Expense</CardTitle></CardHeader><CardContent><div className="text-lg font-bold text-red-500">{summary.largestExpense ? formatCurrency(summary.largestExpense.debit) : 'N/A'}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Highest Income</CardTitle></CardHeader><CardContent><div className="text-lg font-bold text-green-500">{summary.largestCredit ? formatCurrency(summary.largestCredit.credit) : 'N/A'}</div></CardContent></Card>
      </div>

      {/* Section 2: Monthly Summary */}
      <Card>
        <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedMonthly.map((m) => (
              <Card key={`${m.month}-${m.year}`} className="p-3">
                <p className="text-xs text-muted-foreground font-medium">{m.month.slice(0, 3)} {m.year}</p>
                <p className="text-xs text-green-500 font-mono">+{formatCurrency(m.creditTotal)}</p>
                <p className="text-xs text-red-500 font-mono">-{formatCurrency(m.debitTotal)}</p>
                <p className={cn('text-xs font-mono', (m.creditTotal - m.debitTotal) >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {formatCurrency(m.creditTotal - m.debitTotal)}
                </p>
                <p className="text-xs text-muted-foreground">{m.transactionCount} txns</p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setChartView}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><PieChartIcon className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="vendors"><ShoppingCart className="h-4 w-4 mr-1.5" />Vendors</TabsTrigger>
          <TabsTrigger value="categories"><BarChart3 className="h-4 w-4 mr-1.5" />Categories</TabsTrigger>
          <TabsTrigger value="insights"><Lightbulb className="h-4 w-4 mr-1.5" />AI Insights</TabsTrigger>
          <TabsTrigger value="people"><Users className="h-4 w-4 mr-1.5" />People</TabsTrigger>
          <TabsTrigger value="salary"><Briefcase className="h-4 w-4 mr-1.5" />Salary</TabsTrigger>
          <TabsTrigger value="recurring"><Repeat className="h-4 w-4 mr-1.5" />Recurring</TabsTrigger>
          <TabsTrigger value="investments"><Landmark className="h-4 w-4 mr-1.5" />Investments</TabsTrigger>
          <TabsTrigger value="transactions"><Receipt className="h-4 w-4 mr-1.5" />Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Section 3: Cash Flow Graph */}
          <Card>
            <CardHeader><CardTitle>Cash Flow - Income vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedMonthly}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="creditTotal" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debitTotal" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Section 4: Spending Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Spending Categories</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={55}
                      label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`}>
                      {categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} style={{ cursor: 'pointer' }} onClick={() => goTo('category', entry.category)} />
                      ))}
                    </Pie>
                    <ReTooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((c) => {
                    const pct = (c.total / categories.reduce((s, x) => s + x.total, 0)) * 100;
                    return (
                      <div key={c.category} className="space-y-1 cursor-pointer" onClick={() => goTo('category', c.category)}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor(c.category) }} />
                            <span>{c.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{c.count} txns</span>
                            <span className="font-mono font-medium w-24 text-right">{formatCurrency(c.total)}</span>
                            <span className="text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: categoryColor(c.category) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 5: Merchant Analysis */}
          <Card>
            <CardHeader><CardTitle>Top Merchants</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {vendors.slice(0, 12).map((v) => (
                  <Card key={v.vendor} className="p-3 cursor-pointer hover:bg-accent" onClick={() => goTo('vendor', v.vendor)}>
                    <p className="text-sm font-medium truncate">{v.vendor}</p>
                    <p className="text-xs text-red-500 font-mono">{formatCurrency(v.debitTotal)}</p>
                    <p className="text-xs text-muted-foreground">{v.transactionCount} txns</p>
                    <p className="text-xs text-muted-foreground">Avg {formatCurrency(v.debitTotal / (v.transactionCount || 1))}</p>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Person Analysis */}
          {personData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Person-wise Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {personData.slice(0, 9).map((p) => (
                    <Card key={p.name} className="p-3 cursor-pointer hover:bg-accent" onClick={() => goTo('vendor', p.name)}>
                      <p className="text-sm font-medium">{p.name}</p>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-red-500">Sent: {formatCurrency(p.sent)}</span>
                        <span className="text-green-500">Recv: {formatCurrency(p.received)}</span>
                      </div>
                      <p className={cn('text-xs font-mono mt-1', p.net >= 0 ? 'text-green-500' : 'text-red-500')}>
                        Net: {formatCurrency(p.net)} &middot; {p.count} txns
                      </p>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 7: Salary Detection */}
          {salaryData && (
            <Card>
              <CardHeader><CardTitle>Salary Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><p className="text-xs text-muted-foreground">Employer</p><p className="font-medium">{salaryData.employer}</p></div>
                  <div><p className="text-xs text-muted-foreground">Monthly Salary</p><p className="font-medium text-green-500">{formatCurrency(salaryData.avg)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Salary Dates</p><p className="font-medium">Day {[...new Set(salaryData.dates)].join(', ')}</p></div>
                  <div><p className="text-xs text-muted-foreground">Salary Months</p><p className="font-medium">{salaryData.salaries.length}</p></div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={salaryData.salaries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <ReTooltip content={<CustomTooltip />} />
                    <Bar dataKey="salary" name="Salary" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Section 8: Recurring Payments */}
          {recurringPayments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recurring Payments</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {recurringPayments.map((r) => (
                    <Card key={r.name} className="p-3">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-red-500 font-mono">{formatCurrency(r.total)}</p>
                      <p className="text-xs text-muted-foreground">{r.count}x &middot; {formatCurrency(r.avg)}/mo</p>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 9: Subscriptions */}
          {subscriptions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Subscriptions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[...new Set(subscriptions.map(s => s.normalizedMerchant))].slice(0, 12).map((name) => {
                    const txns = subscriptions.filter(s => s.normalizedMerchant === name);
                    const total = txns.reduce((sum, t) => sum + t.debit, 0);
                    return (
                      <Card key={name} className="p-3">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-xs text-red-500 font-mono">{formatCurrency(total)}</p>
                        <p className="text-xs text-muted-foreground">{txns.length} payments</p>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 10: Large Transactions */}
          <Card>
            <CardHeader><CardTitle>Top 20 Large Transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {largeTxns.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{t.description}</TableCell>
                        <TableCell className="text-right font-mono text-red-500">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</TableCell>
                        <TableCell className="text-right font-mono text-green-500">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Section 11: ATM Withdrawals */}
          {atmSummary && (
            <Card>
              <CardHeader><CardTitle>ATM Withdrawals</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><p className="text-xs text-muted-foreground">Total</p><p className="font-medium text-red-500">{formatCurrency(atmSummary.total)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Monthly Avg</p><p className="font-medium">{formatCurrency(atmSummary.total / Math.max(1, atmSummary.monthly.length))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Withdrawals</p><p className="font-medium">{atmSummary.count}</p></div>
                  <div><p className="text-xs text-muted-foreground">Average</p><p className="font-medium">{formatCurrency(atmSummary.avg)}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 12: Investments */}
          {investmentSummary && (
            <Card>
              <CardHeader><CardTitle>Investments</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div><p className="text-xs text-muted-foreground">Total Invested</p><p className="font-medium text-green-500">{formatCurrency(investmentSummary.total)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Transactions</p><p className="font-medium">{investmentSummary.count}</p></div>
                  <div><p className="text-xs text-muted-foreground">Platforms</p><p className="font-medium">{investmentSummary.byType.length}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {investmentSummary.byType.map((inv) => (
                    <Badge key={inv.name} variant="outline" className="text-xs">{inv.name}: {formatCurrency(inv.total)}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 13: Loan Tracking */}
          {emiTxns.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Loan / EMI Tracking</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><p className="text-xs text-muted-foreground">Total EMI Payments</p><p className="font-medium text-red-500">{formatCurrency(emiTxns.reduce((s, t) => s + t.debit, 0))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Count</p><p className="font-medium">{emiTxns.length}</p></div>
                  <div><p className="text-xs text-muted-foreground">Frequency</p><p className="font-medium">{emiTxns.length > 1 ? 'Recurring' : 'One-time'}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 14: Daily Spending Heatmap */}
          <Card>
            <CardHeader><CardTitle>Daily Spending Heatmap</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {heatmapData.slice(-90).map((d) => {
                  const intensity = d.spend > 0 ? Math.min(Math.floor((d.spend / (summary.averageDailySpend * 2)) * 4), 4) : 0;
                  const colors = ['bg-gray-100 dark:bg-gray-800', 'bg-green-200 dark:bg-green-900', 'bg-yellow-200 dark:bg-yellow-900', 'bg-orange-200 dark:bg-orange-900', 'bg-red-300 dark:bg-red-900'];
                  return (
                    <Tooltip key={d.date}>
                      <TooltipTrigger asChild>
                        <div className={cn('w-3 h-3 rounded-sm cursor-pointer', colors[intensity])} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{d.date}: {formatCurrency(d.spend)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                <div className="w-3 h-3 rounded-sm bg-yellow-200 dark:bg-yellow-900" />
                <div className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900" />
                <div className="w-3 h-3 rounded-sm bg-red-300 dark:bg-red-900" />
                <span>More</span>
              </div>
            </CardContent>
          </Card>

          {/* Section 15: Weekly Spending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Weekly Spending Pattern</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weekDayData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <ReTooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Section 16: Income Sources */}
            <Card>
              <CardHeader><CardTitle>Income Sources</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incomeSources.map((s) => {
                    const pct = (s.total / incomeSources.reduce((sum, x) => sum + x.total, 0)) * 100;
                    return (
                      <div key={s.source} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{s.source}</span>
                          <span className="font-mono text-green-500">{formatCurrency(s.total)}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 17: Bank Charges */}
          {bankCharges.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Bank Charges</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['SMS', 'Debit Card', 'Maintenance', 'GST', 'Penalty'].map((charge) => {
                    const txns = bankCharges.filter(t => t.description.toLowerCase().includes(charge.toLowerCase()));
                    const total = txns.reduce((s, t) => s + t.debit, 0);
                    if (total === 0) return null;
                    return (
                      <Card key={charge} className="p-3">
                        <p className="text-xs text-muted-foreground">{charge}</p>
                        <p className="text-sm font-medium text-red-500">{formatCurrency(total)}</p>
                        <p className="text-xs text-muted-foreground">{txns.length} charges</p>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 18: Transaction Timeline */}
          <Card>
            <CardHeader><CardTitle>Transaction Timeline</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-auto">
                <div className="p-6 pt-0">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {timelineData.map((t, i) => (
                        <div key={i} className="flex items-start gap-4 relative">
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 ring-4 ring-background z-10', t.debit > 0 ? 'bg-red-500' : 'bg-green-500')} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{t.normalizedMerchant}</p>
                              <span className={cn('text-sm font-mono shrink-0', t.debit > 0 ? 'text-red-500' : 'text-green-500')}>
                                {t.debit > 0 ? formatCurrency(t.debit) : formatCurrency(t.credit)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 19: Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Search Transactions</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by merchant, amount, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-auto p-6 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTxns.map((t, i) => (
                    <TableRow key={i} className="cursor-pointer" onClick={() => goTo('vendor', t.normalizedMerchant)}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={t.description}>{t.description}</TableCell>
                      <TableCell className="font-medium">{t.normalizedMerchant}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: categoryColor(t.category), color: categoryColor(t.category) }}>
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-500">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</TableCell>
                      <TableCell className="text-right font-mono text-green-500">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Daily Spend Trend */}
          <Card>
            <CardHeader><CardTitle>Daily Spending Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailySpendData}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <ReTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="spend" stroke="#ef4444" fill="url(#spendGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader><CardTitle>Key Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Largest Expense</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium truncate max-w-[200px] text-right cursor-help">
                      {summary.largestExpense ? formatCurrency(summary.largestExpense.debit) : 'N/A'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{summary.largestExpense?.normalizedMerchant} - {summary.largestExpense?.description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Largest Credit</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium truncate max-w-[200px] text-right cursor-help">
                      {summary.largestCredit ? formatCurrency(summary.largestCredit.credit) : 'N/A'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{summary.largestCredit?.normalizedMerchant} - {summary.largestCredit?.description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Most Frequent</span>
                </div>
                <span className="text-sm font-medium">{summary.mostFrequentMerchant || 'N/A'}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Avg Daily Spend</span>
                </div>
                <span className="text-sm font-medium">{formatCurrency(summary.averageDailySpend)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn('h-4 w-4', flagged.length > 0 ? 'text-yellow-500' : 'text-green-500')} />
                  <span className="text-sm text-muted-foreground">Flagged</span>
                </div>
                <span className={cn('text-sm font-medium', flagged.length > 0 ? 'text-yellow-500' : 'text-green-500')}>
                  {flagged.length} ({duplicates.length} dup, {recurring.length} rec)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Flagged Transactions */}
          {flagged.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Flagged Transactions ({flagged.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[250px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flagged.map((t, i) => (
                        <TableRow key={i} className="cursor-pointer" onClick={() => goTo(t.isDuplicate ? 'duplicate' : 'recurring')}>
                          <TableCell>{formatDate(t.date)}</TableCell>
                          <TableCell className="max-w-[250px] truncate">{t.description}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(t.debit || t.credit)}</TableCell>
                          <TableCell>
                            <Badge variant={t.isDuplicate ? 'destructive' : 'secondary'}>
                              {t.isDuplicate ? 'Duplicate' : 'Recurring'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Top Vendors by Spend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={summary.topVendors.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis dataKey="vendor" type="category" tick={{ fontSize: 11 }} className="text-muted-foreground" width={120} />
                    <ReTooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Total" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top Vendors by Frequency</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={topVendorsByCount} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis dataKey="vendor" type="category" tick={{ fontSize: 11 }} className="text-muted-foreground" width={120} />
                    <ReTooltip content={<CustomTooltip />} />
                    <Bar dataKey="transactionCount" name="Transactions" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>All Vendors</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto p-6 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Debits</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((v, i) => (
                      <TableRow key={v.vendor} className="cursor-pointer" onClick={() => goTo('vendor', v.vendor)}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{v.vendor}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: categoryColor(v.category), color: categoryColor(v.category) }}>{v.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{v.transactionCount}</TableCell>
                        <TableCell className="text-right font-mono text-red-500">{formatCurrency(v.debitTotal)}</TableCell>
                        <TableCell className="text-right font-mono text-green-500">{v.creditTotal > 0 ? formatCurrency(v.creditTotal) : '-'}</TableCell>
                        <TableCell className={cn('text-right font-mono', v.balance >= 0 ? 'text-green-500' : 'text-red-500')}>{formatCurrency(v.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Category Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={20} data={categoryBreakdown}>
                    <RadialBar label={{ fill: 'currentColor', position: 'insideStart' }} background dataKey="total" />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    <ReTooltip content={<CustomTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((c) => {
                    const pct = (c.total / categories.reduce((s, x) => s + x.total, 0)) * 100;
                    return (
                      <div key={c.category} className="space-y-1 cursor-pointer" onClick={() => goTo('category', c.category)}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor(c.category) }} />
                            <span>{c.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{c.count} txns</span>
                            <span className="font-mono font-medium w-24 text-right">{formatCurrency(c.total)}</span>
                            <span className="text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: categoryColor(c.category) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Monthly Category Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sortedMonthly}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  {categories.slice(0, 5).map((c) => (
                    <Line key={c.category} type="monotone" dataKey={c.category} name={c.category} stroke={categoryColor(c.category)} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Powered Financial Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-muted-foreground">No insights available for this statement.</p>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <div key={i} className={cn(
                      'flex items-start gap-3 p-4 rounded-lg border',
                      insight.type === 'positive' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' :
                      insight.type === 'negative' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                      'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                    )}>
                      <div className={cn(
                        'p-1.5 rounded-full',
                        insight.type === 'positive' ? 'bg-green-100 dark:bg-green-900' :
                        insight.type === 'negative' ? 'bg-red-100 dark:bg-red-900' :
                        'bg-blue-100 dark:bg-blue-900'
                      )}>
                        {insight.type === 'positive' ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                         insight.type === 'negative' ? <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" /> :
                         <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{insight.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{insight.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-6">
          {personData.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No person-to-person transactions detected.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personData.map((p) => (
                <Card key={p.name} className="cursor-pointer hover:bg-accent" onClick={() => goTo('vendor', p.name)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Money Sent</span>
                        <span className="font-mono text-red-500">{formatCurrency(p.sent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Money Received</span>
                        <span className="font-mono text-green-500">{formatCurrency(p.received)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net</span>
                        <span className={cn('font-mono font-medium', p.net >= 0 ? 'text-green-500' : 'text-red-500')}>
                          {formatCurrency(p.net)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transactions</span>
                        <span className="font-medium">{p.count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="space-y-6">
          {!salaryData ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No salary transactions detected.</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Employer</CardTitle></CardHeader><CardContent><div className="text-lg font-medium">{salaryData.employer}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Monthly Salary</CardTitle></CardHeader><CardContent><div className="text-lg font-bold text-green-500">{formatCurrency(salaryData.avg)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Salary Dates</CardTitle></CardHeader><CardContent><div className="text-lg font-medium">Day {[...new Set(salaryData.dates)].join(', ')}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Salary Growth</CardTitle></CardHeader><CardContent>
                  <div className="text-lg font-medium">
                    {salaryData.salaries.length >= 2 ? (() => {
                      const first = salaryData.salaries[0].salary;
                      const last = salaryData.salaries[salaryData.salaries.length - 1].salary;
                      const change = ((last - first) / first) * 100;
                      return <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>;
                    })() : 'N/A'}
                  </div>
                </CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Salary Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salaryData.salaries}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                      <ReTooltip content={<CustomTooltip />} />
                      <Bar dataKey="salary" name="Salary" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Recurring Tab */}
        <TabsContent value="recurring" className="space-y-6">
          {recurringPayments.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No recurring payments detected.</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {recurringPayments.map((r) => (
                  <Card key={r.name} className="p-3">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-red-500 font-mono">{formatCurrency(r.total)}</p>
                    <p className="text-xs text-muted-foreground">{r.count}x payments</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(r.avg)}/mo avg</p>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader><CardTitle>Recurring Payment Details</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Monthly Avg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recurringPayments.map((r) => (
                          <TableRow key={r.name} className="cursor-pointer" onClick={() => goTo('vendor', r.name)}>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                            <TableCell className="text-right font-mono text-red-500">{formatCurrency(r.total)}</TableCell>
                            <TableCell className="text-right">{r.count}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(r.avg)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-6">
          {!investmentSummary ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No investment transactions detected.</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Invested</CardTitle></CardHeader><CardContent><div className="text-lg font-bold text-green-500">{formatCurrency(investmentSummary.total)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Transactions</CardTitle></CardHeader><CardContent><div className="text-lg font-bold">{investmentSummary.count}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Platforms</CardTitle></CardHeader><CardContent><div className="text-lg font-bold">{investmentSummary.byType.length}</div></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Investment Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investmentSummary.byType.map((inv) => {
                      const pct = (inv.total / investmentSummary.total) * 100;
                      return (
                        <div key={inv.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{inv.name}</span>
                            <span className="font-mono text-green-500">{formatCurrency(inv.total)}</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{transactions.length}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Duplicates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-500">{duplicates.length}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recurring</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-500">{recurring.length}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="p-6 pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-center">Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t, i) => (
                      <TableRow key={i} className="cursor-pointer" onClick={() => goTo('vendor', t.normalizedMerchant)}>
                        <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={t.description}>{t.description}</TableCell>
                        <TableCell className="font-medium">{t.normalizedMerchant}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: categoryColor(t.category), color: categoryColor(t.category) }}>{t.category}</Badge>
                        </TableCell>
                        <TableCell>{t.person || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-red-500">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</TableCell>
                        <TableCell className="text-right font-mono text-green-500">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {t.isDuplicate && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                            {t.isRecurring && <Repeat className="h-3.5 w-3.5 text-purple-500" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
