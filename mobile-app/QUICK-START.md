# Quick Start Guide - Auto IP Configuration

## Problem Solved
Your phone was connecting to the old IP address (.23) instead of the current network IP. This has been fixed with an auto-detection system.

## New Features

### 1. **Auto IP Detection Script** (`setup-ip.ps1`)
Automatically detects your current network IP and updates the configuration.

**Usage:**
```powershell
cd mobile-app
npm run setup-ip
```

**What it does:**
- Detects all available network IPs
- Allows you to choose the correct one (Wi-Fi)
- Automatically updates `src/config/index.js`
- Checks if backend server is running
- Sets Metro bundler environment variable

### 2. **Complete Dev Startup Script** (`start-dev.ps1`)
One command to start everything!

**Usage:**
```powershell
cd mobile-app
npm run start-dev
```

**What it does:**
1. Auto-detects and configures IP
2. Checks/starts backend server
3. Sets up ADB port forwarding
4. Optionally cleans Metro cache
5. Builds and runs the app

## Manual Steps (if needed)

### When Your Network IP Changes:

**Option 1 - Use Auto Script (Recommended):**
```powershell
cd mobile-app
npm run setup-ip
npm run android
```

**Option 2 - Manual:**
1. Run `ipconfig` to find your IP
2. Edit `mobile-app/src/config/index.js`
3. Change `const SERVER_IP = 'YOUR_IP_HERE'`
4. Run:
```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "YOUR_IP_HERE"
npm run android
```

## Daily Development Workflow

### First Time / After Network Change:
```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Mobile App
cd mobile-app
npm run start-dev
```

### Regular Development (IP hasn't changed):
```powershell
# Terminal 1 - Backend (if not running)
cd backend
npm start

# Terminal 2 - Mobile App
cd mobile-app
npm run android
```

## Troubleshooting

### App shows "Unable to load script"
1. Run `npm run setup-ip` to update IP
2. Make sure Metro bundler is running
3. Check device is connected: `adb devices`
4. Restart app: `adb shell am force-stop com.pedicabcomplaintmobile; adb shell am start -n com.pedicabcomplaintmobile/.MainActivity`

### "No backend connection"
1. Start backend: `cd backend; npm start`
2. Check backend health: Open `http://YOUR_IP:5000/api/health` in browser
3. Verify IP is correct in config file

### Multiple IPs detected
- Choose Wi-Fi (usually 192.168.x.x)
- Avoid ZeroTier or VPN IPs
- Avoid 10.x.x.x unless that's your actual network

## Configuration Files

| File | Purpose |
|------|---------|
| `mobile-app/src/config/index.js` | **Single source of truth** for all IP configuration |
| `mobile-app/setup-ip.ps1` | Auto-detection script |
| `mobile-app/start-dev.ps1` | Complete startup automation |

## NPM Scripts Added

```json
{
  "setup-ip": "Auto-detect and configure IP",
  "start-dev": "Complete dev environment startup",
  "start-metro": "Start Metro bundler only"
}
```

## Error Recovery System

The app now includes:
- **ErrorBoundary**: Catches all JavaScript errors
- **NetworkManager**: Monitors connection status
- **Auto-retry**: Automatically retries failed requests
- **Offline queue**: Queues operations when offline

These work automatically - no configuration needed!

## Current Setup

✅ All IP references centralized in `src/config/index.js`  
✅ Auto IP detection working  
✅ Error boundary active  
✅ Network monitoring active  
✅ Offline support active  
✅ App rebuilt and deployed

**Current IP:** 192.168.254.101  
**Backend:** http://192.168.254.101:5000  
**Metro:** http://192.168.254.101:8081
