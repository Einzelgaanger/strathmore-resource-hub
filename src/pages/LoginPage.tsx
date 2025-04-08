
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { DEFAULT_PASSWORD } from '@/lib/constants';

export default function LoginPage() {
  const { login, resetPassword, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  
  // Login form
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  
  // Reset password form
  const [resetAdmissionNumber, setResetAdmissionNumber] = useState('');
  const [resetCode, setResetCode] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(admissionNumber, password);
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(resetAdmissionNumber, resetCode);
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
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admission-number">Admission Number</Label>
                    <Input
                      id="admission-number"
                      type="text"
                      placeholder="e.g. 123456"
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
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="reset">
                <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-admission">Admission Number</Label>
                    <Input
                      id="reset-admission"
                      type="text"
                      placeholder="e.g. 123456"
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
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Resetting password...' : 'Reset Password'}
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
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
