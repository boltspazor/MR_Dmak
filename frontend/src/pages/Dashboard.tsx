import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  BarChart3,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';

interface CampaignRecord {
  id: string;
  marketingManager: string;
  groupName: string;
  mrName: string;
  templateName: string;
  recipientList: string;
  date: string;
  sendStatus: 'success' | 'failed' | 'pending';
  templateId: string;
  recipientListId: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof CampaignRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mock data for demonstration
  useEffect(() => {
    const mockCampaigns: CampaignRecord[] = [
      {
        id: '1',
        marketingManager: 'John Smith',
        groupName: 'North Zone',
        mrName: 'Alice Johnson',
        templateName: 'Monthly Update Template',
        recipientList: 'North Zone Q1 List',
        date: '2024-01-15',
        sendStatus: 'success',
        templateId: 't1',
        recipientListId: 'r1'
      },
      {
        id: '2',
        marketingManager: 'John Smith',
        groupName: 'South Zone',
        mrName: 'Bob Wilson',
        templateName: 'Product Launch Template',
        recipientList: 'South Zone Q1 List',
        date: '2024-01-14',
        sendStatus: 'failed',
        templateId: 't2',
        recipientListId: 'r2'
      },
      {
        id: '3',
        marketingManager: 'Sarah Davis',
        groupName: 'East Zone',
        mrName: 'Carol Brown',
        templateName: 'Training Reminder',
        recipientList: 'East Zone Q1 List',
        date: '2024-01-13',
        sendStatus: 'pending',
        templateId: 't3',
        recipientListId: 'r3'
      },
      {
        id: '4',
        marketingManager: 'John Smith',
        groupName: 'North Zone',
        mrName: 'David Lee',
        templateName: 'Monthly Update Template',
        recipientList: 'North Zone Q1 List',
        date: '2024-01-12',
        sendStatus: 'success',
        templateId: 't1',
        recipientListId: 'r1'
      },
      {
        id: '5',
        marketingManager: 'Sarah Davis',
        groupName: 'West Zone',
        mrName: 'Eva Martinez',
        templateName: 'Product Launch Template',
        recipientList: 'West Zone Q1 List',
        date: '2024-01-11',
        sendStatus: 'success',
        templateId: 't2',
        recipientListId: 'r4'
      }
    ];

    setCampaigns(mockCampaigns);
    setFilteredCampaigns(mockCampaigns);
  }, []);

  // Filter and sort campaigns
  useEffect(() => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = 
        campaign.marketingManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.mrName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.templateName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || campaign.sendStatus === statusFilter;
      const matchesManager = managerFilter === 'all' || campaign.marketingManager === managerFilter;
      const matchesGroup = groupFilter === 'all' || campaign.groupName === groupFilter;

      return matchesSearch && matchesStatus && matchesManager && matchesGroup;
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
  }, [campaigns, searchTerm, statusFilter, managerFilter, groupFilter, sortField, sortDirection]);

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
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
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

  const exportToCSV = () => {
    const csvContent = [
      'Marketing Manager,Group Name,MR Name,Template Name,Recipient List,Date,Send Status',
      ...filteredCampaigns.map(campaign => 
        `${campaign.marketingManager},${campaign.groupName},${campaign.mrName},${campaign.templateName},${campaign.recipientList},${campaign.date},${campaign.sendStatus}`
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
                  <th>Marketing Manager</th>
                  <th>Group Name</th>
                  <th>MR Name</th>
                  <th>Template Name</th>
                  <th>Recipient List</th>
                  <th>Date</th>
                  <th>Send Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredCampaigns.map(campaign => `
                  <tr>
                    <td>${campaign.marketingManager}</td>
                    <td>${campaign.groupName}</td>
                    <td>${campaign.mrName}</td>
                    <td>${campaign.templateName}</td>
                    <td>${campaign.recipientList}</td>
                    <td>${campaign.date}</td>
                    <td class="${campaign.sendStatus}">${campaign.sendStatus}</td>
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
      value: campaigns.length,
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Successful Sends',
      value: campaigns.filter(c => c.sendStatus === 'success').length,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      title: 'Failed Sends',
      value: campaigns.filter(c => c.sendStatus === 'failed').length,
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      color: 'bg-red-100'
    },
    {
      title: 'Success Rate',
      value: campaigns.length > 0 ? `${Math.round((campaigns.filter(c => c.sendStatus === 'success').length / campaigns.length) * 100)}%` : '0%',
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-100'
    }
  ];

  const uniqueManagers = [...new Set(campaigns.map(c => c.marketingManager))];
  const uniqueGroups = [...new Set(campaigns.map(c => c.groupName))];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activePage="dashboard"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName={user?.name || "User"}
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <Header 
          title="Dashboard"
          subtitle="Campaign delivery status and analytics"
          onExportCSV={exportToCSV}
          onExportPDF={exportToPDF}
          showExportButtons={true}
        />

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                  <select
                    value={managerFilter}
                    onChange={(e) => setManagerFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100"
                  >
                    <option value="all">All Managers</option>
                    {uniqueManagers.map(manager => (
                      <option key={manager} value={manager}>{manager}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100"
                  >
                    <option value="all">All Groups</option>
                    {uniqueGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white bg-opacity-60 rounded-lg">
              <div className="p-6 border-b bg-indigo-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Campaign Records</h2>
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
                        onClick={() => handleSort('marketingManager')}
                      >
                        <div className="flex items-center justify-center">
                          Marketing Manager
                          {sortField === 'marketingManager' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('groupName')}
                      >
                        <div className="flex items-center justify-center">
                          Group Name
                          {sortField === 'groupName' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('mrName')}
                      >
                        <div className="flex items-center justify-center">
                          MR Name
                          {sortField === 'mrName' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('templateName')}
                      >
                        <div className="flex items-center justify-center">
                          Template Name
                          {sortField === 'templateName' && (
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
                        onClick={() => handleSort('sendStatus')}
                      >
                        <div className="flex items-center justify-center">
                          Send Status
                          {sortField === 'sendStatus' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map(campaign => (
                        <tr key={campaign.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{campaign.marketingManager}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{campaign.groupName}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{campaign.mrName}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            <button 
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => alert(`Viewing template: ${campaign.templateName}`)}
                            >
                              {campaign.templateName}
                            </button>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            <button 
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={() => alert(`Viewing recipient list: ${campaign.recipientList}`)}
                            >
                              {campaign.recipientList}
                            </button>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{campaign.date}</td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="flex items-center justify-center">
                              {getStatusIcon(campaign.sendStatus)}
                              <span className={`ml-2 ${getStatusColor(campaign.sendStatus)}`}>
                                {campaign.sendStatus}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <button
                              onClick={() => alert(`Viewing details for campaign: ${campaign.id}`)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
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
      </div>
    </div>
  );
};

export default Dashboard;