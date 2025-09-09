import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Download, 
  Trash2, 
  Search,
  FileText,
  Copy,
  ExternalLink,
  BarChart3,
  ChevronDown,
  LogOut,
  Shield,
  Activity,
  X
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'contacts' | 'messages' | 'dashboard'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newContact, setNewContact] = useState({
    mrId: '',
    firstName: '',
    lastName: '',
    phone: '',
    group: '',
    comments: ''
  });

  const [newGroup, setNewGroup] = useState({
    name: ''
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
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
  const addContact = async () => {
    if (!newContact.mrId || !newContact.firstName || !newContact.lastName || !newContact.phone || !newContact.group) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Find the group ID by name
      const selectedGroup = groups.find(g => g.name === newContact.group);
      if (!selectedGroup) {
        alert('Selected group not found');
        return;
      }

      await mockApi.post('/mrs', {
        mrId: newContact.mrId,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        phone: newContact.phone,
        groupId: selectedGroup.id,
        comments: newContact.comments
      });

      // Add to local state (since we're using mock API)
      const newContactData: Contact = {
        id: Date.now().toString(),
        mrId: newContact.mrId,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        phone: newContact.phone,
        group: newContact.group,
        comments: newContact.comments
      };
      
      setContacts([...contacts, newContactData]);
      
      setNewContact({
        mrId: '',
        firstName: '',
        lastName: '',
        phone: '',
        group: '',
        comments: ''
      });
      
      alert('Contact added successfully!');
    } catch (error: any) {
      console.error('Error adding contact:', error);
      alert('Failed to add contact');
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
      
      setSelectedFile(null);
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  // Message functions
  const sendMessage = () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (selectedGroups.length === 0) {
      alert('Please select at least one group');
      return;
    }

    const targetContacts = contacts.filter(contact => 
      selectedGroups.includes(contact.group)
    );

    if (targetContacts.length === 0) {
      alert('No contacts found in selected groups');
      return;
    }

    const messageLog: MessageLog = {
      id: Date.now().toString(),
      message: message.trim(),
      groups: selectedGroups,
      sentAt: new Date().toISOString(),
      contactCount: targetContacts.length
    };

    setMessageLogs([messageLog, ...messageLogs]);
    setMessage('');
    setSelectedGroups([]);
    alert('Message logged for tracking!');
  };

  const openWhatsAppWeb = () => {
    window.open('https://web.whatsapp.com', '_blank');
  };

  const copyPhoneNumbers = () => {
    const targetContacts = contacts.filter(contact => 
      selectedGroups.includes(contact.group)
    );

    const phoneNumbers = targetContacts.map(contact => contact.phone).join('\n');
    navigator.clipboard.writeText(phoneNumbers).then(() => {
      alert('Phone numbers copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy phone numbers. Please copy manually:\n\n' + phoneNumbers);
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.mrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-23 h-screen bg-indigo-900" style={{ width: '92px' }}>
        <div className="flex flex-col items-center py-4 space-y-2">
          {/* Dashboard */}
          <button 
            onClick={() => handleSidebarNavigation('/dashboard')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <BarChart3 className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Dashboard</span>
          </button>
          
          {/* DMak Tool - Active */}
          <div className="flex flex-col items-center p-2 rounded-lg w-16 h-16 border border-gray-200 bg-white bg-opacity-10">
            <BarChart3 className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">DMak Tool</span>
          </div>
          
          {/* Groups */}
          <button
            onClick={() => handleSidebarNavigation('/groups')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Users className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Groups</span>
          </button>
          
          {/* Other navigation items */}
          <button 
            onClick={() => handleSidebarNavigation('/mrs')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <FileText className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Medical Items</span>
          </button>
          
          <button 
            onClick={() => handleSidebarNavigation('/campaigns')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Campaigns</span>
          </button>
          
          <button 
            onClick={() => handleSidebarNavigation('/templates')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <FileText className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Templates</span>
          </button>
          
          <button 
            onClick={() => handleSidebarNavigation('/super-admin')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Shield className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Manager</span>
          </button>
          
          <button 
            onClick={() => handleSidebarNavigation('/reports')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Activity className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Reports</span>
          </button>
          
          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 mt-auto hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <LogOut className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">DMak Tool</h1>
              <p className="text-lg text-gray-600">
                Simple tool for managing Medical Representatives and sending Whatsapp messages
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-8 mt-6">
            {['contacts', 'messages', 'dashboard'].map((tab) => (
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
            
            {/* Export Data Button */}
            <button
              onClick={exportContactsToCSV}
              className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 min-h-96">
          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Add New Contact */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Contact</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MR ID*</label>
                      <input
                        type="text"
                        value={newContact.mrId}
                        onChange={(e) => setNewContact({...newContact, mrId: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
                        placeholder="Enter MR ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                      <input
                        type="text"
                        value={newContact.firstName}
                        onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
                        placeholder="Enter first name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                      <input
                        type="text"
                        value={newContact.lastName}
                        onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
                        placeholder="Enter last name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                      <input
                        type="tel"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Group*</label>
                      <div className="relative">
                        <select
                          value={newContact.group}
                          onChange={(e) => setNewContact({...newContact, group: e.target.value})}
                          className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100 appearance-none"
                        >
                          <option value="">Select a group</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.name}>{group.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                      <textarea
                        value={newContact.comments}
                        onChange={(e) => setNewContact({...newContact, comments: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
                        placeholder="Enter comments"
                      />
                    </div>
                    
                    <button
                      onClick={addContact}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                    >
                      Add Contact
                    </button>
                  </div>
                </div>

                {/* Right Column - Import CSV and Manage Groups */}
                <div className="space-y-6">
                  {/* Import Contacts from CSV */}
                  <div className="bg-white bg-opacity-40 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Contacts from CSV</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVImport}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold cursor-pointer hover:bg-indigo-200"
                        >
                          Choose File
                        </label>
                        <span className="text-sm text-gray-700">
                          {selectedFile ? selectedFile.name : 'No File Chosen'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700">
                        CSV format: MR ID, First Name, Last Name, Phone Number, Group, Comments
                      </p>
                      
                      <button
                        onClick={downloadCSVTemplate}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900"
                      >
                        Download Template
                      </button>
                    </div>
                  </div>

                  {/* Manage Groups */}
                  <div className="bg-white bg-opacity-40 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Groups</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Group Name</label>
                        <input
                          type="text"
                          value={newGroup.name}
                          onChange={(e) => setNewGroup({name: e.target.value})}
                          className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
                          placeholder="Enter group name"
                        />
                      </div>
                      
                      <button
                        onClick={addGroup}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900"
                      >
                        Add Group
                      </button>
                    </div>
                  </div>
                </div>
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
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">MR ID</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Name</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Phone No.</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Group</th>
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
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading contacts and groups...</p>
                </div>
              ) : (
                <>
                  {/* Top Row - Two Cards Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Select Target Groups Card */}
                    <div className="bg-white bg-opacity-40 rounded-lg p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Target Groups</h2>
                      
                      {/* Dropdown for Group Selection */}
                      <div className="relative">
                        <select
                          value={selectedGroups[0] || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedGroups([e.target.value]);
                            } else {
                              setSelectedGroups([]);
                            }
                          }}
                          className="w-full px-4 py-3 rounded-lg border-0 bg-gray-100 appearance-none"
                        >
                          <option value="">Select a group</option>
                          {groups.length > 0 ? (
                            groups.map(group => (
                              <option key={group.id} value={group.name}>{group.name}</option>
                            ))
                          ) : (
                            <option value="" disabled>No groups available</option>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      
                      {/* Selected Groups Display Area */}
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg min-h-24">
                        {selectedGroups.length > 0 ? (
                          <div className="space-y-2">
                            {selectedGroups.map(groupName => (
                              <div key={groupName} className="flex items-center justify-between p-2 bg-white rounded-lg">
                                <span className="text-sm font-medium text-gray-900">
                                  {groupName}
                                </span>
                                <button
                                  onClick={() => setSelectedGroups(selectedGroups.filter(g => g !== groupName))}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <p className="text-xs text-gray-500">
                              {contacts.filter(c => selectedGroups.includes(c.group)).length} contacts selected
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center">
                            No groups selected
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Compose Message Card */}
                    <div className="bg-white bg-opacity-40 rounded-lg p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Compose Message</h2>
                      
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={6}
                        maxLength={10000}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100 resize-none"
                      />
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-sm ${message.length > 9000 ? 'text-red-600' : 'text-gray-500'}`}>
                          {message.length}/10,000 Characters
                        </span>
                        <span className="text-sm text-gray-500">
                          {selectedGroups.length > 0 ? `${contacts.filter(c => selectedGroups.includes(c.group)).length} recipients` : 'No Groups Selected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Send Messages */}
                  <div className="bg-white bg-opacity-40 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Messages</h2>
                    
                    <div className="space-y-4">
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={openWhatsAppWeb}
                          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open WhatsApp Web
                        </button>
                        <button
                          onClick={copyPhoneNumbers}
                          disabled={selectedGroups.length === 0}
                          className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Phone Numbers
                        </button>
                      </div>
                  
                      {/* Instructions Box */}
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h3 className="text-sm font-medium text-indigo-800 mb-2">How to send messages</h3>
                        <p className="text-sm text-indigo-700">
                          Click "Open WhatsApp Web" to open WhatsApp in a new tab. Click "Copy Phone Numbers" to copy all phone numbers. In WhatsApp Web, paste the numbers and send your message to each contact. This is a manual process as per requirements.
                        </p>
                      </div>

                      {/* Log Messages Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={sendMessage}
                          disabled={!message.trim() || selectedGroups.length === 0}
                          className="px-6 py-3 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Log Message (For Tracking)
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalContacts}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Groups</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalGroups}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-orange-100">
                      <BarChart3 className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.engagementRate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white bg-opacity-40 rounded-lg">
                <div className="p-6 border-b bg-indigo-50">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Message Activity</h2>
                </div>
                <div className="p-6">
                  {messageLogs.length > 0 ? (
                    <div className="space-y-4">
                      {messageLogs.slice(0, 5).map(log => (
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
                      <p className="text-gray-500">No messages sent yet</p>
                      <p className="text-sm text-gray-400">Go to the Messages tab to send your first message</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-white bg-opacity-40 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Management</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Export Data</h3>
                      <p className="text-sm text-gray-500">Download your contacts and groups as CSV files</p>
                    </div>
                    <button
                      onClick={exportContactsToCSV}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Contacts
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Clear All Data</h3>
                      <p className="text-sm text-gray-500">Remove all contacts, groups, and message logs</p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                          setContacts([]);
                          setGroups([]);
                          setMessageLogs([]);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleMRTool;