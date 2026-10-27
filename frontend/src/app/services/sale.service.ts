import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Sale, SaleRequest } from '../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private baseUrl = `${API_BASE_URL}/sales`;

  constructor(private http: HttpClient) {}

  getSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.baseUrl);
  }

  getSaleById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/${id}`);
  }

  getSaleByBillNumber(billNumber: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/bill/${billNumber}`);
  }

  createSale(request: SaleRequest): Observable<Sale> {
    return this.http.post<Sale>(this.baseUrl, request);
  }
}
