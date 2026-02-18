import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { Role } from '../../core/models';

export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/student-list/student-list.component')
      .then(m => m.StudentListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/student-form/student-form.component')
      .then(m => m.StudentFormComponent),
    canActivate: [roleGuard],
    data: { roles: [Role.ADMIN, Role.COACH] },
    title: 'Add Student - Badminton Academy'
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/student-detail/student-detail.component')
      .then(m => m.StudentDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/student-form/student-form.component')
      .then(m => m.StudentFormComponent),
    canActivate: [roleGuard],
    data: { roles: [Role.ADMIN, Role.COACH] },
    title: 'Edit Student - Badminton Academy'
  }
];
