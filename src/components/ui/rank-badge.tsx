
import React from 'react';
import { cn } from '@/lib/utils';
import { RANKS } from '@/lib/constants';

interface RankBadgeProps {
  points: number;
  showIcon?: boolean;
  showName?: boolean;
  className?: string;
}

export function RankBadge({ points, showIcon = true, showName = true, className }: RankBadgeProps) {
  const rank = RANKS.find(r => points >= r.min && points <= r.max) || RANKS[0];
  
  return (
    <span className={cn(`rank-badge rank-badge-${rank.class}`, className)}>
      {showIcon && <span className="mr-1">{rank.icon}</span>}
      {showName && rank.name}
    </span>
  );
}

export function getRankFromPoints(points: number) {
  return RANKS.find(r => points >= r.min && points <= r.max) || RANKS[0];
}
