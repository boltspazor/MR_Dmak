// Shared CSV validation utilities for template recipient lists

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  templateName: string;
  templateParameters?: string[];
  mrs?: Array<{
    mrId: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface CleanRecipientData {
  mrId: string;
  firstName: string;
  lastName: string;
  email?: string;
  groupId?: string;
  parameters: Record<string, string>;
}

/**
 * Validates CSV data for template recipient lists
 * Used by both Campaigns and Template recipient upload components
 */
export const validateTemplateRecipientCSV = (
  csvData: string[][], 
  options: ValidationOptions
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { templateName, templateParameters = [], mrs = [] } = options;

  // Check if CSV has at least 3 rows (A1, A2, A3)
  if (csvData.length < 3) {
    errors.push('CSV file must have at least 3 rows (template name, parameters, and sample data)');
    return { isValid: false, errors, warnings };
  }

  // Use template name from CSV A1 cell instead of validating against expected name
  const csvTemplateName = csvData[0]?.[0]?.trim();
  if (!csvTemplateName) {
    errors.push('Template name is required in cell A1');
  }

  // Check row 2 (parameters row) for empty cells
  const parameterRow = csvData[1];
  if (parameterRow) {
    for (let i = 0; i < parameterRow.length; i++) {
      if (parameterRow[i]?.trim() === '') {
        errors.push(`Parameter row (row 2) has empty cell in column ${String.fromCharCode(65 + i)}2`);
      }
    }
  }

  // Check data rows (starting from row 3) for empty cells
  for (let rowIndex = 2; rowIndex < csvData.length; rowIndex++) {
    const row = csvData[rowIndex];
    if (row) {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        if (row[colIndex]?.trim() === '') {
          errors.push(`Data row ${rowIndex + 1} has empty cell in column ${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`);
        }
      }
    }
  }

  // Validate template parameters match CSV parameters
  if (templateParameters.length > 0 && parameterRow) {
    // Extract parameters from CSV (skip first 3 columns: MR ID, First Name, Last Name)
    const csvParameters = parameterRow.slice(0, 3).concat(parameterRow.slice(3).filter(param => param.trim() !== ''));

    // Check if all template parameters are present in CSV
    const missingParameters = templateParameters.filter(templateParam =>
      !csvParameters.slice(3).some(csvParam => csvParam === templateParam)
    );

    if (missingParameters.length > 0) {
      errors.push(`Missing parameters in recipient list: ${missingParameters.join(', ')}. These parameters are required based on the template content.`);
    }

    // Check if CSV has extra parameters not in template
    const extraParameters = csvParameters.slice(3).filter(csvParam =>
      !templateParameters.includes(csvParam)
    );

    if (extraParameters.length > 0) {
      errors.push(`Extra parameters in recipient list: ${extraParameters.join(', ')}. These parameters are not used in the template content.`);
    }
  }

  // Validate recipients exist in global MR list (if MRs provided)
  if (mrs.length > 0) {
    const invalidRecipients: string[] = [];
    const validRecipients: string[] = [];
    
    for (let rowIndex = 2; rowIndex < csvData.length; rowIndex++) {
      const row = csvData[rowIndex];
      if (row && row.length >= 3) {
        const mrId = row[0]?.trim();
        const firstName = row[1]?.trim();
        const lastName = row[2]?.trim();

        // Check if MR exists in global MR list
        const mrExists = mrs.find(mr =>
          mr.mrId?.toLowerCase() === mrId?.toLowerCase() &&
          mr.firstName?.toLowerCase() === firstName?.toLowerCase() &&
          mr.lastName?.toLowerCase() === lastName?.toLowerCase()
        );

        const recipientKey = `${mrId} - ${firstName} ${lastName}`;
        if (!mrExists) {
          invalidRecipients.push(recipientKey);
        } else {
          validRecipients.push(recipientKey);
        }
      }
    }

    if (invalidRecipients.length > 0) {
      warnings.push(`Warning: ${invalidRecipients.length} recipients not found in global MR list: ${invalidRecipients.slice(0, 5).join(', ')}${invalidRecipients.length > 5 ? ` and ${invalidRecipients.length - 5} more` : ''}. These will be skipped.`);
    }

    if (validRecipients.length > 0) {
      warnings.push(`Info: ${validRecipients.length} recipients found in global MR list and will be processed.`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Extracts template parameters from template content
 */
export const extractTemplateParameters = (content: string): string[] => {
  const paramMatches = content.match(/\{\{([A-Za-z0-9_\s]+)\}\}/g);
  if (paramMatches) {
    return [...new Set(paramMatches.map((param: string) => {
      const paramName = param.replace(/\{\{|\}\}/g, '');
      // Convert numeric parameters to param1, param2, etc.
      if (/^\d+$/.test(paramName)) {
        return `param${paramName}`;
      }
      return paramName;
    }))];
  }
  return [];
};

/**
 * Extracts clean JSON data from CSV for template recipients
 * Simplified version - just parses CSV, no MR validation (done in backend)
 */
export const extractCleanRecipientData = (
  csvData: string[][],
  templateParameters: string[]
): { recipients: CleanRecipientData[]; errors: string[] } => {
  const errors: string[] = [];
  const recipients: CleanRecipientData[] = [];

  // Skip header rows (template name and column headers)
  const dataRows = csvData.slice(2);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    if (row.length < 4) {
      errors.push(`Row ${i + 3}: Insufficient data (need at least MR ID, First Name, Last Name)`);
      continue;
    }

    const mrId = row[0]?.trim();
    const firstName = row[1]?.trim();
    const lastName = row[2]?.trim();

    if (!mrId || !firstName || !lastName) {
      errors.push(`Row ${i + 3}: Missing required fields (MR ID, First Name, Last Name)`);
      continue;
    }

    // Extract parameters (starting from column 4)
    const parameters: Record<string, string> = {};
    for (let j = 0; j < templateParameters.length; j++) {
      const paramName = templateParameters[j];
      const paramValue = row[j + 3]?.trim() || '';
      if (paramValue) {
        parameters[paramName] = paramValue;
      }
    }

    recipients.push({
      mrId,
      firstName,
      lastName,
      parameters
    });
  }

  return { recipients, errors };
};

/**
 * Helper function to reconstruct CSV from clean recipient data
 * This can be used if frontend needs to export/display CSV format
 */
export const reconstructCSV = (
  recipients: CleanRecipientData[],
  templateName: string,
  templateParameters: string[]
): string => {
  // Create header rows matching the downloaded template format
  const headerRow1 = [templateName, 'MR ID', 'First Name', 'Last Name', ...templateParameters];
  const headerRow2 = ['TemplateName', 'MR ID', 'First Name', 'Last Name', ...templateParameters];
  
  // Create data rows
  const dataRows = recipients.map(recipient => [
    templateName,
    recipient.mrId,
    recipient.firstName,
    recipient.lastName,
    ...templateParameters.map(param => recipient.parameters[param] || '')
  ]);
  
  // Combine all rows
  const allRows = [headerRow1, headerRow2, ...dataRows];
  
  // Convert to CSV format
  return allRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
};

/**
 * Helper function to escape CSV values
 */
export const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};
