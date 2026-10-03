import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Transaction, TransactionType } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private baseUrl = `${API_BASE_URL}/transactions`;

  constructor(private http: HttpClient) {}

  getTransactions(type?: TransactionType, productId?: number): Observable<Transaction[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    if (productId) {
      params = params.set('productId', productId.toString());
    }
    return this.http.get<Transaction[]>(this.baseUrl, { params });
  }
}
