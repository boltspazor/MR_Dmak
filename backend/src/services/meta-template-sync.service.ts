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
          templates: templates.map((t: any) => ({ name: t.name, status: t.status }))
        });
        
        // Log detailed structure of templates with IMAGE components for debugging
        templates.forEach((template: any) => {
          if (template.components?.some((comp: any) => comp.type === 'HEADER' && comp.format === 'IMAGE')) {
            logger.info(`Template with IMAGE header found: ${template.name}`, {
              templateId: template.id,
              components: template.components,
              fullTemplate: JSON.stringify(template, null, 2)
            });
          }
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
      // Fetch detailed template information including media handles
      let detailedTemplate = metaTemplate;
      try {
        detailedTemplate = await this.fetchDetailedTemplateInfo(metaTemplate.id);
        logger.info(`Fetched detailed template info for ${metaTemplate.name}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to fetch detailed template info for ${metaTemplate.name}:`, errorMsg);
        // Continue with basic template info
      }

      // Extract image information from components (now with detailed info)
      const imageInfo = await this.extractImageFromMetaComponents(detailedTemplate.components);

      const templateData = {
        name: metaTemplate.name,
        metaTemplateId: metaTemplate.id,
        metaTemplateName: metaTemplate.name,
        metaStatus: metaTemplate.status,
        metaCategory: metaTemplate.category,
        metaLanguage: metaTemplate.language,
        metaComponents: detailedTemplate.components || metaTemplate.components || [],
        isMetaTemplate: true,
        type: 'template' as const,
        content: this.extractContentFromMetaComponents(detailedTemplate.components || metaTemplate.components),
        parameters: this.extractParametersFromMetaComponents(detailedTemplate.components || metaTemplate.components),
        createdBy: null as any, // Meta templates are not created by a specific user
        isActive: metaTemplate.status === 'APPROVED',
        lastSyncedAt: new Date(),
        syncStatus: 'synced' as const,
        // Add image information if present
        ...imageInfo
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
      logger.error(`Error syncing single Meta template ${metaTemplate.name}:`, {
        error: error.message,
        stack: error.stack,
        fullError: error
      });
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
   * Extract image URL from Meta template components
   */
  private async extractImageFromMetaComponents(components: any[]): Promise<{ imageUrl?: string; imageFileName?: string }> {
    if (!components || components.length === 0) return {};

    // Find the header component with IMAGE format
    const headerComponent = components.find(comp => 
      comp.type === 'HEADER' && comp.format === 'IMAGE'
    );

    if (headerComponent) {
      logger.info('Found IMAGE header component:', {
        componentId: headerComponent._id,
        hasExample: !!headerComponent.example,
        hasHeaderHandle: !!headerComponent.example?.header_handle,
        fullComponent: JSON.stringify(headerComponent, null, 2)
      });

      // Check different possible structures for media handle
      let mediaHandle = null;
      
      if (headerComponent.example?.header_handle?.[0]?.handle) {
        mediaHandle = headerComponent.example.header_handle[0].handle;
      } else if (headerComponent.example?.header_handle) {
        mediaHandle = headerComponent.example.header_handle;
      } else if (headerComponent.example?.handle) {
        mediaHandle = headerComponent.example.handle;
      } else if (headerComponent.handle) {
        mediaHandle = headerComponent.handle;
      }

      if (mediaHandle) {
        // For Meta templates, the header_handle is already the actual image URL
        // Handle both array and string formats
        let imageUrl = mediaHandle;
        if (Array.isArray(mediaHandle)) {
          imageUrl = mediaHandle[0]; // Take the first URL if it's an array
        }
        
        logger.info(`Found Meta image URL: ${imageUrl}`);
        return {
          imageUrl: imageUrl,
          imageFileName: `template-header-${headerComponent._id || 'image'}.jpg`
        };
      } else {
        logger.warn(`No media handle found in IMAGE header component:`, headerComponent);
        // Fallback to placeholder
        return {
          imageUrl: `meta://template/header-image/${headerComponent._id || 'unknown'}`,
          imageFileName: `template-header-image.jpg`
        };
      }
    }

    return {};
  }

  /**
   * Fetch detailed template information including media handles
   */
  private async fetchDetailedTemplateInfo(templateId: string): Promise<any> {
    try {
      const headers = this.getHeaders();
      if (!headers.Authorization) {
        throw new Error('WhatsApp Cloud API access token not configured');
      }

      // Fetch detailed template information
      const response = await axios.get(
        `${this.graphAPIBaseURL}/${templateId}`,
        { headers }
      );

      if (response.data) {
        logger.info(`Fetched detailed template info for ${templateId}:`, {
          hasComponents: !!response.data.components,
          componentCount: response.data.components?.length || 0,
          hasImageComponents: response.data.components?.some((comp: any) => 
            comp.type === 'HEADER' && comp.format === 'IMAGE'
          ) || false
        });
        return response.data;
      }

      throw new Error('No template data found in response');
    } catch (error: any) {
      logger.error(`Error fetching detailed template info for ${templateId}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }


  /**
   * Extract parameters from Meta template components and categorize them by type
   */
  private extractParametersFromMetaComponents(components: any[]): Array<{name: string, type: 'text' | 'number'}> {
    if (!components || components.length === 0) return [];

    const parameters: Array<{name: string, type: 'text' | 'number'}> = [];
    
    // Extract parameters from all components that have text
    components.forEach(component => {
      if (component.text) {
        // Find all {{parameter}} patterns (both named and numbered)
        const matches = component.text.match(/\{\{([A-Za-z0-9_]+)\}\}/g);
        if (matches) {
          matches.forEach((match: any) => {
            const paramName = match.replace(/[{}]/g, '');
            
            // Check if parameter already exists (case-insensitive)
            const existingParam = parameters.find(p => p.name.toLowerCase() === paramName.toLowerCase());
            if (!existingParam) {
              parameters.push({ name: paramName, type: 'text' }); // Preserve original casing from Meta template
            }
          });
        }
      }
    });

    // Sort parameters by their order of appearance in the template content
    return parameters.sort((a, b) => {
      // Find the first occurrence of each parameter in the template content
      const templateContent = components.find(c => c.text)?.text || '';
      const aIndex = templateContent.indexOf(`{{${a.name}}}`);
      const bIndex = templateContent.indexOf(`{{${b.name}}}`);
      
      // If both parameters are found in the content, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one is found, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is found, sort alphabetically
      return a.name.localeCompare(b.name);
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
   * Delete a template from Meta WhatsApp Business Platform
   * Based on official Meta API documentation for template deletion
   */
  async deleteMetaTemplate(templateName: string): Promise<{ success: boolean; message: string }> {
    try {
      const headers = this.getHeaders();
      if (!headers.Authorization) {
        throw new Error('WhatsApp Cloud API access token not configured');
      }

      logger.info(`Attempting to delete Meta template: ${templateName}`);

      // First, check if template exists in Meta API
      const checkUrl = `${this.graphAPIBaseURL}/${this.businessAccountId}/message_templates?name=${templateName}`;
      const checkResponse = await axios.get(checkUrl, { headers });

      if (!checkResponse.data.data || checkResponse.data.data.length === 0) {
        return {
          success: false,
          message: `Template '${templateName}' not found in Meta WhatsApp Business Platform`
        };
      }

      const template = checkResponse.data.data[0];
      logger.info(`Found template in Meta API:`, { 
        id: template.id, 
        name: template.name, 
        status: template.status 
      });

      // Use the correct Meta API endpoint for template deletion
      // Based on Postman documentation: DELETE /{whatsapp-business-account-id}/message_templates
      const deleteUrl = `${this.graphAPIBaseURL}/${this.businessAccountId}/message_templates`;
      
      try {
        // Delete by template name as per Meta API documentation
        const deleteResponse = await axios.delete(deleteUrl, { 
          headers,
          data: {
            name: templateName
          }
        });
        
        logger.info(`Template deleted from Meta API:`, { 
          templateId: template.id, 
          templateName: template.name,
          response: deleteResponse.data 
        });

        // Verify deletion by checking if template still exists
        const verifyResponse = await axios.get(checkUrl, { headers });
        const stillExists = verifyResponse.data.data && verifyResponse.data.data.length > 0;

        if (stillExists) {
          return {
            success: false,
            message: `Template '${templateName}' was not successfully deleted from Meta API`
          };
        }

        return {
          success: true,
          message: `Template '${templateName}' successfully deleted from Meta WhatsApp Business Platform`
        };
      } catch (deleteError: any) {
        logger.error(`Meta API deletion error for '${templateName}':`, {
          status: deleteError.response?.status,
          error: deleteError.response?.data,
          templateId: template.id
        });

        // Handle specific Meta API errors
        if (deleteError.response?.status === 400) {
          const errorData = deleteError.response?.data?.error;
          if (errorData?.message?.includes('Unsupported delete request')) {
            return {
              success: true, // Consider as success since we can't delete from Meta API
              message: `Template '${templateName}' cannot be deleted from Meta API (not supported), but will be removed from local database`
            };
          } else if (errorData?.message?.includes('Template not found')) {
            return {
              success: true, // Template already deleted or doesn't exist
              message: `Template '${templateName}' was already deleted or not found in Meta API`
            };
          }
        }
        
        // Re-throw other errors
        throw deleteError;
      }

    } catch (error: any) {
      logger.error(`Error deleting Meta template '${templateName}':`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.status === 404) {
        return {
          success: true, // Consider 404 as success since template is already deleted
          message: `Template '${templateName}' was already deleted or not found in Meta API`
        };
      }

      return {
        success: false,
        message: `Failed to delete template '${templateName}' from Meta API: ${error.message}`
      };
    }
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
