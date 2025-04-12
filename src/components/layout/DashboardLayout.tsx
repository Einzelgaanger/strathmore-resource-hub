
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, Home, Book, ChevronLeft, Menu, Loader2, Settings, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Unit } from '@/lib/types';
import { getUnitsForClassInstance } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  active?: boolean;
}

const SidebarLink = ({ href, icon, title, subtitle, active }: SidebarLinkProps) => {
  const navigate = useNavigate();
  
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 font-normal tap-target transition-all",
        active ? 
          "bg-vibrant-blue text-white hover:bg-vibrant-blue/90" : 
          "text-sidebar-foreground hover:bg-sidebar-accent/20"
      )}
      onClick={() => navigate(href)}
    >
      {icon}
      <div className="flex flex-col items-start">
        <span>{title}</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </Button>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  units?: Unit[];
}

export function DashboardLayout({ children, units: propUnits }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(!isMobile);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // Close sidebar on mobile when route changes
    if (isMobile) {
      setExpanded(false);
      setShowMobileMenu(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!user?.class_instance_id) {
        setLoading(false);
        return;
      }

      try {
        // If units were passed as props, use those
        if (propUnits && propUnits.length > 0) {
          setUnits(propUnits);
          setLoading(false);
          return;
        }

        // Otherwise fetch from database
        const data = await getUnitsForClassInstance(user.class_instance_id);
        setUnits(data);
      } catch (error) {
        console.error('Failed to fetch units:', error);
        toast.error("Failed to load your units. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [user, propUnits]);

  const handleLogout = () => {
    toast.success('Logging out...');
    logout();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobile && expanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 animate-fade-in" 
          onClick={() => setExpanded(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white flex flex-col h-screen fixed inset-y-0 left-0 z-30 transition-all duration-300 border-r",
          expanded ? "w-64" : "w-0 md:w-16",
          isMobile && !expanded ? "shadow-none" : "shadow-md",
        )}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b">
          {expanded && (
            <div className="font-bold text-xl text-vibrant-blue">
              myStrath
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-vibrant-blue hover:bg-blue-50"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <nav className="space-y-1">
            <SidebarLink 
              href="/dashboard" 
              icon={<Home size={20} className="text-vibrant-blue" />} 
              title="Dashboard" 
              active={location.pathname === '/dashboard'} 
            />
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-vibrant-blue" />
              </div>
            ) : (
              units.map((unit) => (
                <SidebarLink 
                  key={unit.id}
                  href={`/unit/${unit.id}`}
                  icon={<Book size={20} className="text-vibrant-green" />}
                  title={expanded ? unit.name : unit.code}
                  subtitle={expanded ? unit.code : undefined}
                  active={location.pathname === `/unit/${unit.id}` || location.pathname === `/units/${unit.id}`}
                />
              ))
            )}
            
            <SidebarLink 
              href="/profile" 
              icon={<UserIcon size={20} className="text-vibrant-purple" />} 
              title="My Profile" 
              active={location.pathname === '/profile'} 
            />
          </nav>
        </div>
        
        <div className="p-4 border-t">
          {user && expanded && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="border-2 border-vibrant-blue">
                <AvatarImage src={user.profile_picture_url || undefined} />
                <AvatarFallback className="bg-vibrant-blue text-white">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Star size={12} className="text-vibrant-yellow" /> 
                  {user.points || 0} points
                </p>
              </div>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 tap-target",
              !expanded && "rounded-full p-2 h-auto"
            )}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {expanded && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      {isMobile && !expanded && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20 flex items-center px-4 justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-vibrant-blue"
            onClick={() => setExpanded(true)}
          >
            <Menu size={24} />
          </Button>
          
          <div className="font-bold text-xl text-vibrant-blue">
            myStrath
          </div>
          
          {user && (
            <Avatar className="h-8 w-8 border-2 border-vibrant-blue">
              <AvatarImage src={user.profile_picture_url || undefined} />
              <AvatarFallback className="bg-vibrant-blue text-white text-xs">
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen bg-gray-50 page-transition",
        expanded ? "md:ml-64" : "md:ml-16",
        isMobile && "pt-16"
      )}>
        <div className={cn(
          "container px-4 py-6 max-w-6xl",
          isMobile && "px-3 py-4"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
