import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Fortinet } from 'app/Model/Fortinet';

@Injectable({
  providedIn: 'root'
})
export class FortinetService {
  private baseUrl = `${environment.apiUrl}/Fortinet`; // ✅ Bon chemin
  constructor(private http: HttpClient) {}

 
  getAllFortinets(): Observable<Fortinet[]> {
    return this.http.get<Fortinet[]>(`${this.baseUrl}/allFortinet`);
  }

  addFortinet(fortinet: Fortinet): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addFortinet`, fortinet);
  }

  getFortinetById(id: number): Observable<Fortinet> {
    return this.http.get<Fortinet>(`${this.baseUrl}/get/${id}`);
  }

  deleteFortinet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  updateFortinet(fortinet: Fortinet): Observable<Fortinet> {
    return this.http.put<Fortinet>(`${this.baseUrl}/updateFortinet`, fortinet);
  }

  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }
  updateFortinetStatusToTrue(fortinetId: number): Observable<void> {
    const url = `${this.baseUrl}/update-status/${fortinetId}`;
    return this.http.put<void>(url, {});
  }

  // ==================== GESTION DES FICHIERS ====================

  // Upload de fichier pour un Fortinet
  uploadFile(fortinetId: number, file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const req = new HttpRequest('POST', `${this.baseUrl}/${fortinetId}/upload-file`, formData, {
      reportProgress: true
    });
    
    return this.http.request(req);
  }

  // Télécharger un fichier
  downloadFile(fortinetId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${fortinetId}/download`, {
      responseType: 'blob'
    });
  }

  // Supprimer un fichier
  deleteFile(fortinetId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${fortinetId}/delete-file`);
  }

  // Obtenir l'URL de téléchargement par ID
  getFileDownloadUrlById(fortinetId: number): string {
    return `${this.baseUrl}/${fortinetId}/download`;
  }
}

