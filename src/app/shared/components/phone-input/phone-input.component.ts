import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, computed, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="phone-input-wrapper" [class.has-error]="error" [class.disabled]="disabled">
      @if (label) {
        <label class="input-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }
      
      <div class="phone-input-container">
        <button 
          type="button" 
          class="country-selector"
          (click)="toggleDropdown()"
          [disabled]="disabled"
        >
          <span class="country-flag">{{ selectedCountry().flag }}</span>
          <span class="country-code">{{ selectedCountry().dialCode }}</span>
          <i class="fa-solid fa-chevron-down dropdown-arrow" [class.open]="isOpen()"></i>
        </button>

        @if (isOpen()) {
          <div class="country-dropdown">
            <div class="dropdown-search">
              <i class="fa-solid fa-search"></i>
              <input 
                type="text" 
                placeholder="Search country..."
                [(ngModel)]="searchQuery"
                (input)="filterCountries()"
              />
            </div>
            <div class="dropdown-list">
              @for (country of filteredCountries(); track country.code) {
                <button 
                  type="button"
                  class="country-option"
                  [class.selected]="country.code === selectedCountry().code"
                  (click)="selectCountry(country)"
                >
                  <span class="country-flag">{{ country.flag }}</span>
                  <span class="country-name">{{ country.name }}</span>
                  <span class="country-dial">{{ country.dialCode }}</span>
                </button>
              }
            </div>
          </div>
        }

        <input
          type="tel"
          class="phone-number-input"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="phoneNumber"
          (input)="onPhoneInput($event)"
          (blur)="onTouched()"
        />
      </div>
      
      @if (error) {
        <span class="input-error">{{ error }}</span>
      } @else if (hint) {
        <span class="input-hint">{{ hint }}</span>
      }
    </div>
  `,
  styles: [`
    .phone-input-wrapper {
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

    .phone-input-container {
      position: relative;
      display: flex;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      overflow: visible;
      transition: all var(--transition-fast);

      &:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(0, 84, 254, 0.1);
      }
    }

    .has-error .phone-input-container {
      border-color: var(--danger-color);

      &:focus-within {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }

    .country-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px;
      background-color: var(--gray-50);
      border: none;
      border-right: 1px solid var(--border-color);
      cursor: pointer;
      transition: background-color var(--transition-fast);

      &:hover:not(:disabled) {
        background-color: var(--gray-100);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .country-flag {
      font-size: 20px;
      line-height: 1;
    }

    .country-code {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .dropdown-arrow {
      font-size: 10px;
      color: var(--text-muted);
      transition: transform var(--transition-fast);

      &.open {
        transform: rotate(180deg);
      }
    }

    .country-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: var(--z-dropdown);
      width: 300px;
      max-height: 350px;
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
      max-height: 280px;
      overflow-y: auto;
    }

    .country-option {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background-color var(--transition-fast);

      &:hover {
        background-color: var(--gray-50);
      }

      &.selected {
        background-color: var(--primary-light);
      }
    }

    .country-name {
      flex: 1;
      font-size: var(--font-size-sm);
      color: var(--text-primary);
    }

    .country-dial {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .phone-number-input {
      flex: 1;
      padding: 12px 16px;
      border: none;
      outline: none;
      font-size: var(--font-size-base);
      color: var(--text-primary);

      &::placeholder {
        color: var(--text-muted);
      }

      &:disabled {
        background-color: var(--gray-100);
        cursor: not-allowed;
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhoneInputComponent {
  private readonly elementRef = inject(ElementRef);

  @Input() label?: string;
  @Input() placeholder = 'Enter phone number';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() disabled = false;
  @Input() required = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() countryChange = new EventEmitter<Country>();

  phoneNumber = '';
  searchQuery = '';
  isOpen = signal(false);
  
  readonly countries: Country[] = [
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
    { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
    { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
    { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
    { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
    { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
    { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
    { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
    { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  ];

  selectedCountry = signal<Country>(this.countries[0]);
  filteredCountries = signal<Country[]>(this.countries);

  onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen.update(v => !v);
      this.searchQuery = '';
      this.filteredCountries.set(this.countries);
    }
  }

  selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.isOpen.set(false);
    this.countryChange.emit(country);
    this.emitValue();
  }

  filterCountries(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredCountries.set(
      this.countries.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.dialCode.includes(query)
      )
    );
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove non-numeric characters except for formatting
    this.phoneNumber = input.value.replace(/[^\d\s-]/g, '');
    this.emitValue();
  }

  private emitValue(): void {
    const fullNumber = `${this.selectedCountry().dialCode}${this.phoneNumber.replace(/\s|-/g, '')}`;
    this.valueChange.emit(fullNumber);
  }

  // For use with forms
  setPhoneNumber(value: string): void {
    // Try to parse existing number with country code
    for (const country of this.countries) {
      if (value.startsWith(country.dialCode)) {
        this.selectedCountry.set(country);
        this.phoneNumber = value.substring(country.dialCode.length);
        return;
      }
    }
    this.phoneNumber = value;
  }

  getFullNumber(): string {
    return `${this.selectedCountry().dialCode}${this.phoneNumber.replace(/\s|-/g, '')}`;
  }
}
