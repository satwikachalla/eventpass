import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Downloads a CSV file in the browser
 */
export function exportToCsv(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads an Excel (.xlsx) file in the browser
 */
export function exportToXlsx(data: Record<string, any>[], filename: string, sheetName = 'Sheet1'): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
