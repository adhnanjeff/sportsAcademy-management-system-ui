import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem, Role } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;
  @Output() mobileClose = new EventEmitter<void>();

  private authService = inject(AuthService);
  
  get navItems(): NavItem[] {
    const userRole = this.authService.currentUser()?.role;
    const items: NavItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-house', route: '/dashboard/home' },
      { id: 'attendance', label: 'Attendance', icon: 'fa-solid fa-clipboard-check', route: '/dashboard/attendance/mark' },
      { id: 'attendance-report', label: 'Attendance Report', icon: 'fa-regular fa-calendar-check', route: '/dashboard/attendance/history' },
      { id: 'students', label: 'My Students', icon: 'fa-solid fa-users', route: '/dashboard/students' },
      { id: 'batches', label: 'Batches', icon: 'fa-solid fa-layer-group', route: '/dashboard/batches' },
      { id: 'assessment', label: 'Assessment', icon: 'fa-solid fa-clipboard-list', route: '/dashboard/assessment' },
      { id: 'matches', label: 'Matches', icon: 'fa-solid fa-flag-checkered', route: '/dashboard/matches' },
      { id: 'performance', label: 'Performance', icon: 'fa-solid fa-chart-line', route: '/dashboard/performance' },
      { id: 'achievements', label: 'Achievements', icon: 'fa-solid fa-trophy', route: '/dashboard/achievements' }
    ];

    if (userRole === Role.ADMIN) {
      items.splice(4, 0, { id: 'coaches', label: 'Coaches', icon: 'fa-solid fa-user-tie', route: '/dashboard/coaches' });
    }

    return items;
  }

  onLogout(): void {
    this.authService.logout();
    this.closeMobile();
  }
  
  onNavClick(): void {
    // Close mobile sidebar when navigating
    if (this.isMobileOpen) {
      this.closeMobile();
    }
  }
  
  closeMobile(): void {
    this.mobileClose.emit();
  }
}
