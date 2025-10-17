/**
 * Utility functions for handling Google Drive URLs and file downloads
 */

/**
 * Converts a Google Drive shareable link to a direct download URL
 * @param shareableUrl - The Google Drive shareable link (e.g., https://drive.google.com/file/d/FILE_ID/view?usp=sharing)
 * @returns The direct download URL (e.g., https://drive.google.com/uc?export=download&id=FILE_ID)
 */
export const convertToDirectDownloadUrl = (shareableUrl: string): string => {
  // Extract file ID from the shareable URL
  const fileIdMatch = shareableUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);

  if (!fileIdMatch) {
    throw new Error('Invalid Google Drive shareable URL format');
  }

  const fileId = fileIdMatch[1];

  // Return the direct download URL
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

/**
 * Checks if a URL is a Google Drive shareable link
 * @param url - The URL to check
 * @returns True if the URL is a Google Drive shareable link
 */
export const isGoogleDriveShareableUrl = (url: string): boolean => {
  return url.includes('drive.google.com/file/d/') && url.includes('/view');
};

/**
 * Converts a Google Drive shareable link to a direct download URL if applicable
 * @param url - The URL to convert (returns original URL if not a Google Drive shareable link)
 * @returns The converted direct download URL or the original URL
 */
export const convertGoogleDriveUrl = (url: string): string => {
  if (isGoogleDriveShareableUrl(url)) {
    return convertToDirectDownloadUrl(url);
  }
  return url;
};
