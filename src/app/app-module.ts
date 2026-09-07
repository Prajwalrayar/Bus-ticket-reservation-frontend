import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';

import { App } from './app';
import { AppRoutingModule } from './app-routing-module';
import { CoreModule } from './core/core-module';
import { SharedModule } from './shared/shared-module';
import { LayoutModule } from './layout/layout-module';
import { HomeModule } from './features/home/home-module';
import { AuthModule } from './auth/auth-module';
import { NotificationsModule } from './features/notifications/notifications-module';
import { AdminModule } from './features/admin/admin-module';
import { OperatorModule } from './features/operator/operator-module';
import { SupportModule } from './features/support/support-module';
import { ProfileModule } from './features/profile/profile-module';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    CoreModule,
    SharedModule,
    LayoutModule,
    HomeModule,
    AuthModule,
    NotificationsModule,
    AdminModule,
    OperatorModule,
    SupportModule,
    ProfileModule,
    AppRoutingModule,
  ],
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(), 
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [App],
})
export class AppModule {}
