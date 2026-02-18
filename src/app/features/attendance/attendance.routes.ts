import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'mark',
    pathMatch: 'full'
  },
  {
    path: 'mark',
    loadComponent: () => import('./pages/mark-attendance/mark-attendance.component')
      .then(m => m.MarkAttendanceComponent),
    title: 'Mark Attendance - Badminton Academy'
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/attendance-history/attendance-history.component')
      .then(m => m.AttendanceHistoryComponent),
    title: 'Attendance Reports - Badminton Academy'
  }
];
