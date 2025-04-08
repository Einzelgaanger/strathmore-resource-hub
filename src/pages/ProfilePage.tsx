
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RankBadge, getRankFromPoints } from '@/components/ui/rank-badge';
import { DEFAULT_PASSWORD } from '@/lib/constants';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profile_picture_url || null);
  const [secretKey, setSecretKey] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const handleSecretKeyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error('Please enter a secret key');
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile({ reset_code: secretKey });
      toast.success('Secret key updated successfully');
      setSecretKey('');
    } catch (error) {
      console.error('Failed to update secret key:', error);
      toast.error('Failed to update secret key');
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
      await changePassword(currentPassword, newPassword);
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
  
  const handleProfilePictureUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePicture) {
      toast.error('Please select a profile picture');
      return;
    }
    
    setLoading(true);
    try {
      // In a real app, this would upload the picture to storage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock a new profile picture URL
      await updateProfile({ profile_picture_url: previewUrl });
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };
  
  const currentRank = getRankFromPoints(user.points);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and security settings
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
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl || undefined} />
                  <AvatarFallback className="text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
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
                </div>
                
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={user.name} readOnly disabled />
                </div>
                
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={user.email} readOnly disabled />
                </div>
                
                <div className="space-y-1">
                  <Label>Points</Label>
                  <div className="flex items-center gap-2">
                    <Input value={user.points.toString()} readOnly disabled />
                    <div className="bg-muted px-3 py-1 rounded text-xs">
                      {currentRank.name}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Profile Picture</CardTitle>
                <CardDescription>Upload a new profile photo</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfilePictureUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-picture">Select a new picture</Label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading || !profilePicture}>
                    {loading ? 'Updating...' : 'Update Profile Picture'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Update Secret Key</CardTitle>
                <CardDescription>Set a secret key for password recovery</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSecretKeyUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="secret-key">New Secret Key</Label>
                    <Input
                      id="secret-key"
                      type="text"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter a memorable word or phrase"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your secret key will be used if you need to reset your password.
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Secret Key'}
                  </Button>
                </form>
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
                  If you've forgotten your password, use the reset password option on the login page with your secret key.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
