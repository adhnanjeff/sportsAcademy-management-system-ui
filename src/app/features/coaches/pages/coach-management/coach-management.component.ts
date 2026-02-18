import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

interface CoachRow {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  totalBatches?: number;
  totalStudents?: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-coach-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent, ModalComponent, SkeletonLoaderComponent],
  template: `
    <div class="coach-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Coaches</h1>
          <p>Admin management for all coaches</p>
        </div>
      </div>

      <app-card title="Create Coach" icon="fa-solid fa-user-plus">
        <form [formGroup]="createForm" (ngSubmit)="createCoach()" class="create-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="firstName">First Name <span class="required">*</span></label>
              <input id="firstName" type="text" formControlName="firstName" class="form-input" />
            </div>

            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input id="lastName" type="text" formControlName="lastName" class="form-input" />
            </div>

            <div class="form-group">
              <label for="email">Email <span class="required">*</span></label>
              <input id="email" type="email" formControlName="email" class="form-input" />
            </div>

            <div class="form-group">
              <label for="password">Password <span class="required">*</span></label>
              <input id="password" type="password" formControlName="password" class="form-input" placeholder="Minimum 6 characters" />
            </div>

            <div class="form-group">
              <label for="nationalIdNumber">National ID</label>
              <input id="nationalIdNumber" type="text" formControlName="nationalIdNumber" class="form-input" />
            </div>

            <div class="form-group">
              <label for="dateOfBirth">Date of Birth</label>
              <input id="dateOfBirth" type="date" formControlName="dateOfBirth" class="form-input" />
            </div>

            <div class="form-group">
              <label for="phoneNumber">Phone</label>
              <input id="phoneNumber" type="tel" formControlName="phoneNumber" class="form-input" />
            </div>

            <div class="form-group">
              <label for="specialization">Specialization</label>
              <input id="specialization" type="text" formControlName="specialization" class="form-input" />
            </div>

            <div class="form-group">
              <label for="yearsOfExperience">Experience (years)</label>
              <input id="yearsOfExperience" type="number" formControlName="yearsOfExperience" class="form-input" />
            </div>
          </div>

          <div class="form-actions">
            <app-button type="submit" variant="primary" [loading]="isCreating()" [disabled]="createForm.invalid">
              Create Coach
            </app-button>
          </div>
        </form>
      </app-card>

      <app-card title="All Coaches" icon="fa-solid fa-users">
        @if (isLoading()) {
          <app-skeleton-loader type="table" [count]="6" [columns]="8" />
        } @else {
          <div class="table-wrapper">
            <table class="coaches-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Batches</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (coach of coaches(); track coach.id) {
                  <tr>
                    <td>{{ coach.fullName }}</td>
                    <td>{{ coach.email }}</td>
                    <td>{{ coach.phoneNumber || '-' }}</td>
                    <td>{{ coach.specialization || '-' }}</td>
                    <td>{{ coach.yearsOfExperience ?? '-' }}</td>
                    <td>{{ coach.totalBatches ?? 0 }}</td>
                    <td>{{ coach.totalStudents ?? 0 }}</td>
                    <td>
                      <button class="delete-btn" (click)="confirmDelete(coach)">
                        <i class="fa-solid fa-trash"></i>
                        Delete
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="empty-row">No coaches found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </app-card>
    </div>

    <app-modal [isOpen]="showDeleteModal()" title="Delete Coach" (close)="closeDeleteModal()">
      <p>Delete <strong>{{ coachToDelete()?.fullName }}</strong>?</p>
      <p class="modal-note">If this coach is assigned to batches, deletion will be blocked until reassigned.</p>
      <div class="modal-actions" slot="footer">
        <app-button variant="outline" (clicked)="closeDeleteModal()">Cancel</app-button>
        <app-button variant="danger" [loading]="isDeleting()" (clicked)="deleteCoach()">Delete</app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .coach-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header h1 {
      margin: 0;
      font-size: var(--font-size-2xl);
      color: var(--text-primary);
    }

    .page-header p {
      margin: 4px 0 0;
      color: var(--text-muted);
    }

    .create-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 500;
    }

    .required {
      color: var(--danger-color);
    }

    .form-input {
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--white);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .coaches-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
    }

    .coaches-table th,
    .coaches-table td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
      font-size: var(--font-size-sm);
    }

    .coaches-table th {
      background: var(--gray-50);
      color: var(--text-secondary);
      font-weight: 600;
    }

    .delete-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--danger-color);
      border: 1px solid color-mix(in srgb, var(--danger-color) 30%, var(--border-color));
      padding: 6px 10px;
      border-radius: var(--border-radius);
      background: var(--white);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .delete-btn:hover {
      background: var(--danger-light);
    }

    .empty-row {
      text-align: center;
      color: var(--text-muted);
      padding: 20px;
    }

    .modal-note {
      color: var(--text-muted);
      font-size: var(--font-size-sm);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @media (max-width: 1024px) {
      .form-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoachManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  coaches = signal<CoachRow[]>([]);
  isLoading = signal(true);
  isCreating = signal(false);
  isDeleting = signal(false);
  showDeleteModal = signal(false);
  coachToDelete = signal<CoachRow | null>(null);

  createForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nationalIdNumber: [''],
    dateOfBirth: [''],
    phoneNumber: [''],
    specialization: [''],
    yearsOfExperience: [null]
  });

  ngOnInit(): void {
    this.loadCoaches();
  }

  loadCoaches(): void {
    this.isLoading.set(true);
    this.api.get<CoachRow[]>('/coaches').subscribe({
      next: (coaches) => {
        this.coaches.set(coaches || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || 'Failed to load coaches');
        this.isLoading.set(false);
      }
    });
  }

  createCoach(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);

    const value = this.createForm.value;
    const lastName = value.lastName?.trim() || undefined;
    const nationalIdNumber = value.nationalIdNumber?.trim() || undefined;
    const dateOfBirth = value.dateOfBirth || undefined;
    const payload = {
      firstName: value.firstName,
      lastName,
      email: value.email,
      password: value.password,
      nationalIdNumber,
      dateOfBirth,
      phoneNumber: value.phoneNumber || undefined,
      specialization: value.specialization || undefined,
      yearsOfExperience: value.yearsOfExperience ?? undefined
    };

    this.api.post<CoachRow>('/coaches', payload).subscribe({
      next: () => {
        this.toastService.success('Coach created successfully');
        this.createForm.reset();
        this.loadCoaches();
        this.isCreating.set(false);
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || 'Failed to create coach');
        this.isCreating.set(false);
      }
    });
  }

  confirmDelete(coach: CoachRow): void {
    this.coachToDelete.set(coach);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.coachToDelete.set(null);
  }

  deleteCoach(): void {
    const coach = this.coachToDelete();
    if (!coach) return;

    this.isDeleting.set(true);
    this.api.delete<{ message: string }>('/coaches/' + coach.id).subscribe({
      next: () => {
        this.toastService.success('Coach deleted successfully');
        this.coaches.update((rows) => rows.filter((row) => row.id !== coach.id));
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || 'Failed to delete coach');
        this.isDeleting.set(false);
      }
    });
  }
}
