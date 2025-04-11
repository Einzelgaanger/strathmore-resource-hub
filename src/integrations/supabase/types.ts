export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      class_instances: {
        Row: {
          admin_id: string | null
          course_id: number
          created_at: string | null
          description: string | null
          group_id: number
          id: number
          program_id: number
          semester_id: number
          year_id: number
        }
        Insert: {
          admin_id?: string | null
          course_id: number
          created_at?: string | null
          description?: string | null
          group_id: number
          id?: number
          program_id: number
          semester_id: number
          year_id: number
        }
        Update: {
          admin_id?: string | null
          course_id?: number
          created_at?: string | null
          description?: string | null
          group_id?: number
          id?: number
          program_id?: number
          semester_id?: number
          year_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_instances_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instances_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          resource_id: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          resource_id: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          resource_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      completions: {
        Row: {
          completed_at: string
          created_at: string | null
          id: number
          resource_id: number
          user_id: string
        }
        Insert: {
          completed_at: string
          created_at?: string | null
          id?: number
          resource_id: number
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          id?: number
          resource_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          id: number
          name: string
          program_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          program_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          program_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          id: number
          name: string
          semester_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          semester_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          semester_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "groups_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_content: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          file_url: string | null
          id: number
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          file_url?: string | null
          id?: number
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          file_url?: string | null
          id?: number
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      ranks: {
        Row: {
          created_at: string | null
          icon: string
          id: number
          max_points: number
          min_points: number
          name: string
        }
        Insert: {
          created_at?: string | null
          icon: string
          id?: number
          max_points: number
          min_points: number
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: number
          max_points?: number
          min_points?: number
          name?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string
          dislikes: number
          file_url: string | null
          id: number
          likes: number
          title: string
          type: string
          unit_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description: string
          dislikes?: number
          file_url?: string | null
          id?: number
          likes?: number
          title: string
          type: string
          unit_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string
          dislikes?: number
          file_url?: string | null
          id?: number
          likes?: number
          title?: string
          type?: string
          unit_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          created_at: string | null
          id: number
          name: string
          year_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          year_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          year_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "semesters_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          class_instance_id: number
          code: string
          created_at: string | null
          id: number
          lecturer: string
          name: string
        }
        Insert: {
          class_instance_id: number
          code: string
          created_at?: string | null
          id?: number
          lecturer: string
          name: string
        }
        Update: {
          class_instance_id?: number
          code?: string
          created_at?: string | null
          id?: number
          lecturer?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admission_number: string
          class_instance_id: number | null
          created_at: string | null
          email: string
          id: string
          is_admin: boolean
          is_super_admin: boolean
          last_login: string | null
          name: string
          password: string
          points: number
          profile_picture_url: string | null
          rank: number
          reset_code: string | null
        }
        Insert: {
          admission_number: string
          class_instance_id?: number | null
          created_at?: string | null
          email: string
          id?: string
          is_admin?: boolean
          is_super_admin?: boolean
          last_login?: string | null
          name: string
          password?: string
          points?: number
          profile_picture_url?: string | null
          rank?: number
          reset_code?: string | null
        }
        Update: {
          admission_number?: string
          class_instance_id?: number | null
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean
          is_super_admin?: boolean
          last_login?: string | null
          name?: string
          password?: string
          points?: number
          profile_picture_url?: string | null
          rank?: number
          reset_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_class_instance_id_fkey"
            columns: ["class_instance_id"]
            isOneToOne: false
            referencedRelation: "class_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      years: {
        Row: {
          course_id: number
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          course_id: number
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          course_id?: number
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "years_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_auth_user_passwords: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_user_ids: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
