import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AuditLogs } from './audit-logs/audit-logs';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminStaffComponent } from './admin-staff/admin-staff.component';
import { AdminBusesComponent } from './admin-buses/admin-buses.component';
import { AdminRoutesComponent } from './admin-routes/admin-routes.component';
import { AdminTripsComponent } from './admin-trips/admin-trips.component';
import { AdminBookingsComponent } from './admin-bookings/admin-bookings.component';
import { AdminOperatorsComponent } from './admin-operators/admin-operators.component';

@NgModule({
  declarations: [
    AdminDashboardComponent, 
    AuditLogs,
    AdminUsersComponent,
    AdminStaffComponent,
    AdminBusesComponent,
    AdminRoutesComponent,
    AdminTripsComponent,
    AdminBookingsComponent,
    AdminOperatorsComponent
  ],
  imports: [SharedModule],
  exports: [
    AdminDashboardComponent,
    AuditLogs,
    AdminUsersComponent,
    AdminStaffComponent,
    AdminBusesComponent,
    AdminRoutesComponent,
    AdminTripsComponent,
    AdminBookingsComponent
  ],
})
export class AdminModule {}
