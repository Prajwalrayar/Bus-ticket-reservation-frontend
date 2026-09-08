import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';
import { AiChatbotComponent } from './components/ai-chatbot/ai-chatbot';

import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { LocationAutocompleteComponent } from './components/location-autocomplete/location-autocomplete';

const SHARED_COMPONENTS = [
  NavbarComponent,
  FooterComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  UserProfileComponent,
  LocationAutocompleteComponent
];

@NgModule({
  declarations: [...SHARED_COMPONENTS],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, AiChatbotComponent],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...SHARED_COMPONENTS,
    AiChatbotComponent,
  ],
})
export class SharedModule {}
