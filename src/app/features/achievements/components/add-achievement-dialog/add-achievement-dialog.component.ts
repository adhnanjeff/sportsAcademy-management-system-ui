import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { StudentService } from '../../../students/services/student.service';
import { Student, AchievementType, AchievementCreateRequest } from '../../../../core/models';

@Component({
  selector: 'app-add-achievement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent
  ],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Add Achievement"
      size="lg"
      (close)="onClose()"
    >
      <div class="dialog-content">
        <!-- Step 1: Select Student -->
        @if (currentStep() === 1) {
          <div class="step-content">
            <div class="step-header">
              <span class="step-indicator">Step 1 of 2</span>
              <h3>Select Student</h3>
              <p>Search and select a student to add an achievement for</p>
            </div>

            <div class="search-box">
              <i class="fa-solid fa-search"></i>
              <input
                type="text"
                placeholder="Search by student name..."
                [value]="searchQuery()"
                (input)="onSearch($event)"
              />
            </div>

            <div class="student-list">
              @for (student of filteredStudents(); track student.id) {
                <button
                  type="button"
                  class="student-item"
                  [class.selected]="selectedStudent()?.id === student.id"
                  (click)="selectStudent(student)"
                >
                  <app-avatar [name]="student.firstName + ' ' + student.lastName" size="sm" />
                  <div class="student-info">
                    <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
                    <span class="student-batch">{{ student.batchNames?.join(', ') || 'No batch assigned' }}</span>
                  </div>
                  @if (selectedStudent()?.id === student.id) {
                    <i class="fa-solid fa-check selected-check"></i>
                  }
                </button>
              } @empty {
                <div class="empty-state">
                  <i class="fa-solid fa-users-slash"></i>
                  <p>No students found</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Step 2: Achievement Details -->
        @if (currentStep() === 2) {
          <div class="step-content">
            <div class="step-header">
              <span class="step-indicator">Step 2 of 2</span>
              <h3>Achievement Details</h3>
              <p>Fill in the achievement information for {{ selectedStudent()?.firstName }} {{ selectedStudent()?.lastName }}</p>
            </div>

            <div class="form-grid">
              <div class="form-group full-width">
                <label for="title">Achievement Title <span class="required">*</span></label>
                <input
                  type="text"
                  id="title"
                  [(ngModel)]="achievementForm.title"
                  placeholder="e.g., District Championship Winner"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="type">Achievement Type <span class="required">*</span></label>
                <select id="type" [(ngModel)]="achievementForm.type" class="form-select">
                  <option value="">Select type</option>
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
              </div>

              <div class="form-group">
                <label for="achievedDate">Date Achieved <span class="required">*</span></label>
                <input
                  type="date"
                  id="achievedDate"
                  [(ngModel)]="achievementForm.achievedDate"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="eventName">Event Name</label>
                <input
                  type="text"
                  id="eventName"
                  [(ngModel)]="achievementForm.eventName"
                  placeholder="e.g., State Badminton Championship 2026"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="position">Position/Rank</label>
                <input
                  type="text"
                  id="position"
                  [(ngModel)]="achievementForm.position"
                  placeholder="e.g., 1st Place, Gold Medal"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="awardedBy">Awarded By</label>
                <input
                  type="text"
                  id="awardedBy"
                  [(ngModel)]="achievementForm.awardedBy"
                  placeholder="e.g., State Badminton Association"
                  class="form-input"
                />
              </div>

              <div class="form-group full-width">
                <label for="description">Description</label>
                <textarea
                  id="description"
                  [(ngModel)]="achievementForm.description"
                  placeholder="Add any additional details about this achievement..."
                  rows="3"
                  class="form-textarea"
                ></textarea>
              </div>

              <!-- Image Upload Section -->
              <div class="form-group full-width">
                <label>Achievement Photo</label>
                <div class="image-upload-container">
                  @if (previewImageUrl()) {
                    <div class="image-preview">
                      <img [src]="previewImageUrl()" alt="Achievement preview" />
                      <button type="button" class="remove-image-btn" (click)="removeImage()">
                        <i class="fa-solid fa-times"></i>
                      </button>
                    </div>
                  } @else {
                    <div class="upload-placeholder" (click)="triggerFileInput()">
                      <i class="fa-solid fa-camera"></i>
                      <p>Click to upload photo of student with prize</p>
                      <span class="upload-hint">Supports: JPG, PNG (Max 5MB)</span>
                    </div>
                  }
                  <input
                    #fileInput
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    (change)="onFileSelected($event)"
                    class="hidden-input"
                  />
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="dialog-actions" slot="footer">
        @if (currentStep() === 1) {
          <app-button variant="outline" (clicked)="onClose()">Cancel</app-button>
          <app-button
            variant="primary"
            [disabled]="!selectedStudent()"
            (clicked)="nextStep()"
          >
            Next
          </app-button>
        } @else {
          <app-button variant="outline" (clicked)="prevStep()">Back</app-button>
          <app-button
            variant="primary"
            icon="fa-solid fa-trophy"
            [loading]="isSubmitting()"
            [disabled]="!isFormValid()"
            (clicked)="submitAchievement()"
          >
            Add Achievement
          </app-button>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .dialog-content {
      padding: 0;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .step-header {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);

      .step-indicator {
        display: inline-block;
        padding: 4px 12px;
        background: var(--primary-light);
        color: var(--primary-color);
        border-radius: 20px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        margin-bottom: 8px;
      }

      h3 {
        margin: 0 0 4px 0;
        font-size: var(--font-size-lg);
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-muted);
        font-size: var(--font-size-sm);
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

      i {
        color: var(--text-muted);
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: var(--font-size-base);
        outline: none;

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }

    .student-list {
      max-height: 300px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .student-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--white);
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      text-align: left;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-color);
        background: var(--primary-light);
      }

      &.selected {
        border-color: var(--primary-color);
        background: var(--primary-light);
      }
    }

    .student-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .student-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .student-batch {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .selected-check {
      color: var(--primary-color);
      font-size: 18px;
    }

    .empty-state {
      padding: 40px;
      text-align: center;

      i {
        font-size: 40px;
        color: var(--gray-300);
        margin-bottom: 12px;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
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
        font-weight: 500;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
      }

      .required {
        color: var(--danger-color);
      }
    }

    .form-input,
    .form-select,
    .form-textarea {
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      background: var(--white);
      transition: border-color var(--transition-fast);

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .image-upload-container {
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
    }

    .upload-placeholder {
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--gray-50);
        border-color: var(--primary-color);
      }

      i {
        font-size: 40px;
        color: var(--text-muted);
        margin-bottom: 12px;
      }

      p {
        margin: 0 0 4px 0;
        color: var(--text-primary);
        font-weight: 500;
      }

      .upload-hint {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
      }
    }

    .image-preview {
      position: relative;
      
      img {
        width: 100%;
        max-height: 200px;
        object-fit: cover;
      }

      .remove-image-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background var(--transition-fast);

        &:hover {
          background: var(--danger-color);
        }
      }
    }

    .hidden-input {
      display: none;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAchievementDialogComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() achievementAdded = new EventEmitter<{ request: AchievementCreateRequest; file: File | null }>();

  private studentService = inject(StudentService);

  currentStep = signal(1);
  searchQuery = signal('');
  students = signal<Student[]>([]);
  selectedStudent = signal<Student | null>(null);
  isSubmitting = signal(false);
  previewImageUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  achievementForm: Partial<AchievementCreateRequest> = {
    title: '',
    type: undefined,
    achievedDate: '',
    eventName: '',
    position: '',
    description: '',
    awardedBy: ''
  };

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allStudents = this.students();
    
    if (!query) return allStudents;
    
    return allStudents.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.studentService.getStudents().subscribe({
      next: (students) => this.students.set(students)
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  selectStudent(student: Student): void {
    this.selectedStudent.set(student);
  }

  nextStep(): void {
    this.currentStep.set(2);
  }

  prevStep(): void {
    this.currentStep.set(1);
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      this.selectedFile.set(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImageUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.previewImageUrl.set(null);
    this.selectedFile.set(null);
  }

  isFormValid(): boolean {
    return !!(
      this.achievementForm.title &&
      this.achievementForm.type &&
      this.achievementForm.achievedDate &&
      this.selectedStudent()
    );
  }

  submitAchievement(): void {
    if (!this.isFormValid() || !this.selectedStudent()) return;

    this.isSubmitting.set(true);

    const request: AchievementCreateRequest = {
      studentId: this.selectedStudent()!.id,
      title: this.achievementForm.title!,
      type: this.achievementForm.type as AchievementType,
      achievedDate: this.achievementForm.achievedDate!,
      description: this.achievementForm.description,
      eventName: this.achievementForm.eventName,
      position: this.achievementForm.position,
      awardedBy: this.achievementForm.awardedBy
    };

    this.achievementAdded.emit({ request, file: this.selectedFile() });
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.currentStep.set(1);
    this.searchQuery.set('');
    this.selectedStudent.set(null);
    this.previewImageUrl.set(null);
    this.selectedFile.set(null);
    this.isSubmitting.set(false);
    this.achievementForm = {
      title: '',
      type: undefined,
      achievedDate: '',
      eventName: '',
      position: '',
      description: '',
      awardedBy: ''
    };
  }
}
