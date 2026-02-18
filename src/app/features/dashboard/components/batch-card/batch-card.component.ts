import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Batch } from '../../../../core/models';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-batch-card',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent],
  template: `
    <div class="batch-card" [routerLink]="['/dashboard/batches', batch.id]">
      <div class="batch-header">
        <h4 class="batch-name">{{ batch.name }}</h4>
        <app-badge 
          [text]="formatSkillLevel(batch.skillLevel)" 
          [variant]="getSkillBadgeVariant(batch.skillLevel)"
          size="sm"
        />
      </div>

      <div class="batch-meta">
        <div class="meta-item">
          <i class="fa-solid fa-users"></i>
          <span>{{ batch.totalStudents }} students</span>
        </div>
      </div>

      <div class="batch-footer">
        <span class="time-info">
          <i class="fa-regular fa-clock"></i>
          {{ batch.startTime }} - {{ batch.endTime }}
        </span>
        <button class="view-details" (click)="onViewDetails($event)">
          View Details
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .batch-card {
      padding: 20px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        box-shadow: var(--shadow-md);
        border-color: var(--primary-color);
        transform: translateY(-2px);

        .view-details {
          color: var(--primary-color);
        }
      }
    }

    .batch-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .batch-name {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .batch-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-sm);
      color: var(--text-muted);

      i {
        width: 16px;
        color: var(--gray-400);
      }
    }

    .batch-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .time-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--font-size-sm);
      color: var(--text-muted);

      i {
        color: var(--gray-400);
      }
    }

    .view-details {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-muted);
      transition: color var(--transition-fast);

      i {
        font-size: 10px;
        transition: transform var(--transition-fast);
      }

      &:hover i {
        transform: translateX(2px);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchCardComponent {
  @Input({ required: true }) batch!: Batch;
  @Output() viewDetails = new EventEmitter<number>();

  onViewDetails(event: MouseEvent): void {
    event.stopPropagation();
    this.viewDetails.emit(this.batch.id);
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
}
