
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEFAULT_PASSWORD } from '@/lib/constants';
import { Loader2, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const { login, resetPassword, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  const navigate = useNavigate();
  
  // Login form
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Reset password form
  const [resetAdmissionNumber, setResetAdmissionNumber] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!admissionNumber.trim()) {
      setError("Please enter your admission number");
      return;
    }
    
    try {
      console.log(`Login attempt with: ${admissionNumber}`);
      // If password is empty, we'll use the default password in the login function
      const user = await login(admissionNumber, password || DEFAULT_PASSWORD);
      
      if (user) {
        console.log("Login successful, navigating to dashboard");
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      setError(error.message || 'Failed to login. Please check your credentials.');
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResettingPassword(true);
    
    if (!resetAdmissionNumber.trim()) {
      setResetError("Please enter your admission number");
      setResettingPassword(false);
      return;
    }
    
    try {
      // First, get the user's email from their admission number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, reset_code')
        .eq('admission_number', resetAdmissionNumber)
        .single();
      
      if (userError || !userData) {
        setResetError("User not found. Please check your admission number.");
        setResettingPassword(false);
        return;
      }
      
      // If reset code is provided, use it for immediate reset
      if (resetCode) {
        if (userData.reset_code !== resetCode) {
          setResetError("Invalid reset code. Please check and try again.");
          setResettingPassword(false);
          return;
        }
        
        await resetPassword(resetAdmissionNumber, resetCode);
        toast.success(`Password has been reset to the default: ${DEFAULT_PASSWORD}`);
        setResetSuccess(true);
        setResetAdmissionNumber('');
        setResetCode('');
        setTimeout(() => setActiveTab('login'), 3000);
      } else {
        // If reset code is not provided, check if user has a valid email
        const email = userData.email;
        
        if (!email || !email.includes('@')) {
          setResetError("No valid email found for this account. Please update your email in your profile or contact support.");
          setResettingPassword(false);
          return;
        }
        
        // Create a reset code if one doesn't exist
        if (!userData.reset_code) {
          const resetCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          const { error: updateError } = await supabase
            .from('users')
            .update({ reset_code: resetCode })
            .eq('admission_number', resetAdmissionNumber);
          
          if (updateError) {
            throw updateError;
          }
        }
        
        // For now, just show a message with instructions
        // In a real implementation, you would send an email here
        toast.success(`Please check your email (${email.replace(/^(.)(.*)(.@.*)$/, '$1****$3')}) for reset instructions or use your secret key to reset your password.`);
        setResetSuccess(true);
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      setResetError(error.message || 'Failed to process your reset request. Please try again later.');
    } finally {
      setResettingPassword(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">myStrath</CardTitle>
            <CardDescription className="text-center">
              Enter your admission number and password to access your resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="reset">Reset Password</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Login Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admission-number">Admission Number</Label>
                    <Input
                      id="admission-number"
                      type="text"
                      placeholder="e.g. 180963"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={`Default password: ${DEFAULT_PASSWORD}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default password for all users: {DEFAULT_PASSWORD}<br/>
                      <strong>Leave password empty to use the default password</strong>
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="reset">
                {resetError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Reset Error</AlertTitle>
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}
                
                {resetSuccess && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <Mail className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Check your email</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Password reset instructions have been sent. Check your email or use your secret key to reset your password.
                    </AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-admission">Admission Number</Label>
                    <Input
                      id="reset-admission"
                      type="text"
                      placeholder="e.g. 180963"
                      value={resetAdmissionNumber}
                      onChange={(e) => setResetAdmissionNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset-code">Secret Key (Optional)</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="Enter your secret key if you have one"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you haven't set a secret key, we'll send reset instructions to your email. Make sure your email is updated in your profile.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={resettingPassword}
                  >
                    {resettingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : 'Reset Password'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
              <Link to="/" className="text-strathmore-blue hover:underline">
                Back to Home
              </Link>
              <br />
              <span className="text-xs">
                Admission numbers: 180963, 190037, 165011, etc. with default password: {DEFAULT_PASSWORD}
              </span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
