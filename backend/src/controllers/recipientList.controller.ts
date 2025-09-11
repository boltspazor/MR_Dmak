import { Request, Response } from 'express';
import RecipientList, { IRecipientList } from '../models/RecipientList';
import logger from '../utils/logger';

export class RecipientListController {
  // Get all recipient lists for a user
  async getRecipientLists(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      
      const recipientLists = await RecipientList.find({ 
        createdBy: userId, 
        isActive: true 
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: recipientLists,
        message: 'Recipient lists retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching recipient lists:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch recipient lists' 
      });
    }
  }

  // Get a specific recipient list
  async getRecipientList(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const recipientList = await RecipientList.findOne({ 
        _id: id, 
        createdBy: userId, 
        isActive: true 
      });

      if (!recipientList) {
        res.status(404).json({ 
          success: false, 
          error: 'Recipient list not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: recipientList,
        message: 'Recipient list retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching recipient list:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch recipient list' 
      });
    }
  }

  // Create a new recipient list
  async createRecipientList(req: Request, res: Response): Promise<void> {
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
        res.status(400).json({ 
          success: false, 
          error: 'Recipient list name already exists' 
        });
        return;
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

      res.status(201).json({
        success: true,
        data: recipientList,
        message: 'Recipient list created successfully'
      });
    } catch (error) {
      logger.error('Error creating recipient list:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create recipient list' 
      });
    }
  }

  // Update a recipient list
  async updateRecipientList(req: Request, res: Response): Promise<void> {
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
        res.status(404).json({ 
          success: false, 
          error: 'Recipient list not found' 
        });
        return;
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
          res.status(400).json({ 
            success: false, 
            error: 'Recipient list name already exists' 
          });
          return;
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

      res.json({
        success: true,
        data: recipientList,
        message: 'Recipient list updated successfully'
      });
    } catch (error) {
      logger.error('Error updating recipient list:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update recipient list' 
      });
    }
  }

  // Delete a recipient list
  async deleteRecipientList(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const recipientList = await RecipientList.findOne({ 
        _id: id, 
        createdBy: userId, 
        isActive: true 
      });

      if (!recipientList) {
        res.status(404).json({ 
          success: false, 
          error: 'Recipient list not found' 
        });
        return;
      }

      // Soft delete
      recipientList.isActive = false;
      await recipientList.save();

      logger.info('Recipient list deleted successfully', { 
        recipientListId: recipientList._id,
        deletedBy: userId 
      });

      res.json({
        success: true,
        message: 'Recipient list deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting recipient list:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete recipient list' 
      });
    }
  }

  // Upload recipient list from CSV
  async uploadRecipientList(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { name, description, csvData } = req.body;

      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid CSV data provided' 
        });
        return;
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
        res.status(400).json({ 
          success: false, 
          error: 'Recipient list name already exists' 
        });
        return;
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

      res.status(201).json({
        success: true,
        data: recipientList,
        message: `Recipient list uploaded successfully with ${data.length} records`
      });
    } catch (error) {
      logger.error('Error uploading recipient list:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload recipient list' 
      });
    }
  }

  // Get available parameters from recipient lists
  async getAvailableParameters(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      
      const recipientLists = await RecipientList.find({ 
        createdBy: userId, 
        isActive: true 
      });

      // Extract all unique columns that start with #
      const allColumns = recipientLists.flatMap(list => list.columns);
      const parameterColumns = [...new Set(allColumns.filter(col => col.startsWith('#')))];

      res.json({
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
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch available parameters' 
      });
    }
  }
}

export default new RecipientListController();
