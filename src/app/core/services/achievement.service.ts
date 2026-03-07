import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AchievementType } from '../models';

export interface Achievement {
  id?: number;
  studentId: number;
  studentName?: string;
  title: string;
  description: string;
  type: AchievementType;
  eventName?: string;
  position?: string;
  achievedDate: string;
  certificateUrl?: string;
  awardedBy?: string;
  isVerified?: boolean;
  verifiedById?: number;
  verifiedByName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private apiUrl = `${environment.apiUrl}/achievements`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new achievement with optional certificate
   */
  createAchievement(achievement: Achievement, certificate?: File): Observable<Achievement> {
    const formData = new FormData();
    formData.append('achievement', new Blob([JSON.stringify(achievement)], { type: 'application/json' }));
    
    if (certificate) {
      formData.append('certificate', certificate);
    }

    return this.http.post<Achievement>(this.apiUrl, formData);
  }

  /**
   * Update an existing achievement with optional new certificate
   */
  updateAchievement(id: number, achievement: Achievement, certificate?: File): Observable<Achievement> {
    const formData = new FormData();
    formData.append('achievement', new Blob([JSON.stringify(achievement)], { type: 'application/json' }));
    
    if (certificate) {
      formData.append('certificate', certificate);
    }

    return this.http.put<Achievement>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Delete an achievement (also deletes certificate from S3)
   */
  deleteAchievement(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Delete only the certificate (keeps the achievement)
   */
  deleteCertificate(achievementId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${achievementId}/certificate`);
  }

  /**
   * Get achievement by ID
   */
  getAchievementById(id: number): Observable<Achievement> {
    return this.http.get<Achievement>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(this.apiUrl);
  }

  /**
   * Get achievements by student ID
   */
  getAchievementsByStudent(studentId: number): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/student/${studentId}`);
  }

  /**
   * Get verified achievements by student ID
   */
  getVerifiedAchievementsByStudent(studentId: number): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/student/${studentId}/verified`);
  }

  /**
   * Get achievements by type
   */
  getAchievementsByType(type: AchievementType): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/type/${type}`);
  }

  /**
   * Get achievements by student and type
   */
  getAchievementsByStudentAndType(studentId: number, type: AchievementType): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/student/${studentId}/type/${type}`);
  }

  /**
   * Get achievements by date range
   */
  getAchievementsByDateRange(startDate: string, endDate: string): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/date-range`, {
      params: { startDate, endDate }
    });
  }

  /**
   * Get pending verification achievements
   */
  getPendingVerificationAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/pending-verification`);
  }

  /**
   * Verify an achievement
   */
  verifyAchievement(id: number): Observable<Achievement> {
    return this.http.put<Achievement>(`${this.apiUrl}/${id}/verify`, {});
  }

  /**
   * Unverify an achievement
   */
  unverifyAchievement(id: number): Observable<Achievement> {
    return this.http.put<Achievement>(`${this.apiUrl}/${id}/unverify`, {});
  }

  /**
   * Count verified achievements for a student
   */
  countVerifiedAchievements(studentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/student/${studentId}/count/verified`);
  }
}
