import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 480px; margin: 40px auto; padding: 0 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Email Verification</h1>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Verifying in progress -->
      <div *ngIf="verifying" class="state-message" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 32px;">
        Verifying your email address... Please wait.
      </div>

      <!-- Verified Success -->
      <div *ngIf="!verifying && verified" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px; text-align: center;">
        <div style="font-size: 16px; font-weight: 600; color: var(--status-in-stock-text); margin-bottom: 12px;">
          Email Verified Successfully!
        </div>
        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">
          Your account is now active. You can log in to start managing your inventory.
        </p>
        <a routerLink="/login" class="btn btn-primary">Proceed to Sign In</a>
      </div>

      <!-- Verification Failed / Resend section -->
      <div *ngIf="!verifying && !verified" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <p style="font-size: 14px; color: var(--text-main); margin-bottom: 16px;">
          The verification link may be invalid or expired. Enter your email below to receive a fresh verification link:
        </p>

        <form (ngSubmit)="onResend()">
          <div class="form-group">
            <label class="form-label" for="resendEmail">Email Address *</label>
            <input
              id="resendEmail"
              type="email"
              class="form-control"
              [(ngModel)]="resendEmail"
              name="resendEmail"
              placeholder="owner@yourstore.com"
              required
            />
          </div>

          <div style="margin-top: 16px; display: flex; gap: 10px;">
            <button type="submit" class="btn btn-primary" [disabled]="resending || !resendEmail">
              {{ resending ? 'Sending...' : 'Send New Verification Email' }}
            </button>
            <a routerLink="/login" class="btn btn-secondary">Back to Sign In</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  verifying = true;
  verified = false;
  resending = false;
  resendEmail = '';

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.verifying = false;
      this.bannerType = 'error';
      this.bannerMessage = 'No verification token was provided in the link.';
      this.cdr.detectChanges();
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (res) => {
        this.verifying = false;
        this.verified = true;
        this.bannerType = 'success';
        this.bannerMessage = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.verifying = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  onResend(): void {
    if (!this.resendEmail || !this.resendEmail.trim()) {
      return;
    }

    this.resending = true;
    this.cdr.detectChanges();

    this.authService.resendVerification({ email: this.resendEmail.trim() }).subscribe({
      next: (res) => {
        this.resending = false;
        this.bannerType = 'success';
        this.bannerMessage = res.message;
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
