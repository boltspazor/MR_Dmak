import React from 'react';
import { ExternalLink, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { MetaTemplateStats } from '../../hooks/useMetaTemplates';

interface MetaIntegrationProps {
  metaTemplateStats: MetaTemplateStats | null;
  syncingTemplates: boolean;
  onGetMetaTemplateCreationUrl: () => Promise<void>;
  onSyncTemplatesWithMeta: () => Promise<void>;
}

const MetaIntegration: React.FC<MetaIntegrationProps> = ({
  metaTemplateStats,
  syncingTemplates,
  onGetMetaTemplateCreationUrl,
  onSyncTemplatesWithMeta
}) => {
  return (
    <div className="space-y-6">
      {/* Meta Template Stats */}
      {metaTemplateStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Meta Template Statistics</h3>
            <div className="flex space-x-3">
              <button
                onClick={onGetMetaTemplateCreationUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Create Meta Template</span>
              </button>

              <button
                onClick={onSyncTemplatesWithMeta}
                disabled={syncingTemplates}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${syncingTemplates ? 'animate-spin' : ''}`} />
                <span>{syncingTemplates ? 'Syncing...' : 'Sync Templates'}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">{metaTemplateStats.total}</div>
              <div className="text-sm text-blue-700 font-medium">Meta Templates</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">{metaTemplateStats.approved}</div>
              <div className="text-sm text-green-700 font-medium">Approved</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-yellow-600 mb-1">{metaTemplateStats.pending}</div>
              <div className="text-sm text-yellow-700 font-medium">Pending</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">{metaTemplateStats.rejected}</div>
              <div className="text-sm text-red-700 font-medium">Rejected</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Show when no stats */}
      {!metaTemplateStats && (
        <div className="flex justify-end">
          <div className="flex space-x-3">
            <button
              onClick={onGetMetaTemplateCreationUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Create Meta Template</span>
            </button>

            <button
              onClick={onSyncTemplatesWithMeta}
              disabled={syncingTemplates}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${syncingTemplates ? 'animate-spin' : ''}`} />
              <span>{syncingTemplates ? 'Syncing...' : 'Sync Templates'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaIntegration;
