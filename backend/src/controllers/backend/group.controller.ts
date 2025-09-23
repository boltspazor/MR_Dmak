import { Request, Response } from 'express';
import { MRService } from '../../services/mr.service';
import { schemas } from '../../utils/validation';
import logger from '../../utils/logger';

const mrService = new MRService();

export class GroupController {
  /**
   * Get all groups for the authenticated user
   */
  async getGroups(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const groups = await mrService.getGroups(userId);
      
      logger.info('Groups retrieved successfully', { 
        userId, 
        groupCount: groups.length 
      });
      
      res.json({ 
        message: 'Groups retrieved successfully',
        data: groups,
        total: groups.length
      });
    } catch (error: any) {
      logger.error('Failed to get groups', { 
        userId: req.user?.userId,
        error: error.message 
      });
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get a specific group by ID
   */
  async getGroupById(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Get group with MR count and details
      const group = await mrService.getGroupById(id, userId);
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }

      logger.info('Group retrieved successfully', { 
        userId, 
        groupId: id 
      });

      return res.json({ 
        message: 'Group retrieved successfully',
        group 
      });
    } catch (error: any) {
      logger.error('Failed to get group by ID', { 
        userId: req.user?.userId,
        groupId: req.params.id,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new group
   */
  async createGroup(req: any, res: Response) {
    try {
      const { error, value } = schemas.group.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const userId = req.user.userId;
      const { groupName, description } = value;

      const group = await mrService.createGroup(groupName, description, userId);
      
      logger.info('Group created successfully', { 
        userId, 
        groupId: group.id,
        groupName: group.groupName
      });
      
      return res.status(201).json({ 
        message: 'Group created successfully',
        group 
      });
    } catch (error: any) {
      logger.error('Failed to create group', { 
        userId: req.user?.userId,
        body: req.body,
        error: error.message 
      });
      
      // Handle specific error cases
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update an existing group
   */
  async updateGroup(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = schemas.group.create.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const userId = req.user.userId;
      const { groupName, description } = value;

      const result = await mrService.updateGroup(id, groupName, description, userId);
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }

      logger.info('Group updated successfully', { 
        userId, 
        groupId: id,
        groupName 
      });

      return res.json({ 
        message: 'Group updated successfully',
        updatedCount: result.matchedCount
      });
    } catch (error: any) {
      logger.error('Failed to update group', { 
        userId: req.user?.userId,
        groupId: req.params.id,
        body: req.body,
        error: error.message 
      });
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete a group
   */
  async deleteGroup(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const result = await mrService.deleteGroup(id, userId);
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }

      logger.info('Group deleted successfully', { 
        userId, 
        groupId: id 
      });

      return res.json({ 
        message: 'Group deleted successfully',
        deletedCount: result.deletedCount
      });
    } catch (error: any) {
      logger.error('Failed to delete group', { 
        userId: req.user?.userId,
        groupId: req.params.id,
        error: error.message 
      });
      
      // Handle specific error cases
      if (error.message.includes('Cannot delete group with existing MRs')) {
        return res.status(400).json({ 
          error: 'Cannot delete group with existing Medical Representatives. Please move or delete all MRs first.' 
        });
      }
      
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get groups with pagination and search
   */
  async getGroupsWithPagination(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        sortBy = 'createdAt',
        sortOrder = 'desc' 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await mrService.getGroupsWithPagination(
        userId,
        {
          limit: parseInt(limit),
          offset,
          search,
          sortBy,
          sortOrder
        }
      );

      logger.info('Groups retrieved with pagination', { 
        userId, 
        page, 
        limit, 
        search,
        total: result.total
      });

      return res.json({
        message: 'Groups retrieved successfully',
        data: result.groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit)),
          hasMore: offset + result.groups.length < result.total
        }
      });
    } catch (error: any) {
      logger.error('Failed to get groups with pagination', { 
        userId: req.user?.userId,
        query: req.query,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }


  /**
   * Bulk delete groups
   */
  async bulkDeleteGroups(req: any, res: Response) {
    try {
      const { groupIds } = req.body;
      const userId = req.user.userId;

      if (!Array.isArray(groupIds) || groupIds.length === 0) {
        return res.status(400).json({ error: 'Group IDs array is required' });
      }

      const results = await mrService.bulkDeleteGroups(groupIds, userId);

      logger.info('Bulk group deletion completed', { 
        userId, 
        requestedCount: groupIds.length,
        deletedCount: results.deletedCount,
        errors: results.errors.length
      });

      return res.json({
        message: 'Bulk group deletion completed',
        deletedCount: results.deletedCount,
        errors: results.errors,
        totalRequested: groupIds.length
      });
    } catch (error: any) {
      logger.error('Failed to bulk delete groups', { 
        userId: req.user?.userId,
        body: req.body,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get MRs in a specific group
   */
  async getGroupMRs(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { 
        page = 1, 
        limit = 50, 
        search = '' 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await mrService.getMRs(
        userId,
        id, // groupId
        search,
        parseInt(limit),
        offset
      );

      logger.info('Group MRs retrieved successfully', { 
        userId, 
        groupId: id,
        mrCount: result.mrs.length
      });

      return res.json({
        message: 'Group Medical Representatives retrieved successfully',
        data: result.mrs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit)),
          hasMore: offset + result.mrs.length < result.total
        }
      });
    } catch (error: any) {
      logger.error('Failed to get group MRs', { 
        userId: req.user?.userId,
        groupId: req.params.id,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Move MRs between groups
   */
  async moveMRsToGroup(req: any, res: Response) {
    try {
      const { id } = req.params; // target group id
      const { mrIds, sourceGroupId } = req.body;
      const userId = req.user.userId;

      if (!Array.isArray(mrIds) || mrIds.length === 0) {
        return res.status(400).json({ error: 'MR IDs array is required' });
      }

      const result = await mrService.moveMRsToGroup(mrIds, id, userId);

      logger.info('MRs moved between groups successfully', { 
        userId, 
        sourceGroupId,
        targetGroupId: id,
        mrCount: mrIds.length,
        movedCount: result.movedCount
      });

      return res.json({
        message: 'Medical Representatives moved successfully',
        movedCount: result.movedCount,
        errors: result.errors,
        totalRequested: mrIds.length
      });
    } catch (error: any) {
      logger.error('Failed to move MRs to group', { 
        userId: req.user?.userId,
        targetGroupId: req.params.id,
        body: req.body,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Export group data
   */
  async exportGroupData(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;
      const userId = req.user.userId;

      const groupData = await mrService.exportGroupData(id, userId);
      
      if (!groupData) {
        return res.status(404).json({ error: 'Group not found or access denied' });
      }

      if (format === 'csv') {
        // Generate CSV format
        const csvHeaders = 'MR ID,First Name,Last Name,Phone,Comments,Created At\n';
        const csvData = groupData.medicalRepresentatives.map((mr: any) => {
          return [
            mr.mrId,
            mr.firstName,
            mr.lastName,
            mr.phone,
            mr.comments || '',
            mr.createdAt
          ].map(field => `"${field}"`).join(',');
        }).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=group-${groupData.groupName}-data.csv`);
        return res.send(csvHeaders + csvData);
      } else {
        return res.json({
          message: 'Group data exported successfully',
          data: groupData
        });
      }

      logger.info('Group data exported successfully', { 
        userId, 
        groupId: id,
        format 
      });
    } catch (error: any) {
      logger.error('Failed to export group data', { 
        userId: req.user?.userId,
        groupId: req.params.id,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get group activity/history
   */
  async getGroupActivity(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { 
        page = 1, 
        limit = 20,
        dateFrom,
        dateTo 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const activity = await mrService.getGroupActivity(id, userId, {
        limit: parseInt(limit),
        offset,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      });

      logger.info('Group activity retrieved successfully', { 
        userId, 
        groupId: id 
      });

      return res.json({
        message: 'Group activity retrieved successfully',
        data: activity.activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: activity.total,
          totalPages: Math.ceil(activity.total / parseInt(limit)),
          hasMore: offset + activity.activities.length < activity.total
        }
      });
    } catch (error: any) {
      logger.error('Failed to get group activity', { 
        userId: req.user?.userId,
        groupId: req.params.id,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get group statistics
   */
  async getGroupStats(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      let stats;
      if (id) {
        // Get stats for specific group
        stats = await mrService.getGroupStats(id, userId);
        if (!stats) {
          return res.status(404).json({ error: 'Group not found or access denied' });
        }
      } else {
        // Get overall group statistics
        stats = await mrService.getAllGroupStats(userId);
      }
      
      logger.info('Group statistics retrieved successfully', { 
        userId, 
        groupId: id,
        stats 
      });
      
      return res.json({
        message: 'Group statistics retrieved successfully',
        data: stats
      });
    } catch (error: any) {
      logger.error('Failed to get group stats', { 
        userId: req.user?.userId,
        groupId: req.params.id,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search groups
   */
  async searchGroups(req: any, res: Response) {
    try {
      const { q } = req.query;
      const userId = req.user.userId;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const result = await mrService.searchGroups(userId, q);
      
      logger.info('Groups search completed successfully', { 
        userId, 
        query: q,
        resultCount: result.groups.length 
      });
      
      return res.json({
        message: 'Groups search completed successfully',
        data: result.groups,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Failed to search groups', { 
        userId: req.user?.userId,
        query: req.query.q,
        error: error.message 
      });
      return res.status(500).json({ error: error.message });
    }
  }
}