import axios from 'axios';
import Template, { ITemplate } from '../models/Template';
import logger from '../utils/logger';
import { whatsappConfig, isCloudEnabled } from '../config/whatsapp-cloud.config';

class MetaTemplateSyncService {
  private headers: { Authorization: string; 'Content-Type': string };
  private businessAccountId: string;
  private graphAPIBaseURL: string;

  constructor() {
    if (!isCloudEnabled()) {
      throw new Error('WhatsApp Cloud API is not enabled - required for Meta template sync');
    }

    const cloudConfig = whatsappConfig.cloudConfig;
    if (!cloudConfig) {
      throw new Error('WhatsApp Cloud API configuration not available');
    }

    this.businessAccountId = cloudConfig.businessAccountId;
    this.graphAPIBaseURL = cloudConfig.graphAPIBaseURL;
    
    // Initialize headers lazily to avoid errors during startup
    this.headers = { Authorization: '', 'Content-Type': 'application/json' };
    
    logger.info('MetaTemplateSyncService initialized', { 
      businessAccountId: this.businessAccountId ? 'configured' : 'not configured',
      apiVersion: cloudConfig.apiVersion,
      accessTokenConfigured: !!cloudConfig.accessToken
    });
  }

  /**
   * Get headers with proper error handling
   */
  private getHeaders(): { Authorization: string; 'Content-Type': string } {
    try {
      return whatsappConfig.getCloudAPIHeaders();
    } catch (error) {
      logger.warn('WhatsApp Cloud API access token not configured');
      return { Authorization: '', 'Content-Type': 'application/json' };
    }
  }

  /**
   * Fetch all templates from Meta WhatsApp Business Platform
   */
  async fetchMetaTemplates(): Promise<any[]> {
    try {
      logger.info('Fetching templates from Meta WhatsApp Business Platform');
      
      // Check if access token is configured
      const headers = this.getHeaders();
      if (!headers.Authorization || headers.Authorization === 'Bearer ') {
        logger.warn('WhatsApp Cloud API access token not configured - returning empty template list');
        return [];
      }
      
      const response = await axios.get(
        `${this.graphAPIBaseURL}/${this.businessAccountId}/message_templates`,
        { headers }
      );

      const templates = response.data.data || [];
      
      if (templates.length === 0) {
        logger.info('No templates found in Meta WhatsApp Business Platform');
      } else {
        logger.info(`Fetched ${templates.length} templates from Meta`, { 
          templates: templates.map(t => ({ name: t.name, status: t.status }))
        });
      }

      return templates;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('Unauthorized access to Meta WhatsApp Business Platform - check access token');
        throw new Error('Unauthorized access to Meta WhatsApp Business Platform. Please check your WHATSAPP_ACCESS_TOKEN.');
      } else if (error.response?.status === 403) {
        logger.error('Forbidden access to Meta WhatsApp Business Platform - check permissions');
        throw new Error('Forbidden access to Meta WhatsApp Business Platform. Please check your account permissions.');
      } else if (error.response?.status === 404) {
        logger.warn('Meta WhatsApp Business Platform endpoint not found - returning empty template list');
        return [];
      }
      
      logger.error('Error fetching Meta templates:', error.response?.data || error.message);
      throw new Error(`Failed to fetch Meta templates: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Sync Meta templates with our database
   */
  async syncMetaTemplates(): Promise<{ synced: number; updated: number; created: number; errors: number }> {
    try {
      logger.info('Starting Meta template synchronization');
      
      const metaTemplates = await this.fetchMetaTemplates();
      
      // Handle case when no templates are found
      if (metaTemplates.length === 0) {
        logger.info('No Meta templates found to sync');
        return { synced: 0, updated: 0, created: 0, errors: 0 };
      }
      
      let synced = 0, updated = 0, created = 0, errors = 0;

      for (const metaTemplate of metaTemplates) {
        try {
          await this.syncSingleMetaTemplate(metaTemplate);
          
          // Check if this was an update or creation
          const existingTemplate = await Template.findOne({ metaTemplateId: metaTemplate.id });
          if (existingTemplate) {
            updated++;
          } else {
            created++;
          }
          
          synced++;
        } catch (error: any) {
          logger.error(`Failed to sync template ${metaTemplate.name}:`, error.message);
          errors++;
        }
      }

      logger.info('Meta template synchronization completed', {
        synced,
        updated,
        created,
        errors,
        total: metaTemplates.length
      });

      return { synced, updated, created, errors };
    } catch (error: any) {
      logger.error('Error during Meta template synchronization:', error.message);
      throw error;
    }
  }

  /**
   * Sync a single Meta template to our database
   */
  private async syncSingleMetaTemplate(metaTemplate: any): Promise<ITemplate> {
    try {
      const templateData = {
        name: metaTemplate.name,
        metaTemplateId: metaTemplate.id,
        metaTemplateName: metaTemplate.name,
        metaStatus: metaTemplate.status,
        metaCategory: metaTemplate.category,
        metaLanguage: metaTemplate.language,
        metaComponents: metaTemplate.components || [],
        isMetaTemplate: true,
        type: 'template' as const,
        content: this.extractContentFromMetaComponents(metaTemplate.components),
        parameters: this.extractParametersFromMetaComponents(metaTemplate.components),
        createdBy: null, // Meta templates are not created by a specific user
        isActive: metaTemplate.status === 'APPROVED',
        lastSyncedAt: new Date(),
        syncStatus: 'synced' as const
      };

      // Find existing template by Meta template ID
      const existingTemplate = await Template.findOne({ metaTemplateId: metaTemplate.id });

      if (existingTemplate) {
        // Update existing template
        Object.assign(existingTemplate, templateData);
        await existingTemplate.save();
        logger.info(`Updated Meta template: ${metaTemplate.name}`);
        return existingTemplate;
      } else {
        // Create new template
        const newTemplate = new Template(templateData);
        await newTemplate.save();
        logger.info(`Created new Meta template: ${metaTemplate.name}`);
        return newTemplate;
      }
    } catch (error: any) {
      logger.error(`Error syncing single Meta template ${metaTemplate.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract content from Meta template components
   */
  private extractContentFromMetaComponents(components: any[]): string {
    if (!components || components.length === 0) return '';

    // Find the body component for the main content
    const bodyComponent = components.find(comp => comp.type === 'BODY');
    if (bodyComponent && bodyComponent.text) {
      return bodyComponent.text;
    }

    // Fallback to first component with text
    const textComponent = components.find(comp => comp.text);
    return textComponent ? textComponent.text : '';
  }

  /**
   * Extract parameters from Meta template components
   */
  private extractParametersFromMetaComponents(components: any[]): string[] {
    if (!components || components.length === 0) return [];

    const parameters: string[] = [];
    
    // Extract parameters from all components that have text
    components.forEach(component => {
      if (component.text) {
        // Find all {{1}}, {{2}}, etc. patterns
        const matches = component.text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const paramNumber = match.replace(/[{}]/g, '');
            const paramName = `param${paramNumber}`;
            if (!parameters.includes(paramName)) {
              parameters.push(paramName);
            }
          });
        }
      }
    });

    return parameters.sort((a, b) => {
      const aNum = parseInt(a.replace('param', ''));
      const bNum = parseInt(b.replace('param', ''));
      return aNum - bNum;
    });
  }

