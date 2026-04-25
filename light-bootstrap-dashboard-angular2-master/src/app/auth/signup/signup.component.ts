import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      sex: ['MALE', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      dateOfBirth: ['', Validators.required],
      role: ['ROLE_COMMERCIAL', Validators.required]
    });
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
      next: (response) => {
        this.successMessage = 'Inscription réussie! Veuillez vérifier votre email.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription';
        this.isLoading = false;
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.signupForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
