import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService } from '../../services/achievement.service';

/**
 * Analytics data structure
 */
interface AnalyticsData {
  totalAchievements: number;
  verifiedCount: number;
  pendingCount: number;
  thisMonthCount: number;
  thisYearCount: number;
  typeDistribution: TypeDistribution[];
  monthlyTrend: MonthlyTrend[];
  topStudents: TopStudent[];
}

interface TypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  count: number;
}

interface TopStudent {
  studentName: string;
  count: number;
}

/**
 * Achievement Analytics Dashboard Component
 * Displays comprehensive statistics and insights about achievements
 */
@Component({
  selector: 'app-achievement-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-dashboard">
      <div class="dashboard-header">
        <h2>Achievement Analytics</h2>
        <button class="refresh-btn" (click)="loadAnalytics()">
          <span>🔄</span> Refresh
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button (click)="loadAnalytics()">Retry</button>
        </div>
      } @else {
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>{{ totalAchievements() }}</h3>
              <p>Total Achievements</p>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>{{ verifiedCount() }}</h3>
              <p>Verified</p>
              <span class="stat-percentage">
                {{ verifiedPercentage() }}%
              </span>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
              <h3>{{ pendingCount() }}</h3>
              <p>Pending Verification</p>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <h3>{{ thisMonthCount() }}</h3>
              <p>This Month</p>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>{{ thisYearCount() }}</h3>
              <p>This Year</p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Type Distribution -->
          <div class="chart-card">
            <h3>Achievements by Type</h3>
            <div class="type-distribution">
              @for (item of typeDistribution(); track item.type) {
                <div class="chart-item">
                  <div class="chart-label">
                    <span class="type-name">{{ item.type }}</span>
                    <span class="type-count">{{ item.count }}</span>
                  </div>
                  <div class="chart-bar-container">
                    <div 
                      class="chart-bar" 
                      [style.width.%]="item.percentage"
                      [attr.data-percentage]="item.percentage.toFixed(1) + '%'"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Monthly Trend -->
          <div class="chart-card">
            <h3>Monthly Trend (Last 6 Months)</h3>
            <div class="monthly-trend">
              @for (item of monthlyTrend(); track item.month) {
                <div class="trend-item">
                  <div class="trend-bar-container">
                    <div 
                      class="trend-bar" 
                      [style.height.%]="getTrendHeight(item.count)"
                    >
                      <span class="trend-value">{{ item.count }}</span>
                    </div>
                  </div>
                  <div class="trend-label">{{ item.month }}</div>
                </div>
              }
            </div>
          </div>

          <!-- Top Students -->
          <div class="chart-card">
            <h3>Top Achievers</h3>
            <div class="top-students">
              @for (student of topStudents(); track student.studentName; let idx = $index) {
                <div class="student-item">
                  <div class="student-rank">{{ idx + 1 }}</div>
                  <div class="student-info">
                    <span class="student-name">{{ student.studentName }}</span>
                    <span class="student-count">{{ student.count }} achievements</span>
                  </div>
                  <div class="student-medal">
                    {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅' }}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 24px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        margin: 0;
        font-size: 28px;
        color: #2c3e50;
      }

      .refresh-btn {
        padding: 10px 20px;
        background: white;
        border: 1px solid #e1e8ed;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
          background: #f8f9fa;
          border-color: #3b82f6;
        }
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      border-left: 4px solid;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }

      &.primary { border-color: #3b82f6; }
      &.success { border-color: #10b981; }
      &.warning { border-color: #f59e0b; }
      &.info { border-color: #8b5cf6; }

      .stat-icon {
        font-size: 32px;
      }

      .stat-content {
        flex: 1;

        h3 {
          font-size: 32px;
          margin: 0 0 4px 0;
          color: #1f2937;
        }

        p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .stat-percentage {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 8px;
          background: #10b98120;
          color: #10b981;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
      }
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .chart-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);

      h3 {
        margin: 0 0 20px 0;
        color: #1f2937;
        font-size: 18px;
      }
    }

    .type-distribution {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .chart-item {
        .chart-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 14px;

          .type-name {
            color: #4b5563;
            font-weight: 500;
          }

          .type-count {
            color: #6b7280;
          }
        }

        .chart-bar-container {
          background: #f3f4f6;
          border-radius: 8px;
          height: 24px;
          position: relative;
          overflow: hidden;

          .chart-bar {
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            height: 100%;
            border-radius: 8px;
            transition: width 0.5s ease;
            position: relative;

            &::after {
              content: attr(data-percentage);
              position: absolute;
              right: 8px;
              top: 50%;
              transform: translateY(-50%);
              color: white;
              font-size: 11px;
              font-weight: 600;
            }
          }
        }
      }
    }

    .monthly-trend {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 200px;
      gap: 8px;

      .trend-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;

        .trend-bar-container {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;

          .trend-bar {
            width: 100%;
            background: linear-gradient(180deg, #3b82f6, #8b5cf6);
            border-radius: 8px 8px 0 0;
            position: relative;
            min-height: 20px;
            transition: height 0.5s ease;

            .trend-value {
              position: absolute;
              top: -20px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 12px;
              font-weight: 600;
              color: #1f2937;
            }
          }
        }

        .trend-label {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      }
    }

    .top-students {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .student-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        transition: background 0.2s;

        &:hover {
          background: #f3f4f6;
        }

        .student-rank {
          width: 32px;
          height: 32px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .student-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .student-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
          }

          .student-count {
            font-size: 12px;
            color: #6b7280;
          }
        }

        .student-medal {
          font-size: 24px;
        }
      }
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 60px 20px;

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #f3f4f6;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }
  `]
})
export class AchievementAnalyticsComponent implements OnInit {
  private achievementService = inject(AchievementService);

  achievements = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  totalAchievements = computed(() => this.achievements().length);
  verifiedCount = computed(() => this.achievements().filter(a => a.isVerified).length);
  pendingCount = computed(() => this.achievements().filter(a => !a.isVerified).length);
  verifiedPercentage = computed(() => {
    const total = this.totalAchievements();
    return total > 0 ? Math.round((this.verifiedCount() / total) * 100) : 0;
  });

  thisMonthCount = computed(() => {
    const now = new Date();
    return this.achievements().filter(a => {
      const date = new Date(a.achievedDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  });

  thisYearCount = computed(() => {
    const now = new Date();
    return this.achievements().filter(a => {
      const date = new Date(a.achievedDate);
      return date.getFullYear() === now.getFullYear();
    }).length;
  });

  typeDistribution = computed(() => {
    const total = this.achievements().length;
    if (total === 0) return [];

    const distribution = new Map<string, number>();
    this.achievements().forEach(a => {
      distribution.set(a.type, (distribution.get(a.type) || 0) + 1);
    });

    return Array.from(distribution.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count);
  });

  monthlyTrend = computed(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const count = this.achievements().filter(a => {
        const achDate = new Date(a.achievedDate);
        return achDate.getMonth() === date.getMonth() && 
               achDate.getFullYear() === date.getFullYear();
      }).length;

      months.push({ month: monthName, count });
    }

    return months;
  });

  topStudents = computed(() => {
    const studentCounts = new Map<string, number>();
    
    this.achievements().forEach(a => {
      if (a.studentName) {
        studentCounts.set(a.studentName, (studentCounts.get(a.studentName) || 0) + 1);
      }
    });

    return Array.from(studentCounts.entries())
      .map(([studentName, count]) => ({ studentName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.achievementService.getAllAchievements().subscribe({
      next: (data) => {
        this.achievements.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load analytics data. Please try again.');
        this.loading.set(false);
        console.error('Error loading analytics:', err);
      }
    });
  }

  getTrendHeight(count: number): number {
    const maxCount = Math.max(...this.monthlyTrend().map(m => m.count), 1);
    return (count / maxCount) * 100;
  }
}
