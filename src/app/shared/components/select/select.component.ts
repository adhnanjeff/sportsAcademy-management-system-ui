import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption<T = any> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="select-wrapper" [class.has-error]="error" [class.disabled]="disabled">
      @if (label) {
        <label class="select-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }
      
      <div class="select-container">
        <button 
          type="button" 
          class="select-trigger"
          (click)="toggleDropdown()"
          [disabled]="disabled"
        >
          @if (selectedOption()) {
            <span class="selected-value">
              @if (selectedOption()!.icon) {
                <i [class]="selectedOption()!.icon"></i>
              }
              {{ selectedOption()!.label }}
            </span>
          } @else {
            <span class="placeholder">{{ placeholder }}</span>
          }
          <i class="fa-solid fa-chevron-down dropdown-arrow" [class.open]="isOpen()"></i>
        </button>

        @if (isOpen()) {
          <div class="select-dropdown">
            @if (searchable) {
              <div class="dropdown-search">
                <i class="fa-solid fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search..."
                  [(ngModel)]="searchQuery"
                  (input)="filterOptions()"
                />
              </div>
            }
            <div class="dropdown-list">
              @for (option of filteredOptions(); track option.value) {
                <button 
                  type="button"
                  class="select-option"
                  [class.selected]="option.value === value"
                  [class.disabled]="option.disabled"
                  [disabled]="option.disabled"
                  (click)="selectOption(option)"
                >
                  @if (option.icon) {
                    <i [class]="option.icon"></i>
                  }
                  {{ option.label }}
                  @if (option.value === value) {
                    <i class="fa-solid fa-check check-icon"></i>
                  }
                </button>
              }
              @if (filteredOptions().length === 0) {
                <div class="no-options">No options found</div>
              }
            </div>
          </div>
        }
      </div>
      
      @if (error) {
        <span class="input-error">{{ error }}</span>
      } @else if (hint) {
        <span class="input-hint">{{ hint }}</span>
      }
    </div>
  `,
  styles: [`
    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .select-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
      
      .required {
        color: var(--danger-color);
        margin-left: 2px;
      }
    }

    .select-container {
      position: relative;
    }

    .select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 12px 16px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      cursor: pointer;
      text-align: left;
      transition: all var(--transition-fast);

      &:hover:not(:disabled) {
        border-color: var(--gray-400);
      }

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(0, 84, 254, 0.1);
      }

      &:disabled {
        background-color: var(--gray-100);
        cursor: not-allowed;
      }
    }

    .has-error .select-trigger {
      border-color: var(--danger-color);

      &:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }

    .selected-value {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-base);
      color: var(--text-primary);
    }

    .placeholder {
      color: var(--text-muted);
    }

    .dropdown-arrow {
      font-size: 12px;
      color: var(--text-muted);
      transition: transform var(--transition-fast);

      &.open {
        transform: rotate(180deg);
      }
    }

    .select-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: var(--z-dropdown);
      margin-top: 4px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .dropdown-search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-bottom: 1px solid var(--border-color);

      i {
        color: var(--text-muted);
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: var(--font-size-sm);

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }

    .dropdown-list {
      max-height: 250px;
      overflow-y: auto;
    }

    .select-option {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      font-size: var(--font-size-base);
      color: var(--text-primary);
      transition: background-color var(--transition-fast);

      &:hover:not(:disabled) {
        background-color: var(--gray-50);
      }

      &.selected {
        background-color: var(--primary-light);
        color: var(--primary-color);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .check-icon {
        margin-left: auto;
        font-size: 12px;
      }
    }

    .no-options {
      padding: 16px;
      text-align: center;
      color: var(--text-muted);
      font-size: var(--font-size-sm);
    }

    .input-error {
      font-size: var(--font-size-sm);
      color: var(--danger-color);
    }

    .input-hint {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent<T = any> {
  private readonly elementRef = inject(ElementRef);

  @Input() options: SelectOption<T>[] = [];
  @Input() value?: T;
  @Input() label?: string;
  @Input() placeholder = 'Select an option';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() searchable = false;

  @Output() valueChange = new EventEmitter<T>();

  searchQuery = '';
  isOpen = signal(false);
  filteredOptions = signal<SelectOption<T>[]>([]);

  selectedOption = signal<SelectOption<T> | undefined>(undefined);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.filteredOptions.set(this.options);
    this.updateSelectedOption();
  }

  ngOnChanges(): void {
    this.filteredOptions.set(this.options);
    this.updateSelectedOption();
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen.update(v => !v);
      this.searchQuery = '';
      this.filteredOptions.set(this.options);
    }
  }

  selectOption(option: SelectOption<T>): void {
    if (option.disabled) return;
    
    this.value = option.value;
    this.selectedOption.set(option);
    this.isOpen.set(false);
    this.valueChange.emit(option.value);
  }

  filterOptions(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredOptions.set(
      this.options.filter(o => o.label.toLowerCase().includes(query))
    );
  }

  private updateSelectedOption(): void {
    this.selectedOption.set(
      this.options.find(o => o.value === this.value)
    );
  }
}
