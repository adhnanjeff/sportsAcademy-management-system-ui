import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <span class="spinner"></span>
      }
      @if (icon && !loading) {
        <i [class]="icon"></i>
      }
      @if (label) {
        <span class="btn-label">{{ label }}</span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 500;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      border: 1px solid transparent;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }

    /* Sizes */
    .btn-sm {
      padding: 6px 12px;
      font-size: var(--font-size-sm);
    }

    .btn-md {
      padding: 10px 20px;
      font-size: var(--font-size-base);
    }

    .btn-lg {
      padding: 14px 28px;
      font-size: var(--font-size-lg);
    }

    /* Variants */
    .btn-primary {
      background-color: var(--primary-color);
      color: white;
      border-color: var(--primary-color);

      &:hover:not(:disabled) {
        background-color: var(--primary-dark);
        border-color: var(--primary-dark);
      }
    }

    .btn-secondary {
      background-color: var(--gray-600);
      color: white;
      border-color: var(--gray-600);

      &:hover:not(:disabled) {
        background-color: var(--gray-700);
        border-color: var(--gray-700);
      }
    }

    .btn-success {
      background-color: var(--success-color);
      color: white;
      border-color: var(--success-color);

      &:hover:not(:disabled) {
        background-color: #059669;
        border-color: #059669;
      }
    }

    .btn-danger {
      background-color: var(--danger-color);
      color: white;
      border-color: var(--danger-color);

      &:hover:not(:disabled) {
        background-color: #dc2626;
        border-color: #dc2626;
      }
    }

    .btn-warning {
      background-color: var(--warning-color);
      color: white;
      border-color: var(--warning-color);

      &:hover:not(:disabled) {
        background-color: #d97706;
        border-color: #d97706;
      }
    }

    .btn-outline {
      background-color: transparent;
      color: var(--primary-color);
      border-color: var(--primary-color);

      &:hover:not(:disabled) {
        background-color: var(--primary-light);
      }
    }

    .btn-ghost {
      background-color: transparent;
      color: var(--text-primary);
      border-color: transparent;

      &:hover:not(:disabled) {
        background-color: var(--gray-100);
      }
    }

    .btn-full-width {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon?: string;
  @Input() label?: string;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = [
      `btn-${this.variant}`,
      `btn-${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('btn-full-width');
    }

    return classes.join(' ');
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
