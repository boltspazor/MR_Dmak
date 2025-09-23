import React, { useState } from 'react';
import { Send, Users, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { WizardTemplate, WizardMR, WizardCampaign } from '../../pages/CampaignWizard';
import TemplatePreviewDialog from '../ui/TemplatePreviewDialog';
import whatsappCloudAPI from '../../api/whatsapp-cloud';
import toast from 'react-hot-toast';

interface StepTwoCampaignCreationProps {
  stepNumber: number;
  stepTitle: string;
  stepDescription: string;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  selectedTemplate: WizardTemplate | null;
  allMRs: WizardMR[];
  selectedMRs: string[];
  setSelectedMRs: (mrs: string[]) => void;
}

const StepTwoCampaignCreation: React.FC<StepTwoCampaignCreationProps> = ({
  stepNumber,
  stepTitle,
  stepDescription,
  onComplete,
  selectedTemplate,
  allMRs,
  selectedMRs,
  setSelectedMRs
}) => {
  const [campaignName, setCampaignName] = useState('');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showMRSelection, setShowMRSelection] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  // Get unique groups
  const uniqueGroups = [...new Set(allMRs.map(mr => mr.group))];

  // Filter MRs based on search and group
  const filteredMRs = allMRs.filter(mr => {
    const matchesSearch = 
      mr.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mr.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mr.mrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mr.phone.includes(searchTerm);
    
    const matchesGroup = groupFilter === 'all' || mr.group === groupFilter;
    
    return matchesSearch && matchesGroup;
  });

  const handleMRToggle = (mrId: string) => {
    if (selectedMRs.includes(mrId)) {
      setSelectedMRs(selectedMRs.filter(id => id !== mrId));
    } else {
      setSelectedMRs([...selectedMRs, mrId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedMRs.length === filteredMRs.length) {
      setSelectedMRs([]);
    } else {
      setSelectedMRs(filteredMRs.map(mr => mr.id));
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedTemplate || selectedMRs.length === 0 || !campaignName.trim()) {
      return;
    }

    try {
      toast.loading('Creating and sending campaign...', { id: 'campaign-creation' });

      const selectedMRsData = getSelectedMRsData();
      
      // Prepare recipients for WhatsApp Cloud API
      const recipients = selectedMRsData.map(mr => ({
        phone: mr.phone,
        firstName: mr.firstName,
        lastName: mr.lastName
      }));

      let result;
      
      if (selectedTemplate.type === 'text' || selectedTemplate.type === 'html') {
        // Send as custom message (not template)
        result = await whatsappCloudAPI.sendCustomCampaign(
          recipients,
          selectedTemplate.content,
          campaignName.trim()
        );
      } else {
        // Send as template message
        // Extract parameters from template content
        const parameterMatches = selectedTemplate.content.match(/{{([^}]+)}}/g) || [];
        const parameterNames = parameterMatches.map(match => match.replace(/[{}]/g, ''));
        
        // For demo purposes, use sample parameters
        const templateParameters = parameterNames.map(() => 'Sample Value');
        
        result = await whatsappCloudAPI.sendCampaign(
          recipients,
          'hello_world', // You'll need to use an approved template name
          templateParameters,
          campaignName.trim()
        );
      }

      const campaign: WizardCampaign = {
        id: `campaign_${Date.now()}`,
        campaignName: campaignName.trim(),
        templateId: selectedTemplate._id,
        selectedMRs: selectedMRs,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      toast.success(`Campaign sent successfully! ${result.data.success}/${result.data.total} messages delivered.`, {
        id: 'campaign-creation'
      });

      onComplete({ 
        campaign, 
        selectedMRs,
        campaignResult: result
      });

    } catch (error: any) {
      console.error('Campaign creation error:', error);
      toast.error(`Failed to send campaign: ${error.message}`, {
        id: 'campaign-creation'
      });

      // Still create the campaign record even if sending fails
      const campaign: WizardCampaign = {
        id: `campaign_${Date.now()}`,
        campaignName: campaignName.trim(),
        templateId: selectedTemplate._id,
        selectedMRs: selectedMRs,
        status: 'failed',
        createdAt: new Date().toISOString()
      };

      onComplete({ 
        campaign, 
        selectedMRs 
      });
    }
  };

  const getSelectedMRsData = () => {
    return allMRs.filter(mr => selectedMRs.includes(mr.id));
  };

  const isFormValid = () => {
    return selectedTemplate && selectedMRs.length > 0 && campaignName.trim().length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{stepTitle}</h2>
        <p className="mt-2 text-gray-600">{stepDescription}</p>
      </div>

      {/* Campaign Name Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Enter campaign name (e.g., Q1 Product Launch)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Template Selection */}
      {selectedTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selected Template</h3>
            <button
              onClick={() => setShowTemplatePreview(true)}
              className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="font-medium text-indigo-900">{selectedTemplate.name}</p>
              <p className="text-sm text-indigo-700">
                {selectedTemplate.type.toUpperCase()} • {selectedTemplate.parameters.length} parameters
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-indigo-600 ml-auto" />
          </div>
        </div>
      )}

      {/* MR Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Medical Representatives ({selectedMRs.length} selected)
          </h3>
          <button
            onClick={() => setShowMRSelection(!showMRSelection)}
            className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <Users className="w-4 h-4" />
            <span>{showMRSelection ? 'Hide' : 'Show'} Selection</span>
          </button>
        </div>

        {showMRSelection && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, or phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Groups</option>
                  {uniqueGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select All Button */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selectedMRs.length === filteredMRs.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-600">
                {filteredMRs.length} MRs available
              </span>
            </div>

            {/* MR List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredMRs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No medical representatives found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMRs.map((mr) => (
                    <div
                      key={mr.id}
                      onClick={() => handleMRToggle(mr.id)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedMRs.includes(mr.id)
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'hover:bg-gray-50'
                      } border-l-4 ${
                        selectedMRs.includes(mr.id) ? 'border-indigo-500' : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {mr.firstName} {mr.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {mr.mrId} • {mr.phone} • {mr.group}
                          </p>
                        </div>
                        {selectedMRs.includes(mr.id) && (
                          <CheckCircle className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected MRs Summary */}
        {selectedMRs.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">
                {selectedMRs.length} medical representative{selectedMRs.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="mt-2 text-sm text-green-800">
              {getSelectedMRsData().slice(0, 3).map(mr => (
                <span key={mr.id} className="inline-block mr-2">
                  {mr.firstName} {mr.lastName}
                </span>
              ))}
              {selectedMRs.length > 3 && (
                <span>... and {selectedMRs.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Button */}
      <div className="text-center">
        <button
          onClick={handleCreateCampaign}
          disabled={!isFormValid()}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            isFormValid()
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Create Campaign</span>
          </div>
        </button>
      </div>

      {/* Validation Messages */}
      {!isFormValid() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Please complete the following:</p>
              <ul className="list-disc list-inside space-y-1">
                {!campaignName.trim() && <li>Enter a campaign name</li>}
                {!selectedTemplate && <li>Select a template</li>}
                {selectedMRs.length === 0 && <li>Select at least one medical representative</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 What's Next?</h4>
        <p className="text-sm text-blue-800">
          {isFormValid() 
            ? `Perfect! Your campaign "${campaignName}" is ready to be created with ${selectedMRs.length} medical representatives. Click "Create Campaign" to proceed.`
            : "Complete the campaign details above. Make sure to enter a campaign name, select a template, and choose which medical representatives to include."
          }
        </p>
      </div>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        template={selectedTemplate}
        showDownloadButton={false}
        variant="full"
      />
    </div>
  );
};

export default StepTwoCampaignCreation;
