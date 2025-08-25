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
import GoogleDriveService from '../services/GoogleDriveService';

const { width } = Dimensions.get('window');

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
  onAuthStateChange: (user: GoogleUser | null) => void;
  showEmail: boolean;
  onShowEmailChange: (value: boolean) => void;
  showControls: boolean;
  onShowControlsChange: (value: boolean) => void;
  showPhotoCounter: boolean;
  onShowPhotoCounterChange: (value: boolean) => void;
  topBarOpacity: number;
  onTopBarOpacityChange: (value: number) => void;
  onFoldersChanged?: () => void;
}

export default function SettingsDialog({ 
  visible, 
  onClose, 
  isAuthenticated, 
  userEmail,
  onAuthStateChange,
  showEmail,
  onShowEmailChange,
  showControls,
  onShowControlsChange,
  showPhotoCounter,
  onShowPhotoCounterChange,
  topBarOpacity,
  onTopBarOpacityChange,
  onFoldersChanged
}: SettingsDialogProps) {
  const [sharedFolderUrl, setSharedFolderUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('connection'); // 'connection', 'folders', 'display'
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  // Load saved URL when dialog opens AND user is authenticated
  useEffect(() => {
    if (visible && isAuthenticated) {
      loadSavedUrl();
      loadFolders();
      loadSelectedFolders();
    } else if (visible && !isAuthenticated) {
      // Clear the URL input when not authenticated
      setSharedFolderUrl('');
      setFolders([]);
      setSelectedFolders([]);
    }
  }, [visible, isAuthenticated]);

  // Load folders when tab changes to folders
  useEffect(() => {
    if (visible && isAuthenticated && activeTab === 'folders' && folders.length === 0) {
      loadFolders();
    }
  }, [visible, isAuthenticated, activeTab]);

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

  const loadFolders = async () => {
    try {
      setIsLoadingFolders(true);
      console.log('📁 Loading folders from Google Drive...');
      
      // Get the saved shared folder URL
      const savedUrl = localStorage.getItem('shared_moments_folder_url');
      if (!savedUrl) {
        console.log('❌ No root folder URL configured');
        return;
      }

      // Extract folder ID from URL
      const folderIdMatch = savedUrl.match(/\/folders\/([^/?]+)/);
      if (!folderIdMatch) {
        console.log('❌ Invalid folder URL format');
        return;
      }

      const rootFolderId = folderIdMatch[1];
      console.log('🔍 Root folder ID:', rootFolderId);

      // Load folders using GoogleDriveService
      const driveFolders = await GoogleDriveService.listFoldersInFolder(rootFolderId);
      setFolders(driveFolders);
      console.log('✅ Loaded folders:', driveFolders);
      
    } catch (error) {
      console.error('❌ Error loading folders:', error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const loadSelectedFolders = () => {
    try {
      const saved = localStorage.getItem('selected_folders');
      if (saved) {
        const folders = JSON.parse(saved);
        setSelectedFolders(folders);
        console.log('📁 Loaded selected folders:', folders);
      }
    } catch (error) {
      console.error('❌ Error loading selected folders:', error);
    }
  };

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev => {
      const newSelection = prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId];
      
      // Save to localStorage
      localStorage.setItem('selected_folders', JSON.stringify(newSelection));
      console.log('📁 Updated selected folders:', newSelection);
      
      // Notify parent component
      if (onFoldersChanged) {
        onFoldersChanged();
      }
      
      return newSelection;
    });
  };

  const handleSelectAllFolders = () => {
    const allFolderIds = ['root', ...folders.map(folder => folder.id)];
    setSelectedFolders(allFolderIds);
    localStorage.setItem('selected_folders', JSON.stringify(allFolderIds));
    console.log('📁 Selected all folders:', allFolderIds);
    
    // Notify parent component
    if (onFoldersChanged) {
      onFoldersChanged();
    }
  };

  const handleDeselectAllFolders = () => {
    setSelectedFolders([]);
    localStorage.setItem('selected_folders', JSON.stringify([]));
    console.log('📁 Deselected all folders');
    
    // Notify parent component
    if (onFoldersChanged) {
      onFoldersChanged();
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

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'connection' && styles.activeTab]}
              onPress={() => setActiveTab('connection')}
            >
              <Text style={[styles.tabText, activeTab === 'connection' && styles.activeTabText]}>
                Connection
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'folders' && styles.activeTab]}
              onPress={() => setActiveTab('folders')}
            >
              <Text style={[styles.tabText, activeTab === 'folders' && styles.activeTabText]}>
                Folders
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'display' && styles.activeTab]}
              onPress={() => setActiveTab('display')}
            >
              <Text style={[styles.tabText, activeTab === 'display' && styles.activeTabText]}>
                Display
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Connection Tab */}
            {activeTab === 'connection' && (
              <>
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
                    <Text style={styles.sectionTitle}>Root Folder</Text>
                    
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
              </>
            )}

            {/* Folders Tab */}
            {activeTab === 'folders' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Folder Selection</Text>
                
                {!isAuthenticated ? (
                  <Text style={styles.placeholder}>Please connect to Google Drive first</Text>
                ) : !sharedFolderUrl ? (
                  <Text style={styles.placeholder}>Please configure root folder URL first</Text>
                ) : (
                  <>
                    <Text style={styles.sectionDescription}>
                      Select which folders to include in your slideshow:
                    </Text>
                    
                    {/* Select All / Deselect All Buttons */}
                    <View style={styles.folderActions}>
                      <TouchableOpacity 
                        style={styles.folderActionButton}
                        onPress={handleSelectAllFolders}
                      >
                        <Text style={styles.folderActionButtonText}>Select All</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.folderActionButton}
                        onPress={handleDeselectAllFolders}
                      >
                        <Text style={styles.folderActionButtonText}>Deselect All</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Root Folder Option */}
                    <View style={styles.folderItem}>
                      <TouchableOpacity 
                        style={styles.folderCheckbox}
                        onPress={() => handleFolderToggle('root')}
                      >
                        <Text style={styles.checkboxText}>
                          {selectedFolders.includes('root') ? '☑' : '☐'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.folderName}>📁 Root Folder (All Photos)</Text>
                    </View>

                    {/* Subfolders */}
                    {isLoadingFolders ? (
                      <Text style={styles.placeholder}>Loading folders...</Text>
                    ) : folders.length === 0 ? (
                      <Text style={styles.placeholder}>No subfolders found</Text>
                    ) : (
                      folders.map(folder => (
                        <View key={folder.id} style={styles.folderItem}>
                          <TouchableOpacity 
                            style={styles.folderCheckbox}
                            onPress={() => handleFolderToggle(folder.id)}
                          >
                            <Text style={styles.checkboxText}>
                              {selectedFolders.includes(folder.id) ? '☑' : '☐'}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.folderName}>📁 {folder.name}</Text>
                        </View>
                      ))
                    )}
                  </>
                )}
              </View>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Display Settings</Text>
                
                {/* Show Email Toggle */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show Email</Text>
                  <TouchableOpacity 
                    style={[styles.toggleButton, { backgroundColor: showEmail ? '#10B981' : '#6B7280' }]}
                    onPress={() => onShowEmailChange(!showEmail)}
                  >
                    <Text style={styles.toggleButtonText}>{showEmail ? 'ON' : 'OFF'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Show Controls Toggle */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show Controls</Text>
                  <TouchableOpacity 
                    style={[styles.toggleButton, { backgroundColor: showControls ? '#10B981' : '#6B7280' }]}
                    onPress={() => onShowControlsChange(!showControls)}
                  >
                    <Text style={styles.toggleButtonText}>{showControls ? 'ON' : 'OFF'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Show Photo Counter Toggle */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Show Photo Counter</Text>
                  <TouchableOpacity 
                    style={[styles.toggleButton, { backgroundColor: showPhotoCounter ? '#10B981' : '#6B7280' }]}
                    onPress={() => onShowPhotoCounterChange(!showPhotoCounter)}
                  >
                    <Text style={styles.toggleButtonText}>{showPhotoCounter ? 'ON' : 'OFF'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Top Bar Opacity Slider */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Top Bar Opacity: {Math.round(topBarOpacity * 100)}%</Text>
                  <View style={styles.sliderContainer}>
                    <TouchableOpacity 
                      style={styles.sliderButton}
                      onPress={() => onTopBarOpacityChange(Math.max(0, topBarOpacity - 0.1))}
                    >
                      <Text style={styles.sliderButtonText}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderFill, { width: `${topBarOpacity * 100}%` }]} />
                    </View>
                    <TouchableOpacity 
                      style={styles.sliderButton}
                      onPress={() => onTopBarOpacityChange(Math.min(1, topBarOpacity + 0.1))}
                    >
                      <Text style={styles.sliderButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    maxHeight: '80%', // Limit dialog height to 80% of screen
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
    minHeight: 400, // Minimum height to prevent layout shifts
    maxHeight: 500, // Maximum height to keep dialog reasonable
    justifyContent: 'flex-start',
    alignItems: 'stretch',
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  sliderButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  sliderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  sectionDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
  },
  folderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  folderActionButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  folderActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  folderCheckbox: {
    marginRight: 12,
    padding: 4,
  },
  checkboxText: {
    fontSize: 18,
    color: '#10B981',
  },
  folderName: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
});
