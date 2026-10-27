import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockStatus, TransactionType } from '../../models/inventory.model';
import { PurchaseStatus } from '../../models/purchase.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()">
      {{ getDisplayLabel() }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: StockStatus | TransactionType | PurchaseStatus | string;

  getBadgeClass(): string {
    switch (this.status) {
      case 'IN_STOCK':
      case 'RECEIVED':
      case 'PAID':
        return 'badge-in-stock';
      case 'LOW_STOCK':
      case 'DRAFT':
      case 'PENDING':
        return 'badge-low-stock';
      case 'OUT_OF_STOCK':
      case 'CANCELLED':
        return 'badge-out-of-stock';
      case 'IN':
      case 'PURCHASE_RECEIPT':
      case 'ADJUSTMENT_IN':
        return 'badge-in';
      case 'OUT':
      case 'SALE':
      case 'ADJUSTMENT_OUT':
        return 'badge-out';
      case 'UPI':
      case 'CARD':
        return 'badge-info';
      case 'CASH':
      case 'CREDIT':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  }

  getDisplayLabel(): string {
    switch (this.status) {
      case 'IN_STOCK':
        return 'In Stock';
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      case 'DRAFT':
        return 'Draft';
      case 'RECEIVED':
        return 'Received';
      case 'CANCELLED':
        return 'Cancelled';
      case 'PAID':
        return 'Paid';
      case 'PENDING':
        return 'Pending';
      case 'IN':
        return 'IN';
      case 'OUT':
        return 'OUT';
      case 'PURCHASE_RECEIPT':
        return 'Purchase Receipt';
      case 'SALE':
        return 'Sale';
      case 'ADJUSTMENT_IN':
        return 'Adjustment (IN)';
      case 'ADJUSTMENT_OUT':
        return 'Adjustment (OUT)';
      case 'CASH':
        return 'Cash';
      case 'UPI':
        return 'UPI';
      case 'CARD':
        return 'Card';
      case 'CREDIT':
        return 'Credit (Udhaar)';
      default:
        return this.status;
    }
  }
}

