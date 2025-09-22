import { Request, Response } from 'express';
import { TemplateRecipients, MedicalRepresentative, Template } from '../models';
import logger from '../utils/logger';

export const uploadTemplateRecipients = async (req: Request, res: Response) => {
  try {
    const { templateId, name, description } = req.body;
    const csvFile = req.file;

    logger.info('Upload request received:', {
      templateId,
      name,
      userId: req.user?.userId,
      hasUser: !!req.user
    });

    if (!templateId || !name || !csvFile) {
      return res.status(400).json({
        success: false,
        error: 'Template ID, name, and CSV file are required'
      });
    }

    // Read and parse CSV file
    const csvContent = csvFile.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'CSV file must have at least 3 rows (template name, parameters, and sample data)'
      });
    }

    // Parse CSV data
    const csvData = lines.map(line => 
      line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );

    // Extract template name and parameters from CSV
    const csvTemplateName = csvData[0]?.[0];
    const parameterRow = csvData[1];
    const dataRows = csvData.slice(2);

    if (!csvTemplateName || !parameterRow || dataRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CSV format'
      });
    }

    // Get the template to understand its parameters
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Map parameter columns to template parameter names
    const parameterMapping: { [key: string]: string } = {};
    const templateParameters = template.parameters || [];
    
    // Map CSV parameter columns (starting from index 3) to template parameters
    for (let i = 0; i < templateParameters.length && i + 3 < parameterRow.length; i++) {
      const csvColumnName = parameterRow[i + 3]; // Skip: TemplateName, MR ID, First Name, Last Name
      const templateParamName = templateParameters[i];
      parameterMapping[csvColumnName] = templateParamName;
    }

    logger.info('Parameter mapping created', { 
      parameterMapping, 
      templateParameters,
      csvParameterColumns: parameterRow.slice(3)
    });

    // Use the name from request body (user input) instead of CSV template name
    const templateName = name;

    // Get all MRs for validation
    const allMrs = await MedicalRepresentative.find({});
    
    logger.info('MRs found for validation:', {
      count: allMrs.length,
      sampleMrs: allMrs.slice(0, 3).map(mr => ({
        mrId: mr.mrId,
        firstName: mr.firstName,
        lastName: mr.lastName
      }))
    });
    
    const validationResults = {
      validRecipients: [] as any[],
      invalidRecipients: [] as any[],
      errors: [] as string[]
    };

    // Validate each recipient
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row.length < 3) {
        validationResults.errors.push(`Row ${i + 3}: Insufficient data (need at least MR ID, First Name, Last Name)`);
        continue;
      }

      const mrId = row[0];
      const firstName = row[1];
      const lastName = row[2];

      logger.info('Validating recipient:', {
        row: i + 3,
        mrId,
        firstName,
        lastName
      });

      // Check if MR exists in global MR list
      const mrExists = allMrs.find(mr => 
        mr.mrId?.toLowerCase() === mrId?.toLowerCase() &&
        mr.firstName?.toLowerCase() === firstName?.toLowerCase() &&
        mr.lastName?.toLowerCase() === lastName?.toLowerCase()
      );

      logger.info('MR validation result:', {
        mrId,
        found: !!mrExists,
        matchedMR: mrExists ? {
          mrId: mrExists.mrId,
          firstName: mrExists.firstName,
          lastName: mrExists.lastName
        } : null
      });

      if (!mrExists) {
        validationResults.invalidRecipients.push({
          row: i + 3,
          mrId,
          firstName,
          lastName,
          reason: 'MR not found in global MR list'
        });
        continue;
      }

      // Create recipient data object
      const recipientData: any = {
        mrId,
        firstName,
        lastName,
        phone: mrExists.phone,
        email: mrExists.email,
        group: mrExists.groupId
      };

      // Add parameter values using the mapping
      for (let j = 3; j < Math.min(row.length, parameterRow.length); j++) {
        const csvColumnName = parameterRow[j];
        const templateParamName = parameterMapping[csvColumnName];
        if (templateParamName && row[j]) {
          recipientData[templateParamName] = row[j] || '';
        }
      }

      validationResults.validRecipients.push(recipientData);
    }

    // If there are validation errors, return them
    if (validationResults.errors.length > 0 || validationResults.invalidRecipients.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationResults
      });
    }

    // Check if recipient list with same name already exists for this template
    const existingList = await TemplateRecipients.findOne({
      templateId,
      name,
      createdBy: req.user?.userId,
      isActive: true
    });

    if (existingList) {
      return res.status(400).json({
        success: false,
        error: 'A recipient list with this name already exists for this template'
      });
    }

    // Create template recipients list with mapped column names
    const mappedColumns = [
      ...parameterRow.slice(0, 3), // Keep: TemplateName, MR ID, First Name, Last Name
      ...templateParameters // Add: param1, param2, etc.
    ];

    const templateRecipients = new TemplateRecipients({
      templateId,
      name,
      description: description || '',
      columns: mappedColumns,
      data: validationResults.validRecipients,
      createdBy: req.user?.userId,
      isActive: true
    });

    await templateRecipients.save();

    logger.info('✅ Template recipients uploaded successfully', {
      templateId,
      name,
      recipientCount: validationResults.validRecipients.length,
      createdBy: req.user?.userId
    });

    res.status(201).json({
      success: true,
      message: 'Recipients uploaded successfully',
      data: {
        id: templateRecipients._id,
        name: templateRecipients.name,
        recipientCount: validationResults.validRecipients.length,
        columns: templateRecipients.columns
      }
    });

  } catch (error) {
    logger.error('❌ Error uploading template recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload recipients'
    });
  }
};

