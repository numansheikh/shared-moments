# Shared Moments - Cross-Platform Photo Slideshow App

A React Native application for sharing and viewing family photos through Google Drive integration.

## 🚀 Features

- **Cross-Platform Support**: iOS, Android, Web, and TV
- **Photo Slideshow**: Automatic and manual navigation
- **Google Drive Integration**: Load photos from shared folders
- **Family Sharing**: Multiple users can access shared photo collections
- **Responsive Design**: Optimized for all screen sizes and orientations

## 📱 Platform Support

### iOS
- iPhone and iPad optimized
- Touch gestures and haptic feedback
- iOS-style animations

### Android  
- Phone and tablet support
- Material Design components
- Android navigation patterns

### Web
- Browser-based slideshow
- Keyboard navigation support
- Responsive web design

### TV
- Remote control navigation
- Large screen optimization
- Auto-play functionality

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **Google APIs** - Drive integration and OAuth
- **AsyncStorage** - Local data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (optional)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd shared-moments

# Install dependencies
npm install

# Start development server
npm run web      # Web browser
npm run ios      # iOS simulator
npm run android  # Android emulator
```

## 📁 Project Structure

```
shared-moments/
├── App.tsx              # Main application component
├── components/          # Reusable UI components
├── services/           # Google Drive and API services
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── assets/             # Images, fonts, and static files
└── package.json        # Dependencies and scripts
```

## ☁️ Google Drive Integration

### Architecture
- **OAuth 2.0 Authentication** - Secure user sign-in
- **Shared Folder System** - Family photo collections
- **Permission Management** - Control who can view photos
- **Real-time Updates** - Sync changes across devices

### Folder Structure
```
📁 Shared Moments (Master Folder)
├── 📄 sharing_moments_config.json (App Configuration)
├── 📁 Photos (Family Photos)
│   ├── 📸 photo1.jpg
│   ├── 📸 photo2.jpg
│   └── ...
└── 📁 Thumbnails (Optimized Images)
```

## 🔧 Development

### Available Scripts
- `npm start` - Start Expo development server
- `npm run web` - Run in web browser
- `npm run ios` - Run in iOS simulator
- `npm run android` - Run in Android emulator
- `npm run build` - Build production app

### Hot Reload
The app automatically reloads when you make changes to the code.

## 📋 Development Roadmap

### Phase 1: Core App ✅
- [x] Basic slideshow functionality
- [x] Navigation controls
- [x] Photo indicators
- [x] Responsive UI

### Phase 2: Google Drive Integration 🔄
- [ ] OAuth authentication
- [ ] Photo loading from Drive
- [ ] Shared folder management
- [ ] Permission system

### Phase 3: Advanced Features 📋
- [ ] Photo upload
- [ ] Offline caching
- [ ] Slideshow themes
- [ ] Social sharing

### Phase 4: Platform Optimization 📋
- [ ] iOS-specific features
- [ ] Android optimization
- [ ] TV remote support
- [ ] Web keyboard shortcuts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple platforms
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ using React Native and Expo**
