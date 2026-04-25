import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SentineIOne } from 'app/Model/SentineIOne';

@Injectable({
  providedIn: 'root'
})
export class SentineIOneService {
  private baseUrl = `${environment.apiUrl}/SentineIOne`;

  constructor(private http: HttpClient) {}


  getAllSentineIOnes(): Observable<SentineIOne[]> {
    return this.http.get<SentineIOne[]>(`${this.baseUrl}/allSentineIOne`);
  }

 
  addSentineIOne(sentineIOne: SentineIOne): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addSentineIOne`, sentineIOne);
  }

  getSentineIOneById(id: number): Observable<SentineIOne> {
    return this.http.get<SentineIOne>(`${this.baseUrl}/get/${id}`);
  }


  deleteSentineIOne(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  updateSentineIOne(sentineIOne: SentineIOne): Observable<SentineIOne> {
    return this.http.put<SentineIOne>(`${this.baseUrl}/updateSentineIOne`, sentineIOne);
  }


  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  
  updateSentineIOneType(sentineIOneId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${sentineIOneId}`;
    return this.http.put<void>(url, { type });
  }

  
  updateSentineIOneRemarks(sentineIOneId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${sentineIOneId}`;
    return this.http.put<void>(url, { remarque });
  }

  // ===== FILE METHODS =====
  uploadFile(sentineIOneId: number, file: File): Observable<SentineIOne> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SentineIOne>(`${this.baseUrl}/${sentineIOneId}/upload`, formData);
  }

  getFileDownloadUrl(sentineIOneId: number): string {
    return `${this.baseUrl}/${sentineIOneId}/download`;
  }

  deleteFile(sentineIOneId: number): Observable<SentineIOne> {
    return this.http.delete<SentineIOne>(`${this.baseUrl}/${sentineIOneId}/delete-file`);
  }
}

