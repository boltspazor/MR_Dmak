import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Trash2, 
  Search,
  FileText,
  BarChart3
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import AddMRDialog from '../components/AddMRDialog';

interface Contact {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
  comments?: string;
}

interface Group {
  id: string;
  name: string;
  contactCount: number;
}

interface MessageLog {
  id: string;
  message: string;
  groups: string[];
  sentAt: string;
  contactCount: number;
}

// Mock API for demonstration
const mockApi = {
  get: async (endpoint: string) => {
    console.log(`Mock API GET: ${endpoint}`);
    
    if (endpoint === '/mrs') {
      // Return mock MR data
      return {
        data: {
          data: [
            {
              id: '1',
              mrId: 'MR001',
              firstName: 'John',
              lastName: 'Doe',
              phone: '+919876543210',
              group: { groupName: 'North Zone' },
              comments: 'Senior MR'
            },
            {
              id: '2',
              mrId: 'MR002',
              firstName: 'Jane',
              lastName: 'Smith',
              phone: '+919876543211',
              group: { groupName: 'South Zone' },
              comments: 'New MR'
            }
          ]
        }
      };
    }
    
    if (endpoint === '/groups') {
      return {
        data: {
          data: [
            { id: '1', groupName: 'North Zone', mrCount: 1 },
            { id: '2', groupName: 'South Zone', mrCount: 1 },
            { id: '3', groupName: 'East Zone', mrCount: 0 },
            { id: '4', groupName: 'West Zone', mrCount: 0 }
          ]
        }
      };
    }
    
    return { data: { data: [] } };
  },
  
  post: async (endpoint: string, data: any) => {
    console.log(`Mock API POST: ${endpoint}`, data);
    return { data: { success: true, id: Date.now().toString() } };
  },
  
  delete: async (endpoint: string) => {
    console.log(`Mock API DELETE: ${endpoint}`);
    return { data: { success: true } };
  }
};

