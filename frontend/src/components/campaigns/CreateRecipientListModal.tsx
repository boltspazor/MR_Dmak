import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { validateTemplateRecipientCSV, extractTemplateParameters, escapeCSV } from '../../utils/csvValidation';

interface CreateRecipientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRecipientList: (data: {
    name: string;
    description: string;
    csvFile: File;
  }) => Promise<void>;
  showError: (title: string, message: string, isSuccess?: boolean) => void;
  mrs: any[];
  selectedTemplate?: any;
}

const CreateRecipientListModal: React.FC<CreateRecipientListModalProps> = ({
  isOpen,
  onClose,
  onCreateRecipientList,
  showError,
  mrs,
  selectedTemplate
}) => {
  const [recipientListName, setRecipientListName] = useState('');
  const [recipientListDescription, setRecipientListDescription] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  const handleClose = () => {
    setRecipientListName('');
    setRecipientListDescription('');
    setCsvFile(null);
    setCsvData([]);
    setShowCsvPreview(false);
    onClose();
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedTemplate) {
      showError('No Template Selected', 'Please select a template before uploading a recipient list.');
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

      // Validate CSV using shared utility
      const validation = validateTemplateRecipientCSV(csvData, {
        templateName: selectedTemplate.name,
        templateParameters: selectedTemplate.parameters || [],
        mrs: mrs
      });
      
      if (!validation.isValid) {
        const numberedErrors = validation.errors.map((error, index) => `${index + 1}. ${error}`).join('\n\n');
        showError('CSV Validation Failed', numberedErrors);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.join('\n\n');
        showError('CSV Validation Warnings', warningMessage, false);
      }

      // If validation passes, process the CSV
      console.log('CSV upload successful, data:', csvData);
      setCsvData(csvData);
      setCsvFile(file);
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
  };

  const handleCreate = async () => {
    if (!recipientListName.trim() || !csvFile) {
      showError('Missing Information', 'Please provide a name and upload a CSV file');
      return;
    }

    try {
      await onCreateRecipientList({
        name: recipientListName,
        description: recipientListDescription,
        csvFile
      });
      handleClose();
    } catch (error) {
      console.error('Error creating recipient list:', error);
      showError('Error', 'Failed to create recipient list');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create Recipient List</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Recipient List Name */}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={recipientListDescription}
              onChange={(e) => setRecipientListDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter description (optional)"
            />
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
                <span className="text-sm text-gray-600">Click to upload CSV file</span>
              </label>

              {csvFile && (
                <p className="text-sm text-green-600">
                  File selected: {csvFile.name}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If you have not done so, Download the corresponding Recipient List Template from Template Management Screen. Fill the template with list of MRs this campaign should be directed to. Come back to this screen and upload.
            </p>
          </div>

          {/* CSV Preview */}
          {showCsvPreview && csvData.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ CSV Preview (first 5 rows):</h4>
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
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                📋 No CSV preview available. Upload a CSV file to see preview.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Recipient List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRecipientListModal;
