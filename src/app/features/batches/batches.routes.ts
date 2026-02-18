import { Routes } from '@angular/router';

export const BATCHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/batch-list/batch-list.component')
      .then(m => m.BatchListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/batch-form/batch-form.component')
      .then(m => m.BatchFormComponent),
    title: 'Create Batch - Badminton Academy'
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/batch-detail/batch-detail.component')
      .then(m => m.BatchDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/batch-form/batch-form.component')
      .then(m => m.BatchFormComponent),
    title: 'Edit Batch - Badminton Academy'
  }
];
