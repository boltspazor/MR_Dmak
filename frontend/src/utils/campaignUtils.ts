import { extractTemplateParameters, escapeCSV } from './csvValidation';

export const downloadTemplateCSV = (template: any) => {
  // Extract parameters from template content using shared utility
  const parameters = extractTemplateParameters(template.content);
  
  // Create CSV with template name in A1 and dynamic parameters
  const csvRows = [];
  
  // Row 1: Template name in A1
  const row1 = [template.name, ...Array(Math.max(parameters.length + 2, 10)).fill('')];
  csvRows.push(row1.map(escapeCSV).join(','));
  
  // Row 2: MR ID in A2, First Name, Last Name, then parameters
  const row2 = ['MR ID', 'First Name', 'Last Name', ...parameters];
  csvRows.push(row2.map(escapeCSV).join(','));
  
  // Row 3: Sample data
  const sampleData = {
    'FirstName': 'John',
    'LastName': 'Doe',
    'MRId': 'MR001',
    'GroupName': 'North Zone',
    'PhoneNumber': '+919876543210',
    'Name': 'John Doe',
    'Company': 'D-MAK',
    'Product': 'New Product',
    'Product Name': 'New Product',
    'Date': new Date().toLocaleDateString(),
    'Time': new Date().toLocaleTimeString(),
    'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
    'Year': new Date().getFullYear().toString(),
    'Target': '100',
    'Achievement': '85',
    'Location': 'Mumbai',
    'City': 'Mumbai',
    'State': 'Maharashtra',
    'Country': 'India',
    'FN': 'John',
    'LN': 'Doe',
    'week': 'Week 2',
    'lastmonth': '50 lakhs',
    'doctor': '30',
    'Phone Number': '+919876543210',
    'Group Name': 'North Zone',
    'Target Amount': '100000',
    'Sales Amount': '85000'
  };
  
  const row3 = ['MR001', 'John', 'Doe', ...parameters.map(param => (sampleData as Record<string, string>)[param] || `Sample ${param}`)];
  csvRows.push(row3.map(escapeCSV).join(','));
  
  const csvContent = csvRows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.replace(/\s+/g, '_')}_recipient_list_format.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const cleanErrorMessage = (message: string): string => {
  return message
    .replace(/app\.railway\.app/gi, 'D-MAK')
    .replace(/railway\.app/gi, 'D-MAK')
    .replace(/\.railway\./gi, ' D-MAK ')
    .replace(/mrbackend-production-[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
    .replace(/https?:\/\/[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
    .replace(/production-[a-zA-Z0-9-]+\.up/gi, 'D-MAK')
    .replace(/\b[a-zA-Z0-9-]+\.up\.railway\.app\b/gi, 'D-MAK server')
    .replace(/\s+/g, ' ')
    .replace(/D-MAK\s+server/gi, 'D-MAK server')
    .trim();
};
