import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { UserDTO } from '../../../core/models/user';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userProfile: UserDTO | null = null;
  
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  profileLoading = false;
  profileSuccess = '';
  profileError = '';
  
  passwordLoading = false;
  passwordSuccess = '';
  passwordError = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authState: AuthStateService,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      userName: [{ value: '', disabled: true }],
      userEmail: [{ value: '', disabled: true }],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      roleNames: [{ value: '', disabled: true }],
      companyName: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  loadProfile(): void {
    this.profileLoading = true;
    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profileForm.patchValue({
          userName: profile.userName,
          userEmail: profile.userEmail,
          mobileNumber: profile.mobileNumber || '',
          roleNames: profile.roleNames?.join(', ') || 'N/A',
          companyName: profile.companyName || 'N/A'
        });
        this.profileLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.profileError = 'Failed to load user profile.';
        this.profileLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.profileLoading = true;
    this.profileSuccess = '';
    this.profileError = '';
    
    // userName is required in the backend DTO, but we are keeping it read-only in UI.
    // We send the existing userName from the profile, and updated mobileNumber.
    const updateRequest = {
      userName: this.userProfile?.userName || '',
      mobileNumber: this.profileForm.get('mobileNumber')?.value
    };
    
    this.userService.updateMyProfile(updateRequest).subscribe({
      next: (updated: UserDTO) => {
        this.userProfile = updated;
        this.profileSuccess = 'Profile updated successfully.';
        this.profileLoading = false;
        
        this.authState.setUser({
          userId: updated.userId,
          name: updated.userName,
          email: updated.userEmail,
          roles: updated.roleNames
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.profileError = err.error?.message || 'Failed to update profile.';
        this.profileLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.passwordLoading = true;
    this.passwordSuccess = '';
    this.passwordError = '';

    const req = this.passwordForm.value;
    
    this.userService.changePassword(req).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully.';
        this.passwordForm.reset();
        this.passwordLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.passwordError = err.error?.message || 'Failed to change password.';
        this.passwordLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  get isDarkMode(): boolean {
    return this.themeService.getCurrentTheme() === 'dark';
  }
}
