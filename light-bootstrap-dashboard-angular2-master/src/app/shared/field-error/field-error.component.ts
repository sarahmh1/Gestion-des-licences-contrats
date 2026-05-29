import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ValidationFieldKind, showFieldError, validationMessage } from '../validators/validation-messages';

@Component({
  selector: 'app-field-error',
  template: `
    <div *ngIf="visible" class="text-danger small" style="margin-top: 4px;">
      {{ message }}
    </div>
  `,
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null | undefined;
  @Input() field: ValidationFieldKind = 'generic';

  get visible(): boolean {
    return showFieldError(this.control ?? null);
  }

  get message(): string | null {
    return validationMessage(this.control?.errors ?? null, this.field);
  }
}
