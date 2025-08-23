import React, { useEffect, useState } from 'react';
import { GroupStats, ModalProps } from '../../types';
import groupsService from '../../services/groups.service';
import { XMarkIcon, UsersIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface GroupStatsModalProps extends ModalProps {
  groupId?: string;
}

const GroupStatsModal: React.FC<GroupStatsModalProps> = ({ isOpen, onClose, groupId }) => {
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupStats();
    }
  }, [isOpen, groupId]);

  const fetchGroupStats = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const data = await groupsService.getGroupStats(groupId);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch group stats:', error);
    } finally {
      setLoading(false);
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
              <h3 className="text-lg font-medium text-gray-900">Group Statistics</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">{stats.groupName}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <UsersIcon className="h-5 w-5 text-primary-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Total MRs</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.totalMRs}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Active MRs</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.activeMRs}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-warning-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Inactive MRs</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.inactiveMRs}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-info-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Campaigns</p>
                        <p className="text-lg font-semibold text-gray-900">{stats.totalCampaigns}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-md font-medium text-gray-900 mb-3">Message Statistics</h5>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Messages Sent:</span>
                      <span className="text-sm font-medium text-gray-900">{stats.totalMessagesSent}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Messages Delivered:</span>
                      <span className="text-sm font-medium text-gray-900">{stats.totalMessagesDelivered}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delivery Rate:</span>
                      <span className="text-sm font-medium text-gray-900">{stats.averageDeliveryRate}%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Recently Added:</span>
                      <span className="text-sm font-medium text-gray-900">{stats.recentlyAdded}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No statistics available</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupStatsModal;
