// Shared types across the application
export type { Database } from "@/api/integrations/supabase/types";

// Common types
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

