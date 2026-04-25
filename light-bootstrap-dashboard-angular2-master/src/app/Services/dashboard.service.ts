import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DashboardStats {
  [product: string]: number;
}

export interface MonthlyExpiration {
  [month: string]: number;
}

export interface ExpirationDetails {
  [month: string]: { [product: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  private createOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true // Important pour CORS avec credentials
    };
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      console.error('Error details:', error);
      return of(result as T);
    };
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, this.createOptions())
      .pipe(
        catchError(this.handleError<DashboardStats>('getStats', {})),
        map(stats => {
          const processedStats: DashboardStats = {};
          for (const [key, value] of Object.entries(stats)) {
            processedStats[key] = Number(value);
          }
          return processedStats;
        })
      );
  }

  getExpiringByMonth(): Observable<MonthlyExpiration> {
    return this.http.get<MonthlyExpiration>(`${this.apiUrl}/expiring-by-month`, this.createOptions())
      .pipe(
        catchError(this.handleError<MonthlyExpiration>('getExpiringByMonth', {})),
        map(expirationData => {
          const processedData: MonthlyExpiration = {};
          for (const [key, value] of Object.entries(expirationData)) {
            processedData[key] = Number(value);
          }
          return processedData;
        })
      );
  }

  getExpiringDetailsByMonth(): Observable<ExpirationDetails> {
    return this.http.get<ExpirationDetails>(`${this.apiUrl}/expiring-details`, this.createOptions())
      .pipe(
        catchError(this.handleError<ExpirationDetails>('getExpiringDetailsByMonth', {})),
        map(details => {
          if (!details) return {};
          
          const processedDetails: ExpirationDetails = {};
          for (const [month, products] of Object.entries(details)) {
            processedDetails[month] = {};
            for (const [product, count] of Object.entries(products)) {
              processedDetails[month][product] = Number(count);
            }
          }
          return processedDetails;
        })
      );
  }

  // Méthode pour tester la connexion
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`, this.createOptions())
      .pipe(
        catchError(this.handleError('testConnection', { status: 'error' }))
      );
  }
}
