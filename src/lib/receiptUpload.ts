import { supabase } from '@/integrations/supabase/client';

/**
 * Allowed MIME types for receipt images.
 * Keep this in sync with the `accept` attribute on file inputs.
 */
export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/** Maximum allowed file size in bytes (10 MB). */
export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024;

export interface ReceiptValidationResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate a user-selected file before doing anything with it
 * (preview, base64 conversion, upload, etc.).
 */
export function validateReceiptFile(file: File): ReceiptValidationResult {
  if (!file) {
    return { ok: false, error: 'Datoteka nije odabrana.' };
  }

  const type = (file.type || '').toLowerCase();
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(type as typeof ALLOWED_RECEIPT_MIME_TYPES[number])) {
    return {
      ok: false,
      error: 'Nepodržan format. Dozvoljeni formati: JPG, PNG, WEBP, HEIC.',
    };
  }

  if (file.size <= 0) {
    return { ok: false, error: 'Datoteka je prazna.' };
  }

  if (file.size > MAX_RECEIPT_FILE_SIZE) {
    const mb = (MAX_RECEIPT_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      error: `Datoteka je prevelika. Maksimalno ${mb} MB.`,
    };
  }

  return { ok: true };
}

/**
 * Validate base64-encoded image data captured from Capacitor Camera.
 * `base64` is the raw base64 payload (without the `data:image/...;base64,` prefix).
 */
export function validateReceiptBase64(base64: string, mimeType: string): ReceiptValidationResult {
  if (!base64) {
    return { ok: false, error: 'Slika nije dostupna.' };
  }

  const type = (mimeType || '').toLowerCase();
  const fullType = type.startsWith('image/') ? type : `image/${type}`;
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(fullType as typeof ALLOWED_RECEIPT_MIME_TYPES[number])) {
    return {
      ok: false,
      error: 'Nepodržan format slike. Dozvoljeni formati: JPG, PNG, WEBP, HEIC.',
    };
  }

  // Approximate decoded size: base64 string length * 3/4
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_RECEIPT_FILE_SIZE) {
    const mb = (MAX_RECEIPT_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      error: `Slika je prevelika. Maksimalno ${mb} MB.`,
    };
  }

  return { ok: true };
}

/**
 * Build a storage path for the current user's receipt that always lives
 * under the `{auth.uid()}/` folder, matching the storage RLS policies.
 *
 * Throws if there is no authenticated user.
 */
export async function buildReceiptPath(extension = 'jpg'): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Korisnik nije prijavljen.');
  }
  const safeExt = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  const filename = `${crypto.randomUUID()}.${safeExt}`;
  return `${data.user.id}/${filename}`;
}

export interface ReceiptUploadResult {
  path: string;
}

/**
 * Upload a receipt file to the `receipts` bucket under `{auth.uid()}/<uuid>.<ext>`.
 * The bucket is private — use `createSignedUrl` to display the file later.
 */
export async function uploadReceiptFile(file: File): Promise<ReceiptUploadResult> {
  const validation = validateReceiptFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = await buildReceiptPath(ext);

  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Greška pri prijenosu računa: ${error.message}`);
  }

  return { path };
}

/**
 * Convert a `data:image/...;base64,xxx` URL into a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:([^;]+);base64/);
  const mime = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Upload a receipt that we currently hold as a `data:` URL (e.g. from a
 * Capacitor Camera capture or a FileReader preview).
 *
 * The bucket is private — the returned `path` should be stored in
 * `expenses.receipt_image_url` and resolved with `createSignedUrl` when
 * displaying the image.
 */
export async function uploadReceiptFromDataUrl(dataUrl: string): Promise<ReceiptUploadResult> {
  if (!dataUrl?.startsWith('data:')) {
    throw new Error('Neispravan format slike.');
  }

  const blob = dataUrlToBlob(dataUrl);

  // Reuse the same validation we apply to file inputs
  const validation = validateReceiptFile(
    new File([blob], 'receipt', { type: blob.type })
  );
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const ext = (blob.type.split('/')[1] || 'jpg').toLowerCase();
  const path = await buildReceiptPath(ext);

  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Greška pri prijenosu računa: ${error.message}`);
  }

  return { path };
}
