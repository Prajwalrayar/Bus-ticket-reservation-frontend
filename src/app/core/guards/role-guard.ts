import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token-service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.tokenService.hasToken()) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const expectedRoles: string[] = route.data['expectedRoles'] || [];

    if (expectedRoles.length === 0) {
      return true;
    }

    if (this.tokenService.hasAnyRole(expectedRoles)) {
      return true;
    }

    // Redirect to their respective dashboards if they try to access unauthorized routes
    if (this.tokenService.hasRole('ADMIN')) {
      return this.router.createUrlTree(['/admin']);
    } else if (this.tokenService.hasRole('BUS_OPERATOR')) {
      return this.router.createUrlTree(['/operator']);
    } else if (this.tokenService.hasRole('SUPPORT_AGENT')) {
      return this.router.createUrlTree(['/support']);
    }

    return this.router.createUrlTree(['']);
  }
}
