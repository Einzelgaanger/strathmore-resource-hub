
import React, { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Trophy, Book, Rocket, Award, Star, GraduationCap, Lightbulb, Zap, Brain } from 'lucide-react';

interface AnimatedDashboardProps {
  children: ReactNode;
}

export function AnimatedDashboard({ children }: AnimatedDashboardProps) {
  return (
    <DashboardLayout>
      <div className="dashboard-container fading-in relative overflow-hidden">
        {children}
        
        {/* Floating elements for gamification visuals */}
        <div className="fixed bottom-10 right-10 z-0 opacity-20 floating" style={{ animationDelay: '0.2s' }}>
          <Star className="h-24 w-24 text-yellow-500" />
        </div>
        
        <div className="fixed top-20 left-10 z-0 opacity-10 floating" style={{ animationDelay: '0.5s' }}>
          <Book className="h-16 w-16 text-blue-500" />
        </div>
        
        <div className="fixed top-40 right-20 z-0 opacity-15 floating" style={{ animationDelay: '0.8s' }}>
          <GraduationCap className="h-20 w-20 text-green-500" />
        </div>
        
        <div className="fixed bottom-40 left-20 z-0 opacity-10 floating" style={{ animationDelay: '1.2s' }}>
          <Trophy className="h-16 w-16 text-purple-500" />
        </div>
        
        <div className="fixed top-60 left-40 z-0 opacity-5 floating" style={{ animationDelay: '1.5s' }}>
          <Rocket className="h-24 w-24 text-red-500" />
        </div>
        
        <div className="fixed bottom-60 right-40 z-0 opacity-10 floating" style={{ animationDelay: '0.9s' }}>
          <Award className="h-20 w-20 text-amber-500" />
        </div>
        
        <div className="fixed top-80 right-10 z-0 opacity-10 floating" style={{ animationDelay: '1.1s' }}>
          <Lightbulb className="h-16 w-16 text-yellow-400" />
        </div>
        
        <div className="fixed bottom-20 left-40 z-0 opacity-5 floating" style={{ animationDelay: '0.7s' }}>
          <Zap className="h-16 w-16 text-blue-400" />
        </div>
        
        <div className="fixed top-10 right-60 z-0 opacity-10 floating" style={{ animationDelay: '1.3s' }}>
          <Brain className="h-20 w-20 text-purple-400" />
        </div>
      </div>
    </DashboardLayout>
  );
}
