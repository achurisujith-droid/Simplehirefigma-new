# Chrome Camera/Microphone Permission Fix

## 🚨 Issue: "Not Accessible" Without Permission Prompt

If you're seeing "Not accessible" without Chrome asking for permission, follow these steps:

---

## ✅ Solution 1: Check Browser Address Bar (FASTEST)

### Step 1: Look for the Camera Icon
**Location:** Top-left of address bar, next to the URL

```
┌────────────────────────────────────┐
│ 🔒 🎥 https://yoursite.com        │  ← Camera icon here
└────────────────────────────────────┘
```

### Step 2: Click the Camera Icon
- If you see a **camera icon with an X** or **red line**, it means permissions were blocked

### Step 3: Change Permission
1. Click the camera icon
2. You'll see dropdown: "Camera: Block" or "Microphone: Block"
3. Change both to **"Allow"**
4. Click **"Done"** or close the dropdown

### Step 4: Refresh or Retry
- Click the **"Retry Setup"** button on the SimplehireAI page
- OR refresh the page (F5)
- ✅ Permission prompt should appear, or camera/mic should work immediately

---

## ✅ Solution 2: Chrome Settings (If No Icon Appears)

### Method A: Site Settings (Quick)

1. **Click lock icon** 🔒 in address bar (left of URL)
2. Click **"Site settings"**
3. Find **"Camera"** → Change to **"Allow"**
4. Find **"Microphone"** → Change to **"Allow"**
5. Close settings
6. Refresh page or click **"Retry Setup"**

### Method B: Full Chrome Settings (Complete Reset)

1. **Open Chrome Settings:**
   - Click three dots (⋮) top-right
   - Select **"Settings"**
   - OR type: `chrome://settings/` in address bar

2. **Navigate to Privacy:**
   - Click **"Privacy and security"** (left sidebar)
   - Click **"Site Settings"**

3. **Allow Camera:**
   - Click **"Camera"**
   - Find your site in "Blocked" list (if present)
   - Click the trash/delete icon to remove block
   - OR ensure "Sites can ask to use your camera" is enabled

4. **Allow Microphone:**
   - Go back to Site Settings
   - Click **"Microphone"**
   - Find your site in "Blocked" list (if present)
   - Click the trash/delete icon to remove block
   - OR ensure "Sites can ask to use your microphone" is enabled

5. **Return to SimplehireAI:**
   - Go back to the interview page
   - Click **"Retry Setup"**
   - Chrome should now ask for permission

---

## ✅ Solution 3: Check System Permissions (Mac/Windows)

### macOS:

1. **Open System Settings:**
   - Click Apple menu → System Settings
   - Go to **"Privacy & Security"**

2. **Check Camera:**
   - Click **"Camera"**
   - Ensure **"Google Chrome"** is checked ✅

3. **Check Microphone:**
   - Go back to Privacy & Security
   - Click **"Microphone"**
   - Ensure **"Google Chrome"** is checked ✅

4. **Restart Chrome** and try again

### Windows:

1. **Open Settings:**
   - Press Windows key + I
   - Go to **"Privacy & security"**

2. **Check Camera:**
   - Click **"Camera"**
   - Turn on "Camera access"
   - Turn on "Let desktop apps access your camera"
   - Ensure Chrome is allowed

3. **Check Microphone:**
   - Go back to Privacy & security
   - Click **"Microphone"**
   - Turn on "Microphone access"
   - Turn on "Let desktop apps access your microphone"
   - Ensure Chrome is allowed

4. **Restart Chrome** and try again

---

## ✅ Solution 4: Reset All Permissions (Nuclear Option)

### Complete Permission Reset:

1. **Open Chrome Settings:**
   ```
   chrome://settings/content
   ```

2. **Clear Site Data:**
   - Go to: `chrome://settings/clearBrowserData`
   - Select **"Advanced"** tab
   - Time range: **"All time"**
   - Check **ONLY** "Site settings" (uncheck others if you want to keep history)
   - Click **"Clear data"**

3. **Return to SimplehireAI:**
   - Navigate back to the interview page
   - Chrome will ask for permissions again
   - Click **"Allow"**

---

## 🧪 Quick Test: Check If Camera/Mic Work

### Test in Chrome DevTools:

1. **Open DevTools:**
   - Press F12
   - OR Right-click → Inspect

2. **Go to Console tab**

3. **Paste this code:**
   ```javascript
   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
     .then(stream => {
       console.log('✅ SUCCESS! Camera and mic work!');
       stream.getTracks().forEach(track => track.stop());
     })
     .catch(err => {
       console.log('❌ ERROR:', err.name, err.message);
     });
   ```

4. **Press Enter**

5. **Results:**
   - ✅ "SUCCESS! Camera and mic work!" → Permissions are working
   - ❌ "NotAllowedError" → Permissions are blocked (use solutions above)
   - ❌ "NotFoundError" → No camera/mic connected
   - ❌ "NotReadableError" → Camera/mic in use by another app

---

## 🔍 Common Issues & Fixes

### Issue: "Camera icon doesn't appear in address bar"
**Solution:**
- Permissions were never requested
- Go to Chrome Settings → Site Settings → Camera/Microphone
- Manually add your site to "Allow" list

