import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import mrsService from '../services/mrs.service';
import groupsService from '../services/groups.service';
import { MedicalRepresentative, CreateMRForm, Group } from '../types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import CreateMRModal from '../components/mrs/CreateMRModal';
import EditMRModal from '../components/mrs/EditMRModal';
import BulkUploadModal from '../components/mrs/BulkUploadModal';

const MRs: React.FC = () => {
  const { addNotification } = useNotifications();
  const [mrs, setMRs] = useState<MedicalRepresentative[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedMR, setSelectedMR] = useState<MedicalRepresentative | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    fetchMRs();
    fetchGroups();
  }, []);

  const fetchMRs = async () => {
    try {
      setLoading(true);
      const response = await mrsService.getMRs({ 
        search: searchTerm,
        groupId: selectedGroupId || undefined
      });
      setMRs(response.mrs || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to load MRs',
        message: error.response?.data?.error || 'Could not load medical representatives',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupsService.getGroups();
      setGroups(response.groups || []);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleCreateMR = async (mrData: CreateMRForm) => {
    try {
      const newMR = await mrsService.createMR(mrData);
      setMRs(prev => [newMR, ...prev]);
      setShowCreateModal(false);
      addNotification({
        type: 'success',
        title: 'MR Created',
        message: 'Medical representative created successfully',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to create MR',
        message: error.response?.data?.error || 'Could not create medical representative',
      });
    }
  };

  const handleEditMR = async (id: string, mrData: Partial<CreateMRForm>) => {
    try {
      await mrsService.updateMR(id, mrData);
      setMRs(prev => prev.map(mr => 
        mr.id === id ? { ...mr, ...mrData } : mr
      ));
      setShowEditModal(false);
      setSelectedMR(null);
      addNotification({
        type: 'success',
        title: 'MR Updated',
        message: 'Medical representative updated successfully',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to update MR',
        message: error.response?.data?.error || 'Could not update medical representative',
      });
    }
  };

  const handleDeleteMR = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medical representative?')) return;
    
    try {
      await mrsService.deleteMR(id);
      setMRs(prev => prev.filter(mr => mr.id !== id));
      addNotification({
        type: 'success',
        title: 'MR Deleted',
        message: 'Medical representative deleted successfully',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to delete MR',
        message: error.response?.data?.error || 'Could not delete medical representative',
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await mrsService.downloadTemplate();
      addNotification({
        type: 'success',
        title: 'Template Downloaded',
        message: 'Excel template downloaded successfully',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: error.response?.data?.error || 'Could not download template',
      });
    }
  };

  const filteredMRs = mrs.filter(mr =>
    mr.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mr.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mr.mrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mr.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Representatives</h1>
          <p className="text-gray-600">Manage your medical representatives</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="btn btn-secondary"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="btn btn-secondary"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Template
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add MR
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search MRs by name, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="input sm:w-48"
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.groupName}
            </option>
          ))}
        </select>
      </div>

      {/* MRs Table */}
      {filteredMRs.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medical representatives</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedGroupId ? 'No MRs match your search.' : 'Get started by adding a new medical representative.'}
          </p>
          {!searchTerm && !selectedGroupId && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add MR
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">MR ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Phone</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Group</th>
                    <th className="table-header-cell">Comments</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredMRs.map((mr) => (
                    <tr key={mr.id} className="table-row">
                      <td className="table-cell font-medium">{mr.mrId}</td>
                      <td className="table-cell">
                        {mr.firstName} {mr.lastName}
                      </td>
                      <td className="table-cell">{mr.phone}</td>
                      <td className="table-cell">{mr.email || '-'}</td>
                      <td className="table-cell">
                        {groups.find(g => g.id === mr.groupId)?.groupName || '-'}
                      </td>
                      <td className="table-cell">
                        {mr.comments ? (
                          <span className="truncate max-w-xs block" title={mr.comments}>
                            {mr.comments}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMR(mr);
                              setShowEditModal(true);
                            }}
                            className="btn btn-sm btn-secondary"
                            title="Edit MR"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMR(mr.id)}
                            className="btn btn-sm btn-danger"
                            title="Delete MR"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateMRModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMR}
        groups={groups}
      />

      <EditMRModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMR(null);
        }}
        mr={selectedMR}
        onSubmit={handleEditMR}
        groups={groups}
      />

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          setShowBulkUploadModal(false);
          fetchMRs();
        }}
      />
    </div>
  );
};

export default MRs;
