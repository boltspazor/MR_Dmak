import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import reportsService from '../services/reports.service';
import { DashboardStats } from '../types';
import {
  UsersIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await reportsService.getDashboardStats();
        setStats(data);
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Failed to load dashboard',
          message: error.response?.data?.error || 'Could not load dashboard statistics',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [addNotification]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Medical Representatives',
      value: stats.totalMRs,
      icon: UsersIcon,
      color: 'bg-primary-500',
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Total Groups',
      value: stats.totalGroups,
      icon: UserGroupIcon,
      color: 'bg-success-500',
      change: '+5%',
      changeType: 'increase',
    },
    {
      name: 'Total Campaigns',
      value: stats.totalCampaigns,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-warning-500',
      change: '+8%',
      changeType: 'increase',
    },
    {
      name: 'Messages Sent',
      value: stats.totalMessagesSent,
      icon: CheckCircleIcon,
      color: 'bg-success-600',
      change: '+15%',
      changeType: 'increase',
    },
    {
      name: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUpIcon,
      color: 'bg-success-500',
      change: '+2%',
      changeType: 'increase',
    },
    {
      name: 'Pending Messages',
      value: stats.pendingMessages,
      icon: ClockIcon,
      color: 'bg-warning-500',
      change: '-3%',
      changeType: 'decrease',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your MR Communication Tool</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    New campaign created
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.recentActivity.campaigns} campaigns this month
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {stats.recentActivity.messagesSent} messages sent
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-5 w-5 text-success-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Medical Representatives active
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.totalMRs} total MRs
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {stats.recentActivity.messagesReceived} messages received
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="btn btn-primary">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Send Message
            </button>
            <button className="btn btn-secondary">
              <UsersIcon className="h-5 w-5 mr-2" />
              Add MR
            </button>
            <button className="btn btn-secondary">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Create Group
            </button>
            <button className="btn btn-secondary">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
