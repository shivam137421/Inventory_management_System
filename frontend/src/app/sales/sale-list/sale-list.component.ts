import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Sale, PaymentMethod, PaymentStatus } from '../../models/sale.model';
import { SaleService } from '../../services/sale.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MessageBannerComponent,
    StatusBadgeComponent
  ],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Sales & Invoicing</h1>
        <a routerLink="/sales/new" class="btn btn-primary">+ Record New Sale</a>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- KPI Summary Cards -->
      <div *ngIf="!loading && sales.length > 0" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px 16px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Total Invoices</div>
          <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">{{ sales.length }}</div>
        </div>

        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px 16px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Total Sales Revenue</div>
          <div style="font-size: 22px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">₹{{ totalRevenue | number:'1.2-2' }}</div>
        </div>

        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px 16px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Paid / Settled</div>
          <div style="font-size: 22px; font-weight: 700; color: var(--status-in-stock-text); margin-top: 4px;">₹{{ paidRevenue | number:'1.2-2' }}</div>
        </div>

        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px 16px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Pending / Udhaar</div>
          <div style="font-size: 22px; font-weight: 700; color: var(--status-low-stock-text); margin-top: 4px;">₹{{ pendingRevenue | number:'1.2-2' }}</div>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <div style="flex: 1; min-width: 220px;">
          <input
            type="text"
            class="form-control"
            placeholder="Search by bill #, customer name, phone..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
          />
        </div>

        <div style="min-width: 160px;">
          <select class="form-control" [(ngModel)]="selectedPaymentMethod" (ngModelChange)="applyFilters()">
            <option value="">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit (Udhaar)</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div style="min-width: 140px;">
          <select class="form-control" [(ngModel)]="selectedPaymentStatus" (ngModelChange)="applyFilters()">
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading sales records...
      </div>

      <!-- Empty & Table States -->
      <div *ngIf="!loading">
        <div *ngIf="sales.length === 0" class="table-container state-message">
          No sales recorded yet. <a routerLink="/sales/new">Record your first sale bill.</a>
        </div>

        <div *ngIf="sales.length > 0 && filteredSales.length === 0" class="table-container state-message">
          No sales match your search criteria.
        </div>

        <div *ngIf="filteredSales.length > 0" class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th style="text-align: center;">Items</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th style="text-align: right;">Grand Total</th>
                <th style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filteredSales">
                <td>
                  <a [routerLink]="['/sales', s.id]" style="font-weight: 600; color: var(--accent-color);">
                    {{ s.billNumber }}
                  </a>
                </td>
                <td style="white-space: nowrap;">
                  {{ s.createdAt | date:'mediumDate' }}
                  <div style="font-size: 11px; color: var(--text-muted);">{{ s.createdAt | date:'shortTime' }}</div>
                </td>
                <td>
                  <strong>{{ s.customerName || 'Walk-in Customer' }}</strong>
                  <div *ngIf="s.customerPhone" style="font-size: 11px; color: var(--text-muted);">
                    {{ s.customerPhone }}
                  </div>
                </td>
                <td style="text-align: center;">
                  {{ s.items?.length || 0 }} {{ (s.items?.length === 1) ? 'item' : 'items' }}
                </td>
                <td>
                  <app-status-badge [status]="s.paymentMethod"></app-status-badge>
                </td>
                <td>
                  <app-status-badge [status]="s.paymentStatus"></app-status-badge>
                </td>
                <td style="text-align: right; font-weight: 600; white-space: nowrap;">
                  ₹{{ s.grandTotal | number:'1.2-2' }}
                </td>
                <td style="text-align: center; white-space: nowrap;">
                  <div style="display: inline-flex; gap: 6px;">
                    <a [routerLink]="['/sales', s.id]" class="btn btn-sm btn-secondary">
                      View / Print
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SaleListComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  searchQuery: string = '';
  selectedPaymentMethod: '' | PaymentMethod = '';
  selectedPaymentStatus: '' | PaymentStatus = '';
  loading: boolean = true;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';

  constructor(
    private saleService: SaleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.loading = true;
    this.saleService.getSales().subscribe({
      next: (data) => {
        this.sales = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredSales = this.sales.filter((s) => {
      const matchQuery =
        !query ||
        s.billNumber.toLowerCase().includes(query) ||
        (s.customerName && s.customerName.toLowerCase().includes(query)) ||
        (s.customerPhone && s.customerPhone.includes(query));

      const matchMethod = !this.selectedPaymentMethod || s.paymentMethod === this.selectedPaymentMethod;
      const matchStatus = !this.selectedPaymentStatus || s.paymentStatus === this.selectedPaymentStatus;

      return matchQuery && matchMethod && matchStatus;
    });
  }

  get totalRevenue(): number {
    return this.sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  }

  get paidRevenue(): number {
    return this.sales
      .filter((s) => s.paymentStatus === 'PAID')
      .reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  }

  get pendingRevenue(): number {
    return this.sales
      .filter((s) => s.paymentStatus === 'PENDING')
      .reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  }
}
