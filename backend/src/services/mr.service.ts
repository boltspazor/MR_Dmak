import MedicalRepresentative from '../models/MedicalRepresentative';
import Group from '../models/Group';
import { CreateMRForm, UpdateMRForm } from '../types/mongodb';
import logger from '../utils/logger';
import { WhatsAppService } from './whatsapp.service';

export class MRService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async createMR(data: CreateMRForm, userId: string) {
    try {
      // Check if MR ID already exists in the same group
      const existingMR = await MedicalRepresentative.findOne({
        mrId: data.mrId,
        groupId: data.groupId,
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
        groupId: data.groupId,
        comments: data.comments,
      });

      const populatedMR = await MedicalRepresentative.findById(mr._id)
        .populate('groupId', 'groupName description');

      // Automatically add phone number to WhatsApp allowed recipients list
      try {
        if (data.phone) {
          logger.info('📱 Adding MR phone number to WhatsApp allowed list', { phone: data.phone });
          const whatsappResult = await this.whatsappService.addAllowedRecipients([data.phone], userId?.toString());
          if (whatsappResult.success) {
            logger.info('✅ MR phone number added to WhatsApp allowed list', { phone: data.phone });
          } else {
            logger.warn('⚠️ Failed to add MR phone number to WhatsApp allowed list', { 
              phone: data.phone, 
              error: whatsappResult.error 
            });
          }
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

  async getMRs(userId: string, groupId?: string, search?: string, limit = 50, offset = 0) {
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

      const mrs = await MedicalRepresentative.find(query)
        .populate('groupId', 'groupName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await MedicalRepresentative.countDocuments(query);

      return {
        mrs,
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

      return mr;
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
        activities: [],
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
          logger.info('📱 Adding bulk MR phone numbers to WhatsApp allowed list', { 
            count: results.phoneNumbers.length 
          });
          const whatsappResult = await this.whatsappService.addAllowedRecipients(results.phoneNumbers, userId?.toString());
          if (whatsappResult.success) {
            logger.info('✅ Bulk MR phone numbers added to WhatsApp allowed list', { 
              count: whatsappResult.added?.length || 0 
            });
          } else {
            logger.warn('⚠️ Failed to add bulk MR phone numbers to WhatsApp allowed list', { 
              error: whatsappResult.error 
            });
          }
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
}