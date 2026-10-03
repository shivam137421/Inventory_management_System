import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { DashboardMetrics } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = `${API_BASE_URL}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(this.baseUrl);
  }
}
