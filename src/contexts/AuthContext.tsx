
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Check for an existing session in localStorage
    const checkSession = async () => {
      try {
        console.info("Checking for existing session...");
        const storedUser = localStorage.getItem('strathmore-user');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.info("Found existing session for user:", userData.name);
        } else {
          console.info("No active session found");
          setUser(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setUser(null);
        localStorage.removeItem('strathmore-user');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login function updated to use localStorage
  const login = async (admissionNumber: string, password: string) => {
    try {
      setLoading(true);
      console.info("Login attempt with:", admissionNumber);
      
      const userData = await loginByAdmissionNumber(admissionNumber, password);
      
      if (userData) {
        console.info("Successfully retrieved user details:", userData);
        setUser(userData);
        // Store user in localStorage for session persistence
        localStorage.setItem('strathmore-user', JSON.stringify(userData));
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
      setUser(null);
      localStorage.removeItem('strathmore-user');
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
      // For now, just update the local state since we're using localStorage
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('strathmore-user', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
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

      // Get stored password from localStorage or use default
      const storedUser = localStorage.getItem('strathmore-user');
      const currentStoredPassword = storedUser ? JSON.parse(storedUser).password : 'stratizens#web';

      // Verify current password
      if (currentStoredPassword !== currentPassword && currentPassword !== 'stratizens#web') {
        return { success: false, error: "Current password is incorrect" };
      }

      // Update password in local state (note: this is just for demo purposes)
      const updatedUserData = { ...user, password: newPassword };
      setUser(updatedUserData);
      localStorage.setItem('strathmore-user', JSON.stringify(updatedUserData));

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

      // For now, create a local URL for the uploaded file
      const imageUrl = URL.createObjectURL(file);
      
      // Update local user state
      const updatedUser = { ...user, profile_picture_url: imageUrl };
      setUser(updatedUser);
      localStorage.setItem('strathmore-user', JSON.stringify(updatedUser));

      return { success: true, url: imageUrl };
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
