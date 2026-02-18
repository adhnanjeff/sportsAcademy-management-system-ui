import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="avatarClasses" [title]="name">
      @if (src) {
        <img [src]="src" [alt]="name" class="avatar-image" />
      } @else {
        <span class="avatar-initials">{{ initials }}</span>
      }
      @if (status) {
        <span [class]="'avatar-status status-' + status"></span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    div {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--primary-light);
      color: var(--primary-color);
      font-weight: 600;
      overflow: hidden;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      text-transform: uppercase;
    }

    /* Sizes */
    .avatar-xs {
      width: 24px;
      height: 24px;
      font-size: 10px;
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }

    .avatar-md {
      width: 40px;
      height: 40px;
      font-size: 14px;
    }

    .avatar-lg {
      width: 48px;
      height: 48px;
      font-size: 16px;
    }

    .avatar-xl {
      width: 64px;
      height: 64px;
      font-size: 20px;
    }

    .avatar-status {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 25%;
      height: 25%;
      min-width: 8px;
      min-height: 8px;
      border-radius: 50%;
      border: 2px solid var(--white);
    }

    .status-online {
      background-color: var(--success-color);
    }

    .status-offline {
      background-color: var(--gray-400);
    }

    .status-busy {
      background-color: var(--danger-color);
    }

    .status-away {
      background-color: var(--warning-color);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() name = '';
  @Input() size: AvatarSize = 'md';
  @Input() status?: 'online' | 'offline' | 'busy' | 'away';

  get initials(): string {
    if (!this.name) return '?';
    const names = this.name.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2);
    }
    return names[0][0] + names[names.length - 1][0];
  }

  get avatarClasses(): string {
    return `avatar-${this.size}`;
  }
}
