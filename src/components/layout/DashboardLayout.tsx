
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, Home, Book, Settings, ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Unit } from '@/lib/types';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  active?: boolean;
}

const SidebarLink = ({ href, icon, title, active }: SidebarLinkProps) => {
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
      <span>{title}</span>
    </Button>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  units?: Unit[];
}

export function DashboardLayout({ children, units = [] }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  
  // Mock units for now
  const mockUnits: Unit[] = units.length > 0 ? units : [
    { id: 1, name: 'Integral Calculus', code: 'MAT 2101', class_instance_id: 1, lecturer: 'Dr. Mary Johnson', created_at: '' },
    { id: 2, name: 'Real Analysis', code: 'MAT 2102', class_instance_id: 1, lecturer: 'Dr. James Smith', created_at: '' },
    { id: 3, name: 'Probability Theory', code: 'STA 2101', class_instance_id: 1, lecturer: 'Dr. Elizabeth Wilson', created_at: '' },
    { id: 4, name: 'Algorithms and Data Structures', code: 'DAT 2101', class_instance_id: 1, lecturer: 'Dr. Michael Brown', created_at: '' },
    { id: 5, name: 'Information Security, Governance and the Cloud', code: 'DAT 2102', class_instance_id: 1, lecturer: 'Dr. Sarah Taylor', created_at: '' },
    { id: 6, name: 'Principles of Ethics', code: 'HED 2101', class_instance_id: 1, lecturer: 'Dr. Robert Anderson', created_at: '' }
  ];

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
            
            {mockUnits.map((unit) => (
              <SidebarLink 
                key={unit.id}
                href={`/unit/${unit.id}`}
                icon={<Book size={20} />}
                title={expanded ? unit.code : ''}
                active={location.pathname === `/unit/${unit.id}`}
              />
            ))}
            
            <SidebarLink 
              href="/profile" 
              icon={<UserIcon size={20} />} 
              title="My Profile" 
              active={location.pathname === '/profile'} 
            />
            
            <SidebarLink 
              href="/settings" 
              icon={<Settings size={20} />} 
              title="Settings" 
              active={location.pathname === '/settings'} 
            />
          </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          {user && (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.profile_picture_url} />
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
