import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { isNativePlatform, setNativeStatusBarTheme } from '../services/native';
import { useTheme } from '../context/ThemeContext';

interface UseNativeAppOptions {
  onBackWhenModalOpen?: () => boolean; // return true if modal was closed
}

export function useNativeApp(options?: UseNativeAppOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  // 1. Sync Native Status Bar with Theme
  useEffect(() => {
    if (isNativePlatform()) {
      setNativeStatusBarTheme(isDark);
    }
  }, [isDark]);

  // 2. Android Hardware Back Button Handling
  useEffect(() => {
    if (!isNativePlatform()) return;

    const backListenerPromise = App.addListener('backButton', ({ canGoBack }) => {
      // If a modal or sheet is open, give it precedence to close first
      if (options?.onBackWhenModalOpen && options.onBackWhenModalOpen()) {
        return;
      }

      // If user is not on the home/dashboard root route, navigate back
      if (location.pathname !== '/' && location.pathname !== '') {
        if (canGoBack) {
          navigate(-1);
        } else {
          navigate('/');
        }
      } else {
        // User is on root route with no open modals -> minimize / exit application
        App.exitApp();
      }
    });

    return () => {
      backListenerPromise.then(handle => handle.remove());
    };
  }, [location.pathname, navigate, options]);
}
