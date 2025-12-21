import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  pendingCount: number;
  isSyncing: boolean;
}

export function OfflineIndicator({ pendingCount, isSyncing }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Offline način - podaci se spremaju lokalno</span>
        </div>
      )}
      
      {isOnline && isSyncing && (
        <div className="bg-primary/90 text-primary-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Sinkronizacija u tijeku...</span>
        </div>
      )}
      
      {isOnline && pendingCount > 0 && !isSyncing && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <CloudOff className="w-4 h-4" />
          <span>{pendingCount} trošak(a) čeka sinkronizaciju</span>
        </div>
      )}
    </div>
  );
}
