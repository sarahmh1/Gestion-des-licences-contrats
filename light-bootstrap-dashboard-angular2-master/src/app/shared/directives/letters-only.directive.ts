import { Directive, HostListener, Input } from '@angular/core';

/** Lettres, espaces, tiret et apostrophe (prénom, nom). */
const LETTER_KEY = /^[a-zA-ZÀ-ÿ\s'-]$/;
const LETTER_PASTE = /^[a-zA-ZÀ-ÿ\s'-]*$/;

@Directive({
  selector: '[appLettersOnly]',
})
export class LettersOnlyDirective {
  @Input() appLettersOnlyBlock = true;

  private static readonly NAV_KEYS = new Set([
    'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete',
  ]);

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.appLettersOnlyBlock) {
      return;
    }
    if (LettersOnlyDirective.NAV_KEYS.has(event.key)) {
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      const k = event.key.toLowerCase();
      if (k === 'a' || k === 'c' || k === 'v' || k === 'x') {
        return;
      }
    }
    if (event.key.length === 1 && !LETTER_KEY.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (!this.appLettersOnlyBlock) {
      return;
    }
    const text = event.clipboardData?.getData('text') ?? '';
    if (!LETTER_PASTE.test(text)) {
      event.preventDefault();
    }
  }
}
