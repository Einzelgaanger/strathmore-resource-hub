
export interface User {
  id: string;
  admission_number: string;
  email: string;
  name: string;
  profile_picture_url?: string;
  class_instance_id: number;
  is_admin: boolean;
  is_super_admin: boolean;
  points: number;
  rank: number;
  reset_code?: string;
  created_at: string;
}

export interface ClassInstance {
  id: number;
  program_id: number;
  course_id: number;
  year_id: number;
  semester_id: number;
  group_id: number;
  admin_id?: string;
  created_at: string;
}

export interface Program {
  id: number;
  name: string;
  created_at: string;
}

export interface Course {
  id: number;
  name: string;
  program_id: number;
  created_at: string;
}

export interface Year {
  id: number;
  name: string;
  course_id: number;
  created_at: string;
}

export interface Semester {
  id: number;
  name: string;
  year_id: number;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  semester_id: number;
  created_at: string;
}

export interface Unit {
  id: number;
  name: string;
  code: string;
  class_instance_id: number;
  lecturer: string;
  created_at: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  file_url?: string;
  deadline?: string;
  unit_id: number;
  user_id: string;
  type: 'assignment' | 'note' | 'past_paper';
  likes: number;
  dislikes: number;
  created_at: string;
}

export interface Completion {
  id: number;
  user_id: string;
  resource_id: number;
  completed_at: string;
  created_at: string;
}

export interface Comment {
  id: number;
  content: string;
  user_id: string;
  resource_id: number;
  created_at: string;
  user?: User;
}

export interface MarketingContent {
  id: number;
  title: string;
  content: string;
  file_url?: string;
  created_by: string;
  type: 'file' | 'video' | 'quote' | 'image' | 'text';
  created_at: string;
}

export interface Rank {
  id: number;
  name: string;
  icon: string;
  min_points: number;
  max_points: number;
  created_at: string;
}
