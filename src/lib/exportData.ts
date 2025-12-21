import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category?: {
    name: string;
    icon: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function exportToCSV(expenses: Expense[], filename = 'troskovi') {
  const headers = ['Datum', 'Opis', 'Kategorija', 'Iznos (€)'];
  
  const rows = expenses.map(expense => [
    format(new Date(expense.expense_date), 'dd.MM.yyyy'),
    expense.description,
    expense.category?.name || 'Bez kategorije',
    expense.amount.toFixed(2)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(
  expenses: Expense[], 
  categories: Category[],
  monthlyTotal: number,
  filename = 'troskovi'
) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Izvješće o troškovima', 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generirano: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: hr })}`, 14, 30);
  
  // Summary
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Ukupno troškova: ${monthlyTotal.toFixed(2)} €`, 14, 42);
  doc.text(`Broj transakcija: ${expenses.length}`, 14, 50);
  
  // Category breakdown
  const categoryTotals = categories.map(cat => {
    const total = expenses
      .filter(e => e.category?.name === cat.name)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, total };
  }).filter(c => c.total > 0);

  if (categoryTotals.length > 0) {
    doc.text('Po kategorijama:', 14, 62);
    let yPos = 70;
    categoryTotals.forEach(cat => {
      doc.text(`• ${cat.name}: ${cat.total.toFixed(2)} €`, 20, yPos);
      yPos += 8;
    });
  }

  // Expense table
  const tableData = expenses.map(expense => [
    format(new Date(expense.expense_date), 'dd.MM.yyyy'),
    expense.description,
    expense.category?.name || 'Bez kategorije',
    `${expense.amount.toFixed(2)} €`
  ]);

  autoTable(doc, {
    head: [['Datum', 'Opis', 'Kategorija', 'Iznos']],
    body: tableData,
    startY: categoryTotals.length > 0 ? 70 + categoryTotals.length * 8 + 10 : 62,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
