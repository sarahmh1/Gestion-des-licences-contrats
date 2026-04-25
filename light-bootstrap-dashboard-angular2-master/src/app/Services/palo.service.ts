import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Palo } from 'app/Model/Palo';

@Injectable({
  providedIn: 'root'
})
export class PaloService {
  private baseUrl = `${environment.apiUrl}/Palo`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les Palo
  getAllPalos(): Observable<Palo[]> {
    return this.http.get<Palo[]>(`${this.baseUrl}/allPalo`);
  }

  // Ajouter un nouveau Palo
  addPalo(palo: Palo): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addPalo`, palo);
  }

  // Récupérer un Palo par ID
  getPaloById(id: number): Observable<Palo> {
    return this.http.get<Palo>(`${this.baseUrl}/get/${id}`);
  }

  // Supprimer un Palo par ID
  deletePalo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Mettre à jour un Palo existant
  updatePalo(palo: Palo): Observable<Palo> {
    return this.http.put<Palo>(`${this.baseUrl}/updatePalo`, palo);
  }

  // Activer ou désactiver un Palo
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  // Mettre à jour le statut sous contrat d'un Palo
  updatePaloSousContratStatus(paloId: number, sousContrat: boolean): Observable<void> {
    const url = `${this.baseUrl}/update-sous-contrat/${paloId}`;
    return this.http.put<void>(url, { sousContrat });
  }

  // ==================== GESTION DES FICHIERS ====================

  // Upload de fichier pour un Palo
  uploadFile(paloId: number, file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const req = new HttpRequest('POST', `${this.baseUrl}/${paloId}/upload-file`, formData, {
      reportProgress: true
    });
    
    return this.http.request(req);
  }

  // Télécharger un fichier
  downloadFile(paloId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${paloId}/download`, {
      responseType: 'blob'
    });
  }

  // Supprimer un fichier
  deleteFile(paloId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${paloId}/delete-file`);
  }

  // Obtenir l'URL de téléchargement par ID
  getFileDownloadUrlById(paloId: number): string {
    return `${this.baseUrl}/${paloId}/download`;
  }
}

