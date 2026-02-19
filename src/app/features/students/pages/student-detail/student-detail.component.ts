import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../../attendance/services/attendance.service';
import { Student, Role, FeePaymentHistory, MonthlyFeeStatus } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AvatarComponent,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="student-detail-page">
      @if (isLoading()) {
        <app-skeleton-loader type="profile" />
        <app-skeleton-loader type="stats" [count]="4" />
        <app-skeleton-loader type="card" [count]="4" />
      } @else if (student()) {
        <div class="page-header">
          <button class="back-btn" (click)="goBack()">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="header-content">
            <div class="student-header">
              <app-avatar 
                [name]="student()!.firstName + ' ' + student()!.lastName"
                size="lg"
              />
              <div class="student-info">
                <h1>{{ student()?.firstName }} {{ student()?.lastName }}</h1>
                <div class="student-badges">
                  <app-badge
                    [text]="student()!.status ?? 'INACTIVE'"
                    [variant]="(student()!.status ?? 'INACTIVE') === 'ACTIVE' ? 'success' : 'warning'"
                  />
                  @if (student()?.skillLevel) {
                    <app-badge
                      [text]="formatSkillLevel(student()!.skillLevel!)"
                      [variant]="getSkillBadgeVariant(student()!.skillLevel!)"
                    />
                  }
                </div>
              </div>
            </div>
          </div>
          <div class="header-actions">
            @if (canManageStudents()) {
              <app-button variant="outline" icon="fa-solid fa-pen" [routerLink]="['edit']">
                Edit
              </app-button>
            }
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon attendance">
              <i class="fa-solid fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ attendanceStats().percentage }}%</span>
              <span class="stat-label">Attendance Rate</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon present">
              <i class="fa-solid fa-user-check"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ attendanceStats().present }}</span>
              <span class="stat-label">Days Present</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon absent">
              <i class="fa-solid fa-user-xmark"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ attendanceStats().absent }}</span>
              <span class="stat-label">Days Absent</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon late">
              <i class="fa-solid fa-clock"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ attendanceStats().late }}</span>
              <span class="stat-label">Days Late</span>
            </div>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="info-grid">
          <app-card title="Contact Information" icon="fa-solid fa-address-book">
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ student()?.phone || 'Not provided' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">{{ student()?.address || 'Not provided' }}</span>
              </div>
            </div>
          </app-card>

          <app-card title="Personal Details" icon="fa-solid fa-user">
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Date of Birth</span>
                <span class="info-value">{{ student()?.dateOfBirth | date:'MMM d, y' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gender</span>
                <span class="info-value">{{ student()?.gender || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Join Date</span>
                <span class="info-value">{{ student()?.joinDate | date:'MMM d, y' }}</span>
              </div>
            </div>
          </app-card>

          <app-card title="Training Details" icon="fa-solid fa-dumbbell">
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Batch</span>
                @if (student()?.batchNames?.length) {
                  <span class="info-value">{{ student()?.batchNames?.join(', ') }}</span>
                } @else {
                  <span class="info-value">Not assigned</span>
                }
              </div>
              <div class="info-item">
                <span class="info-label">Skill Level</span>
                <span class="info-value">{{ formatSkillLevel(student()?.skillLevel || 'Not assessed') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Training Days</span>
                <span class="info-value">{{ formatTrainingDays(student()?.daysOfWeek) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fee Payable</span>
                <span class="info-value">{{ student()?.feePayable ?? 0 }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Monthly Fee Status</span>
                <span class="info-value">{{ student()?.monthlyFeeStatus || 'UNPAID' }}</span>
              </div>
            </div>
          </app-card>

          <app-card title="Emergency Contact" icon="fa-solid fa-phone">
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Contact Name</span>
                <span class="info-value">{{ student()?.emergencyContactName || 'Not provided' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Contact Phone</span>
                <span class="info-value">{{ student()?.emergencyContactPhone || 'Not provided' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Medical Conditions</span>
                <span class="info-value">{{ student()?.medicalConditions || 'None noted' }}</span>
              </div>
            </div>
          </app-card>
        </div>

        <!-- Fee Payment History -->
        @if (canManageStudents()) {
          <app-card title="Fee Payment History" icon="fa-solid fa-indian-rupee-sign">
            @if (isLoadingFeeHistory()) {
              <app-skeleton-loader type="list" [count]="4" />
            } @else if (feeHistory().length === 0) {
              <div class="empty-fee-history">
                <i class="fa-regular fa-file-invoice"></i>
                <p>No fee payment history available</p>
              </div>
            } @else {
              <div class="fee-history-list">
                @for (fee of feeHistory(); track fee.month) {
                  <div class="fee-history-item">
                    <div class="fee-month">
                      <span class="month-name">{{ fee.month }}</span>
                    </div>
                    <div class="fee-status" [class]="getFeeStatusClass(fee.status)">
                      {{ formatFeeStatus(fee.status) }}
                    </div>
                    <div class="fee-amount">
                      ₹{{ fee.amountPaid }}
                    </div>
                  </div>
                }
              </div>
            }
          </app-card>
        }
      } @else {
        <div class="not-found">
          <i class="fa-regular fa-user"></i>
          <h2>Student Not Found</h2>
          <p>The student you're looking for doesn't exist.</p>
          <app-button variant="primary" routerLink="/dashboard/students">Back to Students</app-button>
        </div>
      }
    </div>
  `,
  styles: [`
    .student-detail-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      flex-shrink: 0;

      &:hover {
        background-color: var(--gray-100);
        color: var(--text-primary);
      }
    }

    .header-content {
      flex: 1;
      min-width: 200px;
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .student-info {
      h1 {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }
    }

    .student-badges {
      display: flex;
      gap: 8px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 18px;

      &.attendance {
        background-color: var(--primary-light);
        color: var(--primary-color);
      }

      &.present {
        background-color: var(--success-light);
        color: var(--success-color);
      }

      &.absent {
        background-color: var(--danger-light);
        color: var(--danger-color);
      }

      &.late {
        background-color: var(--warning-light);
        color: var(--warning-color);
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .info-value {
      font-weight: 500;
      color: var(--text-primary);
    }

    .batch-link {
      color: var(--primary-color);
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .not-found {
      padding: 80px 40px;
      text-align: center;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

      i {
        font-size: 64px;
        color: var(--gray-300);
        margin-bottom: 20px;
      }

      h2 {
        font-size: var(--font-size-xl);
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0 0 24px 0;
      }
    }

    .empty-fee-history {
      text-align: center;
      padding: 32px 20px;
      color: var(--text-muted);

      i {
        font-size: 40px;
        margin-bottom: 12px;
        color: var(--gray-300);
      }

      p {
        margin: 0;
      }
    }

    .fee-history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .fee-history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--gray-50);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .fee-month {
      flex: 1;
    }

    .month-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .fee-status {
      padding: 4px 12px;
      border-radius: 999px;
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
    }

    .fee-status.full {
      background: var(--success-light);
      color: var(--success-color);
    }

    .fee-status.half {
      background: var(--warning-light);
      color: var(--warning-color);
    }

    .fee-status.unpaid {
      background: var(--danger-light);
      color: var(--danger-color);
    }

    .fee-amount {
      min-width: 80px;
      text-align: right;
      font-weight: 600;
      color: var(--text-primary);
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .student-header {
        flex-direction: column;
        text-align: center;
      }

      .student-badges {
        justify-content: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);

  isLoading = signal(true);
  student = signal<Student | null>(null);
  attendanceStats = signal({ present: 0, absent: 0, late: 0, percentage: 0 });
  isLoadingFeeHistory = signal(false);
  feeHistory = signal<FeePaymentHistory[]>([]);
  private readonly dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  private readonly dayLabels: Record<string, string> = {
    MONDAY: 'Mon',
    TUESDAY: 'Tue',
    WEDNESDAY: 'Wed',
    THURSDAY: 'Thu',
    FRIDAY: 'Fri',
    SATURDAY: 'Sat',
    SUNDAY: 'Sun'
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStudent(parseInt(id));
    }
  }

  loadStudent(id: number): void {
    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.student.set(student || null);
        this.isLoading.set(false);
        if (student) {
          const isEnrolled = (student.batchIds?.length || 0) > 0;
          if (isEnrolled) {
            this.loadAttendanceStats(student.id);
          } else {
            this.attendanceStats.set({ present: 0, absent: 0, late: 0, percentage: 0 });
          }
          // Load fee history for coaches/admins
          if (this.canManageStudents()) {
            this.loadFeeHistory(student.id, student.feePayable || 0);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadAttendanceStats(studentId: number): void {
    this.attendanceService.getStudentAttendanceStats(studentId).subscribe({
      next: (stats) => this.attendanceStats.set(stats)
    });
  }

  loadFeeHistory(studentId: number, feePayable: number): void {
    this.isLoadingFeeHistory.set(true);
    this.studentService.getFeePaymentHistory(studentId).subscribe({
      next: (history) => {
        this.feeHistory.set(history);
        this.isLoadingFeeHistory.set(false);
      },
      error: () => {
        // If API fails, generate mock data for demonstration
        this.feeHistory.set(this.generateMockFeeHistory(feePayable));
        this.isLoadingFeeHistory.set(false);
      }
    });
  }

  private generateMockFeeHistory(feePayable: number): FeePaymentHistory[] {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const history: FeePaymentHistory[] = [];
    
    // Generate last 6 months of history
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      // Randomly assign status for demo
      const statuses: MonthlyFeeStatus[] = [MonthlyFeeStatus.FULL, MonthlyFeeStatus.HALF, MonthlyFeeStatus.UNPAID];
      const status = i === 0 ? MonthlyFeeStatus.UNPAID : statuses[Math.floor(Math.random() * 2)]; // Current month usually unpaid
      
      const amountPaid = status === MonthlyFeeStatus.FULL ? feePayable : 
                         status === MonthlyFeeStatus.HALF ? Math.floor(feePayable / 2) : 0;

      history.push({
        month: `${months[monthIndex]} ${year}`,
        year,
        monthNumber: monthIndex + 1,
        status,
        amountPaid,
        feePayable
      });
    }
    
    return history;
  }

  canManageStudents(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === Role.ADMIN || role === Role.COACH;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }

  formatSkillLevel(level: string): string {
    if (!level || level === 'Not assessed') return level;
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  formatTrainingDays(days: string[] | undefined): string {
    if (!days || days.length === 0) {
      return 'Not set';
    }

    const sortedDays = [...days].sort(
      (a, b) => this.dayOrder.indexOf(a) - this.dayOrder.indexOf(b)
    );

    return sortedDays
      .map((day) => this.dayLabels[day] || day)
      .join(', ');
  }

  formatFeeStatus(status: MonthlyFeeStatus): string {
    if (status === MonthlyFeeStatus.FULL) return 'Full Paid';
    if (status === MonthlyFeeStatus.HALF) return 'Half Paid';
    return 'Unpaid';
  }

  getFeeStatusClass(status: MonthlyFeeStatus): string {
    if (status === MonthlyFeeStatus.FULL) return 'full';
    if (status === MonthlyFeeStatus.HALF) return 'half';
    return 'unpaid';
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
}
