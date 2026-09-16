import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../common/Button';
import { isNativePlatform } from '../../services/native';

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isNativePlatform() || !deferredPrompt || isDismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-brand-600 to-teal-700 text-white p-3 px-4 rounded-xl shadow-card flex items-center justify-between gap-3 mb-4 animate-in fade-in">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate">Install FinTracker PWA</p>
          <p className="text-[11px] text-brand-100 truncate">Add to your home screen for quick offline access</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          className="h-7 text-xs bg-white hover:bg-brand-50 text-brand-900 font-semibold px-2.5"
          onClick={handleInstall}
        >
          Install
        </Button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/70 hover:text-white p-1"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
