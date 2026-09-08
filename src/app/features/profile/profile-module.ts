import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from './profile/profile.component';
import { WalletComponent } from './wallet/wallet.component';

@NgModule({
  declarations: [ProfileComponent, WalletComponent],
  imports: [SharedModule, FormsModule],
  exports: [ProfileComponent, WalletComponent]
})
export class ProfileModule { }