export const getTemplateRecipients = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const recipients = await TemplateRecipients.find({
      templateId,
      isActive: true
    }).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: recipients
    });

  } catch (error) {
    logger.error('❌ Error fetching template recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipients'
    });
  }
};

export const deleteTemplateRecipients = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recipients = await TemplateRecipients.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!recipients) {
      return res.status(404).json({
        success: false,
        error: 'Recipient list not found'
      });
    }

    logger.info('✅ Template recipients deleted successfully', {
      id,
      deletedBy: req.user?.userId
    });

    res.json({
      success: true,
      message: 'Recipient list deleted successfully'
    });

  } catch (error) {
    logger.error('❌ Error deleting template recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete recipient list'
    });
  }
};

/**
 * Upload template recipients using clean JSON data
 * This is the new, cleaner approach
 */
export const uploadTemplateRecipientsV2 = async (req: Request, res: Response) => {
  try {
    const { templateId, name, description, recipients } = req.body;

    logger.info('Upload V2 request received:', {
      templateId,
      name,
      description,
      recipientsCount: recipients?.length || 0
    });

    if (!templateId || !name || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: 'Template ID, name, and recipients array are required'
      });
    }

    // Get the template to validate parameters
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const templateParameters = template.parameters || [];
    logger.info('Template parameters:', { templateParameters });

    // Validate recipients data
    const validationErrors: string[] = [];
    const validRecipients: any[] = [];

    // Get all MRs for validation (more efficient than individual queries)
    const allMrs = await MedicalRepresentative.find({}).select('mrId firstName lastName phone email groupId');
    const mrMap = new Map(allMrs.map(mr => [mr.mrId.toLowerCase(), mr]));

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Validate required fields
      if (!recipient.mrId || !recipient.firstName || !recipient.lastName) {
        validationErrors.push(`Recipient ${i + 1}: Missing required fields (mrId, firstName, lastName)`);
        continue;
      }

      // Validate MR exists using case-insensitive lookup
      const mr = mrMap.get(recipient.mrId.toLowerCase());
      if (!mr) {
        validationErrors.push(`Recipient ${i + 1}: MR not found (${recipient.mrId})`);
        continue;
      }

      // Validate name match (case-insensitive)
      if (mr.firstName.toLowerCase() !== recipient.firstName.toLowerCase() || 
          mr.lastName.toLowerCase() !== recipient.lastName.toLowerCase()) {
        validationErrors.push(`Recipient ${i + 1}: Name mismatch for MR ${recipient.mrId}. Expected: ${mr.firstName} ${mr.lastName}, Got: ${recipient.firstName} ${recipient.lastName}`);
        continue;
      }

      // Validate parameters match template
      const recipientParams = recipient.parameters || {};
      const missingParams = templateParameters.filter(param => !recipientParams[param]);
      if (missingParams.length > 0) {
        validationErrors.push(`Recipient ${i + 1}: Missing parameters: ${missingParams.join(', ')}`);
        continue;
      }

      validRecipients.push({
        mrId: mr.mrId, // Use the actual MR ID from database
        firstName: mr.firstName,
        lastName: mr.lastName,
        phone: mr.phone, // Use phone from database
        email: mr.email,
        groupId: mr.groupId,
        parameters: recipientParams
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors
      });
    }

    // Check if recipient list with same name already exists
    const existingList = await TemplateRecipients.findOne({
      templateId,
      name,
      createdBy: req.user?.userId,
      isActive: true
    });

    if (existingList) {
      return res.status(400).json({
        success: false,
        error: 'A recipient list with this name already exists for this template'
      });
    }

    // Create template recipients list
    const templateRecipients = new TemplateRecipients({
      templateId,
      name,
      description: description || '',
      recipients: validRecipients,
      createdBy: req.user?.userId,
      isActive: true
    });

    await templateRecipients.save();

    logger.info('✅ Template recipients uploaded successfully (V2)', {
      templateId,
      name,
      recipientsCount: validRecipients.length
    });

    res.json({
      success: true,
      message: 'Template recipients uploaded successfully',
      data: {
        id: templateRecipients._id,
        name: templateRecipients.name,
        recipientsCount: validRecipients.length
      }
    });
  } catch (error) {
    logger.error('Error uploading template recipients (V2):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload template recipients'
    });
  }
};
