import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { environment } from 'environments/environment';

export type GoogleAuthBlockState = 'loading' | 'on' | 'off';

/**
 * Affiche le bouton Google Identity Services (mode popup) dans un conteneur DOM.
 * L’ID client est pris d’abord depuis {@link environment.googleClientId}, sinon depuis
 * {@code GET /api/auth/google-client-id} (premier ID de {@code google.oauth.client-ids}).
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private lastClientId: string | null = null;
  /** Cache après appel API (chaîne vide = pas d’ID). */
  private apiResolvedId: string | undefined = undefined;

  constructor(private http: HttpClient) {}

  /** True si un ID est défini explicitement dans l’environnement Angular. */
  isConfigured(): boolean {
    return !!environment.googleClientId?.trim();
  }

  /**
   * Résout l’ID client Web : priorité à {@code environment.googleClientId}, sinon backend.
   */
  resolveClientId(): Observable<string> {
    const envId = environment.googleClientId?.trim();
    if (envId) {
      return of(envId);
    }
    if (this.apiResolvedId !== undefined) {
      return of(this.apiResolvedId);
    }
    const url = `${environment.apiUrl}/api/auth/google-client-id`;
    return this.http.get<{ clientId?: string }>(url).pipe(
      timeout(8000),
      map((r) => (r?.clientId ?? '').trim()),
      tap((id) => {
        this.apiResolvedId = id;
      }),
      catchError(() => {
        this.apiResolvedId = '';
        return of('');
      })
    );
  }

  /**
   * Rend le bouton Google dans `host`. Ré-appelable après navigation (ré-init GIS).
   */
  renderSignInButton(host: HTMLElement, onCredential: (credential: string) => void, clientId: string): void {
    const trimmed = clientId?.trim();
    if (!trimmed || !host) {
      return;
    }

    const g = (window as unknown as { google?: GsiNamespace }).google;
    if (!g?.accounts?.id) {
      console.warn('Script Google GIS absent : vérifiez index.html (accounts.google.com/gsi/client).');
      return;
    }

    if (this.lastClientId && this.lastClientId !== trimmed) {
      g.accounts.id.cancel();
    }
    this.lastClientId = trimmed;

    g.accounts.id.initialize({
      client_id: trimmed,
      callback: (resp: { credential?: string }) => {
        if (resp?.credential) {
          onCredential(resp.credential);
        }
      },
      ux_mode: 'popup'
    });

    host.innerHTML = '';
    g.accounts.id.renderButton(host, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      locale: 'fr',
      width: 320
    });
  }
}

interface GsiNamespace {
  accounts: {
    id: {
      initialize: (config: Record<string, unknown>) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
      cancel: () => void;
    };
  };
}
