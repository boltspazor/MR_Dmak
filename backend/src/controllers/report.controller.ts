import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { MRService } from '../services/mr.service';
import { getQueueStats } from '../services/queue.service';
import logger from '../utils/logger';

const messageService = new MessageService();
const mrService = new MRService();

export class ReportController {
  async getDashboardStats(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      
      // Get basic stats
      const [campaignStats, groups, queueStats] = await Promise.all([
        messageService.getCampaignStats(userId),
        mrService.getGroups(userId),
        getQueueStats(),
      ]);

      const totalMRs = groups.reduce((acc: number, group: any) => acc + (group.mrCount || 0), 0);

      const dashboardStats = {
        totalMRs,
        totalGroups: groups.length,
        totalCampaigns: campaignStats.campaigns,
        totalMessagesSent: campaignStats.sent,
        successRate: campaignStats.successRate,
        pendingMessages: queueStats.waiting + queueStats.active,
        recentActivity: {
          campaigns: campaignStats.campaigns,
          messagesSent: campaignStats.sent,
          messagesReceived: campaignStats.total,
        }
      };

      return res.json({ 
        success: true,
        stats: dashboardStats 
      });
    } catch (error: any) {
      logger.error('Failed to get dashboard stats', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getDetailedReport(req: any, res: Response) {
    try {
      const { campaignId } = req.params;
      const report = await messageService.getCampaignReport(campaignId);
      
      // Add additional analytics
      const groupStats = report.messageLogs.reduce((acc: any, log: any) => {
        const groupName = log.mrId.groupId.groupName;
        if (!acc[groupName]) {
          acc[groupName] = { total: 0, sent: 0, failed: 0, pending: 0 };
        }
        acc[groupName].total++;
        if (log.status === 'sent') acc[groupName].sent++;
        else if (log.status === 'failed') acc[groupName].failed++;
        else acc[groupName].pending++;
        return acc;
      }, {});

      return res.json({
        ...report,
        groupStats,
        timeline: report.messageLogs.map((log: any) => ({
          time: log.sentAt || log.createdAt,
          status: log.status,
          mrName: `${log.mrId.firstName} ${log.mrId.lastName}`,
          groupName: log.mrId.groupId.groupName,
        }))
      });
    } catch (error: any) {
      logger.error('Failed to get detailed report', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async exportReport(req: any, res: Response) {
    try {
      const { campaignId } = req.params;
      const { format = 'json' } = req.query;
      
      const report = await messageService.getCampaignReport(campaignId);
      
      if (format === 'csv') {
        // Generate CSV format
        const csvHeaders = 'MR ID,Name,Phone,Group,Status,Sent At,Error Message\n';
        const csvData = report.messageLogs.map((log: any) => {
          return [
            log.mrId.mrId,
            `${log.mrId.firstName} ${log.mrId.lastName}`,
            log.phoneNumber,
            log.mrId.groupId.groupName,
            log.status,
            log.sentAt || '',
            log.errorMessage || ''
          ].join(',');
        }).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=campaign-${campaignId}-report.csv`);
        return res.send(csvHeaders + csvData);
      } else {
        return res.json(report);
      }
    } catch (error: any) {
      logger.error('Failed to export report', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getPerformanceReport(req: any, res: Response) {
    try {
      const { startDate, endDate, groupId } = req.query;
      const userId = req.user.userId;
      
      const performance = await messageService.getPerformanceReport(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        groupId: groupId as string
      });

      return res.json({
        success: true,
        data: performance
      });
    } catch (error: any) {
      logger.error('Failed to get performance report', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getCampaignsReport(req: any, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;
      const userId = req.user.userId;
      
      const campaigns = await messageService.getCampaignsReport(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string
      });

      return res.json({
        success: true,
        data: campaigns
      });
    } catch (error: any) {
      logger.error('Failed to get campaigns report', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getDeliveryReport(req: any, res: Response) {
    try {
      const { startDate, endDate, groupId } = req.query;
      const userId = req.user.userId;
      
      const delivery = await messageService.getDeliveryReport(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        groupId: groupId as string
      });

      return res.json({
        success: true,
        data: delivery
      });
    } catch (error: any) {
      logger.error('Failed to get delivery report', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getGroupsReport(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const groups = await mrService.getGroups(userId);
      
      const groupsWithStats = await Promise.all(
        groups.map(async (group: any) => {
          const stats = await messageService.getGroupStats(group._id, userId);
          return {
            ...group,
            stats
          };
        })
      );

      return res.json({
        success: true,
        data: groupsWithStats
      });
    } catch (error: any) {
      logger.error('Failed to get groups report', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getMonthlyReport(req: any, res: Response) {
    try {
      const { year, month } = req.params;
      const userId = req.user.userId;
      
      const monthlyData = await messageService.getMonthlyReport(userId, {
        year: parseInt(year),
        month: parseInt(month)
      });

      return res.json({
        success: true,
        data: monthlyData
      });
    } catch (error: any) {
      logger.error('Failed to get monthly report', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }
}