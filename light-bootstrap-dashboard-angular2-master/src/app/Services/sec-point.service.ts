import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SecPoint } from 'app/Model/SecPoint';

@Injectable({
  providedIn: 'root'
})
export class SecPointService {
  private baseUrl = `${environment.apiUrl}/SecPoint`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les SecPoint
  getAllSecPoints(): Observable<SecPoint[]> {
    return this.http.get<SecPoint[]>(`${this.baseUrl}/allSecPoint`);
  }

  // Ajouter un nouveau SecPoint
  addSecPoint(secPoint: SecPoint): Observable<SecPoint> {
    return this.http.post<SecPoint>(`${this.baseUrl}/addSecPoint`, secPoint);
  }

  // Récupérer un SecPoint par ID
  getSecPointById(id: number): Observable<SecPoint> {
    return this.http.get<SecPoint>(`${this.baseUrl}/get/${id}`);
  }

  // Supprimer un SecPoint par ID
  deleteSecPoint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Mettre à jour un SecPoint existant
  updateSecPoint(secPoint: SecPoint): Observable<SecPoint> {
    return this.http.put<SecPoint>(`${this.baseUrl}/updateSecPoint`, secPoint);
  }

  // Activer ou désactiver un SecPoint
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  // Mettre à jour une remarque pour un SecPoint
  updateSecPointRemarque(secPointId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarque/${secPointId}`;
    return this.http.put<void>(url, { remarque });
  }

  // Upload un fichier pour un SecPoint
  uploadFile(id: number, file: File): Observable<SecPoint> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<SecPoint>(`${this.baseUrl}/${id}/upload`, formData);
  }

  // Obtenir l'URL de téléchargement d'un fichier
  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  // Supprimer un fichier
  deleteFile(id: number): Observable<SecPoint> {
    return this.http.delete<SecPoint>(`${this.baseUrl}/${id}/delete-file`);
  }
}

