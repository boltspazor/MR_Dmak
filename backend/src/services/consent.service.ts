import Consent, { IConsent } from '../models/consent.model';
import crypto from 'crypto';

export interface ConsentData {
  phone_e164: string;
  consented: boolean;
  categories: string[];
  channel: string;
  method: string;
  consent_text_version: string;
  ip_address?: string;
  device_fingerprint?: string;
  evidence?: {
    form_submission_id?: string;
    screenshot_url?: string;
    user_agent?: string;
    referrer?: string;
    session_id?: string;
  };
  business_name_shown: string;
  captured_by: string;
  data_processing_policy_version: string;
}

export interface OptOutData {
  phone_e164: string;
  reason?: string;
  method: string;
}

export class ConsentService {
  /**
   * Hash IP address for privacy compliance
   */
  private hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  /**
   * Validate E.164 phone number format
   */
  private validateE164(phone: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Create or update consent record
   */
  async createOrUpdateConsent(consentData: ConsentData): Promise<{ success: boolean; consent?: IConsent; message: string }> {
    try {
      // Validate phone number format
      if (!this.validateE164(consentData.phone_e164)) {
        return {
          success: false,
          message: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)'
        };
      }

      // Hash IP address if provided
      let ip_hash: string | undefined;
      if (consentData.ip_address) {
        ip_hash = this.hashIP(consentData.ip_address);
      }

      // Prepare consent data
      const consentRecord = {
        phone_e164: consentData.phone_e164,
        consented: consentData.consented,
        categories: consentData.categories,
        channel: consentData.channel,
        method: consentData.method,
        consent_text_version: consentData.consent_text_version,
        timestamp_iso: new Date(),
        ip_hash,
        device_fingerprint: consentData.device_fingerprint,
        evidence: consentData.evidence,
        business_name_shown: consentData.business_name_shown,
        captured_by: consentData.captured_by,
        data_processing_policy_version: consentData.data_processing_policy_version,
        opt_out: {
          status: false
        }
      };

      // Use upsert to create or update consent
      const consent = await Consent.findOneAndUpdate(
        { phone_e164: consentData.phone_e164 },
        consentRecord,
        { 
          upsert: true, 
          new: true, 
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      return {
        success: true,
        consent,
        message: 'Consent recorded successfully'
      };

    } catch (error) {
      console.error('Error creating/updating consent:', error);
      return {
        success: false,
        message: 'Failed to record consent'
      };
    }
  }

  /**
   * Get consent status for a phone number
   */
  async getConsentStatus(phone_e164: string): Promise<{ success: boolean; consent?: IConsent; message: string }> {
    try {
      if (!this.validateE164(phone_e164)) {
        return {
          success: false,
          message: 'Invalid phone number format'
        };
      }

      const consent = await Consent.findOne({ phone_e164 });
      
      if (!consent) {
        return {
          success: true,
          message: 'No consent record found'
        };
      }

      return {
        success: true,
        consent,
        message: 'Consent status retrieved successfully'
      };

    } catch (error) {
      console.error('Error retrieving consent status:', error);
      return {
        success: false,
        message: 'Failed to retrieve consent status'
      };
    }
  }

  /**
   * Process opt-out request
   */
  async processOptOut(optOutData: OptOutData): Promise<{ success: boolean; consent?: IConsent; message: string }> {
    try {
      if (!this.validateE164(optOutData.phone_e164)) {
        return {
          success: false,
          message: 'Invalid phone number format'
        };
      }

      const consent = await Consent.findOneAndUpdate(
        { phone_e164: optOutData.phone_e164 },
        {
          'opt_out.status': true,
          'opt_out.timestamp': new Date(),
          'opt_out.reason': optOutData.reason,
          'opt_out.method': optOutData.method,
          consented: false // Revoke consent when opting out
        },
        { new: true, runValidators: true }
      );

      if (!consent) {
        return {
          success: false,
          message: 'No consent record found for this phone number'
        };
      }

      return {
        success: true,
        consent,
        message: 'Opt-out processed successfully'
      };

    } catch (error) {
      console.error('Error processing opt-out:', error);
      return {
        success: false,
        message: 'Failed to process opt-out'
      };
    }
  }

  /**
   * Get all consents with pagination
   */
  async getAllConsents(page: number = 1, limit: number = 10, filter?: any): Promise<{ success: boolean; consents?: IConsent[]; total?: number; message: string }> {
    try {
      const skip = (page - 1) * limit;
      const query = filter || {};

      const [consents, total] = await Promise.all([
        Consent.find(query)
          .sort({ timestamp_iso: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Consent.countDocuments(query)
      ]);

      return {
        success: true,
        consents,
        total,
        message: 'Consents retrieved successfully'
      };

    } catch (error) {
      console.error('Error retrieving consents:', error);
      return {
        success: false,
        message: 'Failed to retrieve consents'
      };
    }
  }

  /**
   * Delete consent record (for data privacy compliance)
   */
  async deleteConsent(phone_e164: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validateE164(phone_e164)) {
        return {
          success: false,
          message: 'Invalid phone number format'
        };
      }

      const result = await Consent.deleteOne({ phone_e164 });

      if (result.deletedCount === 0) {
        return {
          success: false,
          message: 'No consent record found for this phone number'
        };
      }

      return {
        success: true,
        message: 'Consent record deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting consent:', error);
      return {
        success: false,
        message: 'Failed to delete consent record'
      };
    }
  }

  /**
   * Get consent statistics
   */
  async getConsentStats(): Promise<{ success: boolean; stats?: any; message: string }> {
    try {
      const stats = await Consent.aggregate([
        {
          $group: {
            _id: null,
            totalConsents: { $sum: 1 },
            activeConsents: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$consented', true] }, { $ne: ['$opt_out.status', true] }] },
                  1,
                  0
                ]
              }
            },
            optOuts: {
              $sum: {
                $cond: [{ $eq: ['$opt_out.status', true] }, 1, 0]
              }
            },
            byChannel: {
              $push: {
                channel: '$channel',
                consented: '$consented',
                optOut: '$opt_out.status'
              }
            }
          }
        },
        {
          $project: {
            totalConsents: 1,
            activeConsents: 1,
            optOuts: 1,
            optOutRate: {
              $cond: [
                { $gt: ['$totalConsents', 0] },
                { $multiply: [{ $divide: ['$optOuts', '$totalConsents'] }, 100] },
                0
              ]
            },
            channelBreakdown: {
              $reduce: {
                input: '$byChannel',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [
                          {
                            k: '$$this.channel',
                            v: {
                              $add: [
                                { $ifNull: [{ $getField: { field: '$$this.channel', input: '$$value' } }, 0] },
                                1
                              ]
                            }
                          }
                        ]
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      return {
        success: true,
        stats: stats[0] || {
          totalConsents: 0,
          activeConsents: 0,
          optOuts: 0,
          optOutRate: 0,
          channelBreakdown: {}
        },
        message: 'Consent statistics retrieved successfully'
      };

    } catch (error) {
      console.error('Error retrieving consent statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve consent statistics'
      };
    }
  }
}

export default new ConsentService();
