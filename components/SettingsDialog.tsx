import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import GoogleAuthService, { GoogleUser } from '../services/GoogleAuthService';

const { width } = Dimensions.get('window');

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
  onAuthStateChange: (user: GoogleUser | null) => void;
}

export default function SettingsDialog({ 
  visible, 
  onClose, 
  isAuthenticated, 
  userEmail,
  onAuthStateChange
}: SettingsDialogProps) {
  const [sharedFolderUrl, setSharedFolderUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved URL when dialog opens AND user is authenticated
  useEffect(() => {
    if (visible && isAuthenticated) {
      loadSavedUrl();
    } else if (visible && !isAuthenticated) {
      // Clear the URL input when not authenticated
      setSharedFolderUrl('');
    }
  }, [visible, isAuthenticated]);

  const loadSavedUrl = () => {
    try {
      const savedUrl = localStorage.getItem('shared_moments_folder_url');
      if (savedUrl) {
        setSharedFolderUrl(savedUrl);
        console.log('📁 Loaded saved URL:', savedUrl);
      }
    } catch (error) {
      console.error('❌ Error loading saved URL:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔐 Connect button pressed!');
    console.log('Current auth state:', isAuthenticated);
    
    if (isAuthenticated) {
      // Sign out
      console.log('🔄 Attempting to sign out...');
      try {
        setIsLoading(true);
        await GoogleAuthService.signOut();
        onAuthStateChange(null);
        console.log('✅ Sign out successful');
      } catch (error) {
        console.error('❌ Sign out error:', error);
        Alert.alert('Error', 'Failed to sign out');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign in
      console.log('🔑 Attempting to sign in...');
      try {
        setIsLoading(true);
        const user = await GoogleAuthService.signIn();
        console.log('Sign in result:', user);
        if (user) {
          onAuthStateChange(user);
          console.log('✅ Sign in successful');
        } else {
          console.log('❌ Sign in returned null');
          Alert.alert('Sign In Failed', 'Please try again');
        }
      } catch (error) {
        console.error('❌ Sign in error:', error);
        Alert.alert('Error', 'Failed to sign in');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveUrl = async () => {
    const url = sharedFolderUrl.trim();
    
    if (!url) {
      Alert.alert('Error', 'Please enter a Google Drive folder URL');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Error', 'Please sign in to Google Drive first');
      return;
    }

    // Validate URL format
    if (!url.includes('drive.google.com/drive/folders/')) {
      Alert.alert('Error', 'Please enter a valid Google Drive folder URL');
      return;
    }

    try {
      setIsSaving(true);
      
      // Save to local storage
      localStorage.setItem('shared_moments_folder_url', url);
      
      console.log('✅ URL saved successfully:', url);
      Alert.alert('Success', 'Shared folder URL saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving URL:', error);
      Alert.alert('Error', 'Failed to save URL');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Google Drive Connection Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Google Drive</Text>
              
              <View style={styles.connectionStatus}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: isAuthenticated ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.statusText}>
                  {isAuthenticated ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
              
              {isAuthenticated && userEmail && (
                <Text style={styles.userEmail}>as {userEmail}</Text>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.connectButton,
                  { backgroundColor: isAuthenticated ? '#6B7280' : '#3B82F6' }
                ]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.connectButtonText}>
                  {isLoading 
                    ? 'Loading...' 
                    : isAuthenticated 
                      ? 'Disconnect' 
                      : 'Connect to Google Drive'
                  }
                </Text>
              </TouchableOpacity>
            </View>

            {/* Shared Folder Configuration - Only show when authenticated */}
            {isAuthenticated && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shared Folder</Text>
                
                <Text style={styles.inputLabel}>Google Drive Folder URL:</Text>
                <TextInput
                  style={styles.urlInput}
                  value={sharedFolderUrl}
                  onChangeText={setSharedFolderUrl}
                  placeholder="https://drive.google.com/drive/folders/..."
                  placeholderTextColor="#6B7280"
                  multiline={false}
                />
                
                <TouchableOpacity 
                  style={[
                    styles.saveUrlButton,
                    { backgroundColor: sharedFolderUrl.trim() && isAuthenticated ? '#10B981' : '#6B7280' }
                  ]}
                  disabled={!sharedFolderUrl.trim() || !isAuthenticated || isSaving}
                  onPress={handleSaveUrl}
                >
                  <Text style={styles.saveUrlButtonText}>
                    {isSaving ? 'Saving...' : 'Save URL'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={onClose}>
              <Text style={styles.saveButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 0,
    elevation: 5,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  content: {
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: '#9ca3af',
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#263238',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 5,
  },
  connectButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 5,
  },
  urlInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#263238',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  saveUrlButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveUrlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
