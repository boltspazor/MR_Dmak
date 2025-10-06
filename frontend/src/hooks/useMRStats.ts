import { useState, useEffect } from 'react';
import { Contact, Group } from '../types/mr.types';
import { mrApi } from '../api/mr';

interface UseMRStatsProps {
  contacts: Contact[];
  groups: Group[];
}

interface MRStats {
  totalMRs: number;
  totalGroups: number;
  activeMRs: number;
  mrsPerGroup: { groupName: string; count: number }[];
  mostActiveGroup: { groupName: string; count: number };
  consentSummary: {
    consented: number;
    notConsented: number;
    deleted: number;
  };
}

export const useMRStats = ({ contacts, groups }: UseMRStatsProps) => {
  const [stats, setStats] = useState<MRStats>({
    totalMRs: 0,
    totalGroups: 0,
    activeMRs: 0,
    mrsPerGroup: [],
    mostActiveGroup: { groupName: 'None', count: 0 },
    consentSummary: {
      consented: 0,
      notConsented: 0,
      deleted: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch stats from backend API
        const response = await mrApi.getStats();
        
        if (response.success && response.data) {
          const apiStats = response.data;
          
          // Calculate local stats (keeping existing logic for groups)
          const totalGroups = groups.length;
          const activeMRs = contacts.length; // All contacts are considered active for now
          
          // Calculate MRs per group
          const mrsPerGroup = groups.map(group => ({
            groupName: group.name,
            count: contacts.filter(contact => contact.group === group.name).length
          }));

          // Find the most active group
          const mostActiveGroup = mrsPerGroup.reduce((max, current) => 
            current.count > max.count ? current : max, 
            { groupName: 'None', count: 0 }
          );

          setStats({
            totalMRs: apiStats.total,
            totalGroups,
            activeMRs,
            mrsPerGroup,
            mostActiveGroup,
            consentSummary: apiStats.consentSummary || {
              consented: 0,
              notConsented: 0,
              deleted: 0
            }
          });
        } else {
          // Fallback to local calculation if API fails
          const totalMRs = contacts.length;
          const totalGroups = groups.length;
          const activeMRs = contacts.length;
          
          const mrsPerGroup = groups.map(group => ({
            groupName: group.name,
            count: contacts.filter(contact => contact.group === group.name).length
          }));

          const mostActiveGroup = mrsPerGroup.reduce((max, current) => 
            current.count > max.count ? current : max, 
            { groupName: 'None', count: 0 }
          );

          setStats({
            totalMRs,
            totalGroups,
            activeMRs,
            mrsPerGroup,
            mostActiveGroup,
            consentSummary: {
              consented: 0,
              notConsented: 0,
              deleted: 0
            }
          });
        }
      } catch (error) {
        console.error('Error fetching MR stats:', error);
        
        // Fallback to local calculation
        const totalMRs = contacts.length;
        const totalGroups = groups.length;
        const activeMRs = contacts.length;
        
        const mrsPerGroup = groups.map(group => ({
          groupName: group.name,
          count: contacts.filter(contact => contact.group === group.name).length
        }));

        const mostActiveGroup = mrsPerGroup.reduce((max, current) => 
          current.count > max.count ? current : max, 
          { groupName: 'None', count: 0 }
        );

        setStats({
          totalMRs,
          totalGroups,
          activeMRs,
          mrsPerGroup,
          mostActiveGroup,
          consentSummary: {
            consented: 0,
            notConsented: 0,
            deleted: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have some data or it's the initial load
    if (contacts.length >= 0 && groups.length >= 0) {
      fetchStats();
    }
  }, [contacts.length, groups.length]); // Dependencies on array lengths to avoid infinite loops

  const originalSummaryItems = [
    {
      title: 'Total MR',
      value: stats.totalMRs,
      icon: 'Users',
      color: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Groups',
      value: stats.totalGroups,
      icon: 'FileText',
      color: 'bg-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Active MRs',
      value: stats.activeMRs,
      icon: 'Users',
      color: 'bg-purple-100',
      textColor: 'text-purple-600'
    }
  ];

  const consentSummaryItems = [
    {
      title: 'Consented',
      value: stats.consentSummary.consented,
      icon: 'Users',
      color: 'bg-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Not Consented',
      value: stats.consentSummary.notConsented,
      icon: 'Users', 
      color: 'bg-yellow-100',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Deleted',
      value: stats.consentSummary.deleted,
      icon: 'Users',
      color: 'bg-red-100',
      textColor: 'text-red-600'
    }
  ];

  return {
    stats,
    originalSummaryItems,
    consentSummaryItems,
    loading
  };
};
