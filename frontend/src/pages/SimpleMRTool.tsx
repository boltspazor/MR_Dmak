import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Download, 
  Upload, 
  Trash2, 
  Search,
  Plus,
  FileText,
  Smartphone,
  Copy,
  ExternalLink,
  BarChart3
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
  const [activeTab, setActiveTab] = useState<'contacts' | 'messages' | 'dashboard'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [message, setMessage] = useState('');

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

  const deleteGroup = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group && group.contactCount > 0) {
      alert('Cannot delete group with existing contacts. Please move or delete all contacts first.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this group?')) {
      setGroups(groups.filter(g => g.id !== id));
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

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MR Communication Tool</h1>
              <p className="text-gray-600">Simple tool for managing Medical Representatives and sending WhatsApp messages</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportContactsToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'contacts', label: 'Contacts', icon: Users },
              { id: 'messages', label: 'Send Messages', icon: MessageSquare },
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Add Contact Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="MR ID *"
                  value={newContact.mrId}
                  onChange={(e) => setNewContact({...newContact, mrId: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="First Name *"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone *"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newContact.group}
                  onChange={(e) => setNewContact({...newContact, group: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Group *</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.name}>{group.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Comments"
                  value={newContact.comments}
                  onChange={(e) => setNewContact({...newContact, comments: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={addContact}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </button>
            </div>

            {/* CSV Import */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Contacts from CSV</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={downloadCSVTemplate}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                CSV format: MR ID, First Name, Last Name, Phone, Group, Comments
              </p>
            </div>

            {/* Groups Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Groups</h2>
              <div className="flex items-center space-x-4 mb-4">
                <input
                  type="text"
                  placeholder="New Group Name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({name: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addGroup}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groups.map(group => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">{group.contactCount} contacts</p>
                      </div>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">All Contacts</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-sm text-gray-500">{filteredContacts.length} contacts</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MR ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map(contact => (
                      <tr key={contact.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.mrId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.firstName} {contact.lastName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.group}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.comments || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredContacts.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No contacts found</p>
                    <p className="text-sm text-gray-400">Add your first contact above or import from CSV</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Group Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Target Groups</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groups.map(group => (
                  <label key={group.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroups([...selectedGroups, group.name]);
                        } else {
                          setSelectedGroups(selectedGroups.filter(g => g !== group.name));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{group.name}</span>
                      <p className="text-sm text-gray-500">{group.contactCount} contacts</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedGroups.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Selected: {selectedGroups.join(', ')} 
                    ({contacts.filter(c => selectedGroups.includes(c.group)).length} total contacts)
                  </p>
                </div>
              )}
            </div>

            {/* Message Composition */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm ${message.length > 900 ? 'text-red-600' : 'text-gray-500'}`}>
                  {message.length}/1000 characters
                </span>
                <span className="text-sm text-gray-500">
                  {selectedGroups.length > 0 ? `${contacts.filter(c => selectedGroups.includes(c.group)).length} recipients` : 'No groups selected'}
                </span>
              </div>
            </div>

            {/* Message Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Message</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={openWhatsAppWeb}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Open WhatsApp Web
                  </button>
                  <button
                    onClick={copyPhoneNumbers}
                    disabled={selectedGroups.length === 0}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Phone Numbers
                  </button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">How to send messages:</h3>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Click "Open WhatsApp Web" to open WhatsApp in a new tab</li>
                    <li>Click "Copy Phone Numbers" to copy all recipient numbers</li>
                    <li>In WhatsApp Web, paste the numbers and send your message to each contact</li>
                    <li>This is a manual process as per requirements</li>
                  </ol>
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || selectedGroups.length === 0}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Log Message (for tracking)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalContacts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Groups</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalGroups}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.engagementRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Message Activity</h2>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Export Data</h3>
                    <p className="text-sm text-gray-500">Download your contacts and groups as CSV files</p>
                  </div>
                  <button
                    onClick={exportContactsToCSV}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
                        localStorage.removeItem('mr_contacts');
                        localStorage.removeItem('mr_groups');
                        localStorage.removeItem('mr_message_logs');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
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
  );
};

export default SimpleMRTool;
