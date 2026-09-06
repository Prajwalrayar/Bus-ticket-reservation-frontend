import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'authToken';

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }

  private decodePayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  getRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }
    const payload = this.decodePayload(token);
    if (!payload) {
      return [];
    }
    const roles = payload.roles || payload.role || [];
    if (Array.isArray(roles)) {
      return roles;
    }
    if (typeof roles === 'string') {
      return [roles];
    }
    return [];
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodePayload(token);
    return payload?.userId || null;
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(expectedRoles: string[]): boolean {
    const userRoles = this.getRoles();
    return expectedRoles.some(role => userRoles.includes(role));
  }

  getExpiration(): Date | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) {
      return null;
    }
    return new Date(payload.exp * 1000);
  }

  isExpired(): boolean {
    const expiration = this.getExpiration();
    if (!expiration) {
      return false;
    }
    return expiration < new Date();
  }

  isValid(): boolean {
    return this.hasToken() && !this.isExpired();
  }
}
