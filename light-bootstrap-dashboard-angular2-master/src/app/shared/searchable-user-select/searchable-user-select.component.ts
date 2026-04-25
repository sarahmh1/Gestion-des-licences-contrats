import {
  Component, Input, Output, EventEmitter,
  HostListener, ElementRef, OnChanges, SimpleChanges
} from '@angular/core';

export interface SelectableUser {
  id: number | string;
  firstname: string;
  lastname: string;
  role?: string;
}

@Component({
  selector: 'app-searchable-user-select',
  templateUrl: './searchable-user-select.component.html',
  styleUrls: ['./searchable-user-select.component.scss']
})
export class SearchableUserSelectComponent implements OnChanges {

  @Input()  users: SelectableUser[] = [];
  @Input()  placeholder = 'Rechercher un utilisateur...';
  @Output() userSelected = new EventEmitter<string | number>();

  searchTerm = '';
  isOpen = false;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // La liste est re-filtree a chaque fois
  }

  get filteredUsers(): SelectableUser[] {
    if (!this.searchTerm.trim()) return this.users;
    const t = this.searchTerm.toLowerCase();
    return this.users.filter(u =>
      u.firstname.toLowerCase().includes(t) ||
      u.lastname.toLowerCase().includes(t) ||
      (u.role && u.role.toLowerCase().includes(t))
    );
  }

  getInitials(u: SelectableUser): string {
    return ((u.firstname?.[0] || '') + (u.lastname?.[0] || '')).toUpperCase();
  }

  onFocus(): void {
    this.searchTerm = '';
    this.isOpen = true;
  }

  onInputChange(value: string): void {
    this.searchTerm = value;
    this.isOpen = true;
  }

  selectUser(user: SelectableUser, event: Event): void {
    event.stopPropagation();
    this.userSelected.emit(user.id);
    // Reset apres selection (pour permettre d'ajouter un autre)
    this.searchTerm = '';
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: Event): void {
    if (!this.el.nativeElement.contains(evt.target)) {
      this.isOpen = false;
      this.searchTerm = '';
    }
  }
}
