import { useState, useEffect, useCallback } from 'react';

/**
 * PWA Hook - Handles install prompt, service worker, and notifications
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Check if already installed
  useEffect(() => {
    // Check display-mode media query
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = window.navigator.standalone === true;
    setIsInstalled(isStandalone || isIOSInstalled);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      // Prevent Chrome 67+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event for later use
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      // Track installation
      trackInstall();
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      setRegistration(reg);
      console.log('[PWA] Service worker registered');

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Update available');
            setUpdateAvailable(true);
          }
        });
      });

      // Listen for controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] New service worker activated');
      });

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  };

  // Trigger install prompt
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      console.log('[PWA] No install prompt available');
      return { outcome: 'unavailable' };
    }

    // Show the prompt
    installPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await installPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    
    // Clear the prompt
    setInstallPrompt(null);
    setIsInstallable(false);

    return { outcome };
  }, [installPrompt]);

  // Apply update
  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  }, [registration]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log('[PWA] Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('[PWA] Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!registration) {
      console.log('[PWA] No service worker registration');
      return null;
    }

    try {
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('[PWA] Already subscribed to push');
        return subscription;
      }

      // Subscribe with public VAPID key
      // Note: You'll need to generate VAPID keys and configure the backend
      const vapidPublicKey = window.VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.log('[PWA] VAPID public key not configured');
        return null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('[PWA] Subscribed to push:', subscription);
      
      // Send subscription to backend
      await sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[PWA] Failed to subscribe to push:', error);
      return null;
    }
  }, [registration]);

  // Track installation for analytics
  const trackInstall = () => {
    // Could send to analytics service
    console.log('[PWA] Installation tracked');
    
    // Store installation date
    localStorage.setItem('pwa-installed', new Date().toISOString());
  };

  // Check if PWA is supported
  const isPWASupported = 'serviceWorker' in navigator;
  const isPushSupported = 'PushManager' in window;

  return {
    // Install state
    isInstalled,
    isInstallable,
    promptInstall,
    
    // Update state
    updateAvailable,
    applyUpdate,
    
    // Notifications
    notificationPermission,
    requestNotificationPermission,
    subscribeToPush,
    
    // Feature detection
    isPWASupported,
    isPushSupported,
    
    // Service worker
    registration
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Send subscription to backend
async function sendSubscriptionToServer(subscription) {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('[PWA] Subscription sent to server');
  } catch (error) {
    console.error('[PWA] Failed to send subscription to server:', error);
  }
}

export default usePWA;
