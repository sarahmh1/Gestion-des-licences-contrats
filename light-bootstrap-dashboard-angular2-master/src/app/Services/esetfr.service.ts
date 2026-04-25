import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { EsetFR } from 'app/Model/EsetFR';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class EsetfrService {
 private baseUrl = `${environment.apiUrl}/Eset`; // ✅ Bon chemin


  constructor(private http: HttpClient) { }
  getAllEsetsFR() :Observable<EsetFR[]>{
    return this.http.get<EsetFR[]>(`${this.baseUrl}/allEsetFR`);
}
addEsetFR(eset: EsetFR): Observable<Object> {
  return this.http.post(`${this.baseUrl}/addESETFR`, eset);
}

getEsetById(id: number): Observable<EsetFR> {
  return this.http.get<EsetFR>(`${this.baseUrl}/getFR/${id}`);
}

deleteEsetFR(id: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/Delete-ESETFR/${id}`);
}

updateEsetFR(eset: EsetFR): Observable<EsetFR> {
  return this.http.put<EsetFR>(`${this.baseUrl}/updateEsetFR`, eset);
}


updateEsetStatusToTrueFR(claimId: number): Observable<void> {
  const url = `${this.baseUrl}/update-statusFR/${claimId}`;
  return this.http.put<void>(url, {});
}
activateFR(id: number): Observable<void> {
  return this.http.put<void>(`${this.baseUrl}/approuveFR/${id}`, {});
}

}
