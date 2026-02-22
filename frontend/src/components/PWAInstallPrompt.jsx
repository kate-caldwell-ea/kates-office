import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { 
  Download, 
  X, 
  Sparkles, 
  Bell, 
  Wifi, 
  Smartphone,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

/**
 * PWA Install Prompt Component
 * Shows when app is installable but not yet installed
 */
export function PWAInstallPrompt() {
  const { 
    isInstallable, 
    isInstalled, 
    promptInstall, 
    updateAvailable, 
    applyUpdate 
  } = usePWA();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Show prompt after delay (don't interrupt immediately)
  useEffect(() => {
    if (isInstallable && !isInstalled && !dismissed) {
      // Check if user has dismissed before
      const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (lastDismissed) {
        const daysSinceDismiss = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
          return; // Don't show for 7 days after dismissal
        }
      }
      
      // Show after 30 seconds of engagement
      const timer = setTimeout(() => setShowPrompt(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissed]);

  const handleInstall = async () => {
    setInstalling(true);
    const result = await promptInstall();
    setInstalling(false);
    
    if (result.outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Update banner
  if (updateAvailable) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideUp">
        <div className="bg-sage-600 text-white rounded-2xl shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sage-500 rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Update Available</h3>
              <p className="text-sm text-sage-100 mt-1">
                A new version is ready. Refresh to update.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={applyUpdate}
              className="flex-1 px-4 py-2 bg-white text-sage-700 rounded-xl font-medium hover:bg-sage-50 transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Install prompt
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideUp">
      <div className="bg-white rounded-2xl shadow-xl border border-cream-200 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-sage-500 to-sage-600 text-white p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Install Kate's Office</h3>
              <p className="text-sage-100 text-sm">Add to your home screen</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-4 space-y-3">
          <Feature 
            icon={Smartphone} 
            title="Native app feel"
            description="Opens in full screen mode"
          />
          <Feature 
            icon={Wifi} 
            title="Works offline"
            description="Access your data anytime"
          />
          <Feature 
            icon={Bell} 
            title="Push notifications"
            description="Stay updated on tasks"
          />
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-sage-500 text-white rounded-xl font-medium hover:bg-sage-600 transition-colors disabled:opacity-50"
          >
            {installing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Install App
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 text-warm-500 hover:bg-cream-100 rounded-xl font-medium transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-sage-50 rounded-lg">
        <Icon className="w-4 h-4 text-sage-600" />
      </div>
      <div>
        <p className="font-medium text-warm-800 text-sm">{title}</p>
        <p className="text-warm-500 text-xs">{description}</p>
      </div>
    </div>
  );
}

/**
 * Installed success message (shown after installation)
 */
export function PWAInstalledBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const installed = localStorage.getItem('pwa-installed');
    const welcomed = localStorage.getItem('pwa-welcomed');
    
    if (installed && !welcomed) {
      setShow(true);
      localStorage.setItem('pwa-welcomed', 'true');
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slideDown">
      <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 flex items-center gap-3">
        <div className="p-2 bg-sage-500 rounded-full">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sage-800">App installed!</p>
          <p className="text-sm text-sage-600">Kate's Office is now on your home screen</p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="p-1 hover:bg-sage-200 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-sage-500" />
        </button>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
