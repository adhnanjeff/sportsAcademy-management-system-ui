import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModalConfig {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  closeOnBackdrop?: boolean;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick()">
        <div 
          [class]="'modal-container modal-' + modalSize" 
          (click)="$event.stopPropagation()"
        >
          @if (modalTitle || isClosable) {
            <div class="modal-header">
              @if (modalTitle) {
                <h3 class="modal-title">{{ modalTitle }}</h3>
              }
              @if (isClosable) {
                <button class="modal-close" (click)="closeModal()">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              }
            </div>
          }
          
          <div class="modal-body">
            <ng-content></ng-content>
          </div>
          
          <div class="modal-footer">
            <ng-content select="[modal-footer], [slot='footer']"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: var(--z-modal-backdrop);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-lg);
      background-color: rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background-color: var(--white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-xl);
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-sm { width: 400px; }
    .modal-md { width: 500px; }
    .modal-lg { width: 700px; }
    .modal-xl { width: 900px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
    }

    .modal-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .modal-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius);
      color: var(--text-muted);
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--gray-100);
        color: var(--text-primary);
      }
    }

    .modal-body {
      flex: 1;
      padding: var(--spacing-lg);
      overflow-y: auto;
    }

    .modal-footer {
      padding: var(--spacing-md) var(--spacing-lg);
      border-top: 1px solid var(--border-color);
      background-color: var(--gray-50);

      &:empty {
        display: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements OnDestroy {
  @Input() config: ModalConfig = {
    size: 'md',
    closable: true,
    closeOnBackdrop: true
  };
  @Input() title = '';
  @Input() size: ModalConfig['size'] = 'md';
  @Input() closable = true;
  @Input() closeOnBackdrop = true;

  private _isOpen = false;
  @Input()
  get isOpen(): boolean {
    return this._isOpen;
  }
  set isOpen(value: boolean) {
    this._isOpen = value;
    document.body.style.overflow = value ? 'hidden' : '';
  }

  @Output() close = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  get modalTitle(): string | undefined {
    return this.title || this.config.title;
  }

  get modalSize(): NonNullable<ModalConfig['size']> {
    return this.size || this.config.size || 'md';
  }

  get isClosable(): boolean {
    return this.closable ?? this.config.closable ?? true;
  }

  get canCloseOnBackdrop(): boolean {
    return this.closeOnBackdrop ?? this.config.closeOnBackdrop ?? true;
  }

  open(): void {
    this.isOpen = true;
  }

  closeModal(): void {
    this.isOpen = false;
    document.body.style.overflow = '';
    this.close.emit();
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.canCloseOnBackdrop) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.isClosable) {
      this.closeModal();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
