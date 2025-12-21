import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/exportData';
import { toast } from 'sonner';

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

interface ExportDialogProps {
  expenses: Expense[];
  categories: Category[];
  monthlyTotal: number;
}

export function ExportDialog({ expenses, categories, monthlyTotal }: ExportDialogProps) {
  const handleCSVExport = () => {
    try {
      exportToCSV(expenses);
      toast.success('CSV datoteka uspješno izvezena!');
    } catch {
      toast.error('Greška pri izvozu CSV datoteke');
    }
  };

  const handlePDFExport = () => {
    try {
      exportToPDF(expenses, categories, monthlyTotal);
      toast.success('PDF datoteka uspješno izvezena!');
    } catch {
      toast.error('Greška pri izvozu PDF datoteke');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Download className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Izvoz podataka</DialogTitle>
          <DialogDescription>
            Odaberite format za izvoz vaših troškova
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            onClick={handleCSVExport}
            variant="outline"
            className="justify-start gap-3 h-14"
          >
            <FileSpreadsheet className="w-6 h-6 text-green-500" />
            <div className="text-left">
              <div className="font-medium">CSV format</div>
              <div className="text-xs text-muted-foreground">Za Excel, Google Sheets</div>
            </div>
          </Button>
          <Button
            onClick={handlePDFExport}
            variant="outline"
            className="justify-start gap-3 h-14"
          >
            <FileText className="w-6 h-6 text-red-500" />
            <div className="text-left">
              <div className="font-medium">PDF format</div>
              <div className="text-xs text-muted-foreground">S grafikonom i sažetkom</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
