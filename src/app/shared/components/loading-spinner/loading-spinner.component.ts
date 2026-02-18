import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'spinner-wrapper spinner-' + size">
      <div class="spinner"></div>
      @if (text) {
        <span class="spinner-text">{{ text }}</span>
      }
    </div>
  `,
  styles: [`
    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }

    .spinner {
      border: 3px solid var(--gray-200);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner-sm .spinner {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }

    .spinner-md .spinner {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }

    .spinner-lg .spinner {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }

    .spinner-text {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text?: string;
}
