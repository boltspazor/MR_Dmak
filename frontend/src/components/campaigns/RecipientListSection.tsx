import React from 'react';
import { X } from 'lucide-react';

interface RecipientListSectionProps {
  selectedRecipientList: any;
  setSelectedRecipientList: (list: any) => void;
  onShowCreateRecipientList: () => void;
}

const RecipientListSection: React.FC<RecipientListSectionProps> = ({
  selectedRecipientList,
  setSelectedRecipientList,
  onShowCreateRecipientList
}) => {
  return (
    <div className="bg-white bg-opacity-40 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipient List</h3>
      <button
        onClick={onShowCreateRecipientList}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
      >
        Upload Recipient List
      </button>

      {/* Selected Recipient List Display */}
      {selectedRecipientList && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Recipient List:</p>
          <div className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
            <span>{selectedRecipientList.name} ({selectedRecipientList.recipients?.length || 0} records)</span>
            <button
              onClick={() => setSelectedRecipientList(null)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientListSection;
