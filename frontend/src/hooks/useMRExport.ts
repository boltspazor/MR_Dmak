import { useCallback } from 'react';
import { Contact } from '../types/mr.types';

interface UseMRExportProps {
  contacts: Contact[];
}

export const useMRExport = ({ contacts }: UseMRExportProps) => {
  const exportContactsToCSV = useCallback(() => {
    const csvContent = [
      'MR ID,First Name,Last Name,Phone,Group,Consent Status,Comments',
      ...contacts.map(contact =>
        `${contact.mrId},${contact.firstName},${contact.lastName},${contact.phone},${contact.group},${contact.consentStatus || 'not_requested'},${contact.comments || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mr_contacts.csv';
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
      ['MR001', 'John', 'Doe', '+919876543210', 'Group A', 'Sample comment'],
      ['MR002', 'Jane', 'Smith', '+919876543211', 'Group B', '']
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

    const blob = new Blob([csvContent], { type: 'text/csv' });
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
