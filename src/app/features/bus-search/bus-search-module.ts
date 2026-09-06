import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { BusSearchComponent } from './bus-search.component';

@NgModule({
  declarations: [BusSearchComponent],
  imports: [SharedModule],
  exports: [BusSearchComponent]
})
export class BusSearchModule {}
