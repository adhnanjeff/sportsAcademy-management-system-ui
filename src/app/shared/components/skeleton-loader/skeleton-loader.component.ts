import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export type SkeletonLoaderType = 'card' | 'list' | 'table' | 'stats' | 'profile' | 'form';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="skeleton-loader" [class]="'type-' + type">
      @switch (type) {
        @case ('card') {
          <div class="skeleton-cards">
            @for (i of getArray(count); track i) {
              <div class="skeleton-card fade-in" [style.animationDelay]="i * 0.1 + 's'">
                <app-skeleton variant="rectangular" height="120px" />
                <div class="skeleton-card-body">
                  <app-skeleton variant="text" width="70%" />
                  <app-skeleton variant="text" width="50%" />
                  <div class="skeleton-card-footer">
                    <app-skeleton variant="circular" width="32px" height="32px" />
                    <app-skeleton variant="text" width="80px" />
                  </div>
                </div>
              </div>
            }
          </div>
        }
        @case ('list') {
          <div class="skeleton-list">
            @for (i of getArray(count); track i) {
              <div class="skeleton-list-item fade-in" [style.animationDelay]="i * 0.05 + 's'">
                <app-skeleton variant="circular" width="48px" height="48px" />
                <div class="skeleton-list-content">
                  <app-skeleton variant="text" width="60%" />
                  <app-skeleton variant="text" width="40%" height="12px" />
                </div>
                <app-skeleton variant="button" width="80px" height="32px" />
              </div>
            }
          </div>
        }
        @case ('table') {
          <div class="skeleton-table">
            <div class="skeleton-table-header">
              @for (i of getArray(columns); track i) {
                <app-skeleton variant="text" width="100px" />
              }
            </div>
            @for (row of getArray(count); track row) {
              <div class="skeleton-table-row fade-in" [style.animationDelay]="row * 0.05 + 's'">
                @for (i of getArray(columns); track i) {
                  <app-skeleton variant="text" [width]="getRandomWidth()" />
                }
              </div>
            }
          </div>
        }
        @case ('stats') {
          <div class="skeleton-stats">
            @for (i of getArray(count); track i) {
              <div class="skeleton-stat-card fade-in" [style.animationDelay]="i * 0.1 + 's'">
                <div class="skeleton-stat-icon">
                  <app-skeleton variant="circular" width="48px" height="48px" />
                </div>
                <div class="skeleton-stat-content">
                  <app-skeleton variant="text" width="80px" height="12px" />
                  <app-skeleton variant="text" width="60px" height="28px" />
                </div>
              </div>
            }
          </div>
        }
        @case ('profile') {
          <div class="skeleton-profile fade-in">
            <div class="skeleton-profile-header">
              <app-skeleton variant="circular" width="100px" height="100px" />
              <div class="skeleton-profile-info">
                <app-skeleton variant="text" width="200px" height="24px" />
                <app-skeleton variant="text" width="150px" />
                <app-skeleton variant="text" width="180px" />
              </div>
            </div>
            <div class="skeleton-profile-body">
              @for (i of getArray(4); track i) {
                <app-skeleton variant="text" width="100%" />
              }
            </div>
          </div>
        }
        @case ('form') {
          <div class="skeleton-form fade-in">
            @for (i of getArray(count); track i) {
              <div class="skeleton-form-group" [style.animationDelay]="i * 0.1 + 's'">
                <app-skeleton variant="text" width="120px" height="14px" />
                <app-skeleton variant="rectangular" width="100%" height="44px" />
              </div>
            }
            <div class="skeleton-form-actions">
              <app-skeleton variant="button" width="100px" />
              <app-skeleton variant="button" width="140px" />
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-loader {
      width: 100%;
    }

    /* Fade in animation */
    .fade-in {
      opacity: 0;
      animation: skeletonFadeIn 0.3s ease-out forwards;
    }

    @keyframes skeletonFadeIn {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Card skeleton */
    .skeleton-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .skeleton-card {
      background: var(--white);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    .skeleton-card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-card-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }

    /* List skeleton */
    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--white);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
    }

    .skeleton-list-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Table skeleton */
    .skeleton-table {
      background: var(--white);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .skeleton-table-header {
      display: flex;
      gap: 24px;
      padding: 16px 20px;
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
    }

    .skeleton-table-row {
      display: flex;
      gap: 24px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }
    }

    /* Stats skeleton */
    .skeleton-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }

    .skeleton-stat-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: var(--white);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
    }

    .skeleton-stat-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Profile skeleton */
    .skeleton-profile {
      background: var(--white);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      padding: 24px;
    }

    .skeleton-profile-header {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .skeleton-profile-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-profile-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Form skeleton */
    .skeleton-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: var(--white);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      padding: 24px;
    }

    .skeleton-form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skeleton-form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 12px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .skeleton-cards {
        grid-template-columns: 1fr;
      }

      .skeleton-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .skeleton-profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .skeleton-table-header,
      .skeleton-table-row {
        gap: 12px;
        padding: 12px 16px;
      }
    }

    @media (max-width: 480px) {
      .skeleton-stats {
        grid-template-columns: 1fr;
      }

      .skeleton-form-actions {
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonLoaderType = 'card';
  @Input() count = 3;
  @Input() columns = 5;

  getArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  getRandomWidth(): string {
    const widths = ['60%', '70%', '80%', '50%', '90%'];
    return widths[Math.floor(Math.random() * widths.length)];
  }
}
