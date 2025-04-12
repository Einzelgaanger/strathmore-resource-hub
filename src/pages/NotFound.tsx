
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CloudOff, Home, ArrowLeft, Book } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 overflow-hidden relative">
      {/* Floating animated elements in the background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-element absolute top-1/4 left-1/4 opacity-10">
          <CloudOff size={60} className="text-vibrant-red animate-float" />
        </div>
        <div className="floating-element absolute top-1/3 right-1/4 opacity-15">
          <Book size={80} className="text-vibrant-blue animate-float-reverse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="floating-element absolute bottom-1/4 left-1/3 opacity-10">
          <CloudOff size={50} className="text-vibrant-purple animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="floating-element absolute bottom-1/3 right-1/3 opacity-15">
          <Book size={70} className="text-vibrant-green animate-float-reverse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <div className="text-center max-w-md z-10 bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-fade-in">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
            <CloudOff size={40} className="text-vibrant-red" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-vibrant-blue mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! We couldn't find the page you're looking for.</p>
        <p className="text-gray-500 mb-8">The page may have been moved, deleted, or never existed.</p>
        
        <div className="space-y-3">
          <Button asChild className="w-full bg-vibrant-blue hover:bg-vibrant-blue/90 gap-2 shadow-md">
            <Link to="/dashboard">
              <Home size={18} />
              <span>Go to Dashboard</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full border-vibrant-blue text-vibrant-blue hover:bg-blue-50 gap-2">
            <Link to="/" onClick={() => window.history.back()}>
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
