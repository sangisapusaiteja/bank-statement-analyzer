let data: any = null;
let excelBase64: string | null = null;
let excelFilename: string = '';

export function getAnalysisData() {
  return data;
}

export function setAnalysisData(d: any) {
  data = d;
}

export function getExcelData() {
  return { excelBase64, excelFilename };
}

export function setExcelData(base64: string, filename: string) {
  excelBase64 = base64;
  excelFilename = filename;
}

export function clearAnalysisData() {
  data = null;
  excelBase64 = null;
  excelFilename = '';
}
