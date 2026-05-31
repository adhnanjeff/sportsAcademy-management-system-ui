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
  sortColumn = signal<string>('');
  sortDir = signal<'asc' | 'desc'>('asc');

  filteredStudents = computed(() => {
    let result = this.students();
    
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(s =>
        s.firstName?.toLowerCase().includes(query) ||
        s.lastName?.toLowerCase().includes(query) ||
        s.fullName?.toLowerCase().includes(query) ||
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

    const col = this.sortColumn();
    if (col) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';
        if (col === 'name') {
          valA = (a.firstName + ' ' + (a.lastName || '')).toLowerCase();
          valB = (b.firstName + ' ' + (b.lastName || '')).toLowerCase();
        } else if (col === 'batch') {
          valA = (a.batchName || '').toLowerCase();
          valB = (b.batchName || '').toLowerCase();
        } else if (col === 'skillLevel') {
          valA = (a.skillLevel || '').toLowerCase();
          valB = (b.skillLevel || '').toLowerCase();
        } else if (col === 'status') {
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
        } else if (col === 'joinDate') {
          valA = a.joinDate ? new Date(a.joinDate).getTime() : 0;
          valB = b.joinDate ? new Date(b.joinDate).getTime() : 0;
        }
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
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

  sortBy(col: string): void {
    if (this.sortColumn() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
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

  confirmDeactivate(student: Student): void {
    this.studentToDelete.set(student);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.studentToDelete.set(null);
  }

  deactivateStudent(): void {
    const student = this.studentToDelete();
    if (!student) return;

    this.isDeleting.set(true);
    this.studentService.deactivateStudent(student.id).subscribe({
      next: () => {
        // Update local state - mark student as inactive instead of removing
        this.students.update(students => 
          students.map(s => s.id === student.id ? { ...s, isActive: false, status: 'INACTIVE' } : s)
        );
        this.toastService.success('Student deactivated successfully');
        this.closeDeleteModal();
        this.isDeleting.set(false);
      },
      error: () => {
        this.toastService.error('Failed to deactivate student');
        this.isDeleting.set(false);
      }
    });
  }

  activateStudent(student: Student): void {
    this.studentService.activateStudent(student.id).subscribe({
      next: () => {
        // Update local state - mark student as active
        this.students.update(students => 
          students.map(s => s.id === student.id ? { ...s, isActive: true, status: 'ACTIVE' } : s)
        );
        this.toastService.success('Student activated successfully');
      },
      error: () => {
        this.toastService.error('Failed to activate student');
      }
    });
  }

  // Keep for backwards compatibility
  confirmDelete(student: Student): void {
    this.confirmDeactivate(student);
  }

  deleteStudent(): void {
    this.deactivateStudent();
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
