import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { HomeComponent } from './features/home/home.component';
import { BusSearchComponent } from './features/bus-search/bus-search.component';
import { SeatSelectionComponent } from './features/seat-selection/seat-selection/seat-selection.component';
import { PassengerDetailsComponent } from './features/passenger-details/passenger-details.component';
import { BookingConfirmationComponent } from './features/booking/booking-confirmation/booking-confirmation.component';
import { BookingSuccess } from './features/booking/booking-success/booking-success';
import { PaymentComponent } from './features/payment/payment/payment.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { ProfileComponent } from './features/profile/profile/profile.component';
import { WalletComponent } from './features/profile/wallet/wallet.component';
import { TicketComponent } from './features/ticket/ticket/ticket.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { GuestGuard } from './core/guards/guest-guard';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { APP_CONSTANTS } from './core/constants/app-constants';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { AuditLogs } from './features/admin/audit-logs/audit-logs';
import { AdminUsersComponent } from './features/admin/admin-users/admin-users.component';
import { AdminStaffComponent } from './features/admin/admin-staff/admin-staff.component';
import { AdminBusesComponent } from './features/admin/admin-buses/admin-buses.component';
import { AdminRoutesComponent } from './features/admin/admin-routes/admin-routes.component';
import { AdminTripsComponent } from './features/admin/admin-trips/admin-trips.component';
import { AdminBookingsComponent } from './features/admin/admin-bookings/admin-bookings.component';
import { AdminOperatorsComponent } from './features/admin/admin-operators/admin-operators.component';
import { AdminLocationsComponent } from './features/admin/admin-locations/admin-locations.component';
import { OperatorDashboardComponent } from './features/operator/operator-dashboard/operator-dashboard.component';
import { SupportDashboard } from './features/support/support-dashboard/support-dashboard';
import { UserProfileComponent } from './shared/components/user-profile/user-profile.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'search',
        component: BusSearchComponent,
      },
      {
        path: 'seat-selection',
        component: SeatSelectionComponent,
      },
      {
        path: 'passenger-details',
        component: PassengerDetailsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'booking-confirmation',
        component: BookingConfirmationComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'booking-success',
        component: BookingSuccess,
        canActivate: [AuthGuard],
      },
      {
        path: 'payment',
        component: PaymentComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'profile/wallet',
        component: WalletComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'ticket',
        component: TicketComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [GuestGuard],
    children: [
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
    ],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.BUS_OPERATOR, APP_CONSTANTS.ROLES.SUPPORT_AGENT] },
    children: [
      {
        path: 'admin',
        component: AdminDashboardComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/locations',
        component: AdminLocationsComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/profile',
        component: UserProfileComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/users',
        component: AdminUsersComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/staff',
        component: AdminStaffComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/buses',
        component: AdminBusesComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/routes',
        component: AdminRoutesComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/trips',
        component: AdminTripsComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/bookings',
        component: AdminBookingsComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/audit-logs',
        component: AuditLogs,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'admin/operators',
        component: AdminOperatorsComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.ADMIN] }
      },
      {
        path: 'operator',
        component: OperatorDashboardComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] }
      },
      {
        path: 'operator/buses',
        component: OperatorDashboardComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] }
      },
      {
        path: 'operator/routes',
        component: OperatorDashboardComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] }
      },
      {
        path: 'operator/trips',
        component: OperatorDashboardComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] }
      },
      {
        path: 'operator/support-agents',
        component: OperatorDashboardComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] }
      },
      {
        path: 'operator/bookings',
        component: OperatorDashboardComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] }
      },
      {
        path: 'operator/profile',
        component: UserProfileComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.BUS_OPERATOR] }
      },
      {
        path: 'support',
        component: SupportDashboard,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] }
      },
      {
        path: 'support/customer-issues',
        component: SupportDashboard,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] }
      },
      {
        path: 'support/tickets',
        component: SupportDashboard,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] }
      },
      {
        path: 'support/bookings',
        component: SupportDashboard,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] }
      },
      {
        path: 'support/customers',
        component: SupportDashboard,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] }
      },
      {
        path: 'support/profile',
        component: UserProfileComponent,
        data: { expectedRoles: [APP_CONSTANTS.ROLES.SUPPORT_AGENT] }
      }
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
