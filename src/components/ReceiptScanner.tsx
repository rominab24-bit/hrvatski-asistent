import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useReceiptScanner, ReceiptData, ReceiptItem } from '@/hooks/useReceiptScanner';
import { Camera, Upload, Loader2, Check, X, Receipt, CalendarIcon, Trash2 } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Category, getCategoryIcon } from '@/lib/categories';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { hr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void;
  onCancel: () => void;
  categories: Category[];
}

export function ReceiptScanner({ onScanComplete, onCancel, categories }: ReceiptScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedReceiptData, setEditedReceiptData] = useState<ReceiptData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isScanning, receiptData, scanReceipt, clearData } = useReceiptScanner();

  // When receipt data is received, set up editable state
  const handleScanComplete = (data: ReceiptData) => {
    // Parse date from receipt if available
    if (data.date) {
      try {
        // Try to parse date in DD.MM.YYYY format
        const parsed = parse(data.date, 'dd.MM.yyyy', new Date());
        if (!isNaN(parsed.getTime())) {
          setSelectedDate(parsed);
        }
      } catch {
        // Keep default date
      }
    }
    setEditedReceiptData(data);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    
    // Remove the data:image/...;base64, prefix
    const base64Data = imagePreview.split(',')[1];
    const result = await scanReceipt(base64Data);
    
    if (result) {
      handleScanComplete(result);
    }
  };

  const updateItemCategory = (index: number, categoryName: string) => {
    if (!editedReceiptData) return;
    const updatedItems = [...editedReceiptData.items];
    updatedItems[index] = { ...updatedItems[index], category: categoryName };
    setEditedReceiptData({ ...editedReceiptData, items: updatedItems });
  };

  const deleteItem = (index: number) => {
    if (!editedReceiptData) return;
    const updatedItems = editedReceiptData.items.filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0);
    setEditedReceiptData({ 
      ...editedReceiptData, 
      items: updatedItems,
      total_amount: newTotal 
    });
  };

  const handleSaveAll = () => {
    if (!editedReceiptData) return;
    
    // Update the date in the format expected by Dashboard
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const dataToSave: ReceiptData = {
      ...editedReceiptData,
      date: formattedDate,
    };
    
    onScanComplete(dataToSave);
    clearData();
  };

  const handleCancelEdit = () => {
    setEditedReceiptData(null);
    clearData();
    onCancel();
  };

  const handleCameraCapture = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      
      if (image.base64String) {
        const base64WithPrefix = `data:image/${image.format};base64,${image.base64String}`;
        setImagePreview(base64WithPrefix);
      }
    } catch (error) {
      console.log('Kamera nije dostupna, koristim fallback:', error);
      // Fallback na file input za web
      fileInputRef.current?.click();
    }
  };

  const handleGallerySelect = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      
      if (image.base64String) {
        const base64WithPrefix = `data:image/${image.format};base64,${image.base64String}`;
        setImagePreview(base64WithPrefix);
      }
    } catch (error) {
      console.log('Galerija nije dostupna, koristim fallback:', error);
      // Fallback na file input za web
      fileInputRef.current?.click();
    }
  };

  // Show editable view after scanning
  if (editedReceiptData) {
    return (
      <Card className="p-6 glass-card animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">Račun skeniran!</h3>
            <p className="text-sm text-muted-foreground">
              {editedReceiptData.store_name || 'Trgovina'} • {editedReceiptData.items.length} stavki
            </p>
          </div>
        </div>

        {/* Date picker */}
        <div className="mb-4 p-3 rounded-lg bg-secondary/50">
          <label className="text-sm font-medium mb-2 block">Datum računa</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: hr }) : <span>Odaberi datum</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Items with category selection */}
        <div className="space-y-3 max-h-60 overflow-auto">
          {editedReceiptData.items.map((item, index) => {
            const currentCategory = categories.find(c => c.name === item.category);
            const IconComponent = currentCategory ? getCategoryIcon(currentCategory.icon) : null;
            
            return (
              <div 
                key={index} 
                className="p-3 rounded-lg bg-secondary/50 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium flex-1 mr-2">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium">{item.price.toFixed(2)} €</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Select
                  value={item.category}
                  onValueChange={(value) => updateItemCategory(index, value)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {IconComponent && (
                          <IconComponent 
                            className="w-4 h-4" 
                            style={{ color: currentCategory?.color }} 
                          />
                        )}
                        <span>{item.category}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const CatIcon = getCategoryIcon(cat.icon);
                      return (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Odustani
          </Button>
          <Button onClick={handleSaveAll} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Spremi sve
          </Button>
        </div>
      </Card>
    );
  }

  // Show loading or waiting for scan state
  if (receiptData && !editedReceiptData) {
    handleScanComplete(receiptData);
    return null;
  }

  return (
    <Card className="p-6 glass-card animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Skeniraj račun
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!imagePreview ? (
        <div className="space-y-3">
          <Button
            onClick={handleCameraCapture}
            variant="outline"
            className="w-full h-32 border-dashed border-2 flex flex-col gap-2"
          >
            <Camera className="w-8 h-8 text-muted-foreground" />
            <span className="text-muted-foreground">Slikaj račun</span>
          </Button>
          
          <Button
            onClick={handleGallerySelect}
            variant="secondary"
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Odaberi iz galerije
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-secondary">
            <img 
              src={imagePreview} 
              alt="Račun" 
              className="w-full max-h-64 object-contain"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setImagePreview(null)} 
              variant="outline" 
              className="flex-1"
            >
              Ponovi
            </Button>
            <Button 
              onClick={handleScan} 
              className="flex-1"
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skeniram...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Analiziraj
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">
        AI će automatski prepoznati stavke i razvrstati ih po kategorijama
      </p>
    </Card>
  );
}
