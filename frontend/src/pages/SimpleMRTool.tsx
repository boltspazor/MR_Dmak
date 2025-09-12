import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Trash2, 
  Search,
  FileText,
  Edit,
  ChevronDown
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import AddMRDialog from '../components/AddMRDialog';
import EditMRDialog from '../components/EditMRDialog';

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
  const { user } = useAuth();
  const [activeTab] = useState<'contacts'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([
    { id: '1', name: 'North', contactCount: 0 },
    { id: '2', name: 'South', contactCount: 0 },
    { id: '3', name: 'East', contactCount: 0 },
    { id: '4', name: 'West', contactCount: 0 }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Contact>('mrId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddMRDialogOpen, setIsAddMRDialogOpen] = useState(false);

  // Filter states
  const [groupFilter, setGroupFilter] = useState('');

  // Edit states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;



  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load contacts from localStorage first
        const savedContacts = localStorage.getItem('mr_contacts');
        if (savedContacts) {
          const parsedContacts = JSON.parse(savedContacts);
          setContacts(parsedContacts);
        } else {
          // If no saved data, load from backend
          await fetchContactsFromBackend();
        }

        // Load groups from localStorage first
        const savedGroups = localStorage.getItem('mr_groups');
        if (savedGroups) {
          const parsedGroups = JSON.parse(savedGroups);
          if (parsedGroups.length > 0) {
            setGroups(parsedGroups);
          } else {
            // If empty array, keep default groups and save them
            const defaultGroups: Group[] = [
              { id: '1', name: 'North', contactCount: 0 },
              { id: '2', name: 'South', contactCount: 0 },
              { id: '3', name: 'East', contactCount: 0 },
              { id: '4', name: 'West', contactCount: 0 }
            ];
            setGroups(defaultGroups);
            localStorage.setItem('mr_groups', JSON.stringify(defaultGroups));
          }
        } else {
          // If no saved data, save the default groups that are already in state
          const defaultGroups: Group[] = [
            { id: '1', name: 'North', contactCount: 0 },
            { id: '2', name: 'South', contactCount: 0 },
            { id: '3', name: 'East', contactCount: 0 },
            { id: '4', name: 'West', contactCount: 0 }
          ];
          localStorage.setItem('mr_groups', JSON.stringify(defaultGroups));
        }
        
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
      // Save to localStorage
      localStorage.setItem('mr_contacts', JSON.stringify(transformedContacts));
    } catch (error: any) {
      console.error('Error fetching contacts from backend:', error);
    }
  };


  // Update group contact counts
  useEffect(() => {
    const updatedGroups = groups.map(group => ({
      ...group,
      contactCount: contacts.filter(contact => contact.group === group.name).length
    }));
    setGroups(updatedGroups);
    // Save to localStorage
    localStorage.setItem('mr_groups', JSON.stringify(updatedGroups));
  }, [contacts]);


  // Debug: Log groups state
  console.log('SimpleMRTool groups state:', groups);

  // Contact management functions

  const handleAddMR = async (contactData: Omit<Contact, 'id'>) => {
    try {
      // Validate phone number
      if (!contactData.phone.startsWith('+91')) {
        alert('Phone number must start with +91');
      return;
    }

      // Check for unique MR ID
      if (contacts.some(contact => contact.mrId === contactData.mrId)) {
        alert('MR ID already exists. Please use a unique MR ID.');
        return;
      }

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
      
      const updatedContacts = [...contacts, newContactData];
      setContacts(updatedContacts);
      // Save to localStorage
      localStorage.setItem('mr_contacts', JSON.stringify(updatedContacts));
      alert('MR added successfully!');
    } catch (error: any) {
      console.error('Error adding MR:', error);
      alert('Failed to add MR');
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    try {
      await mockApi.delete(`/mrs/${contactToDelete.id}`);
      // Remove from local state
      const updatedContacts = contacts.filter(c => c.id !== contactToDelete.id);
      setContacts(updatedContacts);
      // Save to localStorage
      localStorage.setItem('mr_contacts', JSON.stringify(updatedContacts));
      setShowDeleteDialog(false);
      setContactToDelete(null);
      alert('MR deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete MR');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setContactToDelete(null);
  };

  const handleEditContact = (contact: Contact) => {
    console.log('Editing contact:', contact);
    console.log('Available groups:', groups);
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async (updatedContact: Omit<Contact, 'id'>) => {
    if (!editingContact) return;

    try {
      // Validate phone number
      if (!updatedContact.phone.startsWith('+91')) {
        alert('Phone number must start with +91');
      return;
    }

      // Check for unique MR ID (excluding current contact)
      if (contacts.some(contact => contact.mrId === updatedContact.mrId && contact.id !== editingContact.id)) {
        alert('MR ID already exists. Please use a unique MR ID.');
      return;
    }

      await mockApi.post(`/mrs/${editingContact.id}`, updatedContact);
      
      // Update local state
      const updatedContacts = contacts.map(c => 
        c.id === editingContact.id 
          ? { ...updatedContact, id: editingContact.id }
          : c
      );
      setContacts(updatedContacts);
      // Save to localStorage
      localStorage.setItem('mr_contacts', JSON.stringify(updatedContacts));
      
      setEditingContact(null);
      setIsEditDialogOpen(false);
      alert('MR updated successfully!');
    } catch (error: any) {
      console.error('Error updating contact:', error);
      alert('Failed to update MR');
    }
  };


  // CSV import/export functions
  const exportContactsToCSV = () => {
    const csvContent = [
      'MR ID,First Name,Last Name,Phone,Group,Comments',
      ...filteredContacts.map(contact => 
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
            <p>Showing ${filteredContacts.length} of ${contacts.length}</p>
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
                ${filteredContacts.map(contact => `
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
      const newContacts: Contact[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length >= 5) {
          // Validate phone number
          if (!values[3].startsWith('+91')) {
            errors.push(`Line ${i + 1}: Phone number must start with +91`);
            continue;
          }

          // Check for unique MR ID
          if (contacts.some(contact => contact.mrId === values[0]) || 
              newContacts.some(contact => contact.mrId === values[0])) {
            errors.push(`Line ${i + 1}: MR ID ${values[0]} already exists`);
            continue;
          }

          const newContact: Contact = {
            id: Date.now().toString() + i,
            mrId: values[0],
            firstName: values[1],
            lastName: values[2],
            phone: values[3],
            group: values[4],
            comments: values[5] || ''
          };
          
          newContacts.push(newContact);
          created++;
      } else {
          errors.push(`Line ${i + 1}: Invalid format`);
        }
      }
      
      // Add all valid contacts at once
      if (newContacts.length > 0) {
        const updatedContacts = [...contacts, ...newContacts];
        setContacts(updatedContacts);
        // Save to localStorage
        localStorage.setItem('mr_contacts', JSON.stringify(updatedContacts));
      }
      
      alert(`Bulk upload completed!\n\nCreated: ${created} MRs\nTotal Processed: ${lines.length - 1}${errors.length > 0 ? `\n\nErrors (${errors.length}):\n${errors.slice(0, 5).join('\n')}` : ''}`);
      

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };


  const filteredContacts = contacts
    .filter(contact => {
      // Search term filter
      const matchesSearch = contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.mrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.group.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Group filter (exact match for dropdown)
      const matchesGroup = !groupFilter || contact.group === groupFilter;
      
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };


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
      title: 'Total MR',
      value: contacts.length,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Total Groups',
      value: groups.length,
      icon: <FileText className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activePage="dmak"
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
          onExportCSV={exportContactsToCSV}
          onExportPDF={exportContactsToPDF}
          showExportButtons={false}
        />

        {/* Separator Line */}
        <div className="border-b-2 border-indigo-500 my-6"></div>

        {/* MR Management Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">MR Management</h2>

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
                      Import MR
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

            {/* Contacts Table */}
              <div className="bg-white bg-opacity-40 rounded-lg">
                {/* Table Header */}
                <div className="p-6 border-b bg-indigo-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-700 font-bold">
                      {filteredContacts.length} of {contacts.length}
                    </span>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search MR ID, Name, or Phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border-0 bg-gray-100"
                      />
                    </div>
                    
                    <div className="relative">
                      <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-lg border-0 bg-gray-100 appearance-none cursor-pointer"
                      >
                        <option value="">All Groups</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.name}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                      {paginatedContacts.length > 0 ? (
                        paginatedContacts.map(contact => (
                          <tr key={contact.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.mrId}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">
                              {contact.firstName} {contact.lastName}
                            </td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.phone}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.group}</td>
                            <td className="py-3 px-6 text-sm text-gray-900 text-center">{contact.comments || '-'}</td>
                            <td className="py-3 px-6 text-sm text-center">
                              <div className="flex items-center justify-center space-x-2">
                          <button
                                  onClick={() => handleEditContact(contact)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit Contact"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                          <button
                            onClick={() => handleDeleteClick(contact)}
                                className="text-red-600 hover:text-red-800"
                                  title="Delete Contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                              </div>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-white bg-opacity-40 border-t">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} results
                              </span>
              </div>
              <div className="flex items-center space-x-2">
                              <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                  Previous
                              </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                  </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                    </div>
              </div>
          )}
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

        {/* Edit MR Dialog */}
        <EditMRDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingContact(null);
          }}
          onUpdate={handleUpdateContact}
          contact={editingContact}
          groups={groups}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && contactToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
              </div>
                          </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete MR
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete MR <strong>{contactToDelete.mrId}</strong> ({contactToDelete.firstName} {contactToDelete.lastName})? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
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