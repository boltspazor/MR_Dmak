import React from 'react';
import { Edit, Trash2, ChevronUp, ChevronDown, User, Phone, Users, MessageSquare } from 'lucide-react';

interface Contact {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
  comments?: string;
}

interface MRTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onSort: (field: keyof Contact) => void;
  sortField: keyof Contact;
  sortDirection: 'asc' | 'desc';
}

const MRTable: React.FC<MRTableProps> = ({ contacts, onEdit, onDelete, onSort, sortField, sortDirection }) => {
  const SortableHeader: React.FC<{ field: keyof Contact; children: React.ReactNode; icon?: React.ReactNode }> = ({ field, children, icon }) => (
    <th 
      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span>{children}</span>
        {sortField === field && (
          <span className="text-indigo-600">
            {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </div>
    </th>
  );

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No MRs found</h3>
        <p className="text-gray-500">Get started by adding your first Medical Representative.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <SortableHeader field="mrId" icon={<User className="h-4 w-4" />}>
              MR ID
            </SortableHeader>
            <SortableHeader field="firstName" icon={<User className="h-4 w-4" />}>
              Name
            </SortableHeader>
            <SortableHeader field="phone" icon={<Phone className="h-4 w-4" />}>
              Phone
            </SortableHeader>
            <SortableHeader field="group" icon={<Users className="h-4 w-4" />}>
              Group
            </SortableHeader>
            <SortableHeader field="comments" icon={<MessageSquare className="h-4 w-4" />}>
              Comments
            </SortableHeader>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact, index) => (
            <tr 
              key={contact.id} 
              className={`hover:bg-gray-50 transition-colors duration-200 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-indigo-600">
                      {contact.mrId.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{contact.mrId}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {contact.firstName} {contact.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  {contact.phone}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Users className="h-3 w-3 mr-1" />
                  {contact.group}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                <div className="truncate">
                  {contact.comments || <span className="text-gray-400 italic">No comments</span>}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-3">
                  <button
                    onClick={() => onEdit(contact)}
                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200"
                    title="Edit MR"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(contact)}
                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                    title="Delete MR"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MRTable;
