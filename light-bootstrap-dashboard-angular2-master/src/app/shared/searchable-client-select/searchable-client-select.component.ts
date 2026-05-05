import {
  Component, Input, forwardRef,
  ElementRef, OnChanges, SimpleChanges, OnInit, OnDestroy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Client } from '../../Services/client.service';

@Component({
  selector: 'app-searchable-client-select',
  templateUrl: './searchable-client-select.component.html',
  styleUrls: ['./searchable-client-select.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SearchableClientSelectComponent),
    multi: true
  }]
})
export class SearchableClientSelectComponent implements ControlValueAccessor, OnChanges, OnInit, OnDestroy {

  @Input() clients: Client[] = [];
  @Input() placeholder = 'Rechercher un client...';

  searchTerm = '';
  isOpen = false;
  selectedValue = '';

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef) {}

  /** capture: true requis : le modal parent appelle stopPropagation() sur le clic en bulle. */
  private readonly documentClickCapture = (evt: Event) => {
    if (!this.isOpen) return;
    if (!this.el.nativeElement.contains(evt.target as Node)) {
      this.closeDropdown();
    }
  };

  ngOnInit(): void {
    document.addEventListener('click', this.documentClickCapture, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.documentClickCapture, true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si les clients arrivent apres un writeValue, resoudre le nom affiche
    if (changes['clients'] && this.selectedValue) {
      const found = this.clients.find(c => c.nomClient === this.selectedValue);
      if (found) this.searchTerm = found.nomClient;
    }
  }

  getElement(): HTMLElement {
    return this.el.nativeElement;
  }

  /* ── Filtre ── */
  get filteredClients(): Client[] {
    if (!this.searchTerm.trim()) return this.clients;
    const t = this.searchTerm.toLowerCase();
    return this.clients.filter(c => c.nomClient.toLowerCase().includes(t));
  }

  /* ── ControlValueAccessor ── */
  writeValue(value: string): void {
    this.selectedValue = value || '';
    const found = this.clients.find(c => c.nomClient === value);
    this.searchTerm = found ? found.nomClient : (value || '');
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  /* ── Interactions ── */
  onInputFocus(): void {
    this.searchTerm = '';   // vider pour montrer toute la liste
    this.isOpen = true;
  }

  onInputChange(value: string): void {
    this.searchTerm = value;
    this.isOpen = true;
    // Si l'utilisateur efface tout, reset la valeur
    if (!value.trim()) {
      this.selectedValue = '';
      this.onChange('');
    }
  }

  selectClient(client: Client, event: Event): void {
    event.stopPropagation();
    this.selectedValue = client.nomClient;
    this.searchTerm   = client.nomClient;
    this.isOpen       = false;
    this.onChange(client.nomClient);
    this.onTouched();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedValue = '';
    this.searchTerm    = '';
    this.isOpen        = false;
    this.onChange('');
    this.onTouched();
  }

  closeDropdown(): void {
    if (!this.selectedValue) {
      this.searchTerm = '';
    } else {
      this.searchTerm = this.selectedValue;
    }
    this.isOpen = false;
  }
}
