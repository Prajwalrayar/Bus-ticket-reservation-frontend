import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

@NgModule({
  declarations: [MainLayoutComponent, AuthLayoutComponent, AdminLayoutComponent],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [MainLayoutComponent, AuthLayoutComponent, AdminLayoutComponent],
})
export class LayoutModule {}
