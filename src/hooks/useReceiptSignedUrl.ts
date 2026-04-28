import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple in-memory cache so we don't re-sign the same path repeatedly
// across renders / list items. Key: storage path. Value: { url, expiresAt }
const urlCache = new Map<string, { url: string; expiresAt: number }>();

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 sat
// Refresh slightly before actual expiry
const REFRESH_BUFFER_MS = 60 * 1000;

/**
 * Detect whether the stored value is a real storage path inside the
 * `receipts` bucket (e.g. `{uid}/abc.jpg`) vs. a legacy/full URL or a
 * `data:` preview. Only paths get signed.
 */
function isStoragePath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (value.startsWith('http://') || value.startsWith('https://')) return false;
  if (value.startsWith('data:')) return false;
  if (value.startsWith('blob:')) return false;
  return value.includes('/');
}

/**
 * Resolves the value stored in `expenses.receipt_image_url` to something
 * that can be rendered in an <img>. For storage paths, generates a signed
 * URL from the private `receipts` bucket. For legacy http(s) / data URLs,
 * returns the value as-is.
 */
export function useReceiptSignedUrl(receiptImageUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!receiptImageUrl) return null;
    if (!isStoragePath(receiptImageUrl)) return receiptImageUrl;
    const cached = urlCache.get(receiptImageUrl);
    if (cached && cached.expiresAt - REFRESH_BUFFER_MS > Date.now()) {
      return cached.url;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!receiptImageUrl) {
      setUrl(null);
      setError(null);
      return;
    }

    if (!isStoragePath(receiptImageUrl)) {
      setUrl(receiptImageUrl);
      setError(null);
      return;
    }

    const cached = urlCache.get(receiptImageUrl);
    if (cached && cached.expiresAt - REFRESH_BUFFER_MS > Date.now()) {
      setUrl(cached.url);
      return;
    }

    setIsLoading(true);
    setError(null);

    (async () => {
      const { data, error: signError } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receiptImageUrl, SIGNED_URL_TTL_SECONDS);

      if (cancelled) return;

      if (signError || !data?.signedUrl) {
        setError(signError?.message || 'Nije moguće dohvatiti sliku računa.');
        setUrl(null);
      } else {
        urlCache.set(receiptImageUrl, {
          url: data.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
        });
        setUrl(data.signedUrl);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [receiptImageUrl]);

  return { url, isLoading, error };
}
