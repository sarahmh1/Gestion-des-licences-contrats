import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';
import { Veeam } from 'app/Model/Veeam';
import { VeeamService } from 'app/Services/veeam.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-ajouter-veeam',
  templateUrl: './ajoutervee.component.html',
  styleUrls: ['./ajoutervee.component.scss']
})
export class AjouterVeeComponent implements OnInit {
  @Output() veeamAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('clientSelect') clientSelect?: SearchableClientSelectComponent;

  clients: Client[] = [];
  veeamForm!: FormGroup;
  selectedFile: File | null = null;
  commandePasserParOptions = [
    { label: 'GI_TN', value: 'GI_TN' },
    { label: 'GI_FR', value: 'GI_FR' },
    { label: 'GI_CI', value: 'GI_CI' }
  ];
   constructor(
     private fb: FormBuilder,
     private router: Router,
     private veeamService: VeeamService,
    private clientService: ClientService) {}
 
  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.veeamForm = this.fb.group({
      client: ['', Validators.required],
      dureeDeLicence: ['', Validators.required],
      nomDuContact: [''],
      adresseEmailContact: ['', Validators.email],
      sousContrat: [false],
      mailAdmin: ['', Validators.email],
      ccMail: this.fb.array([this.fb.control('')]),
      commandePasserPar: ['GI_TN', Validators.required],
      numero: ['', AppValidators.optionalPhone],
      remarque: [''],
      licences: this.fb.array([this.createLicenceGroup()])
    });
    this.watchClientAutoFill();
  }

  private watchClientAutoFill(): void {
    this.veeamForm.get('client')!.valueChanges.subscribe((selectedName: string) => {
      if (!selectedName) return;
      const found = this.clients.find(c => c.nomClient === selectedName);
      if (found) {
        this.veeamForm.patchValue({
          nomDuContact: found.nosVisAVis?.[0] || '',
          numero: found.numTel?.[0] || '',
          adresseEmailContact: found.adressesMail?.[0] || ''
        }, { emitEvent: false });
      }
    });
  }
 
   get ccMail(): FormArray {
     return this.veeamForm.get('ccMail') as FormArray;
   }
 
   get licences(): FormArray {
     return this.veeamForm.get('licences') as FormArray;
   }
 
   createLicenceGroup(): FormGroup {
     return this.fb.group({
       nomDesLicences: ['', Validators.required],
       quantite: ['', AppValidators.requiredQuantity],
       dateEx: ['']
     });
   }
 
   addLicence() {
     this.licences.push(this.createLicenceGroup());
   }
 
   removeLicence(index: number) {
     this.licences.removeAt(index);
   }
 
  addCcMail(): void {
    this.ccMail.push(this.fb.control(''));
  }
 
   removeCcMail(index: number) {
     this.ccMail.removeAt(index);
   }

   onFileSelected(event: any): void {
     const file = event.target.files[0];
     if (file) {
       this.selectedFile = file;
     }
   }
 
   setCcMail(ccMails: string[]) {
     const ccMailFormArray = this.veeamForm.get('ccMail') as FormArray;
     ccMailFormArray.clear();
     if (ccMails && ccMails.length > 0) {
      ccMails.forEach(email => ccMailFormArray.push(this.fb.control(email, Validators.email)));
    } else {
      ccMailFormArray.push(this.fb.control(''));
    }
   }
 
   loadVeeam(id: number) {
     this.veeamService.getVeeamById(id).subscribe(veeam => {
       this.veeamForm.patchValue({
         client: veeam.client,
         dureeDeLicence: veeam.dureeDeLicence,
         nomDuContact: veeam.nomDuContact,
         sousContrat: veeam.sousContrat,
         commandePasserPar: veeam.commandePasserPar,
         adresseEmailContact: veeam.adresseEmailContact,
         mailAdmin: veeam.mailAdmin,
         numero: veeam.numero,
         remarque: veeam.remarque
       });
 
       // Set licences (clear + patch)
       this.licences.clear();
       if (veeam.licences && veeam.licences.length > 0) {
         veeam.licences.forEach(lic => {
           this.licences.push(this.fb.group({
             nomDesLicences: [lic.nomDesLicences, Validators.required],
             quantite: [lic.quantite, AppValidators.requiredQuantity],
             dateEx: [this.formatDate(lic.dateEx)]
           }));
         });
       }
 
       this.setCcMail(veeam.ccMail);
     });
   }
 
   formatDate(date: string | Date): string {
     const d = new Date(date);
     return d.toISOString().substring(0, 10); // 'yyyy-MM-dd'
   }
 
   addVeeam() {
     if (!this.veeamForm.valid) {
       this.veeamForm.markAllAsTouched();
       return;
     }

     const newVeeam: Veeam = {
         veeamId: null!,
         client: this.veeamForm.value.client,
         dureeDeLicence: this.veeamForm.value.dureeDeLicence,
         nomDuContact: this.veeamForm.value.nomDuContact,
         commandePasserPar: this.veeamForm.value.commandePasserPar,
         adresseEmailContact: this.veeamForm.value.adresseEmailContact,
         mailAdmin: this.veeamForm.value.mailAdmin || '',
         ccMail: (this.ccMail.value as string[]).filter((e: string) => e && String(e).trim()),
         sousContrat: this.veeamForm.value.sousContrat,
         numero: this.veeamForm.value.numero,
         approuve: false,
         remarque: this.veeamForm.value.remarque || '',
         licences: this.licences.value
       };
 
       this.veeamService.addVeeam(newVeeam).subscribe(
         (response: any) => {
           // Si un fichier a été sélectionné, l'uploader après la création
           if (this.selectedFile && response.veeamId) {
             this.veeamService.uploadFile(response.veeamId, this.selectedFile).subscribe(
               () => {
                 window.alert('Veeam ajouté avec fichier avec succès');
                 this.veeamAdded.emit();
               },
               (uploadError) => {
                 console.error('Erreur lors de l\'upload du fichier', uploadError);
                 window.alert('Veeam ajouté mais erreur lors de l\'upload du fichier');
                 this.veeamAdded.emit();
               }
             );
           } else {
             window.alert('Veeam ajouté avec succès');
             this.veeamAdded.emit();
           }
         },
         error => {
           console.error('Erreur lors de l\'ajout du Veeam', error);
           window.alert('Échec de l\'ajout');
         }
       );
   }
   onCancel(): void {
     this.cancelled.emit();
   }

   closeClientDropdown(): void {
     this.clientSelect?.closeDropdown();
   }
 }
 
