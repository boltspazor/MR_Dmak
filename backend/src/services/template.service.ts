import Template, { ITemplate } from '../models/Template';
import logger from '../utils/logger';

export class TemplateService {
  // Process template content with parameters
  async processTemplate(templateId: string, parameters: Record<string, string>): Promise<string> {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      let processedContent = template.content;

      // Replace parameters in the content
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `#${key}`;
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
      }

      // Check if all required parameters are provided
      const remainingPlaceholders = processedContent.match(/#[A-Za-z0-9_]+/g);
      if (remainingPlaceholders && remainingPlaceholders.length > 0) {
        logger.warn('Template processing incomplete', {
          templateId,
          missingParameters: remainingPlaceholders
        });
      }

      return processedContent;
    } catch (error) {
      logger.error('Error processing template:', { templateId, error });
      throw error;

      
    }
  }

  // Validate template parameters against recipient data
  async validateTemplateParameters(templateId: string, recipientData: Record<string, any>): Promise<{
    isValid: boolean;
    missingParameters: string[];
    extraParameters: string[];
  }> {
    try {
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }

      const templateParams = template.parameters;
      const recipientParams = Object.keys(recipientData);
      
      const missingParameters = templateParams.filter(param => !recipientParams.includes(param));
      const extraParameters = recipientParams.filter(param => !templateParams.includes(param));

      return {
        isValid: missingParameters.length === 0,
        missingParameters,
        extraParameters
      };
    } catch (error) {
      logger.error('Error validating template parameters:', { templateId, error });
      throw error;
    }
  }

  // Get template usage statistics
  async getTemplateUsageStats(templateId: string, userId: string) {
    try {
      const template = await Template.findOne({ 
        _id: templateId, 
        createdBy: userId,
        isActive: true 
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // This would typically query campaign data to get usage stats
      // For now, return basic template info
      return {
        templateId: template._id,
        name: template.name,
        type: template.type,
        parameters: template.parameters,
        createdAt: template.createdAt,
        // TODO: Add actual usage statistics from campaigns
        usageCount: 0,
        lastUsed: null
      };
    } catch (error) {
      logger.error('Error getting template usage stats:', { templateId, error });
      throw error;
    }
  }

  // Search templates by content or parameters
  async searchTemplates(userId: string, searchQuery: string) {
    try {
      const templates = await Template.find({
        createdBy: userId,
        isActive: true,
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { content: { $regex: searchQuery, $options: 'i' } },
          { parameters: { $in: [new RegExp(searchQuery, 'i')] } }
        ]
      }).populate('createdBy', 'name email');

      return templates;
    } catch (error) {
      logger.error('Error searching templates:', { userId, searchQuery, error });
      throw error;
    }
  }

  // Duplicate a template
  async duplicateTemplate(templateId: string, userId: string, newName: string) {
    try {
      const originalTemplate = await Template.findOne({
        _id: templateId,
        createdBy: userId,
        isActive: true
      });

      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      // Check if new name already exists
      const existingTemplate = await Template.findOne({
        name: newName,
        createdBy: userId,
        isActive: true
      });

      if (existingTemplate) {
        throw new Error('Template name already exists');
      }

      const duplicatedTemplate = await Template.create({
        name: newName,
        content: originalTemplate.content,
        type: originalTemplate.type,
        imageUrl: originalTemplate.imageUrl,
        parameters: originalTemplate.parameters,
        createdBy: userId
      });

      logger.info('Template duplicated successfully', {
        originalTemplateId: templateId,
        newTemplateId: duplicatedTemplate._id,
        duplicatedBy: userId
      });

      return duplicatedTemplate;
    } catch (error) {
      logger.error('Error duplicating template:', { templateId, error });
      throw error;
    }
  }

  // Get templates by type
  async getTemplatesByType(userId: string, type: 'html' | 'text' | 'image') {
    try {
      const templates = await Template.find({
        createdBy: userId,
        isActive: true,
        type: type
      }).populate('createdBy', 'name email');

      return templates;
    } catch (error) {
      logger.error('Error getting templates by type:', { userId, type, error });
      throw error;
    }
  }

  // Bulk delete templates
  async bulkDeleteTemplates(templateIds: string[], userId: string) {
    try {
      const result = await Template.updateMany(
        {
          _id: { $in: templateIds },
          createdBy: userId,
          isActive: true
        },
        { isActive: false }
      );

      logger.info('Templates bulk deleted successfully', {
        templateIds,
        deletedCount: result.modifiedCount,
        deletedBy: userId
      });

      return {
        success: true,
        deletedCount: result.modifiedCount
      };
    } catch (error) {
      logger.error('Error bulk deleting templates:', { templateIds, error });
      throw error;
    }
  }
}
