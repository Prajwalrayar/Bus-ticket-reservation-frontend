import { Component, OnInit, OnDestroy, HostListener, ElementRef, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { TokenService } from '../../../core/services/token-service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { APP_CONSTANTS } from '../../../core/constants/app-constants';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  userRoles: string[] = [];
  isMenuCollapsed = true;
  unreadNotificationCount: number = 0;
  
  isUserMenuOpen = false;
  isAppearanceMenuOpen = false;
  
  private notifSub?: Subscription;

  readonly roles = APP_CONSTANTS.ROLES;

  constructor(
    private authStateService: AuthStateService,
    private tokenService: TokenService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private router: Router,
    private eRef: ElementRef,
    private cdr: import('@angular/core').ChangeDetectorRef
  ) {
    effect(() => {
      const user = this.authStateService.currentUser();
      this.updateAuthState();
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.isUserMenuOpen && !this.eRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen = false;
      this.isAppearanceMenuOpen = false;
    }
  }

  ngOnInit(): void {
    // The effect in constructor handles auth state updates dynamically
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  private updateAuthState(): void {
    const wasLoggedIn = this.isLoggedIn;
    this.isLoggedIn = this.tokenService.isValid();

    if (this.isLoggedIn) {
      const user = this.authStateService.getUser();
      this.userName = user?.name || user?.email || 'User';
      this.userRoles = this.tokenService.getRoles();
      
      if (this.isCustomer && this.unreadNotificationCount === 0) {
        this.fetchUnreadCount();
      }
    } else if (wasLoggedIn) {
      this.userName = '';
      this.userRoles = [];
      this.unreadNotificationCount = 0;
      this.notifSub?.unsubscribe();
    }
  }

  unreadRefundNotification: any = null;
  showRefundModal = false;

  private fetchUnreadCount(): void {
    // Initial fetch to populate the Subject
    this.notificationService.getMyUnreadNotifications().subscribe({
      next: (notifications) => {
        // Check for refund notification
        const refundNotif = notifications.find(n => n.notificationType === 'REFUND_PROCESSED');
        if (refundNotif) {
           this.unreadRefundNotification = refundNotif;
           this.showRefundModal = true;
           this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Failed to fetch unread notifications', err)
    });

    // Subscribe to the shared state
    this.notifSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotificationCount = count;
      this.cdr.detectChanges();
    });
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
  }

  markRefundNotificationAsRead(): void {
    if (this.unreadRefundNotification) {
      this.notificationService.markAsRead(this.unreadRefundNotification.notificationId).subscribe();
    }
    this.closeRefundModal();
  }

  get isAdmin(): boolean {
    return this.userRoles.includes(this.roles.ADMIN);
  }

  get isOperator(): boolean {
    return this.userRoles.includes(this.roles.BUS_OPERATOR);
  }

  get isCustomer(): boolean {
    return this.userRoles.includes(this.roles.CUSTOMER) || this.userRoles.includes('PASSENGER');
  }

  get userInitial(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : 'U';
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  logout(): void {
    this.authStateService.logout();
    this.isLoggedIn = false;
    this.userName = '';
    this.userRoles = [];
    this.isUserMenuOpen = false;
    this.router.navigate(['/']);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (!this.isUserMenuOpen) {
      this.isAppearanceMenuOpen = false;
    }
  }

  toggleAppearanceMenu(event: Event): void {
    event.stopPropagation();
    this.isAppearanceMenuOpen = !this.isAppearanceMenuOpen;
  }

  setTheme(theme: 'light' | 'dark', event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.themeService.setTheme(theme);
  }

  isLightTheme(): boolean {
    return this.themeService.getCurrentTheme() === 'light';
  }

  isDarkTheme(): boolean {
    return this.themeService.getCurrentTheme() === 'dark';
  }

  isSystemTheme(): boolean {
    return false; // System theme no longer supported; always light or dark
  }
}
