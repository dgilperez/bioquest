# PWA Offline Testing Guide

This guide explains how to test the Progressive Web App (PWA) offline functionality in BioQuest.

## Prerequisites

PWA features only work in production builds, not in development mode. To test:

1. Build the production version:
   ```bash
   npm run build
   npm start
   ```

2. Access the app via HTTPS or localhost (required for service workers)

## Features to Test

### 1. Service Worker Installation

**How to test:**
1. Open DevTools → Application → Service Workers
2. Verify that a service worker is registered
3. Check that it's in "activated" state

**Expected behavior:**
- Service worker should be registered and active
- Cache storage should show multiple caches (fonts, images, APIs, etc.)

### 2. Install Prompt

**How to test:**
1. Visit the app in a browser that supports PWA installation (Chrome, Edge, Safari)
2. Wait 30 seconds
3. Look for the install prompt at the bottom right

**Expected behavior:**
- Prompt appears after 30 seconds
- Shows "Install BioQuest" message
- Has "Install App" and "Not Now" buttons
- If dismissed, won't show again for 7 days
- Won't show if already installed

**To reset prompt:**
```javascript
// In browser console
localStorage.removeItem('pwa-install-dismissed');
```

### 3. Offline Indicator

**How to test:**
1. Open DevTools → Network tab
2. Toggle "Offline" checkbox
3. Look for indicator at top center

**Expected behavior:**
- Orange indicator appears with "You're Offline" message
- Warning icon pulses
- When back online, green indicator shows "Back Online" for 3 seconds

### 4. Offline Fallback Page

**How to test:**
1. Go offline (DevTools → Network → Offline)
2. Try to navigate to a new page that hasn't been cached
3. Should show custom offline page

**Expected behavior:**
- Custom offline page with nature theme
- Lists what you can do offline
- "Try Again" button to reload

### 5. Background Sync Queue

**How to test:**
1. Sign in to the app
2. Go offline
3. Try to sync observations (will be queued)
4. Check the sync status indicator (bottom right)
5. Go back online
6. Queue should auto-process

**Expected behavior:**
- While offline: Actions are queued with notification
- Sync status shows "X Pending Actions"
- When online: Auto-processes queue
- Shows "Syncing..." indicator
- Shows "Sync Complete" with results

**To check queue manually:**
```javascript
// In browser console
localStorage.getItem('bioquest_offline_queue');
```

### 6. Cached API Responses

**How to test:**
1. Load several pages while online (dashboard, observations, badges, quests)
2. Go offline
3. Navigate between those pages

**Expected behavior:**
- All previously visited pages load from cache
- Data is shown from last cached version
- No "network error" messages for cached content

### 7. Manual Sync Trigger

**How to test:**
1. Queue some actions while offline
2. Go back online
3. Click "Sync Now" button on sync status notification

**Expected behavior:**
- Queue processes immediately
- Shows syncing indicator
- Shows success/failure counts

## Cache Strategies

The app uses different caching strategies for different content:

- **CacheFirst** (fonts, audio, video): Serve from cache, only fetch if not cached
- **StaleWhileRevalidate** (images, JS, CSS): Serve cached version while fetching fresh
- **NetworkFirst** (APIs, pages): Try network first (10s timeout), fallback to cache

## DevTools Inspection

### View Caches
1. DevTools → Application → Cache Storage
2. Should see multiple caches:
   - `google-fonts-webfonts`
   - `images`
   - `static-style-script`
   - `apis`
   - `others`

### View Service Worker
1. DevTools → Application → Service Workers
2. Can unregister/update service worker here
3. Can simulate update on reload

### Force Update
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});
```

## Common Issues

### Service Worker Not Registering
- Make sure you're running production build (`npm run build && npm start`)
- Check console for errors
- Verify you're on HTTPS or localhost

### Cache Not Working
- Check Network tab - status should show "(from ServiceWorker)"
- Verify cache exists in Application → Cache Storage
- May need to wait for first sync to populate cache

### Install Prompt Not Showing
- Must wait 30 seconds
- Check if already installed (standalone mode)
- Check if dismissed recently (within 7 days)
- Some browsers don't support beforeinstallprompt

### Queue Not Processing
- Check localStorage for queue items
- Verify you're actually online (navigator.onLine)
- Check console for processing errors
- API endpoints must be accessible

## Reset Everything

To completely reset PWA state:

```javascript
// In browser console

// Clear service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Clear caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Clear offline queue
localStorage.removeItem('bioquest_offline_queue');
localStorage.removeItem('pwa-install-dismissed');

// Reload
location.reload();
```

## Production Deployment

When deploying to production:

1. Ensure HTTPS is enabled (required for service workers)
2. Set proper `NEXT_PUBLIC_APP_URL` in environment variables
3. Verify manifest.json is accessible at `/manifest.json`
4. Test on multiple devices and browsers
5. Monitor service worker updates (users need to refresh to get updates)

## Browser Compatibility

- **Chrome/Edge**: Full support including install prompt
- **Safari (iOS/macOS)**: Support, but no beforeinstallprompt
- **Firefox**: Support, but limited install prompt
- **Samsung Internet**: Full support

## Performance Tips

- First visit requires network for initial cache population
- Subsequent visits are much faster (cached assets)
- API responses cached for 24 hours
- Images cached up to 60 days
- Fonts cached for 1 year
