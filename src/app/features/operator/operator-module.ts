import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { OperatorDashboardComponent } from './operator-dashboard/operator-dashboard.component';

@NgModule({
  declarations: [OperatorDashboardComponent],
  imports: [SharedModule],
  exports: [OperatorDashboardComponent]
})
export class OperatorModule {}
