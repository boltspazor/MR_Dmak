import React from 'react';
import { MedicalRepresentative, TableProps } from '../../types';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatPhoneNumber, truncateText } from '../../utils/helpers';

interface MRTableProps extends Omit<TableProps<MedicalRepresentative>, 'columns'> {
  onEdit?: (mr: MedicalRepresentative) => void;
  onDelete?: (id: string) => void;
  onView?: (mr: MedicalRepresentative) => void;
  showActions?: boolean;
}

const MRTable: React.FC<MRTableProps> = ({
  data,
  loading = false,
  emptyMessage = 'No medical representatives found',
  onEdit,
  onDelete,
  onView,
  showActions = true,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const columns = [
    {
      key: 'mrId' as keyof MedicalRepresentative,
      label: 'MR ID',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-primary-600">{value}</span>
      ),
    },
    {
      key: 'firstName' as keyof MedicalRepresentative,
      label: 'Name',
      sortable: true,
      render: (value: string, item: MedicalRepresentative) => (
        <div>
          <div className="font-medium text-gray-900">
            {item.firstName} {item.lastName}
          </div>
          {item.email && (
            <div className="text-sm text-gray-500">{item.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'phone' as keyof MedicalRepresentative,
      label: 'Phone',
      sortable: false,
      render: (value: string) => (
        <span className="text-gray-900">{formatPhoneNumber(value)}</span>
      ),
    },
    {
      key: 'groupId' as keyof MedicalRepresentative,
      label: 'Group',
      sortable: false,
      render: (value: string, item: MedicalRepresentative) => (
        <span className="text-gray-900">
          {item.group?.groupName || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'comments' as keyof MedicalRepresentative,
      label: 'Comments',
      sortable: false,
      render: (value: string) => (
        <span className="text-gray-900" title={value}>
          {value ? truncateText(value, 30) : '-'}
        </span>
      ),
    },
    {
      key: 'createdAt' as keyof MedicalRepresentative,
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (showActions) {
    columns.push({
      key: 'actions' as keyof MedicalRepresentative,
      label: 'Actions',
      sortable: false,
      render: (value: any, item: MedicalRepresentative) => (
        <div className="flex space-x-2">
          {onView && (
            <button
              onClick={() => onView(item)}
              className="text-primary-600 hover:text-primary-900"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit MR"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-900"
              title="Delete MR"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    });
  }

  const handleSort = (key: keyof MedicalRepresentative) => {
    if (!onSort || !sortBy) return;
    
    const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(key, newOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead className="table-header">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`table-header-cell ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && sortBy === column.key && (
                    <span className="text-gray-400">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {data.map((mr) => (
            <tr key={mr.id} className="table-row">
              {columns.map((column) => (
                <td key={String(column.key)} className="table-cell">
                  {column.render
                    ? column.render(mr[column.key], mr)
                    : String(mr[column.key] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MRTable;
