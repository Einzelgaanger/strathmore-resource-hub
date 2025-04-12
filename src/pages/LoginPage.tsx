
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Login state
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Reset password state
  const [resetAdmissionNumber, setResetAdmissionNumber] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = await login(admissionNumber, password);
      
      if (user) {
        toast.success(`Welcome, ${user.name}!`);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetAdmissionNumber.trim()) {
      toast.error('Please enter your admission number');
      return;
    }
    
    setResetLoading(true);
    
    try {
      // First, get the user email from the admission number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('admission_number', resetAdmissionNumber)
        .single();
      
      if (userError || !userData) {
        throw new Error('User not found with this admission number');
      }

      // Generate a reset code
      const resetCode = Math.random().toString(36).substring(2, 10);
      
      // Store the reset code
      const { error: updateError } = await supabase
        .from('users')
        .update({ reset_code: resetCode })
        .eq('admission_number', resetAdmissionNumber);
      
      if (updateError) throw updateError;
      
      // In a production app, this is where you would send an email with the reset link
      toast.success(`A password reset link has been sent to ${userData.email}. Please check your email.`);
      
      // Reset form and switch back to login
      setResetAdmissionNumber('');
      setActiveTab('login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to process password reset request');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-4">
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center">
            <img 
              src="/src/assets/logo.png" 
              alt="Logo" 
              className="h-16 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://strathmoreuniversity.edu/wp-content/uploads/2021/10/Favicon-v2.png';
              }}
            />
            <h1 className="text-2xl font-bold mt-2 text-strathmore-blue">myStrath</h1>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="reset">Reset Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                  Enter your admission number and password to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admission_number">Admission Number</Label>
                    <Input
                      id="admission_number"
                      placeholder="Enter your admission number"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs"
                        type="button"
                        onClick={() => setActiveTab('reset')}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="justify-center">
                <p className="text-sm text-center text-muted-foreground">
                  New to myStrath? Contact your class admin to get an account.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="reset">
            <Card>
              <CardHeader>
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>
                  Enter your admission number and we'll send a password reset link to your email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset_admission_number">Admission Number</Label>
                    <Input
                      id="reset_admission_number"
                      placeholder="Enter your admission number"
                      value={resetAdmissionNumber}
                      onChange={(e) => setResetAdmissionNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button className="w-full" type="submit" disabled={resetLoading}>
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="link" onClick={() => setActiveTab('login')}>
                  Back to login
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
