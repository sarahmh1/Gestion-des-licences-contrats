import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { PermissionService } from 'app/Services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl + '/api/auth';
  public redirectUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private permissionService: PermissionService
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

  /** Connexion / inscription via jeton « credential » Google (GIS, popup). */
  loginWithGoogle(credential: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/google`, { credential }).pipe(
      tap((response: any) => {
        this.storeAuthData(response);
        const redirect = this.redirectUrl || '/dashboard';
        this.redirectUrl = null;
        this.router.navigateByUrl(redirect);
      }),
      catchError((error: HttpErrorResponse) => {
        let msg = 'Authentification Google refusée.';
        if (error.status === 503) {
          msg = error.error?.message || 'Connexion Google indisponible (configuration serveur).';
        } else if (typeof error.error === 'object' && error.error?.message) {
          msg = error.error.message;
        } else if (error.status === 401) {
          msg = error.error?.message || msg;
        }
        return throwError(() => msg);
      })
    );
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  resetPasswordWithCode(payload: {
    email: string;
    code: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, payload).pipe(
      catchError(this.handleError)
    );
  }

  resendVerificationEmail(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/resend-verification`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode de vérification d'email (lien reçu après inscription)
  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/verify`, {
      params: { token }
    }).pipe(
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
      this.permissionService.refreshUserRole();
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
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = error.error?.message || error.message;
      }
      
      // Messages d'erreur spécifiques selon le code HTTP
      switch (error.status) {
        case 400:
          errorMessage =
            (typeof error.error === 'object' && error.error?.message) ||
            (typeof error.error === 'string' ? error.error : null) ||
            'Requête invalide';
          break;
        case 401:
          errorMessage = error.error?.message || 'Email ou mot de passe incorrect';
          break;
        case 403:
          errorMessage =
            error.error?.message ||
            "Votre compte n'est pas encore vérifié. Consultez votre boîte mail et cliquez sur le lien de confirmation.";
          break;
        case 404:
          errorMessage =
            error.error?.message ||
            'Service introuvable. Arrêtez le backend Java sur le port 8089, recompilez (mvn package) puis relancez spring-boot:run.';
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
        case 503:
          errorMessage = error.error?.message || 'Service temporairement indisponible';
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