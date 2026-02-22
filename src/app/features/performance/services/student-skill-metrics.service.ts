import { Injectable } from '@angular/core';
import { PerformanceMetrics } from '../../../core/models';

type MetricsStore = Record<number, PerformanceMetrics>;

@Injectable({
  providedIn: 'root'
})
export class StudentSkillMetricsService {
  private readonly storageKey = 'academy_student_skill_metrics_v1';
  private store: MetricsStore = this.loadStore();

  getStudentMetrics(studentId: number): PerformanceMetrics {
    const metrics = this.store[studentId];
    if (!metrics) {
      return this.createZeroMetrics();
    }
    return this.normalizeMetrics(metrics);
  }

  saveStudentMetrics(studentId: number, metrics: PerformanceMetrics): void {
    this.store[studentId] = this.normalizeMetrics(metrics);
    this.persistStore();
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

  private normalizeMetrics(metrics: PerformanceMetrics): PerformanceMetrics {
    const clamp = (value: number) => {
      if (!Number.isFinite(value)) return 0;
      return Math.max(0, Math.min(10, Math.round(value)));
    };

    return {
      smashPower: clamp(metrics.smashPower),
      netControl: clamp(metrics.netControl),
      backhand: clamp(metrics.backhand),
      footwork: clamp(metrics.footwork),
      agility: clamp(metrics.agility),
      stamina: clamp(metrics.stamina),
      tacticalAwareness: clamp(metrics.tacticalAwareness),
      mentalStrength: clamp(metrics.mentalStrength)
    };
  }

  private loadStore(): MetricsStore {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as MetricsStore;
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }

      const normalized: MetricsStore = {};
      for (const [id, metrics] of Object.entries(parsed)) {
        const studentId = Number(id);
        if (Number.isNaN(studentId)) {
          continue;
        }
        normalized[studentId] = this.normalizeMetrics(metrics as PerformanceMetrics);
      }
      return normalized;
    } catch {
      return {};
    }
  }

  private persistStore(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.store));
    } catch {
      // Ignore persistence failures and continue in-memory.
      this.store = { ...this.store };
    }
  }
}
