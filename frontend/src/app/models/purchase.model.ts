export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  supplierInvoiceNo?: string | null;
  status: PurchaseStatus;
  totalAmount: number;
  notes?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
}

export interface PurchaseItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseRequest {
  supplierId: number;
  supplierInvoiceNo?: string | null;
  notes?: string | null;
  items: PurchaseItemRequest[];
}
