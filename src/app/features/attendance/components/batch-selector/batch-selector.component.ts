import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceBatch } from '../../services/attendance.service';

@Component({
  selector: 'app-batch-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="batch-selector">
      <label class="selector-label">Select Batch</label>
      <div class="batch-list">
        @for (batch of batches; track batch.id) {
          <button
            class="batch-item"
            [class.selected]="selectedBatchId === batch.id"
            (click)="onSelect(batch.id)"
          >
            <div class="batch-info">
              <span class="batch-name">{{ batch.name }}</span>
              <span class="batch-time">{{ batch.startTime }} - {{ batch.endTime }}</span>
            </div>
            <div class="batch-meta">
              <span class="student-count">{{ batch.totalStudents }} students</span>
              <span class="skill-badge" [class]="'skill-' + batch.skillLevel.toLowerCase()">
                {{ formatSkillLevel(batch.skillLevel) }}
              </span>
            </div>
            @if (selectedBatchId === batch.id) {
              <div class="selected-indicator">
                <i class="fa-solid fa-check"></i>
              </div>
            }
          </button>
        } @empty {
          <div class="no-batches">
            <i class="fa-regular fa-folder-open"></i>
            <p>No batches available</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .batch-selector {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .selector-label {
      font-weight: 600;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }

    .batch-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .batch-item {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      background-color: var(--white);
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      text-align: left;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-color);
        box-shadow: var(--shadow-sm);
      }

      &.selected {
        border-color: var(--primary-color);
        background-color: var(--primary-light);
      }
    }

    .batch-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .batch-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .batch-time {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .batch-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .student-count {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .skill-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: var(--font-size-xs);
      font-weight: 500;

      &.skill-beginner {
        background-color: var(--success-light);
        color: var(--success-color);
      }

      &.skill-intermediate {
        background-color: var(--primary-light);
        color: var(--primary-color);
      }

      &.skill-advanced {
        background-color: var(--warning-light);
        color: var(--warning-color);
      }

      &.skill-professional {
        background-color: var(--danger-light);
        color: var(--danger-color);
      }
    }

    .selected-indicator {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: var(--white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .no-batches {
      grid-column: 1 / -1;
      padding: 40px;
      text-align: center;

      i {
        font-size: 48px;
        color: var(--gray-300);
        margin-bottom: 12px;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchSelectorComponent {
  @Input() batches: AttendanceBatch[] = [];
  @Input() selectedBatchId: number | null = null;
  @Output() batchSelect = new EventEmitter<number>();

  onSelect(batchId: number): void {
    this.batchSelect.emit(batchId);
  }

  formatSkillLevel(level: string): string {
    return level.charAt(0) + level.slice(1).toLowerCase();
  }
}
