import React, { useEffect, useState } from 'react';
import { DetailedCampaignReport, ModalProps } from '../../types';
import reportsService from '../../services/reports.service';
import { XMarkIcon, ChartBarIcon, UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface CampaignReportModalProps extends ModalProps {
  campaignId?: string;
}

const CampaignReportModal: React.FC<CampaignReportModalProps> = ({ isOpen, onClose, campaignId }) => {
  const [report, setReport] = useState<DetailedCampaignReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchReport();
    }
  }, [isOpen, campaignId]);

  const fetchReport = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const data = await reportsService.getDetailedReport(campaignId);
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch campaign report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!campaignId) return;
    
    try {
      await reportsService.exportReport(campaignId, format);
    } catch (error) {
      console.error('Export failed:', error);
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

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Campaign Report</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="btn btn-sm btn-secondary"
                >
                  Export CSV
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : report ? (
              <div className="space-y-6">
                {/* Campaign Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Campaign Overview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{report.stats.total}</div>
                      <div className="text-sm text-gray-600">Total Recipients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success-600">{report.stats.sent}</div>
                      <div className="text-sm text-gray-600">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-danger-600">{report.stats.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning-600">{report.stats.pending}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                  </div>
                </div>

                {/* Group Statistics */}
                {report.groupStats && Object.keys(report.groupStats).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Group Statistics</h4>
                    <div className="space-y-3">
                      {Object.entries(report.groupStats).map(([groupName, stats]) => (
                        <div key={groupName} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="font-medium text-gray-900">{groupName}</div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-600">Total: {stats.total}</span>
                            <span className="text-success-600">Sent: {stats.sent}</span>
                            <span className="text-danger-600">Failed: {stats.failed}</span>
                            <span className="text-warning-600">Pending: {stats.pending}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {report.timeline && report.timeline.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Message Timeline</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {report.timeline.map((event, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                          <div className="flex-shrink-0">
                            {event.status === 'sent' && <CheckCircleIcon className="h-4 w-4 text-success-500" />}
                            {event.status === 'failed' && <XCircleIcon className="h-4 w-4 text-danger-500" />}
                            {event.status === 'pending' && <ClockIcon className="h-4 w-4 text-warning-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {event.mrName} - {event.groupName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(event.time).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`badge badge-${event.status === 'sent' ? 'success' : event.status === 'failed' ? 'danger' : 'warning'}`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campaign Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Campaign Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Message Content:</span>
                      <span className="text-gray-900 max-w-md truncate">
                        {report.campaign.message.content}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-gray-900">{report.campaign.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {new Date(report.campaign.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {report.campaign.scheduledAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scheduled:</span>
                        <span className="text-gray-900">
                          {new Date(report.campaign.scheduledAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No report data available</p>
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

export default CampaignReportModal;
