import { Injectable, inject } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CacheService } from '../../../core/services/cache.service';
import { StudentSkillMetricsService } from './student-skill-metrics.service';
import { 
  PlayerPerformance, 
  PlayerPerformanceRequest, 
  BatchAveragePerformance, 
  PerformanceProgress,
  PerformanceMetrics 
} from '../../../core/models';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private apiService = inject(ApiService);
  private cache = inject(CacheService);
  private skillMetricsService = inject(StudentSkillMetricsService);

  getPlayerPerformance(studentId: number): Observable<PlayerPerformance | null> {
    const currentDate = new Date();
    const metrics = this.skillMetricsService.getStudentMetrics(studentId);

    return of({
      id: studentId,
      studentId,
      studentName: 'Student',
      batchId: 0,
      batchName: 'Unassigned',
      metrics,
      evaluatedById: 0,
      evaluatedByName: 'Manual Entry',
      evaluatedAt: currentDate.toISOString(),
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    });
  }

  getPlayerPerformanceHistory(studentId: number): Observable<PlayerPerformance[]> {
    return this.getPlayerPerformance(studentId).pipe(
      map((performance) => (performance ? [performance] : []))
    );
  }

  getBatchAveragePerformance(batchId: number): Observable<BatchAveragePerformance> {
    const currentDate = new Date();
    return of({
      batchId,
      batchName: 'Batch',
      averageMetrics: this.createZeroMetrics(),
      totalPlayers: 0,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    });
  }

  getPerformanceProgress(studentId: number): Observable<PerformanceProgress> {
    const currentDate = new Date();
    const currentMetrics = this.skillMetricsService.getStudentMetrics(studentId);
    const baselineMetrics = this.createZeroMetrics();

    return of({
      studentId,
      studentName: 'Student',
      baseline: baselineMetrics,
      baselineMonth: currentDate.getMonth() + 1,
      baselineYear: currentDate.getFullYear(),
      current: currentMetrics,
      currentMonth: currentDate.getMonth() + 1,
      currentYear: currentDate.getFullYear(),
      improvement: this.calculateImprovement(baselineMetrics, currentMetrics)
    });
  }

  createPerformanceRecord(request: PlayerPerformanceRequest): Observable<PlayerPerformance> {
    return this.apiService.post<PlayerPerformance>('/performance', request).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/performance');
        return response;
      })
    );
  }

  updatePerformanceRecord(id: number, request: PlayerPerformanceRequest): Observable<PlayerPerformance> {
    return this.apiService.put<PlayerPerformance>(`/performance/${id}`, request).pipe(
      map(response => {
        this.cache.deleteByPrefix('GET:/performance');
        return response;
      })
    );
  }

  private calculateImprovement(baseline: PerformanceMetrics, current: PerformanceMetrics): PerformanceMetrics {
    return {
      smashPower: current.smashPower - baseline.smashPower,
      netControl: current.netControl - baseline.netControl,
      backhand: current.backhand - baseline.backhand,
      footwork: current.footwork - baseline.footwork,
      agility: current.agility - baseline.agility,
      stamina: current.stamina - baseline.stamina,
      tacticalAwareness: current.tacticalAwareness - baseline.tacticalAwareness,
      mentalStrength: current.mentalStrength - baseline.mentalStrength
    };
  }

  private createZeroMetrics(): PerformanceMetrics {
    return {
      smashPower: 0,
      netControl: 0,
      backhand: 0,
      footwork: 0,
      agility: 0,
      stamina: 0,
      tacticalAwareness: 0,
      mentalStrength: 0
    };
  }

  // Calculate average metrics from multiple players
  calculateBatchAverage(performances: PlayerPerformance[]): PerformanceMetrics {
    if (performances.length === 0) {
      return {
        smashPower: 0,
        netControl: 0,
        backhand: 0,
        footwork: 0,
        agility: 0,
        stamina: 0,
        tacticalAwareness: 0,
        mentalStrength: 0
      };
    }

    const sum: PerformanceMetrics = {
      smashPower: 0,
      netControl: 0,
      backhand: 0,
      footwork: 0,
      agility: 0,
      stamina: 0,
      tacticalAwareness: 0,
      mentalStrength: 0
    };

    performances.forEach(p => {
      sum.smashPower += p.metrics.smashPower;
      sum.netControl += p.metrics.netControl;
      sum.backhand += p.metrics.backhand;
      sum.footwork += p.metrics.footwork;
      sum.agility += p.metrics.agility;
      sum.stamina += p.metrics.stamina;
      sum.tacticalAwareness += p.metrics.tacticalAwareness;
      sum.mentalStrength += p.metrics.mentalStrength;
    });

    const count = performances.length;
    return {
      smashPower: Math.round((sum.smashPower / count) * 10) / 10,
      netControl: Math.round((sum.netControl / count) * 10) / 10,
      backhand: Math.round((sum.backhand / count) * 10) / 10,
      footwork: Math.round((sum.footwork / count) * 10) / 10,
      agility: Math.round((sum.agility / count) * 10) / 10,
      stamina: Math.round((sum.stamina / count) * 10) / 10,
      tacticalAwareness: Math.round((sum.tacticalAwareness / count) * 10) / 10,
      mentalStrength: Math.round((sum.mentalStrength / count) * 10) / 10
    };
  }

  // Get month name
  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  }
}
