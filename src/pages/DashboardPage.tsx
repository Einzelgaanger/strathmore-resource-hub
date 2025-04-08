
import React from 'react';
import { 
  BarChart, BookOpen, CheckCircle, Clock, Trophy, 
  Upload, Users, Calendar, Star 
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RankBadge, getRankFromPoints } from '@/components/ui/rank-badge';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Mock data for dashboard statistics
  const stats = {
    totalResources: 145,
    completedAssignments: 12,
    totalAssignments: 15,
    completionRate: 80,
    averageCompletionTime: '2 days, 4 hours',
    totalUploads: 8,
    totalComments: 26,
    loginStreak: 7,
    nextRank: getRankFromPoints(user.points + 100)
  };
  
  // Mock data for leaderboard
  const leaderboard = [
    { id: 1, name: 'Victoria Mutheu', admission: '184087', points: 3500, picture: null },
    { id: 2, name: 'John Smith', admission: '165001', points: 2800, picture: null },
    { id: 3, name: 'Jane Doe', admission: '165002', points: 2500, picture: null },
    { id: 4, name: 'Michael Brown', admission: '165003', points: 2300, picture: null },
    { id: 5, name: 'Sophia Kumar', admission: '195001', points: 2100, picture: null }
  ];
  
  // Mock data for recent activity
  const recentActivity = [
    { type: 'upload', text: 'You uploaded Real Analysis Notes', time: '2 hours ago' },
    { type: 'complete', text: 'You completed Probability Assignment 3', time: '1 day ago' },
    { type: 'comment', text: 'You commented on Data Structures Final Exam', time: '2 days ago' },
    { type: 'login', text: 'You logged in', time: '3 days ago' }
  ];
  
  // Mock data for announcements
  const announcements = [
    { 
      id: 1, 
      title: 'End of Semester Preparation', 
      content: 'Get ready for final exams with our comprehensive study resources!',
      type: 'text',
      date: new Date() 
    },
    { 
      id: 2, 
      title: 'New Feature: Resource Ratings', 
      content: 'You can now rate resources to help others find the most useful materials.',
      type: 'text',
      date: new Date(Date.now() - 86400000) 
    }
  ];
  
  const currentRank = getRankFromPoints(user.points);
  const pointsToNextRank = stats.nextRank.min - user.points;
  const progressToNextRank = ((user.points - currentRank.min) / (currentRank.max - currentRank.min)) * 100;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}! Track your progress and see what's new.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{currentRank.icon}</span>
                    <div>
                      <div className="font-semibold">{currentRank.name}</div>
                      <div className="text-xs text-muted-foreground">{user.points} points</div>
                    </div>
                  </div>
                  <RankBadge points={user.points} />
                </div>
                
                <Progress value={progressToNextRank} className="h-2" />
                
                <div className="text-xs text-muted-foreground">
                  {pointsToNextRank} points to reach {stats.nextRank.name}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignment Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <Progress value={stats.completionRate} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {stats.completedAssignments} of {stats.totalAssignments} assignments completed
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageCompletionTime}</div>
              <p className="text-xs text-muted-foreground">
                Per assignment (faster than 75% of your classmates)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources Accessed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResources}</div>
              <p className="text-xs text-muted-foreground">
                Across all your units
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Contributions</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUploads}</div>
              <p className="text-xs text-muted-foreground">
                Uploads and {stats.totalComments} comments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Streak</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.loginStreak} days</div>
              <p className="text-xs text-muted-foreground">
                Keep it up for more points!
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                Important updates from administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{announcement.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {format(announcement.date, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm">{announcement.content}</p>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Students with the most points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaderboard.map((leader, index) => (
                <div key={leader.id} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    {index + 1}
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={leader.picture || undefined} />
                    <AvatarFallback>{leader.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <div className="font-medium">{leader.name}</div>
                    <div className="text-xs text-muted-foreground">{leader.admission}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-strathmore-gold text-strathmore-gold" />
                    <span className="font-medium">{leader.points}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="rounded-full bg-muted p-2">
                    {activity.type === 'upload' && <Upload className="h-4 w-4" />}
                    {activity.type === 'complete' && <CheckCircle className="h-4 w-4" />}
                    {activity.type === 'comment' && <Users className="h-4 w-4" />}
                    {activity.type === 'login' && <Calendar className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
