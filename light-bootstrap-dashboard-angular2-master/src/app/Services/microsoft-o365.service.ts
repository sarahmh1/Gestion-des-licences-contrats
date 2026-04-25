import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MicrosoftO365 } from 'app/Model/MicrosoftO365';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftO365Service {

  private baseUrl = `${environment.apiUrl}/MicrosoftO365`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les MicrosoftO365
  getAllMicrosoftO365s(): Observable<MicrosoftO365[]> {
    return this.http.get<MicrosoftO365[]>(`${this.baseUrl}/allMicrosoftO365`);
  }

  // Ajouter un nouveau MicrosoftO365
  addMicrosoftO365(microsoftO365: MicrosoftO365): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addMicrosoftO365`, microsoftO365);
  }

  // Récupérer un MicrosoftO365 par ID
  getMicrosoftO365ById(id: number): Observable<MicrosoftO365> {
    return this.http.get<MicrosoftO365>(`${this.baseUrl}/get/${id}`);
  }

  // Supprimer un MicrosoftO365 par ID
  deleteMicrosoftO365(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Mettre à jour un MicrosoftO365 existant
  updateMicrosoftO365(microsoftO365: MicrosoftO365): Observable<MicrosoftO365> {
    return this.http.put<MicrosoftO365>(`${this.baseUrl}/updateMicrosoftO365`, microsoftO365);
  }

  // Activer ou désactiver un MicrosoftO365
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  // Mettre à jour le statut d'un MicrosoftO365
  updateMicrosoftO365StatusToTrue(microsoftO365Id: number): Observable<void> {
    const url = `${this.baseUrl}/update-status/${microsoftO365Id}`;
    return this.http.put<void>(url, {});
  }

  // File upload methods
  uploadFile(id: number, file: File): Observable<MicrosoftO365> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<MicrosoftO365>(`${this.baseUrl}/${id}/upload-file`, formData);
  }

  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  deleteFile(id: number): Observable<MicrosoftO365> {
    return this.http.delete<MicrosoftO365>(`${this.baseUrl}/${id}/delete-file`);
  }
}

