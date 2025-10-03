import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Users, FileText } from 'lucide-react';
import { api } from '../api/config';
import toast from 'react-hot-toast';

// Step Components
import StepOneTemplateSelection from '../components/wizard/StepOneTemplateSelection';
import StepTwoCampaignCreation from '../components/wizard/StepTwoCampaignCreation';

import StandardHeader from '../components/StandardHeader';
import TemplatePreviewDialog from '../components/ui/TemplatePreviewDialog';

// Types
export interface WizardTemplate {
  metaCategory: any;
  _id: string;
  name: string;
  content: string;
  type: 'html' | 'text' | 'image';
  imageUrl?: string;
  footerImageUrl?: string;
  parameters: Array<{name: string, type: 'text' | 'number'}> | string[]; // Support both new format and legacy
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Meta template properties
  isMetaTemplate?: boolean;
  metaStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  metaTemplateId?: string;
}

export interface WizardMR {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  group: string;
  comments?: string;
}

export interface WizardCampaign {
  id: string;
  campaignName: string;
  templateId: string;
  selectedMRs: string[];
  status: 'draft' | 'sending' | 'completed' | 'failed';
  createdAt: string;
}

const CampaignWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);


    // Wizard state
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WizardTemplate | null>(null);
  const [allMRs, setAllMRs] = useState<WizardMR[]>([]);
  const [selectedMRs, setSelectedMRs] = useState<string[]>([]);
  const [createdCampaign, setCreatedCampaign] = useState<WizardCampaign | null>(null);

  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const steps = [
    {
      id: 1,
      title: 'Campaign & Template',
      description: 'Name your campaign and choose template',
      icon: FileText,
      component: StepOneTemplateSelection
    },
    {
      id: 2,
      title: 'Select Recipients',
      description: 'Choose recipient list or select MRs',
      icon: Users,
      component: StepTwoCampaignCreation
    }
  ];

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Check if current step is valid
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return campaignName.trim() !== '' && selectedTemplate !== null;
      case 2:
        return selectedMRs.length > 0;
      default:
        return false;
    }
  };

  // Check if step is completed
  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return createdCampaign !== null;
      case 3:
        return createdCampaign !== null;
      default:
        return false;
    }
  };

    // Handle step completion
  const handleStepComplete = (stepData: any) => {
    switch (currentStep) {
      case 1:
        if (stepData.campaignName) {
          setCampaignName(stepData.campaignName);
        }
        if (stepData.template) {
          setSelectedTemplate(stepData.template);
        }
        break;
      case 2:
        setCreatedCampaign(stepData.campaign);
        setSelectedMRs(stepData.selectedMRs);
        // Navigate to dashboard with recipient list popup
        setTimeout(() => {
          navigate('/dashboard?showRecipientList=true&campaignId=' + stepData.campaign.id);
        }, 1000);
        break;
    }
  };

  // Handle sidebar navigation

  // Load MRs on component mount
  useEffect(() => {
    const loadMRs = async () => {
      try {
        const response = await api.get('/mrs?limit=1000');
        const mrsData = response.data.data || response.data || [];
        
        const wizardMRs: WizardMR[] = mrsData.map((mr: any) => {
          // Better group name extraction
          let groupName = 'No Group';
          if (mr.group) {
            if (typeof mr.group === 'string') {
              groupName = mr.group;
            } else if (mr.group.groupName) {
              groupName = mr.group.groupName;
            } else if (mr.group.name) {
              groupName = mr.group.name;
            }
          }
          
          return {
            id: mr._id || mr.id,
            mrId: mr.mrId,
            firstName: mr.firstName,
            lastName: mr.lastName,
            phone: mr.phone,
            email: mr.email,
            group: groupName,
            comments: mr.comments || ''
          };
        });
        
        setAllMRs(wizardMRs);
      } catch (error: any) {
        console.error('Failed to load MRs:', error);
        toast.error(`Failed to load medical representatives: ${error.message || 'Unknown error'}`);
      }
    };

    loadMRs();
  }, []);

  // Get current step component
  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Main Content */}
      <div className="">
          <StandardHeader pageTitle="Create Campaign" />

        {/* Wizard Content */}
        <div className="flex-1 p-6">
          <div className={`max-w-7xl mx-auto ${selectedTemplate ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
            {/* Progress Stepper */}
            <div className={`mb-8 ${selectedTemplate ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-center gap-16">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id);
                  const isAccessible = step.id <= currentStep || isStepCompleted(step.id - 1);
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex items-center">
                      {/* Step Circle */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => isAccessible && goToStep(step.id)}
                          disabled={!isAccessible}
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : isActive
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : isAccessible
                              ? 'bg-white border-indigo-300 text-indigo-600 hover:border-indigo-400'
                              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </button>
                        
                        {/* Step Info */}
                        <div className="mt-2 text-center">
                          <p className={`text-sm font-medium ${
                            isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-4 ${
                          isStepCompleted(step.id) ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className={`bg-white rounded-lg shadow-sm border transition-all duration-500 ease-in-out ${selectedTemplate ? 'lg:col-span-1' : ''}`}>
              <div className="p-6">
                <div className="transition-all duration-300 ease-in-out">
                  <CurrentStepComponent
                    stepNumber={currentStep}
                    stepTitle={steps[currentStep - 1].title}
                    stepDescription={steps[currentStep - 1].description}
                    onComplete={handleStepComplete}
                    onNext={nextStep}
                    onPrev={prevStep}
                    canGoNext={isStepValid(currentStep)}
                    canGoPrev={currentStep > 1}
                    // Pass wizard state
                    campaignName={campaignName}
                    selectedTemplate={selectedTemplate}
                    allMRs={allMRs}
                    selectedMRs={selectedMRs}
                    // Pass state setters
                    setCampaignName={setCampaignName}
                    setSelectedTemplate={setSelectedTemplate}
                    setSelectedMRs={setSelectedMRs}
                  />
                </div>
              </div>
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="lg:col-span-1 animate-slide-in-right">
                <TemplatePreviewDialog
                  isOpen={true}
                  onClose={() => {}} // No close function needed for panel variant
                  template={selectedTemplate}
                  showDownloadButton={false}
                  variant="panel"
                />
              </div>
            )}

            {/* Navigation Footer */}
            <div className={`mt-6 flex justify-between ${selectedTemplate ? 'lg:col-span-2' : ''}`}>
              <button
                onClick={prevStep}
                disabled={currentStep <= 1}
                className={`px-6 py-2 rounded-lg border transition-colors ${
                  currentStep > 1
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </div>
              </button>

              <div className="flex space-x-3">
                {currentStep < steps.length ? (
                  <button
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className={`px-6 py-2 rounded-lg transition-colors ${
                      isStepValid(currentStep)
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
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

export default CampaignWizard;
