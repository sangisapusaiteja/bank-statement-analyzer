'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2, AlertCircle, Download, BarChart3, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setAnalysisData, setExcelData, getExcelData } from '@/lib/store';
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

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setDone(false);
    const pdfFile = acceptedFiles.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfFile) {
      setError('Only PDF files are accepted');
      return;
    }
    setFiles([pdfFile]);
  }, []);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (password) formData.append('password', password);

    try {
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 500);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }

      const data = await res.json();
      setAnalysisData(data.analysis);
      setExcelData(data.excelBase64, data.filename);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('min-h-screen transition-colors duration-300', darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="StatementAnalytics" className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">StatementAnalytics</h1>
              <p className={cn('mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                Upload PDF statements & get organized reports
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center',
              darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {darkMode ? <Sun className="w-4 h-4 mr-1.5" /> : <Moon className="w-4 h-4 mr-1.5" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </header>

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200',
            isDragActive
              ? 'border-blue-500 bg-blue-500/10'
              : darkMode
                ? 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn('w-12 h-12 mx-auto mb-4', isDragActive ? 'text-blue-500' : darkMode ? 'text-gray-500' : 'text-gray-400')} />
          <p className="text-lg font-medium mb-1">
            {isDragActive ? 'Drop your PDFs here' : 'Drag & drop bank statement PDFs'}
          </p>
          <p className={cn('text-sm', darkMode ? 'text-gray-500' : 'text-gray-400')}>
            or click to browse &middot; Multiple files supported
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">{files.length} file{files.length > 1 ? 's' : ''} selected</h2>
              <button
                onClick={() => setFiles([])}
                className={cn('text-sm', darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {files.map((f) => (
                <div
                  key={f.name}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl',
                    darkMode ? 'bg-gray-900' : 'bg-white border border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{f.name}</p>
                      <p className={cn('text-xs', darkMode ? 'text-gray-500' : 'text-gray-400')}>{formatFileSize(f.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(f.name)} className="p-1 hover:bg-gray-700/50 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="password"
              placeholder="PDF password (if encrypted)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'w-full mt-3 p-3 rounded-xl text-sm border',
                darkMode ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={cn(
                'w-full mt-4 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2',
                uploading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing... {progress}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        )}

        {uploading && (
          <div className="mt-6">
            <div className={cn('w-full h-2 rounded-full overflow-hidden', darkMode ? 'bg-gray-800' : 'bg-gray-200')}>
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={cn('text-sm mt-2 text-center', darkMode ? 'text-gray-500' : 'text-gray-400')}>
              Extracting transactions, normalizing merchants, generating reports...
            </p>
          </div>
        )}

        {error && (
          <div className={cn('mt-6 p-4 rounded-xl flex items-start gap-3', darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700')}>
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {done && (
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={downloadExcel}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98] text-sm"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98] text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              View Dashboard
            </button>
          </div>
        )}

        <footer className={cn('mt-12 text-center text-xs', darkMode ? 'text-gray-700' : 'text-gray-400')}>
          StatementAnalytics &middot; All processing is done locally
        </footer>
      </div>
    </div>
  );
}
