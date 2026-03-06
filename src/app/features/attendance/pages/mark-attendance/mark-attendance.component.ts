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
import { AuthService } from '../../../../core/services/auth.service';
import { AttendanceStatus, AttendanceEntryType, Role } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
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
    ModalComponent,
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
                [disabled]="isLocked()"
                (clicked)="markAllPresent()"
              >
                Mark All Present
              </app-button>
              <app-button
                variant="outline"
                size="sm"
                icon="fa-solid fa-xmark"
                [disabled]="isLocked()"
                (clicked)="markAllAbsent()"
              >
                Mark All Absent
              </app-button>
              <app-button
                variant="outline"
                size="sm"
                icon="fa-solid fa-user-plus"
                [disabled]="isLocked()"
                (clicked)="showAddMakeupModal()"
              >
                Add Makeup Student
              </app-button>
            </div>
          </div>

          <!-- Summary -->
          <div class="animate-fade-in-up stagger-2">
            <app-attendance-summary [students]="students()" />
          </div>

          @if (isPastDate()) {
            @if (isWithinBackdateWindow()) {
              <div class="backdate-info-banner animate-fade-in" role="status" aria-live="polite">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <div class="banner-content">
                  <h4>Backdated Attendance</h4>
                  <p>You are marking attendance for {{ selectedDate() }} ({{ getDaysAgo() }} days ago). A reason will be required.</p>
                </div>
              </div>
            } @else {
              <div class="attendance-locked-banner animate-fade-in" role="status" aria-live="polite">
                <i class="fa-solid fa-lock"></i>
                <div class="banner-content">
                  <h4>Attendance Locked</h4>
                  <p>{{ isAdmin() ? 'Admin' : 'Coach' }} access allows backdating up to {{ isAdmin() ? '30' : '7' }} days. This date is {{ getDaysAgo() }} days ago.</p>
                </div>
              </div>
            }
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
                    [disabled]="isLocked()"
                    (statusChange)="onStatusChange($event)"
                    (notesChange)="onNotesChange($event)"
                  />
                } @empty {
                  <div class="no-students animate-fade-in">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <p>No students scheduled for this day</p>
                  </div>
                }
              </div>
            </div>

            <!-- Submit Button -->
            <div class="submit-section animate-fade-in-up stagger-4">
              @if (requiresBackdateReason()) {
                <div class="backdate-reason-container">
                  <label for="backdate-reason">Reason for backdated entry <span class="required">*</span></label>
                  <textarea
                    id="backdate-reason"
                    [value]="backdateReason()"
                    (input)="onBackdateReasonChange($event)"
                    placeholder="Enter reason for marking attendance for a past date..."
                    rows="2"
                    class="backdate-reason-input"
                  ></textarea>
                </div>
              }
              <app-button
                variant="primary"
                size="lg"
                icon="fa-solid fa-paper-plane"
                [loading]="isSubmitting()"
                [disabled]="students().length === 0 || isLocked() || (requiresBackdateReason() && !backdateReason())"
                (clicked)="submitAttendance()"
              >
                {{ requiresBackdateReason() ? 'Submit Backdated Attendance' : 'Submit Attendance' }}
              </app-button>
            </div>
          }
        }
      }
    </div>

    <app-modal
      [isOpen]="showMakeupStudentModal()"
      title="Add Makeup Student"
      size="md"
      (close)="closeMakeupModal()"
    >
      <div class="makeup-modal-content">
        <p class="makeup-modal-note">Select a student from this batch to add as a makeup entry for {{ selectedDate() }}.</p>

        <div class="makeup-search-box">
          <i class="fa-solid fa-search"></i>
          <input
            type="text"
            placeholder="Search by student name..."
            [value]="makeupSearchQuery()"
            (input)="onMakeupSearch($event)"
          />
        </div>

        <div class="makeup-student-list">
          @for (student of filteredMakeupStudents(); track student.studentId) {
            <button
              type="button"
              class="makeup-student-item"
              [class.selected]="selectedMakeupStudentId() === student.studentId"
              (click)="selectMakeupStudent(student.studentId)"
            >
              <span class="student-name">{{ student.studentName }}</span>
              @if (selectedMakeupStudentId() === student.studentId) {
                <i class="fa-solid fa-check"></i>
              }
            </button>
          } @empty {
            <div class="makeup-empty-state">
              <i class="fa-solid fa-users-slash"></i>
              <p>No available students to add</p>
            </div>
          }
        </div>

        @if (selectedMakeupStudentId()) {
          <div class="makeup-compensates-field">
            <label for="makeup-compensates-date">
              Compensates for missed date <span class="required">*</span>
            </label>

            @if (isLoadingEligibleAbsences()) {
              <p class="makeup-field-message">Loading eligible absences...</p>
            } @else if (eligibleAbsenceDates().length === 0) {
              <p class="makeup-field-message warning">
                No eligible absence found for this student in the allowed window.
              </p>
            } @else {
              <select
                id="makeup-compensates-date"
                class="makeup-date-select"
                [value]="selectedCompensatesForDate() || ''"
                (change)="onCompensatesForDateChange($event)"
              >
                <option value="" disabled>Select missed date</option>
                @for (date of eligibleAbsenceDates(); track date) {
                  <option [value]="date">{{ date }}</option>
                }
              </select>
            }
          </div>
        }
      </div>

      <div class="makeup-modal-actions" slot="footer">
        <app-button variant="outline" (clicked)="closeMakeupModal()">Cancel</app-button>
        <app-button
          variant="primary"
          icon="fa-solid fa-plus"
          [disabled]="!selectedMakeupStudentId() || isLoadingEligibleAbsences() || !selectedCompensatesForDate()"
          (clicked)="confirmAddMakeupStudent()"
        >
          Add Student
        </app-button>
      </div>
    </app-modal>
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

    .makeup-modal-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .makeup-modal-note {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .makeup-search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--white);

      i {
        color: var(--text-muted);
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: var(--font-size-base);
      }
    }

    .makeup-student-list {
      max-height: 280px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .makeup-student-item {
      width: 100%;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--white);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-primary);
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

    .makeup-empty-state {
      padding: 24px 12px;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 24px;
        margin-bottom: 8px;
      }

      p {
        margin: 0;
      }
    }

    .makeup-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .makeup-compensates-field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .required {
        color: var(--error-color);
      }
    }

    .makeup-date-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      background: var(--white);

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }

    .makeup-field-message {
      margin: 0;
      color: var(--text-muted);
      font-size: var(--font-size-sm);

      &.warning {
        color: var(--warning-color);
      }
    }

    .submit-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      justify-content: center;
      padding: 24px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      position: sticky;
      bottom: 24px;
      box-shadow: var(--shadow-lg);
    }

    .backdate-reason-container {
      width: 100%;
      max-width: 500px;
      
      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
        
        .required {
          color: var(--error-color);
        }
      }
    }

    .backdate-reason-input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      resize: vertical;
      
      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
      }
    }

    .backdate-info-banner {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #fff8e5 0%, #fff3cd 100%);
      border: 1px solid #ffc107;
      border-radius: var(--border-radius-lg);
      border-left: 4px solid #ffc107;

      i {
        font-size: 24px;
        color: #c69500;
        margin-top: 2px;
      }

      .banner-content {
        h4 {
          margin: 0 0 4px;
          font-size: var(--font-size-base);
          font-weight: 600;
          color: #8a6d00;
        }

        p {
          margin: 0;
          font-size: var(--font-size-sm);
          color: #a17c00;
        }
      }
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
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly AttendanceStatus = AttendanceStatus;
  readonly AttendanceEntryType = AttendanceEntryType;

  // State signals
  isLoadingBatches = signal(true);
  isLoadingStudents = signal(false);
  isSubmitting = signal(false);
  batches = signal<AttendanceBatch[]>([]);
  selectedBatchId = signal<number | null>(null);
  students = signal<StudentAttendance[]>([]);
  searchQuery = signal('');
  selectedDate = signal(this.getTodayLocalIso());
  backdateReason = signal('');
  showMakeupStudentModal = signal(false);
  allBatchStudents = signal<StudentAttendance[]>([]);
  makeupSearchQuery = signal('');
  selectedMakeupStudentId = signal<number | null>(null);
  isLoadingEligibleAbsences = signal(false);
  eligibleAbsenceDates = signal<string[]>([]);
  selectedCompensatesForDate = signal<string | null>(null);

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

  filteredMakeupStudents = computed(() => {
    const query = this.makeupSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.allBatchStudents();
    }

    return this.allBatchStudents().filter(student =>
      student.studentName.toLowerCase().includes(query)
    );
  });

  isPastDate = computed(() => {
    const selected = this.selectedDate();
    const today = this.getTodayLocalIso();
    return selected < today;
  });

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === Role.ADMIN;
  });

  isWithinBackdateWindow = computed(() => {
    return this.attendanceService.isWithinBackdateWindow(
      this.selectedDate(), 
      this.isAdmin()
    );
  });

  requiresBackdateReason = computed(() => {
    return this.attendanceService.requiresBackdateReason(this.selectedDate());
  });

  isLocked = computed(() => {
    return this.isPastDate() && !this.isWithinBackdateWindow();
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

  getDaysAgo(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(this.selectedDate());
    selected.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - selected.getTime()) / (1000 * 60 * 60 * 24));
  }

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
    this.closeMakeupModal();
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(input.value);
    this.closeMakeupModal();
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
    if (!batchId || this.isLocked()) return;

    // Check if reason is required but not provided
    if (this.requiresBackdateReason() && !this.backdateReason().trim()) {
      this.toastService.error('Please provide a reason for backdated attendance');
      return;
    }

    const payload: AttendancePayload = {
      batchId,
      date: this.selectedDate(),
      backdateReason: this.requiresBackdateReason() ? this.backdateReason().trim() : undefined,
      records: this.students().map(s => ({
        studentId: s.studentId,
        status: s.status,
        entryType: s.entryType || AttendanceEntryType.REGULAR,
        compensatesForDate: s.compensatesForDate,
        notes: s.notes
      }))
    };

    this.isSubmitting.set(true);
    this.attendanceService.submitAttendance(payload).subscribe({
      next: (response) => {
        this.toastService.success(response.message);
        this.isSubmitting.set(false);
        this.backdateReason.set('');
        this.onBackToBatches();
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to submit attendance';
        this.toastService.error(message);
        this.isSubmitting.set(false);
      }
    });
  }

  onBackdateReasonChange(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.backdateReason.set(input.value);
  }

  showAddMakeupModal(): void {
    // Load all students for the batch (not filtered by day)
    const batchId = this.selectedBatchId();
    if (!batchId) return;

    this.attendanceService.getAllStudentsForBatch(batchId).subscribe({
      next: (allStudents) => {
        // Filter out students already in the attendance list
        const currentStudentIds = new Set(this.students().map(s => s.studentId));
        const availableStudents = allStudents.filter(s => !currentStudentIds.has(s.studentId));
        this.allBatchStudents.set(availableStudents);
        this.makeupSearchQuery.set('');
        this.selectedMakeupStudentId.set(null);
        this.eligibleAbsenceDates.set([]);
        this.selectedCompensatesForDate.set(null);
        this.isLoadingEligibleAbsences.set(false);
        this.showMakeupStudentModal.set(true);
      },
      error: () => {
        this.toastService.error('Failed to load students for makeup');
      }
    });
  }

  addMakeupStudent(student: StudentAttendance, compensatesForDate: string): void {
    // Add the student as a makeup entry
    const makeupStudent: StudentAttendance = {
      ...student,
      entryType: AttendanceEntryType.MAKEUP,
      compensatesForDate,
      status: AttendanceStatus.PRESENT,
      isMarked: false
    };
    
    this.students.update(students => [...students, makeupStudent]);
    this.allBatchStudents.update(students => 
      students.filter(s => s.studentId !== student.studentId)
    );
    this.toastService.info(`Added ${student.studentName} as makeup student`);
  }

  onMakeupSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.makeupSearchQuery.set(input.value);
  }

  selectMakeupStudent(studentId: number): void {
    this.selectedMakeupStudentId.set(studentId);
    this.selectedCompensatesForDate.set(null);
    this.eligibleAbsenceDates.set([]);

    const batchId = this.selectedBatchId();
    if (!batchId) {
      return;
    }

    this.isLoadingEligibleAbsences.set(true);
    this.attendanceService.getEligibleAbsencesForMakeup(studentId, batchId).subscribe({
      next: (absences) => {
        if (this.selectedMakeupStudentId() !== studentId) {
          return;
        }

        const dates = absences
          .map(absence => absence.date)
          .sort((a, b) => b.localeCompare(a));
        this.eligibleAbsenceDates.set(dates);
        this.selectedCompensatesForDate.set(dates.length === 1 ? dates[0] : null);
        this.isLoadingEligibleAbsences.set(false);
      },
      error: () => {
        if (this.selectedMakeupStudentId() !== studentId) {
          return;
        }
        this.isLoadingEligibleAbsences.set(false);
        this.toastService.error('Failed to load eligible absences');
      }
    });
  }

  closeMakeupModal(): void {
    this.showMakeupStudentModal.set(false);
    this.makeupSearchQuery.set('');
    this.selectedMakeupStudentId.set(null);
    this.eligibleAbsenceDates.set([]);
    this.selectedCompensatesForDate.set(null);
    this.isLoadingEligibleAbsences.set(false);
  }

  confirmAddMakeupStudent(): void {
    const studentId = this.selectedMakeupStudentId();
    const compensatesForDate = this.selectedCompensatesForDate();
    if (!studentId) return;

    const student = this.allBatchStudents().find(s => s.studentId === studentId);
    if (!student) {
      this.toastService.error('Selected student is not available');
      return;
    }

    if (!compensatesForDate) {
      this.toastService.error('Please select the missed date being compensated');
      return;
    }

    this.addMakeupStudent(student, compensatesForDate);
    this.closeMakeupModal();
  }

  onCompensatesForDateChange(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedCompensatesForDate.set(input.value || null);
  }

  removeMakeupStudent(studentId: number): void {
    const student = this.students().find(s => s.studentId === studentId);
    if (student?.entryType === AttendanceEntryType.MAKEUP && !student.isMarked) {
      this.students.update(students => 
        students.filter(s => s.studentId !== studentId)
      );
      this.toastService.info('Makeup student removed');
    }
  }

  private getTodayLocalIso(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
