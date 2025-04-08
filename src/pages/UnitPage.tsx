import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResourceGrid } from '@/components/resources/ResourceGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Resource, Unit, User } from '@/lib/types';
import { BookOpen, FileText, Award, FileQuestion, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase, getResourcesForUnit, getStudentRankingsForUnit } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function UnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments');
  const [unit, setUnit] = useState<Unit | null>(null);
  const [resources, setResources] = useState<{
    assignments: Resource[];
    notes: Resource[];
    past_papers: Resource[];
  }>({
    assignments: [],
    notes: [],
    past_papers: []
  });
  const [creators, setCreators] = useState<Record<string, User>>({});
  const [completedResourceIds, setCompletedResourceIds] = useState<number[]>([]);
  const [studentRankings, setStudentRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!unitId || !user) return;
      
      try {
        // Fetch unit details
        const { data: unitData, error: unitError } = await supabase
          .from('units')
          .select('*')
          .eq('id', unitId)
          .single();
        
        if (unitError) {
          console.error('Error fetching unit:', unitError);
          toast.error('Failed to load unit details');
          return;
        }
        
        setUnit(unitData);
        
        // Fetch completions
        const { data: completions, error: completionsError } = await supabase
          .from('completions')
          .select('resource_id')
          .eq('user_id', user.id);
        
        if (!completionsError && completions) {
          setCompletedResourceIds(completions.map(c => c.resource_id));
        }
        
        // Fetch assignments
        const assignments = await getResourcesForUnit(parseInt(unitId), 'assignment');
        
        // Fetch notes
        const notes = await getResourcesForUnit(parseInt(unitId), 'note');
        
        // Fetch past papers
        const pastPapers = await getResourcesForUnit(parseInt(unitId), 'past_paper');
        
        // Update resources
        setResources({
          assignments,
          notes,
          past_papers: pastPapers
        });
        
        // Extract creators
        const creatorsMap: Record<string, User> = {};
        [...assignments, ...notes, ...pastPapers].forEach(resource => {
          if (resource.user) {
            creatorsMap[resource.user_id] = resource.user as unknown as User;
          }
        });
        setCreators(creatorsMap);
        
        // Fetch student rankings
        const rankings = await getStudentRankingsForUnit(parseInt(unitId));
        setStudentRankings(rankings);
      } catch (error) {
        console.error('Error loading unit page data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUnitDetails();
  }, [unitId, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-strathmore-blue" />
            <p className="text-lg font-medium">Loading unit content...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!unit) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold">Unit not found</h2>
          <p className="text-muted-foreground mt-2">The unit you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{unit.name}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
            <p className="text-muted-foreground font-medium">{unit.code}</p>
            <div className="hidden sm:block text-muted-foreground">•</div>
            <p className="text-muted-foreground">Lecturer: {unit.lecturer}</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Notes</span>
            </TabsTrigger>
            <TabsTrigger value="past_papers" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              <span>Past Papers</span>
            </TabsTrigger>
            <TabsTrigger value="ranks" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Rankings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Assignments</h2>
              <Button onClick={() => handleUpload('assignment')}>Upload Assignment</Button>
            </div>
            
            <ResourceGrid 
              resources={resources.assignments} 
              creators={creators}
              completedResourceIds={completedResourceIds}
              emptyMessage="No assignments available for this unit yet."
            />
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Notes</h2>
              <Button onClick={() => handleUpload('note')}>Upload Notes</Button>
            </div>
            
            <ResourceGrid 
              resources={resources.notes} 
              creators={creators}
              emptyMessage="No notes available for this unit yet."
            />
          </TabsContent>
          
          <TabsContent value="past_papers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Past Papers</h2>
              <Button onClick={() => handleUpload('past_paper')}>Upload Past Paper</Button>
            </div>
            
            <ResourceGrid 
              resources={resources.past_papers} 
              creators={creators}
              emptyMessage="No past papers available for this unit yet."
            />
          </TabsContent>
          
          <TabsContent value="ranks" className="space-y-4">
            <h2 className="text-xl font-semibold">Student Rankings</h2>
            <p className="text-muted-foreground">
              Rankings are based on assignment completion times and participation.
            </p>
            
            <Card>
              <CardHeader>
                <CardTitle>Assignment Completion Rankings</CardTitle>
                <CardDescription>
                  Students ranked by average assignment completion time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {studentRankings.length > 0 ? (
                    studentRankings.map((student, index) => (
                      <div key={student.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                              {index + 1}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.profile_picture_url} />
                              <AvatarFallback>{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.admission}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-medium">{student.avgTime}</p>
                              <p className="text-xs text-muted-foreground">Avg. time</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{student.points}</p>
                              <p className="text-xs text-muted-foreground">Unit points</p>
                            </div>
                          </div>
                        </div>
                        <Progress value={student.completion} className="h-1" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No ranking data available yet.</p>
                      <p className="text-sm">Rankings will appear once students start completing assignments.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
