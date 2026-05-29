import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Netskope } from 'app/Model/Netskope';

@Injectable({
  providedIn: 'root'
})
export class NetskopeService {
  private baseUrl = `${environment.apiUrl}/Netskope`;

  constructor(private http: HttpClient) {}

  
  getAllNetskopes(): Observable<Netskope[]> {
    return this.http.get<Netskope[]>(`${this.baseUrl}/allNetskope`);
  }

  
  addNetskope(netskope: Netskope): Observable<Netskope> {
    return this.http.post<Netskope>(`${this.baseUrl}/addNetskope`, netskope);
  }

  
  getNetskopeById(id: number): Observable<Netskope> {
    return this.http.get<Netskope>(`${this.baseUrl}/get/${id}`);
  }

 
  deleteNetskope(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

 
  updateNetskope(netskope: Netskope): Observable<Netskope> {
    return this.http.put<Netskope>(`${this.baseUrl}/updateNetskope`, netskope);
  }


  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  
  updateNetskopeType(netskopeId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${netskopeId}`;
    return this.http.put<void>(url, { type });
  }

  
  updateNetskopeRemarks(netskopeId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${netskopeId}`;
    return this.http.put<void>(url, { remarque });
  }

  // Upload un fichier pour un Netskope
  uploadFile(id: number, file: File): Observable<Netskope> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Netskope>(`${this.baseUrl}/${id}/upload`, formData);
  }

  // Obtenir l'URL de téléchargement d'un fichier
  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  // Supprimer un fichier
  deleteFile(id: number): Observable<Netskope> {
    return this.http.delete<Netskope>(`${this.baseUrl}/${id}/delete-file`);
  }
}

