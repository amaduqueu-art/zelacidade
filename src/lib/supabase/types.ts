export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReportCategory =
  | 'iluminacao'
  | 'asfalto'
  | 'acessibilidade'
  | 'saneamento';

export type ReportStatus = 'aberto' | 'em_analise' | 'resolvido';

export interface Database {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: ReportCategory;
          status: ReportStatus;
          neighborhood: string | null;
          image_path: string | null;
          upvotes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: ReportCategory;
          status?: ReportStatus;
          neighborhood?: string | null;
          image_path?: string | null;
          upvotes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category?: ReportCategory;
          status?: ReportStatus;
          neighborhood?: string | null;
          image_path?: string | null;
          upvotes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      upvotes: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      report_category: ReportCategory;
      report_status: ReportStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
