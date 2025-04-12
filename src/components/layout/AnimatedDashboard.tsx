
import React, { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';

interface AnimatedDashboardProps {
  children: ReactNode;
}

export function AnimatedDashboard({ children }: AnimatedDashboardProps) {
  return (
    <DashboardLayout>
      <div className="dashboard-container fading-in">
        {children}
        
        {/* Floating elements for gamification visuals */}
        <div className="fixed bottom-10 right-10 z-0 opacity-20 floating" style={{ animationDelay: '0.2s' }}>
          <svg className="h-24 w-24 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        
        <div className="fixed top-20 left-10 z-0 opacity-10 floating" style={{ animationDelay: '0.5s' }}>
          <svg className="h-16 w-16 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" />
          </svg>
        </div>
        
        <div className="fixed top-40 right-20 z-0 opacity-15 floating" style={{ animationDelay: '0.8s' }}>
          <svg className="h-20 w-20 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z" />
          </svg>
        </div>
      </div>
    </DashboardLayout>
  );
}
