import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';
import { GoogleIdentityService, GoogleAuthBlockState } from '../google-identity.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../auth-shared.css', './login.component.css']
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef<HTMLDivElement>;

  loginForm: FormGroup;
  forgotForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  isGoogleSubmitting = false;
  passwordVisible = false;
  googleBlock: GoogleAuthBlockState = 'loading';
  private resolvedGoogleClientId = '';

  forgotOpen = false;
  forgotStep: 'send' | 'reset' = 'send';
  forgotMessage = '';
  forgotError = '';
  isForgotSubmitting = false;
  resetPasswordVisible = false;
  resetConfirmVisible = false;

  resendVerificationMessage = '';
  resendVerificationError = '';
  isResendingVerification = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private googleIdentity: GoogleIdentityService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', AppValidators.requiredSecurePassword],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngAfterViewInit(): void {
    this.googleIdentity.resolveClientId().subscribe({
      next: (id) => {
        if (id) {
          this.resolvedGoogleClientId = id;
          this.googleBlock = 'on';
          setTimeout(() => this.tryRenderGoogleButton(0), 0);
        } else {
          this.googleBlock = 'off';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.googleBlock = 'off';
        this.cdr.detectChanges();
      }
    });
  }

  private tryRenderGoogleButton(attempt: number): void {
    if (!this.resolvedGoogleClientId) {
      return;
    }
    const host = this.googleBtnHost?.nativeElement;
    if (!host) {
      if (attempt < 40) {
        setTimeout(() => this.tryRenderGoogleButton(attempt + 1), 100);
      }
      return;
    }
    const w = window as unknown as { google?: { accounts?: { id?: unknown } } };
    if (w.google?.accounts?.id) {
      this.googleIdentity.renderSignInButton(
        host,
        (credential) => this.onGoogleCredential(credential),
        this.resolvedGoogleClientId
      );
      return;
    }
    if (attempt < 40) {
      setTimeout(() => this.tryRenderGoogleButton(attempt + 1), 200);
    }
  }

  private onGoogleCredential(credential: string): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isGoogleSubmitting = true;
    this.authService.loginWithGoogle(credential).subscribe({
      next: () => {
        this.successMessage = 'Connexion réussie ! Redirection...';
        this.isGoogleSubmitting = false;
      },
      error: (msg: string) => {
        this.errorMessage = typeof msg === 'string' ? msg : 'Erreur Google';
        this.isGoogleSubmitting = false;
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleResetPasswordVisibility(): void {
    this.resetPasswordVisible = !this.resetPasswordVisible;
  }

  toggleResetConfirmVisibility(): void {
    this.resetConfirmVisible = !this.resetConfirmVisible;
  }

  openForgotPassword(): void {
    const email = this.loginForm.get('email')?.value || '';
    this.forgotOpen = true;
    this.forgotStep = 'send';
    this.forgotMessage = '';
    this.forgotError = '';
    this.forgotForm.reset({ email, code: '', newPassword: '', confirmPassword: '' });
    this.forgotForm.get('email')?.setValue(email);
  }

  closeForgotPassword(): void {
    this.forgotOpen = false;
    this.forgotStep = 'send';
    this.forgotMessage = '';
    this.forgotError = '';
    this.isForgotSubmitting = false;
  }

  sendResetCode(): void {
    this.forgotMessage = '';
    this.forgotError = '';
    const emailControl = this.forgotForm.get('email');
    emailControl?.markAsTouched();
    if (emailControl?.invalid) {
      this.forgotError = 'Veuillez saisir une adresse e-mail valide.';
      return;
    }
    this.isForgotSubmitting = true;
    this.authService.requestPasswordReset(emailControl!.value.trim()).subscribe({
      next: (res) => {
        this.forgotMessage = res.message || 'Code envoyé par e-mail.';
        this.forgotStep = 'reset';
        this.isForgotSubmitting = false;
      },
      error: (err: string) => {
        this.forgotError = typeof err === 'string' ? err : 'Impossible d\'envoyer le code.';
        this.isForgotSubmitting = false;
      }
    });
  }

  submitNewPassword(): void {
    this.forgotMessage = '';
    this.forgotError = '';
    const email = this.forgotForm.get('email')?.value?.trim();
    const code = this.forgotForm.get('code')?.value?.trim();
    const newPassword = this.forgotForm.get('newPassword')?.value;
    const confirmPassword = this.forgotForm.get('confirmPassword')?.value;

    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.get('code')?.invalid) {
      this.forgotError = 'Le code doit contenir 6 chiffres.';
      return;
    }
    if (this.forgotForm.get('newPassword')?.invalid) {
      this.forgotError =
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.';
      return;
    }
    if (this.forgotForm.hasError('passwordMismatch')) {
      this.forgotError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isForgotSubmitting = true;
    this.authService.resetPasswordWithCode({ email, code, newPassword }).subscribe({
      next: (res) => {
        this.forgotMessage = res.message || 'Mot de passe mis à jour.';
        this.isForgotSubmitting = false;
        this.loginForm.patchValue({ email, password: '' });
        setTimeout(() => this.closeForgotPassword(), 2000);
        this.successMessage = 'Mot de passe réinitialisé. Connectez-vous avec votre nouveau mot de passe.';
      },
      error: (err: string) => {
        this.forgotError = typeof err === 'string' ? err : 'Réinitialisation impossible.';
        this.isForgotSubmitting = false;
      }
    });
  }

  resendVerificationEmail(): void {
    this.resendVerificationMessage = '';
    this.resendVerificationError = '';
    const email = this.loginForm.get('email')?.value?.trim();
    if (!email) {
      this.resendVerificationError = 'Saisissez d\'abord votre adresse e-mail.';
      return;
    }
    this.isResendingVerification = true;
    this.authService.resendVerificationEmail(email).subscribe({
      next: (res) => {
        this.resendVerificationMessage = res.message || 'E-mail de vérification renvoyé.';
        this.isResendingVerification = false;
      },
      error: (err: string) => {
        this.resendVerificationError = typeof err === 'string' ? err : 'Envoi impossible.';
        this.isResendingVerification = false;
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.resendVerificationMessage = '';
    this.resendVerificationError = '';
    this.isSubmitting = true;

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    if (!email || !password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      this.isSubmitting = false;
      return;
    }

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.successMessage = 'Connexion réussie ! Redirection...';
        this.isSubmitting = false;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error;
        this.isSubmitting = false;
      }
    });
  }
}
