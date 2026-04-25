import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { MicrosoftO365 } from 'app/Model/MicrosoftO365';
import { MicrosoftO365Service } from 'app/Services/microsoft-o365.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-microsoftO365',
  templateUrl: './updatem.component.html',
  styleUrls: ['./updatem.component.scss']
})
export class UpdateMicrosoftComponent implements OnInit {
  clients: Client[] = [];
   updateForm!: FormGroup;
    microsoftO365Id!: number;
    microsoftO365!: MicrosoftO365;
    public Validators = Validators;
    currentFileName: string | null = null;
    currentFileOriginalName: string | null = null;
    commandePasserParOptions = [
            { label: 'GI_TN', value: CommandePasserPar.GI_TN },
            { label: 'GI_FR', value: CommandePasserPar.GI_FR },
            { label: 'GI_CI', value: CommandePasserPar.GI_CI }
          ];
  
    constructor(
      public fb: FormBuilder,
      private microsoftO365Service: MicrosoftO365Service,
      private route: ActivatedRoute,
      private router: Router,
    private clientService: ClientService) {}
  
    ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
      this.updateForm = this.fb.group({
        client: ['', Validators.required],
        dureeDeLicence: [''],
        nomDuContact: [''],
        adresseEmailContact: ['', [Validators.required, Validators.email]],
        mailAdmin: ['', Validators.email],
        commandePasserPar: ['', Validators.required],
        ccMail: this.fb.array([]),
        numero: [''],
        remarque: [''],
        sousContrat: [false],
        licences: this.fb.array([])  // ?? Ajout des licences dynamiques ici
      });
  
      this.microsoftO365Id = Number(this.route.snapshot.paramMap.get('id'));
      this.loadMicrosoft0365(this.microsoftO365Id);
    }
  
    get ccMail(): FormArray {
      return this.updateForm.get('ccMail') as FormArray;
    }
  
    get licences(): FormArray {
      return this.updateForm.get('licences') as FormArray;
    }
  
    createLicenceGroup(): FormGroup {
      return this.fb.group({
        nomDesLicences: ['', Validators.required],
        quantite: ['', Validators.required],
        dateEx: ['', Validators.required]
      });
    }
  
    addLicence(): void {
      this.licences.push(this.createLicenceGroup());
    }
  
    removeLicence(index: number): void {
      this.licences.removeAt(index);
    }
     // Fonction pour convertir la valeur en enum CommandePasserPar
  private getCommandePasserParValue(value: any): CommandePasserPar {
    if (!value) return CommandePasserPar.GI_TN; // Valeur par défaut
    
    const stringValue = String(value).toUpperCase().trim();
    
    switch (stringValue) {
      case 'GI_TN':
        return CommandePasserPar.GI_TN;
      case 'GI_FR':
        return CommandePasserPar.GI_FR;
      case 'GI_CI':
        return CommandePasserPar.GI_CI;
      default:
        console.warn('Valeur CommandePasserPar non reconnue:', value);
        return CommandePasserPar.GI_TN; // Valeur par défaut
    }
  }
  
    loadMicrosoft0365(id: number): void {
      this.microsoftO365Service.getMicrosoftO365ById(id).subscribe(
        (data: MicrosoftO365) => {
          this.microsoftO365 = data;
          this.currentFileName = data.fichier || null;
          this.currentFileOriginalName = data.fichierOriginalName || null;
  
          this.updateForm.patchValue({
            client: data.client ?? '',
            dureeDeLicence: data.dureeDeLicence ?? '',
            nomDuContact: data.nomDuContact ?? '',
            adresseEmailContact: data.adresseEmailContact ?? '',
            mailAdmin: data.mailAdmin ?? '',
            commandePasserPar: this.getCommandePasserParValue(data.commandePasserPar),
            numero: data.numero ?? '',
            remarque: data.remarque ?? '',
            sousContrat: data.sousContrat ?? false
          });
  
          // Remplir les licences
          this.licences.clear();
          if (data.licences && data.licences.length > 0) {
            data.licences.forEach(lic => {
              this.licences.push(this.fb.group({
                nomDesLicences: [lic.nomDesLicences, Validators.required],
                quantite: [lic.quantite, Validators.required],
                dateEx: [this.formatDate(lic.dateEx), Validators.required]
              }));
            });
          } else {
            this.addLicence();
          }
  
          // CC mails
          this.ccMail.clear();
          if (data.ccMail && data.ccMail.length > 0) {
            data.ccMail.forEach(email => {
              this.ccMail.push(this.fb.control(email, Validators.email));
            });
          } else {
            this.ccMail.push(this.fb.control('', Validators.email));
          }
        },
        error => {
          console.error('Erreur récupération MicrosoftO365:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateMicrosoftO365(): void {
  if (!this.microsoftO365Id) {
    console.error('Impossible de mettre à jour : ID manquant.');
    return;
  }

  if (this.updateForm.valid) {
    const updatedMicrosoftO365: MicrosoftO365 = {
      microsoftO365Id: this.microsoftO365Id,
      ...this.updateForm.value,
      fichier: this.currentFileName,
      fichierOriginalName: this.currentFileOriginalName
    };

    this.microsoftO365Service.updateMicrosoftO365(updatedMicrosoftO365).subscribe(
      () => {
        console.log('MicrosoftO365 mis à jour avec succès');
        this.router.navigate(['/Affichermicro']);
      },
      error => {
        console.error('Erreur mise à jour MicrosoftO365:', error);
      }
    );
  } else {
    console.error('Formulaire invalide', this.updateForm);
  }
}

  
    onSubmit(): void {
      this.updateMicrosoftO365();
    }
  
    onCancel(): void {
      this.router.navigate(['/Affichermicro']);
    }

    // File methods
    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.microsoftO365Service.uploadFile(this.microsoftO365Id, file).subscribe(
          (updatedMicrosoftO365) => {
            this.currentFileName = updatedMicrosoftO365.fichier || null;
            this.currentFileOriginalName = updatedMicrosoftO365.fichierOriginalName || null;
            window.alert('Fichier uploadé avec succès');
          },
          error => {
            console.error('Erreur upload fichier:', error);
            window.alert('Erreur lors de l\'upload du fichier');
          }
        );
      }
    }

    getFileDownloadUrl(): string {
      return this.microsoftO365Service.getFileDownloadUrl(this.microsoftO365Id);
    }

    deleteFile(): void {
      if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
        this.microsoftO365Service.deleteFile(this.microsoftO365Id).subscribe(
          () => {
            this.currentFileName = null;
            this.currentFileOriginalName = null;
            window.alert('Fichier supprimé avec succès');
          },
          error => {
            console.error('Erreur suppression fichier:', error);
            window.alert('Erreur lors de la suppression du fichier');
          }
        );
      }
    }
  }
  
