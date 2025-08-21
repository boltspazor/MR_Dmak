import prisma from '../config/database';
import { MRData, BulkUploadResult } from '../types';
import logger from '../utils/logger';

export class MRService {
  async createMR(data: Omit<MRData, 'groupName'> & { groupId: string }, userId: string) {
    try {
      // Check if MR ID already exists in the same group
      const existingMR = await prisma.medicalRepresentative.findFirst({
        where: {
          mrId: data.mrId,
          groupId: data.groupId,
        },
      });

      if (existingMR) {
        throw new Error('MR with this ID already exists in the group');
      }

      const mr = await prisma.medicalRepresentative.create({
        data: {
          mrId: data.mrId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          groupId: data.groupId,
          comments: data.comments,
        },
        include: {
          group: true,
        },
      });

      logger.info('MR created successfully', { mrId: mr.id, userId });
      return mr;
    } catch (error) {
      logger.error('Failed to create MR', { data, userId, error });
      throw error;
    }
  }

  async bulkCreateMRs(data: MRData[], userId: string): Promise<BulkUploadResult> {
    const results: BulkUploadResult = { created: 0, errors: [] };
    
    for (const [index, mrData] of data.entries()) {
      try {
        // Find or create group
        let group = await prisma.group.findFirst({
          where: { groupName: mrData.groupName, createdBy: userId },
        });

        if (!group) {
          group = await prisma.group.create({
            data: {
              groupName: mrData.groupName,
              description: `Auto-created group for ${mrData.groupName}`,
              createdBy: userId,
            },
          });
        }

        // Check if MR already exists
        const existingMR = await prisma.medicalRepresentative.findFirst({
          where: {
            mrId: mrData.mrId,
            groupId: group.id,
          },
        });

        if (existingMR) {
          results.errors.push(`Row ${index + 1}: MR ${mrData.mrId} already exists in group ${mrData.groupName}`);
          continue;
        }

        // Create MR
        await prisma.medicalRepresentative.create({
          data: {
            mrId: mrData.mrId,
            firstName: mrData.firstName,
            lastName: mrData.lastName,
            phone: mrData.phone,
            groupId: group.id,
            comments: mrData.comments,
          },
        });

        results.created++;
      } catch (error: any) {
        results.errors.push(`Row ${index + 1}: Failed to create MR ${mrData.mrId}: ${error.message}`);
      }
    }

    logger.info('Bulk MR upload completed', {
      userId,
      totalProcessed: data.length,
      created: results.created,
      errors: results.errors.length
    });

    return results;
  }

