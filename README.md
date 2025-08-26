# Shared Moments - Photo Slideshow App

A React Native web application for displaying photos from Google Drive in a beautiful slideshow format.

## Version 0.1.1 - Mobile UI Improvements

### ✅ **What's New:**
- **Mobile-optimized UI** - Responsive design for phones and tablets
- **Mock authentication** - Demo mode without Google Drive dependency
- **Improved controls** - Bottom-positioned controls (100px from bottom)
- **Better positioning** - Right-aligned top bar, avoids system UI
- **Cross-platform storage** - AsyncStorage for mobile compatibility
- **Landscape support** - Works in both orientations

### 🎨 **UI Improvements:**
- **Top bar**: Filename display only
- **Bottom controls**: Play/pause/next buttons + settings
- **Responsive sizing**: Larger buttons on tablets
- **Touch-friendly**: Better touch targets and spacing

### 🔧 **Technical Fixes:**
- **Removed web dependencies** - No more localStorage issues
- **Fixed crashes** - Proper mobile storage implementation
- **Better error handling** - Graceful fallbacks

### 📱 **Platform Support:**
- **Android**: Fully tested with Expo Go
- **iOS**: Ready for testing
- **Tablet**: Responsive design optimized

---

## Version 0.1.0 - Folder Selection Release

### Features
- ✅ Google Drive OAuth 2.0 Authentication
- ✅ Photo slideshow with play/pause controls
- ✅ Full-screen image display with proper aspect ratio
- ✅ **NEW: Tabbed Settings Interface** (Connection, Folders, Display)
- ✅ **NEW: Two-Level Folder Selection** (root + subfolders)
- ✅ **NEW: Multi-Folder Photo Loading** with duplicate prevention
- ✅ **NEW: Persistent Folder Selection** storage
- ✅ Customizable UI settings (show/hide elements, opacity control)
- ✅ Persistent settings storage
- ✅ Responsive design with semi-transparent control bar

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/numansheikh/shared-moments.git
   cd shared-moments
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Google OAuth**
   - Create a `.env` file in the root directory
   - Add your Google OAuth credentials:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
   REACT_APP_GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

4. **Configure Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:8081/auth-callback.html`

5. **Run the application**
   ```bash
   npm run web
   ```

### Usage

1. **Connect to Google Drive**
   - Click the settings button (⚙️)
   - Click "Connect to Google Drive"
   - Sign in with your Google account

2. **Configure Root Folder**
   - In settings → Connection tab, enter your Google Drive folder URL
   - Format: `https://drive.google.com/drive/folders/FOLDER_ID`
   - Click "Save URL"

3. **Select Folders**
   - Go to settings → Folders tab
   - Choose which folders to include in your slideshow:
     - **Root Folder** - All photos in the main folder
     - **Subfolders** - Specific folders within the root
   - Use "Select All" or "Deselect All" for quick selection

4. **Customize Display**
   - Go to settings → Display tab
   - Toggle email display on/off
   - Toggle navigation controls on/off
   - Toggle photo counter on/off
   - Adjust top bar opacity (0-100%)

### Technical Details

- **Framework**: React Native Web with Expo
- **Authentication**: Google OAuth 2.0 (redirect flow)
- **Storage**: Google Drive API
- **State Management**: React hooks with localStorage persistence
- **Styling**: React Native StyleSheet

### File Structure

```
shared-moments/
├── App.tsx                 # Main application component
├── components/
│   └── SettingsDialog.tsx  # Settings modal
├── services/
│   ├── GoogleAuthService.ts    # OAuth authentication
│   └── GoogleDriveService.ts   # Drive API integration
├── public/
│   └── auth-callback.html      # OAuth callback page
└── .env                      # Environment variables (not in git)
```

### Environment Variables

Create a `.env` file with:
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Troubleshooting

- **"OAuth client not found"**: Check your Google Cloud Console configuration
- **"CORS error"**: Ensure redirect URI matches exactly in Google Cloud Console
- **"No photos loading"**: Verify folder permissions and URL format

### Version History

- **v0.1.0**: Folder selection release with enhanced functionality
  - Tabbed settings interface (Connection, Folders, Display)
  - Two-level folder selection (root + subfolders)
  - Multi-folder photo loading with duplicate prevention
  - Persistent folder selection storage
  - Improved error handling and navigation

- **v0.0.1**: Initial beta release with core functionality
  - Google Drive integration
  - Slideshow controls
  - Customizable UI
  - Persistent settings

### License

MIT License
