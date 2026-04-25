import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InterventionCurative } from 'app/Model/InterventionCurative';

@Injectable({
  providedIn: 'root'
})
export class InterventionCurativeService {
  private baseUrl = `${environment.apiUrl}/InterventionCurative`;
  
  constructor(private http: HttpClient) {}

  getAllInterventionsCuratives(): Observable<InterventionCurative[]> {
    return this.http.get<InterventionCurative[]>(`${this.baseUrl}/all`);
  }

  addInterventionCurative(intervention: InterventionCurative): Observable<InterventionCurative> {
    return this.http.post<InterventionCurative>(`${this.baseUrl}/add`, intervention);
  }

  getInterventionCurativeById(id: number): Observable<InterventionCurative> {
    return this.http.get<InterventionCurative>(`${this.baseUrl}/get/${id}`);
  }

  deleteInterventionCurative(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  updateInterventionCurative(id: number, intervention: InterventionCurative): Observable<InterventionCurative> {
    return this.http.put<InterventionCurative>(`${this.baseUrl}/update/${id}`, intervention);
  }

  searchInterventionsCuratives(searchTerm: string): Observable<InterventionCurative[]> {
    return this.http.get<InterventionCurative[]>(`${this.baseUrl}/search`, {
      params: { term: searchTerm }
    });
  }

  getByContratId(contratId: number): Observable<InterventionCurative[]> {
    return this.http.get<InterventionCurative[]>(`${this.baseUrl}/byContrat/${contratId}`);
  }

  // Upload de fichier pour une intervention curative
  uploadFile(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<any>(`${this.baseUrl}/${id}/upload-file`, formData);
  }

  // Télécharger un fichier
  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  // Supprimer un fichier
  deleteFile(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}/delete-file`);
  }
}

