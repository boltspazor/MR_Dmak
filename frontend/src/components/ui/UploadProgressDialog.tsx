import React from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    currentBatch: number;
    totalBatches: number;
  };
  status: 'uploading' | 'completed' | 'error';
  message?: string;
  errors?: string[];
}

const UploadProgressDialog: React.FC<UploadProgressDialogProps> = ({
  isOpen,
  onClose,
  progress,
  status,
  message,
  errors = []
}) => {
  if (!isOpen) return null;

  const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
  const batchProgress = progress.totalBatches > 0 ? (progress.currentBatch / progress.totalBatches) * 100 : 0;

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
              {status === 'uploading' ? 'Uploading MRs...' : 
               status === 'completed' ? 'Upload Complete!' : 'Upload Error'}
            </h3>
          </div>
          {status === 'completed' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex flex-wrap justify-between text-sm text-gray-600 mb-1">
              <span className="truncate max-w-[60%]">Overall Progress</span>
              <span className="truncate max-w-[35%] text-right">{progress.processed} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Batch Progress */}
          {progress.totalBatches > 1 && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Batch Progress</span>
                <span>{progress.currentBatch} / {progress.totalBatches}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{progress.successful}</div>
              <div className="text-sm text-green-600">Successful</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{progress.processed}</div>
              <div className="text-sm text-blue-600">Processed</div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {/* Error Details */}
        {errors && errors.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h4 className="text-sm font-semibold text-red-600">Error Details:</h4>
            </div>
            <div className="max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="space-y-1">
                {errors.slice(0, 20).map((error, index) => (
                  <div key={index} className="text-xs text-red-700 font-mono">
                    {error}
                  </div>
                ))}
                {errors.length > 20 && (
                  <div className="text-xs text-red-600 font-semibold mt-2">
                    ... and {errors.length - 20} more errors
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end mt-6">
          {status === 'completed' ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          ) : status === 'error' ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          ) : (
            <div className="text-sm text-gray-500 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing... Please wait
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgressDialog;
