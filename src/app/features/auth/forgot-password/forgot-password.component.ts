import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

type ForgotStep = 'REQUEST' | 'VERIFY' | 'RESET';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="forgot-password-container">
      <div class="forgot-card">
        <div class="forgot-header">
          <div class="icon-wrapper">
            <i class="fa-solid fa-key"></i>
          </div>
          <h1>Forgot Password</h1>
          <p>Reset your account password with OTP verification.</p>
        </div>

        @if (step() === 'REQUEST') {
          <form [formGroup]="requestForm" (ngSubmit)="requestOtp()">
            <div class="form-group">
              <app-input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                prefixIcon="fa-regular fa-envelope"
                formControlName="email"
                [required]="true"
                [error]="getError(requestForm, 'email')"
              />
            </div>

            <app-button type="submit" variant="primary" [fullWidth]="true" [loading]="isLoading()">
              Send OTP
            </app-button>
          </form>
        }

        @if (step() === 'VERIFY') {
          <form [formGroup]="verifyForm" (ngSubmit)="verifyOtp()">
            <p class="step-note">
              Enter the 6-digit OTP sent to <strong>{{ requestForm.get('email')?.value }}</strong>
            </p>
            <div class="form-group">
              <app-input
                type="text"
                label="OTP"
                placeholder="Enter 6-digit OTP"
                prefixIcon="fa-solid fa-shield-halved"
                formControlName="otp"
                [required]="true"
                [error]="getError(verifyForm, 'otp')"
              />
            </div>

            <div class="resend-row">
              @if (resendTimer() > 0) {
                <span>Resend OTP in {{ resendTimer() }}s</span>
              } @else {
                <button type="button" class="resend-btn" (click)="resendOtp()">Resend OTP</button>
              }
            </div>

            <app-button type="submit" variant="primary" [fullWidth]="true" [loading]="isLoading()">
              Verify OTP
            </app-button>
          </form>
        }

        @if (step() === 'RESET') {
          <form [formGroup]="resetForm" (ngSubmit)="resetPassword()">
            <div class="form-group">
              <app-input
                type="password"
                label="New Password"
                placeholder="Enter new password"
                prefixIcon="fa-solid fa-lock"
                formControlName="newPassword"
                [required]="true"
                [error]="getError(resetForm, 'newPassword')"
              />
            </div>

            <div class="form-group">
              <app-input
                type="password"
                label="Confirm Password"
                placeholder="Confirm new password"
                prefixIcon="fa-solid fa-lock"
                formControlName="confirmPassword"
                [required]="true"
                [error]="getError(resetForm, 'confirmPassword')"
              />
            </div>

            <app-button type="submit" variant="primary" [fullWidth]="true" [loading]="isLoading()">
              Save Password
            </app-button>
          </form>
        }

        <a routerLink="/auth/login" class="back-link">
          <i class="fa-solid fa-arrow-left"></i>
          Back to login
        </a>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
    }

    .forgot-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      background-color: var(--white);
      border-radius: var(--border-radius-xl);
      box-shadow: var(--shadow-lg);
    }

    .forgot-header {
      text-align: center;
      margin-bottom: 24px;

      .icon-wrapper {
        width: 64px;
        height: 64px;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-light);
        border-radius: 50%;

        i {
          font-size: 24px;
          color: var(--primary-color);
        }
      }

      h1 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .form-group {
      margin-bottom: 18px;
    }

    .step-note {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: 16px;
      text-align: center;
    }

    .resend-row {
      text-align: center;
      margin-bottom: 16px;
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .resend-btn {
      color: var(--primary-color);
      font-weight: 600;
    }

    .back-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      color: var(--text-muted);
      font-size: var(--font-size-sm);
      font-weight: 500;

      &:hover {
        color: var(--primary-color);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  step = signal<ForgotStep>('REQUEST');
  isLoading = signal(false);
  resendTimer = signal(0);
  private resendInterval?: ReturnType<typeof setInterval>;

  requestForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  verifyForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  requestOtp(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.requestPasswordOtp({ email: this.requestForm.get('email')?.value }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set('VERIFY');
        this.startResendTimer();
        this.toastService.success('OTP sent to your email');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastService.error(error?.error?.message || 'Failed to send OTP');
      }
    });
  }

  resendOtp(): void {
    this.requestOtp();
  }

  verifyOtp(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.verifyPasswordOtp({
      email: this.requestForm.get('email')?.value,
      otp: this.verifyForm.get('otp')?.value
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set('RESET');
        this.toastService.success('OTP verified successfully');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastService.error(error?.error?.message || 'Invalid OTP');
      }
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.resetPassword({
      email: this.requestForm.get('email')?.value,
      otp: this.verifyForm.get('otp')?.value,
      newPassword: this.resetForm.get('newPassword')?.value
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success('Password updated successfully');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastService.error(error?.error?.message || 'Failed to reset password');
      }
    });
  }

  getError(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      if (control.errors['pattern']) return 'Enter a valid 6-digit OTP';
    }
    if (field === 'confirmPassword' && form.errors?.['passwordMismatch'] && control?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  private startResendTimer(): void {
    this.resendTimer.set(60);
    clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      this.resendTimer.update(value => {
        if (value <= 1) {
          clearInterval(this.resendInterval);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
}
