import * as XLSX from 'xlsx';
import { MRData } from '../types';
import { formatPhoneNumber, isValidPhoneNumber } from '../utils/helpers';
import logger from '../utils/logger';

export class ExcelService {
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
        
        // Map to expected format
        return {
          mrId: normalizedRow.mrid || normalizedRow.id || `MR${index + 1}`,
          firstName: normalizedRow.firstname || normalizedRow.fname || '',
          lastName: normalizedRow.lastname || normalizedRow.lname || '',
          groupName: normalizedRow.groupname || normalizedRow.group || '',
          phone: formatPhoneNumber(normalizedRow.phone || ''),
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
      
      if (!row.mrId) rowErrors.push(`Row ${index + 1}: MR ID is required`);
      if (!row.firstName) rowErrors.push(`Row ${index + 1}: First Name is required`);
      if (!row.lastName) rowErrors.push(`Row ${index + 1}: Last Name is required`);
      if (!row.groupName) rowErrors.push(`Row ${index + 1}: Group Name is required`);
      if (!row.phone || !isValidPhoneNumber(row.phone)) {
        rowErrors.push(`Row ${index + 1}: Valid phone number is required`);
      }
      
      if (rowErrors.length === 0) {
        valid.push(row);
      } else {
        errors.push(...rowErrors);
      }
    });

    return { valid, errors };
  }

  generateExcelTemplate(): Buffer {
    const templateData = [
      {
        'MR ID': 'MR001',
        'First Name': 'John',
        'Last Name': 'Doe',
        'Group Name': 'North Region',
        'Phone': '+919876543210',
        'Comments': 'Sample MR data'
      },
      {
        'MR ID': 'MR002',
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Group Name': 'South Region',
        'Phone': '+919876543211',
        'Comments': 'Another sample'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MR Template');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}