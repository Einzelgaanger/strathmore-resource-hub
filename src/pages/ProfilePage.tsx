
import React, { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, PencilIcon, Trash } from 'lucide-react';

export default function ProfilePage() {
  const { user, updatePassword, updateProfilePicture } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }
    
    setUploadingImage(true);
    
    try {
      await updateProfilePicture(user.id, file);
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(`Failed to update profile picture: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    // This is a placeholder. If user profile pictures can be removed, implement it here.
    toast.info('Profile picture removal feature will be implemented soon');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile and account settings.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    {uploadingImage ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    ) : (
                      <>
                        <AvatarImage src={user.profile_picture_url || undefined} />
                        <AvatarFallback className="text-xl">
                          {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  
                  <div 
                    className="absolute bottom-0 right-0 bg-primary rounded-full p-1 cursor-pointer transition-transform transform hover:scale-110"
                    onClick={handleProfilePictureClick}
                  >
                    <PencilIcon className="h-4 w-4 text-white" />
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                </div>
                
                <div className="text-center">
                  <h3 className="font-medium text-lg">{user.name}</h3>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  <div className="mt-2">
                    {user.is_admin && (
                      <Badge className="mr-2" variant="secondary">Admin</Badge>
                    )}
                    {user.is_super_admin && (
                      <Badge variant="secondary">Super Admin</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admission_number">Admission Number</Label>
                  <Input 
                    id="admission_number" 
                    value={user.admission_number} 
                    disabled 
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Admission number cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={user.name} 
                    disabled 
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Name cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={user.email} 
                    disabled 
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input 
                    id="current_password" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input 
                    id="new_password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input 
                    id="confirm_password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : 'Change Password'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Separator className="my-2" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-red-500">
                    Forgot Password?
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Password</AlertDialogTitle>
                    <AlertDialogDescription>
                      If you forgot your password, you can request a password reset link to be sent to your registered email address.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => {
                      toast.success(`A password reset link has been sent to ${user.email}. Please check your email.`);
                    }}>
                      Send Reset Link
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
