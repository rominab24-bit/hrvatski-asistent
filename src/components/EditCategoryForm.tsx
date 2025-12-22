import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoryIcons, Category } from '@/lib/categories';
import { Check, X } from 'lucide-react';

const availableColors = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

interface EditCategoryFormProps {
  category: Category;
  onSubmit: (data: { name: string; icon: string; color: string }) => void;
  onCancel: () => void;
}

export function EditCategoryForm({ category, onSubmit, onCancel }: EditCategoryFormProps) {
  const [name, setName] = useState(category.name);
  const [selectedIcon, setSelectedIcon] = useState<string>(category.icon);
  const [selectedColor, setSelectedColor] = useState<string>(category.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
  };

  const iconEntries = Object.entries(categoryIcons);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Naziv kategorije</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="npr. Putovanja, Kućni ljubimci..."
          className="bg-secondary border-border"
          required
          maxLength={30}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Ikona ({iconEntries.length} dostupnih)</label>
        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
          {iconEntries.map(([iconName, IconComponent]) => {
            const isSelected = selectedIcon === iconName;
            
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setSelectedIcon(iconName)}
                className={`
                  p-2 rounded-lg flex items-center justify-center transition-all
                  ${isSelected 
                    ? 'ring-2 ring-primary bg-primary/10' 
                    : 'bg-secondary hover:bg-secondary/80'
                  }
                `}
                title={iconName}
              >
                <IconComponent 
                  className="w-4 h-4" 
                  style={{ color: selectedColor }} 
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Boja</label>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => {
            const isSelected = selectedColor === color;
            
            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`
                  w-7 h-7 rounded-full transition-all
                  ${isSelected ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'hover:scale-105'}
                `}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Odustani
        </Button>
        <Button type="submit" className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          Spremi
        </Button>
      </div>
    </form>
  );
}
