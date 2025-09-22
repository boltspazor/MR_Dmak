import React from 'react';
import { X, Upload } from 'lucide-react';
import { AvailableParameters } from '../../types';
import { TemplateFormData } from '../../hooks/useTemplateForm';

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  availableParameters: AvailableParameters | null;
  formData: TemplateFormData;
  setFormData: React.Dispatch<React.SetStateAction<TemplateFormData>>;
  imagePreview: string;
  imagePlacement: 'header' | 'footer';
  setImagePlacement: React.Dispatch<React.SetStateAction<'header' | 'footer'>>;
  editingTemplate: any;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableParameters,
  formData,
  setFormData,
  imagePreview,
  imagePlacement,
  setImagePlacement,
  editingTemplate,
  onImageUpload
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
        
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter template name"
              />
            </div>

            {/* Image Upload with Placement Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Image (Optional)
              </label>

              {/* Image Placement Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Image Placement:
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="imagePlacement"
                      value="header"
                      checked={imagePlacement === 'header'}
                      onChange={(e) => setImagePlacement(e.target.value as 'header' | 'footer')}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Header</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="imagePlacement"
                      value="footer"
                      checked={imagePlacement === 'footer'}
                      onChange={(e) => setImagePlacement(e.target.value as 'header' | 'footer')}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Footer</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Click to upload {imagePlacement} image</span>
                </label>
              </div>
            </div>

            {/* Template Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                placeholder="Enter template content with parameters like #FirstName, #LastName, #Month, #Target..."
              />

            {/* Available Parameters */}
            {availableParameters && availableParameters.parameters.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Available Parameters from Recipient Lists:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableParameters.parameters.map((param, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const newContent = formData.content + param;
                        setFormData({ ...formData, content: newContent });
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 cursor-pointer"
                    >
                      {param}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click on parameters to add them to your template
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Use #ParameterName for dynamic parameters (e.g., #FN, #LN, #Month, #Target)
            </p>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Live Preview
            </label>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="bg-white rounded-2xl rounded-tl-md shadow-sm max-w-sm mx-auto">
                {((imagePreview && imagePlacement === 'header') || formData.imageUrl) && (
                  <div className="w-full">
                    <img
                      src={imagePreview || formData.imageUrl}
                      alt="Header"
                      className="w-full h-24 object-cover rounded-t-2xl"
                    />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap">
                    {(() => {
                      if (!formData.content) return 'Start typing your template...';

                      let processedContent = formData.content;

                      // Sample parameter values for live preview
                      const sampleParams = {
                        'FirstName': 'John',
                        'LastName': 'Doe',
                        'MRId': 'MR001',
                        'GroupName': 'North Zone',
                        'PhoneNumber': '+919876543210',
                        'Name': 'John Doe',
                        'Company': 'D-MAK',
                        'Product': 'New Product',
                        'Date': new Date().toLocaleDateString(),
                        'Time': new Date().toLocaleTimeString(),
                        'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
                        'Year': new Date().getFullYear().toString(),
                        'Target': '100',
                        'Achievement': '85',
                        'Location': 'Mumbai',
                        'City': 'Mumbai',
                        'State': 'Maharashtra',
                        'Country': 'India'
                      };

                      // Replace parameters with sample values
                      for (const [param, value] of Object.entries(sampleParams)) {
                        const regex = new RegExp(`#${param}\\b`, 'g');
                        processedContent = processedContent.replace(regex, value);
                      }

                      // Replace any remaining parameters with [Sample Value]
                      processedContent = processedContent.replace(/#[A-Za-z0-9_]+/g, '[Sample Value]');

                      return processedContent;
                    })()}
                  </div>
                </div>
                {((imagePreview && imagePlacement === 'footer') || formData.footerImageUrl) && (
                  <div className="px-3 pb-3">
                    <img
                      src={imagePreview || formData.footerImageUrl}
                      alt="Footer"
                      className="w-full h-16 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;
