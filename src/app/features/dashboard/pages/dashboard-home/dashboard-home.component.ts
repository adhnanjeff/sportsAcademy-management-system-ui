import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../../../core/services/auth.service';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ScheduleItemComponent } from '../../components/schedule-item/schedule-item.component';
import { BatchCardComponent } from '../../components/batch-card/batch-card.component';
import { ActivityFeedComponent } from '../../components/activity-feed/activity-feed.component';
import { QuickActionsComponent } from '../../components/quick-actions/quick-actions.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AreaChartComponent } from '../../../../shared/components/area-chart/area-chart.component';
import {
  DashboardStats,
  DashboardAttendanceTrendPoint,
  ScheduleItem,
  Batch,
  ActivityItem,
  QuickAction,
  Role
} from '../../../../core/models';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    CardComponent,
    ScheduleItemComponent,
    BatchCardComponent,
    ActivityFeedComponent,
    QuickActionsComponent,
    SkeletonLoaderComponent,
    AreaChartComponent
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardHomeComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly trendWindowDays = 14;

  isLoading = signal(true);
  isLoadingTrend = signal(false);
  stats = signal<DashboardStats | null>(null);
  todaySchedule = signal<ScheduleItem[]>([]);
  recentBatches = signal<Batch[]>([]);
  recentActivity = signal<ActivityItem[]>([]);
  attendanceTrend = signal<DashboardAttendanceTrendPoint[]>([]);
  quickActions = signal<QuickAction[]>([
    { id: 'attendance', label: 'Mark Attendance', icon: 'fa-solid fa-clipboard-check', route: '/dashboard/attendance/mark', color: 'var(--primary-color)' },
    { id: 'attendance-report', label: 'Attendance Report', icon: 'fa-regular fa-calendar-check', route: '/dashboard/attendance/history', color: 'var(--info-color)' },
    { id: 'student-new', label: 'Add Student', icon: 'fa-solid fa-user-plus', route: '/dashboard/students/new', color: 'var(--success-color)' },
    { id: 'batch-new', label: 'Create Batch', icon: 'fa-solid fa-layer-group', route: '/dashboard/batches/new', color: 'var(--warning-color)' },
    { id: 'students', label: 'Manage Students', icon: 'fa-solid fa-users', route: '/dashboard/students', color: 'var(--secondary-color)' },
    { id: 'achievements', label: 'Achievements', icon: 'fa-solid fa-trophy', route: '/dashboard/achievements', color: 'var(--primary-color)' }
  ]);
  userDisplayName = computed(() => {
    const user = this.authService.currentUser();
    return user?.firstName || user?.fullName || 'User';
  });
  canViewTrendChart = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === Role.ADMIN || role === Role.COACH;
  });
  trendActivePoints = computed(() => this.attendanceTrend().filter((point) => point.totalEntries > 0));
  trendAverageRate = computed(() => {
    const trend = this.trendActivePoints();
    if (trend.length === 0) return 0;
    const totalRate = trend.reduce((sum, point) => sum + point.attendanceRate, 0);
    return Math.round(totalRate / trend.length);
  });
  trendTotalEntries = computed(() => this.trendActivePoints().reduce((sum, point) => sum + point.totalEntries, 0));
  trendPresentEntries = computed(() => this.trendActivePoints().reduce(
    (sum, point) => sum + Math.round((point.attendanceRate * point.totalEntries) / 100),
    0
  ));
  trendMissedEntries = computed(() => Math.max(0, this.trendTotalEntries() - this.trendPresentEntries()));
  trendAttendancePercent = computed(() => {
    const total = this.trendTotalEntries();
    if (total === 0) return 0;
    return Math.round((this.trendPresentEntries() * 100) / total);
  });
  trendMissedPercent = computed(() => Math.max(0, 100 - this.trendAttendancePercent()));
  attendanceRateValue = computed(() => `${this.trendAttendancePercent()}%`);
  trendLabels = computed(() => this.attendanceTrend().map((point) => point.label));
  trendRateValues = computed(() =>
    this.attendanceTrend().map((point) => (point.totalEntries > 0 ? point.attendanceRate : null))
  );
  trendStartLabel = computed(() => this.attendanceTrend()[0]?.label ?? '');
  trendEndLabel = computed(() => this.attendanceTrend()[this.attendanceTrend().length - 1]?.label ?? '');
  trendRangeText = computed(() => {
    const trend = this.attendanceTrend();
    if (trend.length === 0) {
      return '';
    }

    return `${trend[0].label} - ${trend[trend.length - 1].label}`;
  });

  today = new Date();

  ngOnInit(): void {
    this.loadDashboardData();
    if (this.canViewTrendChart()) {
      this.loadAttendanceTrend();
    }
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    // Load all dashboard data in parallel
    this.dashboardService.getCoachDashboard().subscribe({
      next: (dashboard) => {
        this.stats.set(dashboard.stats);
        this.todaySchedule.set(dashboard.todaySchedule);
        this.recentBatches.set(dashboard.myBatches.slice(0, 3)); // Show only first 3 batches
        this.recentActivity.set(dashboard.recentActivity);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.isLoading.set(false);
        // Fallback to loading individual components
        this.loadIndividualComponents();
      }
    });
  }

  private loadIndividualComponents(): void {
    this.dashboardService.getStats().subscribe({
      next: (stats: DashboardStats) => this.stats.set(stats),
      error: (error) => console.error('Error loading stats:', error)
    });

    this.dashboardService.getTodaySchedule().subscribe({
      next: (schedule: ScheduleItem[]) => this.todaySchedule.set(schedule),
      error: (error) => console.error('Error loading schedule:', error)
    });

    this.dashboardService.getMyBatches().subscribe({
      next: (batches: Batch[]) => this.recentBatches.set(batches.slice(0, 3)),
      error: (error) => console.error('Error loading batches:', error)
    });

    this.dashboardService.getRecentActivity().subscribe({
      next: (activity: ActivityItem[]) => {
        this.recentActivity.set(activity);
      },
      error: (error) => console.error('Error loading activity:', error)
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  onMarkComplete(sessionId: number): void {
    const schedule = this.todaySchedule();
    const updated = schedule.map(item => 
      item.id === sessionId ? { ...item, isCompleted: true } : item
    );
    this.todaySchedule.set(updated);
  }

  onViewBatch(batchId: number): void {
    this.router.navigate(['/dashboard/batches', batchId]);
  }

  onQuickAction(action: QuickAction): void {
    console.log('Quick action:', action);
  }

  private loadAttendanceTrend(): void {
    this.isLoadingTrend.set(true);
    this.dashboardService.getAttendanceTrend(this.trendWindowDays).subscribe({
      next: (trend) => {
        this.attendanceTrend.set(trend);
        this.isLoadingTrend.set(false);
      },
      error: (error) => {
        console.error('Error loading attendance trend:', error);
        this.attendanceTrend.set([]);
        this.isLoadingTrend.set(false);
      }
    });
  }
}
