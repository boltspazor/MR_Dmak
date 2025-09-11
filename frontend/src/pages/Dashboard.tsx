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

  // Recipient list popup states
  const [showRecipientPopup, setShowRecipientPopup] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<GroupMember[]>([]);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>('all');
  const [recipientGroupFilter, setRecipientGroupFilter] = useState<string>('all');
  
  // Template preview popup states
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Mock data for demonstration
  useEffect(() => {
    const mockCampaigns: CampaignRecord[] = [
      {
        id: '1',
        campaignName: 'Q1 Product Launch',
        campaignId: 'CAMP-001',
        template: 'Product Launch Template',
        recipientList: ['North Zone', 'South Zone'],
        date: '2024-01-15',
        sendStatus: 'completed',
        totalRecipients: 150,
        sentCount: 145,
        failedCount: 5
      },
      {
        id: '2',
        campaignName: 'Monthly Training Update',
        campaignId: 'CAMP-002',
        template: 'Training Reminder Template',
        recipientList: ['East Zone', 'West Zone'],
        date: '2024-01-14',
        sendStatus: 'in progress',
        totalRecipients: 200,
        sentCount: 120,
        failedCount: 80
      },
      {
        id: '3',
        campaignName: 'Q1 Sales Review',
        campaignId: 'CAMP-003',
        template: 'Sales Review Template',
        recipientList: ['Central Zone'],
        date: '2024-01-13',
        sendStatus: 'in progress',
        totalRecipients: 75,
        sentCount: 0,
        failedCount: 0
      },
      {
        id: '4',
        campaignName: 'New Product Announcement',
        campaignId: 'CAMP-004',
        template: 'Product Announcement Template',
        recipientList: ['North Zone', 'East Zone'],
        date: '2024-01-12',
        sendStatus: 'completed',
        totalRecipients: 180,
        sentCount: 175,
        failedCount: 5
      },
      {
        id: '5',
        campaignName: 'Holiday Campaign',
        campaignId: 'CAMP-005',
        template: 'Holiday Special Template',
        recipientList: ['South Zone', 'West Zone', 'Central Zone'],
        date: '2024-01-11',
        sendStatus: 'completed',
        totalRecipients: 300,
        sentCount: 295,
        failedCount: 5
      }
    ];

    setCampaigns(mockCampaigns);
    setFilteredCampaigns(mockCampaigns);
    setLoading(false);
  }, []);

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

  const handleTemplatePreview = (templateName: string) => {
    setSelectedTemplate(templateName);
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
    },
    {
      title: 'Total Messages Sent',
      value: (campaigns || []).reduce((sum, c) => sum + (c?.sentCount || 0), 0).toString(),
      icon: <MessageSquare className="h-6 w-6 text-indigo-600" />,
      color: 'bg-indigo-100'
    },
    {
      title: 'Success Rate',
      value: (() => {
        if (!campaigns || campaigns.length === 0) return '0%';
        const totalMessages = campaigns.reduce((sum, c) => sum + (c?.totalRecipients || 0), 0);
        const sentMessages = campaigns.reduce((sum, c) => sum + (c?.sentCount || 0), 0);
        return totalMessages > 0 ? `${Math.round((sentMessages / totalMessages) * 100)}%` : '0%';
      })(),
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    }
  ];

  const uniqueGroups = [...new Set((campaigns || []).flatMap(c => c?.recipientList || []))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
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
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('campaignId')}
                      >
                        <div className="flex items-center justify-center">
                          Campaign ID
                          {sortField === 'campaignId' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center justify-center">
                          Date
                          {sortField === 'date' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('campaignName')}
                      >
                        <div className="flex items-center justify-center">
                          Campaign Name
                          {sortField === 'campaignName' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('template')}
                      >
                        <div className="flex items-center justify-center">
                          Template Used
                          {sortField === 'template' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('recipientList')}
                      >
                        <div className="flex items-center justify-center">
                          Recipient List
                          {sortField === 'recipientList' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('sendStatus')}
                      >
                        <div className="flex items-center justify-center">
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
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{campaign.campaignId}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{campaign.date}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center font-medium">{campaign.campaignName}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            <button 
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => handleTemplatePreview(campaign.template)}
                            >
                              {campaign.template}
                            </button>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            <button 
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => handleRecipientListClick(campaign.recipientList)}
                            >
                              {campaign.recipientList.length} Groups
                            </button>
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="flex items-center justify-center">
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
                        <td colSpan={6} className="text-center py-12">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center">
                      <MessageSquare className="h-8 w-8 text-indigo-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Messages</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedRecipients.reduce((sum, member) => sum + (member.status === 'sent' ? 1 : 0), 0)}
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
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center">
                      <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Recipients</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedRecipients.filter(member => {
                            const matchesSearch = 
                              member.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                              member.phone.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
                              (member.email && member.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()));
                            const matchesStatus = recipientStatusFilter === 'all' || member.status === recipientStatusFilter;
                            const matchesGroup = recipientGroupFilter === 'all' || member.group === recipientGroupFilter;
                            return matchesSearch && matchesStatus && matchesGroup;
                          }).length} of {selectedRecipients.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filters for Recipient List */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
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
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Name</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Phone</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Email</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Group</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Status</th>
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
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{member.name}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{member.phone}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{member.email || '-'}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{member.group}</td>
                            <td className="py-3 px-6 text-sm text-center">
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
        {showTemplatePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Template Preview: {selectedTemplate}
                </h2>
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Template Preview */}
                <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
                  <div className="space-y-4">
                    {/* Sample Template Content */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">
                        {`Dear #FirstName #LastName,

We are excited to announce our new product launch for #ProductName.

Key Features:
- Advanced technology
- User-friendly interface
- 24/7 support

Best regards,
The Team`}
                      </pre>
                    </div>
                    
                    {/* Sample Message Preview */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Sample Message Preview (as it will be sent to users):
                      </h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="bg-white p-3 rounded border">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800">
                            {`Dear John Doe,

We are excited to announce our new product launch for Product X.

Key Features:
- Advanced technology
- User-friendly interface
- 24/7 support

Best regards,
The Team`}
                          </pre>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          * This shows how the message will appear to recipients with sample parameter values
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Template Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Template Type:
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Text
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Parameters Used:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">#FirstName</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">#LastName</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">#ProductName</span>
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