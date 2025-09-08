import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Edit, 
  Trash2, 
  Search, 
  BarChart3,
  Calendar,
  Activity,
  LogOut,
  Shield,
  FileText,
  MessageSquare
} from 'lucide-react';
import { api } from '../lib/api';
import { Group } from '../types';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    groupName: '',
    description: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/groups');
      setGroups(response.data.data || []);
      
      // Note: Group statistics endpoint not implemented yet
      // setGroupStats({});
    } catch (error: any) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, formData);
      } else {
        await api.post('/groups', formData);
      }

      setFormData({ groupName: '', description: '' });
      setEditingGroup(null);
      setShowCreateForm(false);
      fetchGroups();
    } catch (error: any) {
      console.error('Error saving group:', error);
      alert(error.response?.data?.error || 'Failed to save group');
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/groups/${groupId}`);
      fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      alert(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      groupName: group.groupName,
      description: group.description || ''
    });
    setShowCreateForm(true);
  };

  const exportGroupsToCSV = () => {
    const csvContent = [
      'Group Name,Description,MR Count,Created At',
      ...groups.map(group => 
        `${group.groupName},${group.description || ''},${group.mrCount || 0},${new Date(group.createdAt).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groups.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Navigation functions
  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#ECEAE2', width: '1440px', height: '1024px' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          
          {/* DMak Tool */}
          <button 
            onClick={() => handleSidebarNavigation('/simple-tool')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <BarChart3 className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>DMak Tool</span>
          </button>
          
          {/* Groups - Active */}
          <div className="flex flex-col items-center p-2 rounded-lg w-16 h-16 border border-gray-200" style={{ background: 'rgba(236, 234, 226, 0.1)' }}>
            <Users className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Groups</span>
          </div>
          
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
              }}>Groups Management</h1>
              <p className="text-lg text-black" style={{ 
                fontFamily: 'Jura', 
                fontSize: '18.36px',
                lineHeight: '22px',
                fontWeight: 500,
                letterSpacing: '0.08em'
              }}>
                Organize your Medical Representatives into groups.
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
          
          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6" style={{ marginTop: '24px', marginLeft: '100px' }}>
            <button
              onClick={() => exportGroupsToCSV()}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ 
                background: '#1E1E1E', 
                fontFamily: 'Jura',
                fontSize: '13.51px',
                lineHeight: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              Export
            </button>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingGroup(null);
                setFormData({ groupName: '', description: '' });
              }}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
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
              Create Group
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
            <div className="grid grid-cols-2 gap-8" style={{ gap: '29px' }}>
              {/* Left Column - Statistics Cards */}
              <div className="space-y-4" style={{ gap: '16px' }}>
                {/* Total Groups */}
                <div className="bg-white rounded-lg p-6" style={{ 
                  background: 'rgba(215, 181, 109, 0.1)', 
                  borderRadius: '10px',
                  width: '541px',
                  height: '120px',
                  padding: '24px'
                }}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '18px',
                      lineHeight: '22px',
                      fontWeight: 700
                    }}>Total Groups</h3>
                    <p className="text-4xl font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '48px',
                      lineHeight: '56px',
                      fontWeight: 700
                    }}>{groups.length}</p>
                  </div>
                </div>

                {/* Total MRs */}
                <div className="bg-white rounded-lg p-6" style={{ 
                  background: 'rgba(215, 181, 109, 0.1)', 
                  borderRadius: '10px',
                  width: '541px',
                  height: '120px',
                  padding: '24px'
                }}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '18px',
                      lineHeight: '22px',
                      fontWeight: 700
                    }}>Total MRs</h3>
                    <p className="text-4xl font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '48px',
                      lineHeight: '56px',
                      fontWeight: 700
                    }}>{groups.reduce((acc, group) => acc + (group.mrCount || 0), 0)}</p>
                  </div>
                </div>

                {/* Average MR Groups */}
                <div className="bg-white rounded-lg p-6" style={{ 
                  background: 'rgba(215, 181, 109, 0.1)', 
                  borderRadius: '10px',
                  width: '541px',
                  height: '120px',
                  padding: '24px'
                }}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '18px',
                      lineHeight: '22px',
                      fontWeight: 700
                    }}>Average MR Groups</h3>
                    <p className="text-4xl font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '48px',
                      lineHeight: '56px',
                      fontWeight: 700
                    }}>
                      {groups.length > 0 
                        ? Math.round(groups.reduce((acc, group) => acc + (group.mrCount || 0), 0) / groups.length)
                        : 0
                      }
                    </p>
                  </div>
                </div>

                {/* Active Groups */}
                <div className="bg-white rounded-lg p-6" style={{ 
                  background: 'rgba(215, 181, 109, 0.1)', 
                  borderRadius: '10px',
                  width: '541px',
                  height: '120px',
                  padding: '24px'
                }}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '18px',
                      lineHeight: '22px',
                      fontWeight: 700
                    }}>Active Groups</h3>
                    <p className="text-4xl font-bold text-black" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '48px',
                      lineHeight: '56px',
                      fontWeight: 700
                    }}>{groups.filter(group => (group.mrCount || 0) > 0).length}</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Groups List */}
              <div className="bg-white rounded-lg" style={{ 
                background: 'rgba(215, 181, 109, 0.1)', 
                borderRadius: '10px',
                width: '541px',
                height: '627px',
                padding: '24px'
              }}>
                {/* Search Bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search Groups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg border-0"
                      style={{ 
                        background: '#F2F2F2',
                        borderRadius: '10px',
                        height: '44px',
                        padding: '12px 16px',
                        width: '300px'
                      }}
                    />
                  </div>
                  <span className="text-sm text-black font-bold" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '14px',
                    lineHeight: '17px',
                    fontWeight: 700
                  }}>
                    {filteredGroups.length} Groups
                  </span>
                </div>

                {/* Groups List or Empty State */}
                {filteredGroups.length > 0 ? (
                  <div className="space-y-4">
                    {filteredGroups.map(group => (
                      <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-black mb-1" style={{ fontFamily: 'Jura' }}>
                              {group.groupName}
                            </h3>
                            {group.description && (
                              <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Jura' }}>{group.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center" style={{ fontFamily: 'Jura' }}>
                                <Users className="h-4 w-4 mr-1" />
                                {group.mrCount || 0} MRs
                              </span>
                              <span className="flex items-center" style={{ fontFamily: 'Jura' }}>
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(group.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(group)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(group.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-black mb-2" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '18.36px',
                      lineHeight: '22px',
                      fontWeight: 700,
                      letterSpacing: '0.08em'
                    }}>
                      No Groups were found
                    </h3>
                    <p className="text-sm text-black mb-4" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '14px',
                      lineHeight: '17px',
                      fontWeight: 500
                    }}>
                      Create your first group to get started...
                    </p>
                    <button
                      onClick={() => {
                        setShowCreateForm(true);
                        setEditingGroup(null);
                        setFormData({ groupName: '', description: '' });
                      }}
                      className="px-6 py-3 rounded-lg text-white text-sm font-semibold"
                      style={{ 
                        background: '#2C2696', 
                        fontFamily: 'Jura',
                        fontSize: '13.51px',
                        lineHeight: '16px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        padding: '12px 24px',
                        borderRadius: '10px'
                      }}
                    >
                      Create your First Group
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-black mb-4" style={{ fontFamily: 'Jura' }}>
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.groupName}
                  onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ 
                    background: '#2C2696', 
                    fontFamily: 'Jura'
                  }}
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingGroup(null);
                    setFormData({ groupName: '', description: '' });
                  }}
                  className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  style={{ fontFamily: 'Jura' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
