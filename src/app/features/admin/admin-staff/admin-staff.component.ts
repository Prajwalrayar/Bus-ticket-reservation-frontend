import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { UserService } from '../../../core/services/user.service';
import { OperatorService } from '../../../core/services/operator.service';
import { UserDTO, StaffCreateRequest } from '../../../core/models/user';
import { OperatorDTO } from '../../../core/models/operator';

@Component({
  selector: 'app-admin-staff',
  standalone: false,
  templateUrl: './admin-staff.component.html',
  styleUrl: './admin-staff.component.css'
})
export class AdminStaffComponent implements OnInit {
  staff: UserDTO[] = [];
  operators: OperatorDTO[] = [];
  loading: boolean = true;
  error: string = '';

  showStaffModal: boolean = false;
  staffForm: StaffCreateRequest = {
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    roleName: 'BUS_OPERATOR',
    companyName: ''
  };
  staffSubmitSuccess: string = '';
  staffSubmitError: string = '';

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private operatorService: OperatorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAllStaff();
    this.fetchOperators();
  }

  fetchOperators(): void {
    this.operatorService.getAllOperators().subscribe({
      next: (data) => {
        this.operators = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to fetch operators', err);
      }
    });
  }

  fetchAllStaff(): void {
    this.loading = true;
    this.error = '';
    this.userService.getAllUsers().subscribe({
      next: (data: any) => {
        this.staff = data.filter((u: UserDTO) => {
          if (!u.roleNames) return false;
          return u.roleNames.includes('BUS_OPERATOR') || u.roleNames.includes('SUPPORT_AGENT');
        }); 
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to fetch staff', err);
        this.error = 'Failed to load staff list.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openStaffModal(): void {
    this.staffSubmitSuccess = '';
    this.staffSubmitError = '';
    this.staffForm = { fullName: '', email: '', mobileNumber: '', password: '', roleName: 'BUS_OPERATOR', companyName: '' };
    this.showStaffModal = true;
  }

  closeStaffModal(): void {
    this.showStaffModal = false;
  }

  nameError: string = '';
  emailError: string = '';
  passwordError: string = '';

  validateName(): boolean {
    this.nameError = '';
    const name = this.staffForm.fullName?.trim() || '';
    
    if (!name) return false;
    if (name.length < 3 || name.length > 50) {
      this.nameError = 'Name must be between 3 and 50 characters.';
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      this.nameError = 'Name can only contain alphabets and spaces.';
      return false;
    }
    if (/(.)\1{2}/i.test(name.replace(/\s/g, ''))) {
      this.nameError = 'Name cannot contain the same letter more than twice consecutively.';
      return false;
    }
    
    const noSpace = name.replace(/\s/g, '').toLowerCase();
    for (let i = 0; i < noSpace.length - 2; i++) {
       const c1 = noSpace.charCodeAt(i);
       const c2 = noSpace.charCodeAt(i+1);
       const c3 = noSpace.charCodeAt(i+2);
       if (c1 + 1 === c2 && c2 + 1 === c3) {
         this.nameError = 'Name cannot contain sequential alphabets like abc, xyz.';
         return false;
       }
    }
    return true;
  }

  validateEmail(): boolean {
    this.emailError = '';
    const email = this.staffForm.email?.trim() || '';

    if (!email) return false;
    
    // Basic email pattern is handled by HTML5, but we can do a quick check
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,4}$/i.test(email)) {
      // Let HTML5 handle basic invalid format message if preferred, or set it here.
      return false;
    }

    const localPart = email.split('@')[0].toLowerCase();
    
    // No same letter 3 times in local part
    if (/(.)\1{2}/i.test(localPart)) {
      this.emailError = 'Email prefix cannot contain the same letter more than twice consecutively.';
      return false;
    }
    
    // No sequence of alphabets in local part
    for (let i = 0; i < localPart.length - 2; i++) {
       const c1 = localPart.charCodeAt(i);
       const c2 = localPart.charCodeAt(i+1);
       const c3 = localPart.charCodeAt(i+2);
       if (c1 >= 97 && c1 <= 122 && c1 + 1 === c2 && c2 + 1 === c3) { // only check lowercase alphabet sequences
         this.emailError = 'Email prefix cannot contain sequential alphabets like abc, xyz.';
         return false;
       }
    }

    return true;
  }

  validatePassword(): boolean {
    this.passwordError = '';
    const pass = this.staffForm.password || '';
    
    if (!pass) return false;
    if (pass.length < 8 || pass.length > 20) {
      this.passwordError = 'Password must be between 8 and 20 characters.';
      return false;
    }
    if (!/(?=.*[0-9])/.test(pass)) {
      this.passwordError = 'Password must contain at least 1 digit.';
      return false;
    }
    if (!/(?=.*[a-z])/.test(pass)) {
      this.passwordError = 'Password must contain at least 1 lowercase letter.';
      return false;
    }
    if (!/(?=.*[A-Z])/.test(pass)) {
      this.passwordError = 'Password must contain at least 1 uppercase letter.';
      return false;
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\])/.test(pass)) {
      this.passwordError = 'Password must contain at least 1 special character.';
      return false;
    }
    return true;
  }

  createStaff(): void {
    this.staffSubmitError = '';
    this.staffSubmitSuccess = '';
    
    if (!this.validateName() || !this.validateEmail() || !this.validatePassword()) {
       return;
    }

    this.adminService.createStaff(this.staffForm).subscribe({
      next: (res: any) => {
        this.staffSubmitSuccess = 'Staff member created successfully.';
        this.fetchAllStaff();
        setTimeout(() => {
          this.closeStaffModal();
          this.cdr.markForCheck();
        }, 1500);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error creating staff', err);
        this.staffSubmitError = err.error?.message || 'Failed to create staff member.';
        this.cdr.markForCheck();
      }
    });
  }
}
