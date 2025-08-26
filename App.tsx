import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Image
} from 'react-native';
import SettingsDialog from './components/SettingsDialog';
import GoogleAuthService, { GoogleUser } from './services/GoogleAuthService';
import GoogleDriveService, { DrivePhoto } from './services/GoogleDriveService';
import Storage from './utils/storage';

const { width, height } = Dimensions.get('window');
const isTablet = width > 600;
const isLandscape = width > height;

export default function App() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Start in play mode
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [drivePhotos, setDrivePhotos] = useState<DrivePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  // UI Settings state
  const [showEmail, setShowEmail] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showPhotoCounter, setShowPhotoCounter] = useState(true);
  const [topBarOpacity, setTopBarOpacity] = useState(0.25);
  const [selectedFoldersVersion, setSelectedFoldersVersion] = useState(0);

  // Check authentication status on app start and periodically
  useEffect(() => {
    checkAuthStatus();
    
    // Check for OAuth completion periodically
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Load photos when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadPhotosFromDrive();
    } else {
      setDrivePhotos([]);
      setPhotoError(null);
      setCurrentPhotoIndex(0);
    }
  }, [isAuthenticated]);

  // Reload photos when selected folders change
  useEffect(() => {
    if (isAuthenticated) {
      loadPhotosFromDrive();
    }
  }, [selectedFoldersVersion]);

  // Reset photo index when photos change
  useEffect(() => {
    if (drivePhotos.length === 0) {
      setCurrentPhotoIndex(0);
    } else if (currentPhotoIndex >= drivePhotos.length || currentPhotoIndex < 0) {
      setCurrentPhotoIndex(0);
    }
  }, [drivePhotos.length, currentPhotoIndex]);

  const checkAuthStatus = async () => {
    try {
      const isSignedIn = await GoogleAuthService.isSignedIn();
      if (isSignedIn) {
        const user = await GoogleAuthService.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(!!user);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleAuthStateChange = (user: GoogleUser | null) => {
    setCurrentUser(user);
    setIsAuthenticated(!!user);
  };

  // Settings handlers
  const handleShowEmailChange = (value: boolean) => {
    setShowEmail(value);
    Storage.setItem('show_email', JSON.stringify(value));
  };

  const handleShowControlsChange = (value: boolean) => {
    setShowControls(value);
    Storage.setItem('show_controls', JSON.stringify(value));
  };

  const handleShowPhotoCounterChange = (value: boolean) => {
    setShowPhotoCounter(value);
    Storage.setItem('show_photo_counter', JSON.stringify(value));
  };

  const handleTopBarOpacityChange = (value: number) => {
    setTopBarOpacity(value);
    Storage.setItem('top_bar_opacity', value.toString());
  };

  const handleFoldersChanged = () => {
    setSelectedFoldersVersion(prev => prev + 1);
  };

  const loadPhotosFromDrive = async () => {
    try {
      setIsLoadingPhotos(true);
      setPhotoError(null);
      
      // Get the saved shared folder URL
      const savedUrl = await Storage.getItem('shared_moments_folder_url');
      if (!savedUrl) {
        setPhotoError('No shared folder URL configured. Please set it in Settings.');
        return;
      }

      // Get selected folders
      const selectedFolders = await Storage.getItem('selected_folders');
      const folderIds = selectedFolders ? JSON.parse(selectedFolders) : ['root'];

      console.log('📁 Loading photos from folders:', folderIds);
      
      // Extract root folder ID from URL
      const folderIdMatch = savedUrl.match(/\/folders\/([^/?]+)/);
      if (!folderIdMatch) {
        setPhotoError('Invalid folder URL format.');
        return;
      }

      const rootFolderId = folderIdMatch[1];
      let allPhotos: DrivePhoto[] = [];

      // Load photos from each selected folder
      for (const folderId of folderIds) {
        try {
          const actualFolderId = folderId === 'root' ? rootFolderId : folderId;
          const photos = await GoogleDriveService.listPhotosInFolder(actualFolderId);
          allPhotos = [...allPhotos, ...photos];
          console.log(`✅ Loaded ${photos.length} photos from folder ${folderId}`);
        } catch (error) {
          console.error(`❌ Error loading photos from folder ${folderId}:`, error);
        }
      }

      // Remove duplicates based on photo ID
      const uniquePhotos = allPhotos.filter((photo, index, self) => 
        index === self.findIndex(p => p.id === photo.id)
      );

      setDrivePhotos(uniquePhotos);
      console.log(`✅ Loaded ${uniquePhotos.length} total photos from ${folderIds.length} folders`);
      
    } catch (error) {
      console.error('❌ Error loading photos:', error);
      setPhotoError('Failed to load photos from Google Drive. Please check your folder permissions.');
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Sample photos for fallback (when not authenticated or no Drive photos)
  const samplePhotos = [
    { id: 1, color: '#3B82F6', text: 'Photo 1', icon: '📸' },
    { id: 2, color: '#10B981', text: 'Photo 2', icon: '🌅' },
    { id: 3, color: '#F59E0B', text: 'Photo 3', icon: '🏞️' },
    { id: 4, color: '#EF4444', text: 'Photo 4', icon: '🌊' },
    { id: 5, color: '#8B5CF6', text: 'Photo 5', icon: '🌌' },
  ];

  // Use Drive photos if available, otherwise fallback to samples
  const displayPhotos = drivePhotos.length > 0 ? drivePhotos : samplePhotos;
  const currentPhoto = displayPhotos[currentPhotoIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && drivePhotos.length > 0) {
      interval = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % drivePhotos.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, drivePhotos.length]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const nextPhoto = () => {
    if (displayPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => {
        const newIndex = (prev + 1) % displayPhotos.length;
        return newIndex >= 0 && newIndex < displayPhotos.length ? newIndex : 0;
      });
    }
  };
  
  const prevPhoto = () => {
    if (displayPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => {
        const newIndex = (prev - 1 + displayPhotos.length) % displayPhotos.length;
        return newIndex >= 0 && newIndex < displayPhotos.length ? newIndex : 0;
      });
    }
  };

  // Helper function to get reliable image URL
  const getImageUrl = (photo: any) => {
    // Use the authenticated thumbnail URL (we know this works in browser)
    return photo.thumbnailLink;
  };

  // State for blob URLs
  const [blobUrls, setBlobUrls] = useState<{[key: string]: string}>({});

  // Function to download image and create blob URL
  const downloadImageAsBlob = async (photo: any) => {
    try {
      const accessToken = GoogleAuthService.getAccessToken();
      if (!accessToken) return null;

      // Use Google Drive API's alt=media endpoint (designed for this)
      const imageUrl = `https://www.googleapis.com/drive/v3/files/${photo.id}?alt=media`;
      console.log('🔄 Downloading image via API:', imageUrl);
      
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      console.log('✅ Created blob URL:', blobUrl);
      setBlobUrls(prev => ({ ...prev, [photo.id]: blobUrl }));
      return blobUrl;
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      return null;
    }
  };

  const renderPhotoContent = () => {
    if (isLoadingPhotos) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading photos from Google Drive...</Text>
        </View>
      );
    }

    if (photoError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {photoError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPhotosFromDrive}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (drivePhotos.length > 0) {
      // Real photo from Drive
      const photo = drivePhotos[currentPhotoIndex];
      
      // Safety check for undefined photo
      if (!photo) {
        console.log('⚠️ Photo is undefined, resetting index');
        setCurrentPhotoIndex(0);
        return (
          <View style={styles.photoContainer}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        );
      }
      
      // Debug: Log the photo data
      console.log('📸 Current photo:', photo);
      console.log('🔗 webContentLink:', photo.webContentLink);
      console.log('🖼️ thumbnailLink:', photo.thumbnailLink);
      
            // Check if we have a blob URL for this photo
      const blobUrl = blobUrls[photo.id];
      
      if (blobUrl) {
        console.log('🎯 Using blob URL:', blobUrl);
        return (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: blobUrl }}
              style={styles.realPhoto}
              resizeMode="contain"
              onLoad={() => console.log('✅ Image loaded successfully from blob')}
            />
          </View>
        );
      } else {
        // Download image as blob
        downloadImageAsBlob(photo);
        
        return (
          <View style={styles.photoContainer}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          </View>
        );
      }
    }

    // Fallback to sample photos
    const samplePhoto = currentPhoto as any; // Type assertion for sample photos
    return (
      <View style={[styles.photoContainer, { backgroundColor: samplePhoto.color }]}>
        <View style={styles.samplePhotoContent}>
          <Text style={[styles.photoIcon, { fontSize: isTablet ? 120 : 80 }]}>{samplePhoto.icon}</Text>
          <Text style={[styles.photoText, { fontSize: isTablet ? 64 : 48 }]}>{samplePhoto.text}</Text>
          <Text style={[styles.photoSubtext, { fontSize: isTablet ? 24 : 18 }]}>Gradient Placeholder</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
      
      {/* Top Bar with filename only */}
      <View style={[
        styles.topBar, 
        { 
          backgroundColor: `rgba(0,0,0,${topBarOpacity})`,
          height: isTablet ? 40 : 30,
          paddingHorizontal: isTablet ? 20 : 15,
          width: '100%',
          justifyContent: 'center',
        }
      ]}>
        {/* Show filename at top */}
        {drivePhotos.length > 0 && currentPhoto && 'name' in currentPhoto && (
          <Text style={[styles.topBarText, { fontSize: isTablet ? 16 : 13 }]}>
            {currentPhoto.name}
          </Text>
        )}
        

      </View>

      {/* Photo Display - Full Screen */}
      <View style={styles.photoDisplayContainer}>
        {renderPhotoContent()}
      </View>

      {/* Controls 100px above bottom */}
      {displayPhotos.length > 0 && (
        <View style={[
          styles.bottomControlsBar, 
          { 
            backgroundColor: `rgba(0,0,0,${topBarOpacity})`,
            height: isTablet ? 60 : 50,
            paddingHorizontal: isTablet ? 20 : 15,
          }
        ]}>
          <View style={styles.bottomControls}>
            <TouchableOpacity style={[styles.controlButton, { padding: isTablet ? 12 : 8 }]} onPress={prevPhoto}>
              <Text style={[styles.controlButtonText, { fontSize: isTablet ? 24 : 20 }]}>⏮</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.playButton, { padding: isTablet ? 10 : 6 }]} onPress={togglePlayPause}>
              <Text style={[styles.playButtonText, { fontSize: isTablet ? 24 : 20 }]}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.controlButton, { padding: isTablet ? 12 : 8 }]} onPress={nextPhoto}>
              <Text style={[styles.controlButtonText, { fontSize: isTablet ? 24 : 20 }]}>⏭</Text>
            </TouchableOpacity>
            
            {showPhotoCounter && (
              <Text style={[styles.photoCounter, { fontSize: isTablet ? 14 : 11 }]}>
                {currentPhotoIndex + 1} / {displayPhotos.length}
              </Text>
            )}
            
            <TouchableOpacity 
              style={[styles.settingsButton, { padding: isTablet ? 8 : 4, marginLeft: 20 }]}
              onPress={() => setShowSettings(true)}
            >
              <Text style={[styles.settingsButtonText, { fontSize: isTablet ? 22 : 18 }]}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Settings Dialog */}
      <SettingsDialog 
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        isAuthenticated={isAuthenticated}
        userEmail={currentUser?.email}
        onAuthStateChange={handleAuthStateChange}
        showEmail={showEmail}
        onShowEmailChange={handleShowEmailChange}
        showControls={showControls}
        onShowControlsChange={handleShowControlsChange}
        showPhotoCounter={showPhotoCounter}
        onShowPhotoCounterChange={handleShowPhotoCounterChange}
        topBarOpacity={topBarOpacity}
        onTopBarOpacityChange={handleTopBarOpacityChange}
        onFoldersChanged={handleFoldersChanged}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    height: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    minHeight: 50,
    width: '100%',
    paddingTop: 50, // Add padding for status bar
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    height: 50,
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1000,
    minHeight: 50,
    width: 'auto',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  bottomControlsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    height: 50,
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 1000,
    minHeight: 50,
    width: '100%',
  },
  photoDisplayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCounter: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
  },
  topBarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 4,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  photoContainer: {
    flex: 1,
    position: 'relative',
  },
  photoIcon: {
    fontSize: 80,
    marginBottom: 20,
    textAlign: 'center',
  },
  photoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  photoSubtext: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  samplePhotoContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  controlButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  playButton: {
    padding: 6,
  },
  playButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
  },
  activeIndicator: {
    backgroundColor: '#3B82F6',
  },
  bottomInfo: {
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  bottomInfoText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  realPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  photoCaption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  filenameOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  filenameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
