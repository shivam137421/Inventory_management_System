import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Supplier, SupplierRequest } from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private baseUrl = `${API_BASE_URL}/suppliers`;

  constructor(private http: HttpClient) {}

  getSuppliers(activeOnly: boolean = false): Observable<Supplier[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<Supplier[]>(this.baseUrl, { params });
  }

  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }

  createSupplier(request: SupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, request);
  }

  updateSupplier(id: number, request: SupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/${id}`, request);
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
