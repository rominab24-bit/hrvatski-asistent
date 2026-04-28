import { useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useReceiptSignedUrl } from '@/hooks/useReceiptSignedUrl';

interface ReceiptThumbnailProps {
  receiptImageUrl: string | null | undefined;
}

export function ReceiptThumbnail({ receiptImageUrl }: ReceiptThumbnailProps) {
  const { url, isLoading, error } = useReceiptSignedUrl(receiptImageUrl);
  const [open, setOpen] = useState(false);

  if (!receiptImageUrl) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (url) setOpen(true);
        }}
        disabled={!url}
        className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/50 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Prikaži sliku računa"
        aria-label="Prikaži sliku računa"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : url ? (
          <img
            src={url}
            alt="Račun"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background">
          <DialogTitle className="sr-only">Slika računa</DialogTitle>
          <div className="relative w-full max-h-[85vh] overflow-auto bg-black/40 flex items-center justify-center">
            {url ? (
              <img
                src={url}
                alt="Slika računa u punoj veličini"
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <div className="p-12 text-muted-foreground text-sm">
                {error || 'Slika nije dostupna.'}
              </div>
            )}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
              aria-label="Zatvori"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
