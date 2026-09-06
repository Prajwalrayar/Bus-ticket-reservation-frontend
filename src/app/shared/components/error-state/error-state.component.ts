import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: false,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.css',
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'We could not complete your request. Please try again.';
}