  /**
   * Get Meta template creation URL for redirection
   */
  getMetaTemplateCreationUrl(): string {
    return whatsappConfig.getMetaTemplateCreationUrl();
  }

  /**
   * Get Meta Business Manager URL for account management
   */
  getMetaBusinessManagerUrl(): string {
    return whatsappConfig.getMetaBusinessManagerUrl();
  }

  /**
   * Get template status summary
   */
  async getTemplateStatusSummary(): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    disabled: number;
    metaTemplates: number;
    customTemplates: number;
  }> {
    try {
      const stats = await Template.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $cond: [{ $eq: ['$isMetaTemplate', true] }, 1, 0] } }, // Only count Meta templates
            approved: { $sum: { $cond: [{ $eq: ['$metaStatus', 'APPROVED'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$metaStatus', 'PENDING'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$metaStatus', 'REJECTED'] }, 1, 0] } },
            disabled: { $sum: { $cond: [{ $eq: ['$metaStatus', 'DISABLED'] }, 1, 0] } },
            metaTemplates: { $sum: { $cond: [{ $eq: ['$isMetaTemplate', true] }, 1, 0] } },
            customTemplates: { $sum: { $cond: [{ $eq: ['$isMetaTemplate', false] }, 1, 0] } }
          }
        }
      ]);

      return stats[0] || {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        disabled: 0,
        metaTemplates: 0,
        customTemplates: 0
      };
    } catch (error: any) {
      logger.error('Error getting template status summary:', error.message);
      throw error;
    }
  }
}

// Export singleton instance with error handling
let metaTemplateSyncServiceInstance: MetaTemplateSyncService | null = null;

function getMetaTemplateSyncService(): MetaTemplateSyncService {
  if (!metaTemplateSyncServiceInstance) {
    try {
      metaTemplateSyncServiceInstance = new MetaTemplateSyncService();
    } catch (error) {
      logger.error('Failed to initialize Meta Template Sync Service:', error);
      throw new Error('Meta Template Sync Service initialization failed. Please check WhatsApp Cloud API configuration.');
    }
  }
  return metaTemplateSyncServiceInstance;
}

export default getMetaTemplateSyncService();
