
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { User } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PASSWORD } from '@/lib/constants';
import { supabase, getUserDetails } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (admissionNumber: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (admissionNumber: string, resetCode: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for existing session and load user data
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get additional user details from our users table
          const userDetails = await getUserDetails(session.user.id);
          
          if (userDetails) {
            setUser({
              id: userDetails.id,
              admission_number: userDetails.admission_number,
              email: userDetails.email,
              name: userDetails.name,
              profile_picture_url: userDetails.profile_picture_url,
              class_instance_id: userDetails.class_instance_id,
              is_admin: userDetails.is_admin,
              is_super_admin: userDetails.is_super_admin,
              points: userDetails.points,
              rank: userDetails.rank,
              reset_code: userDetails.reset_code,
              created_at: userDetails.created_at
            });
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User has signed in, fetch their details
          try {
            const userDetails = await getUserDetails(session.user.id);
            
            if (userDetails) {
              setUser({
                id: userDetails.id,
                admission_number: userDetails.admission_number,
                email: userDetails.email,
                name: userDetails.name,
                profile_picture_url: userDetails.profile_picture_url,
                class_instance_id: userDetails.class_instance_id,
                is_admin: userDetails.is_admin,
                is_super_admin: userDetails.is_super_admin,
                points: userDetails.points,
                rank: userDetails.rank,
                reset_code: userDetails.reset_code,
                created_at: userDetails.created_at
              });
            }
          } catch (err) {
            console.error('Error loading user details:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          // User has signed out
          setUser(null);
        }
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (admissionNumber: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // First, check if the admission number exists in our users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('admission_number', admissionNumber)
        .single();
      
      if (userError) {
        throw new Error(`Invalid admission number. Please try again.`);
      }
      
      // Now, use the email from our users table to authenticate with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: users.email,
        password: password,
      });
      
      if (signInError) {
        throw new Error('Invalid password. Please try again or use the reset password option.');
      }
      
      // Update last login timestamp
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('admission_number', admissionNumber);
      
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log out';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (admissionNumber: string, resetCode: string) => {
    setLoading(true);
    setError(null);
    try {
      // Check if admission number exists and matches reset code
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('email, reset_code')
        .eq('admission_number', admissionNumber)
        .single();
      
      if (userError) {
        throw new Error('Invalid admission number. Please try again.');
      }
      
      if (!users.reset_code || users.reset_code !== resetCode) {
        throw new Error('Invalid secret key. Please try again.');
      }
      
      // Reset password to default
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        users.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      
      if (resetError) {
        throw new Error('Failed to reset password. Please try again later.');
      }
      
      // Also update in our users table
      await supabase
        .from('users')
        .update({ password: DEFAULT_PASSWORD })
        .eq('admission_number', admissionNumber);
      
      toast.success('Password has been reset to the default password. Please check your email for further instructions.');
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Update user data in our table
      const { error: updateError } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);
      
      if (updateError) {
        throw new Error('Failed to update profile. Please try again.');
      }
      
      // Update local state
      setUser({ ...user, ...data });
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        throw new Error('You must be logged in to change your password');
      }
      
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        throw new Error('Failed to update password. Please try again.');
      }
      
      // Also update in our users table
      await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id);
      
      toast.success('Password changed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        resetPassword,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
