import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Purchase, PurchaseStatus } from '../../models/purchase.model';
import { PurchaseService } from '../../services/purchase.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-purchase-list',
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
        <h1 class="page-title">Purchases & Goods Receiving</h1>
        <a routerLink="/purchases/new" class="btn btn-primary">New Purchase Order</a>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Toolbar: Search and Status Filter -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <div style="flex: 1; min-width: 220px;">
          <input
            type="text"
            class="form-control"
            placeholder="Search by purchase # or supplier name..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
          />
        </div>

        <div style="min-width: 170px;">
          <select class="form-control" [(ngModel)]="selectedStatus" (ngModelChange)="loadPurchases()">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft (Pending Receipt)</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading purchase orders...
      </div>

      <!-- Empty & Table States -->
      <div *ngIf="!loading">
        <div *ngIf="purchases.length === 0" class="table-container state-message">
          No purchase orders found. <a routerLink="/purchases/new">Create your first purchase order.</a>
        </div>

        <div *ngIf="purchases.length > 0 && filteredPurchases.length === 0" class="table-container state-message">
          No purchases match your search criteria.
        </div>

        <div *ngIf="filteredPurchases.length > 0" class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Supplier</th>
                <th>Supplier Inv #</th>
                <th>Date</th>
                <th style="text-align: center;">Items</th>
                <th style="text-align: right;">Total Amount</th>
                <th>Status</th>
                <th style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let purchase of filteredPurchases">
                <td>
                  <a [routerLink]="['/purchases', purchase.id]" style="font-weight: 600; color: var(--accent-color);">
                    {{ purchase.purchaseNumber }}
                  </a>
                </td>
                <td>
                  <strong>{{ purchase.supplierName }}</strong>
                </td>
                <td>{{ purchase.supplierInvoiceNo || '—' }}</td>
                <td style="white-space: nowrap;">{{ purchase.createdAt | date:'mediumDate' }}</td>
                <td style="text-align: center;">
                  {{ purchase.items?.length || 0 }} {{ (purchase.items?.length === 1) ? 'item' : 'items' }}
                </td>
                <td style="text-align: right; font-weight: 600;">
                  ₹{{ purchase.totalAmount | number:'1.2-2' }}
                </td>
                <td>
                  <app-status-badge [status]="purchase.status"></app-status-badge>
                </td>
                <td style="text-align: center; white-space: nowrap;">
                  <div style="display: inline-flex; gap: 6px;">
                    <a [routerLink]="['/purchases', purchase.id]" class="btn btn-sm btn-secondary">
                      View
                    </a>
                    <button
                      *ngIf="purchase.status === 'DRAFT'"
                      type="button"
                      class="btn btn-sm btn-primary"
                      (click)="promptReceive(purchase)"
                    >
                      Receive Goods
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Goods Receiving Confirmation Modal -->
      <div *ngIf="purchaseToReceive" class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h2 class="modal-title">Receive Goods — {{ purchaseToReceive.purchaseNumber }}</h2>
            <button type="button" class="btn btn-sm btn-secondary" (click)="cancelReceive()">×</button>
          </div>
          <div style="margin-bottom: 20px;">
            <p style="margin-bottom: 10px;">
              Confirm receipt of goods from <strong>{{ purchaseToReceive.supplierName }}</strong>?
            </p>
            <div style="background-color: var(--bg-page); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; font-size: 13px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Total Items:</span>
                <strong>{{ purchaseToReceive.items?.length || 0 }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Order Total:</span>
                <strong>₹{{ purchaseToReceive.totalAmount | number:'1.2-2' }}</strong>
              </div>
            </div>
            <p style="font-size: 12px; color: var(--text-muted);">
              <strong>Notice:</strong> This action increments stock levels for all listed products under pessimistic write lock, updates cost prices, and permanently records audit ledger entries. This action cannot be reversed.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancelReceive()" [disabled]="receiving">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" (click)="executeReceive()" [disabled]="receiving">
              {{ receiving ? 'Receiving Goods...' : 'Confirm & Increment Stock' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PurchaseListComponent implements OnInit {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  searchQuery: string = '';
  selectedStatus: '' | PurchaseStatus = '';
  loading: boolean = true;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';

  purchaseToReceive: Purchase | null = null;
  receiving: boolean = false;

  constructor(
    private purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPurchases();
  }

  loadPurchases(): void {
    this.loading = true;
    const statusParam = this.selectedStatus ? (this.selectedStatus as PurchaseStatus) : undefined;

    this.purchaseService.getPurchases(statusParam).subscribe({
      next: (data) => {
        this.purchases = data;
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
    if (!query) {
      this.filteredPurchases = [...this.purchases];
      return;
    }

    this.filteredPurchases = this.purchases.filter((p) => {
      const numMatch = p.purchaseNumber.toLowerCase().includes(query);
      const supMatch = p.supplierName ? p.supplierName.toLowerCase().includes(query) : false;
      const invMatch = p.supplierInvoiceNo ? p.supplierInvoiceNo.toLowerCase().includes(query) : false;
      return numMatch || supMatch || invMatch;
    });
  }

  promptReceive(purchase: Purchase): void {
    this.purchaseToReceive = purchase;
  }

  cancelReceive(): void {
    this.purchaseToReceive = null;
  }

  executeReceive(): void {
    if (!this.purchaseToReceive) return;

    this.receiving = true;
    const id = this.purchaseToReceive.id;
    const purchaseNumber = this.purchaseToReceive.purchaseNumber;

    this.purchaseService.receivePurchase(id).subscribe({
      next: () => {
        this.receiving = false;
        this.purchaseToReceive = null;
        this.bannerType = 'success';
        this.bannerMessage = `Purchase Order ${purchaseNumber} received successfully! Stock levels and ledger have been updated.`;
        this.loadPurchases();
      },
      error: (err) => {
        this.receiving = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
