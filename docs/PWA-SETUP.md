# PWA Setup Guide for Kate's Office

## Overview

Kate's Office is a Progressive Web App (PWA) that can be installed on mobile devices and desktops, providing a native app-like experience with offline support and push notifications.

## Features

### ✅ Implemented

1. **PWA Manifest** (`/public/manifest.json`)
   - App name, icons, theme colors
   - Standalone display mode
   - App shortcuts for quick access

2. **Service Worker** (`/public/sw.js`)
   - Static asset caching for offline use
   - Network-first strategy for API calls
   - Background sync support
   - Push notification handling

3. **Install Prompt** (`PWAInstallPrompt.jsx`)
   - Detects when app is installable
   - Shows "Add to Home Screen" prompt
   - Tracks installation

4. **Mobile Optimization**
   - Bottom navigation on mobile
   - Touch-friendly targets (48px minimum)
   - Safe area insets for notched phones
   - Responsive design

### 🔧 Configuration Needed

## Push Notifications Setup

Push notifications require backend configuration. Here's what you need:

### 1. Generate VAPID Keys

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

This outputs:
- Public Key: Share with frontend
- Private Key: Keep secret on backend

### 2. Backend Endpoints

Create these API endpoints:

```javascript
// POST /api/push/subscribe
// Receives push subscription from client
// Store subscription in database

// POST /api/push/send
// Sends push notification to subscribers
// Uses web-push library

// Example implementation (Node.js/Express):
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:kate@gosolvr.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Store subscriptions in database
app.post('/api/push/subscribe', async (req, res) => {
  const subscription = req.body;
  await db.pushSubscriptions.create({ subscription });
  res.status(201).json({ message: 'Subscribed' });
});

// Send notification
app.post('/api/push/send', async (req, res) => {
  const { title, body, url } = req.body;
  const subscriptions = await db.pushSubscriptions.findAll();
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192x192.png',
    data: { url }
  });
  
  await Promise.all(
    subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription, payload)
    )
  );
  
  res.json({ sent: subscriptions.length });
});
```

### 3. Frontend Configuration

Add VAPID public key to the app:

```javascript
// In frontend/src/config.js
export const VAPID_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE';

// Or via environment variable
window.VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
```

### 4. Test Push Notifications

```javascript
// In browser console (after granting notification permission)
const registration = await navigator.serviceWorker.ready;
await registration.showNotification('Test', {
  body: 'This is a test notification',
  icon: '/icons/icon-192x192.png'
});
```

## Icon Generation

Icons are generated as SVGs. For production, convert to PNG:

```bash
# Using sharp-cli
npm install -g sharp-cli
cd frontend/public/icons
for f in *.svg; do
  sharp --input "$f" --output "${f%.svg}.png"
done

# Or use online tool: https://svgtopng.com/
```

## Updating the App

The service worker handles updates automatically:
1. New version detected on page load
2. User sees "Update Available" banner
3. Clicking "Refresh" activates new version

To force a cache bust, increment `CACHE_VERSION` in `sw.js`:
```javascript
const CACHE_VERSION = 'v2'; // was 'v1'
```

## Testing PWA Features

### Chrome DevTools
1. Open DevTools → Application tab
2. Check "Service Workers" panel
3. Check "Manifest" panel
4. Use "Lighthouse" for PWA audit

### Test Install Prompt
1. Open in Chrome (not incognito)
2. The install prompt appears after 30 seconds
3. Or manually trigger via DevTools → Application → Manifest → "Install"

### Test Offline Mode
1. DevTools → Network → Offline
2. Refresh page - should load from cache
3. Static content works; API calls show cached data

## Mobile-Specific Features

### Bottom Navigation
- Visible on screens < 768px
- Touch-friendly targets (48px)
- "More" menu for secondary nav items

### Safe Areas
- Handles iPhone notch and home indicator
- Uses `env(safe-area-inset-*)` CSS

### Touch Gestures
- Pull-to-refresh available via `<PullToRefresh>` wrapper
- Swipe gestures hook for Kanban columns

## Troubleshooting

### "Install" button not showing?
- Must be HTTPS (or localhost)
- Manifest must be valid
- Service worker must be registered
- User must have visited twice with 5+ min gap (Chrome)

### Service worker not updating?
- Check "Update on reload" in DevTools
- Increment CACHE_VERSION
- Clear site data and reload

### Notifications not working?
- Check permission: `Notification.permission`
- Verify VAPID keys are configured
- Check service worker is active
- Test with DevTools → Application → Service Workers → Push

## Files Reference

```
frontend/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── icons/             # App icons (SVG)
├── src/
│   ├── hooks/
│   │   ├── usePWA.js      # PWA state hook
│   │   └── useSwipeGesture.js
│   └── components/
│       ├── PWAInstallPrompt.jsx
│       ├── MobileNav.jsx
│       └── PullToRefresh.jsx
└── scripts/
    └── generate-icons.js  # Icon generator
```
