import { Router } from 'express';
import { CampaignController } from '../../controllers/backend/campaign.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Campaign routes
router.post('/', CampaignController.createCampaign);
router.post('/with-mrs', CampaignController.createCampaignWithMRs);
router.get('/statuses', CampaignController.getAvailableStatuses);
router.get('/', CampaignController.getCampaigns);
router.get('/:campaignId', CampaignController.getCampaignById);
router.patch('/:campaignId/status', CampaignController.updateCampaignStatus);
router.delete('/:campaignId', CampaignController.deleteCampaign);

// Campaign progress routes
router.get('/message/:messageId/status', CampaignController.getMessageStatus);
router.get('/:campaignId/realtime-status', CampaignController.getCampaignRealTimeStatus);
router.post('/webhook/status', CampaignController.updateMessageStatus);
router.post('/:campaignId/check-completion', CampaignController.checkCampaignCompletion);

// Test webhook endpoint (for development/testing)
router.post('/test-webhook', (req, res) => {
  const { messageId, status, timestamp, recipient_id } = req.body;
  
  // Simulate webhook payload
  const webhookPayload = {
    entry: [{
      changes: [{
        field: 'messages',
        value: {
          statuses: [{
            id: messageId,
            status: status,
            timestamp: timestamp || Math.floor(Date.now() / 1000),
            recipient_id: recipient_id
          }]
        }
      }]
    }]
  };
  
  // Import and call webhook handler
  import('../../controllers/backend/webhook.controller').then(({ WebhookController }) => {
    const mockReq = { body: webhookPayload } as any;
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log('Webhook test result:', data);
          res.json({ success: true, message: 'Webhook test completed', result: data });
        }
      })
    } as any;
    
    WebhookController.handleWebhook(mockReq, mockRes);
  });
});

export default router;
