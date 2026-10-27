import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 440px; margin: 40px auto; padding: 0 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Set New Password</h1>
        <p style="font-size: 14px; color: var(--text-muted);">Enter your new password below</p>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Success Card -->
      <div *ngIf="resetSuccess" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px; text-align: center;">
        <div style="font-size: 16px; font-weight: 600; color: var(--status-in-stock-text); margin-bottom: 12px;">
          Password Reset Successfully!
        </div>
        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">
          Your password has been updated. You can now log in with your new credentials.
        </p>
        <a routerLink="/login" class="btn btn-primary">Proceed to Sign In</a>
      </div>

      <!-- Form -->
      <div *ngIf="!resetSuccess" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
          <!-- New Password -->
          <div class="form-group">
            <label class="form-label" for="newPassword">New Password *</label>
            <input
              id="newPassword"
              type="password"
              class="form-control"
              formControlName="newPassword"
              placeholder="At least 8 characters"
            />
            <div *ngIf="resetForm.get('newPassword')?.invalid && (resetForm.get('newPassword')?.touched || submitted)" class="form-error">
              <span *ngIf="resetForm.get('newPassword')?.errors?.['required']">Password is required.</span>
              <span *ngIf="resetForm.get('newPassword')?.errors?.['minlength']">Password must be at least 8 characters long.</span>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm New Password *</label>
            <input
              id="confirmPassword"
              type="password"
              class="form-control"
              formControlName="confirmPassword"
              placeholder="Re-enter new password"
            />
            <div *ngIf="resetForm.hasError('mismatch') && (resetForm.get('confirmPassword')?.touched || submitted)" class="form-error">
              Passwords do not match.
            </div>
          </div>

          <div style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary" style="width: 100%;" [disabled]="submitting || !token">
              {{ submitting ? 'Resetting Password...' : 'Reset Password' }}
            </button>
          </div>
        </form>
      </div>

      <div *ngIf="!resetSuccess" style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted);">
        Return to
        <a routerLink="/login" style="font-weight: 600; color: var(--accent-color); margin-left: 4px;">Sign In</a>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token = '';
  submitted = false;
  submitting = false;
  resetSuccess = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParams['token'];
    if (!tokenParam) {
      this.bannerType = 'error';
      this.bannerMessage = 'No reset token was found in the link. Please request a new password reset link.';
    } else {
      this.token = tokenParam;
    }
  }

  passwordMatchValidator(g: FormGroup): { mismatch: boolean } | null {
    const pw = g.get('newPassword')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pw === confirm ? null : { mismatch: true };
  }

  onSubmit(): void {
    this.submitted = true;
    this.bannerMessage = null;

    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    this.authService.resetPassword({
      token: this.token,
      newPassword: this.resetForm.get('newPassword')?.value
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.resetSuccess = true;
        this.bannerType = 'success';
        this.bannerMessage = 'Password reset successfully.';
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
