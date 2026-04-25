import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Alwarebytes } from 'app/Model/Alwarebytes';

@Injectable({
  providedIn: 'root'
})
export class AlwarebytesService {
  private baseUrl = `${environment.apiUrl}/Alwarebytes`;

  constructor(private http: HttpClient) {}

  uploadFile(id: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<Alwarebytes>(`${this.baseUrl}/${id}/upload-file`, formData);
  }

  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  deleteFile(id: number) {
    return this.http.delete<Alwarebytes>(`${this.baseUrl}/${id}/delete-file`);
  }

  getAllAlwarebytess(): Observable<Alwarebytes[]> {
    return this.http.get<Alwarebytes[]>(`${this.baseUrl}/allAlwarebytes`);
  }

  addAlwarebytes(alwarebytes: Alwarebytes): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addAlwarebytes`, alwarebytes);
  }

  getAlwarebytesById(id: number): Observable<Alwarebytes> {
    return this.http.get<Alwarebytes>(`${this.baseUrl}/get/${id}`);
  }

  deleteAlwarebytes(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  updateAlwarebytes(alwarebytes: Alwarebytes): Observable<Alwarebytes> {
    return this.http.put<Alwarebytes>(`${this.baseUrl}/updateAlwarebytes`, alwarebytes);
  }

  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }


  updateAlwarebytesType(alwarebytesId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${alwarebytesId}`;
    return this.http.put<void>(url, { type });
  }


  updateAlwarebytesRemarks(alwarebytesId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${alwarebytesId}`;
    return this.http.put<void>(url, { remarque });
  }
}

