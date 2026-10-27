import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { SupplierRequest } from '../../models/supplier.model';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage, extractFieldErrors } from '../../core/http-error.helper';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 600px; margin: 0 auto;">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? 'Edit Supplier' : 'Add New Supplier' }}</h1>
        <a routerLink="/suppliers" class="btn btn-secondary">Back to Suppliers</a>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading supplier details...
      </div>

      <!-- Supplier Not Found -->
      <div *ngIf="notFound && !loading" class="table-container state-message" style="padding: 24px;">
        <p style="margin-bottom: 12px; color: var(--danger-color); font-weight: 500;">Supplier not found.</p>
        <a routerLink="/suppliers" class="btn btn-secondary">Return to Suppliers</a>
      </div>

      <!-- Form Container -->
      <div *ngIf="!loading && !notFound" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()">
          <!-- Supplier Name -->
          <div class="form-group">
            <label class="form-label" for="name">Supplier Name *</label>
            <input
              id="name"
              type="text"
              class="form-control"
              formControlName="name"
              placeholder="e.g. Ramesh Agro Distributors"
              maxlength="150"
            />
            <div *ngIf="supplierForm.get('name')?.invalid && (supplierForm.get('name')?.touched || submitted)" class="form-error">
              <span *ngIf="supplierForm.get('name')?.errors?.['required']">Supplier name is required.</span>
              <span *ngIf="supplierForm.get('name')?.errors?.['maxlength']">Must not exceed 150 characters.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['name']" class="form-error">
              {{ backendFieldErrors!['name'] }}
            </div>
          </div>

          <!-- Contact Person & Phone in 2 columns -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label" for="contactPerson">Contact Person</label>
              <input
                id="contactPerson"
                type="text"
                class="form-control"
                formControlName="contactPerson"
                placeholder="e.g. Rajesh Kumar"
                maxlength="100"
              />
              <div *ngIf="supplierForm.get('contactPerson')?.invalid && (supplierForm.get('contactPerson')?.touched || submitted)" class="form-error">
                <span *ngIf="supplierForm.get('contactPerson')?.errors?.['maxlength']">Must not exceed 100 characters.</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="phone">Phone Number</label>
              <input
                id="phone"
                type="text"
                class="form-control"
                formControlName="phone"
                placeholder="e.g. 9876543210"
                maxlength="20"
              />
              <div *ngIf="supplierForm.get('phone')?.invalid && (supplierForm.get('phone')?.touched || submitted)" class="form-error">
                <span *ngIf="supplierForm.get('phone')?.errors?.['maxlength']">Must not exceed 20 characters.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['phone']" class="form-error">
                {{ backendFieldErrors!['phone'] }}
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="e.g. orders@rameshagro.com"
              maxlength="150"
            />
            <div *ngIf="supplierForm.get('email')?.invalid && (supplierForm.get('email')?.touched || submitted)" class="form-error">
              <span *ngIf="supplierForm.get('email')?.errors?.['email']">Please enter a valid email address.</span>
              <span *ngIf="supplierForm.get('email')?.errors?.['maxlength']">Must not exceed 150 characters.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['email']" class="form-error">
              {{ backendFieldErrors!['email'] }}
            </div>
          </div>

          <!-- Address -->
          <div class="form-group">
            <label class="form-label" for="address">Address</label>
            <input
              id="address"
              type="text"
              class="form-control"
              formControlName="address"
              placeholder="e.g. Shop 12, APMC Market, Pune"
              maxlength="255"
            />
            <div *ngIf="supplierForm.get('address')?.invalid && (supplierForm.get('address')?.touched || submitted)" class="form-error">
              <span *ngIf="supplierForm.get('address')?.errors?.['maxlength']">Must not exceed 255 characters.</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label class="form-label" for="notes">Notes / Terms</label>
            <textarea
              id="notes"
              class="form-control"
              formControlName="notes"
              placeholder="Optional notes, delivery preferences, or credit terms..."
              rows="3"
              maxlength="1000"
            ></textarea>
            <div *ngIf="supplierForm.get('notes')?.invalid && (supplierForm.get('notes')?.touched || submitted)" class="form-error">
              <span *ngIf="supplierForm.get('notes')?.errors?.['maxlength']">Must not exceed 1000 characters.</span>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
            <a routerLink="/suppliers" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting">
              {{ submitting ? 'Saving...' : (isEditMode ? 'Update Supplier' : 'Save Supplier') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class SupplierFormComponent implements OnInit {
  supplierForm!: FormGroup;
  isEditMode: boolean = false;
  supplierId?: number;
  loading: boolean = false;
  submitting: boolean = false;
  submitted: boolean = false;
  notFound: boolean = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';
  backendFieldErrors: Record<string, string> | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.supplierId = Number(idParam);
      this.loadSupplier(this.supplierId);
    }
  }

  private initForm(): void {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      contactPerson: ['', [Validators.maxLength(100)]],
      phone: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
      address: ['', [Validators.maxLength(255)]],
      notes: ['', [Validators.maxLength(1000)]]
    });
  }

  private loadSupplier(id: number): void {
    this.loading = true;
    this.supplierService.getSupplierById(id).subscribe({
      next: (supplier) => {
        this.supplierForm.patchValue({
          name: supplier.name,
          contactPerson: supplier.contactPerson || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          notes: supplier.notes || ''
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.notFound = true;
        } else {
          this.bannerType = 'error';
          this.bannerMessage = extractErrorMessage(err);
        }
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.bannerType = null;
    this.backendFieldErrors = null;

    if (this.supplierForm.invalid) {
      return;
    }

    this.submitting = true;
    const formVal = this.supplierForm.value;
    const request: SupplierRequest = {
      name: formVal.name.trim(),
      contactPerson: formVal.contactPerson?.trim() || null,
      phone: formVal.phone?.trim() || null,
      email: formVal.email?.trim() || null,
      address: formVal.address?.trim() || null,
      notes: formVal.notes?.trim() || null
    };

    const action$ = this.isEditMode && this.supplierId
      ? this.supplierService.updateSupplier(this.supplierId, request)
      : this.supplierService.createSupplier(request);

    action$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/suppliers']);
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
