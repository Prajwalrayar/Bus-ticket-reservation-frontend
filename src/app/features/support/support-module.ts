import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupportDashboard } from './support-dashboard/support-dashboard';

import { SharedModule } from '../../shared/shared-module';

@NgModule({
  declarations: [SupportDashboard],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedModule
  ],
  exports: [SupportDashboard]
})
export class SupportModule {}
