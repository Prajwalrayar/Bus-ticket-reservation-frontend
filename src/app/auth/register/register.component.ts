import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CustomValidators } from '../../core/validators/custom-validators';
import { RegisterRequest } from '../../core/models/register';
import { LoginResponse } from '../../core/models/login';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { TokenService } from '../../core/services/token-service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { User } from '../../core/models/user';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private tokenService: TokenService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, CustomValidators.validName()]],
      email: ['', [Validators.required, CustomValidators.validEmail()]],
      mobileNumber: ['', [Validators.required, CustomValidators.validIndianPhone()]],
      address: [''],
      password: ['', [Validators.required, CustomValidators.validPassword()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check that two fields match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  register(): void {
    this.submitted = true;
    this.registerForm.markAllAsTouched();
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);

    const registerData: RegisterRequest = {
      fullName: this.f['fullName'].value,
      email: this.f['email'].value,
      mobileNumber: this.f['mobileNumber'].value,
      password: this.f['password'].value,
      confirmPassword: this.f['confirmPassword'].value,
      address: this.f['address'].value
    };

    this.authService
      .register(registerData)
      .subscribe({

        next: () => {
          this.loading.set(false);

          this.successMessage.set(
            'Registration successful. Redirecting to login...'
          );

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },

        error: (err) => {
          console.error('Registration error:', err);
          this.loading.set(false);

          if (err.error && err.error.message) {
            this.errorMessage.set(err.error.message);
          } else if (err.error && err.error.validationErrors) {
            const errors = Object.values(err.error.validationErrors).join(', ');
            this.errorMessage.set(errors);
          } else {
            this.errorMessage.set('Unable to register. Please try again.');
          }
        }
      });
  }
}
