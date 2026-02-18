import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as Role[];
  const userRole = authService.userRole();

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  router.navigate(['/dashboard/home']);
  return false;
};
