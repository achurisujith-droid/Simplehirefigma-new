# Camera & Upload Troubleshooting Guide

## ✅ **FIXES IMPLEMENTED**

### 1. **ID Upload Issue - FIXED**
**Problem:** Upload wasn't working when selecting "Passport" (which only requires front side)
**Solution:** 
- Fixed the `handleContinue()` logic to properly handle passport uploads (front only)
- Now correctly saves and proceeds whether you upload 1 file (passport) or 2 files (ID/license)

### 2. **Camera Access Issues - FIXED**
**Problem:** Camera wasn't accessible in selfie step
**Solution:**
- Added comprehensive browser compatibility checks
- Implemented detailed error handling with specific messages
- Added fallback for different camera constraints
- Better permission request handling

---

## 🎥 **Camera Permissions - How to Fix**

### **Chrome / Edge:**
1. Click the **camera icon** in the address bar (right side)
2. Select **"Always allow simplehire.ai to access your camera"**
3. Click **"Done"**
4. **Refresh the page** (F5 or Cmd+R)

### **Firefox:**
1. Click the **camera icon** in the address bar (left side)
2. Select **"Allow"** for camera access
3. Check **"Remember this decision"**
4. **Refresh the page**

### **Safari:**
1. Go to **Safari → Settings → Websites → Camera**
2. Find your site in the list
3. Change permission to **"Allow"**
4. **Refresh the page**

### **If icon doesn't appear:**
1. **Clear browser cache:**
   - Chrome: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cached images and files"
   - Clear data
   
2. **Check camera in system settings:**
   - **Windows:** Settings → Privacy → Camera → Allow apps to access camera
   - **Mac:** System Settings → Privacy & Security → Camera → Check browser

3. **Try incognito/private mode:**
   - This tests if extensions are blocking access

---

## 📤 **Upload Issues - How to Fix**

### **File Upload Not Working:**

**Supported formats:**
- ✅ JPG / JPEG
- ✅ PNG
- ✅ HEIC (Apple photos)
- ✅ PDF
- ⚠️ Max file size: 10MB

**If drag & drop isn't working:**
1. Click the upload area directly
2. Use the file picker dialog
3. Try a different browser

**If files won't upload:**
1. Check file size (should be under 10MB)
2. Check file format (must be JPG, PNG, HEIC, or PDF)
3. Try converting the image to JPG
4. Clear browser cache and try again

---

## 🔍 **Step-by-Step Upload Process**

### **Step 1: Upload ID Document**
1. Select document type: **Passport**, **State ID**, or **Driver's License**
2. Upload **front side** (always required)
3. Upload **back side** (required for State ID and Driver's License, NOT for Passport)
4. Click **"Continue to work authorization"**

✅ **Now fixed:** Passport uploads work correctly (front side only)

### **Step 2: Upload Visa/EAD**
1. Follow the visa upload wizard
2. Upload required work authorization documents

### **Step 3: Selfie Capture**
1. Click **"Enable camera"**
2. **Allow camera access** when browser prompts
3. Position your face in the oval guide
4. Click **"Capture selfie"**
5. Review and click **"Continue to review"**

✅ **Now fixed:** Better error messages if camera fails

---

## ⚠️ **Common Error Messages & Solutions**

### **"Camera access was denied"**
→ You clicked "Block" when browser asked for permission
→ **Fix:** Follow camera permissions guide above

### **"No camera found"**
→ Your device doesn't have a camera or it's not detected
→ **Fix:** 
   - Check if camera is connected (external webcam)
   - Try different USB port
   - Restart browser

### **"Camera is already in use"**
→ Another app (Zoom, Skype, etc.) is using your camera
→ **Fix:** Close other apps and try again

### **"Camera doesn't meet requirements"**
→ Camera resolution is too low
→ **Fix:** App will automatically try with lower settings

### **"Camera access blocked due to security settings"**
→ You're on HTTP instead of HTTPS
→ **Fix:** Make sure URL starts with `https://` or use `localhost`

### **"Front side is required"**
→ You didn't upload the front of your ID
→ **Fix:** Click the front upload area and select a file

### **"Back side is required for this document type"**
→ You selected State ID or Driver's License but didn't upload back
→ **Fix:** Upload the back side, OR select "Passport" if that's what you have

### **"Please upload a valid image file"**
→ File format is not supported
→ **Fix:** Convert to JPG, PNG, or PDF

### **"File size must be less than 10MB"**
→ Your image is too large
→ **Fix:** 
   - Take a new photo with lower resolution
   - Compress the image online (tinypng.com)
   - Use a photo editing app to reduce quality/size

---

## 🧪 **Test Your Setup**

### **Camera Test:**
1. Go to: https://webcamtests.com/
2. Click "Test my cam"
3. If it works there, it should work in Simplehire

### **Browser Compatibility:**
| Browser | Upload | Camera | Status |
|---------|--------|--------|--------|
| Chrome 90+ | ✅ | ✅ | Fully supported |
| Firefox 88+ | ✅ | ✅ | Fully supported |
| Safari 14+ | ✅ | ✅ | Fully supported |
| Edge 90+ | ✅ | ✅ | Fully supported |
| Opera | ✅ | ✅ | Supported |
| IE 11 | ❌ | ❌ | Not supported |

---

## 🆘 **Still Having Issues?**

### **Try these steps in order:**

1. **Refresh the page** (F5 or Cmd+R)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Try incognito/private mode**
4. **Try a different browser** (Chrome recommended)
5. **Restart your computer**
6. **Check if you're on HTTPS** (not HTTP)
7. **Disable browser extensions** (adblockers can interfere)
8. **Update your browser** to the latest version

### **Developer Console Check:**
1. Press **F12** to open developer tools
2. Go to **Console** tab
3. Look for red error messages
4. Screenshot and report to support

---

## 🎯 **What Changed (Technical)**

### **Upload ID Step Fix:**
```javascript
// OLD (broken for passport):
if (frontFile && backFile) { ... }

// NEW (works for all types):
if (frontFile) {
  // Handle front
  if (backFile) {
    // Handle back if exists
  } else {
    // Continue without back (passport)
  }
}
```

### **Camera Error Handling:**
- Added browser compatibility check
- Specific error messages for each failure type
- Fallback to simpler constraints if high-res fails
- Better cleanup on component unmount

---

## 📱 **Mobile Users:**

### **iOS (iPhone/iPad):**
- Use **Safari** (best compatibility)
- Go to Settings → Safari → Camera → Allow
- Upload photos from Photos app works great

### **Android:**
- Use **Chrome** (best compatibility)
- Allow camera permissions when prompted
- Some phones may need to allow storage access too

---

**Everything should work now!** 🚀 The upload bug is fixed and camera has much better error handling.
