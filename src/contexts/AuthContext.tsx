
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
      console.log(`Attempting to login with admission number: ${admissionNumber}`);
      
      // Use the simplified login function from supabase.ts
      const userDetails = await loginByAdmissionNumber(admissionNumber, password);
      
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'An error occurred during logout');
    }
  };

  const resetPassword = async (admissionNumber: string, resetCode: string) => {
    try {
      // Check if admission number and reset code match
      const { data, error } = await supabase
        .from('users')
        .select('email')
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

  // Add updateProfile method for ProfilePage
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

  // Add changePassword method as alias to updatePassword for ProfilePage
  const changePassword = updatePassword;

  // Check for user session on initial load and auth state changes
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Checking for existing session...');
        // Get the current auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Found session for user:', session.user.id);
          // Get user details from our users table
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching user details from session:', error);
            throw error;
          }
          
          console.log('Loaded user details:', data);
          setUser(data);
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (session?.user) {
          console.log('New session detected for user:', session.user.id);
          // Get user details on auth state change
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!error) {
            console.log('Updated user details loaded');
            setUser(data);
          } else {
            console.error('Error loading user details after auth change:', error);
          }
        } else {
          console.log('Session ended');
          setUser(null);
        }
        setLoading(false);
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
