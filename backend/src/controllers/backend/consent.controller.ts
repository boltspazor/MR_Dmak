import { Request, Response } from 'express';
import consentService, { ConsentData, OptOutData } from '../../services/consent.service';
import logger from '../../utils/logger';

export class ConsentController {
  /**
   * Create or update consent record
   */
  async createConsent(req: Request, res: Response): Promise<void> {
    try {
      const consentData: ConsentData = {
        phone_e164: req.body.phone_e164,
        consented: req.body.consented,
        categories: req.body.categories,
        channel: req.body.channel,
        method: req.body.method,
        consent_text_version: req.body.consent_text_version || '1.0',
        ip_address: req.ip || req.connection.remoteAddress,
        device_fingerprint: req.body.device_fingerprint,
        evidence: {
          form_submission_id: req.body.evidence?.form_submission_id,
          screenshot_url: req.body.evidence?.screenshot_url,
          user_agent: req.get('User-Agent'),
          referrer: req.get('Referer'),
          session_id: req.body.evidence?.session_id
        },
        business_name_shown: req.body.business_name_shown,
        captured_by: req.body.captured_by || 'user',
        data_processing_policy_version: req.body.data_processing_policy_version || '1.0'
      };

      const result = await consentService.createOrUpdateConsent(consentData);

      if (result.success) {
        logger.info('Consent created/updated successfully', {
          phone_e164: consentData.phone_e164,
          consented: consentData.consented,
          channel: consentData.channel,
          method: consentData.method,
          business_name: consentData.business_name_shown
        });

        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            phone_e164: result.consent?.phone_e164,
            consented: result.consent?.consented,
            timestamp: result.consent?.timestamp_iso,
            consent_id: result.consent?._id
          }
        });
      } else {
        logger.warn('Failed to create/update consent', {
          phone_e164: consentData.phone_e164,
          error: result.message
        });

        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      logger.error('Error in createConsent controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get consent status for a phone number
   */
  async getConsentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { phone_e164 } = req.params;

      const result = await consentService.getConsentStatus(phone_e164);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.consent ? {
            phone_e164: result.consent.phone_e164,
            consented: result.consent.consented,
            categories: result.consent.categories,
            channel: result.consent.channel,
            method: result.consent.method,
            consent_text_version: result.consent.consent_text_version,
            timestamp: result.consent.timestamp_iso,
            opt_out: result.consent.opt_out,
            business_name_shown: result.consent.business_name_shown,
            data_processing_policy_version: result.consent.data_processing_policy_version
          } : null
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      logger.error('Error in getConsentStatus controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Process opt-out request
   */
  async processOptOut(req: Request, res: Response): Promise<void> {
    try {
      const optOutData: OptOutData = {
        phone_e164: req.body.phone_e164,
        reason: req.body.reason,
        method: req.body.method
      };

      const result = await consentService.processOptOut(optOutData);

      if (result.success) {
        logger.info('Opt-out processed successfully', {
          phone_e164: optOutData.phone_e164,
          reason: optOutData.reason,
          method: optOutData.method
        });

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            phone_e164: result.consent?.phone_e164,
            opt_out: result.consent?.opt_out,
            timestamp: result.consent?.updatedAt
          }
        });
      } else {
        logger.warn('Failed to process opt-out', {
          phone_e164: optOutData.phone_e164,
          error: result.message
        });

        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      logger.error('Error in processOptOut controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all consents with pagination and filtering
   */
  async getAllConsents(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Build filter object
      const filter: any = {};
      if (req.query.consented !== undefined) {
        filter.consented = req.query.consented === 'true';
      }
      if (req.query.channel) {
        filter.channel = req.query.channel;
      }
      if (req.query.business_name) {
        filter.business_name_shown = new RegExp(req.query.business_name as string, 'i');
      }
      if (req.query.date_from || req.query.date_to) {
        filter.timestamp_iso = {};
        if (req.query.date_from) {
          filter.timestamp_iso.$gte = new Date(req.query.date_from as string);
        }
        if (req.query.date_to) {
          filter.timestamp_iso.$lte = new Date(req.query.date_to as string);
        }
      }

      const result = await consentService.getAllConsents(page, limit, filter);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            consents: result.consents,
            pagination: {
              page,
              limit,
              total: result.total,
              pages: Math.ceil((result.total || 0) / limit)
            }
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      logger.error('Error in getAllConsents controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete consent record
   */
  async deleteConsent(req: Request, res: Response): Promise<void> {
    try {
      const { phone_e164 } = req.params;

      const result = await consentService.deleteConsent(phone_e164);

      if (result.success) {
        logger.info('Consent deleted successfully', {
          phone_e164,
          deletedBy: (req as any).user?.email || 'system'
        });

        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      logger.error('Error in deleteConsent controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get consent statistics
   */
  async getConsentStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await consentService.getConsentStats();

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.stats
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      logger.error('Error in getConsentStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Health check for consent service
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Consent service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      logger.error('Error in consent health check:', error);
      res.status(500).json({
        success: false,
        message: 'Consent service is unhealthy'
      });
    }
  }
}

export default new ConsentController();
