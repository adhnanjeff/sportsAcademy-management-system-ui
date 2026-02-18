import { Component, ChangeDetectionStrategy, signal, HostListener, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLayoutComponent {
  private readonly authService = inject(AuthService);

  isSidebarCollapsed = signal(false);
  isMobileSidebarOpen = signal(false);
  readonly currentUser = computed(() => this.authService.currentUser());
  private isMobile = false;

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isMobileSidebarOpen.set(false);
    }
  }

  onToggleSidebar(): void {
    if (this.isMobile) {
      this.isMobileSidebarOpen.update(v => !v);
    } else {
      this.isSidebarCollapsed.update(v => !v);
    }
  }

  onLogout(): void {
    this.authService.logout();
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }
}
