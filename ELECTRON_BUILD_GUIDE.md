# 🖥️ Malwa CRM - Desktop Application Build Guide

Complete instructions to build Windows .exe installer for Malwa CRM

---

## 📋 Prerequisites

Before building the desktop app, ensure you have:

- ✅ **Node.js** installed (v18 or higher)
- ✅ **npm** installed (comes with Node.js)
- ✅ **Windows OS** (for building Windows .exe)
- ✅ **Git Bash or PowerShell**

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install all dependencies
npm install

# 2. Build the Windows .exe
npm run electron:build:win

# 3. Find your installer in the release folder
```

**That's it!** Your installer will be in the `release` folder.

---

## 📦 Step-by-Step Instructions

### **Step 1: Navigate to Project Folder**

```bash
# Open PowerShell or Git Bash
cd "C:\Users\YOUR_USERNAME\Desktop\Final-Crm-main"

# Verify you're in the right place
dir package.json
```

You should see `package.json` file listed.

---

### **Step 2: Install Dependencies**

```bash
npm install
```

This will install:
- React and Vite (web framework)
- Electron (desktop wrapper)
- electron-builder (packaging tool)
- All other dependencies (~400 packages)

**Time:** 2-5 minutes depending on internet speed

**Output:** You'll see a `node_modules` folder created

---

### **Step 3: Test Web Version First**

Before building the desktop app, test the web version:

```bash
npm run dev
```

- Open browser: `http://localhost:5173`
- Login with credentials
- Test basic functionality
- Press `Ctrl+C` to stop

If the web version works, you're ready to build!

---

### **Step 4: Build Windows Desktop App**

```bash
npm run electron:build:win
```

This command will:
1. ✅ Build the React app (`npm run build`)
2. ✅ Package with Electron
3. ✅ Create NSIS installer (Setup.exe)
4. ✅ Create portable version (Portable.exe)
5. ✅ Save to `release` folder

**Time:** 3-5 minutes

**Progress Output:**
```
> malwa-crm@2.0.0 electron:build:win
> npm run build && electron-builder --win

vite v5.x.x building for production...
✓ built in 7.75s

electron-builder 24.13.3
Building Windows x64 installer...
  • packaging       [========================] 100%
  • building block map   [========================] 100%
  • building NSIS installer [====================] 100%

✓ Built in 3m 45s
```

---

### **Step 5: Find Your Installer**

After build completes, check the `release` folder:

```bash
cd release
dir
```

You'll find:

