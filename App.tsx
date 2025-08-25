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

const { width, height } = Dimensions.get('window');

export default function App() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [drivePhotos, setDrivePhotos] = useState<DrivePhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Check authentication status on app start and periodically
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for OAuth completion messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OAUTH_COMPLETE') {
        console.log('🔐 Received OAuth completion message');
        setTimeout(() => checkAuthStatus(), 1000); // Check after a short delay
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Check for OAuth completion periodically
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 2000);
    
    return () => {
      window.removeEventListener('message', handleMessage);
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
    }
  }, [isAuthenticated]);

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

  const loadPhotosFromDrive = async () => {
    try {
      setIsLoadingPhotos(true);
      setPhotoError(null);
      
      // Get the saved shared folder URL
      const savedUrl = localStorage.getItem('shared_moments_folder_url');
      if (!savedUrl) {
        setPhotoError('No shared folder URL configured. Please set it in Settings.');
        return;
      }

      console.log('📁 Loading photos from:', savedUrl);
      
      // Load photos from Google Drive
      const photos = await GoogleDriveService.listPhotosInFolder(savedUrl);
      setDrivePhotos(photos);
      
      console.log(`✅ Loaded ${photos.length} photos from Drive`);
      
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
  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % displayPhotos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);

  // Helper function to get reliable image URL
  const getImageUrl = (photo: any) => {
    // Use the authenticated thumbnail URL (we know this works in browser)
    return photo.thumbnailLink;
  };

  // State for image loading status
  const [imageLoadStatus, setImageLoadStatus] = useState<{[key: string]: boolean}>({});

  // Function to mark image as loaded
  const markImageLoaded = (photoId: string) => {
    setImageLoadStatus(prev => ({ ...prev, [photoId]: true }));
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
      
      // Debug: Log the photo data
      console.log('📸 Current photo:', photo);
      console.log('🔗 webContentLink:', photo.webContentLink);
      console.log('🖼️ thumbnailLink:', photo.thumbnailLink);
      
      // Try using the webContentLink instead of thumbnailLink
      const accessToken = GoogleAuthService.getAccessToken();
      const imageUrl = accessToken ? `${photo.webContentLink}&access_token=${accessToken}` : photo.webContentLink;
      
      console.log('🎯 Using webContentLink URL:', imageUrl);
      
      return (
        <View style={styles.photoContainer}>
          <Image
            source={{ 
              uri: imageUrl,
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              }
            }}
            style={styles.realPhoto}
            resizeMode="contain"
            onLoad={() => {
              console.log('✅ Image loaded successfully');
              markImageLoaded(photo.id);
            }}
            onError={(error) => {
              console.error('❌ Image load error:', error);
              console.log('🔗 Failed URL:', imageUrl);
              // Try opening in new tab for debugging
              window.open(imageUrl, '_blank');
            }}
          />
          <Text style={styles.photoCaption}>{photo.name}</Text>
        </View>
      );
    }

    // Fallback to sample photos
    const samplePhoto = currentPhoto as any; // Type assertion for sample photos
    return (
      <View style={[styles.photoContainer, { backgroundColor: samplePhoto.color }]}>
        <Text style={styles.photoIcon}>{samplePhoto.icon}</Text>
        <Text style={styles.photoText}>{samplePhoto.text}</Text>
        <Text style={styles.photoSubtext}>Gradient Placeholder</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>
          {isAuthenticated ? `Connected as: ${currentUser?.email || 'User'}` : 'Not Connected'}
        </Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Display */}
      {renderPhotoContent()}

      {/* Controls - Only show when we have photos */}
      {displayPhotos.length > 0 && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={prevPhoto}>
            <Text style={styles.controlButtonText}>◀</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={nextPhoto}>
            <Text style={styles.controlButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Photo Indicators - Only show when we have photos */}
      {displayPhotos.length > 0 && (
        <View style={styles.indicators}>
          {displayPhotos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentPhotoIndex && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      )}

      {/* Bottom Info - Only show when we have photos */}
      {displayPhotos.length > 0 && (
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomInfoText}>
            Photo {currentPhotoIndex + 1} of {displayPhotos.length}
            {drivePhotos.length > 0 && ' (from Google Drive)'}
          </Text>
        </View>
      )}

      {/* Settings Dialog */}
      <SettingsDialog 
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        isAuthenticated={isAuthenticated}
        userEmail={currentUser?.email}
        onAuthStateChange={handleAuthStateChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  topBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  photoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  photoSubtext: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    padding: 20,
    marginHorizontal: 20,
  },
  controlButtonText: {
    fontSize: 32,
    color: '#fff',
  },
  playButton: {
    padding: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 50,
  },
  playButtonText: {
    fontSize: 36,
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
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  photoCaption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});
