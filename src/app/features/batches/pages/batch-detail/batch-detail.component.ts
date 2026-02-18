import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BatchService } from '../../services/batch.service';
import { StudentService } from '../../../students/services/student.service';
import { Batch, Student } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-batch-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AvatarComponent,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="batch-detail-page">
      @if (isLoading()) {
        <app-skeleton-loader type="profile" />
        <app-skeleton-loader type="stats" [count]="2" />
        <app-skeleton-loader type="table" [count]="6" [columns]="5" />
      } @else if (batch()) {
        <div class="page-header">
          <button class="back-btn" (click)="goBack()">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="header-content">
            <div class="header-title">
              <h1>{{ batch()?.name }}</h1>
              <app-badge
                [text]="formatSkillLevel(batch()?.skillLevel || '')"
                [variant]="getSkillBadgeVariant(batch()?.skillLevel || '')"
              />
            </div>
            <p>{{ batch()?.description || 'No description available' }}</p>
          </div>
          <div class="header-actions">
            <app-button variant="outline" icon="fa-solid fa-pen" [routerLink]="['edit']">
              Edit
            </app-button>
            <app-button variant="primary" icon="fa-solid fa-clipboard-check" routerLink="/dashboard/attendance/mark">
              Mark Attendance
            </app-button>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <i class="fa-solid fa-users"></i>
            <div class="stat-content">
              <span class="stat-value">{{ batch()?.totalStudents }}</span>
              <span class="stat-label">Students</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="fa-regular fa-clock"></i>
            <div class="stat-content">
              <span class="stat-value">{{ batch()?.startTime }} - {{ batch()?.endTime }}</span>
              <span class="stat-label">Schedule</span>
            </div>
          </div>
        </div>

        <!-- Students Section -->
        <app-card title="Students" icon="fa-solid fa-users">
          <a routerLink="/dashboard/students/new" [queryParams]="{ batchId: batch()?.id }" slot="action" class="add-student-btn">
            <i class="fa-solid fa-plus"></i>
            Add Student
          </a>
          
          @if (isLoadingStudents()) {
            <app-skeleton-loader type="table" [count]="4" [columns]="5" />
          } @else {
            <div class="students-table-wrapper">
              <table class="students-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Skill Level</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (student of students(); track student.id) {
                    <tr>
                      <td>
                        <div class="student-cell">
                          <app-avatar [name]="student.firstName + ' ' + student.lastName" size="sm" />
                          <span>{{ student.firstName }} {{ student.lastName }}</span>
                        </div>
                      </td>
                      <td>{{ student.phone }}</td>
                      <td>
                        <app-badge
                          [text]="formatSkillLevel(student.skillLevel || '')"
                          [variant]="getSkillBadgeVariant(student.skillLevel || '')"
                          size="sm"
                        />
                      </td>
                      <td>
                        <app-badge
                          [text]="student.status || 'ACTIVE'"
                          [variant]="student.status === 'ACTIVE' ? 'success' : 'warning'"
                          size="sm"
                        />
                      </td>
                      <td>
                        <a [routerLink]="['/dashboard/students', student.id]" class="action-btn">
                          <i class="fa-solid fa-eye"></i>
                        </a>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="empty-row">
                        <i class="fa-regular fa-user"></i>
                        <p>No students in this batch</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </app-card>
      } @else {
        <div class="not-found">
          <i class="fa-regular fa-folder-open"></i>
          <h2>Batch Not Found</h2>
          <p>The batch you're looking for doesn't exist.</p>
          <app-button variant="primary" routerLink="/dashboard/batches">Back to Batches</app-button>
        </div>
      }
    </div>
  `,
  styles: [`
    .batch-detail-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
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
      flex-shrink: 0;

      &:hover {
        background-color: var(--gray-100);
        color: var(--text-primary);
      }
    }

    .header-content {
      flex: 1;
      min-width: 200px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;

      h1 {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .header-content p {
      color: var(--text-muted);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

      i {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-light);
        color: var(--primary-color);
        border-radius: 50%;
        font-size: 18px;
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .add-student-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--primary-color);
      transition: opacity var(--transition-fast);

      &:hover {
        opacity: 0.8;
      }
    }

    .students-table-wrapper {
      overflow-x: auto;
    }

    .students-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 12px 16px;
        text-align: left;
      }

      th {
        font-weight: 600;
        font-size: var(--font-size-sm);
        color: var(--text-muted);
        border-bottom: 1px solid var(--border-color);
      }

      td {
        border-bottom: 1px solid var(--border-color);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      tbody tr:hover {
        background-color: var(--gray-50);
      }
    }

    .student-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius);
      color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--gray-100);
        color: var(--primary-color);
      }
    }

    .empty-row {
      text-align: center;
      padding: 40px 20px !important;

      i {
        font-size: 32px;
        color: var(--gray-300);
        margin-bottom: 12px;
        display: block;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .not-found {
      padding: 80px 40px;
      text-align: center;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

      i {
        font-size: 64px;
        color: var(--gray-300);
        margin-bottom: 20px;
      }

      h2 {
        font-size: var(--font-size-xl);
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0 0 24px 0;
      }
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private batchService = inject(BatchService);
  private studentService = inject(StudentService);

  isLoading = signal(true);
  isLoadingStudents = signal(true);
  batch = signal<Batch | null>(null);
  students = signal<Student[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBatch(parseInt(id));
    }
  }

  loadBatch(id: number): void {
    this.batchService.getBatchById(id).subscribe({
      next: (batch) => {
        this.batch.set(batch || null);
        this.isLoading.set(false);
        if (batch) {
          this.loadStudents(batch.id);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadStudents(batchId: number): void {
    this.studentService.getStudentsByBatch(batchId).subscribe({
      next: (students) => {
        this.students.set(students);
        this.isLoadingStudents.set(false);
      },
      error: () => {
        this.isLoadingStudents.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/batches']);
  }

  formatSkillLevel(level: string): string {
    if (!level) return '';
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  getSkillBadgeVariant(skillLevel: string): 'primary' | 'success' | 'warning' | 'danger' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      'BEGINNER': 'success',
      'INTERMEDIATE': 'primary',
      'ADVANCED': 'warning',
      'PROFESSIONAL': 'danger'
    };
    return variants[skillLevel] || 'primary';
  }
}
