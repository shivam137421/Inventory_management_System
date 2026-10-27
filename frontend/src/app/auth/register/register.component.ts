import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage, extractFieldErrors } from '../../core/http-error.helper';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 480px; margin: 30px auto; padding: 0 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Register Business</h1>
        <p style="font-size: 14px; color: var(--text-muted);">Create your store owner account to get started</p>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Registration Success Confirmation Card -->
      <div *ngIf="registeredSuccess" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px; text-align: center;">
        <div style="font-size: 16px; font-weight: 600; color: var(--status-in-stock-text); margin-bottom: 12px;">
          Registration Successful!
        </div>
        <p style="font-size: 14px; color: var(--text-main); line-height: 1.6; margin-bottom: 16px;">
          We have sent a verification link to <strong>{{ registeredEmail }}</strong>.<br>
          Please check your inbox (and spam folder) and click the link to activate your account before logging in.
        </p>
        <a routerLink="/login" class="btn btn-primary">Return to Sign In</a>
      </div>

      <!-- Registration Form -->
      <div *ngIf="!registeredSuccess" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- 1. Business Name -->
          <div class="form-group">
            <label class="form-label" for="businessName">Business / Store Name *</label>
            <input
              id="businessName"
              type="text"
              class="form-control"
              formControlName="businessName"
              placeholder="e.g. Ramesh Kirana & General Store"
              maxlength="150"
            />
            <div *ngIf="registerForm.get('businessName')?.invalid && (registerForm.get('businessName')?.touched || submitted)" class="form-error">
              <span *ngIf="registerForm.get('businessName')?.errors?.['required']">Business name is required.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['businessName']" class="form-error">
              {{ backendFieldErrors!['businessName'] }}
            </div>
          </div>

          <!-- 2. Owner Full Name -->
          <div class="form-group">
            <label class="form-label" for="ownerName">Owner Full Name *</label>
            <input
              id="ownerName"
              type="text"
              class="form-control"
              formControlName="ownerName"
              placeholder="e.g. Ramesh Sharma"
              maxlength="150"
            />
            <div *ngIf="registerForm.get('ownerName')?.invalid && (registerForm.get('ownerName')?.touched || submitted)" class="form-error">
              <span *ngIf="registerForm.get('ownerName')?.errors?.['required']">Owner name is required.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['ownerName']" class="form-error">
              {{ backendFieldErrors!['ownerName'] }}
            </div>
          </div>

          <!-- 3. Email -->
          <div class="form-group">
            <label class="form-label" for="email">Email Address *</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="owner@yourstore.com"
              maxlength="150"
            />
            <div *ngIf="registerForm.get('email')?.invalid && (registerForm.get('email')?.touched || submitted)" class="form-error">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">Email is required.</span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email address.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['email']" class="form-error">
              {{ backendFieldErrors!['email'] }}
            </div>
          </div>

          <!-- 4. Phone (Optional) -->
          <div class="form-group">
            <label class="form-label" for="phone">Mobile Number (Optional)</label>
            <input
              id="phone"
              type="tel"
              class="form-control"
              formControlName="phone"
              placeholder="e.g. 9876543210"
              maxlength="15"
            />
            <div *ngIf="registerForm.get('phone')?.invalid && (registerForm.get('phone')?.touched || submitted)" class="form-error">
              <span *ngIf="registerForm.get('phone')?.errors?.['pattern']">Please enter a valid 10-digit mobile number.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['phone']" class="form-error">
              {{ backendFieldErrors!['phone'] }}
            </div>
          </div>

          <!-- 5. Password -->
          <div class="form-group">
            <label class="form-label" for="password">Password *</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="At least 8 characters"
            />
            <div *ngIf="registerForm.get('password')?.invalid && (registerForm.get('password')?.touched || submitted)" class="form-error">
              <span *ngIf="registerForm.get('password')?.errors?.['required']">Password is required.</span>
              <span *ngIf="registerForm.get('password')?.errors?.['minlength']">Password must be at least 8 characters long.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['password']" class="form-error">
              {{ backendFieldErrors!['password'] }}
            </div>
          </div>

          <div style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary" style="width: 100%;" [disabled]="submitting">
              {{ submitting ? 'Registering Account...' : 'Create Business Account' }}
            </button>
          </div>
        </form>
      </div>

      <div *ngIf="!registeredSuccess" style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted);">
        Already registered?
        <a routerLink="/login" style="font-weight: 600; color: var(--accent-color); margin-left: 4px;">Sign In</a>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  submitting = false;
  registeredSuccess = false;
  registeredEmail = '';

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;
  backendFieldErrors: Record<string, string> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      businessName: ['', [Validators.required, Validators.maxLength(150)]],
      ownerName: ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.pattern('^(?:(?:\\+91|0)?[6-9]\\d{9})?$')]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.bannerMessage = null;
    this.backendFieldErrors = null;

    if (this.registerForm.invalid) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    const formRaw = this.registerForm.getRawValue();
    this.registeredEmail = formRaw.email.trim();

    this.authService.register({
      businessName: formRaw.businessName.trim(),
      ownerName: formRaw.ownerName.trim(),
      email: this.registeredEmail,
      phone: formRaw.phone ? formRaw.phone.trim() : undefined,
      password: formRaw.password
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.registeredSuccess = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitting = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.backendFieldErrors = extractFieldErrors(err);
        this.cdr.detectChanges();
      }
    });
  }
}
