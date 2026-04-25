import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Infoblox } from 'app/Model/Infoblox';

@Injectable({
  providedIn: 'root'
})
export class InfobloxService {
  private baseUrl = `${environment.apiUrl}/Infoblox`;

  constructor(private http: HttpClient) {}


  getAllInfobloxs(): Observable<Infoblox[]> {
    return this.http.get<Infoblox[]>(`${this.baseUrl}/allInfoblox`);
  }

  
  addInfoblox(infoblox: Infoblox): Observable<Object> {
    return this.http.post(`${this.baseUrl}/addInfoblox`, infoblox);
  }


  getInfobloxById(id: number): Observable<Infoblox> {
    return this.http.get<Infoblox>(`${this.baseUrl}/get/${id}`);
  }

 
  deleteInfoblox(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }


  updateInfoblox(infoblox: Infoblox): Observable<Infoblox> {
    return this.http.put<Infoblox>(`${this.baseUrl}/updateInfoblox`, infoblox);
  }

 
  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
  }

 
  updateInfobloxType(infobloxId: number, type: string): Observable<void> {
    const url = `${this.baseUrl}/update-type/${infobloxId}`;
    return this.http.put<void>(url, { type });
  }

  updateInfobloxRemarks(infobloxId: number, remarque: string): Observable<void> {
    const url = `${this.baseUrl}/update-remarks/${infobloxId}`;
    return this.http.put<void>(url, { remarque });
  }

  // File upload methods
  uploadFile(id: number, file: File): Observable<Infoblox> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<Infoblox>(`${this.baseUrl}/${id}/upload-file`, formData);
  }

  getFileDownloadUrl(id: number): string {
    return `${this.baseUrl}/${id}/download`;
  }

  deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/delete-file`);
  }
}

