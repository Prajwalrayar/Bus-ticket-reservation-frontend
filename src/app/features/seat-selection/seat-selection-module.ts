import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { SeatSelectionComponent } from './seat-selection/seat-selection.component';

@NgModule({
  declarations: [SeatSelectionComponent],
  imports: [SharedModule],
  exports: [SeatSelectionComponent]
})
export class SeatSelectionModule {}
