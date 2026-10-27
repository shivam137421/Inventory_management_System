import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Purchase } from '../../models/purchase.model';
import { PurchaseService } from '../../services/purchase.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MessageBannerComponent, StatusBadgeComponent],
  template: `
    <div style="max-width: 900px; margin: 0 auto;">
      <div class="page-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <h1 class="page-title">{{ purchase ? purchase.purchaseNumber : 'Purchase Order' }}</h1>
          <app-status-badge *ngIf="purchase" [status]="purchase.status"></app-status-badge>
        </div>

        <div style="display: flex; gap: 8px;">
          <a routerLink="/purchases" class="btn btn-secondary">Back to Purchases</a>

          <!-- Actions available only for DRAFT status -->
          <ng-container *ngIf="purchase && purchase.status === 'DRAFT'">
            <button
              type="button"
              class="btn btn-danger-outline"
              (click)="promptCancel()"
              [disabled]="actionInProgress"
            >
              Cancel Order
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="promptReceive()"
              [disabled]="actionInProgress"
            >
              Receive Goods & Update Stock
            </button>
          </ng-container>
        </div>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading purchase details...
      </div>

      <!-- Purchase Not Found -->
      <div *ngIf="notFound && !loading" class="table-container state-message" style="padding: 24px;">
        <p style="margin-bottom: 12px; color: var(--danger-color); font-weight: 500;">Purchase order not found.</p>
        <a routerLink="/purchases" class="btn btn-secondary">Return to Purchases</a>
      </div>

      <!-- Content Container -->
      <div *ngIf="purchase && !loading">
        <!-- Receipt Notice if already received -->
        <div *ngIf="purchase.status === 'RECEIVED'" style="background-color: var(--status-in-stock-bg); border: 1px solid #c0debe; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 600; color: var(--status-in-stock-text);">✓ Goods Received</span>
          <span style="color: var(--status-in-stock-text); font-size: 13px;">
            Inventory stock levels and audit ledger entries were updated on {{ purchase.receivedAt | date:'medium' }}.
          </span>
        </div>

        <!-- Order Information Cards -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <!-- Supplier Details Card -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 16px;">
            <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 12px;">
              Supplier Information
            </h2>
            <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">
              {{ purchase.supplierName }}
            </div>
            <div *ngIf="purchase.notes" style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
              <strong>Notes:</strong> {{ purchase.notes }}
            </div>
          </div>

          <!-- Document Details Card -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 16px;">
            <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 12px;">
              Document Summary
            </h2>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 13px;">
              <span style="color: var(--text-muted);">Purchase #:</span>
              <strong>{{ purchase.purchaseNumber }}</strong>

              <span style="color: var(--text-muted);">Supplier Inv #:</span>
              <span>{{ purchase.supplierInvoiceNo || '—' }}</span>

              <span style="color: var(--text-muted);">Created Date:</span>
              <span>{{ purchase.createdAt | date:'medium' }}</span>

              <span style="color: var(--text-muted);">Received Date:</span>
              <span>{{ purchase.receivedAt ? (purchase.receivedAt | date:'medium') : 'Pending Receipt' }}</span>

              <span style="color: var(--text-muted);">Status:</span>
              <span><app-status-badge [status]="purchase.status"></app-status-badge></span>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <div class="table-container" style="margin-bottom: 20px;">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 15%;">SKU</th>
                <th style="width: 35%;">Product Name</th>
                <th style="width: 10%;">Unit</th>
                <th style="width: 15%; text-align: right;">Quantity</th>
                <th style="width: 12%; text-align: right;">Unit Price</th>
                <th style="width: 13%; text-align: right;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of purchase.items">
                <td><strong>{{ item.sku }}</strong></td>
                <td>{{ item.productName }}</td>
                <td>{{ item.unit }}</td>
                <td style="text-align: right; font-weight: 500;">{{ item.quantity }}</td>
                <td style="text-align: right;">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                <td style="text-align: right; font-weight: 600;">₹{{ item.lineTotal | number:'1.2-2' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background-color: #f1efe9; font-weight: 600;">
                <td colspan="4" style="text-align: right; padding: 12px 14px;">Total Order Amount:</td>
                <td colspan="2" style="text-align: right; padding: 12px 14px; font-size: 16px; color: var(--accent-color);">
                  ₹{{ purchase.totalAmount | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Receive Goods Confirmation Modal -->
      <div *ngIf="showReceiveModal && purchase" class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h2 class="modal-title">Receive Goods & Update Inventory</h2>
            <button type="button" class="btn btn-sm btn-secondary" (click)="closeReceiveModal()" [disabled]="actionInProgress">×</button>
          </div>
          <div style="margin-bottom: 20px;">
            <p style="margin-bottom: 12px;">
              You are about to mark Purchase Order <strong>{{ purchase.purchaseNumber }}</strong> as <strong>RECEIVED</strong>.
            </p>
            <div style="background-color: var(--bg-page); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; margin-bottom: 12px; font-size: 13px;">
              <p style="font-weight: 600; margin-bottom: 6px;">The following stock increments will take place:</p>
              <ul style="padding-left: 18px; margin-bottom: 0;">
                <li *ngFor="let item of purchase.items" style="margin-bottom: 4px;">
                  <strong>+{{ item.quantity }} {{ item.unit }}</strong> of {{ item.productName }} ({{ item.sku }}) @ ₹{{ item.unitPrice | number:'1.2-2' }}
                </li>
              </ul>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
              <strong>System Invariant:</strong> Stock levels will be incremented under pessimistic write lock, product purchase cost will be updated, and audit ledger entries (PURCHASE_RECEIPT) will be written. This action is idempotent and cannot be reversed.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeReceiveModal()" [disabled]="actionInProgress">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" (click)="executeReceive()" [disabled]="actionInProgress">
              {{ actionInProgress ? 'Receiving Goods...' : 'Confirm Receipt' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Cancel Order Confirmation Modal -->
      <div *ngIf="showCancelModal && purchase" class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h2 class="modal-title">Cancel Purchase Order</h2>
            <button type="button" class="btn btn-sm btn-secondary" (click)="closeCancelModal()" [disabled]="actionInProgress">×</button>
          </div>
          <div style="margin-bottom: 20px;">
            <p style="margin-bottom: 8px;">
              Are you sure you want to cancel Purchase Order <strong>{{ purchase.purchaseNumber }}</strong>?
            </p>
            <p style="font-size: 13px; color: var(--text-muted);">
              Cancelled orders remain in the system for auditing purposes, but stock levels will not be adjusted.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeCancelModal()" [disabled]="actionInProgress">
              Back
            </button>
            <button type="button" class="btn btn-danger-outline" (click)="executeCancel()" [disabled]="actionInProgress">
              {{ actionInProgress ? 'Cancelling...' : 'Yes, Cancel Order' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PurchaseDetailComponent implements OnInit {
  purchase: Purchase | null = null;
  purchaseId?: number;
  loading: boolean = true;
  notFound: boolean = false;
  actionInProgress: boolean = false;

  showReceiveModal: boolean = false;
  showCancelModal: boolean = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.purchaseId = Number(idParam);
      this.loadPurchase(this.purchaseId);
    }
  }

  loadPurchase(id: number): void {
    this.loading = true;
    this.purchaseService.getPurchaseById(id).subscribe({
      next: (data) => {
        this.purchase = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.notFound = true;
        } else {
          this.bannerType = 'error';
          this.bannerMessage = extractErrorMessage(err);
        }
        this.cdr.detectChanges();
      }
    });
  }

  promptReceive(): void {
    this.showReceiveModal = true;
  }

  closeReceiveModal(): void {
    this.showReceiveModal = false;
  }

  executeReceive(): void {
    if (!this.purchaseId) return;

    this.actionInProgress = true;
    this.purchaseService.receivePurchase(this.purchaseId).subscribe({
      next: (updated) => {
        this.purchase = updated;
        this.actionInProgress = false;
        this.showReceiveModal = false;
        this.bannerType = 'success';
        this.bannerMessage = `Purchase Order ${updated.purchaseNumber} successfully received. Stock levels have been incremented!`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionInProgress = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  promptCancel(): void {
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  executeCancel(): void {
    if (!this.purchaseId) return;

    this.actionInProgress = true;
    this.purchaseService.cancelPurchase(this.purchaseId).subscribe({
      next: (updated) => {
        this.purchase = updated;
        this.actionInProgress = false;
        this.showCancelModal = false;
        this.bannerType = 'success';
        this.bannerMessage = `Purchase Order ${updated.purchaseNumber} has been cancelled.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actionInProgress = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
