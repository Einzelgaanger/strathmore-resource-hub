
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { loginByAdmissionNumber } from '@/lib/supabase';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (admissionNumber: string, password: string) => Promise<{ success: boolean; user: User | null; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; user?: any; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfilePicture: (userId: string, file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
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
      
      return { success: false, user: null, error: "Invalid credentials" };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, user: null, error: error.message || "Authentication failed" };
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

  // Fixed update user function to ensure required fields
  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      throw new Error('No user is currently authenticated');
    }
    
    try {
      // Ensure required fields are included
      const updatedData = {
        ...userData,
        id: user.id,
        admission_number: userData.admission_number || user.admission_number,
        email: userData.email || user.email,
        name: userData.name || user.name,
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

  // Add updatePassword function
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      // First, verify the current password by attempting to log in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (authError || !authData.user) {
        return { success: false, error: "Current password is incorrect" };
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Also update the password in the users table if it's stored there
      try {
        await supabase
          .from('users')
          .update({ password: newPassword })
          .eq('id', user.id);
      } catch (err) {
        console.warn("Could not update password in users table:", err);
        // This is not critical, we'll continue
      }

      return { success: true };
    } catch (error: any) {
      console.error("Password update error:", error);
      return { success: false, error: error.message || "Failed to update password" };
    }
  };

  // Add updateProfilePicture function
  const updateProfilePicture = async (userId: string, file: File) => {
    try {
      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      // Upload the file to storage
      const filename = `profile-pictures/${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filename, file, {
          upsert: true,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Update local user state
      setUser(prevUser => {
        if (prevUser) {
          return { ...prevUser, profile_picture_url: publicUrl };
        }
        return prevUser;
      });

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error("Profile picture update error:", error);
      return { success: false, error: error.message || "Failed to update profile picture" };
    }
  };

  const value: AuthContextProps = {
    user,
    loading,
    login,
    logout,
    updateUser,
    updatePassword,
    updateProfilePicture,
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
