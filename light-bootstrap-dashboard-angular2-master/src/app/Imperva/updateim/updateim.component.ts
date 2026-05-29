import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Imperva } from 'app/Model/Imperva';
import { ImpervaService } from 'app/Services/imperva.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-imperva',
  templateUrl: './updateim.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateImpervaComponent implements OnInit {
  clients: Client[] = [];
   updateForm!: FormGroup;
    impervaId!: number;
    imperva!: Imperva;
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
      private impervaService: ImpervaService,
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
        numero: ['', AppValidators.optionalPhone],
        remarque: [''],
        sousContrat: [false],
        licences: this.fb.array([])  // ?? Ajout des licences dynamiques ici
      });
  
      this.impervaId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadImperva(this.impervaId);
    }
  
    get ccMail(): FormArray {
      return this.updateForm.get('ccMail') as FormArray;
    }
  
    get licences(): FormArray {
      return this.updateForm.get('licences') as FormArray;
    }
    // Fonction pour convertir la valeur en enum CommandePasserPar
  private getCommandePasserParValue(value: any): CommandePasserPar {
    if (!value) return CommandePasserPar.GI_TN; // Valeur par d�faut
    
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
        return CommandePasserPar.GI_TN; // Valeur par d�faut
    }
  }
    createLicenceGroup(): FormGroup {
      return this.fb.group({
        nomDesLicences: ['', Validators.required],
        quantite: ['', AppValidators.requiredQuantity],
        dateEx: ['', Validators.required]
      });
    }
  
    addLicence(): void {
      this.licences.push(this.createLicenceGroup());
    }
  
    removeLicence(index: number): void {
      this.licences.removeAt(index);
    }
  
    loadImperva(id: number): void {
      this.impervaService.getImpervaById(id).subscribe(
        (data: Imperva) => {
          this.imperva = data;
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
                quantite: [lic.quantite, AppValidators.requiredQuantity],
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
          console.error('Erreur r�cup�ration imperva:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateImperva(): void {
      if (!this.updateForm.valid) {
      this.updateForm.markAllAsTouched();
      return;
    }

            const updatedImperva: Imperva = {
          impervaId: this.impervaId,
          ...this.updateForm.value,
          fichier: this.currentFileName,
          fichierOriginalName: this.currentFileOriginalName
        };
  
        this.impervaService.updateImperva(updatedImperva).subscribe(
          () => {
            console.log('Imperva mis � jour avec succ�s');
            this.router.navigate(['/Afficherim']);
          },
          error => {
            console.error('Erreur mise � jour Imperva:', error);
          }
        );
      
    }
  
    onSubmit(): void {
      this.updateImperva();
    }
  
    onCancel(): void {
      this.router.navigate(['/Afficherim']);
    }

    // File methods
    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.impervaService.uploadFile(this.impervaId, file).subscribe(
          (updatedImperva) => {
            this.currentFileName = updatedImperva.fichier || null;
            this.currentFileOriginalName = updatedImperva.fichierOriginalName || null;
            window.alert('Fichier upload� avec succ�s');
          },
          error => {
            console.error('Erreur upload fichier:', error);
            window.alert('Erreur lors de l\'upload du fichier');
          }
        );
      }
    }

    getFileDownloadUrl(): string {
      return this.impervaService.getFileDownloadUrl(this.impervaId);
    }

    deleteFile(): void {
      if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
        this.impervaService.deleteFile(this.impervaId).subscribe(
          () => {
            this.currentFileName = null;
            this.currentFileOriginalName = null;
            window.alert('Fichier supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression fichier:', error);
            window.alert('Erreur lors de la suppression du fichier');
          }
        );
      }
    }
  }
  
