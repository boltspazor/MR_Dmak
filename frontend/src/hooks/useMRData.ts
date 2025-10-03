import { useState, useEffect, useCallback } from 'react';
import { Contact, Group, SearchFilters, PaginationState } from '../types/mr.types';
import { api } from '../lib/api';

export interface MRPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  groupId?: string;
  consentStatus?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface BackendPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export const useMRData = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<BackendPagination | null>(null);
  const [total, setTotal] = useState(0);

  const fetchContacts = useCallback(async (params: MRPaginationParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { page = 1, limit = 30, search, groupId, consentStatus, sortField, sortDirection } = params;

      const queryParams = new URLSearchParams();
      // Convert page to offset for backend compatibility
      const offset = (page - 1) * limit;
      queryParams.append('offset', offset.toString());
      queryParams.append('limit', limit.toString());

      if (search) queryParams.append('search', search);
      if (groupId) queryParams.append('groupId', groupId);
      if (consentStatus) queryParams.append('consentStatus', consentStatus);
      if (sortField) queryParams.append('sortField', sortField);
      if (sortDirection) queryParams.append('sortDirection', sortDirection);

      const response = await api.get(`/mrs?${queryParams}`);
      const { data: mrs, pagination: paginationInfo } = response.data;

      // Transform backend MR data to Contact format
      const transformedContacts: Contact[] = mrs.map((mr: any) => ({
        id: mr._id || mr.id,
        mrId: mr.mrId,
        firstName: mr.firstName,
        lastName: mr.lastName,
        phone: mr.phone,
        group: mr.group?.groupName || 'Default Group',
        comments: mr.comments || '',
        consentStatus: mr.consentStatus || 'not_requested'
      }));

      setContacts(transformedContacts);
      setPagination(paginationInfo);
      setTotal(paginationInfo?.total || transformedContacts.length);

      console.log('useMRData: Set pagination state:', paginationInfo);
      console.log('useMRData: Set total:', paginationInfo?.total || transformedContacts.length);
    } catch (error: any) {
      console.error('Error fetching contacts from backend:', error);
      setError(error.message || 'Failed to fetch contacts');
      setContacts([]);
      setPagination(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllContacts = useCallback(async (search?: string, groupId?: string, consentStatus?: string) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append('getAll', 'true');

      if (search) queryParams.append('search', search);
      if (groupId) queryParams.append('groupId', groupId);
      if (consentStatus) queryParams.append('consentStatus', consentStatus);

      const response = await api.get(`/mrs?${queryParams}`);
      const { data: mrs, total } = response.data;

      // Transform backend MR data to Contact format
      const transformedContacts: Contact[] = mrs.map((mr: any) => ({
        id: mr._id || mr.id,
        mrId: mr.mrId,
        firstName: mr.firstName,
        lastName: mr.lastName,
        phone: mr.phone,
        group: mr.group?.groupName || 'Default Group',
        comments: mr.comments || '',
        consentStatus: mr.consentStatus || 'not_requested'
      }));

      return transformedContacts;
    } catch (error: any) {
      console.error('Error fetching all contacts from backend:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      console.log('Fetching groups from backend...');
      const response = await api.get('/groups');
      const backendGroups = response.data.data || [];

      console.log('Backend groups response:', backendGroups);

      // Transform backend Group data to Contact format
      const transformedGroups: Group[] = backendGroups.map((group: any) => ({
        id: group._id || group.id,
        name: group.groupName,
        contactCount: 0 // Will be updated by useEffect
      }));

      console.log('Transformed groups:', transformedGroups);
      setGroups(transformedGroups);
    } catch (error: any) {
      console.error('Error fetching groups from backend:', error);
    }
  }, []);

  const addContact = useCallback(async (contactData: Omit<Contact, 'id'>) => {
    try {
      const response = await api.post('/mrs', contactData);
      const newContact = response.data.data;

      const transformedContact: Contact = {
        id: newContact._id || newContact.id,
        mrId: newContact.mrId,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        phone: newContact.phone,
        group: newContact.group?.groupName || 'Default Group',
        comments: newContact.comments || '',
        consentStatus: newContact.consentStatus || 'not_requested'
      };

      setContacts(prev => [...prev, transformedContact]);
      return transformedContact;
    } catch (error: any) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }, []);

  const updateContact = useCallback(async (id: string, contactData: Omit<Contact, 'id'>) => {
    try {
      await api.put(`/mrs/${id}`, contactData);

      setContacts(prev => prev.map(contact =>
        contact.id === id
          ? { ...contactData, id }
          : contact
      ));
    } catch (error: any) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    try {
      await api.delete(`/mrs/${id}`);
      setContacts(prev => prev.filter(contact => contact.id !== id));
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }, []);

  // Update group contact counts when contacts change
  useEffect(() => {
    setGroups(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        contactCount: contacts.filter(contact => contact.group === group.name).length
      }))
    );
  }, [contacts]);

  return {
    contacts,
    groups,
    loading,
    error,
    pagination,
    total,
    fetchContacts,
    fetchAllContacts,
    fetchGroups,
    addContact,
    updateContact,
    deleteContact
  };
};
