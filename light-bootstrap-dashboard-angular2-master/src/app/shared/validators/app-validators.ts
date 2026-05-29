import { ValidatorFn, Validators } from '@angular/forms';

/** Numéro tunisien : 8 chiffres (ex. 22222222). */
export const PHONE_REGEX = /^[0-9]{8}$/;

/** Quantité licence : entier ≥ 1. */
export const QUANTITY_REGEX = /^[1-9][0-9]*$/;

/** Entier positif ou zéro (délais, nb interventions). */
export const DIGITS_REGEX = /^[0-9]+$/;

/** Prénom / nom : lettres, espaces, tiret, apostrophe. */
export const NAME_REGEX = /^[A-Za-zÀ-ÿ' -]+$/;

/**
 * Mot de passe sécurisé : 8 car. min., majuscule, minuscule, chiffre, caractère spécial.
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#\-+().,])[A-Za-z\d@$!%*?&_#\-+().,]{8,}$/;

export const PASSWORD_HINT =
  '8 caractères min., une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&_#-+.).';

export class AppValidators {
  static readonly requiredPhone: ValidatorFn[] = [
    Validators.required,
    Validators.pattern(PHONE_REGEX),
  ];

  /** Vide autorisé ; sinon exactement 8 chiffres. */
  static readonly optionalPhone: ValidatorFn[] = [Validators.pattern(PHONE_REGEX)];

  static readonly requiredQuantity: ValidatorFn[] = [
    Validators.required,
    Validators.pattern(QUANTITY_REGEX),
  ];

  static readonly requiredDigits: ValidatorFn[] = [
    Validators.required,
    Validators.pattern(DIGITS_REGEX),
  ];

  static readonly requiredName: ValidatorFn[] = [
    Validators.required,
    Validators.minLength(2),
    Validators.pattern(NAME_REGEX),
  ];

  static readonly requiredSecurePassword: ValidatorFn[] = [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(PASSWORD_REGEX),
  ];
}

export function isValidSecurePassword(value: unknown): boolean {
  const v = (value ?? '').toString();
  return v !== '' && PASSWORD_REGEX.test(v);
}

export function isValidPhone(value: unknown): boolean {
  const v = (value ?? '').toString().trim();
  return v === '' || PHONE_REGEX.test(v);
}

export function isValidQuantity(value: unknown): boolean {
  const v = (value ?? '').toString().trim();
  return v !== '' && QUANTITY_REGEX.test(v);
}
