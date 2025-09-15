import React from 'react';
import { MessageSquare, BarChart3 } from 'lucide-react';

interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: string;
  recipientList: string[];
  date: string;
  sendStatus: 'completed' | 'in progress';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
}

interface CampaignStatsProps {
  campaigns: CampaignRecord[];
}

const CampaignStats: React.FC<CampaignStatsProps> = ({ campaigns }) => {
  const totalCampaigns = campaigns.length;
  const completedCampaigns = campaigns.filter(c => c.sendStatus === 'completed').length;
  const inProgressCampaigns = campaigns.filter(c => c.sendStatus === 'in progress').length;
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.totalRecipients, 0);
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + c.failedCount, 0);

  const summaryItems = [
    {
      title: 'Total Campaigns',
      value: totalCampaigns,
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Completed',
      value: completedCampaigns,
      icon: <MessageSquare className="h-6 w-6 text-indigo-600" />,
      color: 'bg-indigo-100'
    },
    {
      title: 'Total Recipients',
      value: totalRecipients,
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      title: 'Success Rate',
      value: totalRecipients > 0 ? `${Math.round((totalSent / totalRecipients) * 100)}%` : '0%',
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {summaryItems.map((item, index) => (
        <div key={index} className={`${item.color} rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{item.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CampaignStats;
