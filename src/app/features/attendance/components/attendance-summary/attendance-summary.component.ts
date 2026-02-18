import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAttendance } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="attendance-summary">
      <div class="summary-item total">
        <span class="summary-label">Total</span>
        <span class="summary-value">{{ students.length }}</span>
      </div>
      <div class="summary-item present">
        <span class="summary-label">Present</span>
        <span class="summary-value">{{ presentCount }}</span>
      </div>
      <div class="summary-item late">
        <span class="summary-label">Late</span>
        <span class="summary-value">{{ lateCount }}</span>
      </div>
      <div class="summary-item absent">
        <span class="summary-label">Absent</span>
        <span class="summary-value">{{ absentCount }}</span>
      </div>
      <div class="summary-item percentage">
        <span class="summary-label">Attendance</span>
        <span class="summary-value">{{ attendancePercentage }}%</span>
      </div>
    </div>
  `,
  styles: [`
    .attendance-summary {
      display: flex;
      gap: 16px;
      padding: 16px 20px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      flex-wrap: wrap;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 20px;
      border-radius: var(--border-radius);
      min-width: 80px;

      &.total {
        background-color: var(--gray-100);
      }

      &.present {
        background-color: var(--success-light);

        .summary-value {
          color: var(--success-color);
        }
      }

      &.late {
        background-color: var(--warning-light);

        .summary-value {
          color: var(--warning-color);
        }
      }

      &.absent {
        background-color: var(--danger-light);

        .summary-value {
          color: var(--danger-color);
        }
      }

      &.percentage {
        background-color: var(--primary-light);
        margin-left: auto;

        .summary-value {
          color: var(--primary-color);
        }
      }
    }

    .summary-label {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    @media (max-width: 640px) {
      .attendance-summary {
        justify-content: space-between;
      }

      .summary-item {
        flex: 1;
        min-width: calc(50% - 8px);
        padding: 10px 12px;

        &.percentage {
          margin-left: 0;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceSummaryComponent {
  @Input() students: StudentAttendance[] = [];

  get presentCount(): number {
    return this.students.filter(s => s.status === 'PRESENT').length;
  }

  get lateCount(): number {
    return this.students.filter(s => s.status === 'LATE').length;
  }

  get absentCount(): number {
    return this.students.filter(s => s.status === 'ABSENT').length;
  }

  get attendancePercentage(): number {
    if (this.students.length === 0) return 0;
    const attended = this.presentCount + this.lateCount;
    return Math.round((attended / this.students.length) * 100);
  }
}
