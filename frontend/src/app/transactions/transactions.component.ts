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
      <div class="page-header">
        <h1 class="page-title">Transaction History</h1>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Filters Toolbar -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <div style="min-width: 160px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Type</label>
          <select class="form-control" [(ngModel)]="selectedType" (ngModelChange)="loadTransactions()">
            <option value="">All Types</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>

        <div style="min-width: 220px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Product</label>
          <select class="form-control" [(ngModel)]="selectedProductId" (ngModelChange)="loadTransactions()">
            <option value="">All Products</option>
            <option *ngFor="let p of productOptions" [value]="p.id">
              {{ p.name }} ({{ p.sku }})
            </option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading transactions...
      </div>

      <!-- Transactions Table or Empty State -->
      <div *ngIf="!loading">
        <div *ngIf="transactions.length === 0" class="table-container state-message">
          No stock transactions found.
        </div>

        <div *ngIf="transactions.length > 0" class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Type</th>
                <th style="text-align: right;">Quantity</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions">
                <td>{{ tx.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>{{ tx.productName }}</td>
                <td><strong>{{ tx.sku }}</strong></td>
                <td>
                  <app-status-badge [status]="tx.transactionType"></app-status-badge>
                </td>
                <td style="text-align: right;">{{ tx.quantity }}</td>
                <td>{{ tx.note || '—' }}</td>
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

  selectedType: '' | 'IN' | 'OUT' = '';
  selectedProductId: '' | number = '';

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
      error: () => {
        // Silently handle or fallback
      }
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.cdr.detectChanges();
    const type = this.selectedType ? (this.selectedType as TransactionType) : undefined;
    const prodId = this.selectedProductId !== '' ? Number(this.selectedProductId) : undefined;

    this.transactionService.getTransactions(type, prodId).subscribe({
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
}
