import React, { useState } from 'react';
import { Upload, X, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Template } from '../../types';
import { api } from '../../lib/api';
import { validateTemplateRecipientCSV, extractTemplateParameters } from '../../utils/csvValidation';

interface TemplateRecipientUploadProps {
  template: Template;
  onUploadSuccess?: () => void;
  onClose?: () => void;
  showError?: (title: string, message: string, isError?: boolean) => void;
}

interface ValidationResults {
  validRecipients: any[];
  invalidRecipients: Array<{
    row: number;
    mrId: string;
    firstName: string;
    lastName: string;
    reason: string;
  }>;
  errors: string[];
}

const TemplateRecipientUpload: React.FC<TemplateRecipientUploadProps> = ({
  template,
  onUploadSuccess,
  onClose,
  showError
}) => {
  const [recipientListName, setRecipientListName] = useState('');
  const [recipientListDescription, setRecipientListDescription] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [showValidationResults, setShowValidationResults] = useState(false);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!template) {
      showError?.('Error', 'No template selected', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const csvData = lines.map(line => {
        // Handle CSV parsing with quotes
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      setCsvData(csvData);
      setCsvFile(file);
      setShowCsvPreview(true);
      setValidationResults(null);
      setShowValidationResults(false);
    };
    reader.readAsText(file);
  };

  // Using shared validation function from utils

  const handleUpload = async () => {
    if (!recipientListName.trim() || !csvFile || !template) {
      showError?.('Error', 'Please provide a name and upload a CSV file', true);
      return;
    }

    // Extract template parameters for validation
    const templateParameters = extractTemplateParameters(template.content);

    // Validate CSV format using shared utility
    const validation = validateTemplateRecipientCSV(csvData, {
      templateName: template.name,
      templateParameters
    });
    if (!validation.isValid) {
      const numberedErrors = validation.errors.map((error, index) => `${index + 1}. ${error}`).join('\n\n');
      showError?.('CSV Validation Failed', numberedErrors, true);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('templateId', template._id);
      formData.append('name', recipientListName);
      formData.append('description', recipientListDescription);
      formData.append('csvFile', csvFile);

      const response = await api.post('/template-recipients/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      if (result.success) {
        showError?.('Success', `Recipients uploaded successfully! ${result.data.recipientCount} recipients added.`, false);
        setRecipientListName('');
        setRecipientListDescription('');
        setCsvFile(null);
        setCsvData([]);
        setShowCsvPreview(false);
        onUploadSuccess?.();
        onClose?.();
      } else {
        if (result.validationResults) {
          setValidationResults(result.validationResults);
          setShowValidationResults(true);
        } else {
          showError?.('Upload Failed', result.error || 'Unknown error', true);
        }
      }
    } catch (error) {
      console.error('Error uploading recipients:', error);
      showError?.('Error', 'Failed to upload recipients', true);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setRecipientListName('');
    setRecipientListDescription('');
    setCsvFile(null);
    setCsvData([]);
    setShowCsvPreview(false);
    setValidationResults(null);
    setShowValidationResults(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Recipients for "{template.name}"
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Recipient List Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                List Name *
              </label>
              <input
                type="text"
                required
                value={recipientListName}
                onChange={(e) => setRecipientListName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter recipient list name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={recipientListDescription}
                onChange={(e) => setRecipientListDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter description (optional)"
              />
            </div>
          </div>

          {/* CSV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File *
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors"
              >
                <Upload className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {csvFile ? `File selected: ${csvFile.name}` : 'Click to upload CSV file'}
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              CSV format: Row 1 = Template Name, Row 2 = Headers (MR ID, First Name, Last Name, + parameters), Row 3+ = Data
            </p>
          </div>

          {/* CSV Preview */}
          {showCsvPreview && csvData.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">CSV Preview (first 5 rows):</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvData[0]?.map((header: string, index: number) => (
                        <th key={index} className="px-3 py-2 text-left font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(1, 6).map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className="border-t">
                        {row.map((cell: string, cellIndex: number) => (
                          <td key={cellIndex} className="px-3 py-2 text-gray-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {showValidationResults && validationResults && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h4 className="text-sm font-semibold text-red-800">Validation Failed</h4>
              </div>
              
              {validationResults.errors.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-700 mb-2">Format Errors:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {validationResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.invalidRecipients.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-2">
                    Invalid Recipients ({validationResults.invalidRecipients.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationResults.invalidRecipients.slice(0, 10).map((invalid, index) => (
                        <li key={index}>
                          • Row {invalid.row}: {invalid.mrId} - {invalid.firstName} {invalid.lastName} ({invalid.reason})
                        </li>
                      ))}
                      {validationResults.invalidRecipients.length > 10 && (
                        <li>... and {validationResults.invalidRecipients.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!recipientListName.trim() || !csvFile || uploading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Upload Recipients
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateRecipientUpload;
