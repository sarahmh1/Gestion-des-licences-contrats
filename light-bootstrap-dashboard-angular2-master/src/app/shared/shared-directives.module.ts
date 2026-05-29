import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HtmlDateInputDirective } from './html-date-input.directive';
import { ConfirmDeleteModalComponent } from './confirm-delete-modal/confirm-delete-modal.component';
import { NumbersOnlyDirective } from './directives/numbers-only.directive';
import { LettersOnlyDirective } from './directives/letters-only.directive';
import { FieldErrorComponent } from './field-error/field-error.component';

@NgModule({
  declarations: [
    HtmlDateInputDirective,
    ConfirmDeleteModalComponent,
    NumbersOnlyDirective,
    LettersOnlyDirective,
    FieldErrorComponent,
  ],
  imports: [CommonModule],
  exports: [
    HtmlDateInputDirective,
    ConfirmDeleteModalComponent,
    NumbersOnlyDirective,
    LettersOnlyDirective,
    FieldErrorComponent,
  ],
})
export class SharedDirectivesModule {}
