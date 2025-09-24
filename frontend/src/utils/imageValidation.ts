/**
 * Converts Google Drive sharing URL to direct image URL
 */
export const convertGoogleDriveUrl = (url: string): string => {
  // Extract file ID from Google Drive URL
  const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    // Try multiple Google Drive direct URL formats
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return url; // Return original URL if not a Google Drive URL
};

/**
 * Alternative Google Drive URL formats for better compatibility
 */
export const getGoogleDriveAlternatives = (url: string): string[] => {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return [
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://docs.google.com/uc?export=download&id=${fileId}`
    ];
  }
  return [url];
};

/**
 * Checks if URL is a Google Drive link
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com') && url.includes('/file/d/');
};

/**
 * Checks if URL is from a supported image hosting platform
 */
export const isSupportedImageHost = (url: string): boolean => {
  const supportedHosts = [
    'drive.google.com',
    'imgur.com',
    'i.imgur.com',
    'dropbox.com',
    'dl.dropboxusercontent.com',
    'github.com',
    'raw.githubusercontent.com',
    'imageshack.com',
    'photobucket.com',
    'flickr.com',
    'amazonaws.com',
    'cloudinary.com',
    'unsplash.com',
    'pexels.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return supportedHosts.some(host => urlObj.hostname.includes(host));
  } catch {
    return false;
  }
};

/**
 * Validates if an image URL is publicly accessible
 */
export const validateImageUrl = async (url: string): Promise<{ isValid: boolean; error?: string; directUrl?: string }> => {
  if (!url || !url.trim()) {
    return { isValid: true }; // Empty URL is valid (optional field)
  }

  try {
    // Basic URL validation
    new URL(url);
    
    let directUrl = url;
    let isGoogleDrive = false;
    
    // Handle Google Drive URLs
    if (isGoogleDriveUrl(url)) {
      directUrl = convertGoogleDriveUrl(url);
      isGoogleDrive = true;
    }
    
    // For Google Drive and other special URLs, we'll do a different validation approach
    if (isGoogleDrive || !isSupportedImageHost(url)) {
      // Try to load the image to check if it's accessible
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS for better error handling
        
        img.onload = () => {
          resolve({ 
            isValid: true, 
            directUrl: isGoogleDrive ? directUrl : url 
          });
        };
        
        img.onerror = async (event) => {
          if (isGoogleDrive) {
            // Try alternative Google Drive URL formats
            const alternatives = getGoogleDriveAlternatives(url);
            let workingUrl = null;
            
            for (const altUrl of alternatives) {
              try {
                const testImg = new Image();
                const testPromise = new Promise((testResolve) => {
                  testImg.onload = () => testResolve({ success: true, url: altUrl });
                  testImg.onerror = () => testResolve({ success: false });
                  testImg.src = altUrl;
                });
                
                const result = await testPromise;
                if (result.success) {
                  workingUrl = result.url;
                  break;
                }
              } catch (e) {
                // Continue to next alternative
              }
            }
            
            if (workingUrl) {
              resolve({ 
                isValid: true, 
                directUrl: workingUrl,
                error: 'Found working Google Drive URL format. Preview should work now.'
              });
            } else {
              resolve({ 
                isValid: false, 
                error: 'Google Drive image is not publicly accessible. Please:\n1. Right-click the file in Google Drive\n2. Select "Share" → "Change to anyone with the link"\n3. Set permission to "Viewer"\n4. Copy the new sharing link'
              });
            }
          } else {
            resolve({ 
              isValid: false, 
              error: 'Image URL is not accessible or does not contain a valid image'
            });
          }
        };
        
        img.src = directUrl;
      });
    }
    
    // Standard validation for regular image URLs
    const response = await fetch(directUrl, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!response.ok) {
      return { 
        isValid: false, 
        error: `Image URL returned status ${response.status}: ${response.statusText}` 
      };
    }

    // Check if it's an image by looking at content-type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return { 
        isValid: false, 
        error: 'URL does not point to an image file' 
      };
    }

    return { isValid: true, directUrl: url };
  } catch (error: any) {
    return { 
      isValid: false, 
      error: `Failed to validate image URL: ${error.message}` 
    };
  }
};

/**
 * Validates image URL format
 */
export const validateImageUrlFormat = (url: string): { isValid: boolean; error?: string } => {
  if (!url || !url.trim()) {
    return { isValid: true }; // Empty URL is valid (optional field)
  }

  try {
    const urlObj = new URL(url);
    
    // Check if it's HTTP or HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { 
        isValid: false, 
        error: 'Image URL must use HTTP or HTTPS protocol' 
      };
    }

    // Special handling for Google Drive URLs
    if (isGoogleDriveUrl(url)) {
      return { isValid: true }; // Google Drive URLs don't need extension validation
    }

    // Special handling for other supported platforms
    if (isSupportedImageHost(url)) {
      return { isValid: true }; // Supported platforms don't need extension validation
    }

    // Check for common image file extensions (only for direct image URLs)
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    
    if (!hasImageExtension) {
      return { 
        isValid: false, 
        error: 'URL should point to an image file (.jpg, .png, .gif, .webp, .svg, .bmp) or use a supported hosting platform (Google Drive, Imgur, etc.)' 
      };
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid URL format' 
    };
  }
};
