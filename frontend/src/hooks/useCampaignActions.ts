import { useState } from 'react';
import { campaignsAPI } from '../api/campaigns-new';
import { api } from '../api/config';

export const useCampaignActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWithTemplateCampaign = async (campaignData: {
    name: string;
    templateId: string;
    recipientListId: string;
    type: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Create the campaign first
      const campaign = await campaignsAPI.createCampaign({
        name: campaignData.name,
        templateId: campaignData.templateId,
        recipientListId: campaignData.recipientListId
      });
      
      // Automatically activate the campaign to start sending
      await campaignsAPI.updateCampaignStatus(campaign.campaignId, 'sending');
      
      return { success: true, campaign };
    } catch (error) {
      console.error('Error creating and activating template campaign:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createCustomMessageCampaign = async (campaignData: {
    name: string;
    content: string;
    targetMrs: string[];
    image?: File;
    footerImage?: File;
    type: string;
  }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', campaignData.name);
      formData.append('content', campaignData.content);
      formData.append('targetMrs', JSON.stringify(campaignData.targetMrs));
      formData.append('type', campaignData.type);
      
      if (campaignData.image) {
        formData.append('image', campaignData.image);
      }
      if (campaignData.footerImage) {
        formData.append('footerImage', campaignData.footerImage);
      }

      // Create the campaign
      const response = await api.post('/messages/campaigns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // If the response contains campaign information, activate it
      if (response.data?.data?.campaignId) {
        await campaignsAPI.updateCampaignStatus(response.data.data.campaignId, 'sending');
      }
      
      return { success: true, campaign: response.data?.data };
    } catch (error) {
      console.error('Error creating and activating custom campaign:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createRecipientList = async (data: {
    name: string;
    description: string;
    csvFile: File;
  }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('csvFile', data.csvFile);

      await api.post('/recipient-lists/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating recipient list:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    createWithTemplateCampaign,
    createCustomMessageCampaign,
    createRecipientList
  };
};
