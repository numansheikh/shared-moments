import GoogleDriveService from './GoogleDriveService';
import Storage from '../utils/storage';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

class GoogleAuthService {
  private isConfigured = false;
  private currentUser: GoogleUser | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.configureGoogleSignIn();
    this.initialize();
  }

  private async initialize() {
    await this.checkForOAuthCompletion();
    await this.loadStoredAuth();
  }

  private configureGoogleSignIn() {
    if (this.isConfigured) return;
    this.isConfigured = true;
    console.log('✅ Google OAuth 2.0 configured for web');
  }

  private buildAuthUrl(): string {
    // This method is not used in mobile version
    throw new Error('OAuth not implemented for mobile');
  }

  async signIn(): Promise<GoogleUser | null> {
    try {
      console.log('🔑 Starting mobile sign-in...');
      
      // For mobile demo, create a mock user
      const mockUser: GoogleUser = {
        id: 'mobile-user-123',
        email: 'mobile@example.com',
        name: 'Mobile User',
        photo: undefined,
      };
      
      const mockToken = 'mobile-demo-token-123';
      
      // Set the user as authenticated
      await this.setAuthenticatedUser(mockUser, mockToken);
      
      console.log('✅ Mobile sign-in successful (demo mode)');
      return mockUser;
      
    } catch (error) {
      console.error('❌ Mobile Sign-In Error:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      this.clearStoredAuth();
      
      // Clear any stored OAuth data
      await Storage.removeItem('temp_auth_code');
      await Storage.removeItem('oauth_completion_time');
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    return this.currentUser;
  }

  async isSignedIn(): Promise<boolean> {
    const isSignedIn = !!this.currentUser;
    console.log('🔐 isSignedIn check:', { 
      hasUser: !!this.currentUser, 
      userEmail: this.currentUser?.email,
      hasToken: !!this.accessToken 
    });
    return isSignedIn;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Method to handle OAuth callback and set user
  async setAuthenticatedUser(user: GoogleUser, token: string) {
    this.currentUser = user;
    this.accessToken = token;
    
    // Store in Storage for persistence
    await Storage.setItem('google_auth_user', JSON.stringify(user));
    await Storage.setItem('google_auth_token', token);
    
    if (this.accessToken) {
      GoogleDriveService.setAccessToken(this.accessToken);
    }
  }

  // Load stored authentication from Storage
  private async loadStoredAuth() {
    try {
      const storedUser = await Storage.getItem('google_auth_user');
      const storedToken = await Storage.getItem('google_auth_token');
      
      console.log('🔍 Checking stored auth:', { 
        hasUser: !!storedUser, 
        hasToken: !!storedToken,
        user: storedUser ? JSON.parse(storedUser) : null 
      });
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.accessToken = storedToken;
        GoogleDriveService.setAccessToken(this.accessToken);
        console.log('✅ Loaded stored authentication for:', this.currentUser?.email);
      } else {
        console.log('❌ No stored authentication found');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
      this.clearStoredAuth();
    }
  }

  // Clear stored authentication
  private async clearStoredAuth() {
    await Storage.removeItem('google_auth_user');
    await Storage.removeItem('google_auth_token');
    this.currentUser = null;
    this.accessToken = null;
  }

  // Check for OAuth completion when app loads
  private async checkForOAuthCompletion() {
    // OAuth not implemented for mobile yet
    console.log('⚠️ OAuth completion check not implemented for mobile');
  }

  // Process the authorization code
  private async processAuthCode(authCode: string) {
    // OAuth not implemented for mobile yet
    console.log('⚠️ OAuth processing not implemented for mobile');
  }
}

export default new GoogleAuthService();
