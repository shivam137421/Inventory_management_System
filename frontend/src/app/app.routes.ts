import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () => import('./products/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'products/new',
    canActivate: [authGuard],
    loadComponent: () => import('./products/product-form/product-form.component').then(m => m.ProductFormComponent)
  },
  {
    path: 'products/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./products/product-form/product-form.component').then(m => m.ProductFormComponent)
  },
  {
    path: 'suppliers',
    canActivate: [authGuard],
    loadComponent: () => import('./suppliers/supplier-list/supplier-list.component').then(m => m.SupplierListComponent)
  },
  {
    path: 'suppliers/new',
    canActivate: [authGuard],
    loadComponent: () => import('./suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
  },
  {
    path: 'suppliers/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent)
  },
  {
    path: 'purchases',
    canActivate: [authGuard],
    loadComponent: () => import('./purchases/purchase-list/purchase-list.component').then(m => m.PurchaseListComponent)
  },
  {
    path: 'purchases/new',
    canActivate: [authGuard],
    loadComponent: () => import('./purchases/purchase-form/purchase-form.component').then(m => m.PurchaseFormComponent)
  },
  {
    path: 'purchases/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./purchases/purchase-detail/purchase-detail.component').then(m => m.PurchaseDetailComponent)
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () => import('./sales/sale-list/sale-list.component').then(m => m.SaleListComponent)
  },
  {
    path: 'sales/new',
    canActivate: [authGuard],
    loadComponent: () => import('./sales/record-sale/record-sale.component').then(m => m.RecordSaleComponent)
  },
  {
    path: 'sales/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./sales/sale-detail/sale-detail.component').then(m => m.SaleDetailComponent)
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () => import('./transactions/transactions.component').then(m => m.TransactionsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
