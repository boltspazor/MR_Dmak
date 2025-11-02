import React, { useState, useEffect } from 'react';
import { UserPlus, Eye, EyeOff, Edit2, Trash2, RefreshCw, X, Save } from 'lucide-react';
import StandardHeader from '../components/StandardHeader';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

interface CreateManagerForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface MarketingManager {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface EditManagerForm {
  name: string;
  email: string;
}

const ManageManagers: React.FC = () => {
  const [formData, setFormData] = useState<CreateManagerForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<MarketingManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [editingManager, setEditingManager] = useState<MarketingManager | null>(null);
  const [editForm, setEditForm] = useState<EditManagerForm>({ name: '', email: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch marketing managers on component mount
  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const response = await api.get('/super-admin/marketing-managers');
      if (response.data.success) {
        setManagers(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to load marketing managers');
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('All fields are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/super-admin/marketing-managers', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        toast.success('Marketing Manager created successfully!');
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        // Refresh the list
        fetchManagers();
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = 'Failed to create marketing manager';
      
      if (errorData) {
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (manager: MarketingManager) => {
    setEditingManager(manager);
    setEditForm({
      name: manager.name,
      email: manager.email
    });
  };

  const handleCancelEdit = () => {
    setEditingManager(null);
    setEditForm({ name: '', email: '' });
  };

  const handleUpdateManager = async (id: string) => {
    if (!editForm.name || !editForm.email) {
      toast.error('Name and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const response = await api.put(`/super-admin/marketing-managers/${id}`, {
        name: editForm.name,
        email: editForm.email
      });

      if (response.data.success) {
        toast.success('Marketing Manager updated successfully!');
        setEditingManager(null);
        setEditForm({ name: '', email: '' });
        // Refresh the list
        fetchManagers();
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = 'Failed to update marketing manager';
      
      if (errorData) {
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await api.delete(`/super-admin/marketing-managers/${id}`);

      if (response.data.success) {
        toast.success('Marketing Manager deleted permanently!');
        // Refresh the list
        fetchManagers();
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = 'Failed to delete marketing manager';
      
      if (errorData) {
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <StandardHeader pageTitle="Manage Marketing Managers" />

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Create New Manager Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Add New Marketing Manager</h2>
                <p className="text-sm text-gray-600">Create a new marketing manager account</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="manager@example.com"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                      placeholder="Enter password (min 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                      placeholder="Re-enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                  })}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      Create Marketing Manager
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Marketing Managers List Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Marketing Managers List</h2>
                <p className="text-sm text-gray-600">Manage existing marketing manager accounts</p>
              </div>
              <button
                onClick={fetchManagers}
                disabled={loadingManagers}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingManagers ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {loadingManagers ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : managers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No marketing managers found. Create one above to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Created At</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager) => (
                      <tr key={manager.id} className="border-b hover:bg-gray-50">
                        {editingManager?.id === manager.id ? (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                name="name"
                                value={editForm.name}
                                onChange={handleEditInputChange}
                                className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Name"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleEditInputChange}
                                className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Email"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(manager.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleUpdateManager(manager.id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  <Save size={16} />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                                >
                                  <X size={16} />
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{manager.name}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{manager.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(manager.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(manager)}
                                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  <Edit2 size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(manager.id, manager.name)}
                                  disabled={deletingId === manager.id}
                                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deletingId === manager.id ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={16} />
                                      Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">About Marketing Managers</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Marketing Managers have limited access to the system</li>
              <li>• They can only view their own campaigns and cannot create templates</li>
              <li>• They cannot bulk upload MRs but can use MRs uploaded by Super Admin</li>
              <li>• All Marketing Managers will be assigned the "admin" role with restricted permissions</li>
              <li>• Deleting a manager will permanently remove them from the database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageManagers;
