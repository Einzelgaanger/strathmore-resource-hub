import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Book, 
  Trophy, 
  Info, 
  LogOut, 
  ChevronLeft, 
  Menu, 
  ChevronRight, 
  ChevronDown,
  Loader2,
  PenTool
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { Badge } from './badge';

interface Unit {
  id: number;
  name: string;
  code: string;
  lecturer: string;
}

export function Sidebar() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);
  const [unitsExpanded, setUnitsExpanded] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleUnits = () => {
    setUnitsExpanded(!unitsExpanded);
  };

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!user) return;
      
      try {
        setLoadingUnits(true);
        
        const { data: unitData, error } = await supabase
          .from('units')
          .select('id, name, code, lecturer')
          .eq('class_instance_id', user.class_instance_id)
          .order('name');
        
        if (error) {
          console.error('Error fetching units:', error);
        } else {
          setUnits(unitData || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [user]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setCollapsed(true)}
        ></div>
      )}
      
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white border-r z-50 transition-all duration-300 flex flex-col
          ${collapsed ? 'w-0 md:w-16 overflow-hidden' : 'w-64'}
        `}
      >
        <div className={`flex items-center h-16 px-4 border-b ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="font-bold text-lg">myStrath</span>
            </Link>
          )}
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="py-4">
            <div className={`px-3 pb-4 ${collapsed ? 'text-center' : ''}`}>
              <div className={collapsed ? 'flex justify-center' : 'flex items-center gap-3'}>
                <Avatar>
                  <AvatarImage src={user?.profile_picture_url || undefined} />
                  <AvatarFallback>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.admission_number}</p>
                  </div>
                )}
              </div>
              
              {!collapsed && user?.points !== undefined && (
                <div className="mt-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <div className="text-sm flex-1">
                    <span className="font-medium">{user.points} Points</span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            <nav className="px-2 mt-4 space-y-1">
              <Link
                to="/dashboard"
                className={`
                  flex items-center p-2 rounded-md transition-colors
                  ${isActive('/dashboard') ? 'bg-strathmore-blue text-white' : 'hover:bg-gray-100 text-gray-700'}
                  ${collapsed ? 'justify-center' : 'gap-3'}
                `}
              >
                <LayoutDashboard className="h-5 w-5" />
                {!collapsed && <span>Dashboard</span>}
              </Link>
              
              <div className="space-y-1">
                <div 
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 text-gray-700 cursor-pointer"
                  onClick={toggleUnits}
                >
                  <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
                    <Book className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">My Units</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${unitsExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </div>
                </div>
                
                {unitsExpanded && !collapsed && (
                  <div className="ml-4 pl-3 border-l">
                    {loadingUnits ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : units.length > 0 ? (
                      units.map(unit => (
                        <Link
                          key={unit.id}
                          to={`/units/${unit.id}`}
                          className={`
                            flex items-center justify-between p-2 rounded-md text-sm transition-colors
                            ${isActive(`/units/${unit.id}`) ? 'bg-strathmore-blue/10 text-strathmore-blue font-medium' : 'hover:bg-gray-100 text-gray-700'}
                          `}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <PenTool className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{unit.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{unit.code}</Badge>
                        </Link>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No units available
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Link
                to="/profile"
                className={`
                  flex items-center p-2 rounded-md transition-colors
                  ${isActive('/profile') ? 'bg-strathmore-blue text-white' : 'hover:bg-gray-100 text-gray-700'}
                  ${collapsed ? 'justify-center' : 'gap-3'}
                `}
              >
                <Info className="h-5 w-5" />
                {!collapsed && <span>Profile</span>}
              </Link>
              
              <Button 
                variant="ghost" 
                className={`w-full justify-start p-2 h-auto text-red-600 hover:bg-red-50 hover:text-red-700 ${collapsed ? 'justify-center' : ''}`}
                onClick={() => logout()}
              >
                <LogOut className="h-5 w-5" />
                {!collapsed && <span className="ml-3">Logout</span>}
              </Button>
            </nav>
          </div>
        </ScrollArea>
      </aside>
      
      {isMobile && collapsed && (
        <button 
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
