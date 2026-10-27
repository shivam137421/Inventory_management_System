import { Sale, PaymentMethod, PaymentStatus } from './sale.model';
import { Purchase, PurchaseStatus } from './purchase.model';

export interface SalesReportResponse {
  totalSalesCount: number;
  totalUnitsSold: number;
  totalSubtotal: number;
  totalDiscount: number;
  totalGrandTotal: number;
  sales: Sale[];
}

export interface PurchasesReportResponse {
  totalPurchasesCount: number;
  totalSpend: number;
  purchases: Purchase[];
}

export interface SalesReportFilter {
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod | '';
  paymentStatus?: PaymentStatus | '';
}

export interface PurchasesReportFilter {
  startDate?: string;
  endDate?: string;
  supplierId?: number | '';
  status?: PurchaseStatus | '';
}
