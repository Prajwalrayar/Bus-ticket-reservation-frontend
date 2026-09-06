import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { TokenService } from '../../core/services/token-service';
import { APP_CONSTANTS } from '../../core/constants/app-constants';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user';

interface AdminNavItem {
  icon: string;
  label: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  isSidebarCollapsed = false;
  readonly currentYear = new Date().getFullYear();

  // Temporary password change
  passwordForm: FormGroup;
  passwordError = '';
  passwordLoading = false;

  // Login as Passenger
  loginAsPassengerForm: FormGroup;
  passengerLoginError = '';
  passengerLoginLoading = false;
  showPassengerLoginModal = false;

  readonly adminNavItems: AdminNavItem[] = [
    { icon: 'bi-speedometer2', label: 'Dashboard', route: '/admin', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-person-circle', label: 'My Profile', route: '/admin/profile', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-building', label: 'Operating Companies', route: '/admin/operators', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-people', label: 'Users', route: '/admin/users', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-person-badge', label: 'Staff', route: '/admin/staff', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-bus-front', label: 'Buses', route: '/admin/buses', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-signpost-split', label: 'Routes', route: '/admin/routes', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-calendar-range', label: 'Trips', route: '/admin/trips', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-ticket-perforated', label: 'Bookings', route: '/admin/bookings', roles: [APP_CONSTANTS.ROLES.ADMIN] },
    { icon: 'bi-journal-text', label: 'Audit Logs', route: '/admin/audit-logs', roles: [APP_CONSTANTS.ROLES.ADMIN] }
  ];

