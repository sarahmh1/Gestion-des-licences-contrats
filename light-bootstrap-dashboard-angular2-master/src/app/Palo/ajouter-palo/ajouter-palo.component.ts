import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Palo } from 'app/Model/Palo';
import { PaloService } from 'app/Services/palo.service';
import { HttpEventType } from '@angular/common/http';
import { ClientService, Client } from '../../Services/client.service';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';

@Component({
  selector: 'app-ajouter-palo',
  templateUrl: './ajouter-palo.component.html',
  styleUrls: ['./ajouter-palo.component.scss']
})
export class AjouterPaloComponent implements OnInit, OnChanges {
  @Output() paloAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() paloToEdit: Palo | null = null;

  clients: Client[] = [];
  PaloForm!: FormGroup;
  isEditing = false;
  currentPaloId: number | null = null;
  
  // Variables pour l'upload de fichier
  selectedFile: File | null = null;
  uploadMessage: string | null = null;
  uploadSuccess = false;

  @ViewChild('clientSelect') clientSelect: SearchableClientSelectComponent | undefined;

  commandePasserParOptions = [
      { label: 'GI_TN', value: CommandePasserPar.GI_TN },
      { label: 'GI_FR', value: CommandePasserPar.GI_FR },
      { label: 'GI_CI', value: CommandePasserPar.GI_CI }
    ];
   constructor(
     private fb: FormBuilder,
     private router: Router,
     private paloService: PaloService,
    private clientService: ClientService) {}
 
   ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
     this.initializeForm();
   }

   ngOnChanges(changes: SimpleChanges): void {
     if (changes['paloToEdit'] && this.paloToEdit) {
       this.isEditing = true;
       this.currentPaloId = this.paloToEdit.paloId;
       if (this.PaloForm) {
         this.loadPaloIntoForm();
       }
     }
   }

   initializeForm(): void {
     this.PaloForm = this.fb.group({
       client: ['', Validators.required],
       nomDuBoitier: ['', Validators.required],
       numeroSerieBoitier: ['', Validators.required],
       dureeDeLicence: [''],
       nomDuContact: [''],
       commandePasserPar: ['', Validators.required],
       adresseEmailContact: [''],
       sousContrat: [false],
       mailAdmin: ['', [Validators.email]],
       ccMail: this.fb.array([this.fb.control('', [Validators.email])]),
       numero: ['', AppValidators.optionalPhone],
       remarque: [''],
       licences: this.fb.array([
         this.createLicenceGroup()
       ])
     });
     if (this.paloToEdit) {
       this.loadPaloIntoForm();
     }
     this.watchClientAutoFill();
   }

   private watchClientAutoFill(): void {
     this.PaloForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
       if (!selectedName) return;
       const found = this.clients.find(c => c.nomClient === selectedName);
       if (found) {
         this.PaloForm.patchValue({
           nomDuContact: found.nosVisAVis?.[0] || '',
           numero: found.numTel?.[0] || '',
           adresseEmailContact: found.adressesMail?.[0] || ''
         }, { emitEvent: false });
       }
     });
   }

   loadPaloIntoForm(): void {
     if (!this.paloToEdit) return;

     this.isEditing = true;
     this.currentPaloId = this.paloToEdit.paloId;

     this.PaloForm.patchValue({
       client: this.paloToEdit.client,
       nomDuBoitier: this.paloToEdit.nomDuBoitier,
       numeroSerieBoitier: this.paloToEdit.numeroSerieBoitier,
       dureeDeLicence: this.paloToEdit.dureeDeLicence,
       commandePasserPar: this.paloToEdit.commandePasserPar,
       nomDuContact: this.paloToEdit.nomDuContact,
       sousContrat: this.paloToEdit.sousContrat,
       adresseEmailContact: this.paloToEdit.adresseEmailContact,
       mailAdmin: this.paloToEdit.mailAdmin,
       numero: this.paloToEdit.numero,
       remarque: this.paloToEdit.remarque
     }, { emitEvent: false });

     // Set licences
     this.licences.clear();
     if (this.paloToEdit.licences && this.paloToEdit.licences.length > 0) {
       this.paloToEdit.licences.forEach(lic => {
         this.licences.push(this.fb.group({
           nomDesLicences: [lic.nomDesLicences, Validators.required],
           quantite: [lic.quantite, AppValidators.requiredQuantity],
           dateEx: [this.formatDate(lic.dateEx), Validators.required]
         }));
       });
     }

     this.setCcMail(this.paloToEdit.ccMail);
   }
 
   get ccMail(): FormArray {
     return this.PaloForm.get('ccMail') as FormArray;
   }
 
   get licences(): FormArray {
     return this.PaloForm.get('licences') as FormArray;
   }
 
   createLicenceGroup(): FormGroup {
     return this.fb.group({
       nomDesLicences: ['', Validators.required],
       quantite: ['', AppValidators.requiredQuantity],
       dateEx: ['', Validators.required]
     });
   }
 
   addLicence() {
     this.licences.push(this.createLicenceGroup());
   }
 
   removeLicence(index: number) {
     this.licences.removeAt(index);
   }
 
   addCcMail() {
     this.ccMail.push(this.fb.control('', [Validators.email]));
   }
 
   removeCcMail(index: number) {
     this.ccMail.removeAt(index);
   }
 
   setCcMail(ccMails: string[]) {
     const ccMailFormArray = this.PaloForm.get('ccMail') as FormArray;
     ccMailFormArray.clear();
     if (ccMails && ccMails.length > 0) {
       ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
     } else {
       ccMailFormArray.push(this.fb.control('', Validators.email));
     }
   }
 
   loadPalo(id: number) {
     this.paloService.getPaloById(id).subscribe(palo => {
       this.PaloForm.patchValue({
         client: palo.client,
         nomDuBoitier: palo.nomDuBoitier,
        numeroSerieBoitier: palo.numeroSerieBoitier,
         dureeDeLicence: palo.dureeDeLicence,
         commandePasserPar: palo.commandePasserPar,
         nomDuContact: palo.nomDuContact,
          sousContrat: palo.sousContrat,
         adresseEmailContact: palo.adresseEmailContact,
         mailAdmin: palo.mailAdmin,
         numero: palo.numero,
         remarque: palo.remarque
       });
 
       // Set licences (clear + patch)
       this.licences.clear();
       if (palo.licences && palo.licences.length > 0) {
         palo.licences.forEach(lic => {
           this.licences.push(this.fb.group({
             nomDesLicences: [lic.nomDesLicences, Validators.required],
             quantite: [lic.quantite, AppValidators.requiredQuantity],
             dateEx: [this.formatDate(lic.dateEx), Validators.required]
           }));
         });
       }
 
       this.setCcMail(palo.ccMail);
     });
   }
 
   formatDate(date: string | Date): string {
     const d = new Date(date);
     return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
   }
 
   addPalo() {
     if (!this.PaloForm.valid) {
       this.PaloForm.markAllAsTouched();
       return;
     }

     const paloData: Palo = {
         paloId: this.isEditing ? this.currentPaloId! : null!,
         client: this.PaloForm.value.client,
         nomDuBoitier: this.PaloForm.value.nomDuBoitier,
         numeroSerieBoitier: this.PaloForm.value.numeroSerieBoitier,
         dureeDeLicence: this.PaloForm.value.dureeDeLicence,
         commandePasserPar: this.PaloForm.value.commandePasserPar,
         nomDuContact: this.PaloForm.value.nomDuContact,
         adresseEmailContact: this.PaloForm.value.adresseEmailContact,
         mailAdmin: this.PaloForm.value.mailAdmin || '',
         ccMail: this.ccMail.value,
         sousContrat: this.PaloForm.value.sousContrat,
         numero: this.PaloForm.value.numero,
         approuve: this.isEditing ? this.paloToEdit?.approuve || false : false,
         remarque: this.PaloForm.value.remarque || '',
         licences: this.licences.value,
         fichier: this.isEditing ? this.paloToEdit?.fichier : undefined,
         fichierOriginalName: this.isEditing ? this.paloToEdit?.fichierOriginalName : undefined
       };
 
       if (this.isEditing) {
         this.paloService.updatePalo(paloData).subscribe(
           (response: any) => {
             console.log('Réponse serveur:', response);
             
             if (this.selectedFile && this.currentPaloId) {
               this.uploadFileAfterCreation(this.currentPaloId);
             } else {
               window.alert('Palo mis à jour avec succès');
               this.paloAdded.emit();
             }
           },
           error => {
             console.error('Erreur lors de la mise à jour du Palo', error);
             window.alert('Échec de la mise à jour');
           }
         );
       } else {
         this.paloService.addPalo(paloData).subscribe(
           (response: any) => {
             console.log('Réponse serveur:', response);
             
             if (this.selectedFile && response.paloId) {
               this.uploadFileAfterCreation(response.paloId);
             } else {
               window.alert('Palo ajouté avec succès');
               this.paloAdded.emit();
             }
           },
           error => {
             console.error('Erreur lors de l\'ajout du Palo', error);
             window.alert('Échec de l\'ajout');
           }
         );
       }
   }

   // ==================== GESTION DES FICHIERS ====================
  
   onFileSelected(event: any): void {
     const file: File = event.target.files[0];
     if (file) {
       this.selectedFile = file;
       this.uploadMessage = null;
     }
   }

   uploadFileAfterCreation(paloId: number): void {
     if (!this.selectedFile) {
       window.alert(this.isEditing ? 'Palo mis à jour avec succès' : 'Palo ajouté avec succès');
       this.paloAdded.emit();
       return;
     }

     this.paloService.uploadFile(paloId, this.selectedFile).subscribe({
       next: (event: any) => {
         if (event.type === HttpEventType.Response) {
           if (event.body.success) {
             this.uploadSuccess = true;
             this.uploadMessage = 'Fichier uploadé avec succès!';
             const message = this.isEditing ? 'Palo et fichier mis à jour avec succès' : 'Palo et fichier ajoutés avec succès';
             window.alert(message);
             this.paloAdded.emit();
           } else {
             this.uploadSuccess = false;
             this.uploadMessage = event.body.message || 'Erreur lors de l\'upload';
             const message = this.isEditing ? 'Palo mis à jour mais erreur lors de l\'upload du fichier' : 'Palo ajouté mais erreur lors de l\'upload du fichier';
             window.alert(message);
             this.paloAdded.emit();
           }
         }
       },
       error: (error) => {
         this.uploadSuccess = false;
         this.uploadMessage = 'Erreur lors de l\'upload: ' + (error.error?.message || error.message);
         console.error('Erreur upload:', error);
         const message = this.isEditing ? 'Palo mis à jour mais erreur lors de l\'upload du fichier: ' : 'Palo ajouté mais erreur lors de l\'upload du fichier: ';
         window.alert(message + this.uploadMessage);
         this.paloAdded.emit();
       }
     });
   }

   onCancel(): void {
     this.cancelled.emit();
   }

  resetForm(): void {
    if (this.isEditing && this.paloToEdit) {
      this.loadPaloIntoForm();
    } else {
      this.PaloForm.reset();
      this.licences.clear();
      this.licences.push(this.createLicenceGroup());
    }
    this.selectedFile = null;
    this.uploadMessage = null;
    this.uploadSuccess = false;
  }
}
 
