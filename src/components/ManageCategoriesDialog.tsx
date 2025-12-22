import { useState } from 'react';
import { Category, getCategoryIcon } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Trash2, Pencil } from 'lucide-react';
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
import { EditCategoryForm } from './EditCategoryForm';

interface ManageCategoriesDialogProps {
  categories: Category[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { name: string; icon: string; color: string }) => void;
}

export function ManageCategoriesDialog({ categories, onDelete, onUpdate }: ManageCategoriesDialogProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Filter to show only custom categories (those with user_id - we identify them by checking if they're deletable)
  // Default categories don't have user_id, custom ones do
  const customCategories = categories.filter(cat => 
    // Custom categories will have a user_id field (even though it's not in the Category type)
    (cat as any).user_id !== null && (cat as any).user_id !== undefined
  );

  const handleEditSubmit = (data: { name: string; icon: string; color: string }) => {
    if (editingCategory) {
      onUpdate(editingCategory.id, data);
      setEditingCategory(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? `Uredi: ${editingCategory.name}` : 'Upravljanje kategorijama'}
          </DialogTitle>
        </DialogHeader>
        
        {editingCategory ? (
          <EditCategoryForm
            category={editingCategory}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingCategory(null)}
          />
        ) : (
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
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      
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
                  </div>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
