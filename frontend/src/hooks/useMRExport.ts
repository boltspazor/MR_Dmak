import { useCallback } from 'react';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { Contact } from '../types/mr.types';

interface UseMRExportProps {
  contacts: Contact[];
}

export const useMRExport = ({ contacts }: UseMRExportProps) => {
  const exportContactsToCSV = useCallback(() => {
    console.log('Exporting contacts:', contacts);
    
    // Create CSV content with proper escaping
    const csvContent = [
      'MR ID,First Name,Last Name,Phone,Group,Consent Status,Comments',
      ...contacts.map(contact => {
        console.log('Processing contact:', contact);
        // Escape CSV values properly
        const escapeCsvValue = (value: string | undefined) => {
          if (!value) return '';
          // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        // Format phone number to preserve international format and prevent scientific notation
        const formatPhoneNumber = (phone: string) => {
          if (!phone) return '';
          
          console.log('Original phone:', phone, 'Type:', typeof phone);
          
          // Convert to string if it's not already
          const phoneStr = String(phone);
          
          // Try to parse as international phone number
          try {
            if (isValidPhoneNumber(phoneStr)) {
              const parsed = parsePhoneNumber(phoneStr);
              const formatted = parsed.format('E.164');
              console.log('Parsed international phone:', formatted);
              return `"${formatted}"`;
            }
          } catch (error) {
            console.log('Failed to parse as international number:', error);
          }
          
          // Fallback: clean and quote the phone number
          const cleaned = phoneStr.replace(/[^\d+]/g, '');
          console.log('Cleaned phone:', cleaned);
          
          // Always wrap phone numbers in quotes to prevent Excel from treating as number
          const formatted = `"${cleaned}"`;
          console.log('Formatted phone:', formatted);
          
          return formatted;
        };

        const row = [
          escapeCsvValue(contact.mrId),
          escapeCsvValue(contact.firstName),
          escapeCsvValue(contact.lastName),
          formatPhoneNumber(contact.phone),
          escapeCsvValue(contact.group),
          escapeCsvValue(contact.consentStatus || 'not_requested'),
          escapeCsvValue(contact.comments || '')
        ].join(',');
        
        console.log('CSV row:', row);
        
        return row;
      })
    ].join('\n');

    console.log('Complete CSV content:', csvContent);

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mr_contacts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [contacts]);

  const exportContactsToPDF = useCallback(() => {
    // Simple PDF generation using browser's print functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>MR Contacts Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h1>MR Contacts Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Showing ${contacts.length} MRs</p>
            <table>
              <thead>
                <tr>
                  <th>MR ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Group</th>
                  <th>Consent Status</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                ${contacts.map(contact => `
                  <tr>
                    <td>${contact.mrId}</td>
                    <td>${contact.firstName} ${contact.lastName}</td>
                    <td>${contact.phone}</td>
                    <td>${contact.group}</td>
                    <td>${contact.consentStatus || 'not_requested'}</td>
                    <td>${contact.comments || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(tableContent);
      printWindow.document.close();
      printWindow.print();
    }
  }, [contacts]);

  const downloadCSVTemplate = useCallback(() => {
    // Create simple template without naming
    const templateData = [
      ['mrId', 'firstName', 'lastName', 'phone', 'Group', 'Comments'],
      ['MR001', 'John', 'Doe', '"+919876543210"', 'Group A', 'Sample comment'],
      ['MR002', 'Jane', 'Smith', '"+919876543211"', 'Group B', '']
    ];

    const csvContent = templateData.map(row =>
      row.map(cell => {
        // Escape commas and quotes in CSV
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mr_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  return {
    exportContactsToCSV,
    exportContactsToPDF,
    downloadCSVTemplate
  };
};
