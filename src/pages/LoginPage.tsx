
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
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!admissionNumber.trim()) {
      setError("Please enter your admission number");
      return;
    }
    
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    
    try {
      console.log(`Login attempt with: ${admissionNumber}`);
      const user = await login(admissionNumber, password);
      
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
    
    if (!resetAdmissionNumber.trim()) {
      setResetError("Please enter your admission number");
      return;
    }
    
    if (!resetCode.trim()) {
      setResetError("Please enter your secret key");
      return;
    }
    
    try {
      await resetPassword(resetAdmissionNumber, resetCode);
      toast.success(`Password has been reset to the default: ${DEFAULT_PASSWORD}`);
      setResetAdmissionNumber('');
      setResetCode('');
      setActiveTab('login');
    } catch (error: any) {
      setResetError(error.message || 'Failed to reset password. Please check your details.');
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
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Default password for all users: {DEFAULT_PASSWORD}
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
                    <Label htmlFor="reset-code">Secret Key</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="Enter your secret key"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      If you haven't set a secret key yet, please contact your class admin.
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
                        Resetting password...
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
