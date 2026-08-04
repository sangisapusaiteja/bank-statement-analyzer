'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingDown, TrendingUp, Receipt, AlertTriangle, Repeat, Sun, Moon } from 'lucide-react';
import { getAnalysisData } from '@/lib/store';
import { useTheme } from '@/components/theme-provider';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', Shopping: '#ec4899', Fuel: '#eab308', Bills: '#3b82f6',
  Entertainment: '#8b5cf6', Travel: '#14b8a6', Healthcare: '#ef4444',
  Salary: '#22c55e', Transfer: '#06b6d4', Investment: '#6366f1', ATM: '#6b7280', Others: '#78716c',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function categoryColor(cat: string) { return CATEGORY_COLORS[cat] || '#78716c'; }

export default function DetailPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
      <DetailPage />
    </Suspense>
  );
}

function DetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const type = searchParams.get('type');
  const name = searchParams.get('name');

  const data = useMemo(() => getAnalysisData(), []);

  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    if (type === 'category') return data.transactions.filter((t: any) => t.category === name);
    if (type === 'vendor') return data.transactions.filter((t: any) => t.normalizedMerchant === name);
    if (type === 'duplicate') return data.transactions.filter((t: any) => t.isDuplicate);
    if (type === 'recurring') return data.transactions.filter((t: any) => t.isRecurring);
    if (type === 'flagged') return data.transactions.filter((t: any) => t.isDuplicate || t.isRecurring);
    return data.transactions;
  }, [data, type, name]);

  const totalDebit = useMemo(() => filteredTransactions.reduce((s: number, t: any) => s + t.debit, 0), [filteredTransactions]);
  const totalCredit = useMemo(() => filteredTransactions.reduce((s: number, t: any) => s + t.credit, 0), [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>();
    for (const t of filteredTransactions) {
      const key = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      const e = map.get(key) || { debit: 0, credit: 0 };
      e.debit += t.debit;
      e.credit += t.credit;
      map.set(key, e);
    }
    return Array.from(map.entries()).map(([month, v]) => ({ month, debit: Math.round(v.debit * 100) / 100, credit: Math.round(v.credit * 100) / 100 }));
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filteredTransactions) {
      map.set(t.category, (map.get(t.category) || 0) + t.debit);
    }
    return Array.from(map.entries()).map(([cat, total]) => ({ category: cat, total: Math.round(total * 100) / 100, fill: categoryColor(cat) }));
  }, [filteredTransactions]);

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No analysis data found. Please upload statements first.</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {type === 'category' && `Category: ${name}`}
                {type === 'vendor' && `Vendor: ${name}`}
                {type === 'duplicate' && 'Duplicate Transactions'}
                {type === 'recurring' && 'Recurring Transactions'}
                {type === 'flagged' && 'Flagged Transactions'}
                {!type && 'All Transactions'}
              </h1>
              <p className="text-muted-foreground text-sm">{filteredTransactions.length} transactions</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Total Debits</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(totalDebit)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Total Credits</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-500">{formatCurrency(totalCredit)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{filteredTransactions.length}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categoryData.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={55} label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <ReTooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {monthlyData.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <ReTooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Legend />
                    <Bar dataKey="debit" name="Debits" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="credit" name="Credits" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px]">
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
                  {filteredTransactions.map((t: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={t.description}>{t.description}</TableCell>
                      <TableCell className="font-medium">{t.normalizedMerchant}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: categoryColor(t.category), color: categoryColor(t.category) }}>
                          {t.category}
                        </Badge>
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
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
