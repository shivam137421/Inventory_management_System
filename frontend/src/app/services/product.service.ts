import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Product, ProductRequest, StockRequest } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = `${API_BASE_URL}/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  createProduct(request: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, request);
  }

  updateProduct(id: number, request: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, request);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  stockIn(id: number, request: StockRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/${id}/stock-in`, request);
  }

  stockOut(id: number, request: StockRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/${id}/stock-out`, request);
  }
}
