import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../AuthService';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['../auth-shared.css', './verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message = 'Vérification de votre compte en cours…';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status = 'error';
      this.message = 'Lien de vérification invalide.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (res) => {
        this.status = 'success';
        this.message =
          (typeof res === 'object' && res?.message) ||
          'Compte vérifié avec succès. Vous pouvez vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 4000);
      },
      error: (err: string) => {
        this.status = 'error';
        this.message =
          typeof err === 'string'
            ? err
            : 'Lien de vérification invalide ou déjà utilisé.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
