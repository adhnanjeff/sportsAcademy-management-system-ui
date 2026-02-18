import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'button';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton"
      [class]="'skeleton-' + variant"
      [style.width]="width"
      [style.height]="height"
      [style.borderRadius]="borderRadius"
    >
      @if (variant === 'card') {
        <div class="skeleton-card-content">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line" style="width: 80%"></div>
            <div class="skeleton-line" style="width: 60%"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--gray-200) 25%,
        var(--gray-100) 50%,
        var(--gray-200) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite ease-in-out;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .skeleton-text {
      height: 16px;
      border-radius: 4px;
      width: 100%;
    }

    .skeleton-circular {
      border-radius: 50%;
    }

    .skeleton-rectangular {
      border-radius: var(--border-radius);
    }

    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(
        90deg,
        var(--gray-300) 25%,
        var(--gray-200) 50%,
        var(--gray-300) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite ease-in-out;
    }

    .skeleton-button {
      height: 40px;
      border-radius: var(--border-radius);
      width: 120px;
    }

    .skeleton-card {
      border-radius: var(--border-radius-lg);
      padding: 16px;
      min-height: 120px;
    }

    .skeleton-card-content {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skeleton-line {
      height: 12px;
      border-radius: 4px;
      background: linear-gradient(
        90deg,
        var(--gray-300) 25%,
        var(--gray-200) 50%,
        var(--gray-300) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite ease-in-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() borderRadius?: string;
}
