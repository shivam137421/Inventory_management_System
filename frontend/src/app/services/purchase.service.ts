import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Purchase, PurchaseRequest, PurchaseStatus } from '../models/purchase.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private baseUrl = `${API_BASE_URL}/purchases`;

  constructor(private http: HttpClient) {}

  getPurchases(status?: PurchaseStatus): Observable<Purchase[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Purchase[]>(this.baseUrl, { params });
  }

  getPurchaseById(id: number): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.baseUrl}/${id}`);
  }

  createPurchase(request: PurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(this.baseUrl, request);
  }

  receivePurchase(id: number): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.baseUrl}/${id}/receive`, {});
  }

  cancelPurchase(id: number): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
