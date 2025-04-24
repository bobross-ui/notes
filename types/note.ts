export interface Note {
  id: string; // UUID
  user_id: string; // UUID (Foreign Key to auth.users)
  title: string;
  content: string | null; // Content can be optional
  summary: string | null; // AI-generated summary
  created_at: string; // ISO 8601 timestamp string
  updated_at: string; // ISO 8601 timestamp string
} 