import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityItem } from '../../../../core/models';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-feed">
      @for (activity of activities; track activity.id) {
        <div class="activity-item">
          <div class="activity-icon" [style.backgroundColor]="getIconBg(activity.iconColor)" [style.color]="activity.iconColor">
            <i [class]="activity.icon || 'fa-solid fa-bell'"></i>
          </div>
          <div class="activity-content">
            <p class="activity-text">
              <span class="activity-title">{{ activity.title }}</span>
              @if (activity.description) {
                - {{ activity.description }}
              }
            </p>
            <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
          </div>
        </div>
      } @empty {
        <div class="no-activity">
          <i class="fa-regular fa-bell-slash"></i>
          <p>No recent activity</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .activity-feed {
      display: flex;
      flex-direction: column;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-of-type {
        border-bottom: none;
      }
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background-color: var(--gray-100);

      i {
        font-size: 14px;
      }
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-text {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0 0 4px 0;
      line-height: 1.4;
    }

    .activity-title {
      font-weight: 600;
      color: var(--text-primary);
    }

    .activity-time {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .no-activity {
      padding: 40px 20px;
      text-align: center;

      i {
        font-size: 32px;
        color: var(--gray-300);
        margin-bottom: 12px;
        display: block;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFeedComponent {
  @Input() activities: ActivityItem[] = [];

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  getIconBg(color?: string): string {
    if (!color) return 'var(--gray-100)';
    // Create a lighter version of the color
    if (color.includes('success')) return 'var(--success-light)';
    if (color.includes('primary')) return 'var(--primary-light)';
    if (color.includes('warning')) return 'var(--warning-light)';
    if (color.includes('danger')) return 'var(--danger-light)';
    if (color.includes('info')) return 'var(--info-light)';
    return 'var(--gray-100)';
  }
}
