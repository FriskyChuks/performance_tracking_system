// src/utils/exportUtils.js
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data, filename, title) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(34, 197, 94);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });
  
  // Add timestamp
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
  
  // Add table
  autoTable(doc, {
    head: [Object.keys(data[0] || {})],
    body: data.map(item => Object.values(item)),
    startY: 40,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 10, right: 10 }
  });
  
  doc.save(`${filename}.pdf`);
};