
import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  max?: number;
}

export function NotificationBadge({ count, className, max = 99 }: NotificationBadgeProps) {
  if (count <= 0) return null;
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center min-w-[16px] px-1",
        className
      )}
    >
      {displayCount}
    </span>
  );
}