**📁 release/**
- 📦 **Malwa-CRM-Setup-2.0.0.exe** (Installer - ~120 MB)
- 📦 **Malwa-CRM-Portable-2.0.0.exe** (Portable - ~150 MB)
- 📄 **latest.yml** (Update metadata)

---

## 📦 Installer Types Explained

### **1. Setup Installer (NSIS)**
**File:** `Malwa-CRM-Setup-2.0.0.exe`

**Features:**
- ✅ Traditional Windows installer
- ✅ Custom installation directory
- ✅ Desktop shortcut created
- ✅ Start menu shortcut created
- ✅ Add/Remove Programs entry
- ✅ Clean uninstaller included
- ✅ Best for permanent installation

**Installation Process:**
1. Double-click `Malwa-CRM-Setup-2.0.0.exe`
2. Choose installation directory
3. Select shortcuts (Desktop/Start Menu)
4. Click Install
5. Launch from Desktop icon

**Default Install Location:**
```
C:\Users\YOUR_USERNAME\AppData\Local\Programs\Malwa CRM\
```

---

### **2. Portable Version**
**File:** `Malwa-CRM-Portable-2.0.0.exe`

**Features:**
- ✅ No installation required
- ✅ Run from USB drive
- ✅ No registry changes
- ✅ Self-contained
- ✅ Perfect for testing
- ✅ No admin rights needed

**Usage:**
1. Copy `Malwa-CRM-Portable-2.0.0.exe` to any folder
2. Double-click to run
3. Delete file to remove (no uninstaller needed)

---

## 🎯 Distribution Guide

### **Option 1: Share Installer**

**For permanent installation:**
```
1. Upload Malwa-CRM-Setup-2.0.0.exe to Google Drive/Dropbox
2. Share download link
3. Users download and install
4. Desktop app installed like any Windows software
```

**Pros:**
- Professional installation experience
- Creates shortcuts automatically
- Easy to uninstall
- Appears in Programs list

---

### **Option 2: Share Portable**

**For quick testing:**
```
1. Upload Malwa-CRM-Portable-2.0.0.exe
2. Users download and run
3. No installation needed
4. Works immediately
```

**Pros:**
- No installation required
- Faster to test
- Run from anywhere
- No traces left

---

## 💻 What Users Get

### **Desktop Application Features:**

1. **Native Windows App**
   - Runs like any desktop software
   - Own window and taskbar icon
   - Windows notifications support
   - File system access

2. **Offline-First**
   - Works without internet
   - Data stored locally
   - Fast performance
   - No cloud dependency

3. **Full CRM Features**
   - Customer management
   - Vendor management
   - Supplier management
   - Labour management
   - Inventory tracking
   - Job management
   - Ledger system
   - Reports & exports

4. **Professional UI**
   - Maximizes on startup
   - Full-screen mode (F11)
   - Zoom controls (Ctrl+/-/0)
   - Dark mode toggle
   - Responsive design

5. **Menu Bar**
   ```
   File
     └─ Exit (Alt+F4)

   View
     ├─ Reload (Ctrl+R)
     ├─ Toggle DevTools (Ctrl+Shift+I)
     ├─ Actual Size (Ctrl+0)
     ├─ Zoom In (Ctrl+=)
     ├─ Zoom Out (Ctrl+-)
     └─ Toggle Full Screen (F11)

   Help
     └─ About Malwa CRM
   ```

---

## 🔧 Build Customization

### **Change App Name:**

Edit `package.json`:
```json
{
  "productName": "Your Company CRM",
  "version": "2.0.0"
}
```

### **Change App Icon:**

1. Create icons:
   - `build/icon.ico` (Windows - 256x256)
   - `build/icon.png` (Linux - 512x512)
   - `build/icon.icns` (Mac - 512x512)

2. Rebuild:
   ```bash
   npm run electron:build:win
   ```

### **Change Installation Behavior:**

Edit `package.json` → `build` → `nsis` section:

```json
"nsis": {
  "oneClick": true,              // One-click install (no options)
  "perMachine": true,            // Install for all users
  "allowToChangeInstallationDirectory": false,  // Fixed location
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true
}
```

---

## 📊 File Sizes

**Development:**
- node_modules: ~600 MB
- dist folder: ~2 MB (web build)

**Production:**
- Setup installer: ~120 MB
- Portable app: ~150 MB
- Installed size: ~180 MB

**User Data:**
- IndexedDB: 1-50 MB (depends on usage)
- Total app + data: ~200-250 MB

---

## 🚨 Common Issues & Solutions

### **Issue 1: "npm: command not found"**

**Solution:**
```bash
# Install Node.js from: https://nodejs.org
# Download LTS version
# Restart terminal after installation
node --version  # Should show v18.x.x or higher
```

---

### **Issue 2: Build fails with "Cannot find module"**

**Solution:**
```bash
# Delete old dependencies
rm -rf node_modules
rm package-lock.json

# Reinstall everything
npm install

# Try build again
npm run electron:build:win
```

---

### **Issue 3: "Electron failed to install correctly"**

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall Electron specifically
npm install electron --save-dev

# Try build again
npm run electron:build:win
```

---

### **Issue 4: Build succeeds but .exe won't run**

**Solution:**
```bash
# Check Windows Defender/Antivirus
# They may block unsigned .exe files

# Temporary workaround:
# Right-click .exe → Properties → Unblock → Apply
```

---

### **Issue 5: "EPERM: operation not permitted"**

**Solution:**
```bash
# Close running instances of the app
# Close VS Code or editors using the files
# Run as Administrator:
# Right-click PowerShell → Run as Administrator
npm run electron:build:win
```

---

## 🎯 Build Commands Reference

### **Web Development:**
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for web only
npm run preview      # Preview production build
```

### **Electron Development:**
```bash
npm run electron:dev # Run desktop app in dev mode (hot reload)
```

### **Electron Production:**
```bash
npm run electron:build           # Build for current platform
npm run electron:build:win       # Build for Windows
npm run electron:build:mac       # Build for macOS (requires Mac)
npm run electron:build:linux     # Build for Linux
```

---

## 📁 Project Structure After Build

```
Malwa-CRM/
│
├── electron/
│   └── main.js                    # ✅ Electron main process
│
├── build/                         # Optional (for custom icons)
│   ├── icon.ico                   # Windows icon
│   ├── icon.png                   # Linux icon
│   └── icon.icns                  # Mac icon
│
├── dist/                          # Web build output
│   ├── index.html
│   ├── assets/
│   └── ...
│
├── release/                       # Desktop build output
│   ├── Malwa-CRM-Setup-2.0.0.exe     # ✅ Installer
│   ├── Malwa-CRM-Portable-2.0.0.exe  # ✅ Portable
│   └── latest.yml
│
├── src/                           # React source code
├── node_modules/                  # Dependencies
├── package.json                   # ✅ Updated with Electron config
├── vite.config.js                # ✅ Updated for Electron
└── README.md
```

---

## 🔐 Code Signing (Optional - Advanced)

For production distribution, sign your .exe to avoid Windows warnings.

### **Requirements:**
- Code signing certificate ($100-500/year)
- Windows certificate authority (DigiCert, Sectigo, etc.)

### **Configuration:**

Add to `package.json`:
```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "YOUR_PASSWORD",
  "signingHashAlgorithms": ["sha256"],
  "sign": "./sign.js"
}
```

Without signing, users will see:
```
"Windows protected your PC"
Click "More info" → "Run anyway"
```

This is normal for unsigned apps. For internal use, it's fine.

---

## 📦 Auto-Update (Optional - Advanced)

To enable automatic updates:

1. **Host latest.yml online:**
   ```
   https://yourserver.com/releases/latest.yml
   ```

2. **Configure in package.json:**
   ```json
   "publish": {
     "provider": "generic",
     "url": "https://yourserver.com/releases/"
   }
   ```

3. **Add update checking code** to `electron/main.js`

For simple internal use, manual updates are sufficient.

---

## 🎉 Success Checklist

After building, verify:

- [x] `release` folder created
- [x] `Malwa-CRM-Setup-2.0.0.exe` exists
- [x] File size ~120 MB
- [x] Double-click runs installer
- [x] App installs successfully
- [x] Desktop shortcut created
- [x] App launches from shortcut
- [x] Login works
- [x] Data persists after closing
- [x] All features functional

---

## 💡 Testing the Built App

### **Test Setup Installer:**

1. **Install:**
   ```
   Double-click: Malwa-CRM-Setup-2.0.0.exe
   Follow installation wizard
   ```

2. **Test:**
   ```
   - Launch from Desktop shortcut
   - Login with credentials
   - Add a customer
   - Close app
   - Reopen app
   - Verify customer still there
   ```

3. **Uninstall:**
   ```
   Control Panel → Programs → Uninstall Malwa CRM
   ```

### **Test Portable Version:**

1. **Run:**
   ```
   Double-click: Malwa-CRM-Portable-2.0.0.exe
   ```

2. **Test:**
   ```
   - Login
   - Add data
   - Close
   - Reopen
   - Verify data persists
   ```

3. **Remove:**
   ```
   Delete the .exe file
   ```

---

## 🌐 Multi-Platform Builds

### **Build for Windows (on Windows):**
```bash
npm run electron:build:win
```
Output: `.exe` installers

### **Build for Mac (on Mac):**
```bash
npm run electron:build:mac
```
Output: `.dmg` and `.zip`

### **Build for Linux (on Linux):**
```bash
npm run electron:build:linux
```
Output: `.AppImage` and `.deb`

**Note:** Cross-platform builds are tricky. Best to build on target OS.

---

## 📞 Support

**Build Issues:**
- Check: [Electron Builder Docs](https://www.electron.build)
- Check: [Electron Docs](https://www.electronjs.org)

**App Issues:**
- Email: malwatrolley@gmail.com
- Phone: +91 8224000822

**General Node.js Issues:**
- [Node.js Documentation](https://nodejs.org/docs)
- [npm Documentation](https://docs.npmjs.com)

---

## 🎯 Quick Reference Card

### **Essential Commands:**
```bash
# Install dependencies
npm install

# Run web version
npm run dev

# Build desktop app
npm run electron:build:win

# Find installer
cd release
dir
```

### **Login Credentials:**
```
Email: Shahidmultaniii@gmail.com
Password: S#d_8224
```

### **File Locations:**
```
Installer: release/Malwa-CRM-Setup-2.0.0.exe
Portable:  release/Malwa-CRM-Portable-2.0.0.exe
```

---

## ✅ Final Notes

### **What You'll Get:**

1. ✅ Professional Windows desktop application
2. ✅ Both installer and portable versions
3. ✅ Fully offline-capable
4. ✅ All data stored locally
5. ✅ Fast native performance
6. ✅ No recurring costs
7. ✅ Complete CRM functionality

### **Distribution:**

- Share the .exe file via email, USB, or cloud storage
- Users can install without technical knowledge
- No server setup required
- No monthly fees
- Complete privacy (no cloud)

### **Updates:**

When you make changes:
```bash
# 1. Make code changes
# 2. Increment version in package.json
# 3. Rebuild
npm run electron:build:win
# 4. Distribute new .exe
```

---

## 🏆 You're Ready!

**Steps to Success:**
1. Run `npm install`
2. Run `npm run electron:build:win`
3. Wait 5 minutes
4. Find installer in `release` folder
5. Share with users
6. Done!

**Your desktop CRM is ready for distribution!**

---

© 2025 Malwa Trolley CRM • Desktop Application Guide
Version 2.0.0 • Electron + React + IndexedDB
