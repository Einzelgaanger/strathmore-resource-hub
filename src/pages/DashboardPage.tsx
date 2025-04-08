
import React, { useEffect, useState } from 'react';
import { 
  BarChart, BookOpen, CheckCircle, Clock, Trophy, 
  Upload, Users, Calendar, Star, Loader2 
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
import { supabase, getMarketingContent } from '@/lib/supabase';
import { Resource, User } from '@/lib/types';
import { toast } from 'sonner';

interface CompletionWithResource {
  completed_at: string;
  resource: {
    title: string;
    type: string;
    created_at: string;
  };
}

interface CommentWithResource {
  created_at: string;
  resource: {
    title: string;
  };
}

interface ActivityItem {
  type: string;
  text: string;
  time: string;
  timestamp: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [marketingContent, setMarketingContent] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalResources: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    completionRate: 0,
    averageCompletionTime: 'N/A',
    totalUploads: 0,
    totalComments: 0,
    loginStreak: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch marketing content
        const marketingData = await getMarketingContent();
        setMarketingContent(marketingData);
        
        // Fetch leaderboard
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('users')
          .select('id, name, admission_number, points, profile_picture_url')
          .order('points', { ascending: false })
          .limit(10);
        
        if (!leaderboardError && leaderboardData) {
          setLeaderboard(leaderboardData);
        }
        
        // Fetch stats
        if (user.class_instance_id) {
          // Get all units for this class
          const { data: units, error: unitsError } = await supabase
            .from('units')
            .select('id')
            .eq('class_instance_id', user.class_instance_id);
          
          if (!unitsError && units) {
            const unitIds = units.map(u => u.id);
            
            // Count total resources
            const { count: totalResourcesCount, error: resourcesError } = await supabase
              .from('resources')
              .select('*', { count: 'exact', head: true })
              .in('unit_id', unitIds);
            
            // Count total assignments
            const { count: totalAssignmentsCount, error: assignmentsError } = await supabase
              .from('resources')
              .select('*', { count: 'exact', head: true })
              .in('unit_id', unitIds)
              .eq('type', 'assignment');
            
            // Count completed assignments
            const { count: completedAssignmentsCount, error: completionsError } = await supabase
              .from('completions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .in('resource_id', await getAssignmentIds(unitIds));
            
            // Count user uploads
            const { count: totalUploadsCount, error: uploadsError } = await supabase
              .from('resources')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            
            // Count user comments
            const { count: totalCommentsCount, error: commentsError } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            
            // Calculate completion rate
            const completionRate = totalAssignmentsCount && totalAssignmentsCount > 0
              ? Math.round((completedAssignmentsCount || 0) / totalAssignmentsCount * 100)
              : 0;
            
            // Set stats
            setStats({
              totalResources: totalResourcesCount || 0,
              completedAssignments: completedAssignmentsCount || 0,
              totalAssignments: totalAssignmentsCount || 0,
              completionRate,
              averageCompletionTime: await calculateAverageCompletionTime(user.id),
              totalUploads: totalUploadsCount || 0,
              totalComments: totalCommentsCount || 0,
              loginStreak: calculateLoginStreak(user),
              nextRank: getRankFromPoints(user.points + 100)
            });
          }
        }
        
        // Fetch recent activity
        const recentActivityData = await fetchRecentActivity(user.id);
        setRecentActivity(recentActivityData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load some dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  // Helper to get assignment IDs for a set of units
  const getAssignmentIds = async (unitIds: number[]) => {
    const { data, error } = await supabase
      .from('resources')
      .select('id')
      .in('unit_id', unitIds)
      .eq('type', 'assignment');
    
    if (error || !data) return [];
    return data.map(r => r.id);
  };
  
  // Helper to calculate average completion time
  const calculateAverageCompletionTime = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('completions')
        .select(`
          completed_at,
          resource:resource_id (
            created_at
          )
        `)
        .eq('user_id', userId);
      
      if (error || !data || data.length === 0) return 'N/A';
      
      let totalTimeMs = 0;
      let count = 0;
      
      data.forEach((completion: any) => {
        if (completion.resource && completion.resource.created_at) {
          const completedAt = new Date(completion.completed_at);
          const createdAt = new Date(completion.resource.created_at);
          const timeDiffMs = completedAt.getTime() - createdAt.getTime();
          totalTimeMs += timeDiffMs;
          count += 1;
        }
      });
      
      if (count === 0) return 'N/A';
      
      const avgTimeMs = totalTimeMs / count;
      return formatTime(avgTimeMs);
    } catch (error) {
      console.error('Error calculating average time:', error);
      return 'N/A';
    }
  };
  
  // Helper to format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0) result += `${seconds}s`;
    
    return result.trim() || '0s';
  };
  
  // Helper to calculate login streak
  const calculateLoginStreak = (user: User) => {
    // This would be a more complex calculation based on login history
    // For now, return a simple value
    return 1;
  };
  
  // Helper to fetch recent activity
  const fetchRecentActivity = async (userId: string): Promise<ActivityItem[]> => {
    try {
      // Combine activity from multiple sources
      const activities: ActivityItem[] = [];
      
      // Get recent uploads
      const { data: uploads, error: uploadsError } = await supabase
        .from('resources')
        .select('id, title, created_at, type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!uploadsError && uploads) {
        uploads.forEach((upload: Resource) => {
          activities.push({
            type: 'upload',
            text: `You uploaded ${upload.title}`,
            time: formatRelativeTime(upload.created_at),
            timestamp: new Date(upload.created_at).getTime()
          });
        });
      }
      
      // Get recent completions
      const { data: completions, error: completionsError } = await supabase
        .from('completions')
        .select(`
          completed_at,
          resource:resource_id (
            title,
            type
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(3);
      
      if (!completionsError && completions) {
        completions.forEach((completion: CompletionWithResource) => {
          if (completion.resource && completion.resource.title) {
            activities.push({
              type: 'complete',
              text: `You completed ${completion.resource.title}`,
              time: formatRelativeTime(completion.completed_at),
              timestamp: new Date(completion.completed_at).getTime()
            });
          }
        });
      }
      
      // Get recent comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          created_at,
          resource:resource_id (
            title
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!commentsError && comments) {
        comments.forEach((comment: CommentWithResource) => {
          if (comment.resource && comment.resource.title) {
            activities.push({
              type: 'comment',
              text: `You commented on ${comment.resource.title}`,
              time: formatRelativeTime(comment.created_at),
              timestamp: new Date(comment.created_at).getTime()
            });
          }
        });
      }
      
      // Add login activity if user has last_login
      if (user.last_login) {
        activities.push({
          type: 'login',
          text: 'You logged in',
          time: formatRelativeTime(user.last_login),
          timestamp: new Date(user.last_login).getTime()
        });
      }
      
      // Sort by timestamp descending and return top 5
      return activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  };
  
  // Helper to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  const currentRank = getRankFromPoints(user.points);
  const pointsToNextRank = stats.nextRank ? stats.nextRank.min - user.points : 0;
  const progressToNextRank = currentRank && currentRank.max > currentRank.min
    ? ((user.points - currentRank.min) / (currentRank.max - currentRank.min)) * 100
    : 0;
  
  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-strathmore-blue" />
            <p className="text-lg font-medium">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
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
                    {pointsToNextRank} points to reach {stats.nextRank?.name || "next rank"}
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
                  Per assignment
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
                {marketingContent.length > 0 ? (
                  marketingContent.map((announcement) => (
                    <div key={announcement.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{announcement.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm">{announcement.content}</p>
                      <Separator />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No announcements available.</p>
                  </div>
                )}
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
                {leaderboard.length > 0 ? (
                  leaderboard.map((leader, index) => (
                    <div key={leader.id} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        {index + 1}
                      </div>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={leader.profile_picture_url || undefined} />
                        <AvatarFallback>{leader.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <div className="font-medium">{leader.name}</div>
                        <div className="text-xs text-muted-foreground">{leader.admission_number}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-strathmore-gold text-strathmore-gold" />
                        <span className="font-medium">{leader.points}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No leaderboard data available yet.</p>
                  </div>
                )}
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recent activity available.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
