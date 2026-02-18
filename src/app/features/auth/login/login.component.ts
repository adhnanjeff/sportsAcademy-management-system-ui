import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { PhoneInputComponent, Country } from '../../../shared/components/phone-input/phone-input.component';

type LoginMethod = 'email' | 'phone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    InputComponent,
    PhoneInputComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // State signals
  loginMethod = signal<LoginMethod>('email');
  isLoading = signal(false);
  otpSent = signal(false);
  phoneNumber = signal('');
  phoneError = signal('');
  otpError = signal('');
  otp = signal('');
  resendTimer = signal(0);
  selectedCountry = signal<Country | null>(null);

  // Email Form
  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  // Phone Form
  phoneForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required]]
  });

  private resendInterval?: ReturnType<typeof setInterval>;

  switchMethod(method: LoginMethod): void {
    this.loginMethod.set(method);
    this.resetOtp();
  }

  onPhoneChange(phone: string): void {
    this.phoneNumber.set(phone);
    this.phoneError.set('');
  }

  onCountryChange(country: Country): void {
    this.selectedCountry.set(country);
  }

  isPhoneValid(): boolean {
    const phone = this.phoneNumber();
    // Basic validation - at least 10 digits after country code
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  }

  onEmailLogin(): void {
    if (this.emailForm.invalid) return;

    this.isLoading.set(true);
    const { email, password } = this.emailForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.toastService.success('Welcome back!', 'You have successfully logged in.');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastService.error('Login Failed', error.error?.message || 'Invalid credentials');
      }
    });
  }

  onPhoneLogin(): void {
    if (!this.otpSent()) {
      this.requestOtp();
    } else {
      this.verifyOtp();
    }
  }

  requestOtp(): void {
    if (!this.isPhoneValid()) {
      this.phoneError.set('Please enter a valid phone number');
      return;
    }

    this.isLoading.set(true);
    this.authService.requestOtp({ phoneNumber: this.phoneNumber() }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.otpSent.set(true);
          this.startResendTimer();
          this.toastService.success('OTP Sent', 'Please check your phone for the verification code.');
        } else {
          this.phoneError.set(response.message);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.phoneError.set(error.error?.message || 'Failed to send OTP');
      }
    });
  }

  verifyOtp(): void {
    if (this.otp().length !== 6) return;

    this.isLoading.set(true);
    this.authService.verifyOtp({
      phoneNumber: this.phoneNumber(),
      otp: this.otp()
    }).subscribe({
      next: () => {
        this.toastService.success('Welcome back!', 'You have successfully logged in.');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.otpError.set(error.error?.message || 'Invalid OTP');
      }
    });
  }

  resendOtp(): void {
    this.requestOtp();
  }

  resetOtp(): void {
    this.otpSent.set(false);
    this.otp.set('');
    this.otpError.set('');
    this.resendTimer.set(0);
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    this.updateOtpValue();
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && index > 0) {
      const input = event.target as HTMLInputElement;
      if (!input.value) {
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '').substring(0, 6);
    
    digits.split('').forEach((digit, i) => {
      const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (input) {
        input.value = digit;
      }
    });

    this.updateOtpValue();
  }

  private updateOtpValue(): void {
    let otp = '';
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
      otp += input?.value || '';
    }
    this.otp.set(otp);
    this.otpError.set('');
  }

  private startResendTimer(): void {
    this.resendTimer.set(60);
    this.resendInterval = setInterval(() => {
      this.resendTimer.update(v => {
        if (v <= 1) {
          clearInterval(this.resendInterval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  getError(field: string): string {
    const control = this.emailForm.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) return 'Password must be at least 6 characters';
    }
    return '';
  }
}
