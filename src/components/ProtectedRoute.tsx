
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  // Check if user session exists
  useEffect(() => {
    // We can add additional checks here if needed
    console.log("Protected route - Auth state:", { user, loading });
  }, [user, loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-strathmore-blue" />
          <p className="text-lg font-medium">Loading...</p>
          <p className="text-sm text-muted-foreground">Please wait while we verify your credentials.</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}
