
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResourceGrid } from '@/components/resources/ResourceGrid';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Resource, Unit, User } from '@/lib/types';
import { BookOpen, FileText, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

// Mock data
const mockUnits: Unit[] = [
  { id: 1, name: 'Integral Calculus', code: 'MAT 2101', class_instance_id: 1, lecturer: 'Dr. Mary Johnson', created_at: '' },
  { id: 2, name: 'Real Analysis', code: 'MAT 2102', class_instance_id: 1, lecturer: 'Dr. James Smith', created_at: '' },
  { id: 3, name: 'Probability Theory', code: 'STA 2101', class_instance_id: 1, lecturer: 'Dr. Elizabeth Wilson', created_at: '' },
  { id: 4, name: 'Algorithms and Data Structures', code: 'DAT 2101', class_instance_id: 1, lecturer: 'Dr. Michael Brown', created_at: '' },
  { id: 5, name: 'Information Security, Governance and the Cloud', code: 'DAT 2102', class_instance_id: 1, lecturer: 'Dr. Sarah Taylor', created_at: '' },
  { id: 6, name: 'Principles of Ethics', code: 'HED 2101', class_instance_id: 1, lecturer: 'Dr. Robert Anderson', created_at: '' }
];

const mockResources: Record<string, Resource[]> = {
  assignments: [
    {
      id: 1,
      title: 'Assignment 1: Derivatives and Integrals',
      description: 'Complete the problems on pages 45-47 of your textbook.',
      unit_id: 1,
      user_id: 'user1',
      type: 'assignment',
      likes: 12,
      dislikes: 2,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'Assignment 2: Applications of Integration',
      description: 'Solve the real-world problems using definite integrals.',
      file_url: 'https://example.com/assignment2.pdf',
      unit_id: 1,
      user_id: 'user2',
      type: 'assignment',
      likes: 8,
      dislikes: 1,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  notes: [
    {
      id: 3,
      title: 'Lecture Notes: Introduction to Integration',
      description: 'Comprehensive notes from the first three lectures on integration.',
      file_url: 'https://example.com/integration_notes.pdf',
      unit_id: 1,
      user_id: 'user3',
      type: 'note',
      likes: 25,
      dislikes: 0,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      title: 'Study Guide: Techniques of Integration',
      description: 'A detailed guide covering all techniques discussed in class with examples.',
      file_url: 'https://example.com/integration_techniques.pdf',
      unit_id: 1,
      user_id: 'user1',
      type: 'note',
      likes: 18,
      dislikes: 1,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  past_papers: [
    {
      id: 5,
      title: 'Midterm Exam 2023',
      description: 'Previous year\'s midterm exam with solutions.',
      file_url: 'https://example.com/midterm_2023.pdf',
      unit_id: 1,
      user_id: 'user2',
      type: 'past_paper',
      likes: 32,
      dislikes: 0,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 6,
      title: 'Final Exam 2022',
      description: 'Final exam from last year with detailed solutions.',
      file_url: 'https://example.com/final_2022.pdf',
      unit_id: 1,
      user_id: 'user3',
      type: 'past_paper',
      likes: 40,
      dislikes: 2,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

const mockUsers: Record<string, User> = {
  user1: {
    id: 'user1',
    admission_number: '184087',
    email: '184087@strathmore.edu',
    name: 'Victoria Mutheu',
    class_instance_id: 1,
    is_admin: true,
    is_super_admin: false,
    points: 3500,
    rank: 8,
    created_at: ''
  },
  user2: {
    id: 'user2',
    admission_number: '171423',
    email: '171423@strathmore.edu',
    name: 'Neeza Musemakweli',
    class_instance_id: 1,
    is_admin: false,
    is_super_admin: false,
    points: 1800,
    rank: 5,
    created_at: ''
  },
  user3: {
    id: 'user3',
    admission_number: '172064',
    email: '172064@strathmore.edu',
    name: 'Natasha Nyanginda',
    class_instance_id: 1,
    is_admin: false,
    is_super_admin: false,
    points: 2200,
    rank: 6,
    created_at: ''
  }
};

// Mock completion data
const mockCompletedResourceIds = [1];

// Mock students and their rankings for a unit
const mockStudentRankings = [
  { id: 'user1', name: 'Victoria Mutheu', admission: '184087', avgTime: '1d 4h', completion: 100, points: 450 },
  { id: 'user4', name: 'Ethan Joseph', admission: '170757', avgTime: '1d 8h', completion: 95, points: 430 },
  { id: 'user2', name: 'Neeza Musemakweli', admission: '171423', avgTime: '1d 12h', completion: 90, points: 405 },
  { id: 'user5', name: 'Ainembabazi Ruth', admission: '171820', avgTime: '1d 18h', completion: 85, points: 380 },
  { id: 'user3', name: 'Natasha Nyanginda', admission: '172064', avgTime: '2d 2h', completion: 80, points: 360 },
  { id: 'user6', name: 'Nelly Mwende', admission: '172089', avgTime: '2d 8h', completion: 75, points: 320 },
  { id: 'user7', name: 'Joyrose Njahira', admission: '173461', avgTime: '2d 14h', completion: 70, points: 300 },
  { id: 'user8', name: 'Caredge Osir', admission: '176587', avgTime: '3d 0h', completion: 65, points: 280 },
  { id: 'user9', name: 'Shedrin Wambui', admission: '179181', avgTime: '3d 12h', completion: 60, points: 250 },
  { id: 'user10', name: 'Whitney Waithera', admission: '181140', avgTime: '4d 0h', completion: 55, points: 220 }
];

export default function UnitPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [activeTab, setActiveTab] = useState('assignments');
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call to fetch unit details
    const id = parseInt(unitId || '0');
    const foundUnit = mockUnits.find(u => u.id === id);
    setUnit(foundUnit || null);
    setLoading(false);
  }, [unitId]);
  
  if (loading) return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  if (!unit) return <DashboardLayout><div>Unit not found</div></DashboardLayout>;
  
  return (
    <DashboardLayout units={mockUnits}>
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
          <TabsList className="grid grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Notes</span>
            </TabsTrigger>
            <TabsTrigger value="ranks" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Rankings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Assignments</h2>
              <Button>Upload Assignment</Button>
            </div>
            
            <ResourceGrid 
              resources={mockResources.assignments} 
              creators={mockUsers}
              completedResourceIds={mockCompletedResourceIds}
              emptyMessage="No assignments available for this unit yet."
            />
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Notes</h2>
              <Button>Upload Notes</Button>
            </div>
            
            <ResourceGrid 
              resources={mockResources.notes} 
              creators={mockUsers}
              emptyMessage="No notes available for this unit yet."
            />
          </TabsContent>
          
          <TabsContent value="past_papers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Past Papers</h2>
              <Button>Upload Past Paper</Button>
            </div>
            
            <ResourceGrid 
              resources={mockResources.past_papers} 
              creators={mockUsers}
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
                  {mockStudentRankings.map((student, index) => (
                    <div key={student.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
