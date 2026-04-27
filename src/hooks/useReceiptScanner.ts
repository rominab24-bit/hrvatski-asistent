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
  calculated_total?: number;
  total_difference?: number;
  needs_review?: boolean;
  review_message?: string;
  currency?: string;
  items: ReceiptItem[];
  /**
   * Storage path of the uploaded receipt image inside the `receipts` bucket.
   * Format: `{auth.uid()}/<uuid>.<ext>`. Use `createSignedUrl` to display.
   */
  receipt_image_path?: string;
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
        title: data.data.needs_review ? 'Račun skeniran, potrebna provjera' : 'Račun uspješno skeniran!',
        description: data.data.needs_review
          ? 'Zbroj stavki se ne slaže s ukupnim iznosom računa.'
          : `Pronađeno ${data.data.items?.length || 0} stavki`,
        variant: data.data.needs_review ? 'destructive' : 'default',
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
