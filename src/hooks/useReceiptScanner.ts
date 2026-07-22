import { useState, useCallback, useEffect } from 'react';
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
  contains_pii?: boolean;
  pii_types?: string[];
  pii_labels?: string[];
  pii_message?: string;

  currency?: string;
  items: ReceiptItem[];
  /**
   * Storage path of the uploaded receipt image inside the `receipts` bucket.
   * Format: `{auth.uid()}/<uuid>.<ext>`. Use `createSignedUrl` to display.
   */
  receipt_image_path?: string;
}


export interface ScanUsage {
  count: number;
  limit: number;
  month?: string;
}

const MONTHLY_SCAN_LIMIT = 250;

export function useReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [usage, setUsage] = useState<ScanUsage | null>(null);
  const { toast } = useToast();

  const refreshUsage = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_scan_usage', {
        monthly_limit: MONTHLY_SCAN_LIMIT,
      } as any);
      if (error) return;
      if (data && typeof data === 'object') {
        const d = data as any;
        setUsage({ count: Number(d.count ?? 0), limit: Number(d.limit ?? MONTHLY_SCAN_LIMIT), month: d.month });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshUsage();
  }, [refreshUsage]);

  const scanReceipt = useCallback(async (imageBase64: string) => {
    setIsScanning(true);
    setReceiptData(null);

    try {
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64 }
      });

      if (error) {
        // Try to read structured body (e.g. 429 limit_reached)
        const ctx: any = (error as any).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            if (body?.limit_reached) {
              setUsage({ count: body.count, limit: body.limit, month: body.month });
              toast({
                title: 'Mjesečni limit AI skeniranja dosegnut',
                description: body.error,
                variant: 'destructive',
              });
              return null;
            }
            if (body?.error) {
              throw new Error(body.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message) throw parseErr;
          }
        }
        throw error;
      }

      if (!data.success) {
        if (data.limit_reached) {
          setUsage({ count: data.count, limit: data.limit, month: data.month });
          toast({
            title: 'Mjesečni limit AI skeniranja dosegnut',
            description: data.error,
            variant: 'destructive',
          });
          return null;
        }
        throw new Error(data.error || 'Greška pri skeniranju računa');
      }

      setReceiptData(data.data);
      // Osvježi brojač nakon uspješnog skeniranja
      void refreshUsage();
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
  }, [toast, refreshUsage]);

  const clearData = useCallback(() => {
    setReceiptData(null);
  }, []);

  return {
    isScanning,
    receiptData,
    scanReceipt,
    clearData,
    usage,
    refreshUsage,
    limitReached: usage ? usage.count >= usage.limit : false,
  };
}
