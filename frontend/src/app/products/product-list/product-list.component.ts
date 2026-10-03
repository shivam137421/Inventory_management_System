import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product, StockStatus } from '../../models/inventory.model';
import { ProductService } from '../../services/product.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { StockDialogComponent } from '../../shared/stock-dialog/stock-dialog.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MessageBannerComponent,
    StatusBadgeComponent,
    StockDialogComponent
  ],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Products</h1>
        <a routerLink="/products/new" class="btn btn-primary">Add Product</a>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Toolbar: Search and Filters -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <div style="flex: 1; min-width: 200px;">
          <input
            type="text"
            class="form-control"
            placeholder="Search by name or SKU..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
          />
        </div>

        <div style="min-width: 160px;">
          <select class="form-control" [(ngModel)]="selectedCategory" (ngModelChange)="applyFilters()">
            <option value="">All categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
        </div>

        <div style="min-width: 150px;">
          <select class="form-control" [(ngModel)]="selectedStatus" (ngModelChange)="applyFilters()">
            <option value="">All statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading...
      </div>

      <!-- Table or Empty States -->
      <div *ngIf="!loading">
        <div *ngIf="products.length === 0" class="table-container state-message">
          No products yet. <a routerLink="/products/new">Add your first product.</a>
        </div>

        <div *ngIf="products.length > 0 && filteredProducts.length === 0" class="table-container state-message">
          No products match your search or filters.
        </div>

        <div *ngIf="filteredProducts.length > 0" class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: right;">Reorder Level</th>
                <th style="text-align: right;">Unit Price</th>
                <th>Stock Status</th>
                <th style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of filteredProducts">
                <td><strong>{{ product.sku }}</strong></td>
                <td>{{ product.name }}</td>
                <td>{{ product.category }}</td>
                <td style="text-align: right;">{{ product.quantity }}</td>
                <td style="text-align: right;">{{ product.reorderLevel }}</td>
                <td style="text-align: right;">{{ product.unitPrice | number:'1.2-2' }}</td>
                <td>
                  <app-status-badge [status]="product.status"></app-status-badge>
                </td>
                <td style="text-align: center;">
                  <div style="display: inline-flex; gap: 6px;">
                    <a [routerLink]="['/products', product.id, 'edit']" class="btn btn-sm btn-secondary">Edit</a>
                    <button type="button" class="btn btn-sm btn-secondary" (click)="openStockDialog(product, 'IN')">Stock In</button>
                    <button type="button" class="btn btn-sm btn-secondary" (click)="openStockDialog(product, 'OUT')">Stock Out</button>
                    <button type="button" class="btn btn-sm btn-danger-outline" (click)="deleteProduct(product)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stock Movement Dialog -->
      <app-stock-dialog
        *ngIf="selectedProductForStock && stockActionType"
        [product]="selectedProductForStock"
        [actionType]="stockActionType"
        (success)="onStockSuccess($event)"
        (cancel)="closeStockDialog()"
      ></app-stock-dialog>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];

  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';

  loading = true;
  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string | null = null;

  selectedProductForStock: Product | null = null;
  stockActionType: 'IN' | 'OUT' | null = null;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.extractCategories();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.showBanner('error', extractErrorMessage(err));
        this.cdr.detectChanges();
      }
    });
  }

  extractCategories(): void {
    const set = new Set<string>();
    this.products.forEach(p => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    this.categories = Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  applyFilters(): void {
    let result = [...this.products];

    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    if (this.selectedCategory) {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    if (this.selectedStatus) {
      result = result.filter(p => p.status === this.selectedStatus);
    }

    this.filteredProducts = result;
  }

  deleteProduct(product: Product): void {
    const confirmed = window.confirm(`Are you sure you want to delete product "${product.name}" (${product.sku})?`);
    if (!confirmed) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.showBanner('success', `Product "${product.name}" was successfully deleted.`);
        this.loadProducts();
      },
      error: (err) => {
        this.showBanner('error', extractErrorMessage(err));
      }
    });
  }

  openStockDialog(product: Product, type: 'IN' | 'OUT'): void {
    this.selectedProductForStock = product;
    this.stockActionType = type;
    this.cdr.detectChanges();
  }

  closeStockDialog(): void {
    this.selectedProductForStock = null;
    this.stockActionType = null;
    this.cdr.detectChanges();
  }

  onStockSuccess(updatedProduct: Product): void {
    this.closeStockDialog();
    this.showBanner('success', `Stock for "${updatedProduct.name}" successfully updated.`);
    this.loadProducts();
  }

  private showBanner(type: 'success' | 'error', message: string): void {
    this.bannerType = type;
    this.bannerMessage = message;
    this.cdr.detectChanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
