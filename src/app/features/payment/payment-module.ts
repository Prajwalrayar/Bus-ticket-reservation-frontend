import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { PaymentComponent } from './payment/payment.component';

@NgModule({
  declarations: [PaymentComponent],
  imports: [SharedModule],
  exports: [PaymentComponent]
})
export class PaymentModule {}
