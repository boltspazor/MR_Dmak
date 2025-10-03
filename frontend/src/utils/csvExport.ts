/**
 * CSV Export utilities for generating downloadable CSV files from data arrays
 */

export interface CSVExportOptions {
  /** Custom filename for the downloaded CSV (without .csv extension) */
  filename?: string;
  /** Whether to include headers in the CSV */
  includeHeaders?: boolean;
  /** Custom headers to use instead of object keys */
  headers?: string[];
  /** Column delimiter (default: comma) */
  delimiter?: string;
}

/**
 * Converts an array of objects to CSV format and triggers download
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  options: CSVExportOptions = {}
): void => {
  const {
    filename = 'export',
    includeHeaders = true,
    headers,
    delimiter = ','
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data provided for CSV export');
    return;
  }

  // Get all unique keys from the data objects
  const allKeys = Array.from(
    new Set(
      data.flatMap((item) =>
        typeof item === 'object' && item !== null
          ? Object.keys(item)
          : []
      )
    )
  );

  if (allKeys.length === 0) {
    console.warn('No valid data keys found for CSV export');
    return;
  }

  // Determine headers to use
  const csvHeaders = headers || allKeys;

  // Create CSV content
  const csvContent = generateCSVContent(data, csvHeaders, includeHeaders, delimiter);

  // Create and trigger download
  downloadCSV(csvContent, `${filename}.csv`);
};

/**
 * Generates CSV content from data array
 */
const generateCSVContent = <T extends Record<string, any>>(
  data: T[],
  headers: string[],
  includeHeaders: boolean,
  delimiter: string
): string => {
  const lines: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    lines.push(headers.map(header => escapeCSVValue(header)).join(delimiter));
  }

  // Add data rows
  data.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      const row = headers.map((header) => {
        const value = getNestedValue(item, header);
        return escapeCSVValue(formatCSVValue(value));
      });
      lines.push(row.join(delimiter));
    }
  });

  return lines.join('\n');
};

/**
 * Gets nested value from object using dot notation (e.g., 'user.name')
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
};

/**
 * Formats a value for CSV output
 */
const formatCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    // Handle arrays and objects
    if (Array.isArray(value)) {
      return value.map(item =>
        typeof item === 'object' ? JSON.stringify(item) : String(item)
      ).join('; ');
    }
    return JSON.stringify(value);
  }

  return String(value);
};

/**
 * Escapes CSV values that contain special characters
 */
const escapeCSVValue = (value: string): string => {
  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Creates a downloadable CSV file from content
 */
const downloadCSV = (content: string, filename: string): void => {
  try {
    // Create blob with CSV content
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    // Add to DOM and trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating CSV download:', error);
    throw new Error('Failed to create CSV download');
  }
};

/**
 * Hook-compatible version that returns a function to trigger export
 */
export const createCSVExporter = <T extends Record<string, any>>(
  data: T[],
  options: CSVExportOptions = {}
) => {
  return () => exportToCSV(data, options);
};
