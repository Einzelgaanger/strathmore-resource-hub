import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { loginByAdmissionNumber } from '@/lib/supabase';
import { User } from '@/lib/types';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (admissionNumber: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; user?: any; error?: string }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for an existing session
    const checkSession = async () => {
      try {
        console.info("Checking for existing session...");
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Get user details from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (userError || !userData) {
            console.error("Error retrieving user details:", userError);
            setUser(null);
          } else {
            setUser(userData);
          }
        } else {
          console.info("No active session found");
          setUser(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.info("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        // Get user details from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userError || !userData) {
          console.error("Error retrieving user details after sign in:", userError);
          setUser(null);
        } else {
          setUser(userData);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function updated to ensure proper types
  const login = async (admissionNumber: string, password: string) => {
    try {
      setLoading(true);
      console.info("Login attempt with:", admissionNumber);
      
      const userData = await loginByAdmissionNumber(admissionNumber, password);
      
      if (userData) {
        console.info("Successfully retrieved user details:", userData);
        setUser(userData);
        navigate('/dashboard');
        return { success: true, user: userData };
      }
      
      return { success: false, error: "Invalid credentials" };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Authentication failed" };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Fixed type issue in updateUser function
  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('No user is currently authenticated');
    }
    
    try {
      // Ensure required fields are included
      const updatedData = {
        ...userData,
        id: user.id,
        admission_number: userData.admission_number || user.admission_number, // Make admission_number required
        email: userData.email || user.email, // Make email required
        name: userData.name || user.name, // Make name required
      };
      
      const { data, error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setUser({
        ...user,
        ...data
      });
      
      return { success: true, user: data };
    } catch (error: any) {
      console.error("Error updating user:", error);
      return { success: false, error: error.message || "Failed to update user" };
    }
  };

  const value: AuthContextProps = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextProps {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
