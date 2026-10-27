import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/inventory.model';
import { Sale, SaleRequest, PaymentMethod, PaymentStatus } from '../../models/sale.model';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { extractErrorMessage, extractFieldErrors } from '../../core/http-error.helper';

@Component({
  selector: 'app-record-sale',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MessageBannerComponent,
    StatusBadgeComponent
  ],
  template: `
    <div style="max-width: 960px; margin: 0 auto;">
      <div class="page-header no-print">
        <h1 class="page-title">Record Sale / Billing</h1>
        <a routerLink="/sales" class="btn btn-secondary">Back to Sales</a>
      </div>

      <app-message-banner class="no-print" [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading Catalog -->
      <div *ngIf="loadingCatalog" class="state-message">
        Loading product catalog & stock balances...
      </div>

      <!-- No Products Available Warning -->
      <div *ngIf="!loadingCatalog && products.length === 0" class="table-container state-message" style="padding: 24px;">
        <p style="margin-bottom: 12px; font-weight: 500;">
          No active products found in your inventory. Add products before creating sales.
        </p>
        <a routerLink="/products/new" class="btn btn-primary">Add Product</a>
      </div>

      <!-- Billing Workspace -->
      <div *ngIf="!loadingCatalog && products.length > 0" class="no-print" style="display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start;">
        <!-- Left Column: Items Selection Table -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 20px;">
          <form [formGroup]="saleForm" (ngSubmit)="onSubmit()">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
              <h2 style="font-size: 16px; font-weight: 600;">Sale Items</h2>
              <button type="button" class="btn btn-sm btn-secondary" (click)="addItem()">
                + Add Item
              </button>
            </div>

            <div *ngIf="itemsArray.errors?.['required'] && submitted" class="form-error" style="margin-bottom: 10px;">
              At least one sale item is required.
            </div>

            <div class="table-container" style="margin-bottom: 16px;">
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 38%;">Product *</th>
                    <th style="width: 24%; text-align: center;">Qty *</th>
                    <th style="width: 18%; text-align: right;">Price (₹) *</th>
                    <th style="width: 14%; text-align: right;">Total (₹)</th>
                    <th style="width: 6%; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody formArrayName="items">
                  <tr *ngFor="let itemGroup of itemsArray.controls; let i = index" [formGroupName]="i">
                    <!-- Product Selector -->
                    <td>
                      <select class="form-control" formControlName="productId" (change)="onProductChange(i)">
                        <option value="">Select product...</option>
                        <option *ngFor="let p of products" [value]="p.id" [disabled]="p.quantity <= 0">
                          {{ p.name }} ({{ p.sku }}) — Stock: {{ p.quantity }} {{ p.unit }} {{ p.quantity <= 0 ? ' [OUT OF STOCK]' : '' }}
                        </option>
                      </select>
                      <div *ngIf="getSelectedProduct(i) as sp" style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
                        Avail: <strong [style.color]="sp.quantity > 5 ? 'var(--status-in-stock-text)' : 'var(--danger-color)'">{{ sp.quantity }} {{ sp.unit }}</strong>
                      </div>
                      <div *ngIf="itemGroup.get('productId')?.invalid && (itemGroup.get('productId')?.touched || submitted)" class="form-error">
                        Product required.
                      </div>
                    </td>

                    <!-- Quantity with +/- buttons -->
                    <td>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          style="padding: 2px 7px; font-weight: 700; height: 32px;"
                          (click)="decrementQty(i)"
                          [disabled]="itemGroup.get('quantity')?.value <= 1"
                        >-</button>

                        <input
                          type="number"
                          class="form-control"
                          style="width: 60px; text-align: center; height: 32px; padding: 2px 4px;"
                          formControlName="quantity"
                          min="1"
                          [max]="itemGroup.get('availableStock')?.value || 999999"
                          step="1"
                          (input)="onQtyInput(i)"
                        />

                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          style="padding: 2px 7px; font-weight: 700; height: 32px;"
                          (click)="incrementQty(i)"
                          [disabled]="itemGroup.get('quantity')?.value >= itemGroup.get('availableStock')?.value"
                        >+</button>
                      </div>

                      <div *ngIf="itemGroup.get('quantity')?.errors?.['min'] && (itemGroup.get('quantity')?.touched || submitted)" class="form-error" style="text-align: center;">
                        Min 1.
                      </div>
                      <div *ngIf="itemGroup.get('quantity')?.errors?.['max'] && (itemGroup.get('quantity')?.touched || submitted)" class="form-error" style="text-align: center;">
                        Max {{ itemGroup.get('availableStock')?.value }}.
                      </div>
                    </td>

                    <!-- Unit Selling Price -->
                    <td>
                      <input
                        type="number"
                        class="form-control"
                        style="text-align: right; height: 32px;"
                        formControlName="unitPrice"
                        min="0"
                        step="0.01"
                      />
                      <div *ngIf="itemGroup.get('unitPrice')?.invalid && (itemGroup.get('unitPrice')?.touched || submitted)" class="form-error">
                        >= 0.
                      </div>
                    </td>

                    <!-- Line Total -->
                    <td style="text-align: right; font-weight: 600; vertical-align: middle; white-space: nowrap;">
                      ₹{{ getItemLineTotal(i) | number:'1.2-2' }}
                    </td>

                    <!-- Remove Item -->
                    <td style="text-align: center; vertical-align: middle;">
                      <button
                        type="button"
                        class="btn btn-sm btn-danger-outline"
                        style="padding: 2px 6px; font-size: 14px;"
                        title="Remove item"
                        [disabled]="itemsArray.length <= 1"
                        (click)="removeItem(i)"
                      >×</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Notes Section -->
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="notes">Notes / Bill Remarks (Optional)</label>
              <textarea
                id="notes"
                class="form-control"
                formControlName="notes"
                placeholder="e.g. 5% festival discount applied; customer pickup."
                rows="2"
                maxlength="500"
              ></textarea>
            </div>
          </form>
        </div>

        <!-- Right Column: Customer Info, Payment & Summary -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 20px;">
          <h2 style="font-size: 15px; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            Customer & Payment
          </h2>

          <form [formGroup]="saleForm" (ngSubmit)="onSubmit()">
            <!-- Customer Name -->
            <div class="form-group">
              <label class="form-label" for="customerName">Customer Name</label>
              <input
                id="customerName"
                type="text"
                class="form-control"
                formControlName="customerName"
                placeholder="e.g. Ramesh Kumar"
                maxlength="100"
              />
            </div>

            <!-- Customer Phone -->
            <div class="form-group">
              <label class="form-label" for="customerPhone">Customer Phone</label>
              <input
                id="customerPhone"
                type="tel"
                class="form-control"
                formControlName="customerPhone"
                placeholder="e.g. 9876543210"
                maxlength="20"
              />
            </div>

            <!-- Payment Method -->
            <div class="form-group">
              <label class="form-label" for="paymentMethod">Payment Method *</label>
              <select id="paymentMethod" class="form-control" formControlName="paymentMethod" (change)="onPaymentMethodChange()">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CREDIT">Credit (Udhaar)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <!-- Payment Status -->
            <div class="form-group">
              <label class="form-label" for="paymentStatus">Payment Status *</label>
              <select id="paymentStatus" class="form-control" formControlName="paymentStatus">
                <option value="PAID">Paid (Settled)</option>
                <option value="PENDING">Pending (Receivable / Udhaar)</option>
              </select>
            </div>

            <!-- Billing Calculations -->
            <div style="background-color: var(--bg-page); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px; margin-top: 20px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span style="color: var(--text-muted);">Subtotal:</span>
                <span style="font-weight: 600;">₹{{ calculateSubtotal() | number:'1.2-2' }}</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px;">
                <label for="discount" style="color: var(--text-muted); margin: 0;">Discount (₹):</label>
                <input
                  id="discount"
                  type="number"
                  class="form-control"
                  style="width: 100px; text-align: right; height: 30px;"
                  formControlName="discount"
                  min="0"
                  [max]="calculateSubtotal()"
                  step="0.01"
                />
              </div>

              <div *ngIf="saleForm.get('discount')?.errors?.['max']" class="form-error" style="text-align: right; margin-bottom: 8px;">
                Cannot exceed subtotal.
              </div>

              <div style="border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 15px; font-weight: 700;">Grand Total:</span>
                <span style="font-size: 20px; font-weight: 700; color: var(--accent-color);">
                  ₹{{ calculateGrandTotal() | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <button
              type="submit"
              class="btn btn-primary"
              style="width: 100%; padding: 10px 16px; font-size: 15px; font-weight: 600;"
              [disabled]="submitting || itemsArray.length === 0"
            >
              {{ submitting ? 'Processing Sale...' : 'Complete Sale (₹' + (calculateGrandTotal() | number:'1.2-2') + ')' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Post-Sale Receipt / Invoice Dialog Modal -->
      <div *ngIf="showInvoiceModal && createdSale" class="modal-overlay">
        <div class="modal-dialog" style="max-width: 580px;">
          <div class="modal-header no-print">
            <h2 class="modal-title">✓ Sale Completed — {{ createdSale.billNumber }}</h2>
            <button type="button" class="btn btn-sm btn-secondary" (click)="closeModal()">×</button>
          </div>

          <!-- Printable Receipt Card -->
          <div class="printable-area invoice-card" style="margin-bottom: 16px; border: 1px dashed var(--border-color); padding: 16px; font-family: monospace, sans-serif;">
            <div style="text-align: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
              <div style="font-size: 18px; font-weight: 700; text-transform: uppercase;">
                {{ (authService.currentUser$ | async)?.businessName || 'StockPilot Store' }}
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                RETAIL SALES INVOICE
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px;">
              <div>
                <div><strong>Bill #:</strong> {{ createdSale.billNumber }}</div>
                <div><strong>Date:</strong> {{ createdSale.createdAt | date:'medium' }}</div>
              </div>
              <div style="text-align: right;">
                <div><strong>Customer:</strong> {{ createdSale.customerName || 'Walk-in' }}</div>
                <div *ngIf="createdSale.customerPhone"><strong>Phone:</strong> {{ createdSale.customerPhone }}</div>
                <div style="margin-top: 4px;"><strong>Payment:</strong> {{ createdSale.paymentMethod }} <app-status-badge [status]="createdSale.paymentStatus"></app-status-badge></div>
              </div>
            </div>

            <!-- Receipt Items Table -->
            <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-bottom: 12px;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                  <th style="padding: 4px 0;">Item</th>
                  <th style="padding: 4px 0; text-align: center;">Qty</th>
                  <th style="padding: 4px 0; text-align: right;">Price</th>
                  <th style="padding: 4px 0; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let it of createdSale.items" style="border-bottom: 1px dotted #eee;">
                  <td style="padding: 4px 0;">{{ it.productName }} ({{ it.sku }})</td>
                  <td style="padding: 4px 0; text-align: center;">{{ it.quantity }} {{ it.unit }}</td>
                  <td style="padding: 4px 0; text-align: right;">₹{{ it.unitPrice | number:'1.2-2' }}</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: 600;">₹{{ it.lineTotal | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Receipt Summary -->
            <div style="border-top: 1px dashed var(--border-color); padding-top: 8px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Subtotal:</span>
                <span>₹{{ createdSale.subtotal | number:'1.2-2' }}</span>
              </div>
              <div *ngIf="createdSale.discount > 0" style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--danger-color);">
                <span>Discount:</span>
                <span>-₹{{ createdSale.discount | number:'1.2-2' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 6px;">
                <span>Grand Total:</span>
                <span>₹{{ createdSale.grandTotal | number:'1.2-2' }}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 16px; font-size: 11px; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 8px;">
              Thank you for your visit! Please retain this invoice for your records.
            </div>
          </div>

          <!-- Dialog Buttons -->
          <div class="modal-footer no-print">
            <button type="button" class="btn btn-secondary" (click)="printReceipt()">
              🖨️ Print Receipt
            </button>
            <button type="button" class="btn btn-secondary" (click)="viewSaleDetails(createdSale.id)">
              View Full Document
            </button>
            <button type="button" class="btn btn-primary" (click)="resetForNextSale()">
              + New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RecordSaleComponent implements OnInit {
  saleForm!: FormGroup;
  products: Product[] = [];
  loadingCatalog: boolean = true;
  submitting: boolean = false;
  submitted: boolean = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';
  backendFieldErrors: Record<string, string> | null = null;

  showInvoiceModal: boolean = false;
  createdSale: Sale | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService,
    private saleService: SaleService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCatalog();
  }

  get itemsArray(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }

  private initForm(): void {
    this.saleForm = this.fb.group({
      customerName: [''],
      customerPhone: [''],
      paymentMethod: ['CASH', Validators.required],
      paymentStatus: ['PAID', Validators.required],
      discount: [0, [Validators.min(0)]],
      notes: [''],
      items: this.fb.array([], [Validators.required])
    });

    this.addItem();
  }

  private loadCatalog(): void {
    this.loadingCatalog = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loadingCatalog = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.loadingCatalog = false;
        this.cdr.detectChanges();
      }
    });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      availableStock: [0]
    });

    this.itemsArray.push(itemGroup);
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  onProductChange(index: number): void {
    const group = this.itemsArray.at(index);
    const productId = Number(group.get('productId')?.value);
    const product = this.products.find((p) => p.id === productId);

    if (product) {
      group.patchValue({
        unitPrice: product.unitPrice || 0,
        availableStock: product.quantity
      });
      group.get('quantity')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(product.quantity)
      ]);
      group.get('quantity')?.updateValueAndValidity();

      // If existing qty is greater than stock, clamp to stock
      const currentQty = group.get('quantity')?.value;
      if (currentQty > product.quantity && product.quantity > 0) {
        group.patchValue({ quantity: product.quantity });
      }
    }
  }

  getSelectedProduct(index: number): Product | undefined {
    const productId = Number(this.itemsArray.at(index).get('productId')?.value);
    return this.products.find((p) => p.id === productId);
  }

  incrementQty(index: number): void {
    const group = this.itemsArray.at(index);
    const current = Number(group.get('quantity')?.value || 1);
    const max = Number(group.get('availableStock')?.value || 999999);
    if (current < max) {
      group.patchValue({ quantity: current + 1 });
    }
  }

  decrementQty(index: number): void {
    const group = this.itemsArray.at(index);
    const current = Number(group.get('quantity')?.value || 1);
    if (current > 1) {
      group.patchValue({ quantity: current - 1 });
    }
  }

  onQtyInput(index: number): void {
    const group = this.itemsArray.at(index);
    const val = Number(group.get('quantity')?.value);
    const max = Number(group.get('availableStock')?.value || 999999);
    if (val > max && max > 0) {
      group.patchValue({ quantity: max });
    }
  }

  onPaymentMethodChange(): void {
    const method = this.saleForm.get('paymentMethod')?.value as PaymentMethod;
    if (method === 'CREDIT') {
      this.saleForm.patchValue({ paymentStatus: 'PENDING' });
    } else {
      this.saleForm.patchValue({ paymentStatus: 'PAID' });
    }
  }

  getItemLineTotal(index: number): number {
    const group = this.itemsArray.at(index);
    const qty = Number(group.get('quantity')?.value || 0);
    const price = Number(group.get('unitPrice')?.value || 0);
    return Math.round(qty * price * 100) / 100;
  }

  calculateSubtotal(): number {
    let sum = 0;
    for (let i = 0; i < this.itemsArray.length; i++) {
      sum += this.getItemLineTotal(i);
    }
    return Math.round(sum * 100) / 100;
  }

  calculateGrandTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discount = Number(this.saleForm.get('discount')?.value || 0);
    return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  }

  onSubmit(): void {
    this.submitted = true;
    this.bannerType = null;
    this.bannerMessage = '';
    this.backendFieldErrors = null;

    if (this.saleForm.invalid) {
      this.bannerType = 'error';
      this.bannerMessage = 'Please correct the highlighted form errors before completing the sale.';
      return;
    }

    const subtotal = this.calculateSubtotal();
    const discount = Number(this.saleForm.get('discount')?.value || 0);
    if (discount > subtotal) {
      this.bannerType = 'error';
      this.bannerMessage = 'Discount cannot exceed order subtotal.';
      return;
    }

    this.submitting = true;
    const formVal = this.saleForm.value;

    const request: SaleRequest = {
      customerName: formVal.customerName ? formVal.customerName.trim() : null,
      customerPhone: formVal.customerPhone ? formVal.customerPhone.trim() : null,
      paymentMethod: formVal.paymentMethod,
      paymentStatus: formVal.paymentStatus,
      discount: discount,
      notes: formVal.notes ? formVal.notes.trim() : null,
      items: formVal.items.map((it: any) => ({
        productId: Number(it.productId),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice)
      }))
    };

    this.saleService.createSale(request).subscribe({
      next: (sale) => {
        this.submitting = false;
        this.createdSale = sale;
        this.showInvoiceModal = true;
        this.bannerType = 'success';
        this.bannerMessage = `Sale recorded successfully! Invoice #${sale.billNumber} generated.`;
        // Refresh catalog in background to update local stock levels
        this.loadCatalog();
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

  closeModal(): void {
    this.showInvoiceModal = false;
  }

  printReceipt(): void {
    window.print();
  }

  viewSaleDetails(saleId: number): void {
    this.showInvoiceModal = false;
    this.router.navigate(['/sales', saleId]);
  }

  resetForNextSale(): void {
    this.showInvoiceModal = false;
    this.createdSale = null;
    this.submitted = false;
    this.bannerType = null;
    this.bannerMessage = '';
    this.initForm();
    this.loadCatalog();
  }
}
