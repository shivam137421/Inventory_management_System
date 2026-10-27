import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PurchaseService } from '../../services/purchase.service';
import { SupplierService } from '../../services/supplier.service';
import { ProductService } from '../../services/product.service';
import { Supplier } from '../../models/supplier.model';
import { Product } from '../../models/inventory.model';
import { PurchaseRequest, PurchaseItemRequest } from '../../models/purchase.model';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage, extractFieldErrors } from '../../core/http-error.helper';

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div style="max-width: 900px; margin: 0 auto;">
      <div class="page-header">
        <h1 class="page-title">Create Purchase Order</h1>
        <a routerLink="/purchases" class="btn btn-secondary">Back to Purchases</a>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading State -->
      <div *ngIf="loadingInitial" class="state-message">
        Loading suppliers and catalog...
      </div>

      <!-- No Suppliers Warning -->
      <div *ngIf="!loadingInitial && suppliers.length === 0" class="table-container state-message" style="padding: 24px;">
        <p style="margin-bottom: 12px; font-weight: 500;">
          No active suppliers found. You need at least one supplier before creating a purchase order.
        </p>
        <a routerLink="/suppliers/new" class="btn btn-primary">Add Supplier First</a>
      </div>

      <!-- No Products Warning -->
      <div *ngIf="!loadingInitial && suppliers.length > 0 && products.length === 0" class="table-container state-message" style="padding: 24px;">
        <p style="margin-bottom: 12px; font-weight: 500;">
          No products found in catalog. Add products first before ordering stock.
        </p>
        <a routerLink="/products/new" class="btn btn-primary">Add Product First</a>
      </div>

      <!-- Form Container -->
      <div *ngIf="!loadingInitial && suppliers.length > 0 && products.length > 0" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 24px;">
        <form [formGroup]="purchaseForm" (ngSubmit)="onSubmit()">
          <!-- Section 1: Order Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div class="form-group">
              <label class="form-label" for="supplierId">Supplier *</label>
              <select id="supplierId" class="form-control" formControlName="supplierId">
                <option value="">Select a supplier...</option>
                <option *ngFor="let s of suppliers" [value]="s.id">
                  {{ s.name }} {{ s.contactPerson ? '(' + s.contactPerson + ')' : '' }}
                </option>
              </select>
              <div *ngIf="purchaseForm.get('supplierId')?.invalid && (purchaseForm.get('supplierId')?.touched || submitted)" class="form-error">
                <span *ngIf="purchaseForm.get('supplierId')?.errors?.['required']">Supplier is required.</span>
              </div>
              <div *ngIf="backendFieldErrors?.['supplierId']" class="form-error">
                {{ backendFieldErrors!['supplierId'] }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="supplierInvoiceNo">Supplier Bill / Invoice # (Optional)</label>
              <input
                id="supplierInvoiceNo"
                type="text"
                class="form-control"
                formControlName="supplierInvoiceNo"
                placeholder="e.g. INV-2026-9041"
                maxlength="100"
              />
              <div *ngIf="purchaseForm.get('supplierInvoiceNo')?.invalid && (purchaseForm.get('supplierInvoiceNo')?.touched || submitted)" class="form-error">
                <span *ngIf="purchaseForm.get('supplierInvoiceNo')?.errors?.['maxlength']">Must not exceed 100 characters.</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Line Items -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <h2 style="font-size: 15px; font-weight: 600; color: var(--text-main);">Order Items</h2>
              <button type="button" class="btn btn-sm btn-secondary" (click)="addItem()">
                + Add Line Item
              </button>
            </div>

            <div *ngIf="itemsArray.errors?.['required'] && submitted" class="form-error" style="margin-bottom: 10px;">
              At least one line item is required.
            </div>

            <div class="table-container" style="margin-bottom: 12px;">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 40%;">Product *</th>
                    <th style="width: 20%; text-align: right;">Quantity *</th>
                    <th style="width: 20%; text-align: right;">Unit Cost (₹) *</th>
                    <th style="width: 15%; text-align: right;">Line Total (₹)</th>
                    <th style="width: 5%; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody formArrayName="items">
                  <tr *ngFor="let itemGroup of itemsArray.controls; let i = index" [formGroupName]="i">
                    <!-- Product Dropdown -->
                    <td>
                      <select class="form-control" formControlName="productId" (change)="onProductChange(i)">
                        <option value="">Select product...</option>
                        <option *ngFor="let p of products" [value]="p.id">
                          {{ p.name }} ({{ p.sku }}) — Current: {{ p.quantity }} {{ p.unit }}
                        </option>
                      </select>
                      <div *ngIf="itemGroup.get('productId')?.invalid && (itemGroup.get('productId')?.touched || submitted)" class="form-error">
                        Product required.
                      </div>
                    </td>

                    <!-- Quantity with Unit label -->
                    <td>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <input
                          type="number"
                          class="form-control"
                          style="text-align: right;"
                          formControlName="quantity"
                          min="1"
                          step="1"
                          placeholder="1"
                        />
                        <span style="font-size: 12px; color: var(--text-muted); min-width: 30px;">
                          {{ getProductUnit(i) }}
                        </span>
                      </div>
                      <div *ngIf="itemGroup.get('quantity')?.invalid && (itemGroup.get('quantity')?.touched || submitted)" class="form-error">
                        Min 1.
                      </div>
                    </td>

                    <!-- Unit Cost Price -->
                    <td>
                      <input
                        type="number"
                        class="form-control"
                        style="text-align: right;"
                        formControlName="unitPrice"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <div *ngIf="itemGroup.get('unitPrice')?.invalid && (itemGroup.get('unitPrice')?.touched || submitted)" class="form-error">
                        >= 0.00.
                      </div>
                    </td>

                    <!-- Line Total -->
                    <td style="text-align: right; font-weight: 600; vertical-align: middle;">
                      ₹{{ getLineTotal(i) | number:'1.2-2' }}
                    </td>

                    <!-- Remove Item Button -->
                    <td style="text-align: center; vertical-align: middle;">
                      <button
                        type="button"
                        class="btn btn-sm btn-danger-outline"
                        style="padding: 2px 6px; font-size: 14px;"
                        title="Remove Item"
                        [disabled]="itemsArray.length <= 1"
                        (click)="removeItem(i)"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style="background-color: #f1efe9; font-weight: 600;">
                    <td colspan="3" style="text-align: right; padding: 10px 14px;">Total Order Amount:</td>
                    <td style="text-align: right; padding: 10px 14px; font-size: 15px; color: var(--accent-color);">
                      ₹{{ calculateGrandTotal() | number:'1.2-2' }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Section 3: Notes -->
          <div class="form-group">
            <label class="form-label" for="notes">Notes / Delivery Instructions</label>
            <textarea
              id="notes"
              class="form-control"
              formControlName="notes"
              placeholder="e.g. Deliver to warehouse rear gate; 30-day credit term."
              rows="2"
              maxlength="1000"
            ></textarea>
            <div *ngIf="purchaseForm.get('notes')?.invalid && (purchaseForm.get('notes')?.touched || submitted)" class="form-error">
              <span *ngIf="purchaseForm.get('notes')?.errors?.['maxlength']">Must not exceed 1000 characters.</span>
            </div>
          </div>

          <!-- Section 4: Actions -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
            <a routerLink="/purchases" class="btn btn-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting">
              {{ submitting ? 'Saving...' : 'Save Purchase Order (Draft)' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PurchaseFormComponent implements OnInit {
  purchaseForm!: FormGroup;
  suppliers: Supplier[] = [];
  products: Product[] = [];
  loadingInitial: boolean = true;
  submitting: boolean = false;
  submitted: boolean = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';
  backendFieldErrors: Record<string, string> | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliersAndProducts();
  }

  private initForm(): void {
    this.purchaseForm = this.fb.group({
      supplierId: ['', Validators.required],
      supplierInvoiceNo: ['', Validators.maxLength(100)],
      notes: ['', Validators.maxLength(1000)],
      items: this.fb.array([], Validators.required)
    });

    // Add first item row by default
    this.addItem();
  }

  get itemsArray(): FormArray {
    return this.purchaseForm.get('items') as FormArray;
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  onProductChange(index: number): void {
    const itemGroup = this.itemsArray.at(index);
    const productId = Number(itemGroup.get('productId')?.value);
    const matchedProduct = this.products.find((p) => p.id === productId);

    if (matchedProduct) {
      // Auto fill purchase price if set, or fallback to unitPrice
      const defaultPrice = matchedProduct.purchasePrice && matchedProduct.purchasePrice > 0
        ? matchedProduct.purchasePrice
        : (matchedProduct.unitPrice || 0);

      itemGroup.patchValue({
        unitPrice: defaultPrice
      });
    }
  }

  getProductUnit(index: number): string {
    const itemGroup = this.itemsArray.at(index);
    const productId = Number(itemGroup.get('productId')?.value);
    const matchedProduct = this.products.find((p) => p.id === productId);
    return matchedProduct?.unit || 'pcs';
  }

  getLineTotal(index: number): number {
    const itemGroup = this.itemsArray.at(index);
    const qty = Number(itemGroup.get('quantity')?.value) || 0;
    const price = Number(itemGroup.get('unitPrice')?.value) || 0;
    return qty * price;
  }

  calculateGrandTotal(): number {
    let sum = 0;
    for (let i = 0; i < this.itemsArray.length; i++) {
      sum += this.getLineTotal(i);
    }
    return sum;
  }

  private loadSuppliersAndProducts(): void {
    this.loadingInitial = true;
    this.supplierService.getSuppliers(true).subscribe({
      next: (supData) => {
        this.suppliers = supData;
        this.productService.getProducts().subscribe({
          next: (prodData) => {
            this.products = prodData.filter((p) => p.isActive);
            this.loadingInitial = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loadingInitial = false;
            this.bannerType = 'error';
            this.bannerMessage = extractErrorMessage(err);
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.loadingInitial = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.bannerType = null;
    this.backendFieldErrors = null;

    if (this.purchaseForm.invalid) {
      return;
    }

    if (this.itemsArray.length === 0) {
      this.bannerType = 'error';
      this.bannerMessage = 'Please add at least one line item to the order.';
      return;
    }

    this.submitting = true;
    const formVal = this.purchaseForm.value;

    const items: PurchaseItemRequest[] = formVal.items.map((item: { productId: string | number; quantity: number; unitPrice: number }) => ({
      productId: Number(item.productId),
      quantity: Math.floor(Number(item.quantity)),
      unitPrice: Number(item.unitPrice)
    }));

    const request: PurchaseRequest = {
      supplierId: Number(formVal.supplierId),
      supplierInvoiceNo: formVal.supplierInvoiceNo?.trim() || null,
      notes: formVal.notes?.trim() || null,
      items
    };

    this.purchaseService.createPurchase(request).subscribe({
      next: (created) => {
        this.submitting = false;
        this.router.navigate(['/purchases', created.id]);
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
