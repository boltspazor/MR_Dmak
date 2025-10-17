import React, { useState } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { useRecipientLists } from './hooks/useRecipientLists';
import { Template } from '../../../types/index';

interface RecipientListsSectionProps {
  template: Template;
  isOpen: boolean;
}

const RecipientListsSection: React.FC<RecipientListsSectionProps> = ({ template, isOpen }) => {
  const { recipientLists, selectedRecipientList, setSelectedRecipientList, loadingRecipientLists } = useRecipientLists(template._id, isOpen);
  const [showRecipients, setShowRecipients] = useState(false);

  if (!template.parameters || template.parameters.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Recipient Lists</h3>
      </div>

      {loadingRecipientLists ? (
        <div className="space-y-3">
          <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
          <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
        </div>
      ) : recipientLists.length > 0 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Recipient List
            </label>
            <select
              value={selectedRecipientList?._id || ''}
              onChange={(e) => {
                const list = recipientLists.find(l => l._id === e.target.value);
                setSelectedRecipientList(list);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a recipient list</option>
              {recipientLists.map((list) => {
                const recipientNames = list.recipients && list.recipients.length > 0
                  ? list.recipients.slice(0, 2).map((r: any) => `${r.firstName} ${r.lastName}`).join(', ') +
                    (list.recipients.length > 2 ? ` +${list.recipients.length - 2} more` : '')
                  : 'No recipients';

                return (
                  <option key={list._id} value={list._id}>
                    {list.name} ({recipientNames})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedRecipientList && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {selectedRecipientList.name}
                  </span>
                </div>
                <button
                  onClick={() => setShowRecipients(!showRecipients)}
                  className="text-xs text-green-600 hover:text-green-700"
                >
                  {showRecipients ? 'Hide' : 'Show'} Recipients
                </button>
              </div>
              <div className="text-xs text-green-600">
                {selectedRecipientList.recipients?.length || selectedRecipientList.data?.length || 0} recipients ready
              </div>

              {showRecipients && selectedRecipientList.recipients && selectedRecipientList.recipients.length > 0 && (
                <div className="mt-3 border-t border-green-200 pt-3">
                  <div className="text-xs text-green-700 font-medium mb-2">Recipients:</div>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-1">
                      {selectedRecipientList.recipients.map((recipient: any, index: number) => (
                        <div key={recipient._id || index} className="text-xs text-green-600 bg-white rounded px-2 py-1">
                          {recipient.firstName} {recipient.lastName}
                          {recipient.phone && (
                            <span className="text-gray-500 ml-2">({recipient.phone})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No recipient lists found for this template.</p>
          <p className="text-xs">Create a recipient list to see recipients here.</p>
        </div>
      )}
    </div>
  );
};

export default RecipientListsSection;
