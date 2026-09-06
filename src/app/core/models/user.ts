export interface User {
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  roles?: string[];
  isTemporaryPassword?: boolean;
}

export interface UserDTO {
  userId: string;
  userName: string;
  userEmail: string;
  mobileNumber: string;
  isActive: boolean;
  isVerified: boolean;
  roleNames: string[];
  companyName?: string;
  createdAt: string;
  isTemporaryPassword?: boolean;
}

export interface UserUpdateRequest {
  userName: string;
  mobileNumber: string;
}

export interface StaffCreateRequest {
  fullName: string;
  email: string;
  mobileNumber: string;
  password?: string;
  roleName: string;
  companyName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
