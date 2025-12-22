import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { categoryIcons } from '@/lib/categories';
import { Plus, X } from 'lucide-react';

const availableColors = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

interface AddCategoryFormProps {
  onSubmit: (data: { name: string; icon: string; color: string }) => void;
  onCancel: () => void;
}

export function AddCategoryForm({ onSubmit, onCancel }: AddCategoryFormProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('more-horizontal');
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]);

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
    <Card className="p-6 glass-card animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Nova kategorija</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

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
          <label className="text-sm font-medium text-muted-foreground">Ikona</label>
          <div className="grid grid-cols-5 gap-2">
            {iconEntries.map(([iconName, IconComponent]) => {
              const isSelected = selectedIcon === iconName;
              
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`
                    p-3 rounded-lg flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'bg-secondary hover:bg-secondary/80'
                    }
                  `}
                >
                  <IconComponent 
                    className="w-5 h-5" 
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
                    w-8 h-8 rounded-full transition-all
                    ${isSelected ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'hover:scale-105'}
                  `}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        </div>

        <Button type="submit" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj kategoriju
        </Button>
      </form>
    </Card>
  );
}
