import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import groupsService from '../services/groups.service';
import { Group, CreateGroupForm } from '../types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import EditGroupModal from '../components/groups/EditGroupModal';
import GroupStatsModal from '../components/groups/GroupStatsModal';

const Groups: React.FC = () => {
  const { addNotification } = useNotifications();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupsService.getGroups({ search: searchTerm });
      setGroups(response.groups || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to load groups',
        message: error.response?.data?.error || 'Could not load groups',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (groupData: CreateGroupForm) => {
    try {
      const newGroup = await groupsService.createGroup(groupData);
      setGroups(prev => [newGroup, ...prev]);
      setShowCreateModal(false);
      addNotification({
        type: 'success',
        title: 'Group Created',
        message: 'Group created successfully',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to create group',
        message: error.response?.data?.error || 'Could not create group',
      });
    }
  };

  const handleEditGroup = async (id: string, groupData: CreateGroupForm) => {
    try {
      await groupsService.updateGroup(id, groupData);
      setGroups(prev => prev.map(group => 
        group.id === id ? { ...group, ...groupData } : group
      ));
      setShowEditModal(false);
      setSelectedGroup(null);
      addNotification({
        type: 'success',
        title: 'Group Updated',
        message: 'Group updated successfully',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to update group',
        message: error.response?.data?.error || 'Could not update group',
      });
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    
    try {
      await groupsService.deleteGroup(id);
      setGroups(prev => prev.filter(group => group.id !== id));
      addNotification({
        type: 'success',
        title: 'Group Deleted',
        message: 'Group deleted successfully',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to delete group',
        message: error.response?.data?.error || 'Could not delete group',
      });
    }
  };

  const handleExportGroup = async (id: string, format: 'json' | 'csv') => {
    try {
      await groupsService.exportGroupData(id, format);
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: `Group data exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.error || 'Could not export group data',
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600">Manage your medical representative groups</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Group
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No groups</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No groups match your search.' : 'Get started by creating a new group.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Group
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <div key={group.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {group.groupName}
                    </h3>
                    {group.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {group.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {group._count?.medicalRepresentatives || 0} Medical Representatives
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowStatsModal(true);
                    }}
                    className="btn btn-sm btn-secondary"
                    title="View Statistics"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowEditModal(true);
                    }}
                    className="btn btn-sm btn-secondary"
                    title="Edit Group"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExportGroup(group.id, 'csv')}
                    className="btn btn-sm btn-secondary"
                    title="Export Data"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="btn btn-sm btn-danger"
                    title="Delete Group"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
      />

      <EditGroupModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGroup(null);
        }}
        group={selectedGroup}
        onSubmit={handleEditGroup}
      />

      <GroupStatsModal
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false);
          setSelectedGroup(null);
        }}
        groupId={selectedGroup?.id}
      />
    </div>
  );
};

export default Groups;