  async getMRs(userId: string, groupId?: string, search?: string, limit = 100, offset = 0) {
    try {
      const whereClause: any = {
        group: {
          createdBy: userId,
        },
      };

      if (groupId) {
        whereClause.groupId = groupId;
      }

      if (search) {
        whereClause.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { mrId: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ];
      }

      const mrs = await prisma.medicalRepresentative.findMany({
        where: whereClause,
        include: {
          group: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.medicalRepresentative.count({
        where: whereClause,
      });

      return { mrs, total };
    } catch (error) {
      logger.error('Failed to get MRs', { userId, groupId, search, error });
      throw error;
    }
  }

  async updateMR(id: string, data: Partial<MRData>, userId: string) {
    try {
      const result = await prisma.medicalRepresentative.updateMany({
        where: {
          id,
          group: {
            createdBy: userId,
          },
        },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          comments: data.comments,
        },
      });

      if (result.count === 0) {
        throw new Error('MR not found or access denied');
      }

      logger.info('MR updated successfully', { mrId: id, userId });
      return result;
    } catch (error) {
      logger.error('Failed to update MR', { id, data, userId, error });
      throw error;
    }
  }

  async deleteMR(id: string, userId: string) {
    try {
      const result = await prisma.medicalRepresentative.deleteMany({
        where: {
          id,
          group: {
            createdBy: userId,
          },
        },
      });

      if (result.count === 0) {
        throw new Error('MR not found or access denied');
      }

      logger.info('MR deleted successfully', { mrId: id, userId });
      return result;
    } catch (error) {
      logger.error('Failed to delete MR', { id, userId, error });
      throw error;
    }
  }

  async getGroups(userId: string) {
    try {
      const groups = await prisma.group.findMany({
        where: { createdBy: userId },
        include: {
          _count: {
            select: { medicalRepresentatives: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return groups;
    } catch (error) {
      logger.error('Failed to get groups', { userId, error });
      throw error;
    }
  }

  async createGroup(name: string, description: string, userId: string) {
    try {
      // Check if group name already exists for this user
      const existingGroup = await prisma.group.findFirst({
        where: {
          groupName: name,
          createdBy: userId,
        },
      });

      if (existingGroup) {
        throw new Error('Group with this name already exists');
      }

      const group = await prisma.group.create({
        data: {
          groupName: name,
          description,
          createdBy: userId,
        },
      });

      logger.info('Group created successfully', { groupId: group.id, userId });
      return group;
    } catch (error) {
      logger.error('Failed to create group', { name, userId, error });
      throw error;
    }
  }

  async updateGroup(id: string, name: string, description: string, userId: string) {
    try {
      const result = await prisma.group.updateMany({
        where: {
          id,
          createdBy: userId,
        },
        data: {
          groupName: name,
          description,
        },
      });

      if (result.count === 0) {
        throw new Error('Group not found or access denied');
      }

      logger.info('Group updated successfully', { groupId: id, userId });
      return result;
    } catch (error) {
      logger.error('Failed to update group', { id, name, userId, error });
      throw error;
    }
  }

  async deleteGroup(id: string, userId: string) {
    try {
      // Check if group has MRs
      const mrCount = await prisma.medicalRepresentative.count({
        where: { groupId: id },
      });

      if (mrCount > 0) {
        throw new Error('Cannot delete group with existing MRs');
      }

      const result = await prisma.group.deleteMany({
        where: {
          id,
          createdBy: userId,
        },
      });

      if (result.count === 0) {
        throw new Error('Group not found or access denied');
      }

      logger.info('Group deleted successfully', { groupId: id, userId });
      return result;
    } catch (error) {
      logger.error('Failed to delete group', { id, userId, error });
      throw error;
    }
  }

  async getGroupById(id: string, userId: string) {
    try {
      const group = await prisma.group.findFirst({
        where: {
          id,
          createdBy: userId,
        },
        include: {
          _count: {
            select: { medicalRepresentatives: true },
          },
          medicalRepresentatives: {
            include: {
              group: true,
            },
          },
        },
      });

      return group;
    } catch (error) {
      logger.error('Failed to get group by ID', { id, userId, error });
      throw error;
    }
  }

  async getGroupsWithPagination(
    userId: string,
    options: {
      limit: number;
      offset: number;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ) {
    try {
      const { limit, offset, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = options;

      const whereClause: any = {
        createdBy: userId,
      };

      if (search) {
        whereClause.OR = [
          { groupName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const groups = await prisma.group.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { medicalRepresentatives: true },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.group.count({
        where: whereClause,
      });

      return { groups, total };
    } catch (error) {
      logger.error('Failed to get groups with pagination', { userId, options, error });
      throw error;
    }
  }

  async getGroupStats(id: string, userId: string) {
    try {
      const group = await prisma.group.findFirst({
        where: {
          id,
          createdBy: userId,
        },
        include: {
          _count: {
            select: { medicalRepresentatives: true },
          },
          medicalRepresentatives: {
            select: {
              id: true,
              mrId: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
        },
      });

      if (!group) {
        return null;
      }

      return {
        groupId: group.id,
        groupName: group.groupName,
        totalMRs: group._count.medicalRepresentatives,
        mrs: group.medicalRepresentatives,
        createdAt: group.createdAt,
      };
    } catch (error) {
      logger.error('Failed to get group stats', { id, userId, error });
      throw error;
    }
  }

  async bulkDeleteGroups(groupIds: string[], userId: string) {
    try {
      const results = { deletedCount: 0, errors: [] as string[] };

      for (const groupId of groupIds) {
        try {
          // Check if group has MRs
          const mrCount = await prisma.medicalRepresentative.count({
            where: { groupId },
          });

          if (mrCount > 0) {
            results.errors.push(`Group ${groupId} cannot be deleted - has ${mrCount} MRs`);
            continue;
          }

          const result = await prisma.group.deleteMany({
            where: {
              id: groupId,
              createdBy: userId,
            },
          });

          if (result.count > 0) {
            results.deletedCount++;
          }
        } catch (error: any) {
          results.errors.push(`Failed to delete group ${groupId}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to bulk delete groups', { groupIds, userId, error });
      throw error;
    }
  }

  async moveMRsToGroup(mrIds: string[], targetGroupId: string, userId: string) {
    try {
      const results = { movedCount: 0, errors: [] as string[] };

      for (const mrId of mrIds) {
        try {
          const result = await prisma.medicalRepresentative.updateMany({
            where: {
              id: mrId,
              group: {
                createdBy: userId,
              },
            },
            data: {
              groupId: targetGroupId,
            },
          });

          if (result.count > 0) {
            results.movedCount++;
          }
        } catch (error: any) {
          results.errors.push(`Failed to move MR ${mrId}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to move MRs to group', { mrIds, targetGroupId, userId, error });
      throw error;
    }
  }

  async exportGroupData(id: string, userId: string) {
    try {
      const group = await prisma.group.findFirst({
        where: {
          id,
          createdBy: userId,
        },
        include: {
          medicalRepresentatives: {
            select: {
              mrId: true,
              firstName: true,
              lastName: true,
              phone: true,
              comments: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      return group;
    } catch (error) {
      logger.error('Failed to export group data', { id, userId, error });
      throw error;
    }
  }

  async getGroupActivity(
    id: string,
    userId: string,
    options: {
      limit: number;
      offset: number;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) {
    try {
      const { limit, offset, dateFrom, dateTo } = options;

      const whereClause: any = {
        groupId: id,
        group: {
          createdBy: userId,
        },
      };

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }

      const activities = await prisma.medicalRepresentative.findMany({
        where: whereClause,
        select: {
          id: true,
          mrId: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.medicalRepresentative.count({
        where: whereClause,
      });

      return { activities, total };
    } catch (error) {
      logger.error('Failed to get group activity', { id, userId, options, error });
      throw error;
    }
  }
}