
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Star, UserCheck, BookOpen, Info, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Unit, MarketingContent, Resource } from '@/lib/types';
import { RANKS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { formatDistance } from 'date-fns';

// Define specific interfaces for completion and comment data to fix TypeScript errors
interface ResourceData {
  title: string;
  type?: string;
  created_at?: string;
}

interface CompletionWithResource {
  completed_at: string;
  resource: ResourceData;
}

interface CommentWithResource {
  created_at: string;
  resource: ResourceData;
}

const pointsColors = ['#4C51BF', '#4299E1', '#38B2AC', '#48BB78', '#ECC94B', '#ED8936', '#F56565'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);
  const [marketingContent, setMarketingContent] = useState<MarketingContent[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    completedAssignments: 0,
    totalAssignments: 0,
    uploadedResources: 0,
    comments: 0,
    lastLogin: null as string | null,
  });
  const [activityData, setActivityData] = useState<{
    completions: CompletionWithResource[];
    comments: CommentWithResource[];
  }>({
    completions: [],
    comments: []
  });

  // Get user rank details
  const userRank = RANKS.find(rank => 
    user?.points !== undefined && user.points >= rank.min_points && user.points <= rank.max_points
  ) || RANKS[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch units for user's class
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('*')
          .eq('class_instance_id', user.class_instance_id)
          .order('name');
        
        if (unitsError) throw unitsError;
        setUnits(unitsData || []);
        
        // Fetch marketing content
        const { data: marketingData, error: marketingError } = await supabase
          .from('marketing_content')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (marketingError) throw marketingError;
        setMarketingContent(marketingData || []);
        
        // Fetch top users by points
        const { data: topUsersData, error: topUsersError } = await supabase
          .from('users')
          .select('id, name, admission_number, profile_picture_url, points, rank')
          .eq('class_instance_id', user.class_instance_id)
          .order('points', { ascending: false })
          .limit(10);
        
        if (topUsersError) throw topUsersError;
        setTopUsers(topUsersData || []);
        
        // Calculate total assignments for user's class
        const { count: totalAssignments, error: totalAssignmentsError } = await supabase
          .from('resources')
          .select('id', { count: 'exact' })
          .eq('type', 'assignment')
          .in('unit_id', (unitsData || []).map(unit => unit.id));
        
        if (totalAssignmentsError) throw totalAssignmentsError;
        
        // Calculate user's completed assignments
        const { count: completedAssignments, error: completedAssignmentsError } = await supabase
          .from('completions')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
        
        if (completedAssignmentsError) throw completedAssignmentsError;
        
        // Calculate user's uploaded resources
        const { count: uploadedResources, error: uploadedResourcesError } = await supabase
          .from('resources')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
        
        if (uploadedResourcesError) throw uploadedResourcesError;
        
        // Calculate user's comments
        const { count: comments, error: commentsError } = await supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
        
        if (commentsError) throw commentsError;
        
        // Get user's recent completions
        const { data: completionsData, error: completionsError } = await supabase
          .from('completions')
          .select(`
            completed_at,
            resource:resource_id (
              title,
              type,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5);
        
        if (completionsError) throw completionsError;
        
        // Get user's recent comments
        const { data: commentsData, error: recentCommentsError } = await supabase
          .from('comments')
          .select(`
            created_at,
            resource:resource_id (
              title
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (recentCommentsError) throw recentCommentsError;
        
        // Update user stats
        setUserStats({
          completedAssignments: completedAssignments || 0,
          totalAssignments: totalAssignments || 0,
          uploadedResources: uploadedResources || 0,
          comments: comments || 0,
          lastLogin: user.last_login || null,
        });
        
        // Process completions data - fix TypeScript errors by handling each item correctly
        const processedCompletions: CompletionWithResource[] = [];
        if (completionsData) {
          completionsData.forEach((item) => {
            if (item && item.resource) {
              processedCompletions.push({
                completed_at: item.completed_at,
                resource: {
                  title: item.resource.title || 'Unknown',
                  type: item.resource.type || 'assignment',
                  created_at: item.resource.created_at || new Date().toISOString()
                }
              });
            }
          });
        }
        
        // Process comments data - fix TypeScript errors by handling each item correctly
        const processedComments: CommentWithResource[] = [];
        if (commentsData) {
          commentsData.forEach((item) => {
            if (item && item.resource) {
              processedComments.push({
                created_at: item.created_at,
                resource: {
                  title: item.resource.title || 'Unknown'
                }
              });
            }
          });
        }
        
        setActivityData({
          completions: processedCompletions,
          comments: processedComments
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Update login points - once per session
    const updateLoginPoints = async () => {
      if (!user) return;
      
      try {
        // Add 5 points for logging in
        await supabase
          .from('users')
          .update({ 
            points: user.points + 5,
            last_login: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating login points:', error);
      }
    };
    
    if (user && !user.last_login) {
      updateLoginPoints();
    }
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-strathmore-blue" />
            <p className="text-lg font-medium">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-muted-foreground text-right">
                  Last login: {userStats.lastLogin ? formatDistance(new Date(userStats.lastLogin), new Date(), { addSuffix: true }) : 'First time'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Marketing Content */}
          {marketingContent.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Announcements</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {marketingContent.slice(0, 3).map((content) => (
                  <Card key={content.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-sm ${content.type === 'quote' ? 'italic' : ''}`}>
                        {content.content}
                      </p>
                      {content.file_url && (
                        <div className="mt-4">
                          {content.type === 'image' ? (
                            <img 
                              src={content.file_url} 
                              alt={content.title} 
                              className="rounded-md w-full h-32 object-cover"
                            />
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(content.file_url, '_blank')}
                            >
                              View Resource
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* User Stats and Activity */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Assignments Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.completedAssignments}/{userStats.totalAssignments}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.totalAssignments === 0 
                    ? 'No assignments available' 
                    : `${Math.round((userStats.completedAssignments / userStats.totalAssignments) * 100)}% completion rate`
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Your Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.points || 0}</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Rank:</span>
                  <Badge variant="outline" className="text-xs">
                    {userRank.icon} {userRank.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resources Shared</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.uploadedResources}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.uploadedResources === 0 
                    ? 'No resources uploaded yet' 
                    : `+${userStats.uploadedResources * 10} points earned`
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Comments Made</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.comments}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.comments === 0 
                    ? 'No comments yet' 
                    : `+${userStats.comments} points earned`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Class Leaderboard and User Activity */}
          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Class Leaderboard</CardTitle>
                <CardDescription>
                  Top students ranked by points earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topUsers.slice(0, 5).map((topUser, index) => {
                    const userRankInfo = RANKS.find(r => 
                      topUser.points >= r.min_points && topUser.points <= r.max_points
                    ) || RANKS[0];
                    
                    return (
                      <div key={topUser.id} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {index + 1}
                        </div>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={topUser.profile_picture_url} />
                          <AvatarFallback>{topUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="ml-auto font-medium">
                          {topUser.points} points
                        </div>
                        <div className="ml-auto text-muted-foreground text-sm">
                          {userRankInfo.icon} {userRankInfo.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>
                  Points breakdown and next rank
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-4">
                <div className="h-40 w-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Assignments', value: userStats.completedAssignments * 20 },
                          { name: 'Resources', value: userStats.uploadedResources * 10 },
                          { name: 'Comments', value: userStats.comments },
                          { name: 'Logins', value: user?.points ? user.points - (userStats.completedAssignments * 20 + userStats.uploadedResources * 10 + userStats.comments) : 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[...Array(4)].map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pointsColors[index % pointsColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} points`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center space-y-2">
                  <p className="text-sm">
                    Current Rank: <span className="font-medium">{userRank.icon} {userRank.name}</span>
                  </p>
                  {user?.points !== undefined && user.points < RANKS[RANKS.length - 1].min_points && (
                    <p className="text-xs text-muted-foreground">
                      {RANKS.findIndex(r => r.id === userRank.id) < RANKS.length - 1 ? (
                        <>
                          {RANKS[RANKS.findIndex(r => r.id === userRank.id) + 1].min_points - user.points} points until next rank:
                          <br />
                          <span className="font-medium">
                            {RANKS[RANKS.findIndex(r => r.id === userRank.id) + 1].icon} {RANKS[RANKS.findIndex(r => r.id === userRank.id) + 1].name}
                          </span>
                        </>
                      ) : 'Highest rank achieved!'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Recent Activity</h2>
            <Tabs defaultValue="completions">
              <TabsList>
                <TabsTrigger value="completions" className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" /> Completions
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-1">
                  <Info className="h-4 w-4" /> Comments
                </TabsTrigger>
              </TabsList>
              <TabsContent value="completions" className="mt-4">
                {activityData.completions.length > 0 ? (
                  <div className="space-y-4">
                    {activityData.completions.map((completion, index) => (
                      <Alert key={index}>
                        <Calendar className="h-4 w-4" />
                        <AlertTitle>Completed: {completion.resource.title}</AlertTitle>
                        <AlertDescription>
                          {formatDistance(new Date(completion.completed_at), new Date(), { addSuffix: true })}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-muted-foreground">
                    You haven't completed any assignments yet.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="comments" className="mt-4">
                {activityData.comments.length > 0 ? (
                  <div className="space-y-4">
                    {activityData.comments.map((comment, index) => (
                      <Alert key={index}>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Commented on: {comment.resource.title}</AlertTitle>
                        <AlertDescription>
                          {formatDistance(new Date(comment.created_at), new Date(), { addSuffix: true })}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-muted-foreground">
                    You haven't made any comments yet.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Your Units */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Units</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <Card key={unit.id} className="overflow-hidden">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg">
                      <Link to={`/unit/${unit.id}`} className="hover:underline">
                        {unit.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>{unit.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm">Lecturer: {unit.lecturer}</p>
                    <div className="mt-4">
                      <Button asChild size="sm">
                        <Link to={`/unit/${unit.id}`}>
                          <BookOpen className="mr-2 h-4 w-4" /> View Unit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
