import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card"
      [class.card-hoverable]="hoverable"
      [class.card-clickable]="clickable"
      [class.card-overflow-visible]="allowOverflow"
      [class.card-full-height]="fullHeight"
    >
      @if (title || headerTemplate) {
        <div class="card-header">
          @if (headerTemplate) {
            <ng-content select="[card-header]"></ng-content>
          } @else {
            <div class="card-header-content">
              @if (headerIcon) {
                <div class="card-header-icon" [style.backgroundColor]="headerIconBg">
                  <i [class]="headerIcon"></i>
                </div>
              }
              <div class="card-header-text">
                <h3 class="card-title">{{ title }}</h3>
                @if (subtitle) {
                  <p class="card-subtitle">{{ subtitle }}</p>
                }
              </div>
            </div>
            @if (headerAction) {
              <ng-content select="[card-action]"></ng-content>
            }
          }
        </div>
      }
      
      <div class="card-body" [class.no-padding]="noPadding">
        <ng-content></ng-content>
      </div>
      
      @if (footer) {
        <div class="card-footer">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .card {
      background-color: var(--white);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
      overflow: hidden;
      transition: all var(--transition-normal);
    }

    .card.card-overflow-visible {
      overflow: visible;
    }

    .card.card-full-height {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card-hoverable:hover {
      box-shadow: var(--shadow-md);
    }

    .card-clickable {
      cursor: pointer;

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
    }

    .card-header-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .card-header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius);
      background-color: var(--primary-light);
      color: var(--primary-color);

      i {
        font-size: 18px;
      }
    }

    .card-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .card-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
      margin: 2px 0 0 0;
    }

    .card-body {
      padding: var(--spacing-lg);
      flex: 1;

      &.no-padding {
        padding: 0;
      }
    }

    .card-footer {
      padding: var(--spacing-md) var(--spacing-lg);
      border-top: 1px solid var(--border-color);
      background-color: var(--gray-50);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() headerIcon?: string;
  @Input() headerIconBg?: string;
  @Input() hoverable = false;
  @Input() clickable = false;
  @Input() noPadding = false;
  @Input() headerTemplate = false;
  @Input() headerAction = false;
  @Input() footer = false;
  @Input() allowOverflow = false;
  @Input() fullHeight = false;
}
