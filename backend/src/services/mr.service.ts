import MedicalRepresentative from '../models/MedicalRepresentative';
import Group from '../models/Group';
import { CreateMRForm, UpdateMRForm } from '../types/mongodb';
import logger from '../utils/logger';
import whatsappCloudAPIService from './whatsapp-cloud-api.service';
import consentService from './consent.service';

export class MRService {
  constructor() {
    // WhatsApp Cloud API service is imported as singleton
  }

  /**
   * Determine consent status based on consent data
   */
  private determineConsentStatus(consent: any): 'pending' | 'approved' | 'rejected' | 'not_requested' {
    if (!consent) {
      return 'not_requested';
    }

    // Check if user has opted out
    if (consent.opt_out && consent.opt_out.status) {
      return 'rejected';
    }

    // Check if user has consented
    if (consent.consented) {
      return 'approved';
    }

    // If consent record exists but not consented and not opted out
    return 'pending';
  }

  /**
   * Format phone number to E.164 format for consent lookup
   */
  private formatPhoneForConsent(phone: string): string {
    // Remove any non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  async createMR(data: CreateMRForm, userId: string) {
    try {
      // Handle case where no group is provided - create or find default group
      let groupId = data.groupId;
      if (!groupId || groupId.trim() === '') {
        // Find or create a default group for this user
        let defaultGroup = await Group.findOne({
          groupName: 'Default Group',
          createdBy: userId
        });

        if (!defaultGroup) {
          defaultGroup = await Group.create({
            groupName: 'Default Group',
            description: 'Default group for MRs without specified group',
            createdBy: userId
          });
          logger.info('Created default group for user', { userId, groupId: defaultGroup._id });
        }
        
        groupId = (defaultGroup._id as any).toString();
      }

      // Check if MR ID already exists in the same group
      const existingMR = await MedicalRepresentative.findOne({
        mrId: data.mrId,
        groupId: groupId,
      });

      if (existingMR) {
        throw new Error('MR with this ID already exists in the group');
      }

      const mr = await MedicalRepresentative.create({
        mrId: data.mrId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        groupId: groupId,
        comments: data.comments,
        marketingManagerId: userId,
      });

      const populatedMR = await MedicalRepresentative.findById(mr._id)
        .populate('groupId', 'groupName description');

      // Automatically add phone number to WhatsApp allowed recipients list
      try {
        // Note: WhatsApp Cloud API doesn't require pre-approved recipient lists
        // Messages can be sent to any valid WhatsApp number
        if (data.phone) {
          logger.info('📱 MR phone number will be available for WhatsApp messaging', { phone: data.phone });
        }
      } catch (whatsappError) {
        // Don't fail MR creation if WhatsApp addition fails
        logger.warn('⚠️ WhatsApp allowed list update failed for MR creation', { 
          phone: data.phone, 
          error: whatsappError 
        });
      }

      logger.info('MR created successfully', { mrId: (mr as any)._id, userId });
      return populatedMR;
    } catch (error) {
      logger.error('Failed to create MR', { data, userId, error });
      throw error;
    }
  }

  async updateMR(id: string, data: UpdateMRForm, userId: string) {
    try {
      const mr = await MedicalRepresentative.findById(id);
      if (!mr) {
        throw new Error('MR not found');
      }

      // Check if MR ID already exists in the same group if mrId is being updated
      if (data.mrId && data.mrId !== mr.mrId) {
        const existingMR = await MedicalRepresentative.findOne({
          mrId: data.mrId,
          groupId: data.groupId || mr.groupId,
          _id: { $ne: id }
        });

        if (existingMR) {
          throw new Error('MR with this ID already exists in the group');
        }
      }

      const updatedMR = await MedicalRepresentative.findByIdAndUpdate(
        id,
        data,
        { new: true }
      ).populate('groupId', 'groupName description');

      logger.info('MR updated successfully', { mrId: id, userId });
      return updatedMR;
    } catch (error) {
      logger.error('Failed to update MR', { id, data, userId, error });
      throw error;
    }
  }

