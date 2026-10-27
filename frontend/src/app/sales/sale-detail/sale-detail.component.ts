import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Sale } from '../../models/sale.model';
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../services/auth.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MessageBannerComponent, StatusBadgeComponent],
  template: `
    <div style="max-width: 860px; margin: 0 auto;">
      <div class="page-header no-print">
        <div style="display: flex; align-items: center; gap: 12px;">
          <h1 class="page-title">{{ sale ? 'Invoice ' + sale.billNumber : 'Sales Invoice' }}</h1>
          <ng-container *ngIf="sale">
            <app-status-badge [status]="sale.paymentMethod"></app-status-badge>
            <app-status-badge [status]="sale.paymentStatus"></app-status-badge>
          </ng-container>
        </div>

        <div style="display: flex; gap: 8px;">
          <a routerLink="/sales" class="btn btn-secondary">Back to Sales</a>
          <button type="button" class="btn btn-primary" (click)="printInvoice()" [disabled]="!sale">
            🖨️ Print Invoice
          </button>
        </div>
      </div>

      <app-message-banner class="no-print" [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading invoice details...
      </div>

      <!-- Not Found State -->
      <div *ngIf="notFound && !loading" class="table-container state-message" style="padding: 24px;">
        <p style="margin-bottom: 12px; color: var(--danger-color); font-weight: 500;">
          Sales invoice not found.
        </p>
        <a routerLink="/sales" class="btn btn-secondary">Return to Sales</a>
      </div>

      <!-- Printable Invoice Document -->
      <div *ngIf="sale && !loading" class="printable-area invoice-card">
        <!-- Document Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--text-main); padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 22px; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px;">
              {{ (authService.currentUser$ | async)?.businessName || 'StockPilot Store' }}
            </div>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
              Retail Tax Invoice / Bill of Sale
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 700; color: var(--accent-color);">
              {{ sale.billNumber }}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              Date: {{ sale.createdAt | date:'medium' }}
            </div>
          </div>
        </div>

        <!-- Party Information Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <!-- Customer Details -->
          <div style="background-color: var(--bg-page); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px;">
              Billed To
            </div>
            <div style="font-size: 15px; font-weight: 600;">
              {{ sale.customerName || 'Walk-in Customer' }}
            </div>
            <div *ngIf="sale.customerPhone" style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
              Phone: {{ sale.customerPhone }}
            </div>
            <div *ngIf="sale.notes" style="font-size: 12px; color: var(--text-muted); margin-top: 8px; border-top: 1px dotted var(--border-color); padding-top: 6px;">
              <strong>Note:</strong> {{ sale.notes }}
            </div>
          </div>

          <!-- Payment Details -->
          <div style="background-color: var(--bg-page); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px;">
              Payment & Settlement
            </div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 13px;">
              <span style="color: var(--text-muted);">Payment Method:</span>
              <strong style="text-transform: capitalize;">{{ sale.paymentMethod }}</strong>

              <span style="color: var(--text-muted);">Payment Status:</span>
              <span><app-status-badge [status]="sale.paymentStatus"></app-status-badge></span>

              <span style="color: var(--text-muted);">Status Detail:</span>
              <span style="font-size: 12px;">
                {{ sale.paymentStatus === 'PAID' ? 'Settled in Full' : 'Pending Payment / Receivable (Udhaar)' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-container" style="margin-bottom: 20px;">
          <table class="table" style="font-size: 13px;">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 45%;">Item Description</th>
                <th style="width: 15%;">SKU</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 12%; text-align: right;">Unit Price</th>
                <th style="width: 13%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of sale.items; let idx = index">
                <td style="text-align: center; color: var(--text-muted);">{{ idx + 1 }}</td>
                <td>
                  <strong>{{ item.productName }}</strong>
                </td>
                <td>{{ item.sku }}</td>
                <td style="text-align: center;">{{ item.quantity }} {{ item.unit }}</td>
                <td style="text-align: right;">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                <td style="text-align: right; font-weight: 600;">₹{{ item.lineTotal | number:'1.2-2' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="border: none;"></td>
                <td style="text-align: right; font-weight: 600; padding: 8px 12px; border-top: 1px solid var(--border-color);">
                  Subtotal:
                </td>
                <td style="text-align: right; font-weight: 600; padding: 8px 12px; border-top: 1px solid var(--border-color);">
                  ₹{{ sale.subtotal | number:'1.2-2' }}
                </td>
              </tr>
              <tr *ngIf="sale.discount > 0">
                <td colspan="4" style="border: none;"></td>
                <td style="text-align: right; font-weight: 600; padding: 8px 12px; color: var(--danger-color);">
                  Discount:
                </td>
                <td style="text-align: right; font-weight: 600; padding: 8px 12px; color: var(--danger-color);">
                  -₹{{ sale.discount | number:'1.2-2' }}
                </td>
              </tr>
              <tr style="background-color: #f1efe9;">
                <td colspan="4" style="border: none; background: transparent;"></td>
                <td style="text-align: right; font-size: 15px; font-weight: 700; padding: 10px 12px;">
                  Grand Total:
                </td>
                <td style="text-align: right; font-size: 16px; font-weight: 700; color: var(--accent-color); padding: 10px 12px;">
                  ₹{{ sale.grandTotal | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Invoice Footer -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: var(--text-muted);">
          <div>
            <div>• This is a computer-generated tax invoice. No signature is required.</div>
            <div>• Stock deducted in real time from StockPilot Inventory Ledger.</div>
          </div>
          <div style="text-align: right;">
            <div>Authorized Signatory</div>
            <div style="font-weight: 600; color: var(--text-main); margin-top: 24px;">
              {{ (authService.currentUser$ | async)?.fullName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SaleDetailComponent implements OnInit {
  sale: Sale | null = null;
  loading: boolean = true;
  notFound: boolean = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private saleService: SaleService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSale(Number(id));
    } else {
      this.notFound = true;
      this.loading = false;
    }
  }

  loadSale(id: number): void {
    this.loading = true;
    this.saleService.getSaleById(id).subscribe({
      next: (data) => {
        this.sale = data;
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

  printInvoice(): void {
    window.print();
  }
}
