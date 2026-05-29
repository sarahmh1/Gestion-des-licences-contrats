import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-modal',
  templateUrl: './confirm-delete-modal.component.html',
  styleUrls: ['./confirm-delete-modal.component.scss']
})
export class ConfirmDeleteModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirmer la suppression';
  @Input() message = 'Êtes-vous sûr de vouloir supprimer cet élément ?';
  @Input() detail = '';
  @Input() canConfirm = true;
  @Input() confirmLabel = 'Supprimer';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  onOverlayClick(): void { this.cancel.emit(); }
  onConfirm(): void { this.confirm.emit(); }
  onCancel(): void { this.cancel.emit(); }
}
