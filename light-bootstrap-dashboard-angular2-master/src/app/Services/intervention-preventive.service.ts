import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InterventionPreventive } from '../Model/InterventionPreventive';

@Injectable({
  providedIn: 'root'
})
export class InterventionPreventiveService {

  private baseUrl = `${environment.apiUrl}/InterventionPreventive`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAllInterventionsPreventives(): Observable<InterventionPreventive[]> {
    return this.http.get<InterventionPreventive[]>(`${this.baseUrl}/all`, { headers: this.getHeaders() });
  }

  getInterventionPreventiveById(id: number): Observable<InterventionPreventive> {
    return this.http.get<InterventionPreventive>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  addInterventionPreventive(intervention: InterventionPreventive): Observable<InterventionPreventive> {
    return this.http.post<InterventionPreventive>(`${this.baseUrl}/add`, intervention, { headers: this.getHeaders() });
  }

  updateInterventionPreventive(id: number, intervention: InterventionPreventive): Observable<InterventionPreventive> {
    return this.http.put<InterventionPreventive>(`${this.baseUrl}/update/${id}`, intervention, { headers: this.getHeaders() });
  }

  deleteInterventionPreventive(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`, { headers: this.getHeaders() });
  }

  searchInterventionsPreventives(searchTerm: string): Observable<InterventionPreventive[]> {
    return this.http.get<InterventionPreventive[]>(`${this.baseUrl}/search?searchTerm=${searchTerm}`, { headers: this.getHeaders() });
  }

  getByContratId(contratId: number): Observable<InterventionPreventive[]> {
    return this.http.get<InterventionPreventive[]>(`${this.baseUrl}/contrat/${contratId}`, { headers: this.getHeaders() });
  }

  // Upload de fichier pour une intervention préventive
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

  // Upload de fichier pour une ligne de période
  uploadPeriodeLigneFile(periodeLigneId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<any>(`${this.baseUrl}/periode-ligne/${periodeLigneId}/upload-file`, formData);
  }

  // Télécharger un fichier de ligne de période
  getPeriodeLigneFileDownloadUrl(periodeLigneId: number): string {
    return `${this.baseUrl}/periode-ligne/${periodeLigneId}/download`;
  }
}

