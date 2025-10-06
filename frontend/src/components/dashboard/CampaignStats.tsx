import React from 'react';
import { MessageSquare, CheckCircle, Clock, TrendingUp } from 'lucide-react';
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
  } | null;
  date: string;
  sendStatus: 'completed' | 'in-progress' | 'pending' | 'failed';
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
    
    // Campaign status counting based on new 4-status system
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const inProgress = campaigns.filter(c => c.status === 'in-progress').length;
    const failed = campaigns.filter(c => c.status === 'failed').length;
    const pending = campaigns.filter(c => c.status === 'pending').length;
    
    // Calculate totals from real-time progress data
    const totalRecipients = campaigns.reduce((sum, c) => sum + c.totalRecipients, 0);
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);
    const totalPending = campaigns.reduce((sum, c) => sum + (c.totalRecipients - c.sentCount - c.failedCount), 0);
    
    // Calculate overall success rate based on processed messages
    const totalProcessed = totalSent + totalFailed;
    const overallSuccessRate = totalProcessed > 0 
      ? Math.round((totalSent / totalProcessed) * 100) 
      : 0;

    return {
      total,
      completed,
      inProgress,
      failed,
      pending,
      totalRecipients,
      totalSent,
      totalFailed,
      totalPending,
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
      subtitle: `${stats.totalRecipients} total recipients`,
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Completed',
      value: stats.completed,
      subtitle: `${stats.totalSent} messages sent`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      subtitle: `${stats.totalPending} pending messages`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Success Rate',
      value: `${stats.overallSuccessRate}%`,
      subtitle: `${stats.totalSent}/${stats.totalSent + stats.totalFailed} processed`,
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
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
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