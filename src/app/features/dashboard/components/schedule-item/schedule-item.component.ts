import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleItem } from '../../../../core/models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-schedule-item',
  standalone: true,
  imports: [CommonModule, ButtonComponent, BadgeComponent],
  template: `
    <div class="schedule-item" [class.completed]="item.isCompleted">
      <div class="schedule-time">
        <span class="time-range">{{ item.startTime }} - {{ item.endTime }}</span>
      </div>
      
      <div class="schedule-info">
        <div class="batch-details">
          <span class="batch-name">{{ item.batchName }}</span>
          <span class="separator">|</span>
          <span class="student-count">{{ item.totalStudents }} Students</span>
          <span class="separator">|</span>
          <span class="court">Court {{ item.courtNumber }}</span>
        </div>
        <app-badge 
          [text]="item.skillLevel" 
          [variant]="getSkillBadgeVariant(item.skillLevel)"
          size="sm"
        />
      </div>

      <div class="schedule-actions">
        @if (item.isCompleted) {
          <span class="completed-badge">
            <i class="fa-solid fa-check"></i>
            Completed
          </span>
        } @else {
          <app-button
            variant="success"
            size="sm"
            icon="fa-solid fa-check"
            (clicked)="onMarkComplete()"
          >
            Mark
          </app-button>
        }
      </div>
    </div>
  `,
  styles: [`
    .schedule-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px 20px;
      background-color: var(--white);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      transition: all var(--transition-fast);

      &:hover {
        box-shadow: var(--shadow-sm);
      }

      &.completed {
        opacity: 0.7;
        background-color: var(--gray-50);

        .batch-name {
          text-decoration: line-through;
          color: var(--text-muted);
        }
      }
    }

    .schedule-time {
      min-width: 140px;

      .time-range {
        font-size: var(--font-size-base);
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .schedule-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .batch-details {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .batch-name {
      font-weight: 600;
      color: var(--primary-color);
    }

    .separator {
      color: var(--gray-300);
    }

    .student-count,
    .court {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .schedule-actions {
      min-width: 100px;
      text-align: right;
    }

    .completed-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background-color: var(--success-light);
      color: var(--success-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-sm);
      font-weight: 500;

      i {
        font-size: 12px;
      }
    }

    @media (max-width: 768px) {
      .schedule-item {
        flex-wrap: wrap;
      }

      .schedule-time {
        min-width: auto;
        order: 1;
      }

      .schedule-info {
        order: 3;
        width: 100%;
        margin-top: 8px;
        flex-wrap: wrap;
      }

      .schedule-actions {
        order: 2;
        margin-left: auto;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleItemComponent {
  @Input({ required: true }) item!: ScheduleItem;
  @Output() markComplete = new EventEmitter<number>();

  onMarkComplete(): void {
    this.markComplete.emit(this.item.id);
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
