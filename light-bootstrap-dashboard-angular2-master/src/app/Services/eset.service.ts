import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { Eset } from 'app/Model/Eset';
import { EsetImportAnalyzeResponse } from 'app/Model/EsetImportAnalyzeResponse';

@Injectable({
  providedIn: 'root'
})
export class EsetService {
  private baseUrl = `${environment.apiUrl}/Eset`; // ✅ Bon chemin


  constructor(private http: HttpClient) { }
  getAllEsets() :Observable<Eset[]>{
    return this.http.get<Eset[]>(`${this.baseUrl}/allEset`);
}
addEset(eset: Eset): Observable<Object> {
  // Ajoutez des logs pour déboguer
  console.log('Envoi des données à l\'API:', eset);
  return this.http.post(`${this.baseUrl}/addESET`, eset);
}

/** Analyse PDF/TXT pour préremplir le formulaire d'ajout (Ollama côté serveur si activé). */
analyzeImport(file: File): Observable<EsetImportAnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', file);
  // Aligné sur eset.import.ollama.read-timeout-ms (20 min) — la VM peut être lente
  const analyzeTimeoutMs = 22 * 60 * 1000;
  return this.http
    .post<EsetImportAnalyzeResponse>(`${this.baseUrl}/import/analyze`, formData)
    .pipe(timeout(analyzeTimeoutMs));
}

getEsetById(id: number): Observable<Eset> {
  return this.http.get<Eset>(`${this.baseUrl}/get/${id}`);
}


deleteEset(id: number): Observable<void> {
  return this.http.delete<void>(`${environment.apiUrl}/Eset/Delete-ESET/${id}`);;
}


// Dans eset.service.ts
updateEset(eset: Eset): Observable<Eset> {
  return this.http.put<Eset>(`${this.baseUrl}/updateEset`, eset);  // Note le ESET en majuscules
}




updateEsetStatusToTrue(claimId: number): Observable<void> {
  const url = `${this.baseUrl}/update-status/${claimId}`;
  return this.http.put<void>(url, {});
}
activate(id: number): Observable<void> {
  return this.http.put<void>(`${this.baseUrl}/approuve/${id}`, {});
}

// Upload de fichier pour un ESET
uploadFile(esetId: number, file: File): Observable<HttpEvent<any>> {
  const formData = new FormData();
  formData.append('file', file);
  
  const req = new HttpRequest('POST', `${this.baseUrl}/${esetId}/upload-file`, formData, {
    reportProgress: true
  });
  
  return this.http.request(req);
}

// Télécharger un fichier
downloadFile(filename: string): Observable<Blob> {
  return this.http.get(`${this.baseUrl}/download-file/${filename}`, {
    responseType: 'blob'
  });
}

// Supprimer un fichier
deleteFile(esetId: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/${esetId}/delete-file`);
}

// Obtenir l'URL de téléchargement par nom de fichier
getFileDownloadUrl(filename: string): string {
  return `${this.baseUrl}/download-file/${filename}`;
}

// Obtenir l'URL de téléchargement par ID (avec nom original)
getFileDownloadUrlById(esetId: number): string {
  return `${this.baseUrl}/${esetId}/download`;
}

}
