export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type TransactionType = 'IN' | 'OUT' | 'OPENING' | 'PURCHASE_RECEIPT' | 'SALE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  purchasePrice?: number | null;
  description?: string | null;
  isActive: boolean;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  category: string;
  unit?: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  purchasePrice?: number | null;
  description?: string | null;
}

export interface StockRequest {
  quantity: number;
  note?: string;
}

export interface StockAdjustmentRequest {
  quantityChange: number;
  reason: string;
}

export interface Transaction {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  transactionType: TransactionType;
  quantity: number;
  note?: string;
  referenceType?: string | null;
  referenceId?: number | null;
  resultingQuantity?: number | null;
  createdAt: string;
}

export interface AttentionProduct {
  id: number;
  sku: string;
  name: string;
  unit?: string;
  quantity: number;
  reorderLevel: number;
  unitPrice?: number | null;
  purchasePrice?: number | null;
  status: StockStatus;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCostValue?: number;
  totalRetailValue?: number;
  todaySalesCount?: number;
  todaySalesRevenue?: number;
  totalLifetimeSales?: number;
  totalLifetimePurchases?: number;
  attentionProducts: AttentionProduct[];
}
