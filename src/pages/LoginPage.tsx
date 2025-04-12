
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
      const result = await login(admissionNumber, password);
      
      if (result.success && result.user) {
        const userName = result.user.name || 'User';
        toast.success(`Welcome, ${userName}!`);
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Failed to login. Please check your credentials.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-strathmore-blue/90 to-purple-700/90 p-4">
      <div className="w-full max-w-md p-4 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center animate-scale-in">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg mb-2">
              <span className="text-2xl font-bold text-strathmore-blue">S</span>
            </div>
            <h1 className="text-3xl font-bold mt-2 text-white">myStrath</h1>
            <div className="text-white/80 text-sm mt-1">Resource Portal</div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-scale-in transition-all duration-300">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login" className="text-lg">Login</TabsTrigger>
            <TabsTrigger value="reset" className="text-lg">Reset Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="backdrop-blur-md bg-white/90 border-none shadow-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-strathmore-blue">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                  Enter your admission number and password to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admission_number" className="text-base">Admission Number</Label>
                    <Input
                      id="admission_number"
                      placeholder="Enter your admission number"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="h-12 text-base bg-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-base">Password</Label>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm"
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
                      className="h-12 text-base bg-white"
                      required
                    />
                  </div>
                  
                  <Button className="w-full h-12 text-base bg-strathmore-blue hover:bg-strathmore-blue/90 transition-all duration-300" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
            <Card className="backdrop-blur-md bg-white/90 border-none shadow-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center text-strathmore-blue">Reset your password</CardTitle>
                <CardDescription className="text-center">
                  Enter your admission number and we'll send a password reset link to your email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset_admission_number" className="text-base">Admission Number</Label>
                    <Input
                      id="reset_admission_number"
                      placeholder="Enter your admission number"
                      value={resetAdmissionNumber}
                      onChange={(e) => setResetAdmissionNumber(e.target.value)}
                      className="h-12 text-base bg-white"
                      required
                    />
                  </div>
                  
                  <Button className="w-full h-12 text-base bg-strathmore-blue hover:bg-strathmore-blue/90 transition-all duration-300" type="submit" disabled={resetLoading}>
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
        
        <div className="floating-elements absolute inset-0 pointer-events-none overflow-hidden">
          <div className="floating-element absolute top-20 left-12 text-white/20 animate-float" style={{ animationDelay: '0s' }}>
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="floating-element absolute top-10 right-10 text-white/10 animate-float-reverse" style={{ animationDelay: '0.5s' }}>
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,10.9c-0.61,0-1.1,0.49-1.1,1.1s0.49,1.1,1.1,1.1c0.61,0,1.1-0.49,1.1-1.1S12.61,10.9,12,10.9z M12,2 C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M14.19,14.19L6,18l3.81-8.19L18,6L14.19,14.19z" />
            </svg>
          </div>
          <div className="floating-element absolute bottom-20 right-14 text-white/15 animate-float" style={{ animationDelay: '1s' }}>
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" />
            </svg>
          </div>
          <div className="floating-element absolute bottom-40 left-10 text-white/10 animate-float-reverse" style={{ animationDelay: '1.5s' }}>
            <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
