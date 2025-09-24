import { useState } from 'react';
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js';
import { api } from '../lib/api';
import { Contact, Group, UploadProgress, UploadStatus } from '../types/mr.types';

interface UseCSVImportProps {
  contacts: Contact[];
  groups: Group[];
  onSuccess: () => void;
}

export const useCSVImport = ({ contacts, groups, onSuccess }: UseCSVImportProps) => {
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: 0
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus['status']>('uploading');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataRows = lines.slice(1);
      
      if (dataRows.length === 0) {
        setUploadStatus('error');
        setUploadMessage('No data rows found in the uploaded file');
        setUploadErrors(['No data rows found in the uploaded file']);
        setShowUploadProgress(true);
        event.target.value = '';
        return;
      }

      // Initialize progress tracking
      const totalRows = dataRows.length;
      const batchSize = 10;
      const totalBatches = Math.ceil(totalRows / batchSize);
      
      setUploadProgress({
        total: totalRows,
        processed: 0,
        successful: 0,
        failed: 0,
        currentBatch: 0,
        totalBatches: totalBatches
      });
      
      setUploadStatus('uploading');
      setUploadMessage(`Starting upload of ${totalRows} MRs in ${totalBatches} batches...`);
      setUploadErrors([]);
      setShowUploadProgress(true);

      let totalSuccessful = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];

      // Process data in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalRows);
        const batch = dataRows.slice(startIndex, endIndex);
        
        setUploadProgress(prev => ({
          ...prev,
          currentBatch: batchIndex + 1
        }));
        
        setUploadMessage(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batch.length} records)...`);

        // Process each record in the current batch
        for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
          const actualRowIndex = startIndex + rowIndex + 2;
          const line = batch[rowIndex].trim();
          
          if (!line) {
            allErrors.push(`❌ Row ${actualRowIndex}: Empty row found`);
            totalFailed++;
            continue;
          }
          
          // Parse CSV line properly handling quoted values
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              
              if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                  // Escaped quote
                  current += '"';
                  i++; // Skip next quote
                } else {
                  // Toggle quote state
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            
            // Add the last field
            result.push(current.trim());
            return result;
          };
          
          const values = parseCSVLine(line);
          
          // Validate required columns
          if (values.length < 5) {
            allErrors.push(`❌ Row ${actualRowIndex}: Missing required columns (expected 5+ columns, found ${values.length})`);
            totalFailed++;
            continue;
          }

          // Validate MR ID
          if (!values[0] || !values[0].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: MR ID is required`);
            totalFailed++;
            continue;
          }

          // Validate names
          if (!values[1] || !values[1].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: First Name is required`);
            totalFailed++;
            continue;
          }
          if (!values[2] || !values[2].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: Last Name is required`);
            totalFailed++;
            continue;
          }

          // Validate and normalize phone number
          if (!values[3] || !values[3].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: Phone number is required`);
            totalFailed++;
            continue;
          }
          
          // Clean phone number (remove quotes and extra spaces)
          let phoneNumber = values[3].replace(/['"]/g, '').trim();
          
          // Normalize and validate phone number using libphonenumber-js
          const normalizePhoneNumber = (phone: string): { normalized: string; country: string; isValid: boolean; error?: string } => {
            try {
              // First, try to parse the phone number as-is
              if (isValidPhoneNumber(phone)) {
                const parsed = parsePhoneNumber(phone);
                return {
                  normalized: parsed.format('E.164'),
                  country: parsed.country || 'Unknown',
                  isValid: true
                };
              }
              
              // If not valid, try common country codes
              const commonCountries = ['US', 'IN', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'BR', 'MX', 'JP', 'CN', 'KR'];
              
              for (const country of commonCountries) {
                const phoneWithCountry = phone.startsWith('+') ? phone : `+${phone}`;
                if (isValidPhoneNumber(phoneWithCountry)) {
                  const parsed = parsePhoneNumber(phoneWithCountry);
                  return {
                    normalized: parsed.format('E.164'),
                    country: parsed.country || country,
                    isValid: true
                  };
                }
              }
              
              // Try adding country codes for common patterns
              if (phone.length === 10 && !phone.startsWith('0')) {
                // US/Canada format
                const usPhone = `+1${phone}`;
                if (isValidPhoneNumber(usPhone)) {
                  const parsed = parsePhoneNumber(usPhone);
                  return {
                    normalized: parsed.format('E.164'),
                    country: parsed.country || 'US',
                    isValid: true
                  };
                }
              }
              
              if (phone.length === 11 && phone.startsWith('0')) {
                // Remove leading 0 and try with country codes
                const withoutZero = phone.substring(1);
                for (const country of ['IN', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'BR', 'MX']) {
                  const phoneWithCountry = `+${withoutZero}`;
                  if (isValidPhoneNumber(phoneWithCountry)) {
                    const parsed = parsePhoneNumber(phoneWithCountry);
                    return {
                      normalized: parsed.format('E.164'),
                      country: parsed.country || country,
                      isValid: true
                    };
                  }
                }
              }
              
              return {
                normalized: phone,
                country: 'Unknown',
                isValid: false,
                error: 'Invalid phone number format'
              };
            } catch (error) {
              return {
                normalized: phone,
                country: 'Unknown',
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          };
          
          const phoneResult = normalizePhoneNumber(phoneNumber);
          
          console.log(`Row ${actualRowIndex}: Original phone: "${phoneNumber}" -> Normalized: "${phoneResult.normalized}" (${phoneResult.country})`);
          
          // Validate phone number
          if (!phoneResult.isValid) {
            allErrors.push(`❌ Row ${actualRowIndex}: Invalid phone number format (found: ${phoneNumber}, error: ${phoneResult.error || 'Unknown error'})`);
            totalFailed++;
            continue;
          }

          // Check for duplicate MR IDs in existing data
          if (contacts.some(contact => contact.mrId === values[0].trim())) {
            allErrors.push(`❌ Row ${actualRowIndex}: MR ID "${values[0]}" already exists in system`);
            totalFailed++;
            continue;
          }

          // If all validations pass, create contact via API
          try {
            // Find the group ID by name, if group is provided
            let groupId = '';
            if (values[4] && values[4].trim() !== '') {
              const selectedGroup = groups.find(g => g.name === values[4].trim());
              if (selectedGroup) {
                groupId = selectedGroup.id;
              }
            }

            await api.post('/mrs', {
              mrId: values[0].trim(),
              firstName: values[1].trim(),
              lastName: values[2].trim(),
              phone: phoneResult.normalized,
              groupId: groupId,
              comments: values[5] ? values[5].trim() : ''
            });
            
            totalSuccessful++;
          } catch (apiError: any) {
            allErrors.push(`❌ Row ${actualRowIndex}: Failed to create MR "${values[0]}": ${apiError.message || 'Unknown error'}`);
            totalFailed++;
          }

          // Update progress after each record
          setUploadProgress(prev => ({
            ...prev,
            processed: prev.processed + 1,
            successful: totalSuccessful,
            failed: totalFailed
          }));
        }

        // Auto-refresh data after each batch
        if (totalSuccessful > 0 && (batchIndex + 1) % 1 === 0) {
          setUploadMessage(`Refreshing data after batch ${batchIndex + 1}...`);
          onSuccess();
        }
      }

      // Final refresh
      if (totalSuccessful > 0) {
        setUploadMessage('Final data refresh...');
        onSuccess();
      }

      // Update final status
      setUploadProgress(prev => ({
        ...prev,
        processed: totalRows,
        successful: totalSuccessful,
        failed: totalFailed
      }));

      if (allErrors.length > 0) {
        setUploadStatus('error');
        setUploadMessage(`Upload completed with ${allErrors.length} errors. ${totalSuccessful} MRs were successfully created.`);
        setUploadErrors(allErrors);
      } else if (totalSuccessful === 0) {
        setUploadStatus('error');
        setUploadMessage('No MRs were successfully created. Please check your file format.');
        setUploadErrors(['No MRs were successfully created. Please check your file format.']);
      } else {
        setUploadStatus('completed');
        setUploadMessage(`Successfully uploaded ${totalSuccessful} MRs!`);
        setUploadErrors([]);
      }

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to upload file: ' + (error.message || 'Unknown error'));
      setUploadErrors(['Failed to upload file: ' + (error.message || 'Unknown error')]);
    }
  };

  return {
    showUploadProgress,
    setShowUploadProgress,
    uploadProgress,
    uploadStatus,
    uploadMessage,
    uploadErrors,
    handleCSVImport
  };
};
