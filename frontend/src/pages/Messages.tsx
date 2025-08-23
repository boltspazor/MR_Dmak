import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import messagesService from '../services/messages.service';
import groupsService from '../services/groups.service';
import { MessageCampaign, SendMessageRequest, Group } from '../types';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import SendMessageModal from '../components/messages/SendMessageModal';
import CampaignReportModal from '../components/messages/CampaignReportModal';

const Messages: React.FC = () => {
  const { addNotification } = useNotifications();
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MessageCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await messagesService.getAllCampaigns({ 
        search: searchTerm,
        status: statusFilter || undefined
      });
      setCampaigns(response.campaigns || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to load campaigns',
        message: error.response?.data?.error || 'Could not load message campaigns',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupsService.getGroups();
      setGroups(response.groups || []);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleSendMessage = async (messageData: SendMessageRequest) => {
    try {
      const result = await messagesService.sendMessage(messageData);
      setCampaigns(prev => [{
        id: result.campaignId,
        messageId: result.messageId,
        createdBy: 'current-user',
        scheduledAt: messageData.scheduledAt,
        status: result.status as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        message: {
          id: result.messageId,
          content: messageData.content,
          imageUrl: messageData.imageUrl,
          type: messageData.imageUrl ? 'image' : 'text',
          createdAt: new Date().toISOString(),
        },
        _count: {
          messageLogs: result.totalRecipients,
        },
      }, ...prev]);
      
      setShowSendModal(false);
      addNotification({
        type: 'success',
        title: 'Message Sent',
        message: `Campaign created successfully with ${result.totalRecipients} recipients`,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to send message',
        message: error.response?.data?.error || 'Could not send message',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <span className="badge badge-warning">Queued</span>;
      case 'processing':
        return <span className="badge badge-info">Processing</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'failed':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'processing':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Manage your message campaigns</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Send Message
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter ? 'No campaigns match your search.' : 'Get started by sending your first message.'}
          </p>
          {!searchTerm && !statusFilter && (
            <div className="mt-6">
              <button
                onClick={() => setShowSendModal(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Send Message
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(campaign.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {campaign.message.content.length > 50 
                            ? `${campaign.message.content.substring(0, 50)}...`
                            : campaign.message.content
                          }
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          {getStatusBadge(campaign.status)}
                          <span>•</span>
                          <span>{campaign._count?.messageLogs || 0} recipients</span>
                          <span>•</span>
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                          {campaign.scheduledAt && (
                            <>
                              <span>•</span>
                              <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {campaign.message.imageUrl && (
                      <div className="mt-3">
                        <img 
                          src={campaign.message.imageUrl} 
                          alt="Message attachment"
                          className="h-20 w-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowReportModal(true);
                      }}
                      className="btn btn-sm btn-secondary"
                      title="View Report"
                    >
                      <ChartBarIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <SendMessageModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSubmit={handleSendMessage}
        groups={groups}
      />

      <CampaignReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedCampaign(null);
        }}
        campaignId={selectedCampaign?.id}
      />
    </div>
  );
};

export default Messages;
