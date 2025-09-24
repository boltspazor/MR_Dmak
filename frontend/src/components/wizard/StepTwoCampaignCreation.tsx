import React, { useState, useEffect, useMemo } from 'react';
import { Send, Users, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { WizardTemplate, WizardMR, WizardCampaign } from '../../pages/CampaignWizard';
import TemplatePreviewDialog from '../ui/TemplatePreviewDialog';
import ProgressStats from '../ui/ProgressStats';
import { SkeletonLoader, SkeletonText } from '../ui/SkeletonLoader';
import { api } from '../../api/config';
import { campaignsAPI } from '../../api/campaigns-new';
import toast from 'react-hot-toast';

interface StepTwoCampaignCreationProps {
  stepNumber?: number; // Made optional since it's not used
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
  stepTitle,
  stepDescription,
  onComplete,
  onNext,
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
  const [templateRecipients, setTemplateRecipients] = useState<WizardMR[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientLists, setRecipientLists] = useState<any[]>([]);
  const [selectedRecipientList, setSelectedRecipientList] = useState<any>(null);
  const [loadingRecipientLists, setLoadingRecipientLists] = useState(false);

  // Load recipient lists for the selected template
  useEffect(() => {
    const loadRecipientLists = async () => {
      if (selectedTemplate) {
        try {
          setLoadingRecipientLists(true);
          console.log('Loading recipient lists for template:', selectedTemplate._id);
          const response = await api.get(`/recipient-lists/template/${selectedTemplate._id}`);
          const listsData = response.data.data || response.data || [];
          console.log('Loaded recipient lists:', listsData);
          setRecipientLists(listsData);
          
          // Auto-select the first recipient list if available
          if (listsData.length > 0) {
            console.log('Auto-selecting first recipient list:', listsData[0]);
            setSelectedRecipientList(listsData[0]);
          } else {
            setSelectedRecipientList(null);
          }
        } catch (error: any) {
          console.error('Failed to load recipient lists:', error);
          toast.error('Failed to load recipient lists');
          setRecipientLists([]);
          setSelectedRecipientList(null);
        } finally {
          setLoadingRecipientLists(false);
        }
      } else {
        setRecipientLists([]);
        setSelectedRecipientList(null);
      }
    };

    loadRecipientLists();
  }, [selectedTemplate]);

  // Load template recipients from the selected recipient list
  useEffect(() => {
    const loadTemplateRecipients = () => {
      if (selectedRecipientList && selectedRecipientList.recipients && selectedRecipientList.recipients.length > 0) {
        try {
          setLoadingRecipients(true);
          
          // Convert recipients from the selected recipient list to WizardMR format
          const wizardRecipients: WizardMR[] = selectedRecipientList.recipients.map((recipient: any) => {
            // Better group name extraction
            let groupName = 'No Group';
            if (recipient.groupId) {
              // Try to find the group name from allMRs or use groupId as fallback
              const group = allMRs.find(mr => mr.id === recipient.groupId);
              groupName = group?.group || recipient.groupId;
            }
            
            return {
              id: recipient._id || recipient.id,
              mrId: recipient.mrId,
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              phone: recipient.phone,
              email: recipient.email || '',
              group: groupName,
              comments: recipient.comments || ''
            };
          });
          
          setTemplateRecipients(wizardRecipients);
          
          // Auto-select all template recipients
          setSelectedMRs(wizardRecipients.map(r => r.id));
        } catch (error: any) {
          console.error('Failed to process template recipients:', error);
          toast.error('Failed to process template recipients');
          setTemplateRecipients([]);
        } finally {
          setLoadingRecipients(false);
        }
      } else {
        setTemplateRecipients([]);
        setSelectedMRs([]);
      }
    };

    loadTemplateRecipients();
  }, [selectedRecipientList, allMRs]);

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

  // Helper function to check if template has parameters
  const hasParameters = (template: WizardTemplate | null): boolean => {
    if (!template?.parameters) return false;
    return template.parameters.length > 0;
  };


  // Get MRs to show based on template parameters
  const mrsToShow = useMemo(() => {
    // If template has parameters, show template recipients
    if (hasParameters(selectedTemplate)) {
      return templateRecipients;
    }
    // If template has no parameters, show filtered MRs
    return filteredMRs;
  }, [selectedTemplate, templateRecipients, filteredMRs]);

  const handleMRToggle = (mrId: string) => {
    if (selectedMRs.includes(mrId)) {
      setSelectedMRs(selectedMRs.filter(id => id !== mrId));
    } else {
      setSelectedMRs([...selectedMRs, mrId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedMRs.length === mrsToShow.length) {
      setSelectedMRs([]);
    } else {
      setSelectedMRs(mrsToShow.map(mr => mr.id));
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedTemplate || selectedMRs.length === 0 || !campaignName.trim()) {
      return;
    }

    try {
      toast.loading('Creating and starting campaign...', { id: 'campaign-creation' });

      let result;

      // Check if template has parameters to determine which API to call
      if (hasParameters(selectedTemplate)) {
        // Template with parameters - use recipient list
        if (!selectedRecipientList) {
          toast.error('Please select a recipient list for this template');
          return;
        }

        // Call the standard campaign API with recipient list
        result = await campaignsAPI.createCampaign({
          name: campaignName.trim(),
          templateId: selectedTemplate._id,
          recipientListId: selectedRecipientList._id
        });
      } else {
        // Template without parameters - use direct MR selection
        // Call the new campaign API with direct MRs
        result = await campaignsAPI.createCampaignWithMRs({
          name: campaignName.trim(),
          templateId: selectedTemplate._id,
          mrIds: selectedMRs
        });
      }

      console.log('Campaign creation result:', result);
      
      // The campaignsAPI.createCampaign returns response.data.data, so result is the campaign data
      const campaignId = result.campaignId;
      
      if (!campaignId) {
        console.error('No campaign ID found in response:', result);
        toast.error('Campaign created but no ID returned. Please check the campaign manually.');
        return;
      }
      
      // Automatically start sending messages
      toast.loading('Starting message sending...', { id: 'campaign-creation' });
      await campaignsAPI.updateCampaignStatus(campaignId, 'sending');

      const campaign: WizardCampaign = {
        id: campaignId,
        campaignName: campaignName.trim(),
        templateId: selectedTemplate._id,
        selectedMRs: selectedMRs,
        status: 'sending',
        createdAt: new Date().toISOString()
      };

      // Get recipient count based on template type
      const recipientCount = hasParameters(selectedTemplate) 
        ? selectedRecipientList.recipients?.length || 0
        : selectedMRs.length;

      toast.success(`Campaign created and activated! Messages are being sent to ${recipientCount} recipients.`, {
        id: 'campaign-creation'
      });

      onComplete({ 
        campaign, 
        selectedMRs,
        campaignResult: result
      });

      // Automatically move to the next step (Progress Check)
      onNext();

    } catch (error: any) {
      console.error('Template campaign creation error:', error);
      toast.error(`Failed to create template campaign: ${error.response?.data?.error || error.message}`, {
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
        selectedMRs,
        campaignResult: { error: error.message }
      });
    }
  };

  const getSelectedMRsData = () => {
    // If template has parameters, use template recipients
    if (hasParameters(selectedTemplate)) {
      return templateRecipients.filter(mr => selectedMRs.includes(mr.id));
    }
    // If template has no parameters, use all MRs
    return allMRs.filter(mr => selectedMRs.includes(mr.id));
  };

  const isFormValid = () => {
    // Basic validation
    if (!selectedTemplate || selectedMRs.length === 0 || !campaignName.trim().length) {
      return false;
    }

    // For templates with parameters, we need a recipient list
    if (hasParameters(selectedTemplate)) {
      if (!selectedRecipientList) return false;
    }

    return true;
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
        <div className="space-y-4">
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

          {/* Recipient List Selection */}
          {selectedTemplate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient List *
              </label>
              {loadingRecipientLists ? (
                <div className="space-y-2">
                  <SkeletonLoader variant="rounded" height={40} width="100%" className="animate-pulse" />
                  <SkeletonText lines={1} className="text-sm" />
                </div>
              ) : recipientLists.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedRecipientList?._id || ''}
                    onChange={(e) => {
                      const list = recipientLists.find(l => l._id === e.target.value);
                      console.log('Selected recipient list:', list);
                      setSelectedRecipientList(list);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a recipient list</option>
                    {recipientLists.map((list) => {
                      const recipientNames = list.recipients && list.recipients.length > 0 
                        ? list.recipients.slice(0, 2).map((r: any) => `${r.firstName} ${r.lastName}`).join(', ') + 
                          (list.recipients.length > 2 ? ` +${list.recipients.length - 2} more` : '')
                        : 'No recipients';
                      
                      return (
                        <option key={list._id} value={list._id}>
                          {list.name}: {recipientNames}
                        </option>
                      );
                    })}
                  </select>
                  
                  {selectedRecipientList && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Selected: {selectedRecipientList.name}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {selectedRecipientList.recipients?.length || selectedRecipientList.data?.length || 0} recipients ready
                      </div>
                      {/* Show individual recipient names */}
                      {selectedRecipientList.recipients && selectedRecipientList.recipients.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-green-700 font-medium mb-1">Recipients:</div>
                          <div className="text-xs text-green-600">
                            {selectedRecipientList.recipients.slice(0, 3).map((recipient: any, index: number) => (
                              <span key={recipient._id || index}>
                                {recipient.firstName} {recipient.lastName}
                                {index < Math.min(selectedRecipientList.recipients.length, 3) - 1 ? ', ' : ''}
                              </span>
                            ))}
                            {selectedRecipientList.recipients.length > 3 && (
                              <span> and {selectedRecipientList.recipients.length - 3} more...</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No recipient lists found for this template.</p>
                  <p className="text-xs">Please create a recipient list first.</p>
                </div>
              )}
            </div>
          )}
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
                {selectedTemplate.type.toUpperCase()} • {selectedTemplate.parameters?.length || 0} parameters
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-indigo-600 ml-auto" />
          </div>
        </div>
      )}

      {/* Template Recipients - Show if template has parameters */}
      {hasParameters(selectedTemplate) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Template Recipients ({selectedMRs.length} selected)
            </h3>
            {loadingRecipients && (
              <div className="flex items-center space-x-2 text-indigo-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm">Loading recipients...</span>
              </div>
            )}
          </div>

          {loadingRecipients ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonLoader variant="text" height={20} width="40%" className="animate-pulse" />
                <SkeletonLoader variant="text" height={16} width="20%" className="animate-pulse" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <SkeletonLoader variant="text" height={16} width="60%" className="animate-pulse mb-1" />
                        <SkeletonLoader variant="text" height={14} width="80%" className="animate-pulse" />
                      </div>
                      <SkeletonLoader variant="circular" width={20} height={20} className="animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : templateRecipients.length > 0 ? (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="space-y-1">
                  {templateRecipients.map((mr) => (
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
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No recipients found for this template.</p>
              <p className="text-sm">Please add recipients to this template first.</p>
            </div>
          )}
        </div>
      )}

      {/* MR Selection - Only show if template has no parameters */}
      {selectedTemplate && !hasParameters(selectedTemplate) && (
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
                {selectedMRs.length === mrsToShow.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-600">
                {mrsToShow.length} MRs available
              </span>
            </div>

            {/* MR List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {mrsToShow.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No medical representatives found
                </div>
              ) : (
                <div className="space-y-1">
                  {mrsToShow.map((mr) => (
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
      )}

      {/* Campaign Progress Preview */}
      {(selectedRecipientList || (selectedTemplate && !hasParameters(selectedTemplate) && selectedMRs.length > 0)) && (
        <div className="mb-6">
          <ProgressStats
            totalRecipients={
              hasParameters(selectedTemplate)
                ? selectedRecipientList.recipients?.length || selectedRecipientList.data?.length || 0
                : selectedMRs.length
            }
            sentCount={0}
            pendingCount={
              hasParameters(selectedTemplate)
                ? selectedRecipientList.recipients?.length || selectedRecipientList.data?.length || 0
                : selectedMRs.length
            }
          />
        </div>
      )}

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
            <span>Create & Start Campaign</span>
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
                {hasParameters(selectedTemplate) && !selectedRecipientList && <li>Select a recipient list</li>}
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
            ? hasParameters(selectedTemplate)
              ? `Perfect! Your campaign "${campaignName}" is ready to be created and started with ${selectedRecipientList?.recipients?.length || 0} recipients from "${selectedRecipientList?.name}". Click "Create & Start Campaign" to proceed.`
              : `Perfect! Your campaign "${campaignName}" is ready to be created and started with ${selectedMRs.length} medical representatives. Click "Create & Start Campaign" to proceed.`
            : hasParameters(selectedTemplate)
            ? "Complete the campaign details above. Make sure to enter a campaign name, select a template, and choose a recipient list. The template recipients will be automatically loaded."
            : "Complete the campaign details above. Make sure to enter a campaign name, select a template, and select which medical representatives to include."
          }
        </p>
        {/* Show recipient names in the preview */}
        {isFormValid() && (
          <div className="mt-2 text-xs text-blue-700">
            <div className="font-medium mb-1">
              {hasParameters(selectedTemplate) ? 'Recipients included:' : 'Medical Representatives included:'}
            </div>
            <div>
              {hasParameters(selectedTemplate) ? (
                // Show recipient list recipients
                selectedRecipientList?.recipients?.slice(0, 5).map((recipient: any, index: number) => (
                  <span key={recipient._id || index}>
                    {recipient.firstName} {recipient.lastName}
                    {index < Math.min(selectedRecipientList.recipients.length, 5) - 1 ? ', ' : ''}
                  </span>
                )) &&
                selectedRecipientList.recipients.length > 5 && (
                  <span> and {selectedRecipientList.recipients.length - 5} more...</span>
                )
              ) : (
                // Show selected MRs
                getSelectedMRsData().slice(0, 5).map((mr, index) => (
                  <span key={mr.id}>
                    {mr.firstName} {mr.lastName}
                    {index < Math.min(selectedMRs.length, 5) - 1 ? ', ' : ''}
                  </span>
                ))
              )}
              {selectedTemplate && !hasParameters(selectedTemplate) && selectedMRs.length > 5 && (
                <span> and {selectedMRs.length - 5} more...</span>
              )}
            </div>
          </div>
        )}
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
