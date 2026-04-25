import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl + '/api/auth';
  public redirectUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Méthode d'inscription
  signup(userData: any): Observable<any> {
    const payload = {
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      password: userData.password,
      sex: userData.sex,
      phoneNumber: userData.phoneNumber,
      dateOfBirth: userData.dateOfBirth,
      role: userData.role
    };

    return this.http.post(`${this.baseUrl}/register`, payload).pipe(
      tap((response: any) => {
        // Vous pouvez ajouter ici un traitement après une inscription réussie
        console.log('Inscription réussie', response);
      }),
      catchError(this.handleError)
    );
  }

  // Méthode de connexion
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/signin`, credentials).pipe(
      tap((response: any) => {
        this.storeAuthData(response);
        
        // Redirection après connexion
        const redirect = this.redirectUrl || '/dashboard';
        this.redirectUrl = null;
        this.router.navigateByUrl(redirect);
      }),
      catchError(this.handleError)
    );
  }

  // Méthode de vérification d'email
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/verify?token=${token}`).pipe(
      catchError(this.handleError)
    );
  }

  // Stockage des données d'authentification
  private storeAuthData(authData: any): void {
    if (authData && authData.token) {
      localStorage.setItem('token', authData.token);
      
      // Décoder le JWT pour extraire les infos utilisateur
      const userFromToken = this.decodeToken(authData.token);
      if (userFromToken) {
        localStorage.setItem('user', JSON.stringify(userFromToken));
        console.log('User stored from token:', userFromToken);
      } else if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
      }
    }
  }

  // Décoder le token JWT pour extraire les claims
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        id: decoded.userId,          // ← Ajouter 'id' pour compatibilité
        userId: decoded.userId,      // ← Garder aussi 'userId'
        email: decoded.sub,
        role: decoded.role,
        firstname: decoded.firstname || '',
        lastname: decoded.lastname || ''
      };
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      return null;
    }
  }

  // Vérification si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Récupération du token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Récupération des infos utilisateur
  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Récupération du rôle utilisateur
  getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // Gestion des erreurs
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = error.error?.message || error.message;
      
      // Messages d'erreur spécifiques selon le code HTTP
      switch (error.status) {
        case 400:
          errorMessage = error.error.message || 'Requête invalide';
          break;
        case 401:
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 403:
          errorMessage = 'Accès non autorisé';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 409:
          errorMessage = 'Un compte existe déjà avec cet email';
          break;
        case 422:
          errorMessage = 'Données invalides';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
      }
    }
    
    console.error('Erreur AuthService:', errorMessage);
    return throwError(errorMessage);
  }

  // Méthode pour vérifier si l'utilisateur a un rôle spécifique
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Rafraîchissement du token (si implémenté côté backend)
  refreshToken(): Observable<any> {
    return this.http.post(`${this.baseUrl}/refresh-token`, {
      token: this.getToken()
    }).pipe(
      tap((response: any) => {
        this.storeAuthData(response);
      }),
      catchError(this.handleError)
    );
  }
}