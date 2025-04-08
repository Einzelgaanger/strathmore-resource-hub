
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-strathmore-blue mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! We couldn't find the page you're looking for.</p>
        <p className="text-gray-500 mb-8">The page may have been moved, deleted, or never existed.</p>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/">Return to Home</Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
