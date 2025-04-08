
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { User } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PASSWORD } from '@/lib/constants';

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

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('strathmore-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('strathmore-user');
      }
    }
    setLoading(false);
  }, []);

  // Simulate the login functionality (in a real app, this would connect to Supabase)
  const login = async (admissionNumber: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // This is a mock implementation - in a real app, this would call Supabase auth
      // For now, we'll simulate a successful login with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (password !== DEFAULT_PASSWORD) {
        throw new Error('Invalid password. Please try again or use the reset password option.');
      }
      
      const mockUser: User = {
        id: 'mock-user-id',
        admission_number: admissionNumber,
        email: `${admissionNumber}@strathmore.edu`,
        name: 'Test User',
        class_instance_id: 1,
        is_admin: false,
        is_super_admin: false,
        points: 100,
        rank: 1,
        created_at: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('strathmore-user', JSON.stringify(mockUser));
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('strathmore-user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const resetPassword = async (admissionNumber: string, resetCode: string) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This would verify the reset code with Supabase
      // For now, we'll simulate a successful reset
      toast.success('Password has been reset to the default password. Please login with it.');
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('strathmore-user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
      }
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This would update the password in Supabase
      // For now, we'll simulate a successful update
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
