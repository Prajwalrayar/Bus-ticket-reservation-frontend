import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { TicketComponent } from './ticket/ticket.component';

@NgModule({
  declarations: [TicketComponent],
  imports: [SharedModule],
  exports: [TicketComponent]
})
export class TicketModule {}
