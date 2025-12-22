import { Category, getCategoryIcon } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ManageCategoriesDialogProps {
  categories: Category[];
  onDelete: (id: string) => void;
}

export function ManageCategoriesDialog({ categories, onDelete }: ManageCategoriesDialogProps) {
  // Filter to show only custom categories (those with user_id - we identify them by checking if they're deletable)
  // Default categories don't have user_id, custom ones do
  const customCategories = categories.filter(cat => 
    // Custom categories will have a user_id field (even though it's not in the Category type)
    (cat as any).user_id !== null && (cat as any).user_id !== undefined
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upravljanje kategorijama</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {customCategories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              Nemate prilagođenih kategorija.<br />
              Dodajte novu kategoriju pomoću gumba "Nova".
            </p>
          ) : (
            customCategories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              
              return (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent 
                        className="w-4 h-4" 
                        style={{ color: category.color }} 
                      />
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Obrisati kategoriju?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Jeste li sigurni da želite obrisati kategoriju "{category.name}"? 
                          Troškovi povezani s ovom kategorijom neće biti obrisani, ali će ostati bez kategorije.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Odustani</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDelete(category.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Obriši
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
