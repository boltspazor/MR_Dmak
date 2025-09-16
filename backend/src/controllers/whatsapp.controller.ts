import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import logger from '../utils/logger';

const whatsappService = new WhatsAppService();

export class WhatsAppController {
  // Get allowed recipients list with detailed information
  async getAllowedRecipients(req: any, res: Response) {
    try {
      logger.info('📋 Getting WhatsApp allowed recipients list');
      
      const AllowedRecipient = (await import('../models/AllowedRecipient')).default;
      
      const recipients = await AllowedRecipient.find({ isActive: true })
        .populate('addedBy', 'name email')
        .select('phoneNumber formattedPhoneNumber addedAt addedBy')
        .sort({ addedAt: -1 });

      const formattedRecipients = recipients.map(recipient => ({
        phoneNumber: recipient.phoneNumber,
        formatted: recipient.formattedPhoneNumber,
        addedDate: recipient.addedAt.toISOString(),
        addedBy: (recipient.addedBy as any)?.name || 'System'
      }));

      logger.info('✅ Retrieved allowed recipients list', { count: formattedRecipients.length });
      return res.json({
        success: true,
        recipients: formattedRecipients,
        count: formattedRecipients.length
      });
    } catch (error: any) {
      logger.error('❌ Failed to get allowed recipients', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Add single recipient to allowed list
  async addAllowedRecipient(req: any, res: Response) {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number is required' 
        });
      }

      logger.info('➕ Adding recipient to WhatsApp allowed list', { phoneNumber });
      
      const result = await whatsappService.addSingleAllowedRecipient(phoneNumber);
      
      if (result.success) {
        logger.info('✅ Added recipient to allowed list', { phoneNumber });
        return res.json({
          success: true,
          message: 'Recipient added to allowed list successfully',
          phoneNumber
        });
      } else {
        logger.error('❌ Failed to add recipient to allowed list', { phoneNumber, error: result.error });
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error: any) {
      logger.error('❌ Failed to add recipient to allowed list', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Add multiple recipients to allowed list
  async addAllowedRecipients(req: any, res: Response) {
    try {
      const { phoneNumbers } = req.body;
      
      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone numbers array is required' 
        });
      }

      logger.info('➕ Adding multiple recipients to WhatsApp allowed list', { count: phoneNumbers.length });
      
      const result = await whatsappService.addAllowedRecipients(phoneNumbers);
      
      if (result.success) {
        logger.info('✅ Added multiple recipients to allowed list', { 
          count: result.added?.length,
          added: result.added 
        });
        return res.json({
          success: true,
          message: 'Recipients added to allowed list successfully',
          added: result.added,
          count: result.added?.length || 0
        });
      } else {
        logger.error('❌ Failed to add recipients to allowed list', { error: result.error });
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error: any) {
      logger.error('❌ Failed to add recipients to allowed list', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Remove single recipient from allowed list
  async removeAllowedRecipient(req: any, res: Response) {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number is required' 
        });
      }

      logger.info('➖ Removing recipient from WhatsApp allowed list', { phoneNumber });
      
      const result = await whatsappService.removeSingleAllowedRecipient(phoneNumber);
      
      if (result.success) {
        logger.info('✅ Removed recipient from allowed list', { phoneNumber });
        return res.json({
          success: true,
          message: 'Recipient removed from allowed list successfully',
          phoneNumber
        });
      } else {
        logger.error('❌ Failed to remove recipient from allowed list', { phoneNumber, error: result.error });
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error: any) {
      logger.error('❌ Failed to remove recipient from allowed list', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Remove multiple recipients from allowed list
  async removeAllowedRecipients(req: any, res: Response) {
    try {
      const { phoneNumbers } = req.body;
      
      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone numbers array is required' 
        });
      }

      logger.info('➖ Removing multiple recipients from WhatsApp allowed list', { count: phoneNumbers.length });
      
      const result = await whatsappService.removeAllowedRecipients(phoneNumbers);
      
      if (result.success) {
        logger.info('✅ Removed multiple recipients from allowed list', { 
          count: result.removed?.length,
          removed: result.removed 
        });
        return res.json({
          success: true,
          message: 'Recipients removed from allowed list successfully',
          removed: result.removed,
          count: result.removed?.length || 0
        });
      } else {
        logger.error('❌ Failed to remove recipients from allowed list', { error: result.error });
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error: any) {
      logger.error('❌ Failed to remove recipients from allowed list', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

<<<<<<< HEAD
  // Send single message
  async sendMessage(req: any, res: Response) {
    try {
      const { to, message, type = 'text' } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number and message are required' 
        });
      }

      logger.info('📤 Sending WhatsApp message', { to, type, messageLength: message.length });
      
      const whatsappMessage = {
        to,
        type,
        text: type === 'text' ? message : undefined,
        image: type === 'image' ? { link: message } : undefined
      };

      const result = await whatsappService.sendMessage(whatsappMessage);
      
      if (result.success) {
        logger.info('✅ WhatsApp message sent successfully', { 
          to, 
=======
  // Test template message
  async testTemplateMessage(req: any, res: Response) {
    try {
      const { phoneNumber, templateName, languageCode, parameters } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number is required' 
        });
      }

      const templateNameToUse = templateName || 'hello_world';
      const languageCodeToUse = languageCode || 'en_US';

      logger.info('🧪 Testing template message', { 
        phoneNumber, 
        templateName: templateNameToUse, 
        languageCode: languageCodeToUse 
      });
      
      const templateMessage = whatsappService.createTemplateMessage(
        phoneNumber, 
        templateNameToUse, 
        languageCodeToUse, 
        parameters
      );
      
      const result = await whatsappService.sendMessage(templateMessage);
      
      if (result.success) {
        logger.info('✅ Template message sent successfully', { 
          phoneNumber, 
>>>>>>> refs/remotes/origin/main
          messageId: result.messageId 
        });
        return res.json({
          success: true,
<<<<<<< HEAD
          message: 'Message sent successfully',
          messageId: result.messageId,
          to
        });
      } else {
        logger.error('❌ Failed to send WhatsApp message', { to, error: result.error });
=======
          message: 'Template message sent successfully',
          messageId: result.messageId,
          phoneNumber,
          templateName: templateNameToUse
        });
      } else {
        logger.error('❌ Failed to send template message', { 
          phoneNumber, 
          error: result.error 
        });
>>>>>>> refs/remotes/origin/main
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error: any) {
<<<<<<< HEAD
      logger.error('❌ Failed to send WhatsApp message', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Send bulk messages
  async sendBulkMessages(req: any, res: Response) {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Messages array is required' 
        });
      }

      // Validate each message
      for (const message of messages) {
        if (!message.to || !message.message) {
          return res.status(400).json({ 
            success: false, 
            error: 'Each message must have "to" and "message" fields' 
          });
        }
      }

      logger.info('📤 Sending bulk WhatsApp messages', { count: messages.length });
      
      const whatsappMessages = messages.map(msg => ({
        to: msg.to,
        type: msg.type || 'text',
        text: msg.type === 'text' || !msg.type ? msg.message : undefined,
        image: msg.type === 'image' ? { link: msg.message } : undefined
      }));

      const results = await whatsappService.sendBulkMessages(whatsappMessages);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      logger.info('✅ Bulk WhatsApp messages completed', { 
        total: messages.length,
        success: successCount,
        failed: failureCount
      });

      return res.json({
        success: true,
        message: `Bulk messages processed: ${successCount} sent, ${failureCount} failed`,
        results,
        summary: {
          total: messages.length,
          success: successCount,
          failed: failureCount
        }
      });
    } catch (error: any) {
      logger.error('❌ Failed to send bulk WhatsApp messages', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Send message to all allowed recipients
  async sendMessageToAllRecipients(req: any, res: Response) {
    try {
      const { message, type = 'text' } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message is required' 
        });
      }

      logger.info('📤 Sending WhatsApp message to all allowed recipients', { type, messageLength: message.length });
      
      // Get all allowed recipients
      const AllowedRecipient = (await import('../models/AllowedRecipient')).default;
      const recipients = await AllowedRecipient.find({ isActive: true }).select('phoneNumber');
      
      if (recipients.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No allowed recipients found' 
        });
      }

      // Create messages for all recipients
      const whatsappMessages = recipients.map(recipient => ({
        to: recipient.phoneNumber,
        type,
        text: type === 'text' ? message : undefined,
        image: type === 'image' ? { link: message } : undefined
      }));

      const results = await whatsappService.sendBulkMessages(whatsappMessages);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      logger.info('✅ Message sent to all allowed recipients', { 
        total: recipients.length,
        success: successCount,
        failed: failureCount
      });

      return res.json({
        success: true,
        message: `Message sent to all recipients: ${successCount} sent, ${failureCount} failed`,
        results,
        summary: {
          total: recipients.length,
          success: successCount,
          failed: failureCount
        }
      });
    } catch (error: any) {
      logger.error('❌ Failed to send message to all recipients', { error: error.message });
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Test WhatsApp connection
  async testConnection(req: any, res: Response) {
    try {
      logger.info('🔍 Testing WhatsApp connection');
      
      // Try to get allowed recipients to test the connection
      const result = await whatsappService.getAllowedRecipients();
      
      if (result.success) {
        logger.info('✅ WhatsApp connection test successful');
        return res.json({
          success: true,
          message: 'WhatsApp connection is working',
          recipientsCount: result.recipients?.length || 0
        });
      } else {
        logger.error('❌ WhatsApp connection test failed', { error: result.error });
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error: any) {
      logger.error('❌ WhatsApp connection test failed', { error: error.message });
=======
      logger.error('❌ Failed to send template message', { error: error.message });
>>>>>>> refs/remotes/origin/main
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}
