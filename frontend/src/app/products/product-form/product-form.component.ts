import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage, extractFieldErrors } from '../../core/http-error.helper';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 650px; margin: 0 auto;">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h1>
        <a routerLink="/products" class="btn btn-secondary">Back to Products</a>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading product details...
      </div>

      <!-- Product Not Found State on Edit -->
      <div *ngIf="notFound && !loading" class="table-container state-message" style="padding: 24px;">
        <p style="margin-bottom: 12px; color: var(--danger-color); font-weight: 500;">Product not found.</p>
        <a routerLink="/products" class="btn btn-secondary">Return to Products</a>
      </div>

      <!-- Form Container -->
      <div *ngIf="!loading && !notFound" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <!-- 1. SKU & Category in 2 columns -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label" for="sku">SKU *</label>
              <input
                id="sku"
                type="text"
                class="form-control"
                formControlName="sku"
                placeholder="e.g. ELEC-001"
                maxlength="50"
              />
              <div *ngIf="productForm.get('sku')?.invalid && (productForm.get('sku')?.touched || submitted)" class="form-error">
                <span *ngIf="productForm.get('sku')?.errors?.['required']">SKU is required.</span>
                <span *ngIf="productForm.get('sku')?.errors?.['maxlength']">SKU must not exceed 50 characters.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['sku']" class="form-error">
                {{ backendFieldErrors!['sku'] }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="category">Category *</label>
              <input
                id="category"
                type="text"
                class="form-control"
                formControlName="category"
                placeholder="e.g. Groceries, Spices"
                maxlength="100"
              />
              <div *ngIf="productForm.get('category')?.invalid && (productForm.get('category')?.touched || submitted)" class="form-error">
                <span *ngIf="productForm.get('category')?.errors?.['required']">Category is required.</span>
                <span *ngIf="productForm.get('category')?.errors?.['maxlength']">Category must not exceed 100 characters.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['category']" class="form-error">
                {{ backendFieldErrors!['category'] }}
              </div>
            </div>
          </div>

          <!-- 2. Product Name -->
          <div class="form-group">
            <label class="form-label" for="name">Product Name *</label>
            <input
              id="name"
              type="text"
              class="form-control"
              formControlName="name"
              placeholder="e.g. Basmati Rice 5kg"
              maxlength="150"
            />
            <div *ngIf="productForm.get('name')?.invalid && (productForm.get('name')?.touched || submitted)" class="form-error">
              <span *ngIf="productForm.get('name')?.errors?.['required']">Product name is required.</span>
              <span *ngIf="productForm.get('name')?.errors?.['maxlength']">Product name must not exceed 150 characters.</span>
            </div>
            <div *ngIf="backendFieldErrors?.['name']" class="form-error">
              {{ backendFieldErrors!['name'] }}
            </div>
          </div>

          <!-- 3. Unit of Measure -->
          <div class="form-group">
            <label class="form-label" for="unit">Unit of Measure *</label>
            <div style="display: flex; gap: 8px;">
              <select
                id="unit"
                class="form-control"
                formControlName="unit"
                style="flex: 1;"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="gm">Grams (gm)</option>
                <option value="litre">Litres (litre)</option>
                <option value="ml">Millilitres (ml)</option>
                <option value="packet">Packets (packet)</option>
                <option value="box">Boxes (box)</option>
                <option value="bottle">Bottles (bottle)</option>
                <option value="can">Cans (can)</option>
                <option value="meter">Meters (meter)</option>
                <option value="custom">Other / Custom...</option>
              </select>
              <input
                *ngIf="productForm.get('unit')?.value === 'custom'"
                type="text"
                class="form-control"
                formControlName="customUnit"
                placeholder="e.g. roll, bundle"
                maxlength="30"
                style="flex: 1;"
              />
            </div>
          </div>

          <!-- 4. Quantity and Reorder Level in 2 columns -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label" for="quantity">
                {{ isEditMode ? 'Current Quantity' : 'Opening Quantity *' }}
              </label>
              <input
                id="quantity"
                type="number"
                class="form-control"
                formControlName="quantity"
                placeholder="e.g. 50"
                min="0"
              />
              <div *ngIf="isEditMode" class="form-text">
                Manage stock via Stock In, Stock Out, or Adjust
              </div>
              <div *ngIf="!isEditMode && productForm.get('quantity')?.invalid && (productForm.get('quantity')?.touched || submitted)" class="form-error">
                <span *ngIf="productForm.get('quantity')?.errors?.['required']">Quantity is required.</span>
                <span *ngIf="productForm.get('quantity')?.errors?.['min']">Quantity must be greater than or equal to 0.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['quantity']" class="form-error">
                {{ backendFieldErrors!['quantity'] }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reorderLevel">Reorder Level *</label>
              <input
                id="reorderLevel"
                type="number"
                class="form-control"
                formControlName="reorderLevel"
                placeholder="e.g. 10"
                min="0"
              />
              <div *ngIf="productForm.get('reorderLevel')?.invalid && (productForm.get('reorderLevel')?.touched || submitted)" class="form-error">
                <span *ngIf="productForm.get('reorderLevel')?.errors?.['required']">Reorder level is required.</span>
                <span *ngIf="productForm.get('reorderLevel')?.errors?.['min']">Reorder level must be >= 0.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['reorderLevel']" class="form-error">
                {{ backendFieldErrors!['reorderLevel'] }}
              </div>
            </div>
          </div>

          <!-- 5. Pricing: Selling Price & Purchase Price in 2 columns -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label" for="unitPrice">Selling Price (₹) *</label>
              <input
                id="unitPrice"
                type="number"
                step="0.01"
                class="form-control"
                formControlName="unitPrice"
                placeholder="e.g. 450.00"
                min="0"
              />
              <div *ngIf="productForm.get('unitPrice')?.invalid && (productForm.get('unitPrice')?.touched || submitted)" class="form-error">
                <span *ngIf="productForm.get('unitPrice')?.errors?.['required']">Selling price is required.</span>
                <span *ngIf="productForm.get('unitPrice')?.errors?.['min']">Selling price must be >= 0.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['unitPrice']" class="form-error">
                {{ backendFieldErrors!['unitPrice'] }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="purchasePrice">Purchase / Cost Price (₹)</label>
              <input
                id="purchasePrice"
                type="number"
                step="0.01"
                class="form-control"
                formControlName="purchasePrice"
                placeholder="e.g. 380.00"
                min="0"
              />
              <div *ngIf="productForm.get('purchasePrice')?.invalid && (productForm.get('purchasePrice')?.touched || submitted)" class="form-error">
                <span *ngIf="productForm.get('purchasePrice')?.errors?.['min']">Purchase price must be >= 0.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['purchasePrice']" class="form-error">
                {{ backendFieldErrors!['purchasePrice'] }}
              </div>
            </div>
          </div>

          <!-- 6. Description -->
          <div class="form-group">
            <label class="form-label" for="description">Description (Optional)</label>
            <textarea
              id="description"
              class="form-control"
              formControlName="description"
              placeholder="Product details, packaging size, or notes..."
              rows="3"
              maxlength="1000"
            ></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
            <a routerLink="/products" class="btn btn-secondary" [class.disabled]="submitting">Cancel</a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting">
              {{ submitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProductFormComponent implements OnInit {
  isEditMode = false;
  productId: number | null = null;
  loading = false;
  notFound = false;
  submitting = false;
  submitted = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;
  backendFieldErrors: Record<string, string> | null = null;

  productForm: FormGroup;

  private standardUnits = ['pcs', 'kg', 'gm', 'litre', 'ml', 'packet', 'box', 'bottle', 'can', 'meter'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      category: ['', [Validators.required, Validators.maxLength(100)]],
      unit: ['pcs', [Validators.required]],
      customUnit: [''],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [0, [Validators.required, Validators.min(0)]],
      unitPrice: [null, [Validators.required, Validators.min(0)]],
      purchasePrice: [null, [Validators.min(0)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.productId = Number(idParam);
      this.loadProductForEdit(this.productId);
    }
  }

  loadProductForEdit(id: number): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.loading = false;
        const unitVal = (product.unit || 'pcs').toLowerCase();
        const isStd = this.standardUnits.includes(unitVal);

        this.productForm.patchValue({
          sku: product.sku,
          name: product.name,
          category: product.category,
          unit: isStd ? unitVal : 'custom',
          customUnit: isStd ? '' : unitVal,
          quantity: product.quantity,
          reorderLevel: product.reorderLevel,
          unitPrice: product.unitPrice,
          purchasePrice: product.purchasePrice,
          description: product.description
        });
        this.productForm.get('quantity')?.disable();
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
    this.bannerMessage = null;
    this.backendFieldErrors = null;

    if (this.productForm.invalid) {
      return;
    }

    const formRaw = this.productForm.getRawValue();
    let finalUnit = formRaw.unit;
    if (finalUnit === 'custom') {
      finalUnit = formRaw.customUnit && formRaw.customUnit.trim() ? formRaw.customUnit.trim().toLowerCase() : 'pcs';
    }

    const request = {
      sku: formRaw.sku.trim(),
      name: formRaw.name.trim(),
      category: formRaw.category.trim(),
      unit: finalUnit,
      quantity: Number(formRaw.quantity),
      reorderLevel: Number(formRaw.reorderLevel),
      unitPrice: Number(formRaw.unitPrice),
      purchasePrice: formRaw.purchasePrice != null && formRaw.purchasePrice !== '' ? Number(formRaw.purchasePrice) : null,
      description: formRaw.description ? formRaw.description.trim() : null
    };

    this.submitting = true;

    const save$ = this.isEditMode && this.productId
      ? this.productService.updateProduct(this.productId, request)
      : this.productService.createProduct(request);

    save$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/products']).then(() => {
          // Navigated successfully
        });
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
