import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { MRData } from '../types';
import { formatPhoneNumber, isValidPhoneNumber } from '../utils/helpers';
import logger from '../utils/logger';

export class ExcelService {
  parseFile(filePath: string): MRData[] {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      return this.parseCSVFile(filePath);
    } else {
      return this.parseExcelFile(filePath);
    }
  }

  parseCSVFile(filePath: string): MRData[] {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data: MRData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Map to expected format - handle various header formats
        data.push({
          mrId: row['mr id'] || row.mrid || row.id || `MR${i}`,
          firstName: row['first name'] || row.firstname || row.fname || '',
          lastName: row['last name'] || row.lastname || row.lname || '',
          groupName: row['group'] || row.groupname || row.group || '',
          marketingManager: row['marketing manager'] || row.marketingmanager || row.manager || 'Default Manager', // Default value
          phone: formatPhoneNumber(row.phone || ''),
          email: row.email || '',
          address: row.address || '',
          comments: row.comments || '',
        });
      }
      
      return data;
    } catch (error) {
      logger.error('Failed to parse CSV file', { filePath, error });
      throw new Error('Failed to parse CSV file');
    }
  }

  parseExcelFile(filePath: string): MRData[] {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
      
      return jsonData.map((row, index) => {
        // Normalize headers (remove spaces, convert to camelCase)
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.trim().toLowerCase()
            .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, '');
          normalizedRow[normalizedKey] = row[key];
        });
        
        // Map to expected format - handle various header formats
        return {
          mrId: normalizedRow.mrid || normalizedRow.id || `MR${index + 1}`,
          firstName: normalizedRow.firstname || normalizedRow.fname || '',
          lastName: normalizedRow.lastname || normalizedRow.lname || '',
          groupName: normalizedRow.groupname || normalizedRow.group || '',
          marketingManager: normalizedRow.marketingmanager || normalizedRow.manager || 'Default Manager', // Default value
          phone: formatPhoneNumber(normalizedRow.phone || ''),
          email: normalizedRow.email || '',
          address: normalizedRow.address || '',
          comments: normalizedRow.comments || '',
        };
      });
    } catch (error) {
      logger.error('Failed to parse Excel file', { filePath, error });
      throw new Error('Failed to parse Excel file');
    }
  }

  validateMRData(data: MRData[]): { valid: MRData[]; errors: string[] } {
    const valid: MRData[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      
      if (!row.mrId || row.mrId.trim() === '') {
        rowErrors.push(`Row ${index + 1}: MR ID is required`);
      }
      if (!row.firstName || row.firstName.trim() === '') {
        rowErrors.push(`Row ${index + 1}: First Name is required`);
      }
      if (!row.lastName || row.lastName.trim() === '') {
        rowErrors.push(`Row ${index + 1}: Last Name is required`);
      }
      if (!row.groupName || row.groupName.trim() === '') {
        rowErrors.push(`Row ${index + 1}: Group Name is required`);
      }
      if (!row.marketingManager || row.marketingManager.trim() === '') {
        rowErrors.push(`Row ${index + 1}: Marketing Manager is required`);
      }
      if (!row.phone || row.phone.trim() === '') {
        rowErrors.push(`Row ${index + 1}: Phone number is required`);
      } else if (!isValidPhoneNumber(row.phone)) {
        rowErrors.push(`Row ${index + 1}: Invalid phone number format (${row.phone}). Expected format: +91XXXXXXXXXX`);
      }
      
      if (rowErrors.length === 0) {
        valid.push(row);
      } else {
        errors.push(...rowErrors);
      }
    });

    // Log validation results for debugging
    logger.info('MR Data Validation Results', {
      totalRows: data.length,
      validRows: valid.length,
      errorRows: errors.length,
      errors: errors.slice(0, 5) // Log first 5 errors
    });

    return { valid, errors };
  }

  generateExcelTemplate(): Buffer {
    const templateData = [
      {
        'MR ID': 'MR001',
        'First Name': 'John',
        'Last Name': 'Doe',
        'Group': 'North Zone',
        'Phone': '+919876543210',
        'Comments': 'Senior MR'
      },
      {
        'MR ID': 'MR002',
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Group': 'South Zone',
        'Phone': '+919876543211',
        'Comments': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MR Template');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generateCSVTemplate(): string {
    const headers = ['MR ID', 'First Name', 'Last Name', 'Group', 'Phone', 'Comments'];
    const sampleData = [
      ['MR001', 'John', 'Doe', 'North Zone', '+919876543210', 'Senior MR'],
      ['MR002', 'Jane', 'Smith', 'South Zone', '+919876543211', '']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
}