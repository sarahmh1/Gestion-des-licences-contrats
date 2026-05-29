import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { User } from 'app/Model/User';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = '/Users';

  constructor(private apiService: ApiService) { }

  getAllUsers(): Observable<any[]> {
    return this.apiService.get(this.baseUrl);
  }

  getAvailableUsersForMessaging(): Observable<any[]> {
    return this.apiService.get(`${this.baseUrl}/available-for-messaging`);
  }

  createUser(user: User): Observable<User> {
    return this.apiService.post(this.baseUrl, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.apiService.put(`${this.baseUrl}/${id}`, user);
  }

  /** Changement de rôle uniquement (PUT /Users/{id}/role?role=ROLE_...) */
  assignUserRole(id: number, role: string): Observable<User> {
    return this.apiService.put(`${this.baseUrl}/${id}/role?role=${encodeURIComponent(role)}`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.apiService.delete(`${this.baseUrl}/${id}`);
  }

  activateUser(id: number): Observable<void> {
    return this.apiService.put(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivateUser(id: number): Observable<void> {
    return this.apiService.put(`${this.baseUrl}/${id}/deactivate`, {});
  }
}
