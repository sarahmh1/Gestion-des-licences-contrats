import { AbstractControl, ValidationErrors } from '@angular/forms';

export type ValidationFieldKind =
  | 'phone'
  | 'quantity'
  | 'email'
  | 'digits'
  | 'name'
  | 'password'
  | 'generic';

export function validationMessage(
  errors: ValidationErrors | null | undefined,
  kind: ValidationFieldKind = 'generic'
): string | null {
  if (!errors) {
    return null;
  }
  if (errors['required']) {
    return 'Ce champ est obligatoire.';
  }
  if (errors['email']) {
    return 'Email invalide.';
  }
  if (errors['passwordMismatch']) {
    return 'Les mots de passe ne correspondent pas.';
  }
  if (errors['minlength']) {
    if (kind === 'password') {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    return `Minimum ${errors['minlength'].requiredLength} caractères.`;
  }
  if (errors['pattern']) {
    switch (kind) {
      case 'phone':
        return 'Seuls les chiffres sont autorisés (8 chiffres).';
      case 'quantity':
        return 'Saisissez un nombre entier positif.';
      case 'digits':
        return 'Seuls les chiffres sont autorisés.';
      case 'name':
        return 'Seules les lettres sont autorisées.';
      case 'password':
        return 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&_#-+.).';
      default:
        return 'Format invalide.';
    }
  }
  return 'Valeur invalide.';
}

/** Affiche l'erreur dès que l'utilisateur modifie le champ (lettres invalides visibles tout de suite). */
export function showFieldError(control: AbstractControl | null | undefined): boolean {
  if (!control || !control.invalid) {
    return false;
  }
  return control.dirty || control.touched;
}

export function showControlInvalid(control: AbstractControl | null | undefined): boolean {
  return showFieldError(control);
}
