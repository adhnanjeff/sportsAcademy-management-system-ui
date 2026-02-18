import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  OtpRequest,
  OtpVerifyRequest,
  SignupOtpRequest,
  OtpResponse,
  PasswordOtpRequest,
  PasswordOtpVerifyRequest,
  PasswordResetRequest,
  RefreshTokenRequest,
  MessageResponse
} from '../models';

const AUTH_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'currentUser'
} as const;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  
  // Signals for reactive state
  private readonly _currentUser = signal<User | null>(this.getStoredUser());
  private readonly _isAuthenticated = signal<boolean>(this.hasValidToken());
  private readonly _isLoading = signal<boolean>(false);
  
  // Public computed signals
  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly isLoading = computed(() => this._isLoading());
  readonly userRole = computed(() => this._currentUser()?.role);

  constructor() {
    // Check token validity on service initialization
    this.checkAuthStatus();
  }

  /**
   * Login with email and password
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    return this.api.post<AuthResponse>('/auth/login', request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    return this.api.post<AuthResponse>('/auth/register', request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Request OTP for phone login
   */
  requestOtp(request: OtpRequest): Observable<OtpResponse> {
    this._isLoading.set(true);
    return this.api.post<OtpResponse>('/auth/otp/request', request).pipe(
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify OTP and login
   */
  verifyOtp(request: OtpVerifyRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    return this.api.post<AuthResponse>('/auth/otp/verify', request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  requestSignupOtp(request: SignupOtpRequest): Observable<OtpResponse> {
    this._isLoading.set(true);
    return this.api.post<OtpResponse>('/auth/signup/otp/request', request).pipe(
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  requestPasswordOtp(request: PasswordOtpRequest): Observable<OtpResponse> {
    this._isLoading.set(true);
    return this.api.post<OtpResponse>('/auth/password/otp/request', request).pipe(
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  verifyPasswordOtp(request: PasswordOtpVerifyRequest): Observable<MessageResponse> {
    this._isLoading.set(true);
    return this.api.post<MessageResponse>('/auth/password/otp/verify', request).pipe(
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  resetPassword(request: PasswordResetRequest): Observable<MessageResponse> {
    this._isLoading.set(true);
    return this.api.post<MessageResponse>('/auth/password/reset', request).pipe(
      tap(() => this._isLoading.set(false)),
      catchError(error => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.api.post<AuthResponse>('/auth/refresh', request).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user from API
   */
  getCurrentUser(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      tap(user => {
        this._currentUser.set(user);
        this.setStoredUser(user);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Call logout endpoint (optional - JWT is stateless)
    this.api.post<MessageResponse>('/auth/logout', {}).subscribe({
      complete: () => this.clearAuthData()
    });
    
    // Clear immediately for UX
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if user has valid token
   */
  hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch {
      return false;
    }
  }

  // Private methods
  private handleAuthResponse(response: AuthResponse): void {
    this.setTokens(response.accessToken, response.refreshToken);
    this._currentUser.set(response.user);
    this.setStoredUser(response.user);
    this._isAuthenticated.set(true);
    this._isLoading.set(false);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(AUTH_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  }

  private clearAuthData(): void {
    localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  private checkAuthStatus(): void {
    if (this.hasValidToken() && this._currentUser()) {
      this._isAuthenticated.set(true);
    } else {
      this.clearAuthData();
    }
  }
}
