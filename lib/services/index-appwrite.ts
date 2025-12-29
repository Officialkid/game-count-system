/**
 * Service Layer
 * 
 * Centralized service exports for Appwrite backend
 * All components import services from here
 * 
 * Usage:
 * import * as eventsService from '@/lib/services';
 * const { success, data } = await eventsService.getEvents(userId);
 */

// Import Appwrite service implementations
import * as appwriteEvents from './appwriteEvents';
import * as appwriteTeams from './appwriteTeams';
import * as appwriteScores from './appwriteScores';
import * as appwriteRecaps from './appwriteRecaps';
import * as appwriteStorage from './appwriteStorage';
import * as appwriteShareLinks from './appwriteShareLinks';
import * as appwriteAudit from './appwriteAudit';
import * as appwriteTemplates from './appwriteTemplates';
import * as appwriteAdmins from './appwriteAdmins';

// ============================================
// EVENTS SERVICE
// ============================================

export const eventsService = {
  getEvents: appwriteEvents.getEvents,
  getEvent: appwriteEvents.getEvent,
  createEvent: appwriteEvents.createEvent,
  updateEvent: appwriteEvents.updateEvent,
  deleteEvent: appwriteEvents.deleteEvent,
  duplicateEvent: appwriteEvents.duplicateEvent,
  getEventStats: appwriteEvents.getEventStats,
};

// ============================================
// TEAMS SERVICE
// ============================================

export const teamsService = {
  getTeams: appwriteTeams.getTeams,
  getTeam: appwriteTeams.getTeam,
  createTeam: appwriteTeams.createTeam,
  updateTeam: appwriteTeams.updateTeam,
  deleteTeam: appwriteTeams.deleteTeam,
  checkTeamName: appwriteTeams.checkTeamName,
  updateTeamTotalPoints: appwriteTeams.updateTeamTotalPoints,
};

// ============================================
// SCORES SERVICE
// ============================================

export const scoresService = {
  getScores: appwriteScores.getScores,
  getScore: appwriteScores.getScore,
  addScore: appwriteScores.addScore,
  deleteScore: appwriteScores.deleteScore,
  getScoresForTeam: appwriteScores.getScoresForTeam,
  getLeaderboard: appwriteScores.getLeaderboard,
  getGameStats: appwriteScores.getGameStats,
  getScoresCountLastDays: appwriteScores.getScoresCountLastDays,
};

// ============================================
// RECAPS SERVICE
// ============================================

export const recapsService = {
  createRecap: appwriteRecaps.createRecap,
  getRecap: appwriteRecaps.getRecap,
  getEventRecaps: appwriteRecaps.getEventRecaps,
  getLatestRecap: appwriteRecaps.getLatestRecap,
  deleteRecap: appwriteRecaps.deleteRecap,
  getSummary: appwriteRecaps.getSummary,
};

// ============================================
// STORAGE SERVICE
// ============================================

export const storageService = {
  uploadEventLogo: appwriteStorage.uploadEventLogo,
  uploadTeamAvatar: appwriteStorage.uploadTeamAvatar,
  deleteFile: appwriteStorage.deleteFile,
  getFilePreviewUrl: appwriteStorage.getFilePreviewUrl,
  getFileDownloadUrl: appwriteStorage.getFileDownloadUrl,
  getFileViewUrl: appwriteStorage.getFileViewUrl,
  listFiles: appwriteStorage.listFiles,
};

// ============================================
// SHARE LINKS SERVICE
// ============================================

export const shareLinksService = {
  createShareLink: appwriteShareLinks.createShareLink,
  getShareLinkByToken: appwriteShareLinks.getShareLinkByToken,
  getShareLinkByEvent: appwriteShareLinks.getShareLinkByEvent,
  deleteShareLink: appwriteShareLinks.deleteShareLink,
  resolveShareToken: appwriteShareLinks.resolveShareToken,
  getUserShareLinks: appwriteShareLinks.getUserShareLinks,
  generateShareToken: appwriteShareLinks.generateShareToken,
};

// ============================================
// AUDIT SERVICE
// ============================================

export const auditService = {
  createAuditLog: appwriteAudit.createAuditLog,
  getAuditLogs: appwriteAudit.getAuditLogs,
  getUserAuditLogs: appwriteAudit.getUserAuditLogs,
  getRecordAuditLogs: appwriteAudit.getRecordAuditLogs,
  getRecentAuditLogs: appwriteAudit.getRecentAuditLogs,
  getAuditLogsByAction: appwriteAudit.getAuditLogsByAction,
  getAuditStats: appwriteAudit.getAuditStats,
  logAction: appwriteAudit.logAction,
};

// ============================================
// TEMPLATES SERVICE
// ============================================

export const templatesService = {
  getTemplates: appwriteTemplates.getTemplates,
  saveTemplate: appwriteTemplates.saveTemplate,
};

// ============================================
// ADMINS SERVICE
// ============================================

export const adminsService = {
  getAdmins: appwriteAdmins.getAdmins,
  removeAdmin: appwriteAdmins.removeAdmin,
};

// ============================================
// RE-EXPORTS FOR DIRECT IMPORTS
// ============================================

// Allow: import { getEvents } from '@/lib/services';
export * from './appwriteEvents';
export * from './appwriteTeams';
export * from './appwriteScores';
export * from './appwriteRecaps';
export * from './appwriteStorage';
export * from './appwriteShareLinks';
export * from './appwriteAudit';
export * from './appwriteTemplates';
export * from './appwriteAdmins';

