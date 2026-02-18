import { Component, ChangeDetectionStrategy, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-wrapper" [class.has-error]="error" [class.disabled]="disabled">
      @if (label) {
        <label [for]="inputId" class="input-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }
      
      <div class="input-container" [class.has-prefix]="prefixIcon" [class.has-suffix]="suffixIcon || type === 'password'">
        @if (prefixIcon) {
          <span class="input-prefix">
            <i [class]="prefixIcon"></i>
          </span>
        }
        
        <input
          [id]="inputId"
          [type]="actualType()"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [value]="value"
          [autocomplete]="autocomplete"
          (input)="onInput($event)"
          (blur)="onTouched()"
          class="input-field"
        />
        
        @if (type === 'password') {
          <button 
            type="button" 
            class="input-suffix toggle-password"
            (click)="togglePassword()"
            tabindex="-1"
          >
            <i [class]="showPassword() ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"></i>
          </button>
        } @else if (suffixIcon) {
          <span class="input-suffix">
            <i [class]="suffixIcon"></i>
          </span>
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
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
      
      .required {
        color: var(--danger-color);
        margin-left: 2px;
      }
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-field {
      width: 100%;
      padding: 12px 16px;
      font-size: var(--font-size-base);
      color: var(--text-primary);
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      transition: all var(--transition-fast);

      &::placeholder {
        color: var(--text-muted);
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

    .has-prefix .input-field {
      padding-left: 44px;
    }

    .has-suffix .input-field {
      padding-right: 44px;
    }

    .input-prefix,
    .input-suffix {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 100%;
      color: var(--text-muted);
      pointer-events: none;
    }

    .input-prefix {
      left: 0;
    }

    .input-suffix {
      right: 0;
    }

    .toggle-password {
      pointer-events: auto;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      
      &:hover {
        color: var(--text-primary);
      }
    }

    .has-error {
      .input-field {
        border-color: var(--danger-color);

        &:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' = 'text';
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() autocomplete = 'off';

  value = '';
  showPassword = signal(false);
  
  private static idCounter = 0;
  inputId = `input-${++InputComponent.idCounter}`;

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  actualType = () => {
    if (this.type === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type;
  };

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
