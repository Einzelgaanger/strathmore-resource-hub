
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          admission_number: string;
          email: string;
          name: string;
          password: string;
          profile_picture_url: string | null;
          class_instance_id: number | null;
          is_admin: boolean;
          is_super_admin: boolean;
          points: number;
          rank: number;
          reset_code: string | null;
          last_login: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admission_number: string;
          email: string;
          name: string;
          password?: string;
          profile_picture_url?: string | null;
          class_instance_id?: number | null;
          is_admin?: boolean;
          is_super_admin?: boolean;
          points?: number;
          rank?: number;
          reset_code?: string | null;
          last_login?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admission_number?: string;
          email?: string;
          name?: string;
          password?: string;
          profile_picture_url?: string | null;
          class_instance_id?: number | null;
          is_admin?: boolean;
          is_super_admin?: boolean;
          points?: number;
          rank?: number;
          reset_code?: string | null;
          last_login?: string | null;
          created_at?: string;
        };
      };
      class_instances: {
        Row: {
          id: number;
          program_id: number;
          course_id: number;
          year_id: number;
          semester_id: number;
          group_id: number;
          admin_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          program_id: number;
          course_id: number;
          year_id: number;
          semester_id: number;
          group_id: number;
          admin_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          program_id?: number;
          course_id?: number;
          year_id?: number;
          semester_id?: number;
          group_id?: number;
          admin_id?: string | null;
          created_at?: string;
        };
      };
      units: {
        Row: {
          id: number;
          name: string;
          code: string;
          class_instance_id: number;
          lecturer: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          code: string;
          class_instance_id: number;
          lecturer: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          code?: string;
          class_instance_id?: number;
          lecturer?: string;
          created_at?: string;
        };
      };
      resources: {
        Row: {
          id: number;
          title: string;
          description: string;
          file_url: string | null;
          deadline: string | null;
          unit_id: number;
          user_id: string;
          type: 'assignment' | 'note' | 'past_paper';
          likes: number;
          dislikes: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          description: string;
          file_url?: string | null;
          deadline?: string | null;
          unit_id: number;
          user_id: string;
          type: 'assignment' | 'note' | 'past_paper';
          likes?: number;
          dislikes?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          description?: string;
          file_url?: string | null;
          deadline?: string | null;
          unit_id?: number;
          user_id?: string;
          type?: 'assignment' | 'note' | 'past_paper';
          likes?: number;
          dislikes?: number;
          created_at?: string;
        };
      };
      completions: {
        Row: {
          id: number;
          user_id: string;
          resource_id: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          resource_id: number;
          completed_at: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          resource_id?: number;
          completed_at?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: number;
          content: string;
          user_id: string;
          resource_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          content: string;
          user_id: string;
          resource_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          content?: string;
          user_id?: string;
          resource_id?: number;
          created_at?: string;
        };
      };
      marketing_content: {
        Row: {
          id: number;
          title: string;
          content: string;
          file_url: string | null;
          created_by: string;
          type: 'file' | 'video' | 'quote' | 'image' | 'text';
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          content: string;
          file_url?: string | null;
          created_by: string;
          type: 'file' | 'video' | 'quote' | 'image' | 'text';
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          content?: string;
          file_url?: string | null;
          created_by?: string;
          type?: 'file' | 'video' | 'quote' | 'image' | 'text';
          created_at?: string;
        };
      };
      ranks: {
        Row: {
          id: number;
          name: string;
          icon: string;
          min_points: number;
          max_points: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          icon: string;
          min_points: number;
          max_points: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          icon?: string;
          min_points?: number;
          max_points?: number;
          created_at?: string;
        };
      };
    };
  };
}
