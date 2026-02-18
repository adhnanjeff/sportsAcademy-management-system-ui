import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <i [class]="icon"></i>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      @if (message) {
        <p class="empty-message">{{ message }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
      text-align: center;
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: var(--gray-100);
      margin-bottom: var(--spacing-lg);

      i {
        font-size: 32px;
        color: var(--gray-400);
      }
    }

    .empty-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .empty-message {
      font-size: var(--font-size-base);
      color: var(--text-muted);
      margin: 0 0 var(--spacing-lg) 0;
      max-width: 400px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon = 'fa-regular fa-folder-open';
  @Input({ required: true }) title!: string;
  @Input() message?: string;
}
