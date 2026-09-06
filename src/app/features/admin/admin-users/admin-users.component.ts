import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: UserDTO[] = [];
  filteredUsers: UserDTO[] = [];
  loading: boolean = true;
  error: string = '';

  // Filters
  nameFilter: string = '';
  emailFilter: string = '';

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAllUsers();
  }

  fetchAllUsers(): void {
    this.loading = true;
    this.error = '';
    this.userService.getAllUsers().subscribe({
      next: (data: any) => {
        // Exclude STAFF from users list so they don't clutter the normal users view, 
        // though strictly they could remain. Let's just show all for now, but maybe filter out ADMIN/OPERATOR? 
        // The prompt says "real-world admin view of users".
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to fetch users', err);
        this.error = 'Failed to load users list.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters(): void {
    let temp = [...this.users];
    
    if (this.nameFilter) {
      temp = temp.filter(u => u.userName.toLowerCase().includes(this.nameFilter.toLowerCase()));
    }
    if (this.emailFilter) {
      temp = temp.filter(u => u.userEmail.toLowerCase().includes(this.emailFilter.toLowerCase()));
    }
    
    this.filteredUsers = temp;
    this.cdr.markForCheck();
  }
}
