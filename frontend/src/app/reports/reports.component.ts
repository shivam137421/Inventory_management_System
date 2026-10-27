import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from '../services/report.service';
import { ProductService } from '../services/product.service';
import { SupplierService } from '../services/supplier.service';
import { SalesReportResponse, PurchasesReportResponse, SalesReportFilter, PurchasesReportFilter } from '../models/report.model';
import { Product } from '../models/inventory.model';
import { Supplier } from '../models/supplier.model';
import { PaymentMethod, PaymentStatus } from '../models/sale.model';
import { PurchaseStatus } from '../models/purchase.model';
import { MessageBannerComponent } from '../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge.component';
import { extractErrorMessage } from '../core/http-error.helper';

type ReportTab = 'SALES' | 'PURCHASES' | 'VALUATION';

@Component({
  selector: 'app-reports',
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
      <div class="page-header no-print">
        <div>
          <h1 class="page-title">Business Reports & Analytics</h1>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
            Comprehensive audit reports for sales revenue, inventory valuation, and procurement spend.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" (click)="printReport()">
            🖨️ Print Active Report
          </button>
        </div>
      </div>

      <app-message-banner class="no-print" [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Navigation Tabs -->
      <div class="no-print" style="display: flex; gap: 4px; border-bottom: 2px solid var(--border-color); margin-bottom: 20px;">
        <button
          type="button"
          class="btn"
          [style.background-color]="activeTab === 'SALES' ? 'var(--accent-color)' : 'transparent'"
          [style.color]="activeTab === 'SALES' ? '#ffffff' : 'var(--text-main)'"
          [style.border-bottom-left-radius]="'0'"
          [style.border-bottom-right-radius]="'0'"
          style="padding: 10px 18px; font-weight: 600; font-size: 14px;"
          (click)="switchTab('SALES')"
        >
          Sales & Invoicing Report
        </button>

        <button
          type="button"
          class="btn"
          [style.background-color]="activeTab === 'PURCHASES' ? 'var(--accent-color)' : 'transparent'"
          [style.color]="activeTab === 'PURCHASES' ? '#ffffff' : 'var(--text-main)'"
          [style.border-bottom-left-radius]="'0'"
          [style.border-bottom-right-radius]="'0'"
          style="padding: 10px 18px; font-weight: 600; font-size: 14px;"
          (click)="switchTab('PURCHASES')"
        >
          Purchases & Spend Report
        </button>

        <button
          type="button"
          class="btn"
          [style.background-color]="activeTab === 'VALUATION' ? 'var(--accent-color)' : 'transparent'"
          [style.color]="activeTab === 'VALUATION' ? '#ffffff' : 'var(--text-main)'"
          [style.border-bottom-left-radius]="'0'"
          [style.border-bottom-right-radius]="'0'"
          style="padding: 10px 18px; font-weight: 600; font-size: 14px;"
          (click)="switchTab('VALUATION')"
        >
          Inventory Valuation by Category
        </button>
      </div>

      <!-- ================= TAB 1: SALES REPORT ================= -->
      <div *ngIf="activeTab === 'SALES'">
        <!-- Filter Toolbar -->
        <div class="no-print" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px 16px; margin-bottom: 20px;">
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;">
            <div style="min-width: 140px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">From Date</label>
              <input type="date" class="form-control" [(ngModel)]="salesFilter.startDate" (change)="loadSalesReport()" />
            </div>

            <div style="min-width: 140px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">To Date</label>
              <input type="date" class="form-control" [(ngModel)]="salesFilter.endDate" (change)="loadSalesReport()" />
            </div>

            <div style="min-width: 160px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Payment Method</label>
              <select class="form-control" [(ngModel)]="salesFilter.paymentMethod" (ngModelChange)="loadSalesReport()">
                <option value="">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CREDIT">Credit (Udhaar)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style="min-width: 140px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Payment Status</label>
              <select class="form-control" [(ngModel)]="salesFilter.paymentStatus" (ngModelChange)="loadSalesReport()">
                <option value="">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending (Receivable)</option>
              </select>
            </div>

            <div>
              <button type="button" class="btn btn-secondary" (click)="resetSalesFilter()">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="loadingSales" class="state-message">
          Loading sales report data...
        </div>

        <div *ngIf="!loadingSales && salesReport" class="printable-area">
          <!-- Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px;">
            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Bills</div>
              <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">{{ salesReport.totalSalesCount }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Units Sold</div>
              <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">{{ salesReport.totalUnitsSold | number }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Gross Subtotal</div>
              <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">₹{{ salesReport.totalSubtotal | number:'1.2-2' }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--danger-color); text-transform: uppercase;">Total Discounts</div>
              <div style="font-size: 22px; font-weight: 700; color: var(--danger-color); margin-top: 4px;">-₹{{ salesReport.totalDiscount | number:'1.2-2' }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--accent-color); text-transform: uppercase;">Net Revenue</div>
              <div style="font-size: 22px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">₹{{ salesReport.totalGrandTotal | number:'1.2-2' }}</div>
            </div>
          </div>

          <!-- Sales Invoices Table -->
          <div *ngIf="salesReport.sales.length === 0" class="table-container state-message" style="padding: 24px;">
            No sales bills found for the selected date range.
          </div>

          <div *ngIf="salesReport.sales.length > 0" class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style="text-align: right;">Subtotal</th>
                  <th style="text-align: right;">Discount</th>
                  <th style="text-align: right;">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of salesReport.sales">
                  <td>
                    <a [routerLink]="['/sales', s.id]" style="font-weight: 600; color: var(--accent-color);">
                      {{ s.billNumber }}
                    </a>
                  </td>
                  <td style="white-space: nowrap;">{{ s.createdAt | date:'mediumDate' }}</td>
                  <td>{{ s.customerName || 'Walk-in' }}</td>
                  <td><app-status-badge [status]="s.paymentMethod"></app-status-badge></td>
                  <td><app-status-badge [status]="s.paymentStatus"></app-status-badge></td>
                  <td style="text-align: right;">₹{{ s.subtotal | number:'1.2-2' }}</td>
                  <td style="text-align: right; color: var(--danger-color);">
                    {{ s.discount > 0 ? ('-₹' + (s.discount | number:'1.2-2')) : '—' }}
                  </td>
                  <td style="text-align: right; font-weight: 600;">₹{{ s.grandTotal | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ================= TAB 2: PURCHASES REPORT ================= -->
      <div *ngIf="activeTab === 'PURCHASES'">
        <!-- Filter Toolbar -->
        <div class="no-print" style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px 16px; margin-bottom: 20px;">
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;">
            <div style="min-width: 140px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">From Date</label>
              <input type="date" class="form-control" [(ngModel)]="purchasesFilter.startDate" (change)="loadPurchasesReport()" />
            </div>

            <div style="min-width: 140px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">To Date</label>
              <input type="date" class="form-control" [(ngModel)]="purchasesFilter.endDate" (change)="loadPurchasesReport()" />
            </div>

            <div style="min-width: 180px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Supplier</label>
              <select class="form-control" [(ngModel)]="purchasesFilter.supplierId" (ngModelChange)="loadPurchasesReport()">
                <option value="">All Suppliers</option>
                <option *ngFor="let sup of suppliers" [value]="sup.id">{{ sup.name }}</option>
              </select>
            </div>

            <div style="min-width: 150px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Order Status</label>
              <select class="form-control" [(ngModel)]="purchasesFilter.status" (ngModelChange)="loadPurchasesReport()">
                <option value="">All Statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <button type="button" class="btn btn-secondary" (click)="resetPurchasesFilter()">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="loadingPurchases" class="state-message">
          Loading purchases report data...
        </div>

        <div *ngIf="!loadingPurchases && purchasesReport" class="printable-area">
          <!-- Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Purchase Orders</div>
              <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">{{ purchasesReport.totalPurchasesCount }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Goods Received Total Spend</div>
              <div style="font-size: 22px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">
                ₹{{ purchasesReport.totalSpend | number:'1.2-2' }}
              </div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Received Orders</div>
              <div style="font-size: 22px; font-weight: 700; color: var(--status-in-stock-text); margin-top: 4px;">
                {{ getReceivedPurchasesCount() }}
              </div>
            </div>
          </div>

          <!-- Purchases Table -->
          <div *ngIf="purchasesReport.purchases.length === 0" class="table-container state-message" style="padding: 24px;">
            No purchase orders found for the selected filter criteria.
          </div>

          <div *ngIf="purchasesReport.purchases.length > 0" class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Purchase #</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Supplier Inv #</th>
                  <th>Status</th>
                  <th style="text-align: right;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of purchasesReport.purchases">
                  <td>
                    <a [routerLink]="['/purchases', p.id]" style="font-weight: 600; color: var(--accent-color);">
                      {{ p.purchaseNumber }}
                    </a>
                  </td>
                  <td style="white-space: nowrap;">{{ p.createdAt | date:'mediumDate' }}</td>
                  <td><strong>{{ p.supplierName }}</strong></td>
                  <td>{{ p.supplierInvoiceNo || '—' }}</td>
                  <td><app-status-badge [status]="p.status"></app-status-badge></td>
                  <td style="text-align: right; font-weight: 600;">₹{{ p.totalAmount | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ================= TAB 3: INVENTORY VALUATION ================= -->
      <div *ngIf="activeTab === 'VALUATION'">
        <div *ngIf="loadingValuation" class="state-message">
          Calculating inventory valuation and category metrics...
        </div>

        <div *ngIf="!loadingValuation" class="printable-area">
          <!-- Overall Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Active Items</div>
              <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">{{ products.length }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Cost Valuation</div>
              <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">₹{{ overallCostValuation | number:'1.2-2' }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--accent-color); text-transform: uppercase;">Total Retail Valuation</div>
              <div style="font-size: 22px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">₹{{ overallRetailValuation | number:'1.2-2' }}</div>
            </div>

            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--status-in-stock-text); text-transform: uppercase;">Potential Gross Profit</div>
              <div style="font-size: 22px; font-weight: 700; color: var(--status-in-stock-text); margin-top: 4px;">
                ₹{{ (overallRetailValuation - overallCostValuation) | number:'1.2-2' }}
              </div>
            </div>
          </div>

          <!-- Category Breakdown Table -->
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style="text-align: center;">SKU Count</th>
                  <th style="text-align: right;">Total Units in Stock</th>
                  <th style="text-align: right;">Cost Valuation (₹)</th>
                  <th style="text-align: right;">Retail Valuation (₹)</th>
                  <th style="text-align: right;">Potential Profit (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of categoryBreakdown">
                  <td><strong>{{ cat.category }}</strong></td>
                  <td style="text-align: center;">{{ cat.skuCount }}</td>
                  <td style="text-align: right;">{{ cat.totalUnits | number }}</td>
                  <td style="text-align: right;">₹{{ cat.costValuation | number:'1.2-2' }}</td>
                  <td style="text-align: right; font-weight: 600;">₹{{ cat.retailValuation | number:'1.2-2' }}</td>
                  <td style="text-align: right; color: var(--status-in-stock-text); font-weight: 600;">
                    ₹{{ (cat.retailValuation - cat.costValuation) | number:'1.2-2' }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="background-color: #f1efe9; font-weight: 700;">
                  <td>Total / Portfolio:</td>
                  <td style="text-align: center;">{{ products.length }}</td>
                  <td style="text-align: right;">{{ overallUnits | number }}</td>
                  <td style="text-align: right;">₹{{ overallCostValuation | number:'1.2-2' }}</td>
                  <td style="text-align: right; color: var(--accent-color);">₹{{ overallRetailValuation | number:'1.2-2' }}</td>
                  <td style="text-align: right; color: var(--status-in-stock-text);">
                    ₹{{ (overallRetailValuation - overallCostValuation) | number:'1.2-2' }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  activeTab: ReportTab = 'SALES';

  // Tab 1 State: Sales
  salesFilter: SalesReportFilter = {
    startDate: '',
    endDate: '',
    paymentMethod: '',
    paymentStatus: ''
  };
  salesReport: SalesReportResponse | null = null;
  loadingSales = false;

  // Tab 2 State: Purchases
  purchasesFilter: PurchasesReportFilter = {
    startDate: '',
    endDate: '',
    supplierId: '',
    status: ''
  };
  purchasesReport: PurchasesReportResponse | null = null;
  suppliers: Supplier[] = [];
  loadingPurchases = false;

  // Tab 3 State: Inventory Valuation
  products: Product[] = [];
  loadingValuation = false;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';

  constructor(
    private reportService: ReportService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSalesReport();
    this.loadSuppliers();
  }

  switchTab(tab: ReportTab): void {
    this.activeTab = tab;
    if (tab === 'SALES' && !this.salesReport) {
      this.loadSalesReport();
    } else if (tab === 'PURCHASES' && !this.purchasesReport) {
      this.loadPurchasesReport();
    } else if (tab === 'VALUATION' && this.products.length === 0) {
      this.loadValuation();
    }
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadSalesReport(): void {
    this.loadingSales = true;
    const filterToSend: SalesReportFilter = {
      startDate: this.salesFilter.startDate ? `${this.salesFilter.startDate}T00:00:00` : undefined,
      endDate: this.salesFilter.endDate ? `${this.salesFilter.endDate}T23:59:59` : undefined,
      paymentMethod: this.salesFilter.paymentMethod || undefined,
      paymentStatus: this.salesFilter.paymentStatus || undefined
    };

    this.reportService.getSalesReport(filterToSend).subscribe({
      next: (data) => {
        this.salesReport = data;
        this.loadingSales = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingSales = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  resetSalesFilter(): void {
    this.salesFilter = {
      startDate: '',
      endDate: '',
      paymentMethod: '',
      paymentStatus: ''
    };
    this.loadSalesReport();
  }

  loadPurchasesReport(): void {
    this.loadingPurchases = true;
    const filterToSend: PurchasesReportFilter = {
      startDate: this.purchasesFilter.startDate ? `${this.purchasesFilter.startDate}T00:00:00` : undefined,
      endDate: this.purchasesFilter.endDate ? `${this.purchasesFilter.endDate}T23:59:59` : undefined,
      supplierId: this.purchasesFilter.supplierId !== '' ? Number(this.purchasesFilter.supplierId) : undefined,
      status: this.purchasesFilter.status || undefined
    };

    this.reportService.getPurchasesReport(filterToSend).subscribe({
      next: (data) => {
        this.purchasesReport = data;
        this.loadingPurchases = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingPurchases = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  resetPurchasesFilter(): void {
    this.purchasesFilter = {
      startDate: '',
      endDate: '',
      supplierId: '',
      status: ''
    };
    this.loadPurchasesReport();
  }

  getReceivedPurchasesCount(): number {
    return this.purchasesReport?.purchases.filter((p) => p.status === 'RECEIVED').length || 0;
  }

  loadValuation(): void {
    this.loadingValuation = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loadingValuation = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingValuation = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  get overallUnits(): number {
    return this.products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  }

  get overallCostValuation(): number {
    return this.products.reduce((acc, p) => acc + (p.quantity || 0) * (p.purchasePrice || 0), 0);
  }

  get overallRetailValuation(): number {
    return this.products.reduce((acc, p) => acc + (p.quantity || 0) * (p.unitPrice || 0), 0);
  }

  get categoryBreakdown(): Array<{
    category: string;
    skuCount: number;
    totalUnits: number;
    costValuation: number;
    retailValuation: number;
  }> {
    const map = new Map<string, { skuCount: number; totalUnits: number; costValuation: number; retailValuation: number }>();

    for (const p of this.products) {
      const cat = p.category || 'Uncategorized';
      const existing = map.get(cat) || { skuCount: 0, totalUnits: 0, costValuation: 0, retailValuation: 0 };
      existing.skuCount += 1;
      existing.totalUnits += (p.quantity || 0);
      existing.costValuation += (p.quantity || 0) * (p.purchasePrice || 0);
      existing.retailValuation += (p.quantity || 0) * (p.unitPrice || 0);
      map.set(cat, existing);
    }

    return Array.from(map.entries()).map(([category, val]) => ({
      category,
      ...val
    }));
  }

  printReport(): void {
    window.print();
  }
}
