import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useReceiptScanner, ReceiptData, ReceiptItem, DateConfidence } from '@/hooks/useReceiptScanner';
import { Camera, Upload, Loader2, Check, X, Receipt, CalendarIcon, Trash2, Plus, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Category, getCategoryIcon } from '@/lib/categories';
import { useToast } from '@/hooks/use-toast';
import {
  validateReceiptFile,
  validateReceiptBase64,
  ALLOWED_RECEIPT_MIME_TYPES,
  MAX_RECEIPT_FILE_SIZE,
  uploadReceiptFromDataUrl,
} from '@/lib/receiptUpload';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, parseISO, isValid } from 'date-fns';
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
  const [dateConfidence, setDateConfidence] = useState<DateConfidence | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isScanning, receiptData, scanReceipt, clearData } = useReceiptScanner();
  const { toast } = useToast();

  // When receipt data is received, set up editable state
  const handleScanComplete = (data: ReceiptData) => {
    // Set date confidence
    setDateConfidence(data.date_confidence || null);
    
    // Parse date from receipt if available
    if (data.date) {
      const raw = String(data.date).trim();

      const trySetDate = (d: Date) => {
        if (isValid(d)) setSelectedDate(d);
      };

      try {
        // Common formats coming from AI / receipts:
        // - 2025-12-22 (ISO date)
        // - 22.12.2025
        // - 22/12/2025
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
          trySetDate(parseISO(raw));
        } else if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(raw)) {
          trySetDate(parse(raw, 'dd.MM.yyyy', new Date()));
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
          trySetDate(parse(raw, 'dd/MM/yyyy', new Date()));
        } else {
          // Fallback: try ISO parse
          trySetDate(parseISO(raw));
        }
      } catch {
        // Keep default date
      }
    }

    setEditedReceiptData(data);
  };

  const getConfidenceInfo = (confidence: DateConfidence | null) => {
    switch (confidence) {
      case 'high':
        return { 
          label: 'Visoka sigurnost', 
          color: 'text-green-600 dark:text-green-400', 
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          Icon: CheckCircle 
        };
      case 'medium':
        return { 
          label: 'Srednja sigurnost', 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          Icon: HelpCircle 
        };
      case 'low':
        return { 
          label: 'Niska sigurnost', 
          color: 'text-red-600 dark:text-red-400', 
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          Icon: AlertCircle 
        };
      default:
        return { 
          label: 'Nepoznato', 
          color: 'text-muted-foreground', 
          bgColor: 'bg-muted',
          Icon: HelpCircle 
        };
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateReceiptFile(file);
    if (!validation.ok) {
      toast({
        title: 'Neispravna datoteka',
        description: validation.error,
        variant: 'destructive',
      });
      // Reset input so user can re-select the same file after fixing
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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

    // Upload the receipt image to private storage in parallel with AI scan.
    // We keep the image even if the AI scan fails — user may retry parsing.
    const base64Data = imagePreview.split(',')[1];

    setIsUploading(true);
    const uploadPromise = uploadedPath
      ? Promise.resolve({ path: uploadedPath })
      : uploadReceiptFromDataUrl(imagePreview).catch((err) => {
          console.error('Upload slike nije uspio:', err);
          toast({
            title: 'Slika nije pohranjena',
            description: err instanceof Error ? err.message : 'Nepoznata greška',
            variant: 'destructive',
          });
          return null;
        });

    const [uploadResult, scanResult] = await Promise.all([
      uploadPromise,
      scanReceipt(base64Data),
    ]);
    setIsUploading(false);

    if (uploadResult?.path) {
      setUploadedPath(uploadResult.path);
    }

    if (scanResult) {
      handleScanComplete({
        ...scanResult,
        receipt_image_path: uploadResult?.path ?? undefined,
      });
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

  const addNewItem = () => {
    if (!editedReceiptData || !newItemName.trim() || !newItemPrice) return;
    
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) return;
    
    const categoryToUse = newItemCategory || categories[0]?.name || 'Ostalo';
    
    const newItem: ReceiptItem = {
      name: newItemName.trim(),
      price: price,
      category: categoryToUse,
    };
    
    const updatedItems = [...editedReceiptData.items, newItem];
    const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0);
    
    setEditedReceiptData({
      ...editedReceiptData,
      items: updatedItems,
      total_amount: newTotal,
    });
    
    // Reset form
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCategory('');
    setShowAddItem(false);
  };

  const handleSaveAll = () => {
    if (!editedReceiptData) return;

    // Update the date in the format expected by Dashboard
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const dataToSave: ReceiptData = {
      ...editedReceiptData,
      date: formattedDate,
      // Make sure the uploaded image path travels with the saved data
      receipt_image_path: editedReceiptData.receipt_image_path ?? uploadedPath ?? undefined,
    };

    onScanComplete(dataToSave);
    clearData();
    setUploadedPath(null);
  };

  const handleCancelEdit = () => {
    setEditedReceiptData(null);
    clearData();
    setUploadedPath(null);
    onCancel();
  };

  const acceptCapturedImage = (base64: string, format: string): boolean => {
    const validation = validateReceiptBase64(base64, format);
    if (!validation.ok) {
      toast({
        title: 'Neispravna slika',
        description: validation.error,
        variant: 'destructive',
      });
      return false;
    }
    const safeFormat = (format || 'jpeg').toLowerCase();
    setImagePreview(`data:image/${safeFormat};base64,${base64}`);
    return true;
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
        acceptCapturedImage(image.base64String, image.format);
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
        acceptCapturedImage(image.base64String, image.format);
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

        {/* Date picker with confidence indicator */}
        <div className="mb-4 p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Datum računa</label>
            {dateConfidence && (() => {
              const { label, color, bgColor, Icon } = getConfidenceInfo(dateConfidence);
              return (
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs", bgColor, color)}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </div>
              );
            })()}
          </div>
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
          {dateConfidence === 'low' && (
            <p className="text-xs text-muted-foreground mt-2">
              Datum nije jasno prepoznat. Provjerite i ispravite ako je potrebno.
            </p>
          )}
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

        {/* Add new item form */}
        {showAddItem ? (
          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
            <Input
              placeholder="Naziv stavke"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Cijena (€)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="flex-1"
              />
              <Select
                value={newItemCategory}
                onValueChange={setNewItemCategory}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Kategorija" />
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowAddItem(false);
                  setNewItemName('');
                  setNewItemPrice('');
                  setNewItemCategory('');
                }}
                className="flex-1"
              >
                Odustani
              </Button>
              <Button 
                size="sm" 
                onClick={addNewItem}
                disabled={!newItemName.trim() || !newItemPrice}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Dodaj
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full mt-3 border-dashed"
            onClick={() => setShowAddItem(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj novu stavku
          </Button>
        )}

        {/* Total amount display */}
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="font-medium">Ukupno:</span>
            <span className="text-xl font-bold text-primary">
              {editedReceiptData.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)} €
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {editedReceiptData.items.length} {editedReceiptData.items.length === 1 ? 'stavka' : editedReceiptData.items.length < 5 ? 'stavke' : 'stavki'}
          </p>
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
        accept={ALLOWED_RECEIPT_MIME_TYPES.join(',')}
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
        <br />
        <span className="opacity-70">
          Podržani formati: JPG, PNG, WEBP, HEIC • Maks. {(MAX_RECEIPT_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB
        </span>
      </p>
    </Card>
  );
}
