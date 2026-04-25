import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('Token utilisé pour les headers:', token);
    
    if (!token) {
      console.warn('Aucun token trouvé dans localStorage');
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Erreur API:', error);
    
    if (error.status === 401 || error.status === 403) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.error('Token expiré ou invalide, déconnexion automatique');
    }
    
    return throwError(error);
  }

  get(url: string): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('GET request vers:', `${this.baseUrl}${url}`);
    
    return this.http.get(`${this.baseUrl}${url}`, { headers })
      .pipe(catchError(this.handleError));
  }

  post(url: string, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.baseUrl}${url}`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  put(url: string, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.baseUrl}${url}`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  delete(url: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}${url}`, { headers })
      .pipe(catchError(this.handleError));
  }

  upload(url: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
    
    return this.http.put(`${this.baseUrl}${url}`, formData, { 
      headers: headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(catchError(this.handleError));
  }
}
