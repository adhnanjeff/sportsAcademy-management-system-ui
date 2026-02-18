import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      @if (icon) {
        <i [class]="icon"></i>
      }
      @if (dot) {
        <span class="badge-dot"></span>
      }
      {{ text }}
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      border-radius: var(--border-radius-full);
      white-space: nowrap;
    }

    /* Sizes */
    .badge-sm {
      padding: 2px 8px;
      font-size: 11px;
    }

    .badge-md {
      padding: 4px 12px;
      font-size: var(--font-size-sm);
    }

    /* Variants */
    .badge-primary {
      background-color: var(--primary-light);
      color: var(--primary-color);
    }

    .badge-success {
      background-color: var(--success-light);
      color: var(--success-color);
    }

    .badge-warning {
      background-color: var(--warning-light);
      color: #92400e;
    }

    .badge-danger {
      background-color: var(--danger-light);
      color: var(--danger-color);
    }

    .badge-info {
      background-color: var(--info-light);
      color: var(--info-color);
    }

    .badge-neutral {
      background-color: var(--gray-100);
      color: var(--gray-600);
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    i {
      font-size: 10px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  @Input() text = '';
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: BadgeSize = 'md';
  @Input() icon?: string;
  @Input() dot = false;

  get badgeClasses(): string {
    return `badge-${this.variant} badge-${this.size}`;
  }
}
