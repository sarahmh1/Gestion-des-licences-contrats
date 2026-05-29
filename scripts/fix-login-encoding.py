# -*- coding: utf-8 -*-
from pathlib import Path

HTML = r"""<div class="lc-auth lc-auth--login">
  <motion class="lc-auth__ambient" aria-hidden="true">
    <span class="lc-auth__blob lc-auth__blob--1"></span>
    <span class="lc-auth__blob lc-auth__blob--2"></span>
    <span class="lc-auth__blob lc-auth__blob--3"></span>
    <span class="lc-auth__grid-bg"></span>
  </motion>

  <header class="lc-auth__topbar">
    <a class="lc-auth__brand" routerLink="/login" aria-label="Accueil connexion">
      <span class="lc-auth__brand-mark">LC</span>
      <span class="lc-auth__brand-text">
        <strong>Licences &amp; Contrats</strong>
        <span>Gestion interne</span>
      </span>
    </a>
    <a routerLink="/signup" class="lc-auth__toplink">
      Cr\u00e9er un compte
      <i class="fas fa-arrow-right" aria-hidden="true"></i>
    </a>
  </header>

  <main class="lc-auth__stage">
    <motion class="lc-auth__shell">
      <article class="lc-auth__panel">
        <header class="lc-auth__panel-head">
          <p class="lc-auth__hero-eyebrow">Bienvenue</p>
          <h1 class="lc-auth__hero-title">Connexion</h1>
          <p class="lc-auth__hero-desc">Acc\u00e9dez \u00e0 votre espace de suivi des licences et contrats.</p>
        </header>

        <motion class="lc-auth__panel-body">
          <form class="auth-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <motion class="lc-field">
              <label for="email" class="lc-field__label">Adresse e-mail</label>
              <motion
                class="lc-field__wrap"
                [class.is-invalid]="loginForm.controls.email.invalid && loginForm.controls.email.touched">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="vous@entreprise.com" />
              </motion>
              <motion *ngIf="loginForm.controls.email.invalid && loginForm.controls.email.touched" class="invalid-feedback">
                Veuillez saisir une adresse e-mail valide.
              </motion>
            </motion>

            <motion class="lc-field">
              <label for="password" class="lc-field__label">Mot de passe</label>
              <motion
                class="lc-field__wrap lc-field__wrap--password"
                [class.is-invalid]="loginForm.controls.password.invalid && loginForm.controls.password.touched">
                <input
                  id="password"
                  [type]="passwordVisible ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="Votre mot de passe" />
                <button
                  type="button"
                  class="lc-field__toggle"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  [attr.aria-pressed]="passwordVisible">
                  <i class="fas" [class.fa-eye]="!passwordVisible" [class.fa-eye-slash]="passwordVisible" aria-hidden="true"></i>
                </button>
              </motion>
              <motion *ngIf="loginForm.controls.password.invalid && loginForm.controls.password.touched" class="invalid-feedback">
                Le mot de passe est requis.
              </motion>
              <p class="lc-forgot-row">
                <button type="button" class="lc-forgot-link" (click)="openForgotPassword()">
                  Mot de passe oubli\u00e9 ?
                </button>
              </p>
            </motion>

            <button type="submit" [disabled]="loginForm.invalid || isSubmitting" class="submit-btn">
              <span>{{ isSubmitting ? 'Connexion en cours\u2026' : 'Se connecter' }}</span>
              <i *ngIf="!isSubmitting" class="fas fa-arrow-right" aria-hidden="true"></i>
            </button>

            <motion *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</motion>
            <motion *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</motion>
          </form>

          <motion class="auth-google-section">
            <motion class="auth-divider"><span>ou</span></motion>
            <p *ngIf="googleBlock === 'loading'" class="google-loading">Chargement Google\u2026</p>
            <motion *ngIf="googleBlock === 'on'" class="google-btn-wrap">
              <motion #googleBtnHost class="google-btn-host"></motion>
              <p *ngIf="isGoogleSubmitting" class="google-loading">Connexion avec Google\u2026</p>
            </motion>
            <motion *ngIf="googleBlock === 'off'" class="google-disabled-hint" role="status">
              <p class="google-disabled-title">Connexion Google non configur\u00e9e</p>
              <ol class="google-disabled-steps">
                <li>
                  Cr\u00e9ez un client OAuth <strong>Application Web</strong> sur
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud</a>
                  (origine <code>http://localhost:4200</code>).
                </li>
                <li>
                  Configurez <code>application-google.local.properties</code> ou <code>GOOGLE_OAUTH_CLIENT_IDS</code>, puis red\u00e9marrez le backend.
                </li>
                <li class="google-disabled-alt">Ou renseignez <code>googleClientId</code> dans <code>environment.ts</code>.</li>
              </ol>
            </motion>
          </motion>

          <p class="link-switch">
            Pas encore de compte ?
            <a routerLink="/signup">S'inscrire</a>
          </p>

          <ul class="lc-auth__trust" aria-label="Points cl\u00e9s">
            <li><i class="fas fa-lock" aria-hidden="true"></i> Connexion s\u00e9curis\u00e9e</li>
            <li><i class="fas fa-chart-pie" aria-hidden="true"></i> Tableaux de bord</li>
            <li><i class="fas fa-users" aria-hidden="true"></i> Acc\u00e8s par r\u00f4le</li>
          </ul>
        </motion>
      </article>
    </motion>
  </main>

  <motion class="lc-forgot-overlay" *ngIf="forgotOpen" (click)="closeForgotPassword()" role="presentation"></motion>
  <motion
    class="lc-forgot-modal"
    *ngIf="forgotOpen"
    role="dialog"
    aria-labelledby="forgot-title"
    aria-modal="true"
    (click)="$event.stopPropagation()">
    <header class="lc-forgot-modal__head">
      <h2 id="forgot-title" class="lc-forgot-modal__title">Mot de passe oubli\u00e9</h2>
      <button type="button" class="lc-forgot-modal__close" (click)="closeForgotPassword()" aria-label="Fermer">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    </header>

    <form class="lc-forgot-modal__body" [formGroup]="forgotForm" (ngSubmit)="$event.preventDefault()">
      <p class="lc-forgot-modal__hint" *ngIf="forgotStep === 'send'">
        Saisissez votre e-mail pour recevoir un code \u00e0 6 chiffres (valable 15 minutes).
      </p>
      <p class="lc-forgot-modal__hint" *ngIf="forgotStep === 'reset'">
        Entrez le code re\u00e7u par e-mail et choisissez un nouveau mot de passe.
      </p>

      <motion class="lc-field">
        <label class="lc-field__label" for="forgot-email">E-mail</label>
        <motion class="lc-field__wrap" [class.is-invalid]="forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched">
          <input id="forgot-email" type="email" formControlName="email" autocomplete="email" [readonly]="forgotStep === 'reset'" />
        </motion>
      </motion>

      <ng-container *ngIf="forgotStep === 'reset'">
        <motion class="lc-field">
          <label class="lc-field__label" for="forgot-code">Code re\u00e7u par e-mail</label>
          <motion class="lc-field__wrap" [class.is-invalid]="forgotForm.get('code')?.invalid && forgotForm.get('code')?.touched">
            <input id="forgot-code" type="text" formControlName="code" inputmode="numeric" maxlength="6" placeholder="000000" />
          </motion>
        </motion>

        <motion class="lc-field">
          <label class="lc-field__label" for="forgot-new">Nouveau mot de passe</label>
          <motion class="lc-field__wrap lc-field__wrap--password" [class.is-invalid]="forgotForm.get('newPassword')?.invalid && forgotForm.get('newPassword')?.touched">
            <input id="forgot-new" [type]="resetPasswordVisible ? 'text' : 'password'" formControlName="newPassword" autocomplete="new-password" />
            <button type="button" class="lc-field__toggle" (click)="toggleResetPasswordVisibility()" aria-label="Afficher le mot de passe">
              <i class="fas" [class.fa-eye]="!resetPasswordVisible" [class.fa-eye-slash]="resetPasswordVisible" aria-hidden="true"></i>
            </button>
          </motion>
        </motion>

        <motion class="lc-field">
          <label class="lc-field__label" for="forgot-confirm">Confirmer le mot de passe</label>
          <motion class="lc-field__wrap lc-field__wrap--password">
            <input id="forgot-confirm" [type]="resetConfirmVisible ? 'text' : 'password'" formControlName="confirmPassword" autocomplete="new-password" />
            <button type="button" class="lc-field__toggle" (click)="toggleResetConfirmVisibility()" aria-label="Afficher la confirmation">
              <i class="fas" [class.fa-eye]="!resetConfirmVisible" [class.fa-eye-slash]="resetConfirmVisible" aria-hidden="true"></i>
            </button>
          </motion>
        </motion>
      </ng-container>

      <motion *ngIf="forgotMessage" class="alert alert-success">{{ forgotMessage }}</motion>
      <motion *ngIf="forgotError" class="alert alert-danger">{{ forgotError }}</motion>

      <motion class="lc-forgot-modal__actions">
        <button
          type="button"
          class="submit-btn"
          *ngIf="forgotStep === 'send'"
          [disabled]="isForgotSubmitting"
          (click)="sendResetCode()">
          {{ isForgotSubmitting ? 'Envoi\u2026' : 'Envoyer le code' }}
        </button>
        <button
          type="button"
          class="submit-btn"
          *ngIf="forgotStep === 'reset'"
          [disabled]="isForgotSubmitting"
          (click)="submitNewPassword()">
          {{ isForgotSubmitting ? 'Mise \u00e0 jour\u2026' : 'R\u00e9initialiser le mot de passe' }}
        </button>
        <button type="button" class="lc-forgot-modal__back" *ngIf="forgotStep === 'reset'" (click)="forgotStep = 'send'; forgotError = ''; forgotMessage = ''">
          Renvoyer un code
        </button>
      </motion>
    </form>
  </motion>
</motion>
"""

TAG = "motion"  # placeholder replaced with div below
HTML = HTML.replace("<" + TAG, "<div").replace("</" + TAG + ">", "</div>")
HTML = bytes(HTML, "utf-8").decode("unicode_escape")

path = Path(__file__).resolve().parents[1] / "light-bootstrap-dashboard-angular2-master" / "src" / "app" / "auth" / "login" / "login.component.html"
path.write_text(HTML, encoding="utf-8", newline="\n")
print("Wrote", path)
