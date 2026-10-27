import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
    RouterLink,
    MessageBannerComponent,
    StatusBadgeComponent,
    StockDialogComponent
  ],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Dashboard & Business Overview</h1>
        <div style="display: flex; gap: 8px;">
          <a routerLink="/sales/new" class="btn btn-primary">+ Record Sale</a>
          <a routerLink="/purchases/new" class="btn btn-secondary">+ New Purchase Order</a>
        </div>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading dashboard metrics and inventory valuation...
      </div>

      <div *ngIf="!loading && metrics">
        <!-- Summary Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <!-- Card 1: Total Products & Units -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
              Active Products
            </div>
            <div style="font-size: 26px; font-weight: 700; color: var(--text-main); margin-top: 4px;">
              {{ metrics.totalProducts }}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              Total Units: <strong>{{ metrics.totalQuantity | number }}</strong>
            </div>
          </div>

          <!-- Card 2: Inventory Valuation (Cost & Retail) -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
              Inventory Valuation
            </div>
            <div style="font-size: 22px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">
              ₹{{ (metrics.totalRetailValue || 0) | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              Cost Basis: <strong>₹{{ (metrics.totalCostValue || 0) | number:'1.2-2' }}</strong>
            </div>
          </div>

          <!-- Card 3: Low Stock Alert -->
          <div
            style="border-radius: 4px; padding: 18px;"
            [style.background-color]="metrics.lowStockCount > 0 ? 'var(--status-low-stock-bg)' : 'var(--bg-surface)'"
            [style.border]="metrics.lowStockCount > 0 ? '1px solid #ebd39c' : '1px solid var(--border-color)'"
          >
            <div
              style="font-size: 12px; font-weight: 700; text-transform: uppercase;"
              [style.color]="metrics.lowStockCount > 0 ? 'var(--status-low-stock-text)' : 'var(--text-muted)'"
            >
              Low Stock Items
            </div>
            <div
              style="font-size: 26px; font-weight: 700; margin-top: 4px;"
              [style.color]="metrics.lowStockCount > 0 ? 'var(--status-low-stock-text)' : 'var(--text-main)'"
            >
              {{ metrics.lowStockCount }}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              {{ metrics.lowStockCount > 0 ? 'Action required: Restock soon' : 'All thresholds normal' }}
            </div>
          </div>

          <!-- Card 4: Out of Stock Alert -->
          <div
            style="border-radius: 4px; padding: 18px;"
            [style.background-color]="metrics.outOfStockCount > 0 ? 'var(--status-out-of-stock-bg)' : 'var(--bg-surface)'"
            [style.border]="metrics.outOfStockCount > 0 ? '1px solid #eabfb9' : '1px solid var(--border-color)'"
          >
            <div
              style="font-size: 12px; font-weight: 700; text-transform: uppercase;"
              [style.color]="metrics.outOfStockCount > 0 ? 'var(--status-out-of-stock-text)' : 'var(--text-muted)'"
            >
              Out of Stock
            </div>
            <div
              style="font-size: 26px; font-weight: 700; margin-top: 4px;"
              [style.color]="metrics.outOfStockCount > 0 ? 'var(--status-out-of-stock-text)' : 'var(--text-main)'"
            >
              {{ metrics.outOfStockCount }}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              {{ metrics.outOfStockCount > 0 ? 'Zero stock available to sell' : 'Zero depleted items' }}
            </div>
          </div>

          <!-- Card 5: Today's Sales -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
              Today's Sales
            </div>
            <div style="font-size: 24px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">
              ₹{{ (metrics.todaySalesRevenue || 0) | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              Bills Today: <strong>{{ metrics.todaySalesCount || 0 }}</strong>
            </div>
          </div>

          <!-- Card 6: Lifetime Cash Flow -->
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 18px;">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
              Cumulative Sales & Spend
            </div>
            <div style="font-size: 18px; font-weight: 700; color: var(--status-in-stock-text); margin-top: 4px;">
              Sales: ₹{{ (metrics.totalLifetimeSales || 0) | number:'1.2-2' }}
            </div>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Purchases: <strong>₹{{ (metrics.totalLifetimePurchases || 0) | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>

        <!-- Quick Shortcuts -->
        <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 16px; margin-bottom: 24px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
          <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Quick Navigation:</span>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a routerLink="/sales" class="btn btn-sm btn-secondary">Invoices & Sales</a>
            <a routerLink="/purchases" class="btn btn-sm btn-secondary">Purchase Orders</a>
            <a routerLink="/transactions" class="btn btn-sm btn-secondary">Stock Audit Ledger</a>
            <a routerLink="/reports" class="btn btn-sm btn-secondary">Business Reports</a>
          </div>
        </div>

        <!-- Attention Table Section (Low & Out of Stock) -->
        <div style="margin-top: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 style="font-size: 16px; font-weight: 600; color: var(--text-main);">
              Inventory Attention List (Low & Out of Stock)
            </h2>
            <span *ngIf="metrics.attentionProducts.length > 0" class="badge badge-low-stock">
              {{ metrics.attentionProducts.length }} items need reorder
            </span>
          </div>

          <div *ngIf="metrics.attentionProducts.length === 0" class="table-container state-message" style="padding: 24px;">
            ✓ All catalog items have healthy stock levels above reorder thresholds.
          </div>

          <div *ngIf="metrics.attentionProducts.length > 0" class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th style="text-align: right;">Current Stock</th>
                  <th style="text-align: right;">Reorder Level</th>
                  <th>Status</th>
                  <th style="text-align: right;">Retail Price</th>
                  <th style="text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of metrics.attentionProducts">
                  <td><strong>{{ item.sku }}</strong></td>
                  <td>{{ item.name }}</td>
                  <td style="text-align: right; font-weight: 600;" [style.color]="item.quantity === 0 ? 'var(--status-out-of-stock-text)' : 'var(--status-low-stock-text)'">
                    {{ item.quantity }} {{ item.unit || 'pcs' }}
                  </td>
                  <td style="text-align: right;">{{ item.reorderLevel }} {{ item.unit || 'pcs' }}</td>
                  <td>
                    <app-status-badge [status]="item.status"></app-status-badge>
                  </td>
                  <td style="text-align: right;">
                    {{ item.unitPrice != null ? ('₹' + (item.unitPrice | number:'1.2-2')) : '—' }}
                  </td>
                  <td style="text-align: center; white-space: nowrap;">
                    <div style="display: inline-flex; gap: 6px;">
                      <button type="button" class="btn btn-sm btn-secondary" (click)="openStockIn(item)">
                        Adjust
                      </button>
                      <a routerLink="/purchases/new" class="btn btn-sm btn-primary">
                        Order
                      </a>
                    </div>
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
