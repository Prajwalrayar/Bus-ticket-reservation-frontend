import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  declarations: [ProfileComponent],
  imports: [SharedModule, FormsModule],
  exports: [ProfileComponent]
})
export class ProfileModule {}
