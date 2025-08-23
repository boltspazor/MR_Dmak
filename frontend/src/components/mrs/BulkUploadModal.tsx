import React, { useState } from 'react';
import { ModalProps } from '../../types';
import mrsService from '../../services/mrs.service';
import { XMarkIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface BulkUploadModalProps extends ModalProps {
  onSuccess: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          droppedFile.type === 'application/vnd.ms-excel') {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      await mrsService.bulkUpload(file);
      setFile(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await mrsService.downloadTemplate();
    } catch (error: any) {
      console.error('Template download failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bulk Upload Medical Representatives</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Upload an Excel file (.xlsx or .xls) with medical representative data. 
                  Make sure to use the correct format.
                </p>
                
                <button
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary mb-4"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Template
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div>
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-success-500" />
                    <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setFile(null)}
                      className="mt-2 text-sm text-danger-600 hover:text-danger-500"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      Drop your Excel file here, or click to browse
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Supports .xlsx and .xls files
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-2 inline-flex cursor-pointer rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required Columns:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• <strong>mrId</strong> - Medical Representative ID</p>
                  <p>• <strong>firstName</strong> - First Name</p>
                  <p>• <strong>lastName</strong> - Last Name</p>
                  <p>• <strong>groupName</strong> - Group Name (must exist)</p>
                  <p>• <strong>phone</strong> - Phone Number</p>
                  <p>• <strong>comments</strong> - Comments (optional)</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="btn btn-primary"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload File'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
