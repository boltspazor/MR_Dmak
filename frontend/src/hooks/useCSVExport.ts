import { useCallback } from 'react';
import { exportToCSV, CSVExportOptions } from '../utils/csvExport';

/**
 * Generic CSV export hook that can be used with any list component
 */
export interface UseCSVExportProps<T extends Record<string, any>> {
  /** The data array to export */
  data: T[];
  /** Export configuration options */
  options?: CSVExportOptions;
}

/**
 * Custom hook for CSV export functionality
 * Can be used with any list component to export data as CSV
 *
 * @example
 * ```tsx
 * const MyListComponent = ({ items }) => {
 *   const { exportToCSV } = useCSVExport({
 *     data: items,
 *     options: {
 *       filename: 'my-list-export',
 *       headers: ['ID', 'Name', 'Email']
 *     }
 *   });
 *
 *   return (
 *     <button onClick={exportToCSV}>
 *       Export to CSV
 *     </button>
 *   );
 * };
 * ```
 */
export const useCSVExport = <T extends Record<string, any>>({
  data,
  options = {}
}: UseCSVExportProps<T>) => {

  const exportData = useCallback(() => {
    if (!data || data.length === 0) {
      console.warn('No data provided for CSV export');
      return;
    }

    exportToCSV(data, options);
  }, [data, options]);

  return {
    exportToCSV: exportData,
    /** Check if export is available (data exists) */
    canExport: data && data.length > 0
  };
};

/**
 * Hook for exporting data with custom column mapping
 * Useful when you want to export only specific fields or rename columns
 *
 * @example
 * ```tsx
 * const { exportToCSV } = useCSVExportWithMapping({
 *   data: users,
 *   columnMapping: {
 *     'id': 'User ID',
 *     'fullName': 'Full Name',
 *     'emailAddress': 'Email'
 *   },
 *   options: { filename: 'users' }
 * });
 * ```
 */
export interface CSVColumnMapping {
  [key: string]: string;
}

export const useCSVExportWithMapping = <T extends Record<string, any>>({
  data,
  columnMapping,
  options = {}
}: UseCSVExportProps<T> & { columnMapping: CSVColumnMapping }) => {

  const exportData = useCallback(() => {
    if (!data || data.length === 0) {
      console.warn('No data provided for CSV export');
      return;
    }

    // Transform data to include only mapped columns with custom headers
    const mappedData = data.map(item => {
      const mappedItem: Record<string, any> = {};

      Object.entries(columnMapping).forEach(([originalKey, headerName]) => {
        // Support nested properties (e.g., 'user.name')
        const value = getNestedValue(item, originalKey);
        mappedItem[headerName] = value;
      });

      return mappedItem;
    });

    exportToCSV(mappedData, {
      ...options,
      headers: Object.values(columnMapping)
    });
  }, [data, columnMapping, options]);

  return {
    exportToCSV: exportData,
    canExport: data && data.length > 0
  };
};

/**
 * Helper function to get nested value from object using dot notation
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
};