### Issue: "Permission prompt appears, but immediately closes"
**Solution:**
- Browser extension blocking it
- Disable extensions temporarily:
  - `chrome://extensions/`
  - Turn off all extensions
  - Retry
  - Re-enable extensions one by one to find culprit

### Issue: "I clicked Allow, but still says Not Accessible"
**Solution:**
- Hard refresh the page: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear cache for this site:
  - DevTools (F12) → Network tab
  - Check "Disable cache"
  - Refresh page

### Issue: "Camera works in other apps, but not Chrome"
**Solution:**
1. Close other apps using camera (Zoom, Teams, Skype)
2. Check Chrome has system permission (see Solution 3)
3. Restart Chrome completely
4. Try incognito mode: Ctrl+Shift+N

### Issue: "Incognito mode asks for permission, normal mode doesn't"
**Solution:**
- Normal mode has cached "Block" decision
- Clear site settings (Solution 4)
- OR use incognito for now

---

## 📱 Visual Guide: Where to Find Things

### Chrome Address Bar:
```
┌─────────────────────────────────────────────────┐
│ [🔒] [🎥] https://simplehire.ai/interview       │
│   ↑    ↑                                        │
│ Lock  Camera Icon (click this!)                │
└─────────────────────────────────────────────────┘
```

### Permission Dropdown (after clicking camera icon):
```
┌────────────────────────────┐
│ 🎥 Camera                  │
│    [Allow ▼]              │
│                           │
│ 🎤 Microphone             │
│    [Allow ▼]              │
│                           │
│ [Done]                    │
└────────────────────────────┘
```

### Chrome Settings Path:
```
Settings
  └─ Privacy and security
      └─ Site Settings
          ├─ Camera
          │   └─ Sites can ask to use your camera: ON
          │       └─ Allow list
          │           └─ https://simplehire.ai
          │
          └─ Microphone
              └─ Sites can ask to use your microphone: ON
                  └─ Allow list
                      └─ https://simplehire.ai
```

---

## 🎯 Step-by-Step for First-Time Users

### If This Is Your First Time:

1. **Navigate to interview setup page**
   - Login to SimplehireAI
   - Start skill verification
   - You'll see "Camera & Microphone Setup"

2. **Wait for prompt**
   - Page loads and says "Requesting camera & microphone access..."
   - A popup SHOULD appear asking: "Allow SimplehireAI to use your camera and microphone?"

3. **If popup appears:**
   - ✅ Click **"Allow"**
   - Camera preview should show immediately
   - Microphone bar should start detecting audio

4. **If NO popup appears:**
   - ❌ Permissions were previously blocked
   - Follow **Solution 1** above (check camera icon in address bar)

---

## 🆘 Still Not Working?

### Try These:

1. **Use a different browser:**
   - Firefox: `https://yoursite.com` in Firefox
   - Edge: `https://yoursite.com` in Edge
   - All modern browsers support camera/mic

2. **Update Chrome:**
   - Go to: `chrome://settings/help`
   - Chrome will auto-update
   - Restart browser

3. **Check if camera is working at all:**
   - Go to: `https://webcamtests.com/`
   - If camera doesn't work there either → hardware issue
   - If it works there but not SimplehireAI → permissions issue

4. **Restart everything:**
   - Close ALL Chrome windows
   - Restart Chrome
   - Restart computer (if needed)
   - Try again

---

## ✅ Success Checklist

You'll know it's working when you see:

- [x] Camera icon in address bar shows camera with checkmark
- [x] Video preview shows your face
- [x] Green "Camera Active" badge appears
- [x] Microphone bar moves when you speak
- [x] System Check shows green checkmarks
- [x] "Start Interview" button is enabled (blue)

---

## 📞 Quick Reference Commands

### Chrome URLs (paste in address bar):

- **All permissions:** `chrome://settings/content`
- **Camera settings:** `chrome://settings/content/camera`
- **Microphone settings:** `chrome://settings/content/microphone`
- **Site-specific:** `chrome://settings/content/siteDetails?site=https://yoursite.com`
- **Check updates:** `chrome://settings/help`

---

## 💡 Pro Tips

1. **Bookmark this page** for easy reference
2. **Test before interview** - Don't wait until interview time
3. **Use wired headphones** - Reduces echo and improves audio
4. **Close other apps** - Zoom, Teams, etc. can block camera
5. **Good lighting** - Face a window or lamp
6. **Stable internet** - WiFi or ethernet, not mobile hotspot

---

## 🎉 Summary

**Most Common Fix (90% of cases):**
1. Click camera icon 🎥 in address bar
2. Change "Block" to "Allow"
3. Click "Retry Setup"
4. Done!

**If that doesn't work:**
- Try Solution 2 (Chrome Settings)
- Then Solution 3 (System Permissions)
- Finally Solution 4 (Reset All)

**SimplehireAI now has:**
- ✅ Clear error messages
- ✅ Step-by-step instructions in the UI
- ✅ Retry button
- ✅ Troubleshooting help panel

**You should be able to fix it yourself in under 2 minutes!**

---

*Last updated: December 26, 2024*
*Chrome Version: 120+ (all recent versions)*
*Works on: Windows, macOS, Linux*
