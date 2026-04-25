import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Veeam } from 'app/Model/Veeam';

@Injectable({
  providedIn: 'root'
})
export class VeeamService {
  private baseUrl = `${environment.apiUrl}/Veeam`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les Veeams
  getAllVeeams(): Observable<Veeam[]> {
    return this.http.get<Veeam[]>(`${this.baseUrl}/allVeeam`);
  }

  // Ajouter un nouveau Veeam
  addVeeam(veeam: Veeam): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addVeeam`, veeam);
  }

  // Récupérer un Veeam par ID
  getVeeamById(id: number): Observable<Veeam> {
    return this.http.get<Veeam>(`${this.baseUrl}/get/${id}`);
  }

  // Supprimer un Veeam par ID
  deleteVeeam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Mettre à jour un Veeam existant
  updateVeeam(veeam: Veeam): Observable<Veeam> {
    return this.http.put<Veeam>(`${this.baseUrl}/updateVeeam`, veeam);
  }

  // Activer ou désactiver un Veeam
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  // Mettre à jour le type de licence d'un Veeam
  updateVeeamType(veeamId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${veeamId}`;
    return this.http.put<void>(url, { type });
  }

  // Mettre à jour les remarques pour un Veeam
  updateVeeamRemarks(veeamId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${veeamId}`;
    return this.http.put<void>(url, { remarque });
  }

  // Upload file for Veeam
  uploadFile(veeamId: number, file: File): Observable<Veeam> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Veeam>(`${this.baseUrl}/${veeamId}/upload-file`, formData);
  }

  // Download file for Veeam
  downloadFile(veeamId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${veeamId}/download`, { responseType: 'blob' });
  }

  // Delete file for Veeam
  deleteFile(veeamId: number): Observable<Veeam> {
    return this.http.delete<Veeam>(`${this.baseUrl}/${veeamId}/delete-file`);
  }

  // Get file download URL
  getFileDownloadUrlById(veeamId: number): string {
    return `${this.baseUrl}/${veeamId}/download`;
  }
}

