import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { schemas } from '../utils/validation';
import path from 'path';
import logger from '../utils/logger';

const messageService = new MessageService();

export class MessageController {
  async sendMessage(req: any, res: Response) {
    try {
      const { error, value } = schemas.message.send.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const result = await messageService.sendBulkMessage(value, req.user.userId);
      return res.json({
        message: 'Message campaign created successfully',
        ...result
      });
    } catch (error: any) {
      logger.error('Failed to send message', { error: error.message, body: req.body });
      return res.status(500).json({ error: error.message });
    }
  }

  async getCampaignReport(req: Request, res: Response) {
    try {
      const { campaignId } = req.params;
      const report = await messageService.getCampaignReport(campaignId);
      return res.json(report);
    } catch (error: any) {
      logger.error('Failed to get campaign report', { 
        error: error.message, 
        campaignId: req.params.campaignId 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  async getAllCampaigns(req: any, res: Response) {
    try {
      const { limit = 50, offset = 0, search, status, dateFrom, dateTo } = req.query;
      const campaigns = await messageService.getAllCampaigns({
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        status,
        dateFrom,
        dateTo,
        userId: req.user.userId // Filter campaigns by user
      });
      return res.json(campaigns);
    } catch (error: any) {
      logger.error('Failed to get campaigns', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getCampaignStats(req: any, res: Response) {
    try {
      const stats = await messageService.getCampaignStats(req.user.userId);
      return res.json(stats);
    } catch (error: any) {
      logger.error('Failed to get campaign stats', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async createCampaign(req: any, res: Response) {
    try {
      logger.info('🚀 Campaign creation started', {
        body: req.body,
        files: req.files,
        user: req.user?.userId
      });

      const { name, templateId, recipientListId, type, content, targetMrs } = req.body;
      
      logger.info('📝 Extracted campaign data', {
        name,
        templateId,
        recipientListId,
        type,
        content: content ? content.substring(0, 100) + '...' : null,
        targetMrs: targetMrs ? targetMrs.substring(0, 100) + '...' : null
      });

      // Validate required fields based on campaign type
      if (!name) {
        logger.warn('❌ Campaign name validation failed');
        return res.status(400).json({ 
          error: 'Campaign name is required' 
        });
      }

      logger.info('✅ Campaign name validation passed');

      let campaignData: any = {
        name,
        type: type || 'with-template'
      };

      logger.info('📋 Campaign type determined', { type: campaignData.type });

      if (type === 'with-template') {
        logger.info('📄 Processing template-based campaign');
        if (!templateId || !recipientListId) {
          logger.warn('❌ Template-based campaign validation failed', { templateId, recipientListId });
          return res.status(400).json({ 
            error: 'Template ID and Recipient List ID are required for template-based campaigns' 
          });
        }
        campaignData.templateId = templateId;
        campaignData.recipientListId = recipientListId;
        logger.info('✅ Template-based campaign data prepared');
      } else if (type === 'custom-messages') {
        logger.info('💬 Processing custom message campaign');
        if (!content || !targetMrs) {
          logger.warn('❌ Custom message campaign validation failed', { hasContent: !!content, hasTargetMrs: !!targetMrs });
          return res.status(400).json({ 
            error: 'Content and target MRs are required for custom message campaigns' 
          });
        }
        campaignData.content = content;
        
        logger.info('🔄 Parsing targetMrs', { targetMrs: targetMrs.substring(0, 200) + '...' });
        const parsedTargetMrs = JSON.parse(targetMrs);
        // Handle both array of strings (MR IDs) and array of objects (with mrId property)
        campaignData.targetMrs = Array.isArray(parsedTargetMrs) ? 
          parsedTargetMrs.map(mr => typeof mr === 'string' ? { mrId: mr } : mr) : 
          [];
        
        logger.info('✅ TargetMrs parsed successfully', { 
          count: campaignData.targetMrs.length,
          sample: campaignData.targetMrs.slice(0, 2)
        });
        
        // Handle image uploads for custom messages
        if (req.files && req.files.length > 0) {
          logger.info('🖼️ Processing image uploads', { fileCount: req.files.length });
          const imageFile = req.files.find((file: any) => file.fieldname === 'image');
          if (imageFile) {
            campaignData.imageUrl = `/uploads/${imageFile.filename}`;
            logger.info('✅ Image uploaded successfully', { imageUrl: campaignData.imageUrl });
          }
        } else {
          logger.info('📷 No image files uploaded');
        }
      }

      logger.info('🎯 Final campaign data prepared', {
        type: campaignData.type,
        hasContent: !!campaignData.content,
        hasImageUrl: !!campaignData.imageUrl,
        targetMrsCount: campaignData.targetMrs?.length || 0,
        hasTemplateId: !!campaignData.templateId,
        hasRecipientListId: !!campaignData.recipientListId
      });

      logger.info('🚀 Calling messageService.createCampaign', { userId: req.user.userId });
      const result = await messageService.createCampaign(campaignData, req.user.userId);
      
      logger.info('✅ Campaign created successfully', { result });

      return res.json({
        message: 'Campaign created successfully',
        ...result
      });
    } catch (error: any) {
      logger.error('❌ Failed to create campaign', { 
        error: error.message, 
        stack: error.stack,
        body: req.body,
        files: req.files 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  async uploadImage(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
      }

      // For production, we need to return the full URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mrbackend-production-2ce3.up.railway.app'
        : 'http://localhost:5001';
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      return res.json({ 
        message: 'Image uploaded successfully',
        imageUrl 
      });
    } catch (error: any) {
      logger.error('Failed to upload image', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }
}