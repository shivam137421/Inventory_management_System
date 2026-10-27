import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { SalesReportResponse, PurchasesReportResponse, SalesReportFilter, PurchasesReportFilter } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = `${API_BASE_URL}/reports`;

  constructor(private http: HttpClient) {}

  getSalesReport(filter: SalesReportFilter): Observable<SalesReportResponse> {
    let params = new HttpParams();
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.paymentMethod) {
      params = params.set('paymentMethod', filter.paymentMethod);
    }
    if (filter.paymentStatus) {
      params = params.set('paymentStatus', filter.paymentStatus);
    }
    return this.http.get<SalesReportResponse>(`${this.baseUrl}/sales`, { params });
  }

  getPurchasesReport(filter: PurchasesReportFilter): Observable<PurchasesReportResponse> {
    let params = new HttpParams();
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.supplierId) {
      params = params.set('supplierId', filter.supplierId.toString());
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    return this.http.get<PurchasesReportResponse>(`${this.baseUrl}/purchases`, { params });
  }
}
