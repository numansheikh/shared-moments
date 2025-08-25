import GoogleDriveService from './GoogleDriveService';

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
    this.checkForOAuthCompletion();
    this.loadStoredAuth();
  }

  private configureGoogleSignIn() {
    if (this.isConfigured) return;
    this.isConfigured = true;
    console.log('✅ Google OAuth 2.0 configured for web');
  }

  private buildAuthUrl(): string {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('REACT_APP_GOOGLE_CLIENT_ID not found in environment variables');
    }
    console.log('🔧 Client ID (from env):', clientId);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: 'http://localhost:8081/auth-callback.html',
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async signIn(): Promise<GoogleUser | null> {
    try {
      console.log('🔑 Starting OAuth 2.0 flow...');
      
      // Clear any existing tokens to force fresh OAuth
      this.currentUser = null;
      this.accessToken = null;
      localStorage.removeItem('temp_auth_code');
      localStorage.removeItem('oauth_completion_time');
      
      // Build the authorization URL
      const authUrl = this.buildAuthUrl();
      console.log('🔗 Auth URL:', authUrl);
      
      // Redirect to Google OAuth in the same window
      window.location.href = authUrl;
      
      // This will redirect away from the app, so we won't reach here
      return null;
      
    } catch (error) {
      console.error('❌ OAuth 2.0 Sign-In Error:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      this.clearStoredAuth();
      
      // Clear any stored OAuth data
      localStorage.removeItem('temp_auth_code');
      localStorage.removeItem('oauth_completion_time');
      
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
  setAuthenticatedUser(user: GoogleUser, token: string) {
    this.currentUser = user;
    this.accessToken = token;
    
    // Store in localStorage for persistence
    localStorage.setItem('google_auth_user', JSON.stringify(user));
    localStorage.setItem('google_auth_token', token);
    
    if (this.accessToken) {
      GoogleDriveService.setAccessToken(this.accessToken);
    }
  }

  // Load stored authentication from localStorage
  private loadStoredAuth() {
    try {
      const storedUser = localStorage.getItem('google_auth_user');
      const storedToken = localStorage.getItem('google_auth_token');
      
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
  private clearStoredAuth() {
    localStorage.removeItem('google_auth_user');
    localStorage.removeItem('google_auth_token');
    this.currentUser = null;
    this.accessToken = null;
  }

  // Check for OAuth completion when app loads
  private checkForOAuthCompletion() {
    const tempAuthCode = localStorage.getItem('temp_auth_code');
    const completionTime = localStorage.getItem('oauth_completion_time');
    
    if (tempAuthCode && completionTime) {
      const timeDiff = Date.now() - parseInt(completionTime);
      // Only process if completion was within last 5 minutes
      if (timeDiff < 5 * 60 * 1000) {
        console.log('🔐 Found recent OAuth completion, processing...');
        this.processAuthCode(tempAuthCode);
        
        // Clean up
        localStorage.removeItem('temp_auth_code');
        localStorage.removeItem('oauth_completion_time');
      } else {
        // Clean up expired codes
        localStorage.removeItem('temp_auth_code');
        localStorage.removeItem('oauth_completion_time');
      }
    }
  }

  // Process the authorization code
  private async processAuthCode(authCode: string) {
    try {
      console.log('🔄 Processing OAuth authorization code...');
      
      // Exchange authorization code for access token
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not found in environment variables');
      }
      
      console.log('🔧 Token exchange - Client ID:', clientId);
      console.log('🔧 Token exchange - Client Secret: ***');
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:8081/auth-callback.html',
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token exchange failed:', errorText);
        return;
      }
      
      const tokenData = await tokenResponse.json();
      console.log('✅ Access token received:', tokenData.access_token ? 'Yes' : 'No');
      
      // Store the access token
      this.accessToken = tokenData.access_token;
      
      // Get user info using the access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        
        const realUser: GoogleUser = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          photo: userInfo.picture,
        };
        
        console.log('✅ Real user authenticated:', realUser);
        
        // Use setAuthenticatedUser to store in localStorage
        this.setAuthenticatedUser(realUser, this.accessToken!);
        
        console.log('✅ OAuth completion processed successfully');
      } else {
        console.error('❌ Failed to get user info');
      }
      
    } catch (error) {
      console.error('❌ Error processing OAuth completion:', error);
    }
  }
}

export default new GoogleAuthService();
