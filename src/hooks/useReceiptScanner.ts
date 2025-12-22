import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReceiptItem {
  name: string;
  quantity?: number;
  price: number;
  category: string;
}

export type DateConfidence = 'high' | 'medium' | 'low';

export interface ReceiptData {
  store_name?: string;
  date?: string;
  date_confidence?: DateConfidence;
  total_amount: number;
  currency?: string;
  items: ReceiptItem[];
}

export function useReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const { toast } = useToast();

  const scanReceipt = useCallback(async (imageBase64: string) => {
    setIsScanning(true);
    setReceiptData(null);

    try {
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64 }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Greška pri skeniranju računa');
      }

      setReceiptData(data.data);
      toast({
        title: 'Račun uspješno skeniran!',
        description: `Pronađeno ${data.data.items?.length || 0} stavki`,
      });

      return data.data;
    } catch (error) {
      console.error('Greška pri skeniranju:', error);
      toast({
        title: 'Greška',
        description: error instanceof Error ? error.message : 'Nije moguće skenirati račun',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const clearData = useCallback(() => {
    setReceiptData(null);
  }, []);

  return {
    isScanning,
    receiptData,
    scanReceipt,
    clearData,
  };
}
