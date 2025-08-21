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

      const totalMRs = groups.reduce((acc: number, group: any) => acc + (group._count?.medicalRepresentatives || 0), 0);

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

      res.json(dashboardStats);
    } catch (error: any) {
      logger.error('Failed to get dashboard stats', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }

  async getDetailedReport(req: any, res: Response) {
    try {
      const { campaignId } = req.params;
      const report = await messageService.getCampaignReport(campaignId);
      
      // Add additional analytics
      const groupStats = report.campaign.messageLogs.reduce((acc: any, log: any) => {
        const groupName = log.medicalRepresentative.group.groupName;
        if (!acc[groupName]) {
          acc[groupName] = { total: 0, sent: 0, failed: 0, pending: 0 };
        }
        acc[groupName].total++;
        if (log.status === 'sent') acc[groupName].sent++;
        else if (log.status === 'failed') acc[groupName].failed++;
        else acc[groupName].pending++;
        return acc;
      }, {});

      res.json({
        ...report,
        groupStats,
        timeline: report.campaign.messageLogs.map((log: any) => ({
          time: log.sentAt || log.createdAt,
          status: log.status,
          mrName: `${log.medicalRepresentative.firstName} ${log.medicalRepresentative.lastName}`,
          groupName: log.medicalRepresentative.group.groupName,
        }))
      });
    } catch (error: any) {
      logger.error('Failed to get detailed report', { error: error.message });
      res.status(500).json({ error: error.message });
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
        const csvData = report.campaign.messageLogs.map((log: any) => {
          return [
            log.medicalRepresentative.mrId,
            `${log.medicalRepresentative.firstName} ${log.medicalRepresentative.lastName}`,
            log.phoneNumber,
            log.medicalRepresentative.group.groupName,
            log.status,
            log.sentAt || '',
            log.errorMessage || ''
          ].join(',');
        }).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=campaign-${campaignId}-report.csv`);
        res.send(csvHeaders + csvData);
      } else {
        res.json(report);
      }
    } catch (error: any) {
      logger.error('Failed to export report', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
}