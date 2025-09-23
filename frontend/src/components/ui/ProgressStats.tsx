import React from 'react';
import { Users, Send, CheckCircle, Clock } from 'lucide-react';

interface ProgressStatsProps {
  totalRecipients: number;
  sentCount: number;
  pendingCount: number;
  successRate?: number;
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  totalRecipients,
  sentCount,
  pendingCount,
  successRate
}) => {
  const progressPercentage = totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Progress</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalRecipients}</div>
          <div className="text-sm text-gray-600">Total Recipients</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
            <Send className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{sentCount}</div>
          <div className="text-sm text-gray-600">Messages Sent</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>

        {successRate !== undefined && (
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressStats;
