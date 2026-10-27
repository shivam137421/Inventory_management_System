import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import {
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'stockpilot_token';
  private readonly REFRESH_KEY = 'stockpilot_refresh';
  private readonly USER_KEY = 'stockpilot_user';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  public get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  public register(req: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/register`, req);
  }

  public verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  public login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, req).pipe(
      tap((res) => {
        this.saveSession(res);
      })
    );
  }

  public resendVerification(req: ResendVerificationRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/resend-verification`, req);
  }

  public forgotPassword(req: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/forgot-password`, req);
  }

  public resetPassword(req: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/auth/reset-password`, req);
  }

  public logout(): void {
    const refresh = this.refreshToken;
    if (refresh) {
      this.http.post(`${API_BASE_URL}/auth/logout`, { refreshToken: refresh }).subscribe({
        error: () => {
          // Ignore network errors on logout
        }
      });
    }

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
