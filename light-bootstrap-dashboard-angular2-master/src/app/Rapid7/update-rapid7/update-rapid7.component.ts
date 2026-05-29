import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Rapid7 } from 'app/Model/Rapid7';
import { Rapid7Service } from 'app/Services/rapid7.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-rapid7',
  templateUrl: './update-rapid7.component.html',
  styleUrls: ['./update-rapid7.component.scss']
})
export class UpdateRapid7Component implements OnInit {
  clients: Client[] = [];
 updateForm!: FormGroup;
    rapid7Id!: number;
    rapid7!: Rapid7;
    selectedFile: File | null = null;
    public Validators = Validators;
    commandePasserParOptions = [
            { label: 'GI_TN', value: CommandePasserPar.GI_TN },
            { label: 'GI_FR', value: CommandePasserPar.GI_FR },
            { label: 'GI_CI', value: CommandePasserPar.GI_CI }
          ];
  
    constructor(
      public fb: FormBuilder,
      private  rapid7Service: Rapid7Service,
      private route: ActivatedRoute,
      private router: Router,
      private cdr: ChangeDetectorRef,
    private clientService: ClientService) {}
  
    ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
      this.updateForm = this.fb.group({
        client: ['', Validators.required],
        dureeDeLicence: [''],
        nomDuContact: [''],
        cleLicences: [''],
        commandePasserPar: ['', Validators.required],
        adresseEmailContact: ['', [Validators.required, Validators.email]],
        mailAdmin: ['', Validators.email],
        ccMail: this.fb.array([]),
        numero: ['', AppValidators.optionalPhone],
        remarque: [''],
        sousContrat: [false],
        licences: this.fb.array([])  // ?? Ajout des licences dynamiques ici
      });
  
      this. rapid7Id = Number(this.route.snapshot.paramMap.get('id'));
      this.loadRapid7(this. rapid7Id);
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
  
    loadRapid7(id: number): void {
      this.rapid7Service.getRapid7ById(id).subscribe(
        (data: Rapid7) => {
          this.rapid7 = data;
  
          this.updateForm.patchValue({
            client: data.client ?? '',
            cleLicences: data.client ?? '',
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
          console.error('Erreur r�cup�ration Rapid7:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateRapid7(): void {
      if (!this.updateForm.valid) {
      this.updateForm.markAllAsTouched();
      return;
    }

            const updatedRapid7: Rapid7 = {
          rapid7Id: this.rapid7Id,
          ...this.updateForm.value,
          fichier: this.rapid7?.fichier,
          fichierOriginalName: this.rapid7?.fichierOriginalName
        };
  
        this. rapid7Service.updateRapid7(updatedRapid7).subscribe(
          () => {
            console.log('Rapid7 mis � jour avec succ�s');
            this.router.navigate(['/Afficherrapid7']);
          },
          error => {
            console.error('Erreur mise � jour Rapid7:', error);
          }
        );
      
    }

    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.rapid7Service.uploadFile(this.rapid7Id, file).subscribe(
          (response) => {
            this.rapid7.fichier = response.fichier;
            this.rapid7.fichierOriginalName = response.fichierOriginalName;
            this.cdr.detectChanges();
            window.alert('Fichier upload� avec succ�s');
          },
          (error) => {
            console.error('Erreur upload fichier', error);
            window.alert('�chec de l\'upload du fichier');
          }
        );
      }
    }

    getFileDownloadUrl(): string {
      return this.rapid7Service.getFileDownloadUrlById(this.rapid7Id);
    }

    deleteFile(): void {
      if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
        this.rapid7Service.deleteFile(this.rapid7Id).subscribe(
          () => {
            this.rapid7.fichier = undefined;
            this.rapid7.fichierOriginalName = undefined;
            this.cdr.detectChanges();
            window.alert('Fichier supprim�');
          },
          (error) => {
            console.error('Erreur suppression fichier', error);
            window.alert('�chec de la suppression');
          }
        );
      }
    }
  
    onSubmit(): void {
      this.updateRapid7();
    }
  
    onCancel(): void {
      this.router.navigate(['/Afficherrapid7']);
    }
  }
  