  readonly operatorNavItems: AdminNavItem[] = [
    { icon: 'bi-speedometer2', label: 'Dashboard', route: '/operator', roles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] },
    { icon: 'bi-person-circle', label: 'My Profile', route: '/operator/profile', roles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] },
    { icon: 'bi-bus-front', label: 'Buses', route: '/operator/buses', roles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] },
    { icon: 'bi-signpost-split', label: 'Routes', route: '/operator/routes', roles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] },
    { icon: 'bi-calendar-range', label: 'Trips / Schedules', route: '/operator/trips', roles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] },
    { icon: 'bi-headset', label: 'Support Agents', route: '/operator/support-agents', roles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] },
    { icon: 'bi-ticket-perforated', label: 'Bookings', route: '/operator/bookings', roles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] },
  ];

  readonly supportNavItems: AdminNavItem[] = [
    { icon: 'bi-speedometer2', label: 'Dashboard', route: '/support', roles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] },
    { icon: 'bi-person-circle', label: 'My Profile', route: '/support/profile', roles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] },
    { icon: 'bi-exclamation-circle', label: 'Customer Issues', route: '/support/customer-issues', roles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] },
    { icon: 'bi-headset', label: 'Support Tickets', route: '/support/tickets', roles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] },
    { icon: 'bi-ticket-perforated', label: 'Bookings', route: '/support/bookings', roles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] },
    { icon: 'bi-person-lines-fill', label: 'Customer Information', route: '/support/customers', roles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] },
  ];

  constructor(
    private authStateService: AuthStateService,
    private tokenService: TokenService,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.loginAsPassengerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get pwf() { return this.passwordForm.controls; }
  get plf() { return this.loginAsPassengerForm.controls; }

  get userName(): string {
    const user = this.authStateService.getUser();
    return user?.name || user?.email || 'Admin';
  }

  get userRoles(): string[] {
    return this.tokenService.getRoles();
  }

  get isAdmin(): boolean {
    return this.tokenService.hasRole(APP_CONSTANTS.ROLES.ADMIN);
  }

  get isOperator(): boolean {
    return this.tokenService.hasRole(APP_CONSTANTS.ROLES.BUS_OPERATOR);
  }

  get isSupportAgent(): boolean {
    return this.tokenService.hasRole(APP_CONSTANTS.ROLES.SUPPORT_AGENT);
  }

  get currentNavItems(): AdminNavItem[] {
    if (this.isAdmin) return this.adminNavItems;
    if (this.isOperator) return this.operatorNavItems;
    if (this.isSupportAgent) return this.supportNavItems;
    return [];
  }

  get panelTitle(): string {
    if (this.isAdmin) return 'Admin Panel';
    if (this.isOperator) return 'Operator Panel';
    if (this.isSupportAgent) return 'Support Panel';
    return 'Dashboard';
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // Temporary Password
  get isTemporaryPassword(): boolean {
    return this.authStateService.getUser()?.isTemporaryPassword || false;
  }

  changeTemporaryPassword(): void {
    if (this.passwordForm.invalid) return;

    this.passwordLoading = true;
    this.passwordError = '';

    const req = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
      confirmPassword: this.passwordForm.value.confirmPassword
    };

    this.userService.changePassword(req).subscribe({
      next: () => {
        this.userService.getMyProfile().subscribe({
          next: (profile) => {
            const user = this.authStateService.getUser();
            if (user) {
              const updatedUser = { ...user, isTemporaryPassword: profile.isTemporaryPassword };
              this.authStateService.setUser(updatedUser);
            }
            this.passwordLoading = false;
            this.passwordForm.reset();
          },
          error: () => {
            this.passwordLoading = false;
            this.passwordError = 'Password changed, but failed to refresh session. Please login again.';
          }
        });
      },
      error: (err: any) => {
        this.passwordError = err.error?.message || 'Failed to change password.';
        this.passwordLoading = false;
      }
    });
  }

  // Login as Passenger
  openPassengerLoginModal(): void {
    this.loginAsPassengerForm.reset();
    this.passengerLoginError = '';
    this.showPassengerLoginModal = true;
  }

  closePassengerLoginModal(): void {
    this.showPassengerLoginModal = false;
    this.passengerLoginError = '';
    this.loginAsPassengerForm.reset();
  }

  loginAsPassenger(): void {
    if (this.loginAsPassengerForm.invalid) return;

    const currentStaffEmail = this.authStateService.getUser()?.email || '';
    const enteredEmail = (this.loginAsPassengerForm.value.email || '').trim().toLowerCase();

    // Prevent using the same email as current staff account
    if (enteredEmail === currentStaffEmail.toLowerCase()) {
      this.passengerLoginError = 'You cannot use your staff account email as a Passenger login. Please use a separate Passenger email.';
      return;
    }

    this.passengerLoginLoading = true;
    this.passengerLoginError = '';

    const creds = {
      email: this.loginAsPassengerForm.value.email,
      password: this.loginAsPassengerForm.value.password,
    };

    this.authService.login(creds).subscribe({
      next: (response) => {
        const roles: string[] = response.roles || [];

        // Enforce: only PASSENGER role is permitted here
        if (!roles.includes('PASSENGER')) {
          this.passengerLoginLoading = false;
          this.passengerLoginError = 'This email is not a Passenger account. Please use a dedicated Passenger email.';
          return;
        }

        // Also prevent logging in as the same staff role via this button
        const staffRoles = ['ADMIN', 'BUS_OPERATOR', 'SUPPORT_AGENT'];
        if (roles.some(r => staffRoles.includes(r))) {
          this.passengerLoginLoading = false;
          this.passengerLoginError = 'A staff account cannot be used as a Passenger account.';
          return;
        }

        // Replace current session with passenger session
        this.tokenService.setToken(response.token);

        const user: User = {
          userId: response.userId,
          name: response.userName || '',
          email: response.userEmail || creds.email,
          phone: '',
          roles: response.roles,
          isTemporaryPassword: response.isTemporaryPassword,
        };

        this.authStateService.setUser(user);
        this.passengerLoginLoading = false;
        this.closePassengerLoginModal();

        // Navigate to passenger home
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        this.passengerLoginError = err.error?.message || 'Invalid email or password.';
        this.passengerLoginLoading = false;
      }
    });
  }

  logout(): void {
    this.authStateService.logout();
    this.router.navigate(['/']);
  }
}
