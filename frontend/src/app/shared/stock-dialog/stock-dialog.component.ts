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
            <ng-container [ngSwitch]="actionType">
              <span *ngSwitchCase="'IN'">Stock IN</span>
              <span *ngSwitchCase="'OUT'">Stock OUT</span>
              <span *ngSwitchCase="'ADJUST'">Manual Stock Adjustment</span>
            </ng-container>
            — {{ product.name }}
          </h3>
          <button type="button" class="btn btn-sm btn-secondary" (click)="cancel.emit()">✕</button>
        </div>

        <div style="margin-bottom: 16px; font-size: 13px; color: var(--text-muted); background: #faf9f6; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
          <div><strong>SKU:</strong> {{ product.sku }}</div>
          <div><strong>Current Stock:</strong> {{ product.quantity }} {{ product.unit || 'pcs' }}</div>
        </div>

        <div *ngIf="errorMessage" class="banner banner-error" style="margin-bottom: 16px;">
          {{ errorMessage }}
        </div>

        <form [formGroup]="stockForm" (ngSubmit)="onSubmit()">
          <!-- Direction selector for ADJUST mode -->
          <div *ngIf="actionType === 'ADJUST'" class="form-group">
            <label class="form-label">Adjustment Direction *</label>
            <div style="display: flex; gap: 16px; margin-top: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px;">
                <input type="radio" value="IN" formControlName="direction" />
                <span>Add / Found Stock (+)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px;">
                <input type="radio" value="OUT" formControlName="direction" />
                <span>Deduct / Damaged Stock (-)</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="stockQuantity">
              {{ actionType === 'ADJUST' ? 'Adjustment Quantity (' + (product.unit || 'pcs') + ') *' : 'Quantity (' + (product.unit || 'pcs') + ') *' }}
            </label>
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
            <label class="form-label" for="stockNote">
              {{ actionType === 'ADJUST' ? 'Reason / Audit Note *' : 'Note (Optional)' }}
            </label>
            <input
              id="stockNote"
              type="text"
              class="form-control"
              formControlName="note"
              [placeholder]="actionType === 'ADJUST' ? 'e.g. Physical inventory count correction' : 'e.g. Restock shipment / Order dispatch'"
              maxlength="255"
            />
            <div *ngIf="actionType === 'ADJUST' && stockForm.get('note')?.invalid && (stockForm.get('note')?.touched || submitted)" class="form-error">
              <span *ngIf="stockForm.get('note')?.errors?.['required']">Reason is required for manual stock adjustment.</span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancel.emit()" [disabled]="submitting">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting">
              {{ submitting ? 'Submitting...' : (actionType === 'IN' ? 'Add Stock' : (actionType === 'OUT' ? 'Remove Stock' : 'Apply Adjustment')) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class StockDialogComponent {
  @Input({ required: true }) product!: Product;
  @Input({ required: true }) actionType!: 'IN' | 'OUT' | 'ADJUST';
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
      direction: ['IN'],
      quantity: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      note: ['']
    });
  }

  ngOnInit() {
    if (this.actionType === 'ADJUST') {
      this.stockForm.get('note')?.setValidators([Validators.required, Validators.maxLength(255)]);
      this.stockForm.get('note')?.updateValueAndValidity();
    }
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

    const { direction, quantity, note } = this.stockForm.value;
    const numQty = Number(quantity);

    this.submitting = true;
    this.cdr.detectChanges();

    let op$;
    if (this.actionType === 'ADJUST') {
      const change = direction === 'OUT' ? -numQty : numQty;
      op$ = this.productService.adjustStock(this.product.id, {
        quantityChange: change,
        reason: note.trim()
      });
    } else if (this.actionType === 'IN') {
      op$ = this.productService.stockIn(this.product.id, {
        quantity: numQty,
        note: note ? note.trim() : undefined
      });
    } else {
      op$ = this.productService.stockOut(this.product.id, {
        quantity: numQty,
        note: note ? note.trim() : undefined
      });
    }

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
