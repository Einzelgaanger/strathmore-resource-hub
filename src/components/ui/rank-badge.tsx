
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { RANKS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface Rank {
  id: number;
  name: string;
  icon: string;
  min_points: number;
  max_points: number;
}

interface RankBadgeProps {
  points: number;
  showIcon?: boolean;
  showName?: boolean;
  className?: string;
}

export function RankBadge({ points, showIcon = true, showName = true, className }: RankBadgeProps) {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        const { data, error } = await supabase
          .from('ranks')
          .select('*')
          .order('min_points');
        
        if (error) {
          console.error('Error fetching ranks:', error);
          return;
        }
        
        setRanks(data || []);
      } catch (err) {
        console.error('Failed to fetch ranks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRanks();
  }, []);
  
  // Use fallback ranks if we're still loading or there was an error
  const ranksList = ranks.length > 0 ? ranks : RANKS;
  const rank = ranksList.find(r => points >= r.min_points && points <= r.max_points) || ranksList[0];
  
  const rankClass = rank.name
    .toLowerCase()
    .replace(/\s+/g, '-'); // Convert spaces to hyphens
  
  return (
    <span className={cn(`rank-badge rank-badge-${rankClass}`, className)}>
      {showIcon && <span className="mr-1">{rank.icon}</span>}
      {showName && rank.name}
    </span>
  );
}

export function getRankFromPoints(points: number) {
  // Note: This is a static helper that doesn't use the database fetch
  // For simplicity, we'll use the static constant version
  return RANKS.find(r => points >= r.min && points <= r.max) || RANKS[0];
}
