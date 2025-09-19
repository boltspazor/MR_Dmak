import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Trash2, 
  FileText,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import AddMRDialog from '../components/AddMRDialog';
import EditMRDialog from '../components/EditMRDialog';
import MRActionButtons from '../components/mr/MRActionButtons';
import MRSearchAndFilter from '../components/mr/MRSearchAndFilter';
import MRTable from '../components/mr/MRTable';
import { mrService, MRData } from '../services/mr.service';

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


// Real API calls using the configured API instance

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

  // Filter states - group filter removed, now handled in search

  // Edit states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;



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
      const response = await api.get('/mrs');
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
        throw new Error('Phone number must start with +91');
      }

      // Check for unique MR ID
      if (contacts.some(contact => contact.mrId === contactData.mrId)) {
        throw new Error('MR ID already exists. Please use a unique MR ID.');
      }

      // Find the group ID by name, if group is provided
      let groupId = '';
      if (contactData.group && contactData.group.trim() !== '') {
        const selectedGroup = groups.find(g => g.name === contactData.group);
        if (!selectedGroup) {
          throw new Error('Selected group not found');
        }
        groupId = selectedGroup.id;
      }

      await api.post('/mrs', {
        mrId: contactData.mrId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        phone: contactData.phone,
        groupId: groupId,
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
      let errorMessage = error.message || 'Failed to add MR';
      
      // Clean up error messages to replace technical details with app name
      errorMessage = errorMessage
        .replace(/app\.railway\.app/gi, 'D-MAK')
        .replace(/railway\.app/gi, 'D-MAK')
        .replace(/\.railway\./gi, ' D-MAK ')
        .replace(/mrbackend-production-[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
        .replace(/https?:\/\/[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
        .replace(/production-[a-zA-Z0-9-]+\.up/gi, 'D-MAK')
        .replace(/\b[a-zA-Z0-9-]+\.up\.railway\.app\b/gi, 'D-MAK server')
        .replace(/\s+/g, ' ')
        .replace(/D-MAK\s+server/gi, 'D-MAK server')
        .trim();
      
      // Re-throw the error with cleaned message so AddMRDialog can catch it
      throw new Error(errorMessage);
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    try {
      await api.delete(`/mrs/${contactToDelete.id}`);
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
        throw new Error('Phone number must start with +91');
      }

      // Check for unique MR ID (excluding current contact)
      if (contacts.some(contact => contact.mrId === updatedContact.mrId && contact.id !== editingContact.id)) {
        throw new Error('MR ID already exists. Please use a unique MR ID.');
      }

      await api.put(`/mrs/${editingContact.id}`, updatedContact);
      
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
      let errorMessage = error.message || 'Failed to update MR';
      
      // Clean up error messages to replace technical details with app name
      errorMessage = errorMessage
        .replace(/app\.railway\.app/gi, 'D-MAK')
        .replace(/railway\.app/gi, 'D-MAK')
        .replace(/\.railway\./gi, ' D-MAK ')
        .replace(/mrbackend-production-[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
        .replace(/https?:\/\/[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
        .replace(/production-[a-zA-Z0-9-]+\.up/gi, 'D-MAK')
        .replace(/\b[a-zA-Z0-9-]+\.up\.railway\.app\b/gi, 'D-MAK server')
        .replace(/\s+/g, ' ')
        .replace(/D-MAK\s+server/gi, 'D-MAK server')
        .trim();
      
      // Re-throw the error with cleaned message so EditMRDialog can catch it
      throw new Error(errorMessage);
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
    // Remove sample row - only include headers as requested
    const template = 'MR ID,First Name,Last Name,Phone,Group,Comments';
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
        
        // Skip empty lines at end of file (don't report as error)
        if (!line && i === lines.length - 1) continue;
        if (!line) {
          errors.push(`❌ Row ${i + 1}: Empty row found`);
          continue;
        }
        
        const values = line.split(',');
        
        // Validate required columns
        if (values.length < 5) {
          errors.push(`❌ Row ${i + 1}: Missing required columns (expected 5+ columns, found ${values.length})`);
          continue;
        }

        // Validate MR ID
        if (!values[0] || !values[0].trim()) {
          errors.push(`❌ Row ${i + 1}: MR ID is required`);
          continue;
        }

        // Validate names
        if (!values[1] || !values[1].trim()) {
          errors.push(`❌ Row ${i + 1}: First Name is required`);
          continue;
        }
        if (!values[2] || !values[2].trim()) {
          errors.push(`❌ Row ${i + 1}: Last Name is required`);
          continue;
        }

        // Validate phone number
        if (!values[3] || !values[3].trim()) {
          errors.push(`❌ Row ${i + 1}: Phone number is required`);
          continue;
        }
        if (!values[3].startsWith('+91')) {
          errors.push(`❌ Row ${i + 1}: Phone number must start with +91 (found: ${values[3]})`);
          continue;
        }
        if (values[3].length !== 13) {
          errors.push(`❌ Row ${i + 1}: Phone number must be 13 digits including +91 (found: ${values[3]})`);
          continue;
        }

        // Check for duplicate MR IDs in existing data
        if (contacts.some(contact => contact.mrId === values[0].trim())) {
          errors.push(`❌ Row ${i + 1}: MR ID "${values[0]}" already exists in system`);
          continue;
        }

        // Check for duplicate MR IDs within current upload
        if (newContacts.some(contact => contact.mrId === values[0].trim())) {
          errors.push(`❌ Row ${i + 1}: Duplicate MR ID "${values[0]}" found in this upload`);
          continue;
        }

        // Group is optional now, so no validation needed

        // If all validations pass, create contact
        const newContact: Contact = {
          id: Date.now().toString() + i,
          mrId: values[0].trim(),
          firstName: values[1].trim(),
          lastName: values[2].trim(),
          phone: values[3].trim(),
          group: values[4] ? values[4].trim() : '',
          comments: values[5] ? values[5].trim() : ''
        };
        
        newContacts.push(newContact);
        created++;
      }
      
      // Add all valid contacts at once
      if (newContacts.length > 0) {
        const updatedContacts = [...contacts, ...newContacts];
        setContacts(updatedContacts);
        // Save to localStorage
        localStorage.setItem('mr_contacts', JSON.stringify(updatedContacts));
      }
      
      // Display results with proper error formatting
      if (errors.length > 0) {
        const errorMessage = `❌ Bulk Upload Failed. Please address following errors:\n\n📊 Total Rows Processed: ${lines.length - 1}\n❌ Errors Found (${errors.length}):\n\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}\n\n💡 Please fix the errors and try uploading again.`;
        alert(errorMessage);
      } else if (created === 0) {
        alert(`❌ Bulk Upload Failed!\n\n📊 Total Rows Processed: ${lines.length - 1}\n📊 MRs Created: 0\n\n💡 No valid MRs were found in the uploaded file. Please check your file format and try again.`);
      } else {
        alert(`✅ Bulk Upload Successful!\n\nCreated: ${created} MRs\nTotal Processed: ${lines.length - 1}\n\nNo errors found!`);
      }
      

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
      
      return matchesSearch;
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
  }, [searchTerm, sortField, sortDirection]);

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
              <MRActionButtons
                onAddIndividual={() => setIsAddMRDialogOpen(true)}
                onCSVImport={handleCSVImport}
                onDownloadTemplate={downloadCSVTemplate}
              />

              </div>

            {/* Contacts Table */}
              <div className="bg-white bg-opacity-40 rounded-lg">
                <MRSearchAndFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  filteredCount={filteredContacts.length}
                  totalCount={contacts.length}
                />
                
                {/* Table */}
                <MRTable
                  contacts={paginatedContacts}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteClick}
                />

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
              <div className="text-left">
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