import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  UserCheck,
  MessageSquare,
  Building2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { api } from '../lib/api';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SystemStats {
  totalUsers: number;
  totalMRs: number;
  totalGroups: number;
  totalCampaigns: number;
  marketingManagers: number;
  systemHealth: string;
}

interface PerformanceMetrics {
  campaignSuccessRate: string;
  totalCampaigns: number;
  completedCampaigns: number;
  totalMRs: number;
  messageDeliveryRate: string;
  systemUptime: string;
  averageResponseTime: string;
}

const SuperAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [marketingManagers, setMarketingManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const [statsRes, metricsRes, managersRes] = await Promise.all([
        api.get('/super-admin/stats'),
        api.get('/super-admin/performance'),
        api.get('/super-admin/marketing-managers')
      ]);

      setStats(statsRes.data.stats);
      setMetrics(metricsRes.data.metrics);
      setMarketingManagers(managersRes.data.data);
    } catch (error: any) {
      console.error('Error fetching super admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      if (editingManager) {
        await api.put(`/super-admin/marketing-managers/${editingManager.id}`, {
          name: formData.name,
          email: formData.email
        });
      } else {
        await api.post('/super-admin/marketing-managers', formData);
      }

      setFormData({ name: '', email: '', password: '' });
      setEditingManager(null);
      setShowCreateForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving marketing manager:', error);
      alert(error.response?.data?.error || 'Failed to save marketing manager');
    }
  };

  const handleDelete = async (managerId: string) => {
    if (!window.confirm('Are you sure you want to delete this marketing manager?')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/super-admin/marketing-managers/${managerId}`);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting marketing manager:', error);
      alert(error.response?.data?.error || 'Failed to delete marketing manager');
    }
  };

  const handleEdit = (manager: User) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      email: manager.email,
      password: ''
    });
    setShowCreateForm(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar 
          activePage="super-admin"
          onNavigate={handleSidebarNavigation}
          onLogout={handleLogout}
          userName={user?.name || "User"}
          userRole={user?.role || "Super Admin"}
        />
        <div className="ml-24 p-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar 
        activePage="super-admin"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName={user?.name || "User"}
        userRole={user?.role || "Super Admin"}
      />
      <div className="ml-24 p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">System-wide management and monitoring</p>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm(true);
              setEditingManager(null);
              setFormData({ name: '', email: '', password: '' });
            }}
            className="flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Marketing Manager
          </Button>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Marketing Managers</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.marketingManagers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total MRs</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalMRs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalCampaigns || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        {metrics && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{metrics.campaignSuccessRate}%</div>
                  <div className="text-sm text-gray-500">Campaign Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{metrics.messageDeliveryRate}</div>
                  <div className="text-sm text-gray-500">Message Delivery Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{metrics.systemUptime}</div>
                  <div className="text-sm text-gray-500">System Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Marketing Manager Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingManager ? 'Edit Marketing Manager' : 'Create New Marketing Manager'}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                {!editingManager && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button type="submit">
                    {editingManager ? 'Update Manager' : 'Create Manager'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingManager(null);
                      setFormData({ name: '', email: '', password: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Marketing Managers List */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Marketing Managers</h2>
          </CardHeader>
          <CardContent>
            {marketingManagers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marketingManagers.map((manager) => (
                      <tr key={manager.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{manager.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {manager.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(manager.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(manager)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(manager.id)}
                              className="text-red-600 hover:text-red-900"
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
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No marketing managers found</p>
                <p className="text-sm text-gray-400">Create your first marketing manager to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
