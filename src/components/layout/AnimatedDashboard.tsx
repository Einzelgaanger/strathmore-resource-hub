
import React, { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { 
  Trophy, Book, Rocket, Award, Star, GraduationCap, 
  Lightbulb, Zap, Brain, Heart, Music, Sparkles, 
  LucideProps, Flame, Medal, PartyPopper, Gift, Crown
} from 'lucide-react';

interface AnimatedDashboardProps {
  children: ReactNode;
}

// Enhanced floating icon component with more vibrant colors and animations
const FloatingIcon = ({ 
  icon: Icon, 
  className = "", 
  size = 24, 
  color = "#000", 
  style = {},
  animationDelay = "0s"
}: { 
  icon: React.ComponentType<LucideProps>;
  className?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
}) => (
  <div 
    className={`fixed z-0 ${className}`} 
    style={{ 
      animation: `float 6s ease-in-out infinite`, 
      animationDelay, 
      ...style 
    }}
  >
    <Icon size={size} color={color} />
  </div>
);

export function AnimatedDashboard({ children }: AnimatedDashboardProps) {
  return (
    <DashboardLayout>
      <div className="dashboard-container fading-in relative overflow-hidden">
        {children}
        
        {/* Vibrant floating elements with varied animations and positions */}
        <FloatingIcon 
          icon={Star} 
          className="bottom-10 right-10 opacity-20" 
          size={40} 
          color="#FFCC00" 
          animationDelay="0.2s" 
        />
        
        <FloatingIcon 
          icon={Book} 
          className="top-20 left-10 opacity-15" 
          size={32} 
          color="#007AFF" 
          animationDelay="0.5s" 
          style={{ animation: 'float-reverse 7s ease-in-out infinite' }}
        />
        
        <FloatingIcon 
          icon={GraduationCap} 
          className="top-40 right-20 opacity-20" 
          size={36} 
          color="#34C759" 
          animationDelay="0.8s" 
        />
        
        <FloatingIcon 
          icon={Trophy} 
          className="bottom-40 left-20 opacity-15" 
          size={28} 
          color="#AF52DE" 
          animationDelay="1.2s" 
          style={{ animation: 'float-reverse 8s ease-in-out infinite' }}
        />
        
        <FloatingIcon 
          icon={Rocket} 
          className="top-60 left-40 opacity-10" 
          size={42} 
          color="#FF3B30" 
          animationDelay="1.5s" 
        />
        
        <FloatingIcon 
          icon={Award} 
          className="bottom-60 right-40 opacity-15" 
          size={34} 
          color="#FF9500" 
          animationDelay="0.9s" 
        />
        
        <FloatingIcon 
          icon={Lightbulb} 
          className="top-80 right-10 opacity-15" 
          size={30} 
          color="#FFCC00" 
          animationDelay="1.1s" 
          style={{ animation: 'float-reverse 6.5s ease-in-out infinite' }}
        />
        
        <FloatingIcon 
          icon={Zap} 
          className="bottom-20 left-40 opacity-10" 
          size={28} 
          color="#5AC8FA" 
          animationDelay="0.7s" 
        />
        
        <FloatingIcon 
          icon={Brain} 
          className="top-10 right-60 opacity-15" 
          size={32} 
          color="#AF52DE" 
          animationDelay="1.3s" 
        />
        
        {/* Additional vibrant elements */}
        <FloatingIcon 
          icon={Heart} 
          className="top-30 left-70 opacity-15" 
          size={28} 
          color="#FF3B30" 
          animationDelay="1.7s" 
          style={{ animation: 'float-reverse 7.2s ease-in-out infinite' }}
        />
        
        <FloatingIcon 
          icon={Music} 
          className="bottom-70 right-30 opacity-12" 
          size={26} 
          color="#5856D6" 
          animationDelay="0.4s" 
        />
        
        <FloatingIcon 
          icon={Sparkles} 
          className="top-50 right-50 opacity-20" 
          size={30} 
          color="#FFCC00" 
          animationDelay="1.0s" 
        />
        
        <FloatingIcon 
          icon={Flame} 
          className="bottom-30 left-60 opacity-15" 
          size={34} 
          color="#FF9500" 
          animationDelay="0.6s" 
          style={{ animation: 'pulse 3s infinite' }}
        />
        
        <FloatingIcon 
          icon={Medal} 
          className="top-70 left-30 opacity-18" 
          size={32} 
          color="#007AFF" 
          animationDelay="1.4s" 
        />
        
        <FloatingIcon 
          icon={PartyPopper} 
          className="bottom-50 right-70 opacity-15" 
          size={36} 
          color="#FF3B30" 
          animationDelay="0.3s" 
          style={{ animation: 'float-reverse 6.8s ease-in-out infinite' }}
        />
        
        <FloatingIcon 
          icon={Gift} 
          className="top-15 left-15 opacity-12" 
          size={28} 
          color="#34C759" 
          animationDelay="0.9s" 
        />
        
        <FloatingIcon 
          icon={Crown} 
          className="bottom-15 right-15 opacity-20" 
          size={30} 
          color="#FFCC00" 
          animationDelay="1.6s" 
          style={{ animation: 'float-reverse 7.5s ease-in-out infinite' }}
        />
      </div>
    </DashboardLayout>
  );
}
