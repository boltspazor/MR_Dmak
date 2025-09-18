import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  BarChart3,
  Search,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import CampaignTable from '../components/dashboard/CampaignTable';
import RecipientsModal from '../components/dashboard/RecipientsModal';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: string;
  recipientList: string[];
  date: string;
  sendStatus: 'completed' | 'in progress';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
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
    toast.error = (message: string) => {
      console.log('🔇 Suppressed toast error:', message);
      return { id: 'suppressed', type: 'error' } as any;
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

  // Initialize mock data for frontend-only development
  useEffect(() => {
    const isDevelopmentMode = (import.meta as any).env?.VITE_DEVELOPMENT_MODE === 'frontend-only';
    
    if (isDevelopmentMode) {
      console.log('🔧 Frontend-only mode: Loading mock campaign data');
      
      const mockCampaigns = [
        {
          id: '1',
          campaignName: 'Welcome Campaign',
          campaignId: 'CAMP-001',
          template: 'Welcome Template',
          recipientList: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'],
          date: '2025-09-15',
          sendStatus: 'completed' as const,
          totalRecipients: 150,
          sentCount: 148,
          failedCount: 2
        },
        {
          id: '2',
          campaignName: 'Product Launch',
          campaignId: 'CAMP-002',
          template: 'Product Announcement',
          recipientList: ['Dr. Brown', 'Dr. Davis', 'Dr. Miller'],
          date: '2025-09-14',
          sendStatus: 'in progress' as const,
          totalRecipients: 200,
          sentCount: 120,
          failedCount: 5
        },
        {
          id: '3',
          campaignName: 'Monthly Update',
          campaignId: 'CAMP-003',
          template: 'Newsletter Template',
          recipientList: ['Dr. Wilson', 'Dr. Moore', 'Dr. Taylor'],
          date: '2025-09-13',
          sendStatus: 'completed' as const,
          totalRecipients: 180,
          sentCount: 175,
          failedCount: 5
        }
      ];
      
      setCampaigns(mockCampaigns);
      setLoading(false);
    } else {
      // In production mode, you would load real data here
      setLoading(false);
    }
  }, []);

  // Recipient list popup states
  const [showRecipientPopup, setShowRecipientPopup] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<GroupMember[]>([]);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>('all');
  const [recipientGroupFilter, setRecipientGroupFilter] = useState<string>('all');
  
  // Template preview popup states
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Filter and sort campaigns
  useEffect(() => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = 
        campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.recipientList.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()));
      
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

  const handleTemplatePreview = async (templateName: string) => {
    const isDevelopmentMode = (import.meta as any).env?.VITE_DEVELOPMENT_MODE === 'frontend-only';
    
    if (isDevelopmentMode) {
      // Mock template data for frontend-only development
      console.log('🔧 Frontend-only mode: Showing mock template preview');
      const mockTemplate = {
        name: templateName,
        content: `Dear #FirstName #LastName,

Mock template content for "${templateName}". This is a sample template that would contain WhatsApp message content with placeholders.

Key Features:
- Advanced technology
- User-friendly interface
- 24/7 support

Best regards,
The Team`,
        imageUrl: '',
        footerImageUrl: '',
        parameters: ['FirstName', 'LastName', 'ProductName']
      };
      setPreviewTemplate(mockTemplate);
      setShowTemplatePreview(true);
      return;
    }

    try {
      // Fetch template data from API
      const response = await api.get('/templates');
      const templates = response.data.data || [];
      const template = templates.find((t: any) => t.name === templateName);
      if (template) {
        setPreviewTemplate(template);
      } else {
        // Fallback to mock data
        setPreviewTemplate({
          name: templateName,
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
        name: templateName,
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

  const handleRecipientListClick = (recipientGroups: string[]) => {
    // Mock data for group members
    const mockGroupMembers: GroupMember[] = [
      { id: '1', name: 'John Smith', phone: '+1234567890', email: 'john@example.com', group: 'North Zone', status: 'sent' },
      { id: '2', name: 'Jane Doe', phone: '+1234567891', email: 'jane@example.com', group: 'North Zone', status: 'sent' },
      { id: '3', name: 'Bob Wilson', phone: '+1234567892', email: 'bob@example.com', group: 'South Zone', status: 'sent' },
      { id: '4', name: 'Alice Johnson', phone: '+1234567893', email: 'alice@example.com', group: 'South Zone', status: 'failed' },
      { id: '5', name: 'Charlie Brown', phone: '+1234567894', email: 'charlie@example.com', group: 'East Zone', status: 'sent' },
      { id: '6', name: 'Diana Prince', phone: '+1234567895', email: 'diana@example.com', group: 'West Zone', status: 'sent' },
      { id: '7', name: 'Eva Martinez', phone: '+1234567896', email: 'eva@example.com', group: 'Central Zone', status: 'sent' },
      { id: '8', name: 'Frank Miller', phone: '+1234567897', email: 'frank@example.com', group: 'North Zone', status: 'sent' },
      { id: '9', name: 'Grace Lee', phone: '+1234567898', email: 'grace@example.com', group: 'South Zone', status: 'failed' },
      { id: '10', name: 'Henry Davis', phone: '+1234567899', email: 'henry@example.com', group: 'East Zone', status: 'failed' },
      { id: '11', name: 'Ivy Chen', phone: '+1234567800', email: 'ivy@example.com', group: 'West Zone', status: 'sent' },
      { id: '12', name: 'Jack Wilson', phone: '+1234567801', email: 'jack@example.com', group: 'Central Zone', status: 'sent' },
      { id: '13', name: 'Karen Taylor', phone: '+1234567802', email: 'karen@example.com', group: 'North Zone', status: 'sent' },
      { id: '14', name: 'Liam Anderson', phone: '+1234567803', email: 'liam@example.com', group: 'South Zone', status: 'failed' },
      { id: '15', name: 'Maya Patel', phone: '+1234567804', email: 'maya@example.com', group: 'East Zone', status: 'sent' },
      { id: '16', name: 'Noah Garcia', phone: '+1234567805', email: 'noah@example.com', group: 'West Zone', status: 'sent' },
      { id: '17', name: 'Olivia Kim', phone: '+1234567806', email: 'olivia@example.com', group: 'Central Zone', status: 'sent' },
      { id: '18', name: 'Paul Rodriguez', phone: '+1234567807', email: 'paul@example.com', group: 'North Zone', status: 'failed' },
      { id: '19', name: 'Quinn Thompson', phone: '+1234567808', email: 'quinn@example.com', group: 'South Zone', status: 'sent' },
      { id: '20', name: 'Rachel White', phone: '+1234567809', email: 'rachel@example.com', group: 'East Zone', status: 'sent' },
    ];

    // Filter members based on selected groups
    const filteredMembers = mockGroupMembers.filter(member => 
      recipientGroups.includes(member.group)
    );
    
    setSelectedRecipients(filteredMembers);
    setShowRecipientPopup(true);
  };


  const exportToCSV = () => {
    const csvContent = [
      'Campaign Name,Campaign ID,Template,Recipient List,Date,Send Status,Total Recipients,Sent Count,Failed Count',
      ...filteredCampaigns.map(campaign => 
        `${campaign.campaignName},${campaign.campaignId},${campaign.template},${campaign.recipientList.join(';')},${campaign.date},${campaign.sendStatus},${campaign.totalRecipients},${campaign.sentCount},${campaign.failedCount}`
      )
    ].join('\n');

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

  const uniqueGroups = [...new Set((campaigns || []).flatMap(c => c?.recipientList || []))];

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
                              {campaign.template}
                            </button>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-left">
                            <button 
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => handleRecipientListClick(campaign.recipientList)}
                            >
                              {campaign.totalRecipients} MRs
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
                        </tr>
                  ))
                ) : (
                      <tr>
                        <td colSpan={6} className="text-left py-12">
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

        {/* Recipient List Popup Modal */}
        {showRecipientPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recipient List Details
                </h2>
                <button
                  onClick={() => setShowRecipientPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                    </button>
              </div>
              
              {/* Summary Section */}
              <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center">
                      <MessageSquare className="h-8 w-8 text-indigo-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Number of Messages Attempted</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedRecipients.length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center">
                      <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedRecipients.length > 0 
                            ? `${Math.round((selectedRecipients.filter(m => m.status === 'sent').length / selectedRecipients.length) * 100)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filters for Recipient List */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <p className="text-xs text-gray-500">
                    {selectedRecipients.filter(member => {
                      const matchesSearch = 
                        member.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                        member.phone.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                        (member.email && member.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()));
                      const matchesStatus = recipientStatusFilter === 'all' || member.status === recipientStatusFilter;
                      const matchesGroup = recipientGroupFilter === 'all' || member.group === recipientGroupFilter;
                      return matchesSearch && matchesStatus && matchesGroup;
                    }).length} of {selectedRecipients.length} recipients
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search recipients..."
                        value={recipientSearchTerm}
                        onChange={(e) => setRecipientSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border-0 bg-white"
                          />
                        </div>
                      </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={recipientStatusFilter}
                      onChange={(e) => setRecipientStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-0 bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="sent">Sent</option>
                      <option value="failed">Failed</option>
                    </select>
                    </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                    <select
                      value={recipientGroupFilter}
                      onChange={(e) => setRecipientGroupFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-0 bg-white"
                    >
                      <option value="all">All Groups</option>
                      {uniqueGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>


              {/* Recipients Table */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b bg-indigo-50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
                    <span className="text-sm text-gray-700 font-bold">
                      {selectedRecipients.filter(member => {
                        const matchesSearch = 
                          member.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                          member.phone.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                          (member.email && member.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()));
                        const matchesStatus = recipientStatusFilter === 'all' || member.status === recipientStatusFilter;
                        const matchesGroup = recipientGroupFilter === 'all' || member.group === recipientGroupFilter;
                        return matchesSearch && matchesStatus && matchesGroup;
                      }).length} Recipients
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-indigo-50 border-b">
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Name</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Phone</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Email</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Group</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecipients
                        .filter(member => {
                          const matchesSearch = 
                            member.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                            member.phone.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                            (member.email && member.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()));
                          const matchesStatus = recipientStatusFilter === 'all' || member.status === recipientStatusFilter;
                          const matchesGroup = recipientGroupFilter === 'all' || member.group === recipientGroupFilter;
                          return matchesSearch && matchesStatus && matchesGroup;
                        })
                        .map(member => (
                          <tr key={member.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-6 text-sm text-gray-900 text-left">{member.name}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-left">{member.phone}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-left">{member.email || '-'}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-left">{member.group}</td>
                            <td className="py-3 px-6 text-sm text-left">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.status === 'sent' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {member.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Export Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={exportRecipientsToCSV}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
                  </div>
                )}

        {/* Template Preview Modal */}
        {showTemplatePreview && previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Template Preview
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {previewTemplate.name} • Created {new Date(previewTemplate.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Content Length: {previewTemplate.content.length} characters • Parameters: {previewTemplate.parameters?.length || 0}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTemplatePreview(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side - Template Content */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <h3 className="text-lg font-semibold text-gray-800">WhatsApp Message Preview</h3>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="bg-white rounded-3xl rounded-tl-lg shadow-2xl max-w-sm w-full overflow-hidden">
                          {/* Header Image */}
                          {previewTemplate.imageUrl && previewTemplate.imageUrl.trim() !== '' ? (
                            <div className="w-full">
                              <img 
                                src={previewTemplate.imageUrl} 
                                alt="Header"
                                className="w-full h-64 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="w-full h-32 bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                                <span className="text-gray-500 text-sm">Header image failed to load</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">No header image</span>
                            </div>
                          )}
                          
                          {/* Message Content */}
                          <div className="p-4">
                            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                              {(() => {
                                let processedContent = previewTemplate.content;
                                
                                // Sample parameter values for preview
                                const sampleParams = {
                                  'FirstName': 'John',
                                  'LastName': 'Doe',
                                  'MRId': 'MR001',
                                  'GroupName': 'North Zone',
                                  'PhoneNumber': '+919876543210',
                                  'Name': 'John Doe',
                                  'Company': 'D-MAK',
                                  'Product': 'New Product',
                                  'ProductName': 'New Product',
                                  'Date': new Date().toLocaleDateString(),
                                  'Time': new Date().toLocaleTimeString(),
                                  'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
                                  'Year': new Date().getFullYear().toString(),
                                  'Target': '100',
                                  'Achievement': '85',
                                  'Location': 'Mumbai',
                                  'City': 'Mumbai',
                                  'State': 'Maharashtra',
                                  'Country': 'India',
                                  'FN': 'John',
                                  'LN': 'Doe',
                                  'week': 'Week 2',
                                  'lastmonth': '50 lakhs',
                                  'doctor': '30'
                                };
                                
                                // Replace parameters with sample values
                                for (const [param, value] of Object.entries(sampleParams)) {
                                  const regex = new RegExp(`#${param}\\b`, 'g');
                                  processedContent = processedContent.replace(regex, value);
                                }
                                
                                // Replace any remaining parameters with [Sample Value]
                                processedContent = processedContent.replace(/#[A-Za-z0-9_]+/g, '[Sample Value]');
                                
                                return processedContent;
                              })()}
                            </div>
                          </div>
                          
                          {/* Footer Image */}
                          {previewTemplate.footerImageUrl && previewTemplate.footerImageUrl.trim() !== '' ? (
                            <div className="px-4 pb-4">
                              <img 
                                src={previewTemplate.footerImageUrl} 
                                alt="Footer"
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                                <span className="text-gray-500 text-xs">Footer image failed to load</span>
                              </div>
                            </div>
                          ) : (
                            <div className="px-4 pb-4">
                              <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No footer image</span>
                              </div>
                            </div>
                          )}
                          
                          {/* WhatsApp message time and status */}
                          <div className="px-4 pb-3">
                            <div className="flex justify-end items-center">
                              <span className="text-xs text-gray-500 mr-1">
                                {new Date().toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                              <span className="text-xs text-gray-500">✓✓</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Parameters */}
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Extracted Parameters</h4>
                      {previewTemplate.parameters && previewTemplate.parameters.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 mb-3">
                            The following parameters were found in the template content:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {previewTemplate.parameters.map((param: string, index: number) => (
                              <span 
                                key={index}
                                className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg font-medium"
                              >
                                #{param}
                              </span>
                            ))}
                          </div>
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-2">
                              <strong>Recipient List Format:</strong>
                            </p>
                            <p className="text-xs text-gray-500">
                              • Row 1: Template Name in A1, template name in B1<br/>
                              • Row 2: MR ID, First Name, Last Name, {previewTemplate.parameters.join(', ')}<br/>
                              • Each parameter will have its own column in the recipient list
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">
                            No parameters found in this template
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Use #ParameterName in your template content to create dynamic parameters
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;