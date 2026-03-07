import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Achievement, AchievementService } from '../../core/services/achievement.service';
import { AchievementType } from '../../core/models';
import { ImageUploadComponent } from '../../shared/components/image-upload.component';

@Component({
  selector: 'app-achievement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent],
  template: `
    <div class="achievement-form-container">
      <h2>{{ isEditMode ? 'Edit Achievement' : 'Create New Achievement' }}</h2>

      <form [formGroup]="achievementForm" (ngSubmit)="onSubmit()">
        <!-- Student Selection (only show if creating new) -->
        <div class="form-group" *ngIf="!isEditMode && !studentId">
          <label for="studentId">Student *</label>
          <select id="studentId" formControlName="studentId" class="form-control">
            <option value="">Select Student</option>
            <option *ngFor="let student of students" [value]="student.id">
              {{ student.fullName }}
            </option>
          </select>
          <div class="error" *ngIf="achievementForm.get('studentId')?.touched && achievementForm.get('studentId')?.errors?.['required']">
            Student is required
          </div>
        </div>

        <!-- Title -->
        <div class="form-group">
          <label for="title">Title *</label>
          <input 
            id="title" 
            type="text" 
            formControlName="title" 
            class="form-control"
            placeholder="E.g., 1st Place - District Championship"
          />
          <div class="error" *ngIf="achievementForm.get('title')?.touched && achievementForm.get('title')?.errors?.['required']">
            Title is required
          </div>
        </div>

        <!-- Achievement Type -->
        <div class="form-group">
          <label for="type">Type *</label>
          <select id="type" formControlName="type" class="form-control">
            <option value="">Select Type</option>
            <option value="TOURNAMENT_WIN">Tournament Win</option>
            <option value="TOURNAMENT_RUNNER_UP">Tournament Runner-up</option>
            <option value="MEDAL">Medal</option>
            <option value="CERTIFICATE">Certificate</option>
            <option value="SKILL_MILESTONE">Skill Milestone</option>
            <option value="ATTENDANCE_AWARD">Attendance Award</option>
            <option value="IMPROVEMENT_AWARD">Improvement Award</option>
            <option value="CHAMPIONSHIP">Championship</option>
            <option value="OTHER">Other</option>
          </select>
          <div class="error" *ngIf="achievementForm.get('type')?.touched && achievementForm.get('type')?.errors?.['required']">
            Type is required
          </div>
        </div>

        <!-- Event Name -->
        <div class="form-group">
          <label for="eventName">Event/Competition Name</label>
          <input 
            id="eventName" 
            type="text" 
            formControlName="eventName" 
            class="form-control"
            placeholder="E.g., State Badminton Championship 2026"
          />
        </div>

        <!-- Position -->
        <div class="form-group">
          <label for="position">Position/Rank</label>
          <input 
            id="position" 
            type="text" 
            formControlName="position" 
            class="form-control"
            placeholder="E.g., 1st, 2nd, Gold Medal"
          />
        </div>

        <!-- Achievement Date -->
        <div class="form-group">
          <label for="achievedDate">Achievement Date *</label>
          <input 
            id="achievedDate" 
            type="date" 
            formControlName="achievedDate" 
            class="form-control"
          />
          <div class="error" *ngIf="achievementForm.get('achievedDate')?.touched && achievementForm.get('achievedDate')?.errors?.['required']">
            Achievement date is required
          </div>
        </div>

        <!-- Awarded By -->
        <div class="form-group">
          <label for="awardedBy">Awarded By</label>
          <input 
            id="awardedBy" 
            type="text" 
            formControlName="awardedBy" 
            class="form-control"
            placeholder="E.g., National Badminton Federation"
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            formControlName="description" 
            class="form-control"
            rows="4"
            placeholder="Describe the achievement..."
          ></textarea>
        </div>

        <!-- Certificate Upload -->
        <div class="form-group">
          <label>Certificate/Medal Photo</label>
          <app-image-upload
            [currentImageUrl]="currentCertificateUrl"
            [uploadType]="'achievement'"
            [autoUpload]="false"
            [placeholder]="'Upload certificate or medal photo'"
            (fileSelected)="onCertificateSelected($event)"
            (imageRemoved)="onCertificateRemoved()"
          ></app-image-upload>
          
          <button 
            *ngIf="currentCertificateUrl && isEditMode"
            type="button"
            class="btn-delete-cert"
            (click)="deleteExistingCertificate()"
          >
            Delete Existing Certificate
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-primary" 
            [disabled]="!achievementForm.valid || loading"
          >
            {{ loading ? 'Saving...' : (isEditMode ? 'Update Achievement' : 'Create Achievement') }}
          </button>
          
          <button 
            type="button" 
            class="btn-secondary" 
            (click)="onCancel()"
            [disabled]="loading"
          >
            Cancel
          </button>
        </div>

        <!-- Error Message -->
        <div class="error-message" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <!-- Success Message -->
        <div class="success-message" *ngIf="successMessage">
          {{ successMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [`
    .achievement-form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    h2 {
      margin-bottom: 2rem;
      color: #333;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    select.form-control {
      cursor: pointer;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 100px;
    }

    .error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }

    .btn-delete-cert {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-delete-cert:hover {
      background: #c82333;
    }

    .error-message {
      padding: 1rem;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
      margin-top: 1rem;
    }

    .success-message {
      padding: 1rem;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      color: #155724;
      margin-top: 1rem;
    }
  `]
})
export class AchievementFormComponent implements OnInit {
  @Input() achievementId?: number;
  @Input() studentId?: number;
  @Input() students: any[] = [];
  @Output() saved = new EventEmitter<Achievement>();
  @Output() cancelled = new EventEmitter<void>();

  achievementForm: FormGroup;
  isEditMode = false;
  loading = false;
  certificateFile?: File;
  currentCertificateUrl?: string;
  errorMessage?: string;
  successMessage?: string;

  constructor(
    private fb: FormBuilder,
    private achievementService: AchievementService
  ) {
    this.achievementForm = this.fb.group({
      studentId: [this.studentId || '', Validators.required],
      title: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      eventName: [''],
      position: [''],
      achievedDate: ['', Validators.required],
      awardedBy: ['']
    });
  }

  ngOnInit(): void {
    // Set student ID if provided
    if (this.studentId) {
      this.achievementForm.patchValue({ studentId: this.studentId });
      this.achievementForm.get('studentId')?.disable();
    }

    // Load achievement data if in edit mode
    if (this.achievementId) {
      this.isEditMode = true;
      this.loadAchievement();
    }
  }

  loadAchievement(): void {
    if (!this.achievementId) return;

    this.loading = true;
    this.achievementService.getAchievementById(this.achievementId).subscribe({
      next: (achievement) => {
        this.achievementForm.patchValue({
          studentId: achievement.studentId,
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          eventName: achievement.eventName,
          position: achievement.position,
          achievedDate: achievement.achievedDate,
          awardedBy: achievement.awardedBy
        });
        this.currentCertificateUrl = achievement.certificateUrl;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading achievement:', error);
        this.errorMessage = 'Failed to load achievement';
        this.loading = false;
      }
    });
  }

  onCertificateSelected(file: File): void {
    this.certificateFile = file;
  }

  onCertificateRemoved(): void {
    this.certificateFile = undefined;
  }

  deleteExistingCertificate(): void {
    if (!this.achievementId || !this.currentCertificateUrl) return;

    if (confirm('Are you sure you want to delete this certificate?')) {
      this.achievementService.deleteCertificate(this.achievementId).subscribe({
        next: () => {
          this.currentCertificateUrl = undefined;
          this.successMessage = 'Certificate deleted successfully';
          setTimeout(() => this.successMessage = undefined, 3000);
        },
        error: (error) => {
          console.error('Error deleting certificate:', error);
          this.errorMessage = 'Failed to delete certificate';
        }
      });
    }
  }

  onSubmit(): void {
    if (this.achievementForm.invalid) {
      Object.keys(this.achievementForm.controls).forEach(key => {
        this.achievementForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;

    const achievementData: Achievement = {
      ...this.achievementForm.getRawValue(),
    };

    const operation = this.isEditMode && this.achievementId
      ? this.achievementService.updateAchievement(this.achievementId, achievementData, this.certificateFile)
      : this.achievementService.createAchievement(achievementData, this.certificateFile);

    operation.subscribe({
      next: (achievement) => {
        this.successMessage = `Achievement ${this.isEditMode ? 'updated' : 'created'} successfully!`;
        this.loading = false;
        this.saved.emit(achievement);
        
        // Reset form if creating new
        if (!this.isEditMode) {
          this.achievementForm.reset();
          this.certificateFile = undefined;
          this.currentCertificateUrl = undefined;
        }
      },
      error: (error) => {
        console.error('Error saving achievement:', error);
        this.errorMessage = error?.error?.message || 'Failed to save achievement';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
