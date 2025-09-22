import { useState, useCallback } from 'react';
import { api } from '../api/config';

interface ConsentStatus {
  phone_e164: string;
  consented: boolean;
  opt_out: {
    status: boolean;
    timestamp?: string;
    reason?: string;
    method?: string;
  };
  business_name_shown: string;
  timestamp: string;
}

interface UseConsentStatusReturn {
  consentStatuses: Map<string, ConsentStatus | null>;
  loading: boolean;
  error: string | null;
  fetchConsentStatus: (phoneNumbers: string[]) => Promise<void>;
  getConsentStatus: (phoneNumber: string) => ConsentStatus | null;
}

export const useConsentStatus = (): UseConsentStatusReturn => {
  const [consentStatuses, setConsentStatuses] = useState<Map<string, ConsentStatus | null>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchConsentStatus = useCallback(async (phoneNumbers: string[]) => {
    if (phoneNumbers.length === 0 || isFetching) return;

    setLoading(true);
    setIsFetching(true);
    setError(null);

    try {
      // Fetch consent status for all phone numbers in parallel with timeout
      const promises = phoneNumbers.map(async (phone) => {
        try {
          // Add timeout to prevent hanging requests
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          );
          
          const response = await Promise.race([
            api.get(`/consent/status/${encodeURIComponent(phone)}`),
            timeoutPromise
          ]) as any;
          
          if (response.data.success && response.data.data) {
            return { phone, status: response.data.data };
          } else {
            return { phone, status: null };
          }
        } catch (error) {
          console.warn(`Failed to fetch consent status for ${phone}:`, error);
          return { phone, status: null };
        }
      });

      const results = await Promise.all(promises);
      
      // Update the consent statuses map using functional update
      setConsentStatuses(prevStatuses => {
        const newStatuses = new Map(prevStatuses);
        results.forEach(({ phone, status }) => {
          newStatuses.set(phone, status);
        });
        return newStatuses;
      });
    } catch (error: any) {
      console.error('Error fetching consent statuses:', error);
      setError(error.message || 'Failed to fetch consent statuses');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [isFetching]); // Add isFetching dependency

  const getConsentStatus = useCallback((phoneNumber: string): ConsentStatus | null => {
    return consentStatuses.get(phoneNumber) || null;
  }, [consentStatuses]);

  return {
    consentStatuses,
    loading,
    error,
    fetchConsentStatus,
    getConsentStatus
  };
};

export default useConsentStatus;
