import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [style.borderLeftColor]="accentColor">
      <div class="stat-icon" [style.backgroundColor]="iconBgColor" [style.color]="accentColor">
        <i [class]="icon"></i>
      </div>
      <div class="stat-content">
        <p class="stat-label">{{ label }}</p>
        <div class="stat-value-row">
          <span class="stat-value">{{ value }}</span>
          @if (trend) {
            <span [class]="'stat-trend trend-' + trend">
              <i [class]="trend === 'up' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
              {{ trendValue }}
            </span>
          }
        </div>
        @if (subItems && subItems.length > 0) {
          <div class="stat-sub-items">
            @for (item of subItems; track item.label) {
              <span class="sub-item">
                <span class="sub-label">{{ item.label }}:</span>
                <span class="sub-value">{{ item.value }}</span>
              </span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background-color: var(--white);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--primary-color);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-normal);

      &:hover {
        box-shadow: var(--shadow-md);
      }
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--border-radius-lg);
      background-color: var(--primary-light);
      flex-shrink: 0;

      i {
        font-size: 20px;
      }
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-muted);
      margin: 0 0 4px 0;
    }

    .stat-value-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: var(--font-size-xs);
      font-weight: 500;
      padding: 2px 6px;
      border-radius: var(--border-radius-sm);

      &.trend-up {
        background-color: var(--success-light);
        color: var(--success-color);
      }

      &.trend-down {
        background-color: var(--danger-light);
        color: var(--danger-color);
      }
    }

    .stat-sub-items {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      margin-top: var(--spacing-sm);
    }

    .sub-item {
      font-size: var(--font-size-sm);
    }

    .sub-label {
      color: var(--text-muted);
    }

    .sub-value {
      font-weight: 600;
      color: var(--text-primary);
      margin-left: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) icon!: string;
  @Input() accentColor = 'var(--primary-color)';
  @Input() iconBgColor = 'var(--primary-light)';
  @Input() trend?: 'up' | 'down';
  @Input() trendValue?: string;
  @Input() subItems?: Array<{ label: string; value: string | number }>;
}
