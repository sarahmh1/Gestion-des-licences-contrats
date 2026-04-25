import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Bitdefender } from 'app/Model/Bitdefender';

@Injectable({
  providedIn: 'root'
})
export class BitdefenderService {
  private baseUrl = `${environment.apiUrl}/Bitdefender`;

  constructor(private http: HttpClient) {}

  
  getAllBitdefenders(): Observable<Bitdefender[]> {
    return this.http.get<Bitdefender[]>(`${this.baseUrl}/allBitdefender`);
  }

  
  addBitdefender(bitdefender: Bitdefender): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addBitdefender`, bitdefender);
  }

  
  getBitdefenderById(id: number): Observable<Bitdefender> {
    return this.http.get<Bitdefender>(`${this.baseUrl}/get/${id}`);
  }

  
  deleteBitdefender(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  
  updateBitdefender(bitdefender: Bitdefender): Observable<Bitdefender> {
    return this.http.put<Bitdefender>(`${this.baseUrl}/updateBitdefender`, bitdefender);
  }


  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

  updateBitdefenderType(bitdefenderId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${bitdefenderId}`;
    return this.http.put<void>(url, { type });
  }

  
  updateBitdefenderRemarks(bitdefenderId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${bitdefenderId}`;
    return this.http.put<void>(url, { remarque });
  }

  // Upload un fichier pour un Bitdefender
  uploadFile(id: number, file: File): Observable<Bitdefender> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Bitdefender>(`${this.baseUrl}/${id}/upload`, formData);
  }

  // Obtenir l'URL de téléchargement d'un fichier
  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  // Supprimer un fichier
  deleteFile(id: number): Observable<Bitdefender> {
    return this.http.delete<Bitdefender>(`${this.baseUrl}/${id}/delete-file`);
  }
}

