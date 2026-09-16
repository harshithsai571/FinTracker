import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePwaUpdate() {
  const [checking, setChecking] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Periodic check for updates every hour
        setInterval(() => {
          registration.update().catch(err => console.debug('Periodic SW update check failed', err));
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.debug('SW registration error', error);
    },
  });

  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    } catch (err) {
      console.debug('Manual update check error:', err);
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  const applyUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  return {
    needRefresh,
    offlineReady,
    checking,
    dismissUpdate,
    applyUpdate,
    checkForUpdates,
  };
}
