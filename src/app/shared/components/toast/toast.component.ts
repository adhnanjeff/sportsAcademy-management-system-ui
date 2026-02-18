import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="'toast toast-' + toast.type" (click)="dismiss(toast.id)">
          <div class="toast-icon">
            <i [class]="getIcon(toast.type)"></i>
          </div>
          <div class="toast-content">
            <p class="toast-title">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="toast-message">{{ toast.message }}</p>
            }
          </div>
          <button class="toast-close" (click)="dismiss(toast.id); $event.stopPropagation()">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: var(--spacing-lg);
      right: var(--spacing-lg);
      z-index: var(--z-tooltip);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: var(--white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
      border-left: 4px solid;
      cursor: pointer;
      animation: slideIn 0.3s ease;

      &:hover {
        .toast-close {
          opacity: 1;
        }
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      border-left-color: var(--success-color);
      
      .toast-icon {
        color: var(--success-color);
        background-color: var(--success-light);
      }
    }

    .toast-error {
      border-left-color: var(--danger-color);
      
      .toast-icon {
        color: var(--danger-color);
        background-color: var(--danger-light);
      }
    }

    .toast-warning {
      border-left-color: var(--warning-color);
      
      .toast-icon {
        color: var(--warning-color);
        background-color: var(--warning-light);
      }
    }

    .toast-info {
      border-left-color: var(--info-color);
      
      .toast-icon {
        color: var(--info-color);
        background-color: var(--info-light);
      }
    }

    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;

      i {
        font-size: 14px;
      }
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .toast-message {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
      margin: 4px 0 0 0;
    }

    .toast-close {
      opacity: 0;
      padding: 4px;
      color: var(--text-muted);
      transition: all var(--transition-fast);

      &:hover {
        color: var(--text-primary);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  dismiss(id: number): void {
    this.toastService.remove(id);
  }

  getIcon(type: ToastMessage['type']): string {
    const icons: Record<ToastMessage['type'], string> = {
      success: 'fa-solid fa-check',
      error: 'fa-solid fa-xmark',
      warning: 'fa-solid fa-exclamation',
      info: 'fa-solid fa-info'
    };
    return icons[type];
  }
}
