import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../models/inventory.model';
import { ProductService } from '../../services/product.service';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-stock-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ actionType === 'IN' ? 'Stock IN' : 'Stock OUT' }} — {{ product.name }}
          </h3>
          <button type="button" class="btn btn-sm btn-secondary" (click)="cancel.emit()">✕</button>
        </div>

        <div style="margin-bottom: 16px; font-size: 13px; color: var(--text-muted);">
          <div><strong>SKU:</strong> {{ product.sku }}</div>
          <div><strong>Current Stock:</strong> {{ product.quantity }} units</div>
        </div>

        <div *ngIf="errorMessage" class="banner banner-error" style="margin-bottom: 16px;">
          {{ errorMessage }}
        </div>

        <form [formGroup]="stockForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="stockQuantity">Quantity *</label>
            <input
              id="stockQuantity"
              type="number"
              class="form-control"
              formControlName="quantity"
              placeholder="e.g. 10"
              min="1"
              max="1000000"
            />
            <div *ngIf="stockForm.get('quantity')?.invalid && (stockForm.get('quantity')?.touched || submitted)" class="form-error">
              <span *ngIf="stockForm.get('quantity')?.errors?.['required']">Quantity is required.</span>
              <span *ngIf="stockForm.get('quantity')?.errors?.['min']">Quantity must be at least 1.</span>
              <span *ngIf="stockForm.get('quantity')?.errors?.['max']">Quantity cannot exceed 1,000,000.</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="stockNote">Note (Optional)</label>
            <input
              id="stockNote"
              type="text"
              class="form-control"
              formControlName="note"
              placeholder="e.g. Restock shipment / Order dispatch"
              maxlength="255"
            />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancel.emit()" [disabled]="submitting">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting">
              {{ submitting ? 'Submitting...' : (actionType === 'IN' ? 'Add Stock' : 'Remove Stock') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class StockDialogComponent {
  @Input({ required: true }) product!: Product;
  @Input({ required: true }) actionType!: 'IN' | 'OUT';
  @Output() success = new EventEmitter<Product>();
  @Output() cancel = new EventEmitter<void>();

  stockForm: FormGroup;
  errorMessage: string | null = null;
  submitting = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {
    this.stockForm = this.fb.group({
      quantity: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      note: ['']
    });
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancel.emit();
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = null;

    if (this.stockForm.invalid) {
      return;
    }

    const { quantity, note } = this.stockForm.value;
    const request = {
      quantity: Number(quantity),
      note: note ? note.trim() : undefined
    };

    this.submitting = true;
    this.cdr.detectChanges();

    const op$ = this.actionType === 'IN'
      ? this.productService.stockIn(this.product.id, request)
      : this.productService.stockOut(this.product.id, request);

    op$.subscribe({
      next: (updatedProduct) => {
        this.submitting = false;
        this.cdr.detectChanges();
        this.success.emit(updatedProduct);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
