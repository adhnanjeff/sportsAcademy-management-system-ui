import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentAttendance } from '../../services/attendance.service';
import { AttendanceStatus } from '../../../../core/models';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-attendance-card',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div class="attendance-card" [class]="'status-' + student.status.toString().toLowerCase()" [class.disabled]="disabled">
      <div class="student-info">
        <app-avatar 
          [name]="student.studentName"
          [src]="student.profileImage"
          size="md"
        />
        <div class="student-details">
          <span class="student-name">{{ student.studentName }}</span>
          @if (student.checkInTime) {
            <span class="check-in-time">
              <i class="fa-regular fa-clock"></i>
              {{ student.checkInTime }}
            </span>
          }
        </div>
      </div>

      <div class="status-buttons">
        <button
          class="status-btn present"
          [class.active]="student.status === AttendanceStatus.PRESENT"
          [disabled]="disabled"
          (click)="onStatusChange(AttendanceStatus.PRESENT)"
          title="Present"
        >
          <i class="fa-solid fa-check"></i>
        </button>
        <button
          class="status-btn late"
          [class.active]="student.status === AttendanceStatus.LATE"
          [disabled]="disabled"
          (click)="onStatusChange(AttendanceStatus.LATE)"
          title="Late"
        >
          <i class="fa-solid fa-clock"></i>
        </button>
        <button
          class="status-btn absent"
          [class.active]="student.status === AttendanceStatus.ABSENT"
          [disabled]="disabled"
          (click)="onStatusChange(AttendanceStatus.ABSENT)"
          title="Absent"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      @if (showNotes) {
        <div class="notes-section">
          <input
            type="text"
            class="notes-input"
            placeholder="Add note (optional)"
            [disabled]="disabled"
            [value]="student.notes || ''"
            (input)="onNotesChange($event)"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .attendance-card {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background-color: var(--white);
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      transition: all var(--transition-fast);

      &:hover {
        box-shadow: var(--shadow-sm);
      }

      &.disabled {
        opacity: 0.75;
      }

      &.status-present {
        border-color: var(--success-color);
        background-color: color-mix(in srgb, var(--success-color) 5%, var(--white));
      }

      &.status-late {
        border-color: var(--warning-color);
        background-color: color-mix(in srgb, var(--warning-color) 5%, var(--white));
      }

      &.status-absent {
        border-color: var(--danger-color);
        background-color: color-mix(in srgb, var(--danger-color) 5%, var(--white));
      }
    }

    .student-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
    }

    .student-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .student-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .check-in-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-xs);
      color: var(--text-muted);

      i {
        font-size: 10px;
      }
    }

    .status-buttons {
      display: flex;
      gap: 8px;
    }

    .status-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      border: 2px solid transparent;
      background-color: var(--gray-100);
      color: var(--gray-400);
      transition: all var(--transition-fast);
      cursor: pointer;

      &:hover {
        transform: scale(1.1);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
        transform: none;
      }

      &.present {
        &:hover, &.active {
          background-color: var(--success-color);
          border-color: var(--success-color);
          color: var(--white);
        }
      }

      &.late {
        &:hover, &.active {
          background-color: var(--warning-color);
          border-color: var(--warning-color);
          color: var(--white);
        }
      }

      &.absent {
        &:hover, &.active {
          background-color: var(--danger-color);
          border-color: var(--danger-color);
          color: var(--white);
        }
      }
    }

    .notes-section {
      width: 100%;
      margin-top: 8px;
    }

    .notes-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-sm);
      background-color: var(--gray-50);
      transition: all var(--transition-fast);

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        background-color: var(--white);
      }

      &::placeholder {
        color: var(--text-muted);
      }
    }

    @media (max-width: 640px) {
      .attendance-card {
        flex-direction: column;
        align-items: stretch;
      }

      .student-info {
        min-width: auto;
      }

      .status-buttons {
        justify-content: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceCardComponent {
  @Input({ required: true }) student!: StudentAttendance;
  @Input() showNotes = false;
  @Input() disabled = false;
  @Output() statusChange = new EventEmitter<{ studentId: number; status: AttendanceStatus }>();
  @Output() notesChange = new EventEmitter<{ studentId: number; notes: string }>();

  // Expose enum to template
  readonly AttendanceStatus = AttendanceStatus;

  onStatusChange(status: AttendanceStatus): void {
    if (this.disabled) return;
    this.statusChange.emit({ studentId: this.student.studentId, status });
  }

  onNotesChange(event: Event): void {
    if (this.disabled) return;
    const input = event.target as HTMLInputElement;
    this.notesChange.emit({ studentId: this.student.studentId, notes: input.value });
  }
}
