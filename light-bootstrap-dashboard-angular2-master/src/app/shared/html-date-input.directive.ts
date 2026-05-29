import { Directive, ElementRef, HostListener, OnInit, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { HTML_DATE_INPUT_MAX, HTML_DATE_INPUT_MIN, normalizeHtmlDateInput } from './date-input.util';

/**
 * Tous les input[type=date] : bornes min/max + correction au blur (année 4 chiffres, sans bloquer la saisie).
 */
@Directive({
  selector: 'input[type=date]'
})
export class HtmlDateInputDirective implements OnInit {

  constructor(
    private readonly el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private readonly ngControl: NgControl
  ) {}

  ngOnInit(): void {
    const input = this.el.nativeElement;
    if (!input.getAttribute('min')) {
      input.min = HTML_DATE_INPUT_MIN;
    }
    if (!input.getAttribute('max')) {
      input.max = HTML_DATE_INPUT_MAX;
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const input = this.el.nativeElement;
    const normalized = normalizeHtmlDateInput(input.value);
    if (input.value !== normalized) {
      input.value = normalized;
    }
    const control = this.ngControl?.control;
    if (control && control.value !== normalized) {
      control.setValue(normalized === '' ? null : normalized, { emitEvent: false });
    }
  }
}
