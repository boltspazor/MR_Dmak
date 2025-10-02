import React from 'react';

interface MRActionButtonsProps {
  onAddIndividual: () => void;
  onCSVImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

const MRActionButtons: React.FC<MRActionButtonsProps> = ({
  onAddIndividual,
  onCSVImport,
  onDownloadTemplate
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".csv"
            onChange={onCSVImport}
            className="hidden"
            id="csv-upload"
          />
          <button
          onClick={onAddIndividual}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
        >
          Add Individual MR
        </button>
          <label
            htmlFor="csv-upload"
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-200"
          >
            Bulk Import MRs
          </label>
          

          
          <button
            onClick={onDownloadTemplate}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Template</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MRActionButtons;
