import React from 'react';
import { Users, UserCheck, Building2, MessageSquare } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    totalMRs: number;
    totalGroups: number;
    totalCampaigns: number;
  } | null;
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  const statItems = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Marketing Managers',
      value: stats?.totalMRs || 0,
      icon: <UserCheck className="h-6 w-6" />,
      color: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Total Groups',
      value: stats?.totalGroups || 0,
      icon: <Building2 className="h-6 w-6" />,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Total Campaigns',
      value: stats?.totalCampaigns || 0,
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <div key={index} className={`${item.color} rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{item.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
            <div className={item.iconColor}>
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
