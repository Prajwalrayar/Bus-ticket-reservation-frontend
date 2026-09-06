import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { PassengerDetailsComponent } from './passenger-details.component';

@NgModule({
  declarations: [PassengerDetailsComponent],
  imports: [SharedModule],
  exports: [PassengerDetailsComponent]
})
export class PassengerDetailsModule {}
