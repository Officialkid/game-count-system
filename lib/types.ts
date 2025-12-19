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
  allow_negative?: boolean;
  display_mode?: 'cumulative' | 'per_day';
  num_teams?: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'active' | 'inactive';
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
  role?: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Admin Management System Types
export type AdminRole = 'owner' | 'admin' | 'judge' | 'scorer';

export interface EventAdmin {
  id: string;
  event_id: string;
  user_id: string;
  role: AdminRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined user info
  user_name?: string;
  user_email?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface AdminInvitation {
  id: string;
  event_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_user_id: string | null;
  role: AdminRole;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined info
  inviter_name?: string;
  event_name?: string;
}

export interface AdminActivityLog {
  id: string;
  event_id: string;
  admin_id: string;
  admin_role: AdminRole;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined info
  admin_name?: string;
}

export interface AdminPermissions {
  canManageAdmins: boolean;
  canEditEvent: boolean;
  canDeleteEvent: boolean;
  canManageTeams: boolean;
  canAddScores: boolean;
  canEditScores: boolean;
  canDeleteScores: boolean;
  canManageSharing: boolean;
  canExportData: boolean;
  canViewActivityLog: boolean;
}
