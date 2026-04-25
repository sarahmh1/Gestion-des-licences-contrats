import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { EsetCI } from 'app/Model/EsetCI';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class EsetciService {
  private baseUrl = `${environment.apiUrl}/Eset`; // ✅ Bon chemin


  constructor(private http: HttpClient) { }
  getAllEsetsCI() :Observable<EsetCI[]>{
    return this.http.get<EsetCI[]>(`${this.baseUrl}/allESETCI`);
}
addEset(eset:EsetCI): Observable<Object> {
  return this.http.post(`${this.baseUrl}/addESETCI`, eset);
}

getEsetByIdCI(id: number): Observable<EsetCI> {
  return this.http.get<EsetCI>(`${this.baseUrl}/get/${id}`);
}

deleteEset(id: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/Delete-ESETCI/${id}`);
}

updateEset(eset: EsetCI): Observable<EsetCI> {
  return this.http.put<EsetCI>(`${this.baseUrl}/updateESETCI`, eset);
}


updateEsetStatusToTrue(claimId: number): Observable<void> {
  const url = `${this.baseUrl}/update-statusFR/${claimId}`;
  return this.http.put<void>(url, {});
}
activateFR(id: number): Observable<void> {
  return this.http.put<void>(`${this.baseUrl}/approuveCI/${id}`, {});
} }

