'use client';

import { useRouter } from 'next/navigation';
import { getAnalysisData, getExcelData } from '@/lib/store';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Upload, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

function downloadExcel() {
  const { excelBase64, excelFilename } = getExcelData();
  if (!excelBase64) return;
  const byteChars = atob(excelBase64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNums);
  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = excelFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const data = getAnalysisData();

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No analysis data found. Please upload statements first.</p>
          <Button onClick={() => router.push('/')}>Go to Upload</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src="/logo.svg" alt="StatementAnalytics" className="w-7 h-7" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                {data.summary.totalTransactions} transactions analyzed
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={downloadExcel}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              <Upload className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
        <Dashboard data={data} />
      </div>
    </div>
  );
}
