// lib/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface Event {
  id: string;
  user_id: string;
  event_name: string;
  created_at: string;
  // Phase 2 enhancements
  brand_color?: string;
  logo_url?: string | null;
  allow_negative?: boolean;
  display_mode?: 'cumulative' | 'per_day';
  num_teams?: number;
}

export interface AuditLog {
  id: string;
  event_id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'score_add';
  entity_type: 'event' | 'team' | 'score';
  entity_id: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  created_at: string;
}

export interface AIEventProfile {
  id: string;
  event_id: string;
  mood?: string;
  generated_palette?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout_style?: 'modern' | 'classic' | 'neon' | 'youth';
  insights?: string;
  last_updated: string;
}

export interface Team {
  id: string;
  event_id: string;
  team_name: string;
  avatar_url: string | null;
  total_points: number;
}

export interface GameScore {
  id: string;
  event_id: string;
  team_id: string;
  game_number: number;
  points: number;
  created_at: Date;
}

export interface ShareLink {
  id: string;
  event_id: string;
  token: string;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
