import { useState } from 'react';
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
          
          const values = line.split(',');
          
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

          // Validate phone number
          if (!values[3] || !values[3].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: Phone number is required`);
            totalFailed++;
            continue;
          }
          if (!values[3].startsWith('+91')) {
            allErrors.push(`❌ Row ${actualRowIndex}: Phone number must start with +91 (found: ${values[3]})`);
            totalFailed++;
            continue;
          }
          if (values[3].length !== 13) {
            allErrors.push(`❌ Row ${actualRowIndex}: Phone number must be 13 digits including +91 (found: ${values[3]})`);
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
              phone: values[3].trim(),
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
      } else if (totalSuccessful === 0) {
        setUploadStatus('error');
        setUploadMessage('No MRs were successfully created. Please check your file format.');
      } else {
        setUploadStatus('completed');
        setUploadMessage(`Successfully uploaded ${totalSuccessful} MRs!`);
      }

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to upload file: ' + (error.message || 'Unknown error'));
    }
  };

  return {
    showUploadProgress,
    setShowUploadProgress,
    uploadProgress,
    uploadStatus,
    uploadMessage,
    handleCSVImport
  };
};
