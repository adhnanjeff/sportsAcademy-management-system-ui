import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Activity log entry
 */
export interface ActivityLog {
  id?: number;
  action: string;
  entityType: string;
  entityId: number;
  details?: string;
  userId?: number;
  userName?: string;
  timestamp: Date;
}

/**
 * Service for logging and retrieving user activities
 */
@Injectable({
  providedIn: 'root'
})
export class ActivityLoggerService {
  private apiUrl = `${environment.apiUrl}/activity-logs`;

  constructor(private http: HttpClient) {}

  /**
   * Logs a new activity
   * @param log Activity log entry without timestamp
   * @returns Observable of created activity log
   */
  logActivity(log: Omit<ActivityLog, 'timestamp' | 'id'>): Observable<ActivityLog> {
    return this.http.post<ActivityLog>(this.apiUrl, {
      ...log,
      timestamp: new Date()
    });
  }

  /**
   * Logs an achievement creation
   * @param achievementId ID of created achievement
   * @param details Optional details
   */
  logAchievementCreated(achievementId: number, details?: string): Observable<ActivityLog> {
    return this.logActivity({
      action: 'CREATE',
      entityType: 'ACHIEVEMENT',
      entityId: achievementId,
      details: details || 'Achievement created'
    });
  }

  /**
   * Logs an achievement update
   * @param achievementId ID of updated achievement
   * @param details Optional details
   */
  logAchievementUpdated(achievementId: number, details?: string): Observable<ActivityLog> {
    return this.logActivity({
      action: 'UPDATE',
      entityType: 'ACHIEVEMENT',
      entityId: achievementId,
      details: details || 'Achievement updated'
    });
  }

  /**
   * Logs an achievement deletion
   * @param achievementId ID of deleted achievement
   * @param details Optional details
   */
  logAchievementDeleted(achievementId: number, details?: string): Observable<ActivityLog> {
    return this.logActivity({
      action: 'DELETE',
      entityType: 'ACHIEVEMENT',
      entityId: achievementId,
      details: details || 'Achievement deleted'
    });
  }

  /**
   * Logs an achievement verification
   * @param achievementId ID of verified achievement
   * @param verified Whether achievement was verified or unverified
   */
  logAchievementVerified(achievementId: number, verified: boolean): Observable<ActivityLog> {
    return this.logActivity({
      action: 'VERIFY',
      entityType: 'ACHIEVEMENT',
      entityId: achievementId,
      details: verified ? 'Achievement verified' : 'Achievement unverified'
    });
  }

  /**
   * Gets activity logs for a specific entity
   * @param entityType Type of entity
   * @param entityId ID of entity
   * @returns Observable of activity logs
   */
  getActivityLogs(entityType: string, entityId: number): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/${entityType}/${entityId}`);
  }

  /**
   * Gets all activity logs for achievements
   * @param limit Maximum number of logs to retrieve
   * @returns Observable of activity logs
   */
  getAchievementActivityLogs(limit: number = 100): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/achievements?limit=${limit}`);
  }

  /**
   * Gets activity logs for the current user
   * @param limit Maximum number of logs to retrieve
   * @returns Observable of activity logs
   */
  getUserActivityLogs(limit: number = 100): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/user?limit=${limit}`);
  }
}
