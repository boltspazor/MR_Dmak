import React, { useState } from 'react';
import { Upload, X, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Template } from '../../types';
import { api } from '../../lib/api';
import { extractCleanRecipientData, extractTemplateParameters } from '../../utils/csvValidation';

interface TemplateRecipientUploadV2Props {
  template: Template;
  onUploadSuccess?: () => void;
  onClose?: () => void;
  showError?: (title: string, message: string, isError?: boolean) => void;
}

const TemplateRecipientUploadV2: React.FC<TemplateRecipientUploadV2Props> = ({
  template,
  onUploadSuccess,
  onClose,
  showError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [recipientListName, setRecipientListName] = useState('');
  const [description, setDescription] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setValidationResults(null);
    }
  };

  const handleUpload = async () => {
    if (!csvFile || !recipientListName.trim()) {
      showError?.('Validation Error', 'Please select a CSV file and enter a recipient list name', true);
      return;
    }

    setIsUploading(true);
    try {
      // Parse CSV
      const csvText = await csvFile.text();
      const lines = csvText.split('\n').filter(line => line.trim());
      const csvData = lines.map(line => 
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );

      // Get template parameters
      const templateParameters = extractTemplateParameters(template.content);
      console.log('Template parameters extracted:', {
        templateContent: template.content,
        templateParameters
      });

      // Extract clean recipient data (no MR validation - done in backend)
      const { recipients, errors } = extractCleanRecipientData(csvData, templateParameters);

      if (errors.length > 0) {
        setValidationResults({ errors, recipients: [] });
        showError?.('Validation Failed', errors.join('\n'), true);
        return;
      }

      if (recipients.length === 0) {
        showError?.('No Valid Recipients', 'No valid recipients found in the CSV file', true);
        return;
      }

      // Upload to backend
      const response = await api.post('/template-recipients/upload-v2', {
        templateId: template._id,
        name: recipientListName.trim(),
        description: description.trim(),
        recipients
      });

      if (response.data.success) {
        showError?.('Success', `Successfully uploaded ${recipients.length} recipients`, false);
        onUploadSuccess?.();
        onClose?.();
      } else {
        showError?.('Upload Failed', response.data.error || 'Failed to upload recipients', true);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showError?.('Upload Error', error.response?.data?.error || 'Failed to upload recipients', true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Recipient List - {template.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Template Information</h3>
            <p className="text-sm text-blue-700">
              <strong>Content:</strong> {template.content}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Parameters:</strong> {extractTemplateParameters(template.content).join(', ') || 'None'}
            </p>
          </div>

          {/* Recipient List Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient List Name *
            </label>
            <input
              type="text"
              value={recipientListName}
              onChange={(e) => setRecipientListName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a name for this recipient list"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a description for this recipient list"
            />
          </div>

          {/* CSV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CSV File *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="csv-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a CSV file</span>
                    <input
                      id="csv-upload"
                      name="csv-upload"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
            {csvFile && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                {csvFile.name}
              </div>
            )}
          </div>

          {/* CSV Format Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Row 1: Template name</li>
              <li>• Row 2: Column headers (TemplateName, MR ID, First Name, Last Name{extractTemplateParameters(template.content).length > 0 ? ', ' + extractTemplateParameters(template.content).join(', ') : ''})</li>
              <li>• Row 3+: Data rows with MR information and parameter values</li>
              <li>• <strong>Note:</strong> MR validation will be done in backend - just provide the data</li>
            </ul>
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Validation Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationResults.errors.map((error: string, index: number) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || !csvFile || !recipientListName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload Recipients'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateRecipientUploadV2;
