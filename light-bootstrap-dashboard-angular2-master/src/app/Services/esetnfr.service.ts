import { environment } from 'environments/environment';
import { EsetNFR } from './../Model/EsetNFR';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class EsetnfrService {
  private baseUrl = `${environment.apiUrl}/Eset`; // ✅ Bon chemin


  constructor(private http: HttpClient) { }
  getAllesetsNFR() :Observable<EsetNFR[]>{
    return this.http.get<EsetNFR[]>(`${this.baseUrl}/allESETNFR`);
}
addEset(eset:EsetNFR): Observable<Object> {
  return this.http.post(`${this.baseUrl}/addESETNFR`, eset);
}

getByIdNFR(id: number): Observable<EsetNFR> {
  return this.http.get<EsetNFR>(`${this.baseUrl}/get/${id}`);
}

deleteEset(id: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/Delete-ESETNFR/${id}`);
}

updateEset(eset: EsetNFR): Observable<EsetNFR> {
  return this.http.put<EsetNFR>(`${this.baseUrl}/updateESETNFR`, eset);
}


updateEsetStatusToTrue(claimId: number): Observable<void> {
  const url = `${this.baseUrl}/update-statusFR/${claimId}`;
  return this.http.put<void>(url, {});
}
activateFR(id: number): Observable<void> {
  return this.http.put<void>(`${this.baseUrl}/approuveNFR/${id}`, {});
} }

