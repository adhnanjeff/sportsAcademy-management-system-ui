import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AttendanceService,
  StudentAttendance,
  AttendancePayload,
  AttendanceBatch
} from '../../services/attendance.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AttendanceStatus } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { BatchSelectorComponent } from '../../components/batch-selector/batch-selector.component';
import { AttendanceCardComponent } from '../../components/attendance-card/attendance-card.component';
import { AttendanceSummaryComponent } from '../../components/attendance-summary/attendance-summary.component';

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    SkeletonLoaderComponent,
    BatchSelectorComponent,
    AttendanceCardComponent,
    AttendanceSummaryComponent
  ],
  template: `
    <div class="mark-attendance">
      <!-- Header -->
      <div class="page-header animate-fade-in">
        <div class="header-content">
          <h1>Mark Attendance</h1>
          <p>Record attendance for your batches</p>
        </div>
        <div class="header-date">
          <label for="attendance-date">Date:</label>
          <input
            type="date"
            id="attendance-date"
            [value]="selectedDate()"
            (change)="onDateChange($event)"
            class="date-input"
          />
          <app-button
            class="report-nav-btn"
            variant="outline"
            size="sm"
            icon="fa-regular fa-calendar-check"
            (clicked)="goToAttendanceReport()"
          >
            Attendance Report
          </app-button>
        </div>
      </div>

      @if (isLoadingBatches()) {
        <app-skeleton-loader type="card" [count]="3" />
      } @else {
        <!-- Step 1: Batch Selection -->
        @if (!selectedBatchId()) {
          <div class="animate-fade-in-up stagger-1">
            <app-card title="Select a Batch" icon="fa-solid fa-layer-group">
              <app-batch-selector
                [batches]="batches()"
                [selectedBatchId]="selectedBatchId()"
                (batchSelect)="onBatchSelect($event)"
              />
            </app-card>
          </div>
        } @else {
          <!-- Selected Batch Info -->
          <div class="selected-batch-info animate-fade-in-up stagger-1">
            <div class="batch-details">
              <button class="back-btn" (click)="onBackToBatches()">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <div class="batch-text">
                <h2>{{ selectedBatch()?.name }}</h2>
                <span class="batch-time">{{ selectedBatch()?.startTime }} - {{ selectedBatch()?.endTime }}</span>
              </div>
            </div>
            <div class="batch-actions">
              <app-button
                variant="outline"
                size="sm"
                icon="fa-solid fa-check-double"
                [disabled]="isPastDate()"
                (clicked)="markAllPresent()"
              >
                Mark All Present
              </app-button>
              <app-button
                variant="outline"
                size="sm"
                icon="fa-solid fa-xmark"
                [disabled]="isPastDate()"
                (clicked)="markAllAbsent()"
              >
                Mark All Absent
              </app-button>
            </div>
          </div>

          <!-- Summary -->
          <div class="animate-fade-in-up stagger-2">
            <app-attendance-summary [students]="students()" />
          </div>

          @if (isPastDate()) {
            <div class="attendance-locked-banner animate-fade-in" role="status" aria-live="polite">
              <i class="fa-solid fa-lock"></i>
              <div class="banner-content">
                <h4>Attendance Locked</h4>
                <p>Attendance for {{ selectedDate() }} is locked because the date has already passed.</p>
              </div>
            </div>
          }

          <!-- Students List -->
          @if (isLoadingStudents()) {
            <app-skeleton-loader type="list" [count]="6" />
          } @else {
            <div class="students-section animate-fade-in-up stagger-3">
              <div class="section-header">
                <div class="section-title">
                  <h3>Students ({{ students().length }})</h3>
                  <p class="day-filter-note">Showing students scheduled for {{ selectedDayLabel() }}</p>
                </div>
                <div class="search-box">
                  <i class="fa-solid fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search students..."
                    [value]="searchQuery()"
                    (input)="onSearch($event)"
                  />
                </div>
              </div>

              <div class="students-grid">
                @for (student of filteredStudents(); track student.studentId) {
                  <app-attendance-card
                    [student]="student"
                    [disabled]="isPastDate()"
                    (statusChange)="onStatusChange($event)"
                    (notesChange)="onNotesChange($event)"
                  />
                } @empty {
                  <div class="no-students animate-fade-in">
                    <i class="fa-regular fa-user-slash"></i>
                    <p>No students found</p>
                  </div>
                }
              </div>
            </div>

            <!-- Submit Button -->
            <div class="submit-section animate-fade-in-up stagger-4">
              <app-button
                variant="primary"
                size="lg"
                icon="fa-solid fa-paper-plane"
                [loading]="isSubmitting()"
                [disabled]="students().length === 0 || isPastDate()"
                (clicked)="submitAttendance()"
              >
                Submit Attendance
              </app-button>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .mark-attendance {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
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

    .header-date {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      label {
        font-weight: 500;
        color: var(--text-secondary);
      }
    }

    .report-nav-btn {
      margin-left: 4px;
    }

    .date-input {
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      background-color: var(--white);
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
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
      flex-wrap: wrap;
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

    .batch-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .students-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .attendance-locked-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--border-radius-lg);
      border: 1px solid #fbbf24;
      background: #fffbeb;
      color: #92400e;

      i {
        font-size: 16px;
        margin-top: 2px;
      }

      .banner-content {
        h4 {
          margin: 0 0 2px 0;
          font-size: var(--font-size-base);
          font-weight: 700;
          color: #78350f;
        }

        p {
          margin: 0;
          font-size: var(--font-size-sm);
          color: #92400e;
        }
      }
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;

      h3 {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .section-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .day-filter-note {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--text-muted);
      font-weight: 500;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      min-width: 250px;

      &:focus-within {
        border-color: var(--primary-color);
      }

      i {
        color: var(--text-muted);
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: var(--font-size-base);

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }

    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }

    .no-students {
      grid-column: 1 / -1;
      padding: 60px 20px;
      text-align: center;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

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

    .submit-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      justify-content: center;
      padding: 24px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      position: sticky;
      bottom: 24px;
      box-shadow: var(--shadow-lg);
    }

    @media (max-width: 640px) {
      .students-grid {
        grid-template-columns: 1fr;
      }

      .search-box {
        width: 100%;
        min-width: auto;
      }

      .student-col {
        min-width: 150px !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkAttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  readonly AttendanceStatus = AttendanceStatus;

  // State signals
  isLoadingBatches = signal(true);
  isLoadingStudents = signal(false);
  isSubmitting = signal(false);
  batches = signal<AttendanceBatch[]>([]);
  selectedBatchId = signal<number | null>(null);
  students = signal<StudentAttendance[]>([]);
  searchQuery = signal('');
  selectedDate = signal(this.getTodayLocalIso());

  // Computed
  selectedBatch = computed(() => {
    const batchId = this.selectedBatchId();
    return this.batches().find(b => b.id === batchId) || null;
  });

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.students();
    return this.students().filter(s =>
      s.studentName.toLowerCase().includes(query)
    );
  });

  isPastDate = computed(() => {
    const selected = this.selectedDate();
    const today = this.getTodayLocalIso();
    return selected < today;
  });

  selectedDayLabel = computed(() => {
    const dateValue = this.selectedDate();
    const [year, month, day] = dateValue.split('-').map(Number);
    if (!year || !month || !day) {
      return 'selected day';
    }

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
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
        this.toastService.error('Failed to load batches');
        this.isLoadingBatches.set(false);
      }
    });
  }

  onBatchSelect(batchId: number): void {
    this.selectedBatchId.set(batchId);
    this.loadStudents(batchId, this.selectedDate());
  }

  loadStudents(batchId: number, date?: string): void {
    this.isLoadingStudents.set(true);
    this.attendanceService.getStudentsForBatch(batchId, date).subscribe({
      next: (students) => {
        this.students.set(students);
        this.isLoadingStudents.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load students');
        this.isLoadingStudents.set(false);
      }
    });
  }

  onBackToBatches(): void {
    this.selectedBatchId.set(null);
    this.students.set([]);
    this.searchQuery.set('');
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(input.value);
    const batchId = this.selectedBatchId();
    if (batchId) {
      this.loadStudents(batchId, input.value);
    }
  }

  goToAttendanceReport(): void {
    this.router.navigate(['/dashboard/attendance/history']);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onStatusChange(change: { studentId: number; status: AttendanceStatus }): void {
    const updated = this.students().map(s =>
      s.studentId === change.studentId ? { ...s, status: change.status } : s
    );
    this.students.set(updated);
  }

  onNotesChange(change: { studentId: number; notes: string }): void {
    const updated = this.students().map(s =>
      s.studentId === change.studentId ? { ...s, notes: change.notes } : s
    );
    this.students.set(updated);
  }

  markAllPresent(): void {
    const updated = this.students().map(s => ({ ...s, status: 'PRESENT' as AttendanceStatus }));
    this.students.set(updated);
    this.toastService.success('All students marked as present');
  }

  markAllAbsent(): void {
    const updated = this.students().map(s => ({ ...s, status: 'ABSENT' as AttendanceStatus }));
    this.students.set(updated);
    this.toastService.info('All students marked as absent');
  }

  submitAttendance(): void {
    const batchId = this.selectedBatchId();
    if (!batchId || this.isPastDate()) return;

    const payload: AttendancePayload = {
      batchId,
      date: this.selectedDate(),
      records: this.students().map(s => ({
        studentId: s.studentId,
        status: s.status,
        notes: s.notes
      }))
    };

    this.isSubmitting.set(true);
    this.attendanceService.submitAttendance(payload).subscribe({
      next: (response) => {
        this.toastService.success(response.message);
        this.isSubmitting.set(false);
        this.onBackToBatches();
      },
      error: () => {
        this.toastService.error('Failed to submit attendance');
        this.isSubmitting.set(false);
      }
    });
  }

  private getTodayLocalIso(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
