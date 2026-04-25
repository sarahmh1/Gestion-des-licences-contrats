import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contrat } from 'app/Model/Contrat';

@Injectable({
  providedIn: 'root'
})
export class ContratService {
  private baseUrl = `${environment.apiUrl}/Contrat`;

  constructor(private http: HttpClient) { }

  getAllContrats(): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.baseUrl}/all`);
  }

  getHistoriqueContrats(): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.baseUrl}/historique`);
  }

  addContrat(contrat: Contrat): Observable<Contrat> {
    return this.http.post<Contrat>(`${this.baseUrl}/add`, contrat);
  }

  getContratById(id: number): Observable<Contrat> {
    return this.http.get<Contrat>(`${this.baseUrl}/get/${id}`);
  }

  deleteContrat(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  updateContrat(id: number, contrat: Contrat): Observable<Contrat> {
    return this.http.put<Contrat>(`${this.baseUrl}/update/${id}`, contrat);
  }

  searchContrats(searchTerm: string): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.baseUrl}/search`, {
      params: { term: searchTerm }
    });
  }

  // Upload de fichier pour un contrat
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

