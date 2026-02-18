import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { Student, Role } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AvatarComponent,
    ModalComponent
  ],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentListComponent implements OnInit {
  private studentService = inject(StudentService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  isLoading = signal(true);
  isDeleting = signal(false);
  students = signal<Student[]>([]);
  searchQuery = signal('');
  statusFilter = signal('all');
  skillFilter = signal('all');
  currentPage = signal(1);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 20, 50];
  skeletonRows = computed(() => Array.from({ length: this.pageSize() }, (_, i) => i));
  showDeleteModal = signal(false);
  studentToDelete = signal<Student | null>(null);

  filteredStudents = computed(() => {
    let result = this.students();
    
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(s =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        s.nationalIdNumber?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
      );
    }

    const status = this.statusFilter();
    if (status !== 'all') {
      result = result.filter(s => s.status === status);
    }

    const skill = this.skillFilter();
    if (skill !== 'all') {
      result = result.filter(s => s.skillLevel === skill);
    }

    return result;
  });

  canManageStudents = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === Role.ADMIN || role === Role.COACH;
  });

  totalRecords = computed(() => this.filteredStudents().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalRecords() / this.pageSize())));
  activePage = computed(() => Math.min(this.currentPage(), this.totalPages()));

  paginatedStudents = computed(() => {
    const students = this.filteredStudents();
    const size = this.pageSize();
    const page = this.activePage();
    const start = (page - 1) * size;
    return students.slice(start, start + size);
  });

  startRecord = computed(() => {
    if (this.totalRecords() === 0) return 0;
    return (this.activePage() - 1) * this.pageSize() + 1;
  });

  endRecord = computed(() => {
    if (this.totalRecords() === 0) return 0;
    return Math.min(this.activePage() * this.pageSize(), this.totalRecords());
  });

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.studentService.getStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load students');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
  }

  onStatusFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
    this.currentPage.set(1);
  }

  onSkillFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.skillFilter.set(select.value);
    this.currentPage.set(1);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const size = Number(select.value);
    if (Number.isNaN(size) || size <= 0) return;
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  nextPage(): void {
    this.goToPage(this.activePage() + 1);
  }

  previousPage(): void {
    this.goToPage(this.activePage() - 1);
  }

  confirmDelete(student: Student): void {
    this.studentToDelete.set(student);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.studentToDelete.set(null);
  }

  deleteStudent(): void {
    const student = this.studentToDelete();
    if (!student) return;

    this.isDeleting.set(true);
    this.studentService.deleteStudent(student.id).subscribe({
      next: () => {
        this.students.update(students => students.filter(s => s.id !== student.id));
        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
        this.toastService.success('Student deleted successfully');
        this.closeDeleteModal();
        this.isDeleting.set(false);
      },
      error: () => {
        this.toastService.error('Failed to delete student');
        this.isDeleting.set(false);
      }
    });
  }

  formatSkillLevel(level: string): string {
    if (!level) return 'N/A';
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
