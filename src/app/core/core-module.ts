import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthService } from './services/auth.service';
import { AuthStateService } from './services/auth-state.service';
import { BookingStateService } from './services/booking-state.service';
import { BookingService } from './services/booking.service';
import { BusService } from './services/bus.service';
import { OfferService } from './services/offer.service';
import { TokenService } from './services/token-service';
import { JwtInterceptor } from './interceptors/jwt-interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { AuthGuard } from './guards/auth-guard';
import { GuestGuard } from './guards/guest-guard';
import { RoleGuard } from './guards/role-guard';

@NgModule({
  imports: [CommonModule],
  providers: [
    AuthService,
    AuthStateService,
    BookingStateService,
    BookingService,
    BusService,
    OfferService,
    TokenService,
    AuthGuard,
    GuestGuard,
    RoleGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }
  }
}
