import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BatchService } from '../../services/batch.service';
import { Batch } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    SkeletonLoaderComponent,
    ModalComponent
  ],
  templateUrl: './batch-list.component.html',
  styleUrl: './batch-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchListComponent implements OnInit {
  private batchService = inject(BatchService);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  isDeleting = signal(false);
  batches = signal<Batch[]>([]);
  searchQuery = signal('');
  selectedFilter = signal<string>('all');
  activeMenuId = signal<number | null>(null);
  showDeleteModal = signal(false);
  batchToDelete = signal<Batch | null>(null);

  filteredBatches = computed(() => {
    let result = this.batches();
    
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(b => (b.name || '').toLowerCase().includes(query));
    }

    const filter = this.selectedFilter();
    if (filter !== 'all') {
      result = result.filter(b => (b.skillLevel || '') === filter);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadBatches();
    document.addEventListener('click', this.closeMenu.bind(this));
  }

  loadBatches(): void {
    this.isLoading.set(true);
    this.batchService.getBatches().subscribe({
      next: (batches) => {
        this.batches.set(batches);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Failed to load batches');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  toggleMenu(batchId: number): void {
    if (this.activeMenuId() === batchId) {
      this.activeMenuId.set(null);
    } else {
      this.activeMenuId.set(batchId);
    }
  }

  closeMenu(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.batch-menu')) {
      this.activeMenuId.set(null);
    }
  }

  confirmDelete(batch: Batch): void {
    this.batchToDelete.set(batch);
    this.showDeleteModal.set(true);
    this.activeMenuId.set(null);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.batchToDelete.set(null);
  }

  deleteBatch(): void {
    const batch = this.batchToDelete();
    if (!batch) return;

    this.isDeleting.set(true);
    this.batchService.deleteBatch(batch.id).subscribe({
      next: () => {
        this.batches.update(batches => batches.filter(b => b.id !== batch.id));
        this.toastService.success('Batch deleted successfully');
        this.closeDeleteModal();
        this.isDeleting.set(false);
      },
      error: () => {
        this.toastService.error('Failed to delete batch');
        this.isDeleting.set(false);
      }
    });
  }

  formatSkillLevel(level?: string): string {
    if (!level) return 'Unknown';
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  getSkillBadgeVariant(skillLevel?: string): 'primary' | 'success' | 'warning' | 'danger' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      'BEGINNER': 'success',
      'INTERMEDIATE': 'primary',
      'ADVANCED': 'warning',
      'PROFESSIONAL': 'danger'
    };
    return variants[skillLevel || ''] || 'primary';
  }
}
