import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, loginByAdmissionNumber } from '@/lib/supabase';
import { User } from '@/lib/types';
import { DEFAULT_PASSWORD } from '@/lib/constants';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (admissionNumber: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (admissionNumber: string, resetCode: string) => Promise<boolean>;
  updateResetCode: (userId: string, resetCode: string) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateProfilePicture: (userId: string, file: File) => Promise<string>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Authentication functions
  const login = async (admissionNumber: string, password: string) => {
    try {
      console.log(`Login attempt with: ${admissionNumber}`);
      
      // Use our simplified direct login function
      const userDetails = await loginByAdmissionNumber(admissionNumber, password || DEFAULT_PASSWORD);
      
      console.log('Successfully retrieved user details:', userDetails);
      setUser(userDetails);
      return userDetails;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'An error occurred during login');
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      // Create the user in Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      // Create the user in our users table
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            ...userData
          });
        
        if (insertError) throw insertError;
      }
      
      return data;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'An error occurred during signup');
    }
  };

  const logout = async () => {
    try {
      // Always clear the local user state
      setUser(null);
      
      // Attempt to sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase Auth signout error (non-critical):', error);
      }
      
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if there's an error, still clear user state and redirect
      setUser(null);
      navigate('/login');
    }
  };

  const resetPassword = async (admissionNumber: string, resetCode: string) => {
    try {
      // Check if admission number and reset code match
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('admission_number', admissionNumber)
        .eq('reset_code', resetCode)
        .single();
      
      if (error) {
        throw new Error('Invalid admission number or reset code');
      }
      
      // Reset password to default
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: DEFAULT_PASSWORD })
        .eq('admission_number', admissionNumber);
      
      if (updateError) {
        throw updateError;
      }
      
      return true;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'An error occurred during password reset');
    }
  };

  const updateResetCode = async (userId: string, resetCode: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ reset_code: resetCode })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update the local user state
      setUser(prev => prev ? { ...prev, reset_code: resetCode } : null);
      
      return true;
    } catch (error: any) {
      console.error('Update reset code error:', error);
      throw new Error(error.message || 'An error occurred while updating reset code');
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user?.email) throw new Error('User email not found');
      
      // Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (verifyError) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Update password in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      return true;
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'An error occurred while updating password');
    }
  };

  const updateProfilePicture = async (userId: string, file: File) => {
    try {
      // Upload the file
      const fileName = `${userId}/${Date.now()}_profile.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);
      
      // Update the user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: urlData.publicUrl })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // Update the local user state
      setUser(prev => prev ? { ...prev, profile_picture_url: urlData.publicUrl } : null);
      
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Update profile picture error:', error);
      throw new Error(error.message || 'An error occurred while updating profile picture');
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (!user?.id) throw new Error('User ID not found');
      
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update the local user state
      setUser(prev => prev ? { ...prev, ...userData } : null);
      
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw new Error(error.message || 'An error occurred while updating profile');
    }
  };

  const changePassword = updatePassword;

  useEffect(() => {
    const checkForExistingSession = async () => {
      setLoading(true);
      try {
        console.log('Checking for existing session...');
        
        // First try to get session from browser storage
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Found session for user:', session.user.id);
          // Get user details from our users table
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!error && data) {
            console.log('Loaded user details from session:', data);
            setUser(data);
          } else {
            console.log('Could not load user details from session. Clearing session.');
            await supabase.auth.signOut();
          }
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error checking for session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkForExistingSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
        } else if (session?.user && event === 'SIGNED_IN') {
          console.log('User signed in:', session.user.id);
          
          // Get user details from our users table
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!error && data) {
            console.log('Loaded user details after sign in:', data);
            setUser(data);
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const value = {
    user,
    loading,
    login,
    signUp,
    logout,
    resetPassword,
    updateResetCode,
    updatePassword,
    updateProfilePicture,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
