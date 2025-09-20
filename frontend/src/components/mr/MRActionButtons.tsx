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
        <button
          onClick={onAddIndividual}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
        >
          Add Individual MR
        </button>
        
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".csv"
            onChange={onCSVImport}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-200"
          >
            Bulk Import MRs
          </label>
          
          <button
            onClick={onDownloadTemplate}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900"
          >
            Download Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default MRActionButtons;
