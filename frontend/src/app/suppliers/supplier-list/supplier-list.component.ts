import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Supplier } from '../../models/supplier.model';
import { SupplierService } from '../../services/supplier.service';
import { MessageBannerComponent } from '../../shared/message-banner/message-banner.component';
import { extractErrorMessage } from '../../core/http-error.helper';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MessageBannerComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Suppliers</h1>
        <a routerLink="/suppliers/new" class="btn btn-primary">Add Supplier</a>
      </div>

      <app-message-banner [type]="bannerType" [message]="bannerMessage"></app-message-banner>

      <!-- Toolbar: Search and Filter -->
      <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <div style="flex: 1; min-width: 220px;">
          <input
            type="text"
            class="form-control"
            placeholder="Search by supplier name, contact person, or phone..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="applyFilters()"
          />
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-main);">
            <input
              type="checkbox"
              [(ngModel)]="activeOnly"
              (ngModelChange)="loadSuppliers()"
            />
            Active Suppliers Only
          </label>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="state-message">
        Loading suppliers...
      </div>

      <!-- Empty and Table States -->
      <div *ngIf="!loading">
        <div *ngIf="suppliers.length === 0" class="table-container state-message">
          No suppliers yet. <a routerLink="/suppliers/new">Add your first supplier.</a>
        </div>

        <div *ngIf="suppliers.length > 0 && filteredSuppliers.length === 0" class="table-container state-message">
          No suppliers match your search.
        </div>

        <div *ngIf="filteredSuppliers.length > 0" class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let supplier of filteredSuppliers">
                <td>
                  <strong>{{ supplier.name }}</strong>
                  <div *ngIf="supplier.notes" style="font-size: 11px; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ supplier.notes }}
                  </div>
                </td>
                <td>{{ supplier.contactPerson || '—' }}</td>
                <td>{{ supplier.phone || '—' }}</td>
                <td>
                  <a *ngIf="supplier.email" [href]="'mailto:' + supplier.email" style="color: var(--accent-color);">
                    {{ supplier.email }}
                  </a>
                  <span *ngIf="!supplier.email">—</span>
                </td>
                <td>
                  <span style="display: inline-block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="supplier.address || ''">
                    {{ supplier.address || '—' }}
                  </span>
                </td>
                <td>
                  <span
                    class="badge"
                    [ngClass]="supplier.isActive ? 'badge-in-stock' : 'badge-out-of-stock'"
                  >
                    {{ supplier.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td style="text-align: center; white-space: nowrap;">
                  <div style="display: inline-flex; gap: 6px;">
                    <a [routerLink]="['/suppliers', supplier.id, 'edit']" class="btn btn-sm btn-secondary">
                      Edit
                    </a>
                    <button
                      *ngIf="supplier.isActive"
                      type="button"
                      class="btn btn-sm btn-danger-outline"
                      (click)="confirmDeactivate(supplier)"
                    >
                      Deactivate
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Deactivate Confirmation Dialog -->
      <div *ngIf="supplierToDeactivate" class="modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h2 class="modal-title">Deactivate Supplier</h2>
            <button type="button" class="btn btn-sm btn-secondary" (click)="cancelDeactivate()">×</button>
          </div>
          <div style="margin-bottom: 20px;">
            <p style="margin-bottom: 8px;">
              Are you sure you want to deactivate <strong>{{ supplierToDeactivate.name }}</strong>?
            </p>
            <p style="font-size: 13px; color: var(--text-muted);">
              Deactivated suppliers will not appear in new purchase order forms, but past orders remain preserved.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancelDeactivate()" [disabled]="deactivating">
              Cancel
            </button>
            <button type="button" class="btn btn-danger-outline" (click)="executeDeactivate()" [disabled]="deactivating">
              {{ deactivating ? 'Deactivating...' : 'Yes, Deactivate' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  searchQuery: string = '';
  activeOnly: boolean = false;
  loading: boolean = true;

  bannerType: 'success' | 'error' | null = null;
  bannerMessage: string = '';

  supplierToDeactivate: Supplier | null = null;
  deactivating: boolean = false;

  constructor(
    private supplierService: SupplierService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.supplierService.getSuppliers(this.activeOnly).subscribe({
      next: (data) => {
        this.suppliers = data;
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
      this.filteredSuppliers = [...this.suppliers];
      return;
    }

    this.filteredSuppliers = this.suppliers.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(query);
      const contactMatch = s.contactPerson ? s.contactPerson.toLowerCase().includes(query) : false;
      const phoneMatch = s.phone ? s.phone.toLowerCase().includes(query) : false;
      return nameMatch || contactMatch || phoneMatch;
    });
  }

  confirmDeactivate(supplier: Supplier): void {
    this.supplierToDeactivate = supplier;
  }

  cancelDeactivate(): void {
    this.supplierToDeactivate = null;
  }

  executeDeactivate(): void {
    if (!this.supplierToDeactivate) return;

    this.deactivating = true;
    const targetId = this.supplierToDeactivate.id;
    const targetName = this.supplierToDeactivate.name;

    this.supplierService.deleteSupplier(targetId).subscribe({
      next: () => {
        this.deactivating = false;
        this.supplierToDeactivate = null;
        this.bannerType = 'success';
        this.bannerMessage = `Supplier "${targetName}" deactivated successfully.`;
        this.loadSuppliers();
      },
      error: (err) => {
        this.deactivating = false;
        this.bannerType = 'error';
        this.bannerMessage = extractErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
