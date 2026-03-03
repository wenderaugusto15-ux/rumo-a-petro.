export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value?: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          rule_json: Json | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          rule_json?: Json | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          rule_json?: Json | null
        }
        Relationships: []
      }
      mock_exam_answers: {
        Row: {
          chosen_option: string
          id: string
          is_correct: boolean
          mock_exam_id: string
          question_id: string
          time_spent_seconds: number | null
        }
        Insert: {
          chosen_option: string
          id?: string
          is_correct: boolean
          mock_exam_id: string
          question_id: string
          time_spent_seconds?: number | null
        }
        Update: {
          chosen_option?: string
          id?: string
          is_correct?: boolean
          mock_exam_id?: string
          question_id?: string
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_answers_mock_exam_id_fkey"
            columns: ["mock_exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exam_questions: {
        Row: {
          id: string
          mock_exam_id: string
          order_index: number
          question_id: string
        }
        Insert: {
          id?: string
          mock_exam_id: string
          order_index?: number
          question_id: string
        }
        Update: {
          id?: string
          mock_exam_id?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_questions_mock_exam_id_fkey"
            columns: ["mock_exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exams: {
        Row: {
          created_at: string
          duration_seconds: number | null
          finished_at: string | null
          id: string
          score_percent: number | null
          started_at: string
          total_questions: number
          type: Database["public"]["Enums"]["mock_exam_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          score_percent?: number | null
          started_at?: string
          total_questions?: number
          type?: Database["public"]["Enums"]["mock_exam_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          score_percent?: number | null
          started_at?: string
          total_questions?: number
          type?: Database["public"]["Enums"]["mock_exam_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          attempted_at: string
          chosen_option: string
          id: string
          is_correct: boolean
          question_id: string
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          attempted_at?: string
          chosen_option: string
          id?: string
          is_correct: boolean
          question_id: string
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          attempted_at?: string
          chosen_option?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_flags: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          question_id: string
          review_later: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          question_id: string
          review_later?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          question_id?: string
          review_later?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_flags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          active: boolean
          correct_option: string
          created_at: string
          explanation: string
          id: string
          level: Database["public"]["Enums"]["question_level"]
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          statement: string
          subject_id: string
          tags: string[] | null
          topic_id: string | null
        }
        Insert: {
          active?: boolean
          correct_option: string
          created_at?: string
          explanation?: string
          id?: string
          level?: Database["public"]["Enums"]["question_level"]
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          statement: string
          subject_id: string
          tags?: string[] | null
          topic_id?: string | null
        }
        Update: {
          active?: boolean
          correct_option?: string
          created_at?: string
          explanation?: string
          id?: string
          level?: Database["public"]["Enums"]["question_level"]
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          option_e?: string
          statement?: string
          subject_id?: string
          tags?: string[] | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          id: string
          source_id: string
          source_type: string
          status: Database["public"]["Enums"]["review_status"]
          subject_id: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date: string
          id?: string
          source_id: string
          source_type: string
          status?: Database["public"]["Enums"]["review_status"]
          subject_id?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          source_id?: string
          source_type?: string
          status?: Database["public"]["Enums"]["review_status"]
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan_settings: {
        Row: {
          available_days: string[] | null
          created_at: string
          exam_date: string | null
          hours_per_week: number
          review_intervals_days: number[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_days?: string[] | null
          created_at?: string
          exam_date?: string | null
          hours_per_week?: number
          review_intervals_days?: number[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_days?: string[] | null
          created_at?: string
          exam_date?: string | null
          hours_per_week?: number
          review_intervals_days?: number[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          date: string
          id: string
          minutes_done: number | null
          minutes_planned: number
          status: Database["public"]["Enums"]["session_status"]
          subject_id: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          minutes_done?: number | null
          minutes_planned?: number
          status?: Database["public"]["Enums"]["session_status"]
          subject_id?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          minutes_done?: number | null
          minutes_planned?: number
          status?: Database["public"]["Enums"]["session_status"]
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          active: boolean
          created_at: string
          default_weight: number
          id: string
          is_general: boolean
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_weight?: number
          id?: string
          is_general?: boolean
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_weight?: number
          id?: string
          is_general?: boolean
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          ends_at: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          ends_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          ends_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          age: number | null
          city: string | null
          created_at: string
          id: string
          name: string
          text: string
        }
        Insert: {
          active?: boolean
          age?: number | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          text: string
        }
        Update: {
          active?: boolean
          age?: number | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          text?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          subject_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          subject_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      track_subjects: {
        Row: {
          id: string
          subject_id: string
          track_id: string
          weight_override: number | null
        }
        Insert: {
          id?: string
          subject_id: string
          track_id: string
          weight_override?: number | null
        }
        Update: {
          id?: string
          subject_id?: string
          track_id?: string
          weight_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "track_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_subjects_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          date: string
          id: string
          mocks_started: number
          questions_answered: number
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          mocks_started?: number
          questions_answered?: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          mocks_started?: number
          questions_answered?: number
          user_id?: string
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          daily_questions_limit: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          weekly_mocks_limit: number
        }
        Insert: {
          daily_questions_limit: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          weekly_mocks_limit: number
        }
        Update: {
          daily_questions_limit?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          weekly_mocks_limit?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          level_name: string
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          level_name?: string
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          level_name?: string
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      mock_exam_type: "quick" | "full"
      question_level: "easy" | "medium" | "hard"
      review_status: "pending" | "done"
      session_status: "planned" | "done" | "skipped"
      subscription_plan: "free" | "pro"
      subscription_status: "active" | "canceled" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      mock_exam_type: ["quick", "full"],
      question_level: ["easy", "medium", "hard"],
      review_status: ["pending", "done"],
      session_status: ["planned", "done", "skipped"],
      subscription_plan: ["free", "pro"],
      subscription_status: ["active", "canceled", "expired"],
    },
  },
} as const
