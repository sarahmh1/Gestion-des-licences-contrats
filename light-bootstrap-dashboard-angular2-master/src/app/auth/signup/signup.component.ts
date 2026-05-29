import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';
import { GoogleIdentityService, GoogleAuthBlockState } from '../google-identity.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['../auth-shared.css', './signup.component.css']
})
export class SignupComponent implements AfterViewInit {
  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef<HTMLDivElement>;

  signupForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  isGoogleSubmitting = false;
  passwordVisible = false;
  googleBlock: GoogleAuthBlockState = 'loading';
  private resolvedGoogleClientId = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private googleIdentity: GoogleIdentityService,
    private cdr: ChangeDetectorRef
  ) {
    this.signupForm = this.fb.group({
      firstname: ['', AppValidators.requiredName],
      lastname: ['', AppValidators.requiredName],
      email: ['', [Validators.required, Validators.email]],
      password: ['', AppValidators.requiredSecurePassword],
      sex: ['MALE', Validators.required],
      phoneNumber: ['', AppValidators.requiredPhone],
      dateOfBirth: ['', Validators.required],
      role: ['ROLE_COMMERCIAL', Validators.required]
    });
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
        this.successMessage = 'Compte Google connecté ! Redirection...';
        this.isGoogleSubmitting = false;
      },
      error: (msg: string) => {
        this.errorMessage = typeof msg === 'string' ? msg : 'Erreur Google';
        this.isGoogleSubmitting = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.signupForm.value;

    const userData = {
      ...formValue,
      phoneNumber: formValue.phoneNumber.toString()
    };

    this.authService.signup(userData).subscribe({
      next: (res: { message?: string; emailSent?: boolean }) => {
        this.successMessage =
          res?.message ||
          'Inscription réussie ! Un e-mail de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre compte, puis connectez-vous.';
        if (res?.emailSent === false) {
          this.errorMessage =
            'L\'e-mail n\'a pas pu être envoyé. Sur la page de connexion, utilisez « Renvoyer l\'e-mail de vérification » ou demandez à l\'administrateur de vérifier la configuration mail.';
        }
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), res?.emailSent === false ? 8000 : 5000);
      },
      error: (err) => {
        this.errorMessage = typeof err === 'string' ? err : err.error?.message || 'Erreur lors de l\'inscription';
        this.isLoading = false;
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.signupForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }
}
