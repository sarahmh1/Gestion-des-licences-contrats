import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Proofpoint } from 'app/Model/Proofpoint';

@Injectable({
  providedIn: 'root'
})
export class ProofpointService {
  private baseUrl = `${environment.apiUrl}/Proofpoint`;

  constructor(private http: HttpClient) {}

  // Récupérer tous les Proofpoints
  getAllProofpoints(): Observable<Proofpoint[]> {
    return this.http.get<Proofpoint[]>(`${this.baseUrl}/allProofpoint`);
  }

  // Ajouter un nouveau Proofpoint
  addProofpoint(proofpoint: Proofpoint): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addProofpoint`, proofpoint);
  }

  // Récupérer un Proofpoint par ID
  getProofpointById(id: number): Observable<Proofpoint> {
    return this.http.get<Proofpoint>(`${this.baseUrl}/get/${id}`);
  }

  // Supprimer un Proofpoint par ID
  deleteProofpoint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Mettre à jour un Proofpoint existant
 updateProofpoint(proofpoint: Proofpoint): Observable<Proofpoint> {
  return this.http.put<Proofpoint>(`${this.baseUrl}/updateProofpoint`, proofpoint);
}


  // Activer ou désactiver un Proofpoint
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  // Mettre à jour le type de Proofpoint
  updateProofpointType(proofpointId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${proofpointId}`;
    return this.http.put<void>(url, { type });
  }

  // Upload file for Proofpoint
  uploadFile(proofpointId: number, file: File): Observable<Proofpoint> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Proofpoint>(`${this.baseUrl}/${proofpointId}/upload-file`, formData);
  }

  // Download file for Proofpoint
  downloadFile(proofpointId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${proofpointId}/download`, { responseType: 'blob' });
  }

  // Delete file for Proofpoint
  deleteFile(proofpointId: number): Observable<Proofpoint> {
    return this.http.delete<Proofpoint>(`${this.baseUrl}/${proofpointId}/delete-file`);
  }

  // Get file download URL
  getFileDownloadUrlById(proofpointId: number): string {
    return `${this.baseUrl}/${proofpointId}/download`;
  }
}

