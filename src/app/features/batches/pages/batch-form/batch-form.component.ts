import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BatchService, CreateBatchRequest } from '../../services/batch.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SkillLevel } from '../../../../core/models';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';

@Component({
  selector: 'app-batch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent
  ],
  template: `
    <div class="batch-form-page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="header-content">
          <h1>{{ isEditMode ? 'Edit Batch' : 'Create New Batch' }}</h1>
          <p>{{ isEditMode ? 'Update batch details' : 'Add a new training batch' }}</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <app-card title="Batch Information" icon="fa-solid fa-layer-group">
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="name">Batch Name <span class="required">*</span></label>
              <input
                id="name"
                type="text"
                formControlName="name"
                placeholder="e.g., Morning Beginners"
                class="form-input"
                [class.error]="isFieldInvalid('name')"
              />
              @if (isFieldInvalid('name')) {
                <span class="error-text">Batch name is required</span>
              }
            </div>

            <div class="form-group span-4">
              <label for="skillLevel">Skill Level <span class="required">*</span></label>
              <select
                id="skillLevel"
                formControlName="skillLevel"
                class="form-select"
                [class.error]="isFieldInvalid('skillLevel')"
              >
                <option value="">Select skill level</option>
                @for (level of skillLevels; track level.value) {
                  <option [value]="level.value">{{ level.label }}</option>
                }
              </select>
              @if (isFieldInvalid('skillLevel')) {
                <span class="error-text">Skill level is required</span>
              }
            </div>

            <div class="form-group span-4">
              <label for="coachId">Coach <span class="required">*</span></label>
              <select
                id="coachId"
                formControlName="coachId"
                class="form-select"
                [class.error]="isFieldInvalid('coachId')"
              >
                <option value="">Select coach</option>
                @for (coach of coaches(); track coach.id) {
                  <option [value]="coach.id">{{ coach.fullName }}</option>
                }
              </select>
              @if (isFieldInvalid('coachId')) {
                <span class="error-text">Coach is required</span>
              }
            </div>

            <div class="form-group span-4">
              <label for="startTime">Start Time <span class="required">*</span></label>
              <input
                id="startTime"
                type="time"
                formControlName="startTime"
                class="form-input"
                [class.error]="isFieldInvalid('startTime')"
              />
              @if (isFieldInvalid('startTime')) {
                <span class="error-text">Start time is required</span>
              }
            </div>

            <div class="form-group span-4">
              <label for="endTime">End Time <span class="required">*</span></label>
              <input
                id="endTime"
                type="time"
                formControlName="endTime"
                class="form-input"
                [class.error]="isFieldInvalid('endTime')"
              />
              @if (isFieldInvalid('endTime')) {
                <span class="error-text">End time is required</span>
              }
            </div>

            <div class="form-group span-4">
              <label for="courtNumber">Court Number</label>
              <input
                id="courtNumber"
                type="number"
                formControlName="courtNumber"
                placeholder="e.g., 1"
                class="form-input"
              />
            </div>

            <div class="form-group full-width">
              <label for="description">Description</label>
              <textarea
                id="description"
                formControlName="description"
                placeholder="Brief description of this batch..."
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
          </div>
        </app-card>

        <div class="form-actions">
          <app-button variant="outline" type="button" (clicked)="goBack()">
            Cancel
          </app-button>
          <app-button
            variant="primary"
            type="submit"
            [loading]="isSubmitting()"
            [disabled]="form.invalid"
          >
            {{ isEditMode ? 'Update Batch' : 'Create Batch' }}
          </app-button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .batch-form-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--gray-100);
        color: var(--text-primary);
      }
    }

    .header-content {
      h1 {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 14px 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      grid-column: span 6;

      &.span-4 {
        grid-column: span 4;
      }

      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-weight: 500;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }

      .required {
        color: var(--danger-color);
      }
    }

    .form-input,
    .form-select,
    .form-textarea {
      padding: 12px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      background-color: var(--white);
      transition: all var(--transition-fast);

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      &.error {
        border-color: var(--danger-color);
      }

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .error-text {
      font-size: var(--font-size-xs);
      color: var(--danger-color);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 1024px) {
      .form-group.span-4 {
        grid-column: span 6;
      }
    }

    @media (max-width: 640px) {
      .page-header {
        align-items: flex-start;
      }

      .form-group,
      .form-group.span-4 {
        grid-column: 1 / -1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private batchService = inject(BatchService);
  private toastService = inject(ToastService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  isEditMode = false;
  batchId: number | null = null;
  isSubmitting = signal(false);
  coaches = signal<Array<{ id: number; fullName: string }>>([]);

  skillLevels: { value: SkillLevel; label: string }[] = [
    { value: SkillLevel.BEGINNER, label: 'Beginner' },
    { value: SkillLevel.INTERMEDIATE, label: 'Intermediate' },
    { value: SkillLevel.ADVANCED, label: 'Advanced' },
    { value: SkillLevel.PROFESSIONAL, label: 'Professional' }
  ];

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    skillLevel: ['', Validators.required],
    coachId: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    courtNumber: [null],
    description: ['']
  });

  ngOnInit(): void {
    this.loadCoaches();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.batchId = parseInt(id);
      this.loadBatch();
    }
  }

  loadCoaches(): void {
    this.apiService.get<Array<{ id: number; fullName: string }>>('/coaches/active').subscribe({
      next: (coaches) => {
        this.coaches.set(coaches || []);
        const currentUser = this.authService.currentUser();
        if (!this.isEditMode && currentUser?.role === Role.COACH) {
          this.form.patchValue({ coachId: currentUser.id });
        }
      },
      error: () => {
        const currentUser = this.authService.currentUser();
        if (!this.isEditMode && currentUser?.role === Role.COACH) {
          this.coaches.set([{ id: currentUser.id, fullName: currentUser.fullName }]);
          this.form.patchValue({ coachId: currentUser.id });
          return;
        }
        this.toastService.error('Failed to load coaches for dropdown');
      }
    });
  }

  loadBatch(): void {
    if (!this.batchId) return;
    
    this.batchService.getBatchById(this.batchId).subscribe({
      next: (batch) => {
        if (batch) {
          this.form.patchValue({
            name: batch.name,
            skillLevel: batch.skillLevel,
            coachId: batch.coachId,
            startTime: batch.startTime,
            endTime: batch.endTime,
            courtNumber: batch.courtNumber,
            description: batch.description
          });
        }
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const data: CreateBatchRequest = this.form.value;

    const request = this.isEditMode && this.batchId
      ? this.batchService.updateBatch(this.batchId, data)
      : this.batchService.createBatch(data);

    request.subscribe({
      next: () => {
        this.toastService.success(this.isEditMode ? 'Batch updated successfully' : 'Batch created successfully');
        this.router.navigate(['/dashboard/batches']);
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toastService.error(this.isEditMode ? 'Failed to update batch' : 'Failed to create batch');
        this.isSubmitting.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/batches']);
  }
}
