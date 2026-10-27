import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, TransactionType, Product } from '../models/inventory.model';
import { TransactionService } from '../services/transaction.service';
import { ProductService } from '../services/product.service';
import { MessageBannerComponent } from '../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge.component';
import { extractErrorMessage } from '../core/http-error.helper';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessageBannerComponent,
    StatusBadgeComponent
  ],
  template: `
    <div>
      <div class="page-header no-print">
        <h1 class="page-title">Stock Ledger & Audit Trail</h1>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" (click)="printLedger()" [disabled]="transactions.length === 0">
            🖨️ Print Ledger
          </button>
        </div>
      </div>

      <app-message-banner class="no-print" [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Ledger Summary Stats -->
      <div *ngIf="!loading && transactions.length > 0" class="no-print" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px;">
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Ledger Records</div>
          <div style="font-size: 20px; font-weight: 700; margin-top: 2px;">{{ transactions.length }}</div>
        </div>

        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Units Added (Inflow)</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--status-in-stock-text); margin-top: 2px;">+{{ totalInflows | number }}</div>
        </div>

        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Units Deducted (Outflow)</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--status-out-of-stock-text); margin-top: 2px;">-{{ totalOutflows | number }}</div>
        </div>

        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Net Movement</div>
          <div style="font-size: 20px; font-weight: 700; margin-top: 2px;" [style.color]="netMovement >= 0 ? 'var(--status-in-stock-text)' : 'var(--status-out-of-stock-text)'">
            {{ netMovement >= 0 ? '+' : '' }}{{ netMovement | number }}
          </div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="no-print" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px 16px; margin-bottom: 20px;">
        <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;">
          <!-- Product Filter -->
          <div style="flex: 1; min-width: 200px;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Product Filter</label>
            <select class="form-control" [(ngModel)]="selectedProductId" (ngModelChange)="loadTransactions()">
              <option value="">All Catalog Products</option>
              <option *ngFor="let p of productOptions" [value]="p.id">
                {{ p.name }} ({{ p.sku }}) — Current Stock: {{ p.quantity }} {{ p.unit }}
              </option>
            </select>
          </div>

          <!-- Transaction Type Filter -->
          <div style="min-width: 170px;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Movement Type</label>
            <select class="form-control" [(ngModel)]="selectedType" (ngModelChange)="loadTransactions()">
              <option value="">All Movement Types</option>
              <option value="OPENING">Initial Opening Stock</option>
              <option value="PURCHASE_RECEIPT">Purchase Receipt (Goods In)</option>
              <option value="SALE">Sale (Goods Out)</option>
              <option value="ADJUSTMENT_IN">Manual Adjustment (IN)</option>
              <option value="ADJUSTMENT_OUT">Manual Adjustment (OUT)</option>
              <option value="IN">Legacy Inflow</option>
              <option value="OUT">Legacy Outflow</option>
            </select>
          </div>

          <!-- Date Range: Start Date -->
          <div style="min-width: 140px;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">From Date</label>
            <input type="date" class="form-control" [(ngModel)]="startDate" (change)="loadTransactions()" />
          </div>

          <!-- Date Range: End Date -->
          <div style="min-width: 140px;">
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">To Date</label>
            <input type="date" class="form-control" [(ngModel)]="endDate" (change)="loadTransactions()" />
          </div>

          <!-- Reset Filter Button -->
          <div>
            <button type="button" class="btn btn-secondary" (click)="resetFilters()">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading stock audit transactions...
      </div>

      <!-- Printable Area & Transactions Table -->
      <div *ngIf="!loading" class="printable-area">
        <div *ngIf="transactions.length === 0" class="table-container state-message" style="padding: 24px;">
          No ledger movements found matching the selected filter criteria.
        </div>

        <div *ngIf="transactions.length > 0" class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 18%;">Timestamp</th>
                <th style="width: 24%;">Product</th>
                <th style="width: 12%;">SKU</th>
                <th style="width: 14%;">Type</th>
                <th style="width: 10%; text-align: right;">Quantity</th>
                <th style="width: 10%; text-align: right;">Resulting Balance</th>
                <th style="width: 12%;">Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions">
                <td style="white-space: nowrap; font-size: 13px;">
                  {{ tx.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}
                </td>
                <td>
                  <strong>{{ tx.productName }}</strong>
                  <div *ngIf="tx.note" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    Note: {{ tx.note }}
                  </div>
                </td>
                <td><strong>{{ tx.sku }}</strong></td>
                <td>
                  <app-status-badge [status]="tx.transactionType"></app-status-badge>
                </td>
                <td style="text-align: right; font-weight: 600; white-space: nowrap;">
                  <span [style.color]="isInflow(tx.transactionType) ? 'var(--status-in-stock-text)' : 'var(--status-out-of-stock-text)'">
                    {{ isInflow(tx.transactionType) ? '+' : '-' }}{{ tx.quantity }}
                  </span>
                </td>
                <td style="text-align: right; font-weight: 600; color: var(--text-main);">
                  {{ tx.resultingQuantity != null ? tx.resultingQuantity : '—' }}
                </td>
                <td style="font-size: 12px; color: var(--text-muted);">
                  <span *ngIf="tx.referenceType">
                    {{ tx.referenceType }} {{ tx.referenceId ? ('#' + tx.referenceId) : '' }}
                  </span>
                  <span *ngIf="!tx.referenceType">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  productOptions: Product[] = [];

  selectedType: '' | TransactionType | string = '';
  selectedProductId: '' | number = '';
  startDate: string = '';
  endDate: string = '';

  loading = true;
  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;

  constructor(
    private transactionService: TransactionService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProductOptions();
    this.loadTransactions();
  }

  loadProductOptions(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.productOptions = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const type = this.selectedType ? (this.selectedType as TransactionType) : undefined;
    const prodId = this.selectedProductId !== '' ? Number(this.selectedProductId) : undefined;

    // Convert date string (YYYY-MM-DD) to ISO format with start/end of day
    let startIso: string | undefined = undefined;
    if (this.startDate) {
      startIso = `${this.startDate}T00:00:00`;
    }

    let endIso: string | undefined = undefined;
    if (this.endDate) {
      endIso = `${this.endDate}T23:59:59`;
    }

    this.transactionService.getTransactions(type, prodId, startIso, endIso).subscribe({
      next: (data) => {
        this.transactions = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  resetFilters(): void {
    this.selectedType = '';
    this.selectedProductId = '';
    this.startDate = '';
    this.endDate = '';
    this.loadTransactions();
  }

  isInflow(type: TransactionType | string): boolean {
    return ['IN', 'OPENING', 'PURCHASE_RECEIPT', 'ADJUSTMENT_IN'].includes(type);
  }

  get totalInflows(): number {
    return this.transactions
      .filter((t) => this.isInflow(t.transactionType))
      .reduce((sum, t) => sum + (t.quantity || 0), 0);
  }

  get totalOutflows(): number {
    return this.transactions
      .filter((t) => !this.isInflow(t.transactionType))
      .reduce((sum, t) => sum + (t.quantity || 0), 0);
  }

  get netMovement(): number {
    return this.totalInflows - this.totalOutflows;
  }

  printLedger(): void {
    window.print();
  }
}
