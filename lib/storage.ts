import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload an image file to Firebase Storage
 * @param file - The image file to upload
 * @param path - Storage path (e.g., 'tattoos/userId/tattooId.jpg')
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Delete an image from Firebase Storage
 * @param imageUrl - The full URL of the image to delete
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
    if (path) {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    }
  } catch (error: any) {
    // Ignore "object not found" errors – the file is already gone, which is fine
    if (error && typeof error === 'object' && error.code === 'storage/object-not-found') {
      return;
    }
    // Don't throw - deletion failures shouldn't break the app, but log others
    console.error('Error deleting image:', error);
  }
}

/**
 * Generate a unique path for tattoo images
 * @param userId - Firebase Auth user ID
 * @param tattooId - Tattoo document ID
 * @param fileName - Original file name
 * @returns Storage path
 */
export function getTattooImagePath(userId: string, tattooId: string, fileName: string): string {
  const extension = fileName.split('.').pop();
  const timestamp = Date.now();
  return `tattoos/${userId}/${tattooId}_${timestamp}.${extension}`;
}


