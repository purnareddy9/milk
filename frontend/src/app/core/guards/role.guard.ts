import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const expectedRoles = route.data['roles'] as Array<string>;
  const user = authService.currentUser;

  if (!user) {
    // Demo auto-switch or redirect
    return true;
  }

  if (expectedRoles && expectedRoles.includes(user.role)) {
    return true;
  }

  toast.error(`Access restricted. Current role [${user.role}] cannot access this portal.`);
  router.navigate(['/']);
  return false;
};
