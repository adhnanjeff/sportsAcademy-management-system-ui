import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { User } from '../../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, CardComponent, SkeletonLoaderComponent],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <div>
          <h1>My Profile</h1>
          <p>View and manage your account details</p>
        </div>
        @if (isEditing()) {
          <div class="actions">
            <app-button variant="outline" (clicked)="cancelEdit()">Cancel</app-button>
            <app-button variant="primary" [loading]="isSaving()" (clicked)="saveProfile()">Save</app-button>
          </div>
        } @else {
          <app-button variant="primary" icon="fa-solid fa-pen" (clicked)="enableEdit()">Edit</app-button>
        }
      </div>

      @if (isLoading()) {
        <app-skeleton-loader type="form" [count]="8" />
      } @else {
        <app-card title="Profile Details" icon="fa-solid fa-user">
          <form [formGroup]="profileForm" class="profile-grid">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" formControlName="firstName" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" formControlName="lastName" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" formControlName="email" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" formControlName="phoneNumber" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>National ID</label>
              <input type="text" formControlName="nationalIdNumber" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>Date of Birth</label>
              <input type="date" formControlName="dateOfBirth" [disabled]="!isEditing()" />
            </div>
            <div class="form-group full-width">
              <label>Address</label>
              <input type="text" formControlName="address" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>City</label>
              <input type="text" formControlName="city" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>State</label>
              <input type="text" formControlName="state" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>Country</label>
              <input type="text" formControlName="country" [disabled]="!isEditing()" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <input type="text" [value]="profile()?.role || ''" disabled />
            </div>
          </form>
        </app-card>
      }
    </div>
  `,
  styles: [`
    .profile-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      h1 {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        margin: 0 0 4px;
      }

      p {
        margin: 0;
        color: var(--text-muted);
      }
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: 600;
      }

      input {
        height: 42px;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 0 12px;
        background: var(--white);
      }

      input:disabled {
        background: var(--gray-50);
        color: var(--text-secondary);
      }
    }

    @media (max-width: 768px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);

  isLoading = signal(true);
  isSaving = signal(false);
  isEditing = signal(false);
  profile = signal<User | null>(null);

  profileForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    nationalIdNumber: [''],
    dateOfBirth: [''],
    address: [''],
    city: [''],
    state: [''],
    country: ['']
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.userService.getUserById(userId).subscribe({
      next: user => {
        this.profile.set(user);
        this.profileForm.patchValue({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          nationalIdNumber: user.nationalIdNumber || '',
          dateOfBirth: user.dateOfBirth || '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          country: user.country || ''
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load profile');
        this.isLoading.set(false);
      }
    });
  }

  enableEdit(): void {
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    const user = this.profile();
    if (!user) return;
    this.profileForm.patchValue({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      nationalIdNumber: user.nationalIdNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || ''
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const userId = this.profile()?.id;
    if (!userId) return;

    this.isSaving.set(true);
    this.userService.updateUser(userId, this.profileForm.value).subscribe({
      next: user => {
        this.profile.set(user);
        this.authService.getCurrentUser().subscribe();
        this.isEditing.set(false);
        this.isSaving.set(false);
        this.toastService.success('Profile updated successfully');
      },
      error: error => {
        this.isSaving.set(false);
        this.toastService.error(error?.error?.message || 'Failed to update profile');
      }
    });
  }
}
