import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Role, OtpChannel } from '../../../core/models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

type SignupStep = 'account' | 'personal' | 'verify';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    InputComponent,
    PhoneInputComponent
  ],
  template: `
    <div class="signup-container">
      <div class="signup-card">
        <!-- Logo & Title -->
        <div class="signup-header">
          <div class="logo">
            <i class="fa-solid fa-shuttlecock"></i>
          </div>
          <h1>Create Account</h1>
          <p>Join Badminton Academy today</p>
        </div>

        <!-- Progress Steps -->
        <div class="progress-steps">
          <div class="step" [class.active]="currentStep() === 'account'" [class.completed]="isStepCompleted('account')">
            <div class="step-number">
              @if (isStepCompleted('account')) {
                <i class="fa-solid fa-check"></i>
              } @else {
                1
              }
            </div>
            <span>Account</span>
          </div>
          <div class="step-line" [class.active]="currentStep() !== 'account'"></div>
          <div class="step" [class.active]="currentStep() === 'personal'" [class.completed]="isStepCompleted('personal')">
            <div class="step-number">
              @if (isStepCompleted('personal')) {
                <i class="fa-solid fa-check"></i>
              } @else {
                2
              }
            </div>
            <span>Personal</span>
          </div>
          <div class="step-line" [class.active]="currentStep() === 'verify'"></div>
          <div class="step" [class.active]="currentStep() === 'verify'">
            <div class="step-number">3</div>
            <span>Verify</span>
          </div>
        </div>

        <!-- Account Step -->
        @if (currentStep() === 'account') {
          <form [formGroup]="accountForm" (ngSubmit)="nextStep()">
            <div class="form-group">
              <app-input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                prefixIcon="fa-regular fa-envelope"
                formControlName="email"
                [required]="true"
                [error]="getError(accountForm, 'email')"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <app-input
                  type="password"
                  label="Password"
                  placeholder="Create password"
                  prefixIcon="fa-solid fa-lock"
                  formControlName="password"
                  [required]="true"
                  [error]="getError(accountForm, 'password')"
                />
              </div>
              <div class="form-group">
                <app-input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm password"
                  prefixIcon="fa-solid fa-lock"
                  formControlName="confirmPassword"
                  [required]="true"
                  [error]="getError(accountForm, 'confirmPassword')"
                />
              </div>
            </div>

            <!-- Password Requirements -->
            <div class="password-requirements">
              <p class="requirements-title">Password must contain:</p>
              <ul>
                <li [class.valid]="hasMinLength()">
                  <i [class]="hasMinLength() ? 'fa-solid fa-check' : 'fa-regular fa-circle'"></i>
                  At least 8 characters
                </li>
                <li [class.valid]="hasUppercase()">
                  <i [class]="hasUppercase() ? 'fa-solid fa-check' : 'fa-regular fa-circle'"></i>
                  One uppercase letter
                </li>
                <li [class.valid]="hasNumber()">
                  <i [class]="hasNumber() ? 'fa-solid fa-check' : 'fa-regular fa-circle'"></i>
                  One number
                </li>
              </ul>
            </div>

            <app-button
              type="submit"
              variant="primary"
              [fullWidth]="true"
              [disabled]="accountForm.invalid"
            >
              Continue
              <i class="fa-solid fa-arrow-right"></i>
            </app-button>
          </form>
        }

        <!-- Personal Step -->
        @if (currentStep() === 'personal') {
          <form [formGroup]="personalForm" (ngSubmit)="nextStep()">
            <div class="form-row">
              <div class="form-group">
                <app-input
                  type="text"
                  label="First Name"
                  placeholder="Enter first name"
                  prefixIcon="fa-regular fa-user"
                  formControlName="firstName"
                  [required]="true"
                  [error]="getError(personalForm, 'firstName')"
                />
              </div>
              <div class="form-group">
                <app-input
                  type="text"
                  label="Last Name"
                  placeholder="Enter last name"
                  prefixIcon="fa-regular fa-user"
                  formControlName="lastName"
                  [required]="false"
                  [error]="getError(personalForm, 'lastName')"
                />
              </div>
            </div>

            <div class="form-group">
              <app-input
                type="text"
                label="National ID Number"
                placeholder="Enter national ID"
                prefixIcon="fa-regular fa-id-card"
                formControlName="nationalIdNumber"
                [required]="true"
                [error]="getError(personalForm, 'nationalIdNumber')"
              />
            </div>

            <div class="form-group">
              <app-phone-input
                label="Phone Number"
                placeholder="Enter phone number"
                [required]="true"
                [error]="phoneError()"
                (valueChange)="onPhoneChange($event)"
              />
            </div>

            <div class="form-group">
              <app-input
                type="text"
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                prefixIcon="fa-regular fa-calendar"
                formControlName="dateOfBirth"
                [required]="false"
                [error]="getError(personalForm, 'dateOfBirth')"
              />
            </div>

            <div class="form-actions">
              <app-button
                type="button"
                variant="ghost"
                (clicked)="prevStep()"
              >
                <i class="fa-solid fa-arrow-left"></i>
                Back
              </app-button>
              <app-button
                type="submit"
                variant="primary"
                [disabled]="personalForm.invalid || !phoneNumber()"
              >
                Continue
                <i class="fa-solid fa-arrow-right"></i>
              </app-button>
            </div>
          </form>
        }

        <!-- Verify Step -->
        @if (currentStep() === 'verify') {
          <div class="verify-step">
            <div class="verify-icon">
              <i class="fa-regular fa-envelope"></i>
            </div>
            <h3>Verify Your {{ verifyChannel() === OtpChannel.EMAIL ? 'Email' : 'Phone Number' }}</h3>
            <div class="verify-channel-toggle">
              <button
                type="button"
                [class.active]="verifyChannel() === OtpChannel.EMAIL"
                (click)="setVerifyChannel(OtpChannel.EMAIL)"
              >
                Email
              </button>
              <button
                type="button"
                [class.active]="verifyChannel() === OtpChannel.PHONE"
                (click)="setVerifyChannel(OtpChannel.PHONE)"
              >
                Phone
              </button>
            </div>
            <p>
              We've sent a verification code to<br />
              <strong>{{ verificationDestination() }}</strong>
            </p>

            <div class="form-group">
              <div class="otp-inputs">
                @for (i of [0, 1, 2, 3, 4, 5]; track i) {
                  <input
                    type="text"
                    maxlength="1"
                    class="otp-input"
                    [id]="'verify-otp-' + i"
                    (input)="onOtpInput($event, i)"
                    (keydown)="onOtpKeydown($event, i)"
                    (paste)="onOtpPaste($event)"
                  />
                }
              </div>
              @if (otpError()) {
                <span class="error-text">{{ otpError() }}</span>
              }
            </div>

            <div class="resend-section">
              @if (resendTimer() > 0) {
                <span class="resend-timer">Resend code in {{ resendTimer() }}s</span>
              } @else {
                <button type="button" class="resend-btn" (click)="resendVerificationCode()">
                  Resend verification code
                </button>
              }
            </div>

            <div class="form-actions">
              <app-button
                type="button"
                variant="ghost"
                (clicked)="prevStep()"
              >
                <i class="fa-solid fa-arrow-left"></i>
                Back
              </app-button>
              <app-button
                type="button"
                variant="primary"
                [loading]="isLoading()"
                [disabled]="otp().length !== 6"
                (clicked)="completeSignup()"
              >
                Create Account
              </app-button>
            </div>
          </div>
        }

        <!-- Login Link -->
        <p class="login-link">
          Already have an account? 
          <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>

      <!-- Decorative Background -->
      <div class="signup-bg">
        <div class="bg-content">
          <i class="fa-solid fa-shuttlecock bg-icon"></i>
          <h2>Join Our Academy</h2>
          <p>Start your badminton journey today</p>
          <div class="features">
            <div class="feature">
              <i class="fa-solid fa-check-circle"></i>
              <span>Expert Coaching</span>
            </div>
            <div class="feature">
              <i class="fa-solid fa-check-circle"></i>
              <span>Track Progress</span>
            </div>
            <div class="feature">
              <i class="fa-solid fa-check-circle"></i>
              <span>Easy Scheduling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .signup-container {
      display: flex;
      min-height: 100vh;
    }

    .signup-card {
      flex: 1;
      max-width: 520px;
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow-y: auto;

      @media (max-width: 768px) {
        max-width: 100%;
        padding: 24px;
      }
    }

    .signup-header {
      text-align: center;
      margin-bottom: 24px;

      .logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--primary-color), #3b82f6);
        border-radius: 14px;
        margin-bottom: 20px;

        i {
          font-size: 24px;
          color: white;
        }
      }

      h1 {
        font-size: 26px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .step-number {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--gray-200);
        color: var(--text-muted);
        border-radius: 50%;
        font-size: 14px;
        font-weight: 600;
        transition: all var(--transition-fast);
      }

      span {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        font-weight: 500;
      }

      &.active {
        .step-number {
          background-color: var(--primary-color);
          color: white;
        }
        span {
          color: var(--primary-color);
        }
      }

      &.completed {
        .step-number {
          background-color: var(--success-color);
          color: white;
        }
        span {
          color: var(--success-color);
        }
      }
    }

    .step-line {
      width: 50px;
      height: 2px;
      background-color: var(--gray-200);
      margin: 0 8px 20px;
      transition: background-color var(--transition-fast);

      &.active {
        background-color: var(--primary-color);
      }
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .password-requirements {
      margin-bottom: 20px;
      padding: 12px;
      background-color: var(--gray-50);
      border-radius: var(--border-radius);

      .requirements-title {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--text-secondary);
        margin: 0 0 8px 0;
      }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--font-size-sm);
        color: var(--text-muted);
        margin-bottom: 4px;

        i {
          font-size: 10px;
        }

        &.valid {
          color: var(--success-color);
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }

    .verify-step {
      text-align: center;

      .verify-icon {
        width: 72px;
        height: 72px;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-light);
        border-radius: 50%;

        i {
          font-size: 28px;
          color: var(--primary-color);
        }
      }

      h3 {
        font-size: var(--font-size-xl);
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0 0 24px 0;
        line-height: 1.6;

        strong {
          color: var(--text-primary);
        }
      }
    }

    .verify-channel-toggle {
      display: inline-flex;
      gap: 6px;
      background: var(--gray-100);
      border-radius: 999px;
      padding: 4px;
      margin-bottom: 16px;

      button {
        border: none;
        background: transparent;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: 600;
      }

      button.active {
        background: var(--white);
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);
      }
    }

    .otp-inputs {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 16px;

      .otp-input {
        width: 46px;
        height: 54px;
        text-align: center;
        font-size: 22px;
        font-weight: 600;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        transition: all var(--transition-fast);

        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0, 84, 254, 0.1);
        }
      }
    }

    .error-text {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--danger-color);
    }

    .resend-section {
      margin-bottom: 24px;

      .resend-timer {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
      }

      .resend-btn {
        color: var(--primary-color);
        font-size: var(--font-size-sm);
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .login-link {
      text-align: center;
      margin-top: 24px;
      color: var(--text-muted);

      a {
        color: var(--primary-color);
        font-weight: 600;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .signup-bg {
      flex: 1;
      display: none;
      background: linear-gradient(135deg, var(--primary-color), #1e40af);
      position: relative;
      overflow: hidden;

      @media (min-width: 1024px) {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .bg-content {
        text-align: center;
        color: white;
        z-index: 1;
        padding: 40px;

        .bg-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.9;
        }

        h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        p {
          font-size: var(--font-size-lg);
          opacity: 0.8;
          margin: 0 0 32px 0;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          max-width: 200px;
          margin: 0 auto;

          .feature {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: var(--font-size-base);

            i {
              color: #4ade80;
            }
          }
        }
      }

      &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // State signals
  currentStep = signal<SignupStep>('account');
  isLoading = signal(false);
  phoneNumber = signal('');
  phoneError = signal('');
  otpError = signal('');
  otp = signal('');
  resendTimer = signal(0);
  verifyChannel = signal<OtpChannel>(OtpChannel.EMAIL);

  private resendInterval?: ReturnType<typeof setInterval>;
  readonly OtpChannel = OtpChannel;

  // Account Form
  accountForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  // Personal Form
  personalForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.minLength(2)]],
    nationalIdNumber: ['', [Validators.required]],
    dateOfBirth: ['', [this.dateValidator]]
  });

  // Validators
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    
    if (!hasUppercase || !hasNumber) {
      return { passwordWeak: true };
    }
    return null;
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  dateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return { invalidDate: true };
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { invalidDate: true };
    }
    
    return null;
  }

  // Password strength checks
  hasMinLength(): boolean {
    return (this.accountForm.get('password')?.value?.length ?? 0) >= 8;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.accountForm.get('password')?.value ?? '');
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.accountForm.get('password')?.value ?? '');
  }

  // Step management
  isStepCompleted(step: SignupStep): boolean {
    const steps: SignupStep[] = ['account', 'personal', 'verify'];
    const currentIndex = steps.indexOf(this.currentStep());
    const stepIndex = steps.indexOf(step);
    return stepIndex < currentIndex;
  }

  nextStep(): void {
    const steps: SignupStep[] = ['account', 'personal', 'verify'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
      if (steps[currentIndex + 1] === 'verify') {
        this.requestSignupOtp();
        this.startResendTimer();
      }
    }
  }

  prevStep(): void {
    const steps: SignupStep[] = ['account', 'personal', 'verify'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
    }
  }

  onPhoneChange(phone: string): void {
    this.phoneNumber.set(phone);
    this.phoneError.set('');
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < 5) {
      const nextInput = document.getElementById(`verify-otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    this.updateOtpValue();
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && index > 0) {
      const input = event.target as HTMLInputElement;
      if (!input.value) {
        const prevInput = document.getElementById(`verify-otp-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '').substring(0, 6);
    
    digits.split('').forEach((digit, i) => {
      const input = document.getElementById(`verify-otp-${i}`) as HTMLInputElement;
      if (input) {
        input.value = digit;
      }
    });

    this.updateOtpValue();
  }

  private updateOtpValue(): void {
    let otp = '';
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`verify-otp-${i}`) as HTMLInputElement;
      otp += input?.value || '';
    }
    this.otp.set(otp);
    this.otpError.set('');
  }

  resendVerificationCode(): void {
    this.requestSignupOtp();
    this.startResendTimer();
    this.toastService.success('Code Sent', 'A new verification code has been sent.');
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

  completeSignup(): void {
    if (this.otp().length !== 6) return;

    this.isLoading.set(true);
    const lastName = this.personalForm.get('lastName')?.value?.trim() || undefined;
    const dateOfBirth = this.personalForm.get('dateOfBirth')?.value?.trim() || undefined;

    const registerData = {
      email: this.accountForm.get('email')?.value,
      password: this.accountForm.get('password')?.value,
      firstName: this.personalForm.get('firstName')?.value,
      lastName,
      nationalIdNumber: this.personalForm.get('nationalIdNumber')?.value,
      dateOfBirth,
      phoneNumber: this.phoneNumber(),
      role: Role.PARENT,
      otp: this.otp(),
      otpChannel: this.verifyChannel()
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.toastService.success('Account Created', 'Welcome to Badminton Academy!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastService.error('Registration Failed', error.error?.message || 'Something went wrong');
      }
    });
  }

  setVerifyChannel(channel: OtpChannel): void {
    if (this.verifyChannel() === channel) return;
    this.verifyChannel.set(channel);
    if (this.currentStep() === 'verify') {
      this.requestSignupOtp();
      this.startResendTimer();
    }
  }

  verificationDestination(): string {
    return this.verifyChannel() === OtpChannel.EMAIL
      ? (this.accountForm.get('email')?.value || '')
      : this.phoneNumber();
  }

  private requestSignupOtp(): void {
    const payload = this.verifyChannel() === OtpChannel.EMAIL
      ? {
          channel: OtpChannel.EMAIL,
          email: this.accountForm.get('email')?.value
        }
      : {
          channel: OtpChannel.PHONE,
          phoneNumber: this.phoneNumber()
        };

    this.authService.requestSignupOtp(payload).subscribe({
      next: () => {
        this.otpError.set('');
      },
      error: (error) => {
        this.otpError.set(error?.error?.message || 'Failed to send OTP');
      }
    });
  }

  getError(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      if (control.errors['invalidDate']) return 'Please enter a valid date (YYYY-MM-DD)';
      if (control.errors['passwordWeak']) return 'Password must contain uppercase and number';
    }
    
    // Check for form-level errors
    if (field === 'confirmPassword' && form.errors?.['passwordMismatch'] && control?.touched) {
      return 'Passwords do not match';
    }
    
    return '';
  }
}
