import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of, switchMap } from 'rxjs';
import { StudentService, CreateStudentRequest } from '../../services/student.service';
import { BatchService } from '../../../batches/services/batch.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Batch, DayOfWeek } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent],
  template: `
    <div class="student-form-page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="header-content">
          <h1>{{ isEditMode ? 'Edit Student' : 'Add New Student' }}</h1>
          <p>{{ isEditMode ? 'Update student information' : 'Register a new student' }}</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <app-card title="Personal Information" icon="fa-solid fa-user">
          <div class="form-grid">
            <div class="form-group span-4">
              <label for="firstName">First Name <span class="required">*</span></label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                placeholder="Enter first name"
                class="form-input"
                [class.error]="isFieldInvalid('firstName')"
              />
              @if (isFieldInvalid('firstName')) {
                <span class="error-text">First name is required</span>
              }
            </div>

            <div class="form-group span-4">
              <label for="lastName">Last Name <span class="required">*</span></label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                placeholder="Enter last name"
                class="form-input"
                [class.error]="isFieldInvalid('lastName')"
              />
              @if (isFieldInvalid('lastName')) {
                <span class="error-text">Last name is required</span>
              }
            </div>

            <div class="form-group span-4">
              <label for="nationalIdNumber">National ID</label>
              <input
                id="nationalIdNumber"
                type="text"
                formControlName="nationalIdNumber"
                placeholder="Enter national ID (optional)"
                class="form-input"
              />
            </div>

            <div class="form-group span-4">
              <label for="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                placeholder="+91 98765 43210 (optional)"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                type="date"
                formControlName="dateOfBirth"
                class="form-input"
                [class.error]="isFieldInvalid('dateOfBirth')"
              />
            </div>

            <div class="form-group">
              <label for="gender">Gender <span class="required">*</span></label>
              <select
                id="gender"
                formControlName="gender"
                class="form-select"
                [class.error]="isFieldInvalid('gender')"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              @if (isFieldInvalid('gender')) {
                <span class="error-text">Gender is required</span>
              }
            </div>

            <div class="form-group full-width">
              <label for="address">Address</label>
              <textarea
                id="address"
                formControlName="address"
                placeholder="Enter address"
                class="form-textarea"
                rows="2"
              ></textarea>
            </div>
          </div>
        </app-card>

        <app-card title="Training Information" icon="fa-solid fa-dumbbell">
          <div class="form-grid">
            <div class="form-group">
              <label for="skillLevel">Skill Level</label>
              <select id="skillLevel" formControlName="skillLevel" class="form-select">
                <option value="">Select skill level</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="PROFESSIONAL">Professional</option>
              </select>
            </div>

            <div class="form-group">
              <label for="batchId">Assign to Batch</label>
              <select id="batchId" formControlName="batchId" class="form-select">
                <option [ngValue]="null">Select batch (optional)</option>
                @for (batch of batches(); track batch.id) {
                  <option [ngValue]="batch.id">{{ batch.name }} ({{ batch.startTime }} - {{ batch.endTime }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label for="feePayable">Fee Payable</label>
              <input
                id="feePayable"
                type="number"
                formControlName="feePayable"
                placeholder="Enter payable fee amount"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="monthlyFeeStatus">Monthly Fee Status</label>
              <select id="monthlyFeeStatus" formControlName="monthlyFeeStatus" class="form-select">
                <option value="UNPAID">Unpaid</option>
                <option value="HALF">Half Paid</option>
                <option value="FULL">Full Paid</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label>Training Days</label>
              <div class="days-selector">
                @for (day of daysOfWeek; track day.value) {
                  <label class="day-checkbox" [class.selected]="isDaySelected(day.value)">
                    <input
                      type="checkbox"
                      [checked]="isDaySelected(day.value)"
                      (change)="toggleDay(day.value)"
                    />
                    <span>{{ day.label }}</span>
                  </label>
                }
              </div>
            </div>
          </div>
        </app-card>

        <app-card title="Emergency Contact" icon="fa-solid fa-phone">
          <div class="form-grid">
            <div class="form-group">
              <label for="emergencyContactName">Contact Name</label>
              <input
                id="emergencyContactName"
                type="text"
                formControlName="emergencyContactName"
                placeholder="Emergency contact name"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="emergencyContactPhone">Contact Phone</label>
              <input
                id="emergencyContactPhone"
                type="tel"
                formControlName="emergencyContactPhone"
                placeholder="Emergency contact phone"
                class="form-input"
              />
            </div>

            <div class="form-group full-width">
              <label for="medicalConditions">Medical Conditions</label>
              <textarea
                id="medicalConditions"
                formControlName="medicalConditions"
                placeholder="Any medical conditions to note (allergies, asthma, etc.)"
                class="form-textarea"
                rows="2"
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
            {{ isEditMode ? 'Update Student' : 'Add Student' }}
          </app-button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .student-form-page {
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
      min-height: 60px;
    }

    .error-text {
      font-size: var(--font-size-xs);
      color: var(--danger-color);
    }

    .days-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .day-checkbox {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all var(--transition-fast);

      input {
        display: none;
      }

      span {
        font-size: var(--font-size-sm);
        font-weight: 500;
      }

      &:hover {
        border-color: var(--primary-color);
      }

      &.selected {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--white);
      }
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
export class StudentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private batchService = inject(BatchService);
  private toastService = inject(ToastService);

  isEditMode = false;
  studentId: number | null = null;
  currentBatchId: number | null = null;
  isSubmitting = signal(false);
  batches = signal<Batch[]>([]);
  daysOfWeek: { value: DayOfWeek; label: string }[] = [
    { value: DayOfWeek.MONDAY, label: 'Mon' },
    { value: DayOfWeek.TUESDAY, label: 'Tue' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wed' },
    { value: DayOfWeek.THURSDAY, label: 'Thu' },
    { value: DayOfWeek.FRIDAY, label: 'Fri' },
    { value: DayOfWeek.SATURDAY, label: 'Sat' },
    { value: DayOfWeek.SUNDAY, label: 'Sun' }
  ];

  form: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    nationalIdNumber: [''],
    phone: [''],
    dateOfBirth: [''],
    gender: ['', Validators.required],
    address: [''],
    skillLevel: [''],
    daysOfWeek: [[] as DayOfWeek[]],
    batchId: [null],
    feePayable: [0],
    monthlyFeeStatus: ['UNPAID'],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
    medicalConditions: ['']
  });

  ngOnInit(): void {
    this.loadBatches();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.studentId = parseInt(id);
      this.loadStudent();
    }

    // Pre-select batch if passed in query params
    const batchId = this.route.snapshot.queryParamMap.get('batchId');
    if (batchId) {
      this.form.patchValue({ batchId: parseInt(batchId) });
    }
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (batches) => this.batches.set(batches)
    });
  }

  loadStudent(): void {
    if (!this.studentId) return;
    
    this.studentService.getStudentById(this.studentId).subscribe({
      next: (student) => {
        if (student) {
          this.form.patchValue({
            firstName: student.firstName,
            lastName: student.lastName,
            nationalIdNumber: student.nationalIdNumber,
            phone: student.phone,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            address: student.address,
            skillLevel: student.skillLevel,
            daysOfWeek: student.daysOfWeek || [],
            batchId: student.batchId,
            feePayable: student.feePayable ?? 0,
            monthlyFeeStatus: student.monthlyFeeStatus ?? 'UNPAID',
            emergencyContactName: student.emergencyContactName,
            emergencyContactPhone: student.emergencyContactPhone,
            medicalConditions: student.medicalConditions
          });
          this.currentBatchId = this.toNumberOrNull(student.batchId);
        }
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  isDaySelected(day: DayOfWeek): boolean {
    const days = this.form.get('daysOfWeek')?.value || [];
    return days.includes(day);
  }

  toggleDay(day: DayOfWeek): void {
    const days = [...(this.form.get('daysOfWeek')?.value || [])];
    const index = days.indexOf(day);

    if (index === -1) {
      days.push(day);
    } else {
      days.splice(index, 1);
    }

    this.form.patchValue({ daysOfWeek: days });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.value as CreateStudentRequest;
    const selectedBatchId = this.toNumberOrNull(formValue.batchId);
    const lastName = formValue.lastName.trim();
    const dateOfBirth = formValue.dateOfBirth || undefined;
    const daysOfWeek = formValue.daysOfWeek ?? [];
    const data: CreateStudentRequest = {
      ...formValue,
      lastName,
      dateOfBirth,
      daysOfWeek,
      batchId: selectedBatchId ?? undefined
    };

    const request = this.isEditMode && this.studentId
      ? this.studentService.updateStudent(this.studentId, data).pipe(
          switchMap(student => this.syncBatchAssignment(student.id, selectedBatchId))
        )
      : this.studentService.createStudent(data);

    request.subscribe({
      next: () => {
        this.toastService.success(this.isEditMode ? 'Student updated successfully' : 'Student added successfully');
        this.router.navigate(['/dashboard/students']);
        this.isSubmitting.set(false);
      },
      error: (error) => {
        const fallbackMessage = this.isEditMode ? 'Failed to update student' : 'Failed to add student';
        const validationErrors = error?.error?.errors as Record<string, string> | undefined;
        const validationMessage = validationErrors
          ? Object.entries(validationErrors).map(([field, message]) => `${field}: ${message}`).join(', ')
          : null;
        const apiMessage = error?.error?.message || error?.userMessage;

        this.toastService.error(validationMessage || apiMessage || fallbackMessage);
        this.isSubmitting.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }

  private syncBatchAssignment(studentId: number, selectedBatchId: number | null): Observable<unknown> {
    const previousBatchId = this.toNumberOrNull(this.currentBatchId);

    if (previousBatchId && selectedBatchId && previousBatchId !== selectedBatchId) {
      return this.studentService.removeFromBatch(studentId, previousBatchId).pipe(
        switchMap(() => this.studentService.assignToBatch(studentId, selectedBatchId))
      );
    }

    if (!previousBatchId && selectedBatchId) {
      return this.studentService.assignToBatch(studentId, selectedBatchId);
    }

    if (previousBatchId && !selectedBatchId) {
      return this.studentService.removeFromBatch(studentId, previousBatchId);
    }

    return of(null);
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
