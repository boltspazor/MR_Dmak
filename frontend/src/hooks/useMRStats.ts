import { useMemo } from 'react';
import { Contact, Group } from '../types/mr.types';

interface UseMRStatsProps {
  contacts: Contact[];
  groups: Group[];
}

export const useMRStats = ({ contacts, groups }: UseMRStatsProps) => {
  const stats = useMemo(() => {
    const totalMRs = contacts.length;
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

    return {
      totalMRs,
      totalGroups,
      activeMRs,
      mrsPerGroup,
      mostActiveGroup
    };
  }, [contacts, groups]);

  const summaryItems = useMemo(() => [
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
  ], [stats]);

  return {
    stats,
    summaryItems
  };
};
