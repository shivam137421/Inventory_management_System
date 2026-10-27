import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 440px; margin: 40px auto; padding: 0 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Sign In to StockPilot</h1>
        <p style="font-size: 14px; color: var(--text-muted);">Manage your inventory and store operations</p>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Resend verification helper banner when unverified -->
      <div *ngIf="showResendOption" style="background-color: #fbefd2; border: 1px solid #d6d3cb; border-radius: 4px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px;">
        <p style="color: #8a5a00; font-weight: 600; margin-bottom: 6px;">Did not receive the verification email?</p>
        <button
          type="button"
          class="btn btn-sm btn-secondary"
          [disabled]="resending"
          (click)="onResendVerification()"
        >
          {{ resending ? 'Sending...' : 'Resend Verification Email' }}
        </button>
      </div>

      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">Email Address *</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="owner@yourstore.com"
              autocomplete="email"
            />
            <div *ngIf="loginForm.get('email')?.invalid && (loginForm.get('email')?.touched || submitted)" class="form-error">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required.</span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email address.</span>
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" for="password" style="margin-bottom: 0;">Password *</label>
              <a routerLink="/forgot-password" style="font-size: 12px; color: var(--accent-color);">Forgot password?</a>
            </div>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <div *ngIf="loginForm.get('password')?.invalid && (loginForm.get('password')?.touched || submitted)" class="form-error">
              <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required.</span>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <button type="submit" class="btn btn-primary" style="width: 100%;" [disabled]="submitting">
              {{ submitting ? 'Signing In...' : 'Sign In' }}
            </button>
          </div>
        </form>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted);">
        Don't have a business account yet?
        <a routerLink="/register" style="font-weight: 600; color: var(--accent-color); margin-left: 4px;">Register Business</a>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  submitted = false;
  submitting = false;
  resending = false;
  showResendOption = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;
  returnUrl = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const returnUrlParam = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrlParam) {
      this.returnUrl = returnUrlParam;
    }

    const verified = this.route.snapshot.queryParams['verified'];
    if (verified === 'true') {
      this.bannerType = 'success';
      this.bannerMessage = 'Your email has been verified successfully. Please log in.';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.bannerMessage = null;
    this.showResendOption = false;

    if (this.loginForm.invalid) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.submitting = false;
        this.bannerType = 'error';
        const msg = extractErrorMessage(err);
        this.bannerMessage = msg;

        if (msg.toLowerCase().includes('not verified')) {
          this.showResendOption = true;
        }

        this.cdr.detectChanges();
      }
    });
  }

  onResendVerification(): void {
    const email = this.loginForm.get('email')?.value;
    if (!email || this.loginForm.get('email')?.invalid) {
      this.bannerType = 'error';
      this.bannerMessage = 'Please enter a valid email address first.';
      this.cdr.detectChanges();
      return;
    }

    this.resending = true;
    this.cdr.detectChanges();

    this.authService.resendVerification({ email: email.trim() }).subscribe({
      next: (res) => {
        this.resending = false;
        this.bannerType = 'success';
        this.bannerMessage = res.message;
        this.showResendOption = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resending = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
