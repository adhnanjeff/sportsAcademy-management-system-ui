import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerformanceService } from '../../services/performance.service';
import { AttendanceService, AttendanceBatch } from '../../../attendance/services/attendance.service';
import { StudentService } from '../../../students/services/student.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { 
  Student, 
  Role, 
  PlayerPerformance, 
  BatchAveragePerformance, 
  PerformanceProgress,
  PerformanceMetrics,
  PERFORMANCE_AXES
} from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { BatchSelectorComponent } from '../../../attendance/components/batch-selector/batch-selector.component';
import { RadarChartComponent, RadarDataset, createRadarDataset } from '../../../../shared/components/radar-chart/radar-chart.component';

type ChartView = 'current' | 'comparison' | 'progress';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AvatarComponent,
    SkeletonLoaderComponent,
    BatchSelectorComponent,
    RadarChartComponent
  ],
  template: `
    <div class="performance-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Performance Analytics</h1>
          <p>Track player development and skill metrics</p>
        </div>
      </div>

      <!-- Step 1: Batch Selection -->
      @if (isLoadingBatches()) {
        <app-skeleton-loader type="card" [count]="3" />
      } @else if (!selectedBatchId()) {
        <app-card title="Select a Batch" icon="fa-solid fa-layer-group">
          <app-batch-selector
            [batches]="batches()"
            [selectedBatchId]="selectedBatchId()"
            (batchSelect)="onBatchSelect($event)"
          />
        </app-card>
      } @else {
        <!-- Selected Batch Info -->
        <div class="selected-batch-info">
          <div class="batch-details">
            <button class="back-btn" (click)="onBackToBatches()">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="batch-text">
              <h2>{{ selectedBatch()?.name }}</h2>
              <span class="batch-time">{{ selectedBatch()?.startTime }} - {{ selectedBatch()?.endTime }}</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Student Selection -->
        <app-card title="Select a Student" icon="fa-solid fa-user">
          <div class="student-selection">
            <div class="search-box">
              <i class="fa-solid fa-search"></i>
              <input
                type="text"
                placeholder="Search by student name..."
                [value]="searchQuery()"
                (input)="onSearch($event)"
              />
            </div>

            <div class="student-list">
              @for (student of filteredStudents(); track student.id) {
                <button
                  type="button"
                  class="student-item"
                  [class.selected]="selectedStudent()?.id === student.id"
                  (click)="selectStudent(student)"
                >
                  <app-avatar [name]="student.firstName + ' ' + student.lastName" size="sm" />
                  <div class="student-info">
                    <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
                    @if (student.skillLevel) {
                      <app-badge
                        [text]="formatSkillLevel(student.skillLevel)"
                        [variant]="getSkillBadgeVariant(student.skillLevel)"
                      />
                    }
                  </div>
                  @if (selectedStudent()?.id === student.id) {
                    <i class="fa-solid fa-check selected-check"></i>
                  }
                </button>
              } @empty {
                <div class="empty-state">
                  <i class="fa-solid fa-users-slash"></i>
                  <p>No students found in this batch</p>
                </div>
              }
            </div>
          </div>
        </app-card>

        <!-- Performance Charts -->
        @if (selectedStudent()) {
          <div class="performance-section">
            <div class="section-header">
              <h2>
                <app-avatar [name]="selectedStudent()!.firstName + ' ' + selectedStudent()!.lastName" size="sm" />
                {{ selectedStudent()!.firstName }} {{ selectedStudent()!.lastName }}'s Performance
              </h2>
            </div>

            <!-- Chart View Tabs -->
            <div class="chart-tabs">
              <button
                class="chart-tab"
                [class.active]="activeChartView() === 'current'"
                (click)="setChartView('current')"
              >
                <i class="fa-solid fa-chart-radar"></i>
                Current Stats
              </button>
              <button
                class="chart-tab"
                [class.active]="activeChartView() === 'comparison'"
                (click)="setChartView('comparison')"
              >
                <i class="fa-solid fa-scale-balanced"></i>
                vs Batch Average
              </button>
              <button
                class="chart-tab"
                [class.active]="activeChartView() === 'progress'"
                (click)="setChartView('progress')"
              >
                <i class="fa-solid fa-chart-line"></i>
                Progress Over Time
              </button>
            </div>

            @if (isLoadingPerformance()) {
              <div class="chart-loading">
                <app-skeleton-loader type="card" [count]="1" />
              </div>
            } @else {
              <!-- Current Stats View -->
              @if (activeChartView() === 'current') {
                <div class="chart-section">
                  <app-card title="Current Performance Metrics" icon="fa-solid fa-chart-radar" [allowOverflow]="true">
                    <div class="chart-container">
                      @if (currentPerformance()) {
                        <app-radar-chart
                          [datasets]="currentStatsDatasets()"
                          [showLegend]="false"
                        />
                      } @else {
                        <div class="no-data">
                          <i class="fa-solid fa-chart-simple"></i>
                          <p>No performance data available</p>
                        </div>
                      }
                    </div>
                    @if (currentPerformance()) {
                      <div class="metrics-grid">
                        @for (axis of performanceAxes; track axis.key) {
                          <div class="metric-item">
                            <div class="metric-icon">
                              <i [class]="axis.icon"></i>
                            </div>
                            <div class="metric-content">
                              <span class="metric-label">{{ axis.label }}</span>
                              <div class="metric-bar-container">
                                <div 
                                  class="metric-bar" 
                                  [style.width.%]="(currentPerformance()!.metrics[axis.key] / 10) * 100"
                                ></div>
                              </div>
                              <span class="metric-value">{{ currentPerformance()!.metrics[axis.key] }}/10</span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </app-card>
                </div>
              }

              <!-- Comparison View -->
              @if (activeChartView() === 'comparison') {
                <div class="chart-section">
                  <app-card title="Player vs Batch Average" icon="fa-solid fa-scale-balanced" [allowOverflow]="true">
                    <div class="chart-container">
                      @if (currentPerformance() && batchAverage()) {
                        <app-radar-chart
                          [datasets]="comparisonDatasets()"
                          [showLegend]="true"
                        />
                      } @else {
                        <div class="no-data">
                          <i class="fa-solid fa-chart-simple"></i>
                          <p>Insufficient data for comparison</p>
                        </div>
                      }
                    </div>
                    @if (currentPerformance() && batchAverage()) {
                      <div class="comparison-summary">
                        <h4>Performance Summary</h4>
                        <div class="summary-grid">
                          @for (axis of performanceAxes; track axis.key) {
                            <div class="summary-item" [class]="getComparisonClass(axis.key)">
                              <span class="summary-label">{{ axis.label }}</span>
                              <div class="summary-values">
                                <span class="player-value">{{ currentPerformance()!.metrics[axis.key] }}</span>
                                <span class="vs">vs</span>
                                <span class="batch-value">{{ batchAverage()!.averageMetrics[axis.key] }}</span>
                                @if (getDifference(axis.key) !== 0) {
                                  <span class="difference" [class]="getDifference(axis.key) > 0 ? 'positive' : 'negative'">
                                    {{ getDifference(axis.key) > 0 ? '+' : '' }}{{ getDifference(axis.key).toFixed(1) }}
                                  </span>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </app-card>
                </div>
              }

              <!-- Progress View -->
              @if (activeChartView() === 'progress') {
                <div class="chart-section">
                  <app-card title="Progress: First Month vs Current" icon="fa-solid fa-chart-line" [allowOverflow]="true">
                    <div class="chart-container">
                      @if (performanceProgress()) {
                        <app-radar-chart
                          [datasets]="progressDatasets()"
                          [showLegend]="true"
                        />
                      } @else {
                        <div class="no-data">
                          <i class="fa-solid fa-chart-simple"></i>
                          <p>Not enough historical data for progress tracking</p>
                        </div>
                      }
                    </div>
                    @if (performanceProgress()) {
                      <div class="progress-summary">
                        <h4>Improvement Over Time</h4>
                        <div class="progress-header">
                          <span class="time-label baseline">
                            {{ getMonthName(performanceProgress()!.baselineMonth) }} {{ performanceProgress()!.baselineYear }}
                          </span>
                          <span class="arrow">→</span>
                          <span class="time-label current">
                            {{ getMonthName(performanceProgress()!.currentMonth) }} {{ performanceProgress()!.currentYear }}
                          </span>
                        </div>
                        <div class="improvement-grid">
                          @for (axis of performanceAxes; track axis.key) {
                            <div class="improvement-item">
                              <span class="improvement-label">{{ axis.label }}</span>
                              <div class="improvement-values">
                                <span class="old-value">{{ performanceProgress()!.baseline[axis.key] }}</span>
                                <span class="arrow">→</span>
                                <span class="new-value">{{ performanceProgress()!.current[axis.key] }}</span>
                                <span class="improvement" [class]="performanceProgress()!.improvement[axis.key] >= 0 ? 'positive' : 'negative'">
                                  {{ performanceProgress()!.improvement[axis.key] >= 0 ? '+' : '' }}{{ performanceProgress()!.improvement[axis.key] }}
                                </span>
                              </div>
                            </div>
                          }
                        </div>
                        <div class="total-improvement">
                          <span class="label">Average Improvement:</span>
                          <span class="value positive">+{{ calculateAverageImprovement() }}</span>
                        </div>
                      </div>
                    }
                  </app-card>
                </div>
              }
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .performance-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-content {
      h1 {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .selected-batch-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
    }

    .batch-details {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--gray-100);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--gray-200);
        color: var(--text-primary);
      }
    }

    .batch-text {
      h2 {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 4px 0;
      }
    }

    .batch-time {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    /* Student Selection */
    .student-selection {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

      i {
        color: var(--text-muted);
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: var(--font-size-base);
        outline: none;

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }

    .student-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .student-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--white);
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      text-align: left;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-color);
        background: var(--primary-light);
      }

      &.selected {
        border-color: var(--primary-color);
        background: var(--primary-light);
      }
    }

    .student-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .student-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .selected-check {
      color: var(--primary-color);
      font-size: 18px;
    }

    .empty-state {
      grid-column: 1 / -1;
      padding: 40px;
      text-align: center;

      i {
        font-size: 40px;
        color: var(--gray-300);
        margin-bottom: 12px;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    /* Performance Section */
    .performance-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-header {
      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }

    /* Chart Tabs */
    .chart-tabs {
      display: flex;
      gap: 8px;
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 4px;
    }

    .chart-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      background: transparent;
      border: none;
      border-radius: var(--border-radius);
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--gray-100);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary-color);
        color: white;
      }
    }

    /* Chart Container */
    .chart-section {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .chart-container {
      padding: 12px;
      min-height: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-loading {
      min-height: 400px;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;

      i {
        font-size: 48px;
        color: var(--gray-300);
        margin-bottom: 16px;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .metric-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: var(--gray-50);
      border-radius: var(--border-radius);
    }

    .metric-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-light);
      color: var(--primary-color);
      border-radius: 50%;
      font-size: 14px;
    }

    .metric-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metric-label {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .metric-bar-container {
      height: 6px;
      background: var(--gray-200);
      border-radius: 3px;
      overflow: hidden;
    }

    .metric-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), var(--success-color));
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    .metric-value {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Comparison Summary */
    .comparison-summary,
    .progress-summary {
      padding-top: 20px;
      border-top: 1px solid var(--border-color);

      h4 {
        margin: 0 0 16px 0;
        font-size: var(--font-size-base);
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }

    .summary-item {
      padding: 12px;
      background: var(--gray-50);
      border-radius: var(--border-radius);
      border-left: 3px solid var(--gray-300);

      &.above {
        border-left-color: var(--success-color);
        background: linear-gradient(90deg, var(--success-light) 0%, var(--gray-50) 100%);
      }

      &.below {
        border-left-color: var(--danger-color);
        background: linear-gradient(90deg, var(--danger-light) 0%, var(--gray-50) 100%);
      }
    }

    .summary-label {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .summary-values {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .player-value {
      font-weight: 600;
      color: var(--primary-color);
    }

    .vs {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .batch-value {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .difference {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: var(--font-size-xs);
      font-weight: 600;

      &.positive {
        background: var(--success-light);
        color: var(--success-color);
      }

      &.negative {
        background: var(--danger-light);
        color: var(--danger-color);
      }
    }

    /* Progress Summary */
    .progress-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 16px;
      background: var(--gray-50);
      border-radius: var(--border-radius);
    }

    .time-label {
      padding: 8px 16px;
      border-radius: var(--border-radius);
      font-weight: 500;

      &.baseline {
        background: var(--gray-200);
        color: var(--text-secondary);
      }

      &.current {
        background: var(--primary-color);
        color: white;
      }
    }

    .arrow {
      color: var(--text-muted);
      font-size: var(--font-size-lg);
    }

    .improvement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .improvement-item {
      padding: 12px;
      background: var(--gray-50);
      border-radius: var(--border-radius);
    }

    .improvement-label {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .improvement-values {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .old-value {
      color: var(--text-secondary);
    }

    .new-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .improvement {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: var(--font-size-xs);
      font-weight: 600;

      &.positive {
        background: var(--success-light);
        color: var(--success-color);
      }

      &.negative {
        background: var(--danger-light);
        color: var(--danger-color);
      }
    }

    .total-improvement {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 20px;
      padding: 16px;
      background: var(--success-light);
      border-radius: var(--border-radius);

      .label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .value {
        font-size: var(--font-size-xl);
        font-weight: 700;

        &.positive {
          color: var(--success-color);
        }
      }
    }

    @media (max-width: 768px) {
      .chart-tabs {
        flex-direction: column;
      }

      .student-list {
        grid-template-columns: 1fr;
      }

      .summary-grid,
      .improvement-grid,
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .chart-container {
        min-height: 340px;
        padding: 8px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceComponent implements OnInit {
  private performanceService = inject(PerformanceService);
  private attendanceService = inject(AttendanceService);
  private studentService = inject(StudentService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  isLoadingBatches = signal(true);
  batches = signal<AttendanceBatch[]>([]);
  selectedBatchId = signal<number | null>(null);
  
  students = signal<Student[]>([]);
  selectedStudent = signal<Student | null>(null);
  searchQuery = signal('');

  isLoadingPerformance = signal(false);
  currentPerformance = signal<PlayerPerformance | null>(null);
  batchAverage = signal<BatchAveragePerformance | null>(null);
  performanceProgress = signal<PerformanceProgress | null>(null);

  activeChartView = signal<ChartView>('current');

  performanceAxes = PERFORMANCE_AXES;

  selectedBatch = computed(() => {
    const batchId = this.selectedBatchId();
    return this.batches().find(b => b.id === batchId);
  });

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allStudents = this.students();
    
    if (!query) return allStudents;
    
    return allStudents.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(query)
    );
  });

  // Chart datasets
  currentStatsDatasets = computed((): RadarDataset[] => {
    const perf = this.currentPerformance();
    if (!perf) return [];
    
    return [createRadarDataset('Current', perf.metrics, '#3b82f6')];
  });

  comparisonDatasets = computed((): RadarDataset[] => {
    const perf = this.currentPerformance();
    const avg = this.batchAverage();
    if (!perf || !avg) return [];
    
    return [
      createRadarDataset('Player', perf.metrics, '#3b82f6'),
      createRadarDataset('Batch Average', avg.averageMetrics, '#94a3b8')
    ];
  });

  progressDatasets = computed((): RadarDataset[] => {
    const progress = this.performanceProgress();
    if (!progress) return [];
    
    return [
      createRadarDataset('Month 1', progress.baseline, '#94a3b8'),
      createRadarDataset('Current', progress.current, '#22c55e')
    ];
  });

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.isLoadingBatches.set(true);
    this.attendanceService.getBatchesForAttendance().subscribe({
      next: (batches) => {
        this.batches.set(batches);
        this.isLoadingBatches.set(false);
      },
      error: () => {
        this.isLoadingBatches.set(false);
        this.toastService.error('Failed to load batches');
      }
    });
  }

  onBatchSelect(batchId: number): void {
    this.selectedBatchId.set(batchId);
    this.loadStudentsForBatch(batchId);
  }

  onBackToBatches(): void {
    this.selectedBatchId.set(null);
    this.selectedStudent.set(null);
    this.students.set([]);
    this.searchQuery.set('');
    this.resetPerformanceData();
  }

  loadStudentsForBatch(batchId: number): void {
    this.studentService.getStudentsByBatch(batchId).subscribe({
      next: (students) => {
        this.students.set(students);
      },
      error: () => {
        this.toastService.error('Failed to load students');
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  selectStudent(student: Student): void {
    this.selectedStudent.set(student);
    this.loadPerformanceData(student.id);
  }

  loadPerformanceData(studentId: number): void {
    this.isLoadingPerformance.set(true);

    // Load current performance
    this.performanceService.getPlayerPerformance(studentId).subscribe({
      next: (perf) => {
        this.currentPerformance.set(perf);
        this.isLoadingPerformance.set(false);
      },
      error: () => {
        this.isLoadingPerformance.set(false);
      }
    });

    // Load batch average
    const batchId = this.selectedBatchId();
    if (batchId) {
      this.performanceService.getBatchAveragePerformance(batchId).subscribe({
        next: (avg) => this.batchAverage.set(avg)
      });
    }

    // Load progress
    this.performanceService.getPerformanceProgress(studentId).subscribe({
      next: (progress) => this.performanceProgress.set(progress)
    });
  }

  resetPerformanceData(): void {
    this.currentPerformance.set(null);
    this.batchAverage.set(null);
    this.performanceProgress.set(null);
  }

  setChartView(view: ChartView): void {
    this.activeChartView.set(view);
  }

  formatSkillLevel(level: string): string {
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  getSkillBadgeVariant(skillLevel: string): 'primary' | 'success' | 'warning' | 'danger' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      'BEGINNER': 'success',
      'INTERMEDIATE': 'primary',
      'ADVANCED': 'warning',
      'PROFESSIONAL': 'danger'
    };
    return variants[skillLevel] || 'primary';
  }

  getDifference(key: keyof PerformanceMetrics): number {
    const perf = this.currentPerformance();
    const avg = this.batchAverage();
    if (!perf || !avg) return 0;
    return perf.metrics[key] - avg.averageMetrics[key];
  }

  getComparisonClass(key: keyof PerformanceMetrics): string {
    const diff = this.getDifference(key);
    if (diff > 0) return 'above';
    if (diff < 0) return 'below';
    return '';
  }

  getMonthName(month: number): string {
    return this.performanceService.getMonthName(month);
  }

  calculateAverageImprovement(): string {
    const progress = this.performanceProgress();
    if (!progress) return '0';

    const improvements = Object.values(progress.improvement);
    const avg = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    return avg.toFixed(1);
  }
}
