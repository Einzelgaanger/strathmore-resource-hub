
import React, { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RankBadge } from '@/components/ui/rank-badge';
import { DEFAULT_PASSWORD } from '@/lib/constants';
import { Pencil, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, updatePassword, updateProfilePicture } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profile_picture_url || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      // Auto-upload the profile picture when selected
      handleProfilePictureUpdate(file);
    }
  };
  
  const handleRemoveProfilePicture = async () => {
    setLoading(true);
    try {
      await updateProfile({ profile_picture_url: null });
      setPreviewUrl(null);
      setProfilePicture(null);
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Failed to remove profile picture:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (email === user.email) {
      toast.info('Email is unchanged');
      return;
    }
    
    setLoading(true);
    try {
      // Update email in the users table
      await updateProfile({ email });
      
      toast.success('Email updated successfully');
    } catch (error) {
      console.error('Failed to update email:', error);
      toast.error('Failed to update email');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfilePictureUpdate = async (file?: File) => {
    const fileToUpload = file || profilePicture;
    
    if (!fileToUpload) {
      toast.error('Please select a profile picture');
      return;
    }
    
    setLoading(true);
    try {
      await updateProfilePicture(user.id, fileToUpload);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and account settings
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>View and manage your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={previewUrl || undefined} />
                    <AvatarFallback className="text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="absolute bottom-0 right-0 flex gap-1">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8 rounded-full bg-background shadow-sm"
                      onClick={triggerFileInput}
                    >
                      <Pencil size={14} />
                    </Button>
                    
                    {previewUrl && (
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8 rounded-full bg-background shadow-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleRemoveProfilePicture}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                  />
                </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-muted-foreground">{user.admission_number}</p>
                  <div className="mt-1">
                    <RankBadge points={user.points} className="px-3 py-1" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Admission Number</Label>
                  <Input value={user.admission_number} readOnly disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your admission number cannot be changed
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={user.name} readOnly disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your name cannot be changed
                  </p>
                </div>
                
                <form onSubmit={handleEmailUpdate} className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={loading || email === user.email}
                    >
                      {loading ? 'Saving...' : 'Update'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This email will be used for password recovery
                  </p>
                </form>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your login password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={`Default password: ${DEFAULT_PASSWORD}`}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <p className="text-xs text-muted-foreground">
                If you've forgotten your password, use the reset password option on the login page with your registered email.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
