import { Directive, HostListener, Input } from '@angular/core';



/**

 * Bloque la saisie non numérique (téléphone, etc.).

 * Sur quantité : ne pas utiliser cette directive — validation via AppValidators + app-field-error.

 */

@Directive({

  selector: '[appNumbersOnly]',

})

export class NumbersOnlyDirective {

  /** false = autoriser les lettres (ex. quantité avec message d'erreur) */

  @Input() appNumbersOnlyBlock = true;



  private static readonly NAV_KEYS = new Set([

    'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete',

  ]);



  @HostListener('keydown', ['$event'])

  onKeyDown(event: KeyboardEvent): void {

    if (!this.appNumbersOnlyBlock) {

      return;

    }

    if (NumbersOnlyDirective.NAV_KEYS.has(event.key)) {

      return;

    }

    if (event.ctrlKey || event.metaKey) {

      const k = event.key.toLowerCase();

      if (k === 'a' || k === 'c' || k === 'v' || k === 'x') {

        return;

      }

    }

    if (event.key.length === 1 && !/^\d$/.test(event.key)) {

      event.preventDefault();

    }

  }



  @HostListener('paste', ['$event'])

  onPaste(event: ClipboardEvent): void {

    if (!this.appNumbersOnlyBlock) {

      return;

    }

    const text = event.clipboardData?.getData('text') ?? '';

    if (!/^\d*$/.test(text)) {

      event.preventDefault();

    }

  }

}

