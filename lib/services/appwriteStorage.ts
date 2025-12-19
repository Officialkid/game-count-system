/**
 * Appwrite Storage Service
 * 
 * Handles file uploads for team avatars and event logos
 * Phase E: Assets (Storage)
 */

import { storage, client } from '@/lib/appwrite';
import { ID, Permission, Role } from 'appwrite';

const BUCKETS = {
  AVATARS: 'avatars',
  LOGOS: 'logos',
};

export interface UploadResult {
  success: boolean;
  data?: {
    fileId: string;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  };
  error?: string;
}

/**
 * Upload an event logo to Appwrite Storage
 * 
 * @param file - The file to upload (PNG, JPG)
 * @param userId - The user ID for permissions
 * @param eventId - Optional event ID to associate with the logo
 * @returns UploadResult with file URL and metadata
 */
export async function uploadEventLogo(
  file: File,
  userId: string,
  eventId?: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      return {
        success: false,
        error: 'Invalid file type. Only PNG and JPG images are allowed.',
      };
    }

    // Validate file size (10MB max)
    const maxSizeMB = 10;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return {
        success: false,
        error: `File size exceeds ${maxSizeMB}MB limit (current: ${sizeMB.toFixed(2)}MB)`,
      };
    }

    // Generate unique file ID with optional event prefix
    const fileId = eventId ? `event-${eventId}-${ID.unique()}` : ID.unique();

    // Set permissions: owner can read/update/delete
    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];

    // Upload to Appwrite Storage
    const uploadedFile = await storage.createFile(
      BUCKETS.LOGOS,
      fileId,
      file,
      permissions
    );

    // Get file preview URL (optimized for web display)
    const fileUrl = getFilePreviewUrl(BUCKETS.LOGOS, uploadedFile.$id);

    return {
      success: true,
      data: {
        fileId: uploadedFile.$id,
        fileUrl,
        fileName: uploadedFile.name,
        mimeType: uploadedFile.mimeType,
        sizeBytes: uploadedFile.sizeOriginal,
      },
    };
  } catch (err: any) {
    console.error('Error uploading event logo:', err);
    return {
      success: false,
      error: err.message || 'Failed to upload logo',
    };
  }
}

/**
 * Upload a team avatar to Appwrite Storage
 * 
 * @param file - The file to upload (PNG, JPG)
 * @param userId - The user ID for permissions
 * @param teamId - Optional team ID to associate with the avatar
 * @returns UploadResult with file URL and metadata
 */
export async function uploadTeamAvatar(
  file: File,
  userId: string,
  teamId?: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      return {
        success: false,
        error: 'Invalid file type. Only PNG and JPG images are allowed.',
      };
    }

    // Validate file size (5MB max for avatars)
    const maxSizeMB = 5;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return {
        success: false,
        error: `File size exceeds ${maxSizeMB}MB limit (current: ${sizeMB.toFixed(2)}MB)`,
      };
    }

    // Generate unique file ID with optional team prefix
    const fileId = teamId ? `team-${teamId}-${ID.unique()}` : ID.unique();

    // Set permissions: owner can read/update/delete
    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];

    // Upload to Appwrite Storage
    const uploadedFile = await storage.createFile(
      BUCKETS.AVATARS,
      fileId,
      file,
      permissions
    );

    // Get file preview URL (optimized for avatars)
    const fileUrl = getFilePreviewUrl(BUCKETS.AVATARS, uploadedFile.$id, 200, 200);

    return {
      success: true,
      data: {
        fileId: uploadedFile.$id,
        fileUrl,
        fileName: uploadedFile.name,
        mimeType: uploadedFile.mimeType,
        sizeBytes: uploadedFile.sizeOriginal,
      },
    };
  } catch (err: any) {
    console.error('Error uploading team avatar:', err);
    return {
      success: false,
      error: err.message || 'Failed to upload avatar',
    };
  }
}

/**
 * Delete a file from storage
 * 
 * @param bucketId - The bucket ID ('logos' or 'avatars')
 * @param fileId - The file ID to delete
 * @returns Success status
 */
export async function deleteFile(bucketId: string, fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await storage.deleteFile(bucketId, fileId);
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting file:', err);
    return {
      success: false,
      error: err.message || 'Failed to delete file',
    };
  }
}

/**
 * Get file preview URL from Appwrite Storage
 * 
 * @param bucketId - The bucket ID
 * @param fileId - The file ID
 * @param width - Optional width for preview (default: 800)
 * @param height - Optional height for preview (default: 600)
 * @param quality - Optional quality (0-100, default: 90)
 * @returns Preview URL string
 */
export function getFilePreviewUrl(
  bucketId: string,
  fileId: string,
  width: number = 800,
  height: number = 600,
  quality: number = 90
): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?width=${width}&height=${height}&quality=${quality}&project=${projectId}`;
}

/**
 * Get file download URL from Appwrite Storage
 * 
 * @param bucketId - The bucket ID
 * @param fileId - The file ID
 * @returns Download URL string
 */
export function getFileDownloadUrl(bucketId: string, fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`;
}

/**
 * Get file view URL from Appwrite Storage
 * 
 * @param bucketId - The bucket ID
 * @param fileId - The file ID
 * @returns View URL string
 */
export function getFileViewUrl(bucketId: string, fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
}

/**
 * List all files in a bucket (for admin purposes)
 * 
 * @param bucketId - The bucket ID
 * @param queries - Optional Appwrite queries for filtering
 * @returns List of files
 */
export async function listFiles(bucketId: string, queries?: string[]) {
  try {
    const files = await storage.listFiles(bucketId, queries);
    return {
      success: true,
      data: {
        files: files.files,
        total: files.total,
      },
    };
  } catch (err: any) {
    console.error('Error listing files:', err);
    return {
      success: false,
      error: err.message || 'Failed to list files',
    };
  }
}

export { BUCKETS };