  async deleteMR(id: string, userId: string) {
    try {
      const mr = await MedicalRepresentative.findById(id);
      if (!mr) {
        throw new Error('MR not found');
      }

      await MedicalRepresentative.findByIdAndDelete(id);
      logger.info('MR deleted successfully', { mrId: id, userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete MR', { id, userId, error });
      throw error;
    }
  }

  async getMRs(userId: string, groupId?: string, search?: string, limit?: number, offset?: number, consentStatus?: string, sortField?: string, sortDirection?: 'asc' | 'desc') {
    try {
      const query: any = {};

      if (groupId) {
        query.groupId = groupId;
      }

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { mrId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort options
      const sortOptions: any = {};
      if (sortField && sortDirection) {
        // Map frontend sort fields to database fields
        const fieldMap: { [key: string]: string } = {
          'firstName': 'firstName',
          'lastName': 'lastName', 
          'mrId': 'mrId',
          'phone': 'phone',
          'group': 'groupId', // Will be handled after population
          'consentStatus': 'createdAt' // Will sort by creation date for consent, then filter in memory
        };
        
        const dbField = fieldMap[sortField] || 'createdAt';
        sortOptions[dbField] = sortDirection === 'asc' ? 1 : -1;
      } else {
        // Default sort
        sortOptions.createdAt = -1;
      }

      // If no limit/offset provided (getAll case), return all without pagination
      if (limit === undefined || offset === undefined) {
        const mrs = await MedicalRepresentative.find(query)
          .populate('groupId', 'groupName')
          .sort(sortOptions);

        // Fetch consent status for each MR
        let mrsWithConsent = await Promise.all(
          mrs.map(async (mr) => {
            try {
              const phoneE164 = this.formatPhoneForConsent(mr.phone);
              const consentResult = await consentService.getConsentStatus(phoneE164);
              const consentStatus = this.determineConsentStatus(consentResult.consent);

              return {
                ...mr.toObject(),
                consentStatus
              };
            } catch (error) {
              logger.warn('Failed to fetch consent status for MR', { mrId: mr._id, phone: mr.phone, error });
              return {
                ...mr.toObject(),
                consentStatus: 'not_requested' as const
              };
            }
          })
        );

        // Filter by consent status if specified
        if (consentStatus) {
          mrsWithConsent = mrsWithConsent.filter(mr => mr.consentStatus === consentStatus);
        }

        // Apply client-side sorting for fields that require consent data
        if (sortField === 'consentStatus' && mrsWithConsent.length > 0) {
          mrsWithConsent.sort((a, b) => {
            const aValue = a.consentStatus || '';
            const bValue = b.consentStatus || '';
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return {
          mrs: mrsWithConsent,
          total: mrsWithConsent.length,
          pagination: null // No pagination for getAll
        };
      }

      const mrs = await MedicalRepresentative.find(query)
        .populate('groupId', 'groupName')
        .sort(sortOptions)
        .limit(limit)
        .skip(offset);

      const total = await MedicalRepresentative.countDocuments(query);

      // Fetch consent status for each MR
      let mrsWithConsent = await Promise.all(
        mrs.map(async (mr) => {
          try {
            const phoneE164 = this.formatPhoneForConsent(mr.phone);
            const consentResult = await consentService.getConsentStatus(phoneE164);
            const consentStatus = this.determineConsentStatus(consentResult.consent);

            return {
              ...mr.toObject(),
              consentStatus
            };
          } catch (error) {
            logger.warn('Failed to fetch consent status for MR', { mrId: mr._id, phone: mr.phone, error });
            return {
              ...mr.toObject(),
              consentStatus: 'not_requested' as const
            };
          }
        })
      );

      // Filter by consent status if specified
      if (consentStatus) {
        mrsWithConsent = mrsWithConsent.filter(mr => mr.consentStatus === consentStatus);
      }

      // Apply client-side sorting for fields that require consent data
      if (sortField === 'consentStatus' && mrsWithConsent.length > 0) {
        mrsWithConsent.sort((a, b) => {
          const aValue = a.consentStatus || '';
          const bValue = b.consentStatus || '';
          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return {
        mrs: mrsWithConsent,
        total,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + mrs.length < total
        }
      };
    } catch (error) {
      logger.error('Failed to get MRs', { userId, groupId, search, error });
      throw error;
    }
  }

  async getMRById(id: string, userId: string) {
    try {
      const mr = await MedicalRepresentative.findById(id)
        .populate('groupId', 'groupName description');

      if (!mr) {
        throw new Error('MR not found');
      }

      // Fetch consent status
      try {
        const phoneE164 = this.formatPhoneForConsent(mr.phone);
        const consentResult = await consentService.getConsentStatus(phoneE164);
        const consentStatus = this.determineConsentStatus(consentResult.consent);
        
        return {
          ...mr.toObject(),
          consentStatus
        };
      } catch (error) {
        logger.warn('Failed to fetch consent status for MR', { mrId: mr._id, phone: mr.phone, error });
        return {
          ...mr.toObject(),
          consentStatus: 'not_requested' as const
        };
      }
    } catch (error) {
      logger.error('Failed to get MR by ID', { id, userId, error });
      throw error;
    }
  }

  async getGroups(userId: string) {
    try {
      const groups = await Group.find({ createdBy: userId });

      // Get MR count for each group
      const groupsWithCounts = await Promise.all(
        groups.map(async (group) => {
          const mrCount = await MedicalRepresentative.countDocuments({ groupId: group._id });
          return {
            ...group.toObject(),
            mrCount
          };
        })
      );

      return groupsWithCounts;
    } catch (error) {
      logger.error('Failed to get groups', { userId, error });
      throw error;
    }
  }

  async getGroupById(id: string, userId: string) {
    try {
      const group = await Group.findOne({ _id: id, createdBy: userId });

      if (!group) {
        throw new Error('Group not found or access denied');
      }

      // Get medical representatives for this group
      const medicalRepresentatives = await MedicalRepresentative.find({ groupId: id })
        .select('mrId firstName lastName phone email comments createdAt');

      return {
        ...group.toObject(),
        medicalRepresentatives
      };
    } catch (error) {
      logger.error('Failed to get group by ID', { id, userId, error });
      throw error;
    }
  }

  async createGroup(groupName: string, description: string, userId: string) {
    try {
      const existingGroup = await Group.findOne({ 
        groupName, 
        createdBy: userId 
      });

      if (existingGroup) {
        throw new Error('Group with this name already exists');
      }

      const group = await Group.create({
        groupName,
        description,
        createdBy: userId,
      });

      logger.info('Group created successfully', { groupId: (group as any)._id, userId });
      return group;
    } catch (error) {
      logger.error('Failed to create group', { groupName, description, userId, error });
      throw error;
    }
  }

  async updateGroup(id: string, groupName: string, description: string, userId: string) {
    try {
      const existingGroup = await Group.findOne({ 
        groupName, 
        createdBy: userId,
        _id: { $ne: id }
      });

      if (existingGroup) {
        throw new Error('Group with this name already exists');
      }

      const result = await Group.updateOne(
        { _id: id, createdBy: userId },
        { groupName, description }
      );

      if (result.matchedCount === 0) {
        throw new Error('Group not found or access denied');
      }

      logger.info('Group updated successfully', { groupId: id, userId });
      return result;
    } catch (error) {
      logger.error('Failed to update group', { id, groupName, description, userId, error });
      throw error;
    }
  }

  async deleteGroup(id: string, userId: string) {
    try {
      // Check if group has MRs
      const mrCount = await MedicalRepresentative.countDocuments({ groupId: id });
      if (mrCount > 0) {
        throw new Error('Cannot delete group with existing MRs');
      }

      const result = await Group.deleteOne({ _id: id, createdBy: userId });
      
      if (result.deletedCount === 0) {
        throw new Error('Group not found or access denied');
      }

      logger.info('Group deleted successfully', { groupId: id, userId });
      return result;
    } catch (error) {
      logger.error('Failed to delete group', { id, userId, error });
      throw error;
    }
  }

  async getGroupsWithPagination(userId: string, options: any) {
    try {
      const { limit, offset, search, sortBy, sortOrder } = options;
      
      const query: any = { createdBy: userId };
      
      if (search) {
        query.groupName = { $regex: search, $options: 'i' };
      }

      const sort: any = {};
      sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

      const groups = await Group.find(query)
        .sort(sort)
        .limit(limit)
        .skip(offset);

      const total = await Group.countDocuments(query);

      return {
        groups,
        total,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + groups.length < total
        }
      };
    } catch (error) {
      logger.error('Failed to get groups with pagination', { userId, options, error });
      throw error;
    }
  }

  async getGroupStats(id: string, userId: string) {
    try {
      const group = await Group.findOne({ _id: id, createdBy: userId });
      if (!group) {
        throw new Error('Group not found or access denied');
      }

      const mrCount = await MedicalRepresentative.countDocuments({ groupId: id });
      const activeMRs = await MedicalRepresentative.countDocuments({ 
        groupId: id,
        // Add any active status logic here
      });

      return {
        id: group._id,
        groupName: group.groupName,
        totalMRs: mrCount,
        activeMRs,
        inactiveMRs: mrCount - activeMRs,
        createdAt: group.createdAt,
      };
    } catch (error) {
      logger.error('Failed to get group stats', { id, userId, error });
      throw error;
    }
  }

  async bulkDeleteGroups(groupIds: string[], userId: string) {
    try {
      const results: { deletedCount: number; errors: string[] } = { deletedCount: 0, errors: [] };

      for (const groupId of groupIds) {
        try {
          // Check if group has MRs
          const mrCount = await MedicalRepresentative.countDocuments({ groupId });
          if (mrCount > 0) {
            results.errors.push(`Group ${groupId} has ${mrCount} MRs and cannot be deleted`);
            continue;
          }

          const result = await Group.deleteOne({ _id: groupId, createdBy: userId });
          if (result.deletedCount > 0) {
            results.deletedCount++;
          }
        } catch (error: any) {
          results.errors.push(`Failed to delete group ${groupId}: ${error.message}`);
        }
      }

      logger.info('Bulk group deletion completed', { userId, results });
      return results;
    } catch (error) {
      logger.error('Failed to bulk delete groups', { groupIds, userId, error });
      throw error;
    }
  }

  async moveMRsToGroup(mrIds: string[], targetGroupId: string, userId: string) {
    try {
      const results: { movedCount: number; errors: string[] } = { movedCount: 0, errors: [] };

      for (const mrId of mrIds) {
        try {
          const result = await MedicalRepresentative.updateOne(
            { _id: mrId },
            { groupId: targetGroupId }
          );

          if (result.modifiedCount > 0) {
            results.movedCount++;
          }
        } catch (error: any) {
          results.errors.push(`Failed to move MR ${mrId}: ${error.message}`);
        }
      }

      logger.info('MRs moved to group successfully', { mrIds, targetGroupId, userId, results });
      return results;
    } catch (error) {
      logger.error('Failed to move MRs to group', { mrIds, targetGroupId, userId, error });
      throw error;
    }
  }

  async exportGroupData(id: string, userId: string) {
    try {
      const group = await Group.findOne({ _id: id, createdBy: userId });
      if (!group) {
        throw new Error('Group not found or access denied');
      }

      const medicalRepresentatives = await MedicalRepresentative.find({ groupId: id })
        .select('mrId firstName lastName phone comments createdAt');

      return {
        groupName: group.groupName,
        description: group.description,
        medicalRepresentatives,
      };
    } catch (error) {
      logger.error('Failed to export group data', { id, userId, error });
      throw error;
    }
  }

  async getGroupActivity(id: string, userId: string, options: any) {
    try {
      const { limit, offset, dateFrom, dateTo } = options;
      
      const query: any = { groupId: id };
      
      if (dateFrom || dateTo) {
        query.timestamp = {};
        if (dateFrom) query.timestamp.$gte = dateFrom;
        if (dateTo) query.timestamp.$lte = dateTo;
      }

      // This would require a GroupActivity model
      // For now, return empty result
      return {
        activities: [] as any[],
        total: 0
      };
    } catch (error) {
      logger.error('Failed to get group activity', { id, userId, options, error });
      throw error;
    }
  }

  async bulkCreateMRs(mrData: any[], userId: string) {
    try {
      const results = {
        created: 0,
        errors: [] as string[],
        totalProcessed: mrData.length,
        phoneNumbers: [] as string[] // Collect phone numbers for WhatsApp allowed list
      };

      // Get all groups for the user to map group names to IDs
      const groups = await Group.find({ createdBy: userId });
      const groupMap = new Map(groups.map(group => [group.groupName, group._id]));

      for (let i = 0; i < mrData.length; i++) {
        const data = mrData[i];
        try {
          // Find group ID by group name
          let groupId = groupMap.get(data.groupName);
          
          // If group doesn't exist, create it (especially for "Default Group")
          if (!groupId) {
            try {
              const newGroup = await Group.create({
                groupName: data.groupName,
                description: `Auto-created group for bulk upload`,
                createdBy: userId
              });
              groupId = newGroup._id;
              groupMap.set(data.groupName, groupId);
              logger.info(`Created new group: ${data.groupName}`, { groupId, userId });
            } catch (groupError: any) {
              results.errors.push(`Row ${i + 1}: Failed to create group "${data.groupName}": ${groupError.message}`);
              continue;
            }
          }

          // Check if MR ID already exists
          const existingMR = await MedicalRepresentative.findOne({
            mrId: data.mrId,
            groupId: groupId
          });

          if (existingMR) {
            results.errors.push(`Row ${i + 1}: MR ID "${data.mrId}" already exists in group "${data.groupName}"`);
            continue;
          }

          // Create MR
          await MedicalRepresentative.create({
            mrId: data.mrId,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
            address: data.address,
            comments: data.comments,
            groupId: groupId,
            marketingManagerId: userId
          });

          // Collect phone number for WhatsApp allowed list
          if (data.phone) {
            results.phoneNumbers.push(data.phone);
          }

          results.created++;
        } catch (error: any) {
          results.errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      // Automatically add all phone numbers to WhatsApp allowed recipients list
      if (results.phoneNumbers.length > 0) {
        try {
          // Note: WhatsApp Cloud API doesn't require pre-approved recipient lists
          // Messages can be sent to any valid WhatsApp number
          logger.info('📱 Bulk MR phone numbers will be available for WhatsApp messaging', { 
            count: results.phoneNumbers.length 
          });
        } catch (whatsappError) {
          // Don't fail bulk creation if WhatsApp addition fails
          logger.warn('⚠️ WhatsApp allowed list update failed for bulk MR creation', { 
            error: whatsappError 
          });
        }
      }

      logger.info('Bulk MR creation completed', { userId, results });
      return results;
    } catch (error) {
      logger.error('Failed to bulk create MRs', { userId, error });
      throw error;
    }
  }

  async downloadTemplate() {
    try {
      // Return template data for frontend to handle
      return {
        headers: ['mrId', 'firstName', 'lastName', 'phone', 'email', 'groupName', 'comments'],
        sampleData: [
          ['MR001', 'John', 'Doe', '+1234567890', 'john@example.com', 'Group A', 'Sample comment'],
          ['MR002', 'Jane', 'Smith', '+0987654321', 'jane@example.com', 'Group B', '']
        ]
      };
    } catch (error) {
      logger.error('Failed to download template', { error });
      throw error;
    }
  }

  async getMRStats(userId: string) {
    try {
      const totalMRs = await MedicalRepresentative.countDocuments({ createdBy: userId });
      const totalGroups = await Group.countDocuments({ createdBy: userId });
      
      // Get MRs by group
      const mrsByGroup = await MedicalRepresentative.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$groupId', count: { $sum: 1 } } },
        { $lookup: { from: 'groups', localField: '_id', foreignField: '_id', as: 'group' } },
        { $unwind: '$group' },
        { $project: { groupName: '$group.groupName', count: 1 } }
      ]);

      return {
        totalMRs,
        totalGroups,
        mrsByGroup,
        averageMRsPerGroup: totalGroups > 0 ? Math.round(totalMRs / totalGroups * 100) / 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get MR stats', { userId, error });
      throw error;
    }
  }

  async searchMRs(userId: string, query: string) {
    try {
      const searchRegex = new RegExp(query, 'i');

      const mrs = await MedicalRepresentative.find({
        createdBy: userId,
        $or: [
          { mrId: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
          { phone: searchRegex },
          { email: searchRegex }
        ]
      })
      .populate('groupId', 'groupName')
      .sort({ createdAt: -1 })
      .limit(50);

      // Fetch consent status for each MR
      const mrsWithConsent = await Promise.all(
        mrs.map(async (mr) => {
          try {
            const phoneE164 = this.formatPhoneForConsent(mr.phone);
            const consentResult = await consentService.getConsentStatus(phoneE164);
            const consentStatus = this.determineConsentStatus(consentResult.consent);

            return {
              ...mr.toObject(),
              consentStatus
            };
          } catch (error) {
            logger.warn('Failed to fetch consent status for MR', { mrId: mr._id, phone: mr.phone, error });
            return {
              ...mr.toObject(),
              consentStatus: 'not_requested' as const
            };
          }
        })
      );

      return {
        mrs: mrsWithConsent,
        pagination: {
          total: mrsWithConsent.length,
          page: 1,
          limit: 50,
          totalPages: Math.ceil(mrsWithConsent.length / 50),
          hasMore: mrsWithConsent.length === 50
        }
      };
    } catch (error) {
      logger.error('Failed to search MRs', { userId, query, error });
      throw error;
    }
  }

  async getAllGroupStats(userId: string) {
    try {
      const groups = await Group.find({ createdBy: userId });
      const totalMRs = await MedicalRepresentative.countDocuments({ createdBy: userId });
      
      const groupStats = await Promise.all(
        groups.map(async (group) => {
          const mrCount = await MedicalRepresentative.countDocuments({ 
            groupId: group._id, 
            createdBy: userId 
          });
          return {
            groupId: group._id,
            groupName: group.groupName,
            mrCount,
            description: group.description
          };
        })
      );

      return {
        totalGroups: groups.length,
        totalMRs,
        groupStats,
        averageMRsPerGroup: groups.length > 0 ? Math.round(totalMRs / groups.length * 100) / 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get all group stats', { userId, error });
      throw error;
    }
  }

  async searchGroups(userId: string, query: string) {
    try {
      const searchRegex = new RegExp(query, 'i');
      
      const groups = await Group.find({
        createdBy: userId,
        $or: [
          { groupName: searchRegex },
          { description: searchRegex }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(20);

      // Add MR count for each group
      const groupsWithCounts = await Promise.all(
        groups.map(async (group) => {
          const mrCount = await MedicalRepresentative.countDocuments({ 
            groupId: group._id, 
            createdBy: userId 
          });
          return {
            ...group.toObject(),
            mrCount
          };
        })
      );

      return {
        groups: groupsWithCounts,
        pagination: {
          total: groupsWithCounts.length,
          page: 1,
          limit: 20,
          hasMore: false
        }
      };
    } catch (error) {
      logger.error('Failed to search groups', { userId, query, error });
      throw error;
    }
  }
}