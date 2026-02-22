import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AchievementService } from '../../services/achievement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Achievement, AchievementType, AchievementCreateRequest, Role } from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AddAchievementDialogComponent } from '../../components/add-achievement-dialog/add-achievement-dialog.component';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AvatarComponent,
    SkeletonLoaderComponent,
    ModalComponent,
    AddAchievementDialogComponent
  ],
  template: `
    <div class="achievements-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Achievements</h1>
          <p>Track and manage student achievements</p>
        </div>
        <div class="header-actions">
          @if (canManageAchievements()) {
            <app-button
              variant="primary"
              icon="fa-solid fa-plus"
              (clicked)="openAddDialog()"
            >
              Add Achievement
            </app-button>
          }
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <i class="fa-solid fa-search"></i>
          <input
            type="text"
            placeholder="Search achievements..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedType" (change)="applyFilters()" class="filter-select">
            <option value="">All Types</option>
            <option value="TOURNAMENT">Tournament</option>
            <option value="COMPETITION">Competition</option>
            <option value="CERTIFICATION">Certification</option>
            <option value="MILESTONE">Milestone</option>
            <option value="OTHER">Other</option>
          </select>
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Verification</option>
          </select>
        </div>
      </div>

      @if (isLoading()) {
        <div class="achievements-grid">
          <app-skeleton-loader type="card" [count]="6" />
        </div>
      } @else if (filteredAchievements().length === 0) {
        <div class="empty-state-container">
          <div class="empty-state" [class.compact]="hasActiveFilters()">
            <div class="empty-illustration">
              <div class="illustration-circle">
                <i class="fa-solid fa-trophy"></i>
              </div>
              <div class="illustration-dots">
                <span></span><span></span><span></span>
              </div>
            </div>

            @if (hasActiveFilters()) {
              <h3>No achievements match your filters</h3>
              <p>Try another search term or clear filters to view all achievements.</p>
              <button type="button" class="clear-filters-btn" (click)="clearFilters()">
                <i class="fa-solid fa-rotate-left"></i>
                Clear filters
              </button>
            } @else {
              <h3>No achievements created yet</h3>
              <p>Track tournament wins, certifications, and milestones to build each student profile with measurable progress.</p>
              @if (canManageAchievements()) {
                <div class="empty-action">
                  <app-button variant="primary" icon="fa-solid fa-plus" (clicked)="openAddDialog()">
                    Add First Achievement
                  </app-button>
                </div>
              }
              <div class="empty-features">
                <div class="feature-item">
                  <i class="fa-solid fa-medal"></i>
                  <span>Tournament Results</span>
                </div>
                <div class="feature-item">
                  <i class="fa-solid fa-certificate"></i>
                  <span>Skill Certifications</span>
                </div>
                <div class="feature-item">
                  <i class="fa-solid fa-chart-line"></i>
                  <span>Progress Milestones</span>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="achievements-grid">
          @for (achievement of filteredAchievements(); track achievement.id) {
            <div class="achievement-card" [class.verified]="achievement.isVerified">
              @if (achievement.certificateUrl) {
                <div class="achievement-image">
                  <img [src]="achievement.certificateUrl" [alt]="achievement.title" />
                </div>
              } @else {
                <div class="achievement-image placeholder">
                  <i [class]="getTypeIcon(achievement.type)"></i>
                </div>
              }
              
              <div class="achievement-content">
                <div class="achievement-header">
                  <app-badge
                    [text]="formatType(achievement.type)"
                    [variant]="getTypeBadgeVariant(achievement.type)"
                  />
                  @if (achievement.isVerified) {
                    <span class="verified-badge">
                      <i class="fa-solid fa-check-circle"></i> Verified
                    </span>
                  } @else {
                    <span class="pending-badge">
                      <i class="fa-solid fa-clock"></i> Pending
                    </span>
                  }
                </div>

                <h3 class="achievement-title">{{ achievement.title }}</h3>
                
                <a [routerLink]="['/dashboard/students', achievement.studentId]" class="student-link">
                  <i class="fa-solid fa-user"></i>
                  {{ achievement.studentName }}
                </a>

                @if (achievement.eventName) {
                  <p class="achievement-event">
                    <i class="fa-solid fa-flag"></i>
                    {{ achievement.eventName }}
                  </p>
                }

                @if (achievement.position) {
                  <p class="achievement-position">
                    <i class="fa-solid fa-medal"></i>
                    {{ achievement.position }}
                  </p>
                }

                <div class="achievement-footer">
                  <span class="achievement-date">
                    <i class="fa-regular fa-calendar"></i>
                    {{ achievement.achievedDate | date:'MMM d, y' }}
                  </span>
                  @if (achievement.awardedBy) {
                    <span class="awarded-by">by {{ achievement.awardedBy }}</span>
                  }
                </div>

                @if (canManageAchievements()) {
                  <div class="achievement-actions">
                    @if (!achievement.isVerified) {
                      <app-button
                        variant="outline"
                        size="sm"
                        icon="fa-solid fa-check"
                        (clicked)="verifyAchievement(achievement)"
                      >
                        Verify
                      </app-button>
                    }
                    <app-button
                      variant="ghost"
                      size="sm"
                      icon="fa-solid fa-eye"
                      [routerLink]="['/dashboard/students', achievement.studentId]"
                    >
                      View Student
                    </app-button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-add-achievement-dialog
      [isOpen]="showAddDialog()"
      (close)="closeAddDialog()"
      (achievementAdded)="onAchievementAdded($event)"
    />
  `,
  styles: [`
    .achievements-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
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

    .filters-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      flex: 1;
      min-width: 250px;

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

    .filter-group {
      display: flex;
      gap: 12px;
    }

    .filter-select {
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--white);
      font-size: var(--font-size-sm);
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .achievement-card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      transition: all var(--transition-fast);

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      &.verified {
        border-color: var(--success-color);
      }
    }

    .achievement-image {
      height: 180px;
      overflow: hidden;
      background: var(--gray-100);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.placeholder {
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 48px;
          color: var(--gray-300);
        }
      }
    }

    .achievement-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .achievement-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .verified-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-xs);
      color: var(--success-color);
      font-weight: 600;
    }

    .pending-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-xs);
      color: var(--warning-color);
      font-weight: 600;
    }

    .achievement-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .student-link {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--font-size-sm);
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .achievement-event,
    .achievement-position {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;

      i {
        color: var(--text-muted);
        width: 16px;
      }
    }

    .achievement-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1px solid var(--border-color);
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .achievement-date {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .achievement-actions {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
      margin-top: 4px;
    }

    .empty-state-container {
      width: 100%;
    }

    .empty-state {
      padding: 60px 40px;
      text-align: center;
      background: linear-gradient(180deg, var(--white) 0%, #f8fafc 100%);
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius-xl);

      .empty-illustration {
        margin-bottom: 24px;
        position: relative;
        display: inline-block;
      }

      .illustration-circle {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        box-shadow: 0 8px 30px rgba(249, 115, 22, 0.18);
        animation: float 3s ease-in-out infinite;

        i {
          font-size: 36px;
          color: #ea580c;
        }
      }

      .illustration-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 14px;

        span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ea580c;
          opacity: 0.3;
          animation: pulse-dot 1.5s ease-in-out infinite;

          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }

      h3 {
        font-size: var(--font-size-xl);
        color: var(--text-primary);
        margin: 0 0 12px;
        font-weight: 700;
      }

      p {
        color: var(--text-muted);
        margin: 0 auto 20px;
        max-width: 470px;
        line-height: 1.6;
      }
    }

    .empty-state.compact {
      padding: 48px 28px;
      border-style: solid;
      background: var(--white);

      .illustration-circle {
        width: 82px;
        height: 82px;
        box-shadow: 0 6px 22px rgba(249, 115, 22, 0.14);

        i {
          font-size: 30px;
        }
      }
    }

    .empty-action {
      margin-bottom: 24px;
    }

    .empty-features {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 4px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      flex-wrap: wrap;
    }

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
      font-size: var(--font-size-sm);

      i {
        font-size: 20px;
        color: #ea580c;
        opacity: 0.8;
      }
    }

    .clear-filters-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 10px 16px;
      background: var(--white);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background: var(--primary-light);
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.2); }
    }

    @media (max-width: 768px) {
      .achievements-grid {
        grid-template-columns: 1fr;
      }

      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        flex-wrap: wrap;
      }

      .empty-state {
        padding: 48px 20px;
      }

      .empty-features {
        gap: 18px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementsComponent implements OnInit {
  private achievementService = inject(AchievementService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  isLoading = signal(true);
  achievements = signal<Achievement[]>([]);
  searchQuery = signal('');
  showAddDialog = signal(false);

  selectedType = '';
  selectedStatus = '';

  filteredAchievements = computed(() => {
    let filtered = this.achievements();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.studentName?.toLowerCase().includes(query) ||
        a.eventName?.toLowerCase().includes(query)
      );
    }

    if (this.selectedType) {
      filtered = filtered.filter(a => a.type === this.selectedType);
    }

    if (this.selectedStatus) {
      if (this.selectedStatus === 'verified') {
        filtered = filtered.filter(a => a.isVerified);
      } else if (this.selectedStatus === 'pending') {
        filtered = filtered.filter(a => !a.isVerified);
      }
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadAchievements();
  }

  loadAchievements(): void {
    this.isLoading.set(true);
    this.achievementService.getAllAchievements().subscribe({
      next: (achievements) => {
        this.achievements.set(achievements);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Failed to load achievements');
      }
    });
  }

  canManageAchievements(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === Role.ADMIN || role === Role.COACH;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  applyFilters(): void {
    // Filters are applied via computed signal
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery().trim() || this.selectedType || this.selectedStatus);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedType = '';
    this.selectedStatus = '';
  }

  openAddDialog(): void {
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  onAchievementAdded(request: AchievementCreateRequest): void {
    this.achievementService.createAchievement(request).subscribe({
      next: (achievement) => {
        this.achievements.update(list => [achievement, ...list]);
        this.closeAddDialog();
        this.toastService.success('Achievement added successfully');
      },
      error: () => {
        this.toastService.error('Failed to add achievement');
      }
    });
  }

  verifyAchievement(achievement: Achievement): void {
    this.achievementService.verifyAchievement(achievement.id).subscribe({
      next: (updated) => {
        this.achievements.update(list => 
          list.map(a => a.id === updated.id ? updated : a)
        );
        this.toastService.success('Achievement verified');
      },
      error: () => {
        this.toastService.error('Failed to verify achievement');
      }
    });
  }

  formatType(type: AchievementType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  getTypeBadgeVariant(type: AchievementType): 'primary' | 'success' | 'warning' | 'danger' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      'TOURNAMENT': 'primary',
      'COMPETITION': 'success',
      'CERTIFICATION': 'warning',
      'MILESTONE': 'danger',
      'OTHER': 'primary'
    };
    return variants[type] || 'primary';
  }

  getTypeIcon(type: AchievementType): string {
    const icons: Record<string, string> = {
      'TOURNAMENT': 'fa-solid fa-trophy',
      'COMPETITION': 'fa-solid fa-medal',
      'CERTIFICATION': 'fa-solid fa-certificate',
      'MILESTONE': 'fa-solid fa-star',
      'OTHER': 'fa-solid fa-award'
    };
    return icons[type] || 'fa-solid fa-award';
  }
}
