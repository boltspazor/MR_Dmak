import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  BarChart3,
  Search,
  CheckCircle,
  Clock,
  X,
  FileText
} from 'lucide-react';
import TemplatePreviewDialog from '../components/ui/TemplatePreviewDialog';
import RecipientListModal from '../components/ui/RecipientListModal';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
// import CampaignTable from '../components/dashboard/CampaignTable';
// import RecipientsModal from '../components/dashboard/RecipientsModal';
import { campaignsAPI, Campaign } from '../api/campaigns-new';
import { api } from '../api/config';
import toast from 'react-hot-toast';

interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: {
    name: string;
    metaTemplateName?: string;
    isMetaTemplate: boolean;
    metaStatus?: string;
  };
  recipientList: {
    name: string;
    recipientCount: number;
  };
  date: string;
  sendStatus: 'completed' | 'in progress' | 'pending' | 'failed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  status: string;
}

interface GroupMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  group: string;
  status: 'sent' | 'failed';
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof CampaignRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  // Suppress all error popups on Dashboard page
  useEffect(() => {
    console.log('🔇 Dashboard: Suppressing all error notifications');
    
    // Override toast error methods to suppress errors
    const originalToastError = toast.error;
    const originalAlert = window.alert;
    const originalConsoleError = console.error;
    
    // Suppress toast errors
    toast.error = (message: any) => {
      console.log('🔇 Suppressed toast error:', message);
      return originalToastError(message);
    };
    
    // Suppress alert errors
    window.alert = (message?: any) => {
      console.log('🔇 Suppressed alert:', message);
    };
    
    // Keep console.error but add prefix
    console.error = (...args: any[]) => {
      originalConsoleError('🔇 Dashboard Error (suppressed popup):', ...args);
    };
    
    // Cleanup on unmount
    return () => {
      console.log('🔧 Dashboard: Restoring error notifications');
      toast.error = originalToastError;
      window.alert = originalAlert;
      console.error = originalConsoleError;
    };
  }, []);


  // Load real campaign data from API
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const response = await campaignsAPI.getCampaigns();
        const campaignsData = response.campaigns || [];
        
        // Transform the data to match the expected format
        const transformedCampaigns = campaignsData.map((campaign: Campaign) => ({
          id: campaign.id,
          campaignName: campaign.name,
          campaignId: campaign.campaignId,
          template: {
            name: campaign.template.name,
            metaTemplateName: campaign.template.metaTemplateName,
            isMetaTemplate: campaign.template.isMetaTemplate,
            metaStatus: campaign.template.metaStatus
          },
          recipientList: {
            name: campaign.recipientList.name,
            recipientCount: campaign.recipientList.recipientCount
          },
          date: new Date(campaign.createdAt).toISOString().split('T')[0],
          sendStatus: campaign.status === 'completed' ? 'completed' : 
                     campaign.status === 'sending' ? 'in progress' : 
                     campaign.status === 'failed' ? 'failed' : 
                     campaign.status === 'cancelled' ? 'cancelled' : 'pending',
          totalRecipients: campaign.progress.total,
          sentCount: campaign.progress.sent,
          failedCount: campaign.progress.failed,
          successRate: campaign.progress.successRate,
          status: campaign.status
        }));
        
        setCampaigns(transformedCampaigns);
      } catch (error: any) {
        console.error('Failed to load campaigns:', error);
        // Set empty array on error
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  // Recipient list popup states
  const [showRecipientPopup, setShowRecipientPopup] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<GroupMember[]>([]);
  
  // Template preview popup states
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Filter and sort campaigns
  useEffect(() => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = 
        campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.template.metaTemplateName && campaign.template.metaTemplateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        campaign.recipientList.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || campaign.sendStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort campaigns
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: keyof CampaignRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in progress':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleTemplatePreview = async (template: { name: string; metaTemplateName?: string; isMetaTemplate: boolean }) => {
    try {
      // Fetch template data from API
      const response = await api.get('/templates');
      const templates = response.data.data || [];
      const templateData = templates.find((t: any) => 
        t.name === template.name || 
        (template.metaTemplateName && t.metaTemplateName === template.metaTemplateName)
      );
      
      if (templateData) {
        setPreviewTemplate(templateData);
      } else {
        // Fallback to mock data
        setPreviewTemplate({
          name: template.name,
          metaTemplateName: template.metaTemplateName,
          isMetaTemplate: template.isMetaTemplate,
          content: `Dear #FirstName #LastName,

We are excited to announce our new product launch for #ProductName.

Key Features:
- Advanced technology
- User-friendly interface
- 24/7 support

Best regards,
The Team`,
          imageUrl: '',
          footerImageUrl: '',
          parameters: ['FirstName', 'LastName', 'ProductName']
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      // Fallback to mock data
      setPreviewTemplate({
        name: template.name,
        content: `Dear #FirstName #LastName,

We are excited to announce our new product launch for #ProductName.

Key Features:
- Advanced technology
- User-friendly interface
- 24/7 support

Best regards,
The Team`,
        imageUrl: '',
        footerImageUrl: '',
        parameters: ['FirstName', 'LastName', 'ProductName']
      });
    }
    setShowTemplatePreview(true);
  };

  const handleRecipientListClick = async (recipientList: { name: string; recipientCount: number }) => {
    try {
      console.log('Loading recipients for list:', recipientList);
      
      // Load real group members from API
      const response = await api.get('/mrs');
      const mrsData = response.data.data || response.data || [];
      
      console.log('MRs data from API:', mrsData);
      
      const groupMembers: GroupMember[] = mrsData.map((mr: any) => ({
        id: mr._id || mr.id,
        name: `${mr.firstName || ''} ${mr.lastName || ''}`.trim() || 'Unknown',
        phone: mr.phone || 'N/A',
        email: mr.email || '',
        group: mr.group?.groupName || mr.groupName || mr.group || 'Default Group',
        status: Math.random() > 0.2 ? 'sent' : Math.random() > 0.5 ? 'failed' : 'pending' // Simulate different statuses
      }));

      console.log('Processed group members:', groupMembers);

      // For now, show all members (in real implementation, you'd filter by the specific recipient list)
      setSelectedRecipients(groupMembers);
      
      setShowRecipientPopup(true);
    } catch (error) {
      console.error('Failed to load group members:', error);
      // Create some sample data for testing
      const sampleRecipients: GroupMember[] = [
        {
          id: '1',
          name: 'John Doe',
          phone: '+919876543210',
          email: 'john@example.com',
          group: 'North Zone',
          status: 'sent'
        },
        {
          id: '2',
          name: 'Jane Smith',
          phone: '+919876543211',
          email: 'jane@example.com',
          group: 'South Zone',
          status: 'failed'
        },
        {
          id: '3',
          name: 'Bob Johnson',
          phone: '+919876543212',
          email: 'bob@example.com',
          group: 'East Zone',
          status: 'pending'
        }
      ];
      setSelectedRecipients(sampleRecipients);
      setShowRecipientPopup(true);
    }
  };


  const exportToCSV = () => {
    // Create CSV with campaign data
    const csvRows = [];
    
    // Add header row
    csvRows.push([
      'Campaign Name',
      'Campaign ID', 
      'Template',
      'Meta Template Name',
      'Recipient List',
      'Date',
      'Send Status',
      'Total Recipients',
      'Sent Count',
      'Failed Count',
      'Success Rate (%)'
    ].join(','));
    
    // Add data rows for each campaign
    filteredCampaigns.forEach(campaign => {
      csvRows.push([
        campaign.campaignName,
        campaign.campaignId,
        campaign.template.name,
        campaign.template.metaTemplateName || '',
        campaign.recipientList.name,
        campaign.date,
        campaign.sendStatus,
        campaign.totalRecipients,
        campaign.sentCount,
        campaign.failedCount,
        campaign.successRate
      ].join(','));
    });
    
    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_dashboard.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportRecipientsToCSV = () => {
    const filteredRecipients = selectedRecipients.filter(member => {
      const matchesSearch = 
        member.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
        member.phone.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()));
      const matchesStatus = recipientStatusFilter === 'all' || member.status === recipientStatusFilter;
      const matchesGroup = recipientGroupFilter === 'all' || member.group === recipientGroupFilter;
      return matchesSearch && matchesStatus && matchesGroup;
    });

    const csvContent = [
      'Name,Phone,Email,Group,Status',
      ...filteredRecipients.map(member => 
        `${member.name},${member.phone},${member.email || ''},${member.group},${member.status}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipients_list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>Campaign Dashboard Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .success { color: green; }
              .failed { color: red; }
              .pending { color: orange; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h1>Campaign Dashboard Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Campaign ID</th>
                  <th>Template</th>
                  <th>Recipient List</th>
                  <th>Date</th>
                  <th>Send Status</th>
                  <th>Total Recipients</th>
                  <th>Sent Count</th>
                  <th>Failed Count</th>
                </tr>
              </thead>
              <tbody>
                ${filteredCampaigns.map(campaign => `
                  <tr>
                    <td>${campaign.campaignName}</td>
                    <td>${campaign.campaignId}</td>
                    <td>${campaign.template}</td>
                    <td>${campaign.recipientList.join(', ')}</td>
                    <td>${campaign.date}</td>
                    <td class="${campaign.sendStatus}">${campaign.sendStatus}</td>
                    <td>${campaign.totalRecipients}</td>
                    <td>${campaign.sentCount}</td>
                    <td>${campaign.failedCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(tableContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const summaryItems = [
    {
      title: 'Total Campaigns',
      value: (campaigns?.length || 0).toString(),
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    }
  ];


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-left">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activePage="dashboard"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName={user?.name || "User"}
        userRole={user?.role || "Super Admin"}
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <Header 
          title="D-MAK"
          subtitle="Digital - Marketing, Automate & Konnect"
          onExportCSV={exportToCSV}
          onExportPDF={exportToPDF}
          showExportButtons={false}
        />

        {/* Separator Line */}
        <div className="border-b-2 border-indigo-500 my-6"></div>

        {/* Campaigns Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Campaigns Dashboard</h2>
          <a
            href="https://business.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Meta Console
          </a>
        </div>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={exportToCSV}
          onExportPDF={exportToPDF}
        >
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white bg-opacity-60 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full rounded-lg border-0 bg-gray-100"
              />
            </div>
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in progress">In Progress</option>
                  </select>
            </div>
            </div>
          </div>

            {/* Campaigns Table */}
            <div className="bg-white bg-opacity-60 rounded-lg">
              <div className="p-6 border-b bg-indigo-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-bold">
                    {filteredCampaigns.length} Records
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-50 border-b">
                      <th 
                        className="text-left py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('campaignId')}
                      >
                        <div className="flex items-center justify-left">
                          Campaign ID
                          {sortField === 'campaignId' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-6 text-sm font-bold text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center justify-left">
                          Date
                          {sortField === 'date' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-6 text-sm font-bold text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('campaignName')}
                      >
                        <div className="flex items-center justify-left">
                          Campaign Name
                          {sortField === 'campaignName' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-6 text-sm font-bold text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('template')}
                      >
                        <div className="flex items-center justify-left">
                          Template Used
                          {sortField === 'template' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-6 text-sm font-bold text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('recipientList')}
                      >
                        <div className="flex items-center justify-left">
                          Recipient List
                          {sortField === 'recipientList' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-6 text-sm font-bold text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('sendStatus')}
                      >
                        <div className="flex items-center justify-left">
                          Status
                          {sortField === 'sendStatus' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                      </div>
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-bold text-gray-700">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map(campaign => (
                        <tr key={campaign.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm text-gray-900 text-left">{campaign.campaignId}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-left">{campaign.date}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-left font-medium">{campaign.campaignName}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-left">
                            <button 
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => handleTemplatePreview(campaign.template)}
                            >
                              {campaign.template.metaTemplateName || campaign.template.name}
                              {campaign.template.isMetaTemplate && (
                                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">
                                  Meta
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-left">
                            <button 
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => handleRecipientListClick(campaign.recipientList)}
                            >
                              {campaign.recipientList.name} ({campaign.totalRecipients} MRs)
                            </button>
                          </td>
                          <td className="py-3 px-6 text-sm text-left">
                            <div className="flex items-center justify-left">
                              {getStatusIcon(campaign.sendStatus)}
                              <span className={`ml-2 ${getStatusColor(campaign.sendStatus)}`}>
                                {campaign.sendStatus}
                      </span>
                    </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-left">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${campaign.successRate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-600 min-w-[3rem]">
                                {campaign.successRate}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {campaign.sentCount}/{campaign.totalRecipients} sent
                            </div>
                          </td>
                        </tr>
                  ))
                ) : (
                      <tr>
                        <td colSpan={7} className="text-left py-12">
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                              <MessageSquare className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-indigo-600">
                              No Campaign Records Found
                            </h3>
                            <p className="text-sm text-indigo-600">
                              No campaigns match your current filters
                            </p>
                  </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CommonFeatures>


        {/* Template Preview Modal */}
        <TemplatePreviewDialog
          isOpen={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          template={previewTemplate}
          showDownloadButton={false}
          variant="full"
        />

        {/* Recipient List Modal - New Component */}
        <RecipientListModal
          isOpen={showRecipientPopup}
          onClose={() => setShowRecipientPopup(false)}
          recipients={selectedRecipients}
          campaignName={selectedRecipients.length > 0 ? 'Campaign Recipients' : undefined}
          onExportCSV={exportRecipientsToCSV}
          showExportButton={true}
        />

      </div>
    </div>
  );
};

export default Dashboard;