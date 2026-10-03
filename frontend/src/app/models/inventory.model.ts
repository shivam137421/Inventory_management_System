export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type TransactionType = 'IN' | 'OUT';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
}

export interface StockRequest {
  quantity: number;
  note?: string;
}

export interface Transaction {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  transactionType: TransactionType;
  quantity: number;
  note?: string;
  createdAt: string;
}

export interface AttentionProduct {
  id: number;
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  status: StockStatus;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  attentionProducts: AttentionProduct[];
}
