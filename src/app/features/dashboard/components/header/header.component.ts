import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { User, Notification } from '../../../../core/models';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private readonly elementRef = inject(ElementRef);

  @Input() user?: User;
  @Input() sidebarCollapsed = false;
  @Output() menuToggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  showNotifications = signal(false);
  showUserMenu = signal(false);
  unreadCount = signal(2);

  notifications: Notification[] = [
    {
      id: 1,
      title: 'New Student Enrollment',
      message: 'Rahul Sharma has enrolled in Beginner Batch A',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'Achievement Unlocked',
      message: 'Priya achieved 50 Days Streak',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      title: 'Reminder',
      message: 'Advanced Batch class starts in 1 hour',
      type: 'warning',
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showNotifications.set(false);
      this.showUserMenu.set(false);
    }
  }

  toggleNotifications(): void {
    this.showUserMenu.set(false);
    this.showNotifications.update(v => !v);
  }

  toggleUserMenu(): void {
    this.showNotifications.set(false);
    this.showUserMenu.update(v => !v);
  }

  onSearchFocus(): void {
    // TODO: Implement search modal
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    this.unreadCount.set(0);
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      this.unreadCount.update(v => Math.max(0, v - 1));
    }
    // TODO: Navigate to notification link
    this.showNotifications.set(false);
  }

  getNotificationIcon(type: Notification['type']): string {
    const icons: Record<Notification['type'], string> = {
      info: 'fa-solid fa-info',
      success: 'fa-solid fa-check',
      warning: 'fa-solid fa-exclamation',
      error: 'fa-solid fa-xmark'
    };
    return icons[type];
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  formatRole(role?: string): string {
    if (!role) return '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  onLogout(): void {
    this.showUserMenu.set(false);
    this.logout.emit();
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }
}
