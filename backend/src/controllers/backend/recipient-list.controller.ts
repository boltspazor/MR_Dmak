import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import RecipientList, { IRecipientList } from '../../models/RecipientList';
import { TemplateRecipients, MedicalRepresentative, Template } from '../../models';
import logger from '../../utils/logger';

export class RecipientListController {
  // ===== REGULAR RECIPIENT LISTS FUNCTIONALITY =====

  // Get all recipient lists for a user
  async getRecipientLists(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.userId;
      
      const recipientLists = await RecipientList.find({ 
        createdBy: userId, 
        isActive: true 
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: recipientLists,
        message: 'Recipient lists retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching recipient lists:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch recipient lists' 
      });
    }
  }

  // Get a specific recipient list
  async getRecipientList(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const recipientList = await RecipientList.findOne({ 
        _id: id, 
        createdBy: userId, 
        isActive: true 
      });

      if (!recipientList) {
        return res.status(404).json({ 
          success: false, 
          error: 'Recipient list not found' 
        });
      }

      return res.json({
        success: true,
        data: recipientList,
        message: 'Recipient list retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching recipient list:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch recipient list' 
      });
    }
  }

  // Create a new recipient list
  async createRecipientList(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.userId;
      const { name, description, columns, data } = req.body;

      // Check if recipient list name already exists
      const existingList = await RecipientList.findOne({ 
        name: name.trim(),
        createdBy: userId,
        isActive: true 
      });

      if (existingList) {
        return res.status(400).json({ 
          success: false, 
          error: 'Recipient list name already exists'
        });
      }

      const recipientListData: any = {
        name: name.trim(),
        description: description?.trim() || '',
        columns: columns || [],
        data: data || [],
        createdBy: userId
      };

      const recipientList = new RecipientList(recipientListData);
      await recipientList.save();

      logger.info('Recipient list created successfully', { 
        recipientListId: recipientList._id,
        createdBy: userId 
      });

      return res.status(201).json({
        success: true,
        data: recipientList,
        message: 'Recipient list created successfully'
      });
    } catch (error) {
      logger.error('Error creating recipient list:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create recipient list' 
      });
    }
  }

  // Update a recipient list
  async updateRecipientList(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { name, description, columns, data } = req.body;

      const recipientList = await RecipientList.findOne({ 
        _id: id, 
        createdBy: userId, 
        isActive: true 
      });

      if (!recipientList) {
        return res.status(404).json({ 
          success: false, 
          error: 'Recipient list not found' 
        });
      }

      // Check if new name conflicts with existing lists (excluding current one)
      if (name && name.trim() !== recipientList.name) {
        const existingList = await RecipientList.findOne({ 
          name: name.trim(),
          createdBy: userId,
          isActive: true,
          _id: { $ne: id }
        });

        if (existingList) {
          return res.status(400).json({ 
          success: false, 
          error: 'Recipient list name already exists'
          });
        }
      }

      // Update fields
      if (name) recipientList.name = name.trim();
      if (description !== undefined) recipientList.description = description.trim();
      if (columns) recipientList.columns = columns;
      if (data) recipientList.data = data;

      await recipientList.save();

      logger.info('Recipient list updated successfully', { 
        recipientListId: recipientList._id,
        updatedBy: userId 
      });

      return res.json({
        success: true,
        data: recipientList,
        message: 'Recipient list updated successfully'
      });
    } catch (error) {
      logger.error('Error updating recipient list:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update recipient list' 
      });
    }
  }

  // Delete a recipient list
  async deleteRecipientList(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const recipientList = await RecipientList.findOne({ 
        _id: id, 
        createdBy: userId, 
        isActive: true 
      });

      if (!recipientList) {
        return res.status(404).json({ 
          success: false, 
          error: 'Recipient list not found' 
        });
      }

      // Soft delete
      recipientList.isActive = false;
      await recipientList.save();

      logger.info('Recipient list deleted successfully', { 
        recipientListId: recipientList._id,
        deletedBy: userId 
      });

      return res.json({
        success: true,
        message: 'Recipient list deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting recipient list:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete recipient list' 
      });
    }
  }

  // Upload recipient list from CSV
  async uploadRecipientList(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.userId;
      const { name, description, csvData } = req.body;

      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid CSV data provided' 
        });
      }

      // Extract columns from first row
      const columns = csvData[0];
      const data = csvData.slice(1).map(row => {
        const rowData: Record<string, any> = {};
        columns.forEach((column: string, index: number) => {
          rowData[column] = row[index] || '';
        });
        return rowData;
      });

      // Check if recipient list name already exists
      const existingList = await RecipientList.findOne({ 
        name: name.trim(),
        createdBy: userId,
        isActive: true 
      });

      if (existingList) {
        return res.status(400).json({ 
          success: false, 
          error: 'Recipient list name already exists'
        });
      }

      const recipientListData: any = {
        name: name.trim(),
        description: description?.trim() || '',
        columns: columns,
        data: data,
        createdBy: userId
      };

      const recipientList = new RecipientList(recipientListData);
      await recipientList.save();

      logger.info('Recipient list uploaded successfully', { 
        recipientListId: recipientList._id,
        createdBy: userId,
        recordCount: data.length
      });

      return res.status(201).json({
        success: true,
        data: recipientList,
        message: `Recipient list uploaded successfully with ${data.length} records`
      });
    } catch (error) {
      logger.error('Error uploading recipient list:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to upload recipient list' 
      });
    }
  }

  // Get available parameters from recipient lists
  async getAvailableParameters(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.userId;
      
      const recipientLists = await RecipientList.find({ 
        createdBy: userId, 
        isActive: true 
      });

      // Extract all unique columns that start with #
      const allColumns = recipientLists.flatMap(list => list.columns);
      const parameterColumns = [...new Set(allColumns.filter(col => col.startsWith('#')))];

      return res.json({
        success: true,
        data: {
          parameters: parameterColumns,
          recipientLists: recipientLists.map(list => ({
            _id: list._id,
            name: list.name,
            columns: list.columns,
            recordCount: list.data.length
          }))
        },
        message: 'Available parameters retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching available parameters:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch available parameters' 
      });
    }
  }

  // ===== TEMPLATE RECIPIENTS FUNCTIONALITY =====

  /**
   * Upload template recipients from CSV
   */
  async uploadTemplateRecipients(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId, name, description } = req.body;
      const csvFile = req.file;

      logger.info('Upload request received:', {
        templateId,
        name,
        userId: (req as AuthenticatedRequest).user?.userId,
        hasUser: !!(req as AuthenticatedRequest).user
      });

      if (!templateId || !name || !csvFile) {
        return res.status(400).json({
          success: false,
          error: 'Template ID, name, and CSV file are required'
        });
      }

      // Read and parse CSV file
      const csvContent = csvFile?.buffer.toString('utf-8');
      const lines = csvContent?.split('\n').filter(line => line.trim()) || [];
      
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
      const templateParameters = template?.parameters || [];
      
      // Map CSV parameter columns (starting from index 3) to template parameters
      for (let i = 0; i < templateParameters.length && i + 3 < parameterRow.length; i++) {
        const csvColumnName = parameterRow[i + 3]; // Skip: TemplateName, MR ID, First Name, Last Name
        const templateParam = templateParameters[i];
        const templateParamName = typeof templateParam === 'string' ? templateParam : templateParam.name;
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
        createdBy: (req as AuthenticatedRequest).user?.userId,
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
        createdBy: (req as AuthenticatedRequest).user?.userId,
        isActive: true
      });

      await templateRecipients.save();

      logger.info('✅ Template recipients uploaded successfully', {
        templateId,
        name,
        recipientCount: validationResults.validRecipients.length,
        createdBy: (req as AuthenticatedRequest).user?.userId
      });

      return res.status(201).json({
        success: true,
        message: 'Recipients uploaded successfully',
        data: {
          id: templateRecipients._id,
          name: templateRecipients.name,
          recipientCount: validationResults.validRecipients.length,
          columns: (templateRecipients as any).columns
        }
      });

    } catch (error) {
      logger.error('❌ Error uploading template recipients:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload recipients'
      });
    }
  }

  /**
   * Get template recipients for a specific template
   */
  async getTemplateRecipients(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;

      const recipients = await TemplateRecipients.find({
        templateId,
        isActive: true
      }).populate('createdBy', 'name email');

      return res.json({
        success: true,
        data: recipients
      });

    } catch (error) {
      logger.error('❌ Error fetching template recipients:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recipients'
      });
    }
  }

  /**
   * Delete template recipients
   */
  async deleteTemplateRecipients(req: Request, res: Response): Promise<Response> {
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
        deletedBy: (req as AuthenticatedRequest).user?.userId
      });

      return res.json({
        success: true,
        message: 'Recipient list deleted successfully'
      });

    } catch (error) {
      logger.error('❌ Error deleting template recipients:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete recipient list'
      });
    }
  }

  /**
   * Upload template recipients using clean JSON data (V2)
   */
  async uploadTemplateRecipientsV2(req: Request, res: Response): Promise<Response> {
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

      const templateParameters = template?.parameters || [];
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

        // Validate parameters match template (case-insensitive)
        const recipientParams = recipient.parameters || {};
        const missingParams = templateParameters.filter(param => {
          const paramName = typeof param === 'string' ? param : param.name;
          // Check for exact match first
          if (recipientParams[paramName]) return false;
          
          // Check for case-insensitive match
          const paramKey = Object.keys(recipientParams).find(key => 
            key.toLowerCase() === paramName.toLowerCase()
          );
          return !paramKey;
        });
        
        if (missingParams.length > 0) {
          validationErrors.push(`Recipient ${i + 1}: Missing parameters: ${missingParams.map(p => typeof p === 'string' ? p : p.name).join(', ')}`);
          continue;
        }

        // Normalize parameter keys to match template parameter names (lowercase)
        const normalizedParams: { [key: string]: any } = {};
        templateParameters.forEach(templateParam => {
          const paramName = typeof templateParam === 'string' ? templateParam : templateParam.name;
          // Find the matching parameter key (case-insensitive)
          const paramKey = Object.keys(recipientParams).find(key => 
            key.toLowerCase() === paramName.toLowerCase()
          ) || paramName;
          
          normalizedParams[paramName] = recipientParams[paramKey] || recipientParams[paramName];
        });

        validRecipients.push({
          mrId: mr.mrId, // Use the actual MR ID from database
          firstName: mr.firstName,
          lastName: mr.lastName,
          phone: mr.phone, // Use phone from database
          email: mr.email,
          groupId: mr.groupId,
          parameters: normalizedParams
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
        createdBy: (req as AuthenticatedRequest).user?.userId,
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
        createdBy: (req as AuthenticatedRequest).user?.userId,
        isActive: true
      });

      await templateRecipients.save();

      logger.info('✅ Template recipients uploaded successfully (V2)', {
        templateId,
        name,
        recipientsCount: validRecipients.length
      });

      return res.json({
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
      return res.status(500).json({
        success: false,
        error: 'Failed to upload template recipients'
      });
    }
  }
}

export default new RecipientListController();
