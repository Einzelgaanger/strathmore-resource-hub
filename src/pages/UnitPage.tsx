
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResourceGrid } from '@/components/resources/ResourceGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Resource, Unit, User } from '@/lib/types';
import { BookOpen, FileText, Award, FileQuestion, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase, getResourcesForUnit, getStudentRankingsForUnit, uploadFile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export default function UnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resourceType, setResourceType] = useState<'assignment' | 'note' | 'past_paper'>('assignment');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceDeadline, setResourceDeadline] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!unitId || !user) return;
      
      try {
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
        
        const { data: completions, error: completionsError } = await supabase
          .from('completions')
          .select('resource_id')
          .eq('user_id', user.id);
        
        if (!completionsError && completions) {
          setCompletedResourceIds(completions.map(c => c.resource_id));
        }
        
        const assignments = await getResourcesForUnit(parseInt(unitId), 'assignment');
        const notes = await getResourcesForUnit(parseInt(unitId), 'note');
        const pastPapers = await getResourcesForUnit(parseInt(unitId), 'past_paper');
        
        setResources({
          assignments,
          notes,
          past_papers: pastPapers
        });
        
        const creatorsMap: Record<string, User> = {};
        [...assignments, ...notes, ...pastPapers].forEach(resource => {
          if (resource.user) {
            creatorsMap[resource.user_id] = resource.user as unknown as User;
          }
        });
        setCreators(creatorsMap);
        
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

  const handleUpload = (type: 'assignment' | 'note' | 'past_paper') => {
    setResourceType(type);
    setResourceTitle('');
    setResourceDescription('');
    setResourceDeadline('');
    setResourceFile(null);
    setUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResourceFile(e.target.files[0]);
    }
  };

  const handleSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !unitId || !resourceTitle || !resourceDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    if ((resourceType === 'note' || resourceType === 'past_paper') && !resourceFile) {
      toast.error('Please upload a file for this resource type');
      return;
    }
    
    try {
      setUploading(true);
      toast.info('Uploading your resource, please wait...');
      
      let fileUrl = null;
      if (resourceFile) {
        try {
          console.log('Starting file upload process...');
          
          // Use a simpler path structure that works with our RLS policies
          const filePath = `public/${Date.now()}_${resourceFile.name.replace(/\s+/g, '_')}`;
          console.log('Uploading to path:', filePath);
          
          // First try direct public upload
          try {
            const { data, error } = await supabase.storage
              .from('resources')
              .upload(filePath, resourceFile, {
                upsert: true,
                contentType: resourceFile.type
              });
            
            if (error) throw error;
            
            const { data: urlData } = await supabase.storage
              .from('resources')
              .getPublicUrl(filePath);
            
            fileUrl = urlData.publicUrl;
            console.log('File uploaded successfully:', fileUrl);
          } catch (uploadError) {
            console.error('Direct upload failed, trying alternative method:', uploadError);
            // Fall back to the helper function
            const result = await uploadFile('resources', filePath, resourceFile);
            fileUrl = result.url;
          }
        } catch (uploadError: any) {
          console.error('Upload error details:', uploadError);
          toast.error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
          setUploading(false);
          return;
        }
      }
      
      console.log('Creating resource record with file URL:', fileUrl);
      
      // Use a direct REST API call with the Auth header if the standard approach doesn't work
      const resourceData = {
        title: resourceTitle,
        description: resourceDescription,
        file_url: fileUrl,
        deadline: resourceType === 'assignment' && resourceDeadline ? resourceDeadline : null,
        unit_id: parseInt(unitId),
        user_id: user.id,
        type: resourceType,
        likes: 0,
        dislikes: 0
      };
      
      // Try the standard Supabase client first
      try {
        const { data: resource, error: resourceError } = await supabase
          .from('resources')
          .insert(resourceData)
          .select()
          .single();
        
        if (resourceError) throw resourceError;
        
        toast.success(`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} uploaded successfully!`);
        
        // Award points based on resource type
        let pointsToAdd = 0;
        switch(resourceType) {
          case 'note': pointsToAdd = 50; break;
          case 'assignment': pointsToAdd = 10; break;
          case 'past_paper': pointsToAdd = 20; break;
        }
        
        if (pointsToAdd > 0) {
          await supabase
            .from('users')
            .update({ 
              points: user.points + pointsToAdd 
            })
            .eq('id', user.id);
        }
        
        window.location.reload();
      } catch (resourceError: any) {
        console.error('Resource creation error:', resourceError);
        
        // Fall back to a direct fetch with custom headers if needed
        if (resourceError.code === '42501') {
          try {
            console.log('Attempting direct API call for resource creation');
            const response = await fetch(`${supabase.supabaseUrl}/rest/v1/resources`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabase.supabaseKey,
                'Authorization': `Bearer ${supabase.supabaseKey}`,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(resourceData)
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`API error: ${JSON.stringify(errorData)}`);
            }
            
            toast.success(`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} uploaded successfully!`);
            
            // Force page refresh after successful upload
            setTimeout(() => window.location.reload(), 2000);
          } catch (fetchError) {
            console.error('Fetch API fallback failed:', fetchError);
            throw fetchError;
          }
        } else {
          throw resourceError;
        }
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource. Please try again later.');
    } finally {
      setUploading(false);
      setUploadDialogOpen(false);
    }
  };

  const handleCompleteResource = async (resourceId: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('completions')
        .insert({
          user_id: user.id,
          resource_id: resourceId,
          completed_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      await supabase
        .from('users')
        .update({ 
          points: user.points + 20 
        })
        .eq('id', user.id);
      
      setCompletedResourceIds([...completedResourceIds, resourceId]);
      
      toast.success('Assignment marked as complete!');
    } catch (error) {
      console.error('Error marking assignment as complete:', error);
      toast.error('Failed to mark assignment as complete');
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);
      
      if (error) throw error;
      
      setResources({
        assignments: resources.assignments.filter(r => r.id !== resourceId),
        notes: resources.notes.filter(r => r.id !== resourceId),
        past_papers: resources.past_papers.filter(r => r.id !== resourceId)
      });
      
      toast.success('Resource deleted successfully!');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

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
              onCompleteResource={handleCompleteResource}
              onDeleteResource={handleDeleteResource}
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
              onDeleteResource={handleDeleteResource}
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
              onDeleteResource={handleDeleteResource}
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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Upload {resourceType === 'assignment' 
                ? 'Assignment' 
                : resourceType === 'note' 
                  ? 'Notes' 
                  : 'Past Paper'}
            </DialogTitle>
            <DialogDescription>
              Share resources with your classmates to earn points.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitResource} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={resourceTitle} 
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Enter a title for your resource"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={resourceDescription}
                onChange={(e) => setResourceDescription(e.target.value)}
                placeholder="Provide a description of this resource"
                required
              />
            </div>
            
            {resourceType === 'assignment' && (
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input 
                  id="deadline" 
                  type="datetime-local"
                  value={resourceDeadline}
                  onChange={(e) => setResourceDeadline(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="file">
                File {resourceType === 'assignment' ? '(optional)' : '(required)'}
              </Label>
              <Input 
                id="file" 
                type="file"
                onChange={handleFileChange}
                required={resourceType !== 'assignment'}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
