import Joi from 'joi';

export const schemas = {
  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      name: Joi.string().min(2).required(),
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    })
  },
  
  mr: {
    create: Joi.object({
      mrId: Joi.string().required(),
      firstName: Joi.string().min(2).required(),
      lastName: Joi.string().min(2).required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
      groupId: Joi.string().allow('', null),
      comments: Joi.string().allow('', null),
    }),
    update: Joi.object({
      mrId: Joi.string(),
      firstName: Joi.string().min(2),
      lastName: Joi.string().min(2),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      groupId: Joi.string(),
      comments: Joi.string().allow('', null),
    }),
    bulkUpload: Joi.array().items(
      Joi.object({
        mrId: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        groupName: Joi.string().required(),
        phone: Joi.string().required(),
        comments: Joi.string().allow('', null),
      })
    )
  },
  
  group: {
    create: Joi.object({
      groupName: Joi.string().min(2).required(),
      description: Joi.string().allow('', null),
    })
  },
  
  message: {
    send: Joi.object({
      content: Joi.string().min(1).max(1000).required(),
      targetGroups: Joi.array().items(Joi.string()).min(1).required(),
      imageUrl: Joi.string().uri().allow('', null),
      scheduledAt: Joi.date().allow(null),
    })
  },

  template: {
    create: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      content: Joi.string().min(1).max(10000).required(),
      type: Joi.string().valid('html', 'text', 'image').default('text'),
      parameters: Joi.array().items(Joi.string().min(1).max(50)).default([]),
      imageUrl: Joi.string().uri().allow('', null),
      imageFileName: Joi.string().allow('', null),
      footerImageUrl: Joi.string().uri().allow('', null),
      footerImageFileName: Joi.string().allow('', null),
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(100),
      content: Joi.string().min(1).max(10000),
      type: Joi.string().valid('html', 'text', 'image'),
      parameters: Joi.array().items(Joi.string().min(1).max(50)),
      imageUrl: Joi.string().uri().allow('', null),
      imageFileName: Joi.string().allow('', null),
      footerImageUrl: Joi.string().uri().allow('', null),
      footerImageFileName: Joi.string().allow('', null),
    })
  },

  consent: {
    create: Joi.object({
      phone_e164: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
        'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)'
      }),
      consented: Joi.boolean().required(),
      categories: Joi.array().items(
        Joi.string().valid('marketing', 'promotional', 'transactional', 'newsletter', 'updates', 'reminders')
      ).min(1).required(),
      channel: Joi.string().valid('web_form', 'whatsapp', 'sms', 'email', 'phone_call', 'in_person').required(),
      method: Joi.string().valid('checkbox', 'button_click', 'verbal', 'written', 'digital_signature').required(),
      consent_text_version: Joi.string().default('1.0'),
      ip_address: Joi.string().ip().optional(),
      device_fingerprint: Joi.string().optional(),
      evidence: Joi.object({
        form_submission_id: Joi.string().optional(),
        screenshot_url: Joi.string().uri().optional(),
        user_agent: Joi.string().optional(),
        referrer: Joi.string().uri().optional(),
        session_id: Joi.string().optional()
      }).optional(),
      business_name_shown: Joi.string().min(1).required(),
      captured_by: Joi.string().valid('system', 'admin', 'user', 'api').default('user'),
      data_processing_policy_version: Joi.string().default('1.0')
    }),
    optOut: Joi.object({
      phone_e164: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
        'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)'
      }),
      reason: Joi.string().max(500).optional(),
      method: Joi.string().valid('web_form', 'whatsapp', 'sms', 'email', 'phone_call', 'in_person').required()
    }),
    getStatus: Joi.object({
      phone_e164: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
        'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)'
      })
    }).unknown(true), // Allow additional properties for URL params
    list: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      consented: Joi.boolean().optional(),
      channel: Joi.string().valid('web_form', 'whatsapp', 'sms', 'email', 'phone_call', 'in_person').optional(),
      business_name: Joi.string().optional(),
      date_from: Joi.date().optional(),
      date_to: Joi.date().optional()
    })
  }
};