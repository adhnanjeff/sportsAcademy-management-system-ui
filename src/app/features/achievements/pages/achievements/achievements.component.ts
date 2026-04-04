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
import { ExportService } from '../../../../core/services/export.service';
import { RateLimiterService } from '../../../../core/services/rate-limiter.service';

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
            @if (bulkMode()) {
              <span class="bulk-selected-count">{{ selectedCount() }} selected</span>
              <app-button
                variant="secondary"
                icon="fa-solid fa-xmark"
                (clicked)="toggleBulkMode()"
              >
                Cancel
              </app-button>
            } @else {
              <app-button
                variant="secondary"
                icon="fa-solid fa-check-square"
                (clicked)="toggleBulkMode()"
              >
                Bulk Select
              </app-button>
              <app-button
                variant="secondary"
                icon="fa-solid fa-download"
                (clicked)="exportAll()"
              >
                Export All
              </app-button>
              <app-button
                variant="primary"
                icon="fa-solid fa-plus"
                (clicked)="openAddDialog()"
              >
                Add Achievement
              </app-button>
            }
          }
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      @if (bulkMode() && selectedCount() > 0) {
        <div class="bulk-actions-bar">
          <div class="bulk-info">
            <i class="fa-solid fa-info-circle"></i>
            <span>{{ selectedCount() }} achievement(s) selected</span>
          </div>
          <div class="bulk-actions">
            <button class="bulk-action-btn verify" (click)="bulkVerify()">
              <i class="fa-solid fa-check"></i>
              Verify Selected
            </button>
            <button class="bulk-action-btn export" (click)="exportSelected()">
              <i class="fa-solid fa-download"></i>
              Export Selected
            </button>
            <button class="bulk-action-btn delete" (click)="bulkDelete()">
              <i class="fa-solid fa-trash"></i>
              Delete Selected
            </button>
          </div>
        </div>
      }

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
        @if (bulkMode()) {
          <label class="select-all-checkbox">
            <input 
              type="checkbox" 
              [checked]="allSelected()"
              (change)="toggleSelectAll()"
            />
            <span>Select All ({{ filteredAchievements().length }})</span>
          </label>
        }
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
            <div class="achievement-card" [class.verified]="achievement.isVerified" [class.selected]="isSelected(achievement.id!)">
              <!-- Bulk mode checkbox -->
              @if (bulkMode()) {
                <div class="bulk-checkbox" (click)="toggleSelection(achievement.id!)">
                  <input 
                    type="checkbox" 
                    [checked]="isSelected(achievement.id!)"
                    (click)="$event.stopPropagation()"
                  />
                </div>
              }

              <!-- Instagram-style Header -->
              <div class="card-header">
                <div class="header-left">
                  <div class="student-avatar">
                    <i class="fa-solid fa-user"></i>
                  </div>
                  <div class="header-info">
                    <a [routerLink]="['/dashboard/students', achievement.studentId]" class="student-name">
                      {{ achievement.studentName }}
                    </a>
                    <span class="achievement-date">{{ achievement.achievedDate | date:'MMM d, y' }}</span>
                  </div>
                </div>
                <div class="header-right">
                  @if (canManageAchievements()) {
                    <div class="dropdown-menu">
                      <button class="menu-trigger" (click)="toggleMenu(achievement.id)">
                        <i class="fa-solid fa-ellipsis"></i>
                      </button>
                      @if (openMenuId() === achievement.id) {
                        <div class="menu-dropdown">
                          <button class="menu-item" (click)="editAchievement(achievement); closeMenu()">
                            <i class="fa-solid fa-edit"></i> Edit
                          </button>
                          <button class="menu-item danger" (click)="confirmDelete(achievement); closeMenu()">
                            <i class="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Image -->
              @if (achievement.certificateUrl) {
                <div class="achievement-image" (click)="openImageViewer(achievement.certificateUrl, achievement.title)">
                  <img [src]="achievement.certificateUrl" [alt]="achievement.title" />
                </div>
              } @else {
                <div class="achievement-image placeholder">
                  <i [class]="getTypeIcon(achievement.type)"></i>
                </div>
              }

              <!-- Actions Row -->
              <div class="card-actions">
                <div class="action-buttons">
                  @if (achievement.isVerified) {
                    <span class="verified-badge">
                      <i class="fa-solid fa-check-circle"></i>
                    </span>
                  }
                  <app-badge
                    [text]="formatType(achievement.type)"
                    [variant]="getTypeBadgeVariant(achievement.type)"
                  />
                </div>
                <button class="view-student-btn" [routerLink]="['/dashboard/students', achievement.studentId]">
                  <i class="fa-solid fa-external-link"></i>
                  View Student
                </button>
              </div>

              <!-- Content/Caption -->
              <div class="card-content">
                <h3 class="achievement-title">{{ achievement.title }}</h3>
                @if (achievement.eventName) {
                  <p class="achievement-event">{{ achievement.eventName }}</p>
                }
                @if (achievement.position) {
                  <p class="achievement-position">
                    <i class="fa-solid fa-medal"></i> {{ achievement.position }}
                  </p>
                }
                @if (achievement.awardedBy) {
                  <p class="awarded-by">Awarded by {{ achievement.awardedBy }}</p>
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

    <!-- Delete Confirmation Modal -->
    <app-modal
      [isOpen]="showDeleteDialog()"
      title=""
      size="sm"
      (close)="cancelDelete()"
    >
      <div class="delete-dialog">
        <div class="delete-dialog-icon">
          <i class="fa-solid fa-trash"></i>
        </div>
        <h2>Delete Achievement?</h2>
        <p class="delete-dialog-text">
          You're about to delete <strong>"{{ achievementToDelete()?.title }}"</strong>.
          This action cannot be undone.
        </p>
        <div class="delete-dialog-actions">
          <button class="btn-cancel" (click)="cancelDelete()">Cancel</button>
          <button class="btn-delete" (click)="confirmDeleteAction()">
            <i class="fa-solid fa-trash"></i>
            Delete
          </button>
        </div>
      </div>
    </app-modal>

    <!-- Bulk Delete Confirmation Modal -->
    <app-modal
      [isOpen]="showBulkDeleteDialog()"
      title=""
      size="sm"
      (close)="cancelBulkDelete()"
    >
      <div class="delete-dialog">
        <div class="delete-dialog-icon">
          <i class="fa-solid fa-trash"></i>
        </div>
        <h2>Delete Multiple Achievements?</h2>
        <p class="delete-dialog-text">
          You're about to delete <strong>{{ selectedCount() }} achievement(s)</strong>.
          This action cannot be undone.
        </p>
        <div class="delete-dialog-actions">
          <button class="btn-cancel" (click)="cancelBulkDelete()">Cancel</button>
          <button class="btn-delete" (click)="confirmBulkDelete()">
            <i class="fa-solid fa-trash"></i>
            Delete All
          </button>
        </div>
      </div>
    </app-modal>

    <!-- Image Viewer Modal -->
    @if (showImageViewer()) {
      <div class="image-viewer-backdrop" (click)="closeImageViewer()">
        <div class="image-viewer-container" (click)="$event.stopPropagation()">
          <button class="close-viewer" (click)="closeImageViewer()">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="image-viewer-content">
            <img [src]="viewedImage()?.url" [alt]="viewedImage()?.title" />
            <div class="image-viewer-title">{{ viewedImage()?.title }}</div>
          </div>
        </div>
      </div>
    }
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .bulk-selected-count {
        padding: 8px 16px;
        background: var(--primary-light);
        color: var(--primary-color);
        border-radius: var(--border-radius-md);
        font-weight: 600;
        font-size: 14px;
      }
    }

    .bulk-actions-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: var(--border-radius-lg);
      color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

      .bulk-info {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;

        i {
          font-size: 20px;
        }
      }

      .bulk-actions {
        display: flex;
        gap: 12px;

        .bulk-action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;

          &.verify {
            background: #10b981;
            color: white;

            &:hover {
              background: #059669;
            }
          }

          &.export {
            background: #3b82f6;
            color: white;

            &:hover {
              background: #2563eb;
            }
          }

          &.delete {
            background: #ef4444;
            color: white;

            &:hover {
              background: #dc2626;
            }
          }
        }
      }
    }

    .filters-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .select-all-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;

      &:hover {
        background: var(--gray-50);
      }

      input[type="checkbox"] {
        cursor: pointer;
        width: 18px;
        height: 18px;
      }

      span {
        color: var(--text-primary);
        font-size: 14px;
      }
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
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .achievement-card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      transition: all var(--transition-fast);
      width: 100%;
      position: relative;

      &:hover {
        box-shadow: var(--shadow-md);
      }

      &.verified {
        border-color: var(--success-color);
      }

      &.selected {
        border-color: var(--primary-color);
        border-width: 2px;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .bulk-checkbox {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 10;
        background: white;
        padding: 4px;
        border-radius: var(--border-radius-md);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        cursor: pointer;

        input[type="checkbox"] {
          cursor: pointer;
          width: 20px;
          height: 20px;
          margin: 0;
        }
      }
    }

    /* Instagram-style Header */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .student-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        color: white;
        font-size: 16px;
      }
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .student-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
      text-decoration: none;

      &:hover {
        color: var(--primary-color);
      }
    }

    .achievement-date {
      font-size: 12px;
      color: var(--text-muted);
    }

    .header-right {
      position: relative;
    }

    .dropdown-menu {
      position: relative;
    }

    .menu-trigger {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;

      i {
        font-size: 18px;
        color: var(--text-secondary);
      }

      &:hover {
        background: var(--gray-100);
      }
    }

    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      min-width: 140px;
      z-index: 100;
      overflow: hidden;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-primary);
      transition: background 0.15s ease;

      i {
        width: 16px;
        color: var(--text-muted);
      }

      &:hover {
        background: var(--gray-50);
      }

      &.danger {
        color: var(--danger-color);

        i {
          color: var(--danger-color);
        }

        &:hover {
          background: #fef2f2;
        }
      }
    }

    .achievement-image {
      width: 100%;
      overflow: hidden;
      background: var(--gray-100);
      cursor: pointer;

      img {
        width: 100%;
        height: auto;
        display: block;
        transition: opacity 0.2s ease;
      }

      &:hover {
        img {
          opacity: 0.95;
        }
      }

      &.placeholder {
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: default;

        i {
          font-size: 64px;
          color: var(--gray-300);
        }
      }
    }

    /* Actions Row */
    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .verified-badge {
      color: var(--success-color);
      font-size: 20px;
    }

    .view-student-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-secondary);
      transition: all 0.2s ease;

      &:hover {
        background: var(--gray-50);
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
    }

    /* Content/Caption */
    .card-content {
      padding: 12px 16px 16px;
    }

    .achievement-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 6px 0;
    }

    .achievement-event {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0 0 4px 0;
    }

    .achievement-position {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0 0 4px 0;

      i {
        color: #f59e0b;
        font-size: 14px;
      }
    }

    .awarded-by {
      font-size: 12px;
      color: var(--text-muted);
      margin: 6px 0 0 0;
    }

    /* Delete Dialog - Clean and Simple */
    .delete-dialog {
      text-align: center;
      padding: 24px;
    }

    .delete-dialog-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: #fef2f2;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 24px;
        color: #ef4444;
      }
    }

    .delete-dialog h2 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .delete-dialog-text {
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 20px 0;

      strong {
        color: var(--text-primary);
      }
    }

    .delete-dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn-cancel {
      padding: 10px 24px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--white);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      transition: all 0.2s ease;

      &:hover {
        background: var(--gray-50);
        border-color: var(--gray-300);
      }
    }

    .btn-delete {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 24px;
      border: none;
      border-radius: var(--border-radius);
      background: #ef4444;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: white;
      transition: all 0.2s ease;

      &:hover {
        background: #dc2626;
      }
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

    .image-viewer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    .image-viewer-container {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      animation: zoomIn 0.3s ease;
    }

    .image-viewer-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }
    }

    .image-viewer-title {
      color: white;
      font-size: 18px;
      font-weight: 500;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .close-viewer {
      position: absolute;
      top: -50px;
      right: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
        transform: scale(1.1);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes zoomIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
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
        max-width: 100%;
        padding: 0;
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

      .delete-dialog {
        padding: 20px;
      }

      .delete-dialog-actions {
        flex-direction: column;

        .btn-cancel, .btn-delete {
          width: 100%;
          justify-content: center;
        }
      }

      .card-actions {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
      }

      .view-student-btn {
        justify-content: center;
      }

      .image-viewer-backdrop {
        padding: 10px;
      }

      .close-viewer {
        top: -40px;
        width: 40px;
        height: 40px;
        font-size: 18px;
      }

      .image-viewer-title {
        font-size: 16px;
      }

      .image-viewer-content img {
        max-height: 70vh;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementsComponent implements OnInit {
  private achievementService = inject(AchievementService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private rateLimiter = inject(RateLimiterService);

  isLoading = signal(true);
  achievements = signal<Achievement[]>([]);
  searchQuery = signal('');
  showAddDialog = signal(false);
  showDeleteDialog = signal(false);
  achievementToDelete = signal<Achievement | null>(null);
  showImageViewer = signal(false);
  viewedImage = signal<{ url: string; title: string } | null>(null);
  openMenuId = signal<number | null>(null);

  // Bulk operations
  bulkMode = signal(false);
  selectedAchievements = signal<Set<number>>(new Set());
  showBulkDeleteDialog = signal(false);

  selectedType = '';
  selectedStatus = '';

  selectedCount = computed(() => this.selectedAchievements().size);
  allSelected = computed(() => {
    const filtered = this.filteredAchievements();
    return filtered.length > 0 && filtered.every(a => this.selectedAchievements().has(a.id!));
  });

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

  onAchievementAdded(data: { request: AchievementCreateRequest; file: File | null }): void {
    this.achievementService.createAchievement(data.request, data.file || undefined).subscribe({
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
    return type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  getTypeBadgeVariant(type: AchievementType): 'primary' | 'success' | 'warning' | 'danger' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      'TOURNAMENT_WIN': 'success',
      'TOURNAMENT_RUNNER_UP': 'primary',
      'MEDAL': 'warning',
      'CERTIFICATE': 'primary',
      'SKILL_MILESTONE': 'success',
      'ATTENDANCE_AWARD': 'warning',
      'IMPROVEMENT_AWARD': 'success',
      'CHAMPIONSHIP': 'danger',
      'OTHER': 'primary'
    };
    return variants[type] || 'primary';
  }

  getTypeIcon(type: AchievementType): string {
    const icons: Record<string, string> = {
      'TOURNAMENT_WIN': 'fa-solid fa-trophy',
      'TOURNAMENT_RUNNER_UP': 'fa-solid fa-medal',
      'MEDAL': 'fa-solid fa-medal',
      'CERTIFICATE': 'fa-solid fa-certificate',
      'SKILL_MILESTONE': 'fa-solid fa-star',
      'ATTENDANCE_AWARD': 'fa-solid fa-calendar-check',
      'IMPROVEMENT_AWARD': 'fa-solid fa-chart-line',
      'CHAMPIONSHIP': 'fa-solid fa-crown',
      'OTHER': 'fa-solid fa-award'
    };
    return icons[type] || 'fa-solid fa-award';
  }

  editAchievement(achievement: Achievement): void {
    // TODO: Implement edit functionality
    this.toastService.info('Edit functionality coming soon');
  }

  confirmDelete(achievement: Achievement): void {
    this.achievementToDelete.set(achievement);
    this.showDeleteDialog.set(true);
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.achievementToDelete.set(null);
  }

  confirmDeleteAction(): void {
    const achievement = this.achievementToDelete();
    if (!achievement) return;

    this.deleteAchievement(achievement);
  }

  deleteAchievement(achievement: Achievement): void {
    this.achievementService.deleteAchievement(achievement.id!).subscribe({
      next: () => {
        this.cancelDelete();
        this.toastService.success('Achievement deleted successfully');
        this.loadAchievements();
      },
      error: (error) => {
        console.error('Error deleting achievement:', error);
        this.toastService.error('Failed to delete achievement');
      }
    });
  }

  openImageViewer(url: string, title: string): void {
    this.viewedImage.set({ url, title });
    this.showImageViewer.set(true);
  }

  closeImageViewer(): void {
    this.showImageViewer.set(false);
    this.viewedImage.set(null);
  }

  toggleMenu(achievementId: number): void {
    if (this.openMenuId() === achievementId) {
      this.openMenuId.set(null);
    } else {
      this.openMenuId.set(achievementId);
    }
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  // Bulk Operations
  toggleBulkMode(): void {
    this.bulkMode.update(v => !v);
    if (!this.bulkMode()) {
      this.selectedAchievements.set(new Set());
    }
  }

  toggleSelection(id: number): void {
    this.selectedAchievements.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleSelectAll(): void {
    const filtered = this.filteredAchievements();
    if (this.allSelected()) {
      this.selectedAchievements.set(new Set());
    } else {
      const allIds = new Set(filtered.map(a => a.id!));
      this.selectedAchievements.set(allIds);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedAchievements().has(id);
  }

  bulkDelete(): void {
    if (this.selectedCount() === 0) {
      this.toastService.warning('No achievements selected');
      return;
    }
    this.showBulkDeleteDialog.set(true);
  }

  confirmBulkDelete(): void {
    const ids = Array.from(this.selectedAchievements());
    if (ids.length === 0) return;

    // Rate limiting check
    if (!this.rateLimiter.canPerformAction('bulk-delete', 3, 60000)) {
      const remainingTime = Math.ceil(this.rateLimiter.getRemainingTime('bulk-delete', 60000) / 1000);
      this.toastService.error(`Too many bulk delete attempts. Please wait ${remainingTime} seconds.`);
      return;
    }

    this.achievementService.bulkDeleteAchievements(ids).subscribe({
      next: () => {
        this.showBulkDeleteDialog.set(false);
        this.toastService.success(`Successfully deleted ${ids.length} achievement(s)`);
        this.selectedAchievements.set(new Set());
        this.loadAchievements();
      },
      error: (err: any) => {
        console.error('Bulk delete error:', err);
        this.toastService.error('Failed to delete achievements');
      }
    });
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  bulkVerify(): void {
    const ids = Array.from(this.selectedAchievements());
    if (ids.length === 0) {
      this.toastService.warning('No achievements selected');
      return;
    }

    // Rate limiting check
    if (!this.rateLimiter.canPerformAction('bulk-verify', 5, 60000)) {
      const remainingTime = Math.ceil(this.rateLimiter.getRemainingTime('bulk-verify', 60000) / 1000);
      this.toastService.error(`Too many bulk verify attempts. Please wait ${remainingTime} seconds.`);
      return;
    }

    this.achievementService.bulkVerifyAchievements(ids, true).subscribe({
      next: () => {
        this.toastService.success(`Successfully verified ${ids.length} achievement(s)`);
        this.selectedAchievements.set(new Set());
        this.loadAchievements();
      },
      error: (err: any) => {
        console.error('Bulk verify error:', err);
        this.toastService.error('Failed to verify achievements');
      }
    });
  }

  exportSelected(): void {
    const ids = Array.from(this.selectedAchievements());
    if (ids.length === 0) {
      this.toastService.warning('No achievements selected');
      return;
    }

    const selected = this.achievements().filter(a => ids.includes(a.id!));
    this.exportService.exportToCSV(selected, `achievements_${new Date().toISOString().split('T')[0]}.csv`);
    this.toastService.success(`Exported ${ids.length} achievement(s)`);
  }

  exportAll(): void {
    const filtered = this.filteredAchievements();
    if (filtered.length === 0) {
      this.toastService.warning('No achievements to export');
      return;
    }

    this.exportService.exportToCSV(filtered, `all_achievements_${new Date().toISOString().split('T')[0]}.csv`);
    this.toastService.success(`Exported ${filtered.length} achievement(s)`);
  }
}
