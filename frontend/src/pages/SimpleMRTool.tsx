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

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('mr_contacts');
    const savedGroups = localStorage.getItem('mr_groups');
    const savedMessageLogs = localStorage.getItem('mr_message_logs');

    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
    if (savedMessageLogs) {
      setMessageLogs(JSON.parse(savedMessageLogs));
    }

    // Initialize default groups if none exist
    if (!savedGroups) {
      const defaultGroups = [
        { id: '1', name: 'North Zone', contactCount: 0 },
        { id: '2', name: 'South Zone', contactCount: 0 },
        { id: '3', name: 'East Zone', contactCount: 0 },
        { id: '4', name: 'West Zone', contactCount: 0 }
      ];
      setGroups(defaultGroups);
      localStorage.setItem('mr_groups', JSON.stringify(defaultGroups));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mr_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('mr_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('mr_message_logs', JSON.stringify(messageLogs));
  }, [messageLogs]);

  // Update group contact counts
  useEffect(() => {
    const updatedGroups = groups.map(group => ({
      ...group,
      contactCount: contacts.filter(contact => contact.group === group.name).length
    }));
    setGroups(updatedGroups);
  }, [contacts]);

  // Contact management functions
  const addContact = () => {
    if (!newContact.mrId || !newContact.firstName || !newContact.lastName || !newContact.phone || !newContact.group) {
      alert('Please fill in all required fields');
      return;
    }

    const contact: Contact = {
      id: Date.now().toString(),
      ...newContact
    };

    setContacts([...contacts, contact]);
    setNewContact({
      mrId: '',
      firstName: '',
      lastName: '',
      phone: '',
      group: '',
      comments: ''
    });
  };

  const deleteContact = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      setContacts(contacts.filter(contact => contact.id !== id));
    }
  };

  const addGroup = () => {
    if (!newGroup.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (groups.some(group => group.name.toLowerCase() === newGroup.name.toLowerCase())) {
      alert('Group already exists');
      return;
    }

    const group: Group = {
      id: Date.now().toString(),
      name: newGroup.name.trim(),
      contactCount: 0
    };

    setGroups([...groups, group]);
    setNewGroup({ name: '' });
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

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      const importedContacts: Contact[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const contact: Contact = {
            id: Date.now().toString() + i,
            mrId: values[0]?.trim() || '',
            firstName: values[1]?.trim() || '',
            lastName: values[2]?.trim() || '',
            phone: values[3]?.trim() || '',
            group: values[4]?.trim() || '',
            comments: values[5]?.trim() || ''
          };
          
          if (contact.mrId && contact.firstName && contact.lastName && contact.phone && contact.group) {
            importedContacts.push(contact);
          }
        }
      }

      if (importedContacts.length > 0) {
        setContacts([...contacts, ...importedContacts]);
        alert(`Successfully imported ${importedContacts.length} contacts`);
        setSelectedFile(null);
      } else {
        alert('No valid contacts found in CSV file');
      }
    };
    reader.readAsText(file);
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
    <div className="min-h-screen" style={{ background: '#ECEAE2', width: '1440px', height: '1024px' }}>
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-23 h-screen" style={{ background: '#2C2696', width: '92px' }}>
        <div className="flex flex-col items-center py-4 space-y-2">
          {/* Dashboard */}
          <button 
            onClick={() => handleSidebarNavigation('/dashboard')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <BarChart3 className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Dashboard</span>
          </button>
          
          {/* DMak Tool - Active */}
          <div className="flex flex-col items-center p-2 rounded-lg w-16 h-16 border border-gray-200" style={{ background: 'rgba(236, 234, 226, 0.1)' }}>
            <BarChart3 className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>DMak Tool</span>
            </div>
          
          {/* Groups */}
              <button
            onClick={() => handleSidebarNavigation('/groups')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
              >
            <Users className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Groups</span>
              </button>
          
          {/* Medical Items */}
          <button 
            onClick={() => handleSidebarNavigation('/mrs')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <FileText className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Medical Items</span>
          </button>
          
          {/* Campaigns */}
          <button 
            onClick={() => handleSidebarNavigation('/campaigns')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Campaigns</span>
          </button>
          
          {/* Templates */}
          <button 
            onClick={() => handleSidebarNavigation('/templates')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <FileText className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Templates</span>
          </button>
          
          {/* Manager */}
          <button 
            onClick={() => handleSidebarNavigation('/super-admin')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Shield className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Manager</span>
          </button>
          
          {/* Reports */}
          <button 
            onClick={() => handleSidebarNavigation('/reports')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Activity className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Reports</span>
          </button>
          
          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 mt-auto hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <LogOut className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Logout</span>
          </button>
          
          {/* DVK Logo */}
          <div className="mt-4">
            <img 
              src="/dvk-simple.svg" 
              alt="DVK" 
              style={{ width: '68px', height: '57px' }}
            />
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="ml-23" style={{ marginLeft: '102px', padding: '65px 102px 0 0' }}>
        {/* Header */}
        <div className="relative mb-8" style={{ marginBottom: '32px' }}>
          <div className="flex justify-between items-start">
            <div style={{ marginLeft: '100px' }}>
              <h1 className="text-3xl font-bold text-black mb-2" style={{ 
                fontFamily: 'Jura', 
                fontSize: '32px', 
                lineHeight: '38px',
                fontWeight: 700,
                marginBottom: '8px'
              }}>DMak Tool</h1>
              <p className="text-lg text-black" style={{ 
                fontFamily: 'Jura', 
                fontSize: '18.36px',
                lineHeight: '22px',
                fontWeight: 500,
                letterSpacing: '0.08em'
              }}>
                Simple tool for managing Medical Representatives and sending Whatsapp messages
              </p>
      </div>

            {/* Glenmark Logo */}
            <div className="absolute top-0 right-0" style={{ right: '102px' }}>
              <img 
                src="/glenmark-simple.svg" 
                alt="Glenmark" 
                style={{ width: '140px', height: '79px' }}
              />
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-8 mt-6" style={{ marginTop: '24px', marginLeft: '100px' }}>
              <button
              onClick={() => setActiveTab('contacts')}
              className={`pb-2 border-b-2 text-lg font-medium ${
                activeTab === 'contacts' 
                  ? 'border-blue-900 text-black' 
                  : 'border-transparent text-gray-600'
              }`}
              style={{ 
                fontFamily: 'Jura',
                fontSize: '18.36px',
                lineHeight: '22px',
                fontWeight: activeTab === 'contacts' ? 700 : 500,
                letterSpacing: '0.08em',
                paddingBottom: '8px',
                borderBottomWidth: activeTab === 'contacts' ? '2px' : '0px',
                borderBottomColor: activeTab === 'contacts' ? '#2C2696' : 'transparent'
              }}
            >
              Contacts
              </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-2 border-b-2 text-lg font-medium ${
                activeTab === 'messages' 
                  ? 'border-blue-900 text-black' 
                  : 'border-transparent text-gray-600'
              }`}
              style={{ 
                fontFamily: 'Jura',
                fontSize: '18.36px',
                lineHeight: '22px',
                fontWeight: activeTab === 'messages' ? 700 : 500,
                letterSpacing: '0.08em',
                paddingBottom: '8px',
                borderBottomWidth: activeTab === 'messages' ? '2px' : '0px',
                borderBottomColor: activeTab === 'messages' ? '#2C2696' : 'transparent'
              }}
            >
              Send Messages
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-2 border-b-2 text-lg font-medium ${
                activeTab === 'dashboard' 
                  ? 'border-blue-900 text-black' 
                  : 'border-transparent text-gray-600'
              }`}
              style={{ 
                fontFamily: 'Jura',
                fontSize: '18.36px',
                lineHeight: '22px',
                fontWeight: activeTab === 'dashboard' ? 700 : 500,
                letterSpacing: '0.08em',
                paddingBottom: '8px',
                borderBottomWidth: activeTab === 'dashboard' ? '2px' : '0px',
                borderBottomColor: activeTab === 'dashboard' ? '#2C2696' : 'transparent'
              }}
            >
              Dashboard
            </button>
            
            {/* Export Data Button */}
            <button
              onClick={exportContactsToCSV}
              className="ml-auto px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ 
                background: '#2C2696', 
                fontFamily: 'Jura',
                fontSize: '13.51px',
                lineHeight: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              Export Data
            </button>
        </div>
      </div>

        {/* Main Content Area */}
        <div className="relative" style={{ width: '1308px', height: '935px', marginLeft: '100px' }}>
          {/* Background with blur effect */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(120.66deg, rgba(255, 255, 255, 0.4) 7.56%, rgba(255, 255, 255, 0.1) 93.23%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '15px',
              width: '1308px',
              height: '935px'
            }}
          />
          
          {/* Content */}
          <div className="relative" style={{ padding: '24px' }}>
                {/* Contacts Tab */}
        {activeTab === 'contacts' && (
              <div className="grid grid-cols-2 gap-8" style={{ gap: '29px' }}>
                {/* Left Column - Add New Contact */}
                <div className="bg-white rounded-lg" style={{ 
                  background: 'rgba(215, 181, 109, 0.1)', 
                  borderRadius: '10px',
                  width: '541px',
                  height: '627px',
                  padding: '24px'
                }}>
                  <h2 className="text-2xl font-bold text-black mb-6" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '24px',
                    lineHeight: '28px',
                    fontWeight: 700,
                    marginBottom: '24px'
                  }}>Add New Contact</h2>
                  
                  <div className="space-y-4" style={{ gap: '16px' }}>
                    {/* MR ID */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-1" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '15px',
                        lineHeight: '18px',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        marginBottom: '8px'
                      }}>MR ID*</label>
                <input
                  type="text"
                  value={newContact.mrId}
                  onChange={(e) => setNewContact({...newContact, mrId: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0"
                        style={{ 
                          background: '#F2F2F2',
                          borderRadius: '10px',
                          height: '44px',
                          padding: '12px 16px'
                        }}
                        placeholder="Enter MR ID"
                      />
                    </div>
                    
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-1" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '15px',
                        lineHeight: '18px',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        marginBottom: '8px'
                      }}>First Name*</label>
                <input
                  type="text"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0"
                        style={{ 
                          background: '#F2F2F2',
                          borderRadius: '10px',
                          height: '44px',
                          padding: '12px 16px'
                        }}
                        placeholder="Enter first name"
                      />
                    </div>
                    
                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-1" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '15px',
                        lineHeight: '18px',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        marginBottom: '8px'
                      }}>Last Name*</label>
                <input
                  type="text"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0"
                        style={{ 
                          background: '#F2F2F2',
                          borderRadius: '10px',
                          height: '44px',
                          padding: '12px 16px'
                        }}
                        placeholder="Enter last name"
                      />
                    </div>
                    
                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-1" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '15px',
                        lineHeight: '18px',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        marginBottom: '8px'
                      }}>Phone Number*</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                        className="w-full px-3 py-3 rounded-lg border-0"
                        style={{ 
                          background: '#F2F2F2',
                          borderRadius: '10px',
                          height: '44px',
                          padding: '12px 16px'
                        }}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    {/* Select Group */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-1" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '15px',
                        lineHeight: '18px',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        marginBottom: '8px'
                      }}>Select Group*</label>
                      <div className="relative">
                <select
                  value={newContact.group}
                  onChange={(e) => setNewContact({...newContact, group: e.target.value})}
                          className="w-full px-3 py-3 rounded-lg border-0 appearance-none"
                          style={{ 
                            background: '#F2F2F2',
                            borderRadius: '10px',
                            height: '44px',
                            padding: '12px 16px'
                          }}
                        >
                          <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.name}>{group.name}</option>
                  ))}
                </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Comments */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-1" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '15px',
                        lineHeight: '18px',
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        marginBottom: '8px'
                      }}>Comments</label>
                      <textarea
                  value={newContact.comments}
                  onChange={(e) => setNewContact({...newContact, comments: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-3 rounded-lg border-0"
                        style={{ 
                          background: '#F2F2F2',
                          borderRadius: '10px',
                          height: '88px',
                          padding: '12px 16px'
                        }}
                        placeholder="Enter comments"
                />
              </div>
                    
                    {/* Add Contacts Button */}
              <button
                onClick={addContact}
                      className="w-full px-4 py-2 rounded-lg text-white text-sm font-semibold"
                      style={{ 
                        background: '#2C2696', 
                        fontFamily: 'Jura',
                        fontSize: '13.51px',
                        lineHeight: '16px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        height: '36px'
                      }}
                    >
                      Add Contacts
              </button>
                  </div>
            </div>

                {/* Right Column - Import CSV and Manage Groups */}
                <div className="space-y-6" style={{ gap: '31px' }}>
                  {/* Import Contacts from CSV */}
                  <div className="bg-white rounded-lg" style={{ 
                    background: 'rgba(215, 181, 109, 0.1)', 
                    borderRadius: '10px',
                    width: '541px',
                    height: '298px',
                    padding: '24px'
                  }}>
                    <h2 className="text-2xl font-bold text-black mb-6" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '24px',
                      lineHeight: '28px',
                      fontWeight: 700,
                      marginBottom: '24px'
                    }}>Import Contacts from CSV</h2>
                    
                    <div className="space-y-4" style={{ gap: '16px' }}>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSelectedFile(file);
                            handleCSVImport(e);
                          }}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer"
                          style={{ 
                            background: 'rgba(44, 38, 150, 0.11)', 
                            color: '#2C2696', 
                            fontFamily: 'Jura',
                            fontSize: '16px',
                            lineHeight: '19px',
                            fontWeight: 700,
                            padding: '10px 15px',
                            borderRadius: '20px'
                          }}
                        >
                          Choose File
                        </label>
                        <span className="text-sm text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '16px',
                          lineHeight: '19px',
                          fontWeight: 700
                        }}>
                          {selectedFile ? selectedFile.name : 'No File Chosen'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-black" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '16px',
                        lineHeight: '19px',
                        fontWeight: 700
                      }}>
                        CSV format: MR ID, First Name, Last Name, Phone Number, Group, Comments
                      </p>
                      
                <button
                  onClick={downloadCSVTemplate}
                        className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                        style={{ 
                          background: '#1E1E1E', 
                          fontFamily: 'Jura',
                          fontSize: '13.51px',
                          lineHeight: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          height: '36px'
                        }}
                      >
                  Download Template
                </button>
              </div>
            </div>

                  {/* Manage Groups */}
                  <div className="bg-white rounded-lg" style={{ 
                    background: 'rgba(215, 181, 109, 0.1)', 
                    borderRadius: '10px',
                    width: '541px',
                    height: '298px',
                    padding: '24px'
                  }}>
                    <h2 className="text-2xl font-bold text-black mb-6" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '24px',
                      lineHeight: '28px',
                      fontWeight: 700,
                      marginBottom: '24px'
                    }}>Manage Groups</h2>
                    
                    <div className="space-y-4" style={{ gap: '16px' }}>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '15px',
                          lineHeight: '18px',
                          fontWeight: 500,
                          letterSpacing: '0.08em',
                          marginBottom: '8px'
                        }}>New Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({name: e.target.value})}
                          className="w-full px-3 py-3 rounded-lg border-0"
                          style={{ 
                            background: '#F2F2F2',
                            borderRadius: '10px',
                            height: '55px',
                            padding: '12px 16px'
                          }}
                          placeholder="Enter group name"
                        />
                      </div>
                      
                <button
                  onClick={addGroup}
                        className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                        style={{ 
                          background: '#1E1E1E', 
                          fontFamily: 'Jura',
                          fontSize: '13.51px',
                          lineHeight: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          height: '36px'
                        }}
                      >
                  Add Group
                </button>
              </div>
                      </div>
                    </div>
                  </div>
            )}

            {/* Contacts Table */}
            {activeTab === 'contacts' && (
              <div className="mt-8 bg-white rounded-lg" style={{ 
                background: 'rgba(215, 181, 109, 0.1)',
                borderRadius: '10px',
                width: '1111px',
                height: '627px',
                marginTop: '32px'
              }}>
                {/* Table Header */}
                <div className="p-6 border-b" style={{ 
                  background: 'rgba(44, 38, 150, 0.1)',
                  borderRadius: '10px 10px 0px 0px',
                  padding: '24px'
                }}>
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '24px',
                      lineHeight: '28px',
                      fontWeight: 700
                    }}>All Contacts</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                          placeholder="Search Contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 rounded-lg border-0"
                          style={{ 
                            background: '#F2F2F2',
                            borderRadius: '10px',
                            height: '44px',
                            padding: '12px 16px'
                          }}
                      />
                    </div>
                      <span className="text-sm text-black font-bold" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '14px',
                        lineHeight: '17px',
                        fontWeight: 700
                      }}>
                        {filteredContacts.length} Contacts
                      </span>
                  </div>
                </div>
              </div>
                
                {/* Table */}
                <div className="overflow-x-auto" style={{ 
                  background: '#F2F2F2',
                  borderRadius: '10px',
                  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  margin: '38px',
                  width: '1038px',
                  height: '498px'
                }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ 
                        background: 'rgba(44, 38, 150, 0.1)',
                        borderRadius: '10px 10px 0px 0px',
                        height: '53px'
                      }}>
                        <th className="text-center py-3 px-6 text-sm font-medium text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '14px',
                          lineHeight: '17px',
                          fontWeight: 300
                        }}>MR ID</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '14px',
                          lineHeight: '17px',
                          fontWeight: 300
                        }}>Name</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '14px',
                          lineHeight: '17px',
                          fontWeight: 300
                        }}>Phone No.</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '14px',
                          lineHeight: '17px',
                          fontWeight: 300
                        }}>Group</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '14px',
                          lineHeight: '17px',
                          fontWeight: 300
                        }}>Comments</th>
                        <th className="text-center py-3 px-6 text-sm font-medium text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '14px',
                          lineHeight: '17px',
                          fontWeight: 300
                        }}>Actions</th>
                    </tr>
                  </thead>
                    <tbody>
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map(contact => (
                          <tr key={contact.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-6 text-sm text-black text-center" style={{ 
                              fontFamily: 'Jura',
                              fontSize: '14px',
                              lineHeight: '17px'
                            }}>{contact.mrId}</td>
                            <td className="py-3 px-6 text-sm text-black text-center" style={{ 
                              fontFamily: 'Jura',
                              fontSize: '14px',
                              lineHeight: '17px'
                            }}>
                              {contact.firstName} {contact.lastName}
                            </td>
                            <td className="py-3 px-6 text-sm text-black text-center" style={{ 
                              fontFamily: 'Jura',
                              fontSize: '14px',
                              lineHeight: '17px'
                            }}>{contact.phone}</td>
                            <td className="py-3 px-6 text-sm text-black text-center" style={{ 
                              fontFamily: 'Jura',
                              fontSize: '14px',
                              lineHeight: '17px'
                            }}>{contact.group}</td>
                            <td className="py-3 px-6 text-sm text-black text-center" style={{ 
                              fontFamily: 'Jura',
                              fontSize: '14px',
                              lineHeight: '17px'
                            }}>{contact.comments || '-'}</td>
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
                              <h3 className="text-lg font-bold mb-2" style={{ 
                                fontFamily: 'Jura',
                                fontSize: '18.36px',
                                lineHeight: '22px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                color: '#2C2696'
                              }}>
                                No Contacts Found
                              </h3>
                              <p className="text-sm" style={{ 
                                fontFamily: 'Jura',
                                fontSize: '10px',
                                lineHeight: '12px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                color: '#2C2696'
                              }}>
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
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
                {/* Top Row - Two Cards Side by Side */}
                <div className="grid grid-cols-2 gap-6" style={{ gap: '24px' }}>
                  {/* Select Target Groups Card */}
                  <div className="bg-white rounded-lg p-6" style={{ 
                    background: 'rgba(215, 181, 109, 0.1)', 
                    borderRadius: '10px',
                    width: '541px',
                    height: '282px',
                    padding: '24px'
                  }}>
                    <h2 className="text-2xl font-bold text-black mb-6" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '24px',
                      lineHeight: '28px',
                      fontWeight: 700,
                      marginBottom: '24px'
                    }}>Select Target Groups</h2>
                    
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
                        className="w-full px-4 py-3 rounded-lg border-0 appearance-none"
                        style={{ 
                          background: '#F2F2F2',
                          borderRadius: '10px',
                          height: '52px',
                          padding: '12px 16px',
                          fontFamily: 'Jura',
                          fontSize: '16px'
                        }}
                      >
                        <option value="">Select a group</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.name}>{group.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
                    
                    {/* Selected Groups Display Area */}
                    <div className="mt-4 p-4 rounded-lg" style={{ 
                      background: '#F2F2F2',
                      borderRadius: '10px',
                      minHeight: '100px',
                      marginTop: '16px'
                    }}>
                      {selectedGroups.length > 0 ? (
                        <div className="space-y-2">
                          {selectedGroups.map(groupName => (
                            <div key={groupName} className="flex items-center justify-between p-2 bg-white rounded-lg">
                              <span className="text-sm font-medium text-black" style={{ fontFamily: 'Jura' }}>
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
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Jura' }}>
                            {contacts.filter(c => selectedGroups.includes(c.group)).length} contacts selected
                  </p>
                </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Jura' }}>
                          No groups selected
                        </p>
              )}
                    </div>
            </div>

                  {/* Compose Message Card */}
                  <div className="bg-white rounded-lg p-6" style={{ 
                    background: 'rgba(215, 181, 109, 0.1)', 
                    borderRadius: '10px',
                    width: '541px',
                    height: '282px',
                    padding: '24px'
                  }}>
                    <h2 className="text-2xl font-bold text-black mb-6" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '24px',
                      lineHeight: '28px',
                      fontWeight: 700,
                      marginBottom: '24px'
                    }}>Compose Message</h2>
                    
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                      rows={6}
                      maxLength={10000}
                      className="w-full px-3 py-3 rounded-lg border-0 resize-none"
                      style={{ 
                        background: '#F2F2F2',
                        borderRadius: '10px',
                        height: '161px',
                        padding: '12px 16px',
                        fontFamily: 'Jura',
                        fontSize: '16px'
                      }}
                    />
                    
              <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm ${message.length > 9000 ? 'text-red-600' : 'text-gray-500'}`} style={{ 
                        fontFamily: 'Jura',
                        fontSize: '13.51px',
                        lineHeight: '16px',
                        fontWeight: 600,
                        letterSpacing: '0.08em'
                      }}>
                        {message.length}/10,000 Characters
                </span>
                      <span className="text-sm text-gray-500" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '13.51px',
                        lineHeight: '16px',
                        fontWeight: 600,
                        letterSpacing: '0.08em'
                      }}>
                        {selectedGroups.length > 0 ? `${contacts.filter(c => selectedGroups.includes(c.group)).length} recipients` : 'No Groups Selected'}
                </span>
                    </div>
              </div>
            </div>

                {/* Bottom Section - Send Messages */}
                <div className="bg-white rounded-lg p-6" style={{ 
                  background: 'rgba(215, 181, 109, 0.1)', 
                  borderRadius: '10px',
                  width: '1111px',
                  height: '318px',
                  padding: '24px'
                }}>
                  <h2 className="text-2xl font-bold text-black mb-6" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '24px',
                    lineHeight: '28px',
                    fontWeight: 700,
                    marginBottom: '24px'
                  }}>Send Messages</h2>
                  
              <div className="space-y-4">
                    {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={openWhatsAppWeb}
                        className="inline-flex items-center px-6 py-3 rounded-lg text-white text-sm font-semibold"
                        style={{ 
                          background: '#2C2696', 
                          fontFamily: 'Jura',
                          fontSize: '13.51px',
                          lineHeight: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          height: '43px'
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Whatsapp Web
                  </button>
                  <button
                    onClick={copyPhoneNumbers}
                    disabled={selectedGroups.length === 0}
                        className="inline-flex items-center px-6 py-3 rounded-lg text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          background: '#1E1E1E', 
                          fontFamily: 'Jura',
                          fontSize: '13.51px',
                          lineHeight: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          height: '43px'
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                    Copy Phone Numbers
                  </button>
                </div>
                
                    {/* Instructions Box */}
                    <div className="p-4 rounded-lg" style={{ 
                      background: 'rgba(44, 38, 150, 0.05)',
                      border: '1px solid #2C2696',
                      borderRadius: '10px',
                      width: '1014px',
                      height: '128px',
                      padding: '16px'
                    }}>
                      <h3 className="text-sm font-medium text-black mb-2" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '13.51px',
                        lineHeight: '16px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#2C2696'
                      }}>How to send messages</h3>
                      <p className="text-sm text-black" style={{ 
                        fontFamily: 'Jura',
                        fontSize: '14px',
                        lineHeight: '17px',
                        fontWeight: 400,
                        letterSpacing: '0.08em',
                        color: '#2C2696'
                      }}>
                        Click "Open Whatsapp Web" to open Whatsapp in a new tab. Click "Copy Phone Numbers" to copy all phone numbers. In Whatsapp Web, paste the numbers and send your message to each contact. This is a manual process as per requirements.
                      </p>
                </div>

                    {/* Log Messages Button */}
                    <div className="flex justify-end">
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || selectedGroups.length === 0}
                        className="px-6 py-3 rounded-lg text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          background: '#1E1E1E', 
                          fontFamily: 'Jura',
                          fontSize: '13.51px',
                          lineHeight: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          height: '43px'
                        }}
                      >
                        Log Messages (For Tracking)
                </button>
                    </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg p-6" style={{ background: 'rgba(215, 181, 109, 0.1)' }}>
                <div className="flex items-center">
                      <div className="p-3 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <Users className="h-6 w-6" style={{ color: '#3B82F6' }} />
                  </div>
                  <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Jura' }}>Total Contacts</p>
                        <p className="text-2xl font-semibold text-black" style={{ fontFamily: 'Jura' }}>{stats.totalContacts}</p>
                  </div>
                </div>
              </div>
              
                  <div className="bg-white rounded-lg p-6" style={{ background: 'rgba(215, 181, 109, 0.1)' }}>
                <div className="flex items-center">
                      <div className="p-3 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                        <FileText className="h-6 w-6" style={{ color: '#22C55E' }} />
                  </div>
                  <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Jura' }}>Total Groups</p>
                        <p className="text-2xl font-semibold text-black" style={{ fontFamily: 'Jura' }}>{stats.totalGroups}</p>
                  </div>
                </div>
              </div>
              
                  <div className="bg-white rounded-lg p-6" style={{ background: 'rgba(215, 181, 109, 0.1)' }}>
                <div className="flex items-center">
                      <div className="p-3 rounded-full" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                        <MessageSquare className="h-6 w-6" style={{ color: '#A855F7' }} />
                  </div>
                  <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Jura' }}>Messages Sent</p>
                        <p className="text-2xl font-semibold text-black" style={{ fontFamily: 'Jura' }}>{stats.totalMessages}</p>
                  </div>
                </div>
              </div>
              
                  <div className="bg-white rounded-lg p-6" style={{ background: 'rgba(215, 181, 109, 0.1)' }}>
                <div className="flex items-center">
                      <div className="p-3 rounded-full" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
                        <BarChart3 className="h-6 w-6" style={{ color: '#F97316' }} />
                  </div>
                  <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Jura' }}>Engagement Rate</p>
                        <p className="text-2xl font-semibold text-black" style={{ fontFamily: 'Jura' }}>{stats.engagementRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
                <div className="bg-white rounded-lg" style={{ background: 'rgba(215, 181, 109, 0.1)' }}>
                  <div className="p-6 border-b" style={{ background: 'rgba(44, 38, 150, 0.1)' }}>
                    <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'Jura' }}>Recent Message Activity</h2>
              </div>
              <div className="p-6">
                {messageLogs.length > 0 ? (
                  <div className="space-y-4">
                    {messageLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                                <p className="text-sm font-medium text-black" style={{ fontFamily: 'Jura' }}>{log.message}</p>
                                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Jura' }}>
                              Sent to {log.groups.join(', ')} ({log.contactCount} contacts)
                            </p>
                          </div>
                              <span className="text-xs text-gray-500" style={{ fontFamily: 'Jura' }}>
                            {new Date(log.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500" style={{ fontFamily: 'Jura' }}>No messages sent yet</p>
                        <p className="text-sm text-gray-400" style={{ fontFamily: 'Jura' }}>Go to the Messages tab to send your first message</p>
                  </div>
                )}
              </div>
            </div>

            {/* Data Management */}
                <div className="bg-white rounded-lg p-6" style={{ background: 'rgba(215, 181, 109, 0.1)' }}>
                  <h2 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: 'Jura' }}>Data Management</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                        <h3 className="font-medium text-black" style={{ fontFamily: 'Jura' }}>Export Data</h3>
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'Jura' }}>Download your contacts and groups as CSV files</p>
                  </div>
                  <button
                    onClick={exportContactsToCSV}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-gray-700 text-sm font-medium"
                        style={{ background: '#F2F2F2', fontFamily: 'Jura' }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Contacts
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                        <h3 className="font-medium text-black" style={{ fontFamily: 'Jura' }}>Clear All Data</h3>
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'Jura' }}>Remove all contacts, groups, and message logs</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                        setContacts([]);
                        setGroups([]);
                        setMessageLogs([]);
                        localStorage.removeItem('mr_contacts');
                        localStorage.removeItem('mr_groups');
                        localStorage.removeItem('mr_message_logs');
                      }
                    }}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-red-700 text-sm font-medium"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', fontFamily: 'Jura' }}
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
    </div>
  );
};

export default SimpleMRTool;
