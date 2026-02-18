import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { roleGuard } from '../../core/guards/role.guard';
import { Role } from '../../core/models';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/dashboard-home/dashboard-home.component')
          .then(m => m.DashboardHomeComponent),
        title: 'Dashboard - Badminton Academy'
      },
      {
        path: 'batches',
        loadChildren: () => import('../batches/batches.routes')
          .then(m => m.BATCHES_ROUTES),
        title: 'Batches - Badminton Academy'
      },
      {
        path: 'coaches',
        loadComponent: () => import('../coaches/pages/coach-management/coach-management.component')
          .then(m => m.CoachManagementComponent),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
        title: 'Coaches - Badminton Academy'
      },
      {
        path: 'students',
        loadChildren: () => import('../students/students.routes')
          .then(m => m.STUDENTS_ROUTES),
        title: 'Students - Badminton Academy'
      },
      {
        path: 'attendance',
        loadChildren: () => import('../attendance/attendance.routes')
          .then(m => m.ATTENDANCE_ROUTES),
        title: 'Attendance - Badminton Academy'
      },
      {
        path: 'schedule',
        loadComponent: () => import('../schedule/pages/schedule/schedule.component')
          .then(m => m.ScheduleComponent),
        title: 'Schedule - Badminton Academy'
      },
      {
        path: 'achievements',
        loadComponent: () => import('../achievements/pages/achievements/achievements.component')
          .then(m => m.AchievementsComponent),
        title: 'Achievements - Badminton Academy'
      },
      {
        path: 'assessment',
        loadComponent: () => import('../assessment/pages/assessment/assessment.component')
          .then(m => m.AssessmentComponent),
        title: 'Assessment - Badminton Academy'
      },
      {
        path: 'matches',
        loadComponent: () => import('../matches/pages/matches/matches.component')
          .then(m => m.MatchesComponent),
        title: 'Matches - Badminton Academy'
      },
      {
        path: 'performance',
        loadComponent: () => import('../performance/pages/performance/performance.component')
          .then(m => m.PerformanceComponent),
        title: 'Performance - Badminton Academy'
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/pages/profile/profile.component')
          .then(m => m.ProfileComponent),
        title: 'Profile - Badminton Academy'
      },
      {
        path: 'settings',
        loadComponent: () => import('../settings/pages/settings/settings.component')
          .then(m => m.SettingsComponent),
        title: 'Settings - Badminton Academy'
      }
    ]
  }
];
