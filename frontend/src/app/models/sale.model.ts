export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'OTHER';
export type PaymentStatus = 'PAID' | 'PENDING';

export interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: number;
  billNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  grandTotal: number;
  notes?: string | null;
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice?: number | null;
}

export interface SaleRequest {
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  discount?: number | null;
  notes?: string | null;
  items: SaleItemRequest[];
}