const SimpleMRTool: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'reports'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Contact>('mrId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddMRDialogOpen, setIsAddMRDialogOpen] = useState(false);

  // Form states
  const [newGroup, setNewGroup] = useState({
    name: ''
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchContactsFromBackend(),
          fetchGroupsFromBackend()
        ]);
        
        // Load message logs from memory (since we can't use localStorage)
        const savedMessageLogs = [
          {
            id: '1',
            message: 'Welcome to our medical representative program!',
            groups: ['North Zone'],
            sentAt: new Date().toISOString(),
            contactCount: 1
          }
        ];
        setMessageLogs(savedMessageLogs);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  const fetchContactsFromBackend = async () => {
    try {
      console.log('Fetching contacts from backend...');
      const response = await mockApi.get('/mrs');
      const mrs = response.data.data || [];
      
      console.log('Backend contacts response:', mrs);
      
      // Transform backend MR data to Contact format
      const transformedContacts: Contact[] = mrs.map((mr: any) => ({
        id: mr.id,
        mrId: mr.mrId,
        firstName: mr.firstName,
        lastName: mr.lastName,
        phone: mr.phone,
        group: mr.group?.groupName || 'Default Group',
        comments: mr.comments || ''
      }));
      
      console.log('Transformed contacts:', transformedContacts);
      setContacts(transformedContacts);
    } catch (error: any) {
      console.error('Error fetching contacts from backend:', error);
    }
  };

  const fetchGroupsFromBackend = async () => {
    try {
      console.log('Fetching groups from backend...');
      const response = await mockApi.get('/groups');
      const backendGroups = response.data.data || [];
      
      console.log('Backend groups response:', backendGroups);
      
      // Transform backend group data to Group format
      const transformedGroups: Group[] = backendGroups.map((group: any) => ({
        id: group.id,
        name: group.groupName,
        contactCount: group.mrCount || 0
      }));
      
      console.log('Transformed groups:', transformedGroups);
      setGroups(transformedGroups);
    } catch (error: any) {
      console.error('Error fetching groups from backend:', error);
    }
  };

  // Update group contact counts
  useEffect(() => {
    const updatedGroups = groups.map(group => ({
      ...group,
      contactCount: contacts.filter(contact => contact.group === group.name).length
    }));
    setGroups(updatedGroups);
  }, [contacts]);

  // Contact management functions

  const handleAddMR = async (contactData: Omit<Contact, 'id'>) => {
    try {
      // Find the group ID by name
      const selectedGroup = groups.find(g => g.name === contactData.group);
      if (!selectedGroup) {
        alert('Selected group not found');
        return;
      }

      await mockApi.post('/mrs', {
        mrId: contactData.mrId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        phone: contactData.phone,
        groupId: selectedGroup.id,
        comments: contactData.comments
      });

      // Add to local state (since we're using mock API)
      const newContactData: Contact = {
        id: Date.now().toString(),
        ...contactData
      };
      
      setContacts([...contacts, newContactData]);
      alert('MR added successfully!');
    } catch (error: any) {
      console.error('Error adding MR:', error);
      alert('Failed to add MR');
    }
  };

  const deleteContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await mockApi.delete(`/mrs/${id}`);
      // Remove from local state
      setContacts(contacts.filter(c => c.id !== id));
      alert('Contact deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  };

  const addGroup = async () => {
    if (!newGroup.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (groups.some(group => group.name.toLowerCase() === newGroup.name.toLowerCase())) {
      alert('Group already exists');
      return;
    }

    try {
      await mockApi.post('/groups', {
        groupName: newGroup.name.trim(),
        description: 'Group created from DMak Tool'
      });

      // Add to local state
      const newGroupData: Group = {
        id: Date.now().toString(),
        name: newGroup.name.trim(),
        contactCount: 0
      };
      
      setGroups([...groups, newGroupData]);
      setNewGroup({ name: '' });
      alert('Group created successfully!');
    } catch (error: any) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  // CSV import/export functions
  const exportContactsToCSV = () => {
    const csvContent = [
      'MR ID,First Name,Last Name,Phone,Group,Comments',
      ...contacts.map(contact => 
        `${contact.mrId},${contact.firstName},${contact.lastName},${contact.phone},${contact.group},${contact.comments || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mr_contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportContactsToPDF = () => {
    // Simple PDF generation using browser's print functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>MR Contacts Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h1>MR Contacts Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>MR ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Group</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                ${contacts.map(contact => `
                  <tr>
                    <td>${contact.mrId}</td>
                    <td>${contact.firstName} ${contact.lastName}</td>
                    <td>${contact.phone}</td>
                    <td>${contact.group}</td>
                    <td>${contact.comments || '-'}</td>
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

  const downloadCSVTemplate = () => {
    const template = 'MR ID,First Name,Last Name,Phone,Group,Comments\nMR001,John,Doe,+919876543210,North Zone,Senior MR\nMR002,Jane,Smith,+919876543211,South Zone,';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mr_contacts_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Mock CSV processing
      const text = await file.text();
      const lines = text.split('\n');
      
      let created = 0;
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length >= 5) {
          const newContact: Contact = {
            id: Date.now().toString() + i,
            mrId: values[0],
            firstName: values[1],
            lastName: values[2],
            phone: values[3],
            group: values[4],
            comments: values[5] || ''
          };
          
          setContacts(prev => [...prev, newContact]);
          created++;
        } else {
          errors.push(`Line ${i + 1}: Invalid format`);
        }
      }
      
      alert(`Bulk upload completed!\n\nCreated: ${created} MRs\nTotal Processed: ${lines.length - 1}${errors.length > 0 ? `\n\nErrors (${errors.length}):\n${errors.slice(0, 5).join('\n')}` : ''}`);
      

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  // Message functions

  const filteredContacts = contacts
    .filter(contact =>
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.mrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.group.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTotalStats = () => {
    return {
      totalContacts: contacts.length,
      totalGroups: groups.length,
      totalMessages: messageLogs.length,
      engagementRate: contacts.length > 0 ? Math.round((messageLogs.length / contacts.length) * 100) : 0
    };
  };

  const stats = getTotalStats();

  // Navigation functions
  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const summaryItems = [
    {
      title: 'Total Contacts',
      value: contacts.length,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Total Groups',
      value: groups.length,
      icon: <FileText className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      title: 'Messages Sent',
      value: messageLogs.length,
      icon: <MessageSquare className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-100'
    },
    {
      title: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      icon: <BarChart3 className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activePage="dmak"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName="User Name"
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <Header 
          title="DMak"
          subtitle="Simple tool for managing Medical Representatives and sending Whatsapp messages"
          onExportCSV={exportContactsToCSV}
          onExportPDF={exportContactsToPDF}
          showExportButtons={true}
        />
        
        {/* Tabs */}
        <div className="flex space-x-8 mt-6">
          {['contacts', 'groups', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 border-b-2 text-lg font-medium capitalize ${
                activeTab === tab 
                  ? 'border-indigo-600 text-gray-900' 
                  : 'border-transparent text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {activeTab === 'contacts' && (
          <CommonFeatures
            summaryItems={summaryItems}
            onExportCSV={exportContactsToCSV}
            onExportPDF={exportContactsToPDF}
          >
            <div className="space-y-8">
              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">MR Management</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setIsAddMRDialogOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                  >
                    Add Individual MR
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVImport}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-200"
                    >
                      Import CSV
                    </label>
                    <button
                      onClick={downloadCSVTemplate}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* CSV Import Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>CSV Format:</strong> MR ID, First Name, Last Name, Phone Number, Group, Comments
                </p>
              </div>

              {/* Contacts Table */}
              <div className="bg-white bg-opacity-40 rounded-lg">
                {/* Table Header */}
                <div className="p-6 border-b bg-indigo-50">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">All Contacts</h2>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search Contacts..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 rounded-lg border-0 bg-gray-100"
                        />
                      </div>
                      <span className="text-sm text-gray-700 font-bold">
                        {filteredContacts.length} Contacts
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-indigo-50 border-b">
                        <th 
                          className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                          onClick={() => handleSort('mrId')}
                        >
                          <div className="flex items-center justify-center">
                            MR ID
                            {sortField === 'mrId' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                          onClick={() => handleSort('firstName')}
                        >
                          <div className="flex items-center justify-center">
                            Name
                            {sortField === 'firstName' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                          onClick={() => handleSort('phone')}
                        >
                          <div className="flex items-center justify-center">
                            Phone No.
                            {sortField === 'phone' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                          onClick={() => handleSort('group')}
                        >
                          <div className="flex items-center justify-center">
                            Group
                            {sortField === 'group' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Comments</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map(contact => (
                          <tr key={contact.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.mrId}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">
                              {contact.firstName} {contact.lastName}
                            </td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.phone}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.group}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.comments || '-'}</td>
                            <td className="py-3 px-6 text-sm text-center">
                              <button
                                onClick={() => deleteContact(contact.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center">
                              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-12 w-12 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-bold mb-2 text-indigo-600">
                                No Contacts Found
                              </h3>
                              <p className="text-sm text-indigo-600">
                                Add your first contact above or import from CSV
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
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <CommonFeatures
            summaryItems={summaryItems}
            onExportCSV={exportContactsToCSV}
            onExportPDF={exportContactsToPDF}
          >
            <div className="space-y-6">
              {/* Groups Management */}
              <div className="bg-white bg-opacity-40 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Groups Management</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({name: e.target.value})}
                      className="flex-1 px-3 py-3 rounded-lg border-0 bg-gray-100"
                      placeholder="Enter group name"
                    />
                    <button
                      onClick={addGroup}
                      className="px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                    >
                      Add Group
                    </button>
                  </div>
                </div>
              </div>

              {/* Groups List */}
              <div className="bg-white bg-opacity-40 rounded-lg">
                <div className="p-6 border-b bg-indigo-50">
                  <h2 className="text-2xl font-bold text-gray-900">All Groups</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-indigo-50 border-b">
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Group Name</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Contact Count</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.length > 0 ? (
                        groups.map(group => (
                          <tr key={group.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{group.name}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{group.contactCount}</td>
                            <td className="py-3 px-6 text-sm text-center">
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this group?')) {
                                    setGroups(groups.filter(g => g.id !== group.id));
                                  }
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center py-12">
                            <div className="flex flex-col items-center">
                              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-12 w-12 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-bold mb-2 text-indigo-600">
                                No Groups Found
                              </h3>
                              <p className="text-sm text-indigo-600">
                                Add your first group above
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
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <CommonFeatures
            summaryItems={summaryItems}
            onExportCSV={exportContactsToCSV}
            onExportPDF={exportContactsToPDF}
          >
            <div className="space-y-6">
              {/* Message Reports */}
              <div className="bg-white bg-opacity-40 rounded-lg">
                <div className="p-6 border-b bg-indigo-50">
                  <h2 className="text-2xl font-bold text-gray-900">Message Reports</h2>
                </div>
                <div className="p-6">
                  {messageLogs.length > 0 ? (
                    <div className="space-y-4">
                      {messageLogs.map(log => (
                        <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{log.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Sent to {log.groups.join(', ')} ({log.contactCount} contacts)
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(log.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No message reports available</p>
                      <p className="text-sm text-gray-400">Send messages to see reports here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CommonFeatures>
        )}

        {/* Add MR Dialog */}
        <AddMRDialog
          isOpen={isAddMRDialogOpen}
          onClose={() => setIsAddMRDialogOpen(false)}
          onAdd={handleAddMR}
          groups={groups}
        />
      </div>
    </div>
  );
};

export default SimpleMRTool;