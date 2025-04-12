
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, PencilIcon, Trash, Award, BookOpen, Trophy, Rocket } from 'lucide-react';

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
      const result = await updatePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.error || "Failed to update password");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
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
      const result = await updateProfilePicture(user.id, file);
      if (result.success) {
        toast.success('Profile picture updated');
      } else {
        toast.error(`Failed to update profile picture: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Failed to update profile picture: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const getRankColor = (rank?: number) => {
    if (!rank) return "bg-rank-freshman text-gray-800";
    
    if (rank < 100) return "bg-rank-freshman text-gray-800";
    if (rank < 200) return "bg-rank-seeker text-gray-800";
    if (rank < 300) return "bg-rank-learner text-gray-800";
    if (rank < 400) return "bg-rank-ranger text-gray-800";
    if (rank < 500) return "bg-rank-achiever text-white";
    if (rank < 600) return "bg-rank-champion text-white";
    if (rank < 700) return "bg-rank-virtuoso text-white";
    if (rank < 800) return "bg-rank-maven text-white";
    if (rank < 900) return "bg-rank-elite text-white";
    return "bg-rank-legend text-white";
  };

  const getRankName = (rank?: number) => {
    if (!rank) return "Freshman";
    
    if (rank < 100) return "Freshman";
    if (rank < 200) return "Seeker";
    if (rank < 300) return "Learner";
    if (rank < 400) return "Ranger";
    if (rank < 500) return "Achiever";
    if (rank < 600) return "Champion";
    if (rank < 700) return "Virtuoso";
    if (rank < 800) return "Maven";
    if (rank < 900) return "Elite";
    return "Legend";
  };

  const getRankIcon = (rank?: number) => {
    if (!rank || rank < 300) return <BookOpen className="h-5 w-5" />;
    if (rank < 600) return <Award className="h-5 w-5" />;
    if (rank < 900) return <Trophy className="h-5 w-5" />;
    return <Rocket className="h-5 w-5" />;
  };

  return (
    <DashboardLayout>
      <div className="relative animate-fade-in">
        {/* Floating decoration elements */}
        <div className="absolute -top-10 right-10 text-blue-200/20 animate-float" style={{ animationDelay: '0.2s', zIndex: -1 }}>
          <svg className="h-32 w-32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
        <div className="absolute top-40 -left-5 text-green-200/10 animate-float-reverse" style={{ animationDelay: '0.5s', zIndex: -1 }}>
          <svg className="h-24 w-24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-5 text-purple-200/10 animate-float" style={{ animationDelay: '0.8s', zIndex: -1 }}>
          <svg className="h-36 w-36" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z" />
          </svg>
        </div>

        <div className="space-y-6">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Profile</h1>
            <p className="text-muted-foreground">
              Manage your profile and account settings.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="backdrop-blur-sm bg-white/80 shadow-xl border-0 animate-scale-in overflow-visible">
              <CardHeader className="relative">
                <div className="absolute -top-10 -left-3 w-24 h-24 rounded-full bg-gradient-to-br from-strathmore-blue to-purple-600 flex items-center justify-center transform -rotate-12">
                  <div className="text-white font-bold text-lg transform rotate-12">#{user.rank || 0}</div>
                </div>
                <CardTitle className="text-2xl flex items-center justify-between">
                  <span>User Information</span>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getRankColor(user.rank)}`}>
                    {getRankIcon(user.rank)}
                    {getRankName(user.rank)}
                  </div>
                </CardTitle>
                <CardDescription>
                  Your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-primary/20 hover:scale-105 transition-all duration-300">
                      {uploadingImage ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      ) : (
                        <>
                          <AvatarImage src={user.profile_picture_url || undefined} />
                          <AvatarFallback className="text-xl bg-gradient-to-br from-strathmore-blue to-purple-600 text-white">
                            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    
                    <div 
                      className="absolute bottom-0 right-0 bg-primary rounded-full p-1 cursor-pointer transition-transform transform hover:scale-125 hover:bg-blue-500"
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
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {user.is_admin && (
                        <Badge className="animate-pulse-light" variant="secondary">Admin</Badge>
                      )}
                      {user.is_super_admin && (
                        <Badge className="animate-pulse-light" variant="secondary">Super Admin</Badge>
                      )}
                      <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> {user.points || 0} Points
                      </Badge>
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
            
            <Card className="backdrop-blur-sm bg-white/80 shadow-xl border-0 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="text-2xl">Change Password</CardTitle>
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
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-strathmore-blue to-purple-600 hover:from-strathmore-blue/90 hover:to-purple-700 transition-all duration-300"
                    disabled={loading}
                  >
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
                    <Button variant="outline" className="w-full text-red-500 hover:bg-red-50">
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
      </div>
    </DashboardLayout>
  );
}
