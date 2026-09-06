export interface Login {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  roles: string[];
  token: string;
  tokenType?: string;
  userName?: string;
  userEmail?: string;
  expiresAt?: any;
  isTemporaryPassword?: boolean;
}
