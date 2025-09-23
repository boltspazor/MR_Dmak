import React from 'react';
import { MessageSquare, CheckCircle, Clock, X, TrendingUp } from 'lucide-react';
import { SkeletonStats } from '../ui/SkeletonLoader';

export interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: {
    name: string;
    metaTemplateName?: string;
    isMetaTemplate: boolean;
    metaStatus?: string;
  };
  recipientList: {
    name: string;
    recipientCount: number;
  };
  date: string;
  sendStatus: 'completed' | 'in progress' | 'pending' | 'failed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  status: string;
}

interface CampaignStatsProps {
  campaigns: CampaignRecord[];
  loading?: boolean;
}

const CampaignStats: React.FC<CampaignStatsProps> = ({ campaigns, loading = false }) => {
  const stats = React.useMemo(() => {
    const total = campaigns.length;
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const inProgress = campaigns.filter(c => 
      c.status === 'sending' || c.status === 'pending' || c.status === 'draft'
    ).length;
    const failed = campaigns.filter(c => c.status === 'failed').length;
    
    const totalRecipients = campaigns.reduce((sum, c) => sum + c.totalRecipients, 0);
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);
    
    const overallSuccessRate = totalRecipients > 0 
      ? Math.round((totalSent / totalRecipients) * 100) 
      : 0;

    return {
      total,
      completed,
      inProgress,
      failed,
      totalRecipients,
      totalSent,
      totalFailed,
      overallSuccessRate
    };
  }, [campaigns]);

  if (loading) {
    return <SkeletonStats className="mb-8" />;
  }

  const statCards = [
    {
      title: 'Total Campaigns',
      value: stats.total,
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Overall Success Rate',
      value: `${stats.overallSuccessRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CampaignStats;