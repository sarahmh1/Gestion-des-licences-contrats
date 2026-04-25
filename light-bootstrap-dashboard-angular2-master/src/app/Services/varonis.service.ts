import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Varonis } from 'app/Model/Varonis';

@Injectable({
  providedIn: 'root'
})
export class VaronisService {
  private baseUrl = `${environment.apiUrl}/Varonis`;

  constructor(private http: HttpClient) {}

  getAllVaronis(): Observable<Varonis[]> {
    return this.http.get<Varonis[]>(`${this.baseUrl}/allVaronis`);
  }

 
  addVaronis(varonis: Varonis): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addVaronis`, varonis);
  }

  
  getVaronisById(id: number): Observable<Varonis> {
    return this.http.get<Varonis>(`${this.baseUrl}/get/${id}`);
  }

  
  deleteVaronis(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }


  updateVaronis(varonis: Varonis): Observable<Varonis> {
    return this.http.put<Varonis>(`${this.baseUrl}/updateVaronis`, varonis);
  }


  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

 
  updateVaronisType(varonisId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${varonisId}`;
    return this.http.put<void>(url, { type });
  }

  updateVaronisRemarks(varonisId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${varonisId}`;
    return this.http.put<void>(url, { remarque });
  }

  // File upload methods
  uploadFile(id: number, file: File): Observable<Varonis> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<Varonis>(`${this.baseUrl}/${id}/upload-file`, formData);
  }

  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  deleteFile(id: number): Observable<Varonis> {
    return this.http.delete<Varonis>(`${this.baseUrl}/${id}/delete-file`);
  }
}

