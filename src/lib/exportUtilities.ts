import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface UtilityExpenseRow {
  expense_date: string;
  description: string;
  amount: number;
  category?: { name: string } | null;
}

export interface UtilityCategoryTotal {
  name: string;
  total: number;
  count: number;
}

function fileStamp() {
  return format(new Date(), 'yyyy-MM-dd');
}

function periodLabel(periodDate: Date) {
  return format(periodDate, 'yyyy-MM');
}

function buildRows(expenses: UtilityExpenseRow[]) {
  return expenses
    .slice()
    .sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1))
    .map(e => ({
      Datum: format(new Date(e.expense_date), 'dd.MM.yyyy'),
      Kategorija: e.category?.name || 'Bez kategorije',
      Opis: e.description,
      'Iznos (€)': Number(Number(e.amount).toFixed(2)),
    }));
}

export function exportUtilitiesCSV(
  expenses: UtilityExpenseRow[],
  perCategory: UtilityCategoryTotal[],
  monthTotal: number,
  periodDate: Date,
) {
  const period = periodLabel(periodDate);
  const headers = ['Datum', 'Kategorija', 'Opis', 'Iznos (€)'];

  const dataRows = buildRows(expenses).map(r => [
    r.Datum, r.Kategorija, r.Opis, r['Iznos (€)'].toFixed(2).replace('.', ','),
  ]);

  const summaryLines = [
    ['Izvještaj kućnih režija'],
    ['Razdoblje', period],
    ['Ukupno (€)', monthTotal.toFixed(2).replace('.', ',')],
    ['Broj računa', String(expenses.length)],
    [],
    ['Po kategorijama'],
    ['Kategorija', 'Broj računa', 'Iznos (€)'],
    ...perCategory.map(c => [
      c.name,
      String(c.count),
      c.total.toFixed(2).replace('.', ','),
    ]),
    [],
    ['Detalji računa'],
    headers,
    ...dataRows,
  ];

  const csv = summaryLines
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kucne-rezije_${period}_${fileStamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportUtilitiesXLSX(
  expenses: UtilityExpenseRow[],
  perCategory: UtilityCategoryTotal[],
  monthTotal: number,
  periodDate: Date,
) {
  const period = periodLabel(periodDate);
  const wb = XLSX.utils.book_new();

  // Sažetak
  const summaryAoA: (string | number)[][] = [
    ['Izvještaj kućnih režija'],
    ['Razdoblje', period],
    ['Ukupno (€)', Number(monthTotal.toFixed(2))],
    ['Broj računa', expenses.length],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoA);
  summaryWs['!cols'] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Sažetak');

  // Po kategorijama
  const catWs = XLSX.utils.json_to_sheet(
    perCategory.map(c => ({
      Kategorija: c.name,
      'Broj računa': c.count,
      'Iznos (€)': Number(c.total.toFixed(2)),
    })),
  );
  catWs['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, catWs, 'Po kategorijama');

  // Računi
  const rowsWs = XLSX.utils.json_to_sheet(buildRows(expenses));
  rowsWs['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 40 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, rowsWs, 'Računi');

  XLSX.writeFile(wb, `kucne-rezije_${period}_${fileStamp()}.xlsx`);
}
