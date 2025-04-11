import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, Home, Book, ChevronLeft, Menu, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Unit } from '@/lib/types';
import { getUnitsForClassInstance } from '@/lib/supabase';

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
        "w-full justify-start gap-2 font-normal",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
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
  const [expanded, setExpanded] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [user, propUnits]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar flex flex-col h-screen fixed inset-y-0 left-0 z-10 transition-all duration-300 border-r border-sidebar-border",
          expanded ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between p-4">
          {expanded && (
            <div className="font-bold text-xl text-sidebar-foreground">
              myStrath
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <Separator className="bg-sidebar-border" />
        
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <nav className="space-y-1">
            <SidebarLink 
              href="/dashboard" 
              icon={<Home size={20} />} 
              title="Dashboard" 
              active={location.pathname === '/dashboard'} 
            />
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-sidebar-foreground/70" />
              </div>
            ) : (
              units.map((unit) => (
                <SidebarLink 
                  key={unit.id}
                  href={`/unit/${unit.id}`}
                  icon={<Book size={20} />}
                  title={expanded ? unit.name : unit.code}
                  subtitle={expanded ? unit.code : undefined}
                  active={location.pathname === `/unit/${unit.id}`}
                />
              ))
            )}
            
            <SidebarLink 
              href="/profile" 
              icon={<UserIcon size={20} />} 
              title="My Profile" 
              active={location.pathname === '/profile'} 
            />
          </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          {user && (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.profile_picture_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {expanded && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">{user.admission_number}</p>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-sidebar-foreground hover:text-sidebar-foreground/80"
                onClick={logout}
              >
                <LogOut size={18} />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        expanded ? "ml-64" : "ml-16"
      )}>
        <div className="container px-4 py-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
