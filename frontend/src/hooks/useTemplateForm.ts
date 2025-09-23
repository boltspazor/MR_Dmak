import { useState, useCallback } from 'react';
import { Template } from '../types';
import { api } from '../lib/api';

export interface TemplateFormData {
  name: string;
  content: string;
  type: 'html' | 'text' | 'image';
  imageUrl: string;
  imageFileName: string;
  footerImageUrl: string;
  footerImageFileName: string;
  parameters: Array<{name: string, type: 'text' | 'number'}> | string[]; // Support both new format and legacy
}

export interface UseTemplateFormReturn {
  formData: TemplateFormData;
  setFormData: React.Dispatch<React.SetStateAction<TemplateFormData>>;
  uploadedImage: File | null;
  setUploadedImage: React.Dispatch<React.SetStateAction<File | null>>;
  imagePreview: string;
  setImagePreview: React.Dispatch<React.SetStateAction<string>>;
  imagePlacement: 'header' | 'footer';
  setImagePlacement: React.Dispatch<React.SetStateAction<'header' | 'footer'>>;
  editingTemplate: Template | null;
  setEditingTemplate: React.Dispatch<React.SetStateAction<Template | null>>;
  resetForm: () => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadImage: (file: File, type: 'header' | 'footer') => Promise<{
    imageUrl: string;
    imageFileName: string;
    originalName: string;
  }>;
  handleEdit: (template: Template) => void;
  handleSubmit: (e: React.FormEvent, onCreate: (data: any) => Promise<void>, onUpdate: (id: string, data: any) => Promise<void>) => Promise<void>;
}

const initialFormData: TemplateFormData = {
  name: '',
  content: '',
  type: 'text',
  imageUrl: '',
  imageFileName: '',
  footerImageUrl: '',
  footerImageFileName: '',
  parameters: []
};

export const useTemplateForm = (): UseTemplateFormReturn => {
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imagePlacement, setImagePlacement] = useState<'header' | 'footer'>('header');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setUploadedImage(null);
    setImagePreview('');
    setImagePlacement('header');
    setEditingTemplate(null);
  }, []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const uploadImage = useCallback(async (file: File, type: 'header' | 'footer') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const response = await api.post('/templates/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        imageUrl: response.data.data.imageUrl,
        imageFileName: response.data.data.imageFileName,
        originalName: response.data.data.originalName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, []);

  const handleEdit = useCallback((template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      type: template.type,
      imageUrl: template.imageUrl || '',
      imageFileName: template.imageFileName || '',
      footerImageUrl: template.footerImageUrl || '',
      footerImageFileName: template.footerImageFileName || '',
      parameters: template.parameters
    });
    // Set preview image and placement for editing
    if (template.imageUrl) {
      setImagePreview(template.imageUrl);
      setImagePlacement('header');
    } else if (template.footerImageUrl) {
      setImagePreview(template.footerImageUrl);
      setImagePlacement('footer');
    } else {
      setImagePreview('');
      setImagePlacement('header');
    }
  }, []);

  const handleSubmit = useCallback(async (
    e: React.FormEvent,
    onCreate: (data: any) => Promise<void>,
    onUpdate: (id: string, data: any) => Promise<void>
  ) => {
    e.preventDefault();
    
    try {
      let imageUrl = formData.imageUrl;
      let imageFileName = formData.imageFileName;
      let footerImageUrl = formData.footerImageUrl;
      let footerImageFileName = formData.footerImageFileName;

      // Upload image if it exists
      if (uploadedImage) {
        console.log(`Uploading ${imagePlacement} image...`);
        const uploadResult = await uploadImage(uploadedImage, imagePlacement);

        if (imagePlacement === 'header') {
          imageUrl = uploadResult.imageUrl;
          imageFileName = uploadResult.imageFileName;
          // Clear footer image when uploading as header
          footerImageUrl = '';
          footerImageFileName = '';
        } else {
          footerImageUrl = uploadResult.imageUrl;
          footerImageFileName = uploadResult.imageFileName;
          // Clear header image when uploading as footer
          imageUrl = '';
          imageFileName = '';
        }
        console.log(`${imagePlacement} image uploaded:`, uploadResult);
      } else {
        // Use existing images if available
        if (formData.imageUrl) {
          console.log('Using existing header image URL:', formData.imageUrl);
          imageUrl = formData.imageUrl;
          imageFileName = formData.imageFileName;
        }
        if (formData.footerImageUrl) {
          console.log('Using existing footer image URL:', formData.footerImageUrl);
          footerImageUrl = formData.footerImageUrl;
          footerImageFileName = formData.footerImageFileName;
        }
      }

      // Extract parameters from content if not provided
      let extractedParameters = formData.parameters || [];
      if (!formData.parameters && formData.content) {
        const paramMatches = formData.content.match(/#[A-Za-z0-9_]+/g);
        if (paramMatches) {
          extractedParameters = [...new Set(paramMatches.map((param: string) => param.substring(1)))];
        }
      }

      const templateData = {
        name: formData.name,
        content: formData.content,
        type: formData.type,
        imageUrl: imageUrl || '',
        imageFileName: imageFileName || '',
        footerImageUrl: footerImageUrl || '',
        footerImageFileName: footerImageFileName || '',
        parameters: extractedParameters
      };

      console.log('Creating template with data:', templateData);

      if (editingTemplate) {
        console.log('Updating template:', editingTemplate.name);
        await onUpdate(editingTemplate._id, templateData);
      } else {
        console.log('Creating new template...');
        await onCreate(templateData);
      }

      resetForm();
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      throw error;
    }
  }, [formData, uploadedImage, imagePlacement, editingTemplate, uploadImage, resetForm]);

  return {
    formData,
    setFormData,
    uploadedImage,
    setUploadedImage,
    imagePreview,
    setImagePreview,
    imagePlacement,
    setImagePlacement,
    editingTemplate,
    setEditingTemplate,
    resetForm,
    handleImageUpload,
    uploadImage,
    handleEdit,
    handleSubmit
  };
};
