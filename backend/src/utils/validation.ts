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
      groupId: Joi.string().required(),
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
      content: Joi.string().min(1).required(),
      targetGroups: Joi.array().items(Joi.string()).min(1).required(),
      imageUrl: Joi.string().uri().allow('', null),
      scheduledAt: Joi.date().min('now').allow(null),
    })
  }
};