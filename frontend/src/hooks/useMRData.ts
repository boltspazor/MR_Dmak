import { useState, useEffect, useCallback } from 'react';
import { Contact, Group, SearchFilters, PaginationState } from '../types/mr.types';
import { api } from '../lib/api';

export const useMRData = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching contacts from backend...');
      const response = await api.get('/mrs');
      const mrs = response.data.data || [];
      
      console.log('Backend contacts response:', mrs);
      
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
      
      console.log('Transformed contacts:', transformedContacts);
      setContacts(transformedContacts);
    } catch (error: any) {
      console.error('Error fetching contacts from backend:', error);
      setError(error.message || 'Failed to fetch contacts');
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
      // Fallback to default groups if API fails
      const defaultGroups: Group[] = [
        { id: '1', name: 'North', contactCount: 0 },
        { id: '2', name: 'South', contactCount: 0 },
        { id: '3', name: 'East', contactCount: 0 },
        { id: '4', name: 'West', contactCount: 0 }
      ];
      setGroups(defaultGroups);
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
    fetchContacts,
    fetchGroups,
    addContact,
    updateContact,
    deleteContact
  };
};
