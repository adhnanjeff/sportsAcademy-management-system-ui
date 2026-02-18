import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuickAction } from '../../../../core/models';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="quick-actions">
      @for (action of actions; track action.id) {
        @if (action.route) {
          <a 
            [routerLink]="action.route"
            class="action-btn"
            [style.--action-color]="action.color || 'var(--primary-color)'"
          >
            <i [class]="action.icon"></i>
            <span>{{ action.label }}</span>
          </a>
        } @else {
          <button
            class="action-btn"
            [style.--action-color]="action.color || 'var(--primary-color)'"
            (click)="onActionClick(action)"
          >
            <i [class]="action.icon"></i>
            <span>{{ action.label }}</span>
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      @media (max-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
      text-decoration: none;
      transition: all var(--transition-fast);
      cursor: pointer;

      &:hover {
        border-color: var(--action-color);
        background-color: color-mix(in srgb, var(--action-color) 8%, transparent);
        
        i {
          color: var(--action-color);
        }
      }

      i {
        font-size: 16px;
        color: var(--text-muted);
        transition: color var(--transition-fast);
      }

      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsComponent {
  @Input() actions: QuickAction[] = [
    { id: 'attendance', label: 'Mark Attendance', icon: 'fa-solid fa-clipboard-check', route: '/dashboard/attendance/mark', color: 'var(--primary-color)' },
    { id: 'attendance-report', label: 'Attendance Report', icon: 'fa-regular fa-calendar-check', route: '/dashboard/attendance/history', color: 'var(--info-color)' },
    { id: 'student-new', label: 'Add Student', icon: 'fa-solid fa-user-plus', route: '/dashboard/students/new', color: 'var(--success-color)' },
    { id: 'batch-new', label: 'Create Batch', icon: 'fa-solid fa-layer-group', route: '/dashboard/batches/new', color: 'var(--warning-color)' },
    { id: 'students', label: 'Manage Students', icon: 'fa-solid fa-users', route: '/dashboard/students', color: 'var(--secondary-color)' },
    { id: 'achievements', label: 'Achievements', icon: 'fa-solid fa-trophy', route: '/dashboard/achievements', color: 'var(--primary-color)' }
  ];

  @Output() actionClicked = new EventEmitter<QuickAction>();

  onActionClick(action: QuickAction): void {
    this.actionClicked.emit(action);
  }
}
