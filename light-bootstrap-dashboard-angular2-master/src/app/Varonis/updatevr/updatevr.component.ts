import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Varonis } from 'app/Model/Varonis';
import { VaronisService } from 'app/Services/varonis.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-varonis',
  templateUrl: './updatevr.component.html',
  styleUrls: ['./updatevr.component.scss']
})
export class UpdateVaronisComponent implements OnInit {
  clients: Client[] = [];
   updateForm!: FormGroup;
    varonisId!: number;
    varonis!: Varonis;
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
      private varonisService: VaronisService,
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
  
      this.varonisId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadVaronis(this.varonisId);
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
    addLicence(): void {
      this.licences.push(this.createLicenceGroup());
    }
  
    removeLicence(index: number): void {
      this.licences.removeAt(index);
    }
  
    loadVaronis(id: number): void {
      this.varonisService.getVaronisById(id).subscribe(
        (data: Varonis) => {
          this.varonis = data;
          this.currentFileName = data.fichier || null;
          this.currentFileOriginalName = data.fichierOriginalName || null;
  
          this.updateForm.patchValue({
            client: data.client ?? '',
            dureeDeLicence: data.dureeDeLicence ?? '',
            nomDuContact: data.nomDuContact ?? '',
            adresseEmailContact: data.adresseEmailContact ?? '',
            commandePasserPar: this.getCommandePasserParValue(data.commandePasserPar),
            mailAdmin: data.mailAdmin ?? '',
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
          console.error('Erreur récupération varonis:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateVaronis(): void {
      if (this.updateForm.valid) {
        const updatedVaronis: Varonis = {
          varonisId: this.varonisId,
          ...this.updateForm.value,
          fichier: this.currentFileName,
          fichierOriginalName: this.currentFileOriginalName
        };
  
        this.varonisService.updateVaronis(updatedVaronis).subscribe(
          () => {
            console.log('Varonis mis à jour avec succès');
            this.router.navigate(['/Affichervr']);
          },
          error => {
            console.error('Erreur mise à jour Varonis:', error);
          }
        );
      } else {
        console.error('Formulaire invalide', this.updateForm);
      }
    }
  
    onSubmit(): void {
      this.updateVaronis();
    }
  
    onCancel(): void {
      this.router.navigate(['/Affichervr']);
    }

    // File methods
    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.varonisService.uploadFile(this.varonisId, file).subscribe(
          (updatedVaronis) => {
            this.currentFileName = updatedVaronis.fichier || null;
            this.currentFileOriginalName = updatedVaronis.fichierOriginalName || null;
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
      return this.varonisService.getFileDownloadUrl(this.varonisId);
    }

    deleteFile(): void {
      if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
        this.varonisService.deleteFile(this.varonisId).subscribe(
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
  
