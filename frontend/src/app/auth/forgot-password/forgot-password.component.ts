import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 440px; margin: 40px auto; padding: 0 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Reset Your Password</h1>
        <p style="font-size: 14px; color: var(--text-muted);">Enter your email address to receive a secure password reset link</p>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <div *ngIf="submittedSuccess" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px; text-align: center;">
        <p style="font-size: 14px; color: var(--text-main); line-height: 1.6; margin-bottom: 20px;">
          If an account exists with <strong>{{ sentEmail }}</strong>, you will receive a password reset link shortly.<br>
          The link will expire in 30 minutes.
        </p>
        <a routerLink="/login" class="btn btn-primary">Return to Sign In</a>
      </div>

      <div *ngIf="!submittedSuccess" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="email">Registered Email Address *</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="owner@yourstore.com"
            />
            <div *ngIf="forgotForm.get('email')?.invalid && (forgotForm.get('email')?.touched || submitted)" class="form-error">
              <span *ngIf="forgotForm.get('email')?.errors?.['required']">Email address is required.</span>
              <span *ngIf="forgotForm.get('email')?.errors?.['email']">Please enter a valid email address.</span>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <button type="submit" class="btn btn-primary" style="width: 100%;" [disabled]="submitting">
              {{ submitting ? 'Sending Link...' : 'Send Password Reset Link' }}
            </button>
          </div>
        </form>
      </div>

      <div *ngIf="!submittedSuccess" style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted);">
        Remember your password?
        <a routerLink="/login" style="font-weight: 600; color: var(--accent-color); margin-left: 4px;">Sign In</a>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  submitted = false;
  submitting = false;
  submittedSuccess = false;
  sentEmail = '';

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.bannerMessage = null;

    if (this.forgotForm.invalid) {
      return;
    }

    this.submitting = true;
    this.sentEmail = this.forgotForm.get('email')?.value.trim();
    this.cdr.detectChanges();

    this.authService.forgotPassword({ email: this.sentEmail }).subscribe({
      next: (res) => {
        this.submitting = false;
        this.submittedSuccess = true;
        this.bannerType = 'success';
        this.bannerMessage = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitting = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
