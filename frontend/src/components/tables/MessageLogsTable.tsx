import React from 'react';
import { MessageLog, TableProps } from '../../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/helpers';

interface MessageLogsTableProps extends Omit<TableProps<MessageLog>, 'columns'> {
  onView?: (log: MessageLog) => void;
  showActions?: boolean;
}

const MessageLogsTable: React.FC<MessageLogsTableProps> = ({
  data,
  loading = false,
  emptyMessage = 'No message logs found',
  onView,
  showActions = true,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4 text-success-600" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-danger-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-warning-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="badge badge-success">Sent</span>;
      case 'delivered':
        return <span className="badge badge-success">Delivered</span>;
      case 'failed':
        return <span className="badge badge-danger">Failed</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const columns = [
    {
      key: 'medicalRepresentative' as keyof MessageLog,
      label: 'Medical Representative',
      sortable: false,
      render: (value: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {value.firstName} {value.lastName}
          </div>
          <div className="text-sm text-gray-500">{value.mrId}</div>
        </div>
      ),
    },
    {
      key: 'phoneNumber' as keyof MessageLog,
      label: 'Phone Number',
      sortable: false,
      render: (value: string) => (
        <span className="text-gray-900 font-mono">{value}</span>
      ),
    },
    {
      key: 'status' as keyof MessageLog,
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          {getStatusBadge(value)}
        </div>
      ),
    },
    {
      key: 'sentAt' as keyof MessageLog,
      label: 'Sent At',
      sortable: true,
      render: (value: string, item: MessageLog) => (
        <span className="text-gray-500">
          {value ? formatDateTime(value) : formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'deliveredAt' as keyof MessageLog,
      label: 'Delivered At',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-500">
          {value ? formatDateTime(value) : '-'}
        </span>
      ),
    },
    {
      key: 'errorMessage' as keyof MessageLog,
      label: 'Error Message',
      sortable: false,
      render: (value: string) => (
        <span className="text-gray-900" title={value}>
          {value || '-'}
        </span>
      ),
    },
  ];

  if (showActions && onView) {
    columns.push({
      key: 'actions' as keyof MessageLog,
      label: 'Actions',
      sortable: false,
      render: (value: any, item: MessageLog) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onView(item)}
            className="text-primary-600 hover:text-primary-900"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    });
  }

  const handleSort = (key: keyof MessageLog) => {
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
          {data.map((log) => (
            <tr key={log.id} className="table-row">
              {columns.map((column) => (
                <td key={String(column.key)} className="table-cell">
                  {column.render
                    ? column.render(log[column.key], log)
                    : String(log[column.key] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MessageLogsTable;
