export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AppRole = "admin" | "user";

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Recommendation {
  id: string;
  user_id: string;
  goals: string[];
  recommended_peptides: RecommendedPeptide[];
  notes: string | null;
  created_at: string;
}

export interface RecommendedPeptide {
  name: string;
  slug: string;
  score: number;
  reason: string;
}
