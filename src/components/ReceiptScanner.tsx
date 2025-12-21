import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useReceiptScanner, ReceiptData } from '@/hooks/useReceiptScanner';
import { Camera, Upload, Loader2, Check, X, Receipt } from 'lucide-react';

interface ReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void;
  onCancel: () => void;
}

export function ReceiptScanner({ onScanComplete, onCancel }: ReceiptScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isScanning, receiptData, scanReceipt } = useReceiptScanner();

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
      onScanComplete(result);
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  if (receiptData) {
    return (
      <Card className="p-6 glass-card animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">Račun skeniran!</h3>
            <p className="text-sm text-muted-foreground">
              {receiptData.store_name || 'Trgovina'} • {receiptData.items.length} stavki
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-auto">
          {receiptData.items.map((item, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center p-2 rounded-lg bg-secondary/50"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
              <p className="font-mono font-medium">{item.price.toFixed(2)} €</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onCancel} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Odustani
          </Button>
          <Button onClick={() => onScanComplete(receiptData)} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Spremi sve
          </Button>
        </div>
      </Card>
    );
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
            onClick={() => fileInputRef.current?.click()}
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
