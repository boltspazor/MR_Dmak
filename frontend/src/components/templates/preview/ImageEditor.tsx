import React, { useState, useRef } from 'react';
import { Edit3, Save, Loader, CheckCircle, Upload, Trash2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Template } from '../../../types/index';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface ImageEditorProps {
  template: Template;
  onUpdateTemplate?: (templateId: string, updates: Partial<Template>) => Promise<void>;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ template, onUpdateTemplate }) => {
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if image is a WhatsApp CDN default image
  const isWhatsAppCDNImage = (url: string): boolean => {
    return url.includes('scontent.whatsapp.net') || url.startsWith('meta://');
  };

  // Check if template supports image headers by examining components
  const supportsImageHeader = (): boolean => {
    // For Meta templates, check if they have a HEADER component with IMAGE format
    if (template.isMetaTemplate && template.metaComponents) {
      return template.metaComponents.some((component: any) =>
        component.type === 'HEADER' && component.format === 'IMAGE'
      );
    }

    // For custom templates, check if it's an image template
    return template.type === 'image';
  };

  const isDefaultImage = template.imageUrl && isWhatsAppCDNImage(template.imageUrl);

  // If template doesn't support images, don't show the image editor at all
  if (!supportsImageHeader()) {
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !template) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await api.post(
        `/templates/img/${template._id}/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { imageUrl } = response.data;

      // Update parent component
      if (onUpdateTemplate) {
        await onUpdateTemplate(template._id, { imageUrl });
      }

      toast.success('Image uploaded successfully!');
      setIsEditingImage(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!template.imageUrl) return;

    const confirmed = window.confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/templates/img/${template._id}/delete-image`);

      // Update parent component
      if (onUpdateTemplate) {
        await onUpdateTemplate(template._id, { imageUrl: '' });
      }

      toast.success('Image deleted successfully!');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  if (!onUpdateTemplate) {
    return (
      <div className="text-sm">
        {template.imageUrl && template.imageUrl.trim() !== '' ? (
          <div className="space-y-2">
            <p className="text-gray-900 font-medium break-all">{template.imageUrl}</p>
            <p className="text-green-600 flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Image URL configured</span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500 italic">No image URL configured</p>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">Template Image:</span>
        <button
          onClick={() => {
            setIsEditingImage(!isEditingImage);
            if (isEditingImage) {
              setSelectedFile(null);
              setPreviewUrl(null);
            }
          }}
          className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-sm"
        >
          <Edit3 className="h-4 w-4" />
          <span>{isEditingImage ? 'Cancel' : 'Change'}</span>
        </button>
      </div>

      {/* Warning Banner for Default WhatsApp CDN Images */}
      {isDefaultImage && !isEditingImage && (
        <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900">Default Meta Image Detected</h4>
              <p className="text-xs text-red-700 mt-1">
                This image is hosted on WhatsApp's CDN and may not work reliably in campaigns. 
                Please upload a custom image for better delivery.
              </p>
              <button
                onClick={() => setIsEditingImage(true)}
                className="mt-2 inline-flex items-center space-x-1 text-xs font-medium text-red-800 hover:text-red-900 underline"
              >
                <Upload className="h-3 w-3" />
                <span>Upload Custom Image Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingImage ? (
        <div className="space-y-3">
          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
          >
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg"
                />
                <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile!.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Click to select image</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Button */}
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Image</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="text-sm">
          {template.imageUrl && template.imageUrl.trim() !== '' ? (
            <div className="space-y-3">
              {/* Image Preview */}
              <img
                src={template.imageUrl}
                alt="Template"
                className="w-full max-h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className={`text-xs ${isDefaultImage ? 'text-red-600' : 'text-green-600'}`}>
                    {isDefaultImage ? 'Default Meta Image' : 'Image configured'}
                  </span>
                </div>

                {!isDefaultImage && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-xs"
                  >
                    {deleting ? (
                      <Loader className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 break-all">{template.imageUrl}</p>
            </div>
          ) : (
            <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 italic">No image uploaded</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageEditor;
