import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Fortra } from 'app/Model/Fortra';

@Injectable({
  providedIn: 'root'
})
export class FortraService {
  private baseUrl = `${environment.apiUrl}/Fortra`;

  constructor(private http: HttpClient) {}


  getAllFortras(): Observable<Fortra[]> {
    return this.http.get<Fortra[]>(`${this.baseUrl}/allFortra`);
  }

  
  addFortra(fortra: Fortra): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addFortra`, fortra);
  }

  
  getFortraById(id: number): Observable<Fortra> {
    return this.http.get<Fortra>(`${this.baseUrl}/get/${id}`);
  }

  
  deleteFortra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

 
  updateFortra(fortra: Fortra): Observable<Fortra> {
    return this.http.put<Fortra>(`${this.baseUrl}/updateFortra`, fortra);
  }

  
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }


  updateFortraType(fortraId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${fortraId}`;
    return this.http.put<void>(url, { type });
  }


  updateFortraRemarks(fortraId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${fortraId}`;
    return this.http.put<void>(url, { remarque });
  }

  // ===== FILE METHODS =====
  uploadFile(fortraId: number, file: File): Observable<Fortra> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Fortra>(`${this.baseUrl}/${fortraId}/upload`, formData);
  }

  getFileDownloadUrl(fortraId: number): string {
    return `${this.baseUrl}/${fortraId}/download`;
  }

  deleteFile(fortraId: number): Observable<Fortra> {
    return this.http.delete<Fortra>(`${this.baseUrl}/${fortraId}/delete-file`);
  }
}

