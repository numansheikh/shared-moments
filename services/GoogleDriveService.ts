export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  size: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
    console.log('🔑 Google Drive access token set');
  }

  private async makeDriveRequest(endpoint: string, params?: Record<string, string>) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const url = new URL(`https://www.googleapis.com/drive/v3/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async listPhotosInFolder(folderId: string): Promise<DrivePhoto[]> {
    try {
      console.log('📁 Listing photos in folder:', folderId);
      
      // Extract folder ID from full URL if needed
      const actualFolderId = folderId.includes('folders/') 
        ? folderId.split('folders/')[1].split('?')[0]
        : folderId;

      const params: Record<string, string> = {
        q: `'${actualFolderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,thumbnailLink,webContentLink,size)',
        pageSize: '100', // Limit to 100 photos for now
      };

      const response = await this.makeDriveRequest('files', params);
      
      // Filter for image files
      const imageFiles = response.files.filter((file: any) => 
        file.mimeType.startsWith('image/')
      );

      console.log(`✅ Found ${imageFiles.length} photos in folder`);
      
      const photos = imageFiles.map((file: any) => {
        // Create thumbnail URL without access token (we'll pass it via headers)
        const imageUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`;
        
        const photo = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          thumbnailLink: imageUrl, // Use thumbnail URL without access token
          webContentLink: file.webContentLink ? `${file.webContentLink}&access_token=${this.accessToken}` : null,
          size: file.size,
        };
        
        console.log(`📸 Photo "${file.name}":`, {
          id: photo.id,
          imageUrl: photo.thumbnailLink,
          webContentLink: photo.webContentLink,
          mimeType: photo.mimeType
        });
        
        return photo;
      });
      
      return photos;

    } catch (error) {
      console.error('❌ Error listing photos:', error);
      throw error;
    }
  }

  async getPhotoDownloadUrl(photoId: string): Promise<string> {
    try {
      const response = await this.makeDriveRequest(`files/${photoId}`, {
        fields: 'webContentLink',
      });

      if (response.webContentLink) {
        // Add access token to the download URL
        return `${response.webContentLink}&access_token=${this.accessToken}`;
      }

      throw new Error('No download link available for photo');
    } catch (error) {
      console.error('❌ Error getting photo download URL:', error);
      throw error;
    }
  }

  async getPhotoThumbnail(photoId: string, width: number = 800): Promise<string> {
    try {
      // Use the thumbnail API for better performance
      const response = await this.makeDriveRequest(`files/${photoId}`, {
        fields: 'thumbnailLink',
      });

      if (response.thumbnailLink) {
        // Customize thumbnail size
        const baseUrl = response.thumbnailLink.split('=')[0];
        return `${baseUrl}=w${width}-h${width}-c`;
      }

      // Fallback to web content link
      return this.getPhotoDownloadUrl(photoId);
    } catch (error) {
      console.error('❌ Error getting photo thumbnail:', error);
      throw error;
    }
  }

  async listFoldersInFolder(folderId: string): Promise<any[]> {
    try {
      console.log('📁 Listing folders in folder:', folderId);
      
      const params: Record<string, string> = {
        q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,mimeType)',
        pageSize: '100',
      };

      const response = await this.makeDriveRequest('files', params);
      
      console.log(`✅ Found ${response.files.length} folders`);
      
      return response.files.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        mimeType: folder.mimeType,
      }));

    } catch (error) {
      console.error('❌ Error listing folders:', error);
      throw error;
    }
  }
}

export default new GoogleDriveService();
