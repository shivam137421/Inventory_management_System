import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockStatus, TransactionType } from '../../models/inventory.model';

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
  @Input({ required: true }) status!: StockStatus | TransactionType;

  getBadgeClass(): string {
    switch (this.status) {
      case 'IN_STOCK':
        return 'badge-in-stock';
      case 'LOW_STOCK':
        return 'badge-low-stock';
      case 'OUT_OF_STOCK':
        return 'badge-out-of-stock';
      case 'IN':
        return 'badge-in';
      case 'OUT':
        return 'badge-out';
      default:
        return '';
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
      case 'IN':
        return 'IN';
      case 'OUT':
        return 'OUT';
      default:
        return this.status;
    }
  }
}
