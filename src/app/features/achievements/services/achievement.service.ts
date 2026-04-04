import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { Achievement, AchievementCreateRequest, AchievementType } from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private apiService = inject(ApiService);
  private cache = inject(CacheService);

  getAllAchievements(): Observable<Achievement[]> {
    return this.apiService.get<Achievement[]>(
      '/achievements',
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getAchievementById(id: number): Observable<Achievement> {
    return this.apiService.get<Achievement>(
      `/achievements/${id}`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getAchievementsByStudent(studentId: number): Observable<Achievement[]> {
    return this.apiService.get<Achievement[]>(
      `/achievements/student/${studentId}`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getVerifiedAchievementsByStudent(studentId: number): Observable<Achievement[]> {
    return this.apiService.get<Achievement[]>(
      `/achievements/student/${studentId}/verified`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getAchievementsByType(type: AchievementType): Observable<Achievement[]> {
    return this.apiService.get<Achievement[]>(
      `/achievements/type/${type}`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getAchievementsByDateRange(startDate: string, endDate: string): Observable<Achievement[]> {
    return this.apiService.get<Achievement[]>(
      `/achievements/date-range?startDate=${startDate}&endDate=${endDate}`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  getPendingVerificationAchievements(): Observable<Achievement[]> {
    return this.apiService.get<Achievement[]>(
      '/achievements/pending-verification',
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  createAchievement(request: AchievementCreateRequest, certificate?: File): Observable<Achievement> {
    const formData = new FormData();
    formData.append('achievement', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    
    if (certificate) {
      formData.append('certificate', certificate);
    }

    return this.apiService.post<Achievement>('/achievements', formData).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/achievements');
        return response;
      })
    );
  }

  updateAchievement(id: number, request: AchievementCreateRequest, certificate?: File): Observable<Achievement> {
    const formData = new FormData();
    formData.append('achievement', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    
    if (certificate) {
      formData.append('certificate', certificate);
    }

    return this.apiService.put<Achievement>(`/achievements/${id}`, formData).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/achievements');
        return response;
      })
    );
  }

  verifyAchievement(id: number): Observable<Achievement> {
    return this.apiService.put<Achievement>(`/achievements/${id}/verify`, {}).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/achievements');
        return response;
      })
    );
  }

  unverifyAchievement(id: number): Observable<Achievement> {
    return this.apiService.put<Achievement>(`/achievements/${id}/unverify`, {}).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/achievements');
        return response;
      })
    );
  }

  deleteAchievement(id: number): Observable<void> {
    return this.apiService.delete<void>(`/achievements/${id}`).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/achievements');
        return response;
      })
    );
  }

  countVerifiedAchievements(studentId: number): Observable<number> {
    return this.apiService.get<number>(
      `/achievements/student/${studentId}/count/verified`,
      undefined,
      { ttl: this.cache.CACHE_DURATIONS.SHORT }
    );
  }

  // Bulk operations
  bulkDeleteAchievements(ids: number[]): Observable<void> {
    return this.apiService.post<void>('/achievements/bulk-delete', { ids }).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/achievements');
        return response;
      })
    );
  }

  bulkVerifyAchievements(ids: number[], verified: boolean): Observable<void> {
    return this.apiService.post<void>('/achievements/bulk-verify', { ids, verified }).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/achievements');
        return response;
      })
    );
  }
}
