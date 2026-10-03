import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardMetrics, AttentionProduct, Product } from '../models/inventory.model';
import { DashboardService } from '../services/dashboard.service';
import { ProductService } from '../services/product.service';
import { MessageBannerComponent } from '../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge.component';
import { StockDialogComponent } from '../shared/stock-dialog/stock-dialog.component';
import { extractErrorMessage } from '../core/http-error.helper';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MessageBannerComponent,
    StatusBadgeComponent,
    StockDialogComponent
  ],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading dashboard metrics...
      </div>

      <div *ngIf="!loading && metrics">
        <!-- Summary Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <!-- Card 1: Total Products -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Total Products</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--text-main);">{{ metrics.totalProducts }}</div>
          </div>

          <!-- Card 2: Total Stock Quantity -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Total Stock Quantity</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--text-main);">{{ metrics.totalQuantity }}</div>
          </div>

          <!-- Card 3: Low Stock Products -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--status-low-stock-text); margin-bottom: 8px;">Low Stock Products</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--status-low-stock-text);">{{ metrics.lowStockCount }}</div>
          </div>

          <!-- Card 4: Out of Stock Products -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--status-out-of-stock-text); margin-bottom: 8px;">Out of Stock Products</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--status-out-of-stock-text);">{{ metrics.outOfStockCount }}</div>
          </div>
        </div>

        <!-- Attention Table Section -->
        <div style="margin-top: 28px;">
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--text-main);">
            Products needing attention
          </h2>

          <div *ngIf="metrics.attentionProducts.length === 0" class="table-container state-message">
            No products need attention.
          </div>

          <div *ngIf="metrics.attentionProducts.length > 0" class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Reorder Level</th>
                  <th>Status</th>
                  <th style="text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of metrics.attentionProducts">
                  <td><strong>{{ item.sku }}</strong></td>
                  <td>{{ item.name }}</td>
                  <td style="text-align: right;">{{ item.quantity }}</td>
                  <td style="text-align: right;">{{ item.reorderLevel }}</td>
                  <td>
                    <app-status-badge [status]="item.status"></app-status-badge>
                  </td>
                  <td style="text-align: center;">
                    <button type="button" class="btn btn-sm btn-secondary" (click)="openStockIn(item)">
                      Stock In
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Stock Movement Dialog -->
      <app-stock-dialog
        *ngIf="selectedProductForStock"
        [product]="selectedProductForStock"
        actionType="IN"
        (success)="onStockSuccess($event)"
        (cancel)="closeStockDialog()"
      ></app-stock-dialog>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  metrics: DashboardMetrics | null = null;
  loading = true;
  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;

  selectedProductForStock: Product | null = null;

  constructor(
    private dashboardService: DashboardService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.dashboardService.getDashboardMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
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

  openStockIn(item: AttentionProduct): void {
    // Fetch full product for stock dialog
    this.productService.getProductById(item.id).subscribe({
      next: (prod) => {
        this.selectedProductForStock = prod;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  closeStockDialog(): void {
    this.selectedProductForStock = null;
  }

  onStockSuccess(updatedProduct: Product): void {
    this.closeStockDialog();
    this.bannerType = 'success';
    this.bannerMessage = `Stock for "${updatedProduct.name}" successfully updated.`;
    this.loadDashboard();
  }
}
