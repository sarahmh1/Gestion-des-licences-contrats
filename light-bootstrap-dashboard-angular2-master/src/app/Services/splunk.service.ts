import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Splunk } from 'app/Model/Splunk';

@Injectable({
  providedIn: 'root'
})
export class SplunkService {
  private baseUrl = `${environment.apiUrl}/Splunk`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les Splunks
  getAllSplunks(): Observable<Splunk[]> {
    return this.http.get<Splunk[]>(`${this.baseUrl}/allSplunk`);
  }

  // Ajouter un nouveau Splunk
  addSplunk(splunk: Splunk): Observable<Splunk> {
    return this.http.post<Splunk>(`${this.baseUrl}/addSplunk`, splunk);
  }

  // Récupérer un Splunk par ID
  getSplunkById(id: number): Observable<Splunk> {
    return this.http.get<Splunk>(`${this.baseUrl}/get/${id}`);
  }

  // Supprimer un Splunk par ID
  deleteSplunk(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Mettre à jour un Splunk existant
  updateSplunk(splunk: Splunk): Observable<Splunk> {
    return this.http.put<Splunk>(`${this.baseUrl}/updateSplunk`, splunk);
  }

  // Activer ou désactiver un Splunk
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  // Mettre à jour le type de Splunk
  updateSplunkType(splunkId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${splunkId}`;
    return this.http.put<void>(url, { type });
  }

  // Mettre à jour la remarque d'un Splunk
  updateSplunkRemarks(splunkId: number, remarques: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${splunkId}`;
    return this.http.put<void>(url, { remarques });
  }

  // Upload fichier
  uploadFile(id: number, file: File): Observable<Splunk> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Splunk>(`${this.baseUrl}/${id}/upload`, formData);
  }

  // Télécharger fichier URL
  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  // Supprimer fichier
  deleteFile(id: number): Observable<Splunk> {
    return this.http.delete<Splunk>(`${this.baseUrl}/${id}/delete-file`);
  }
}

