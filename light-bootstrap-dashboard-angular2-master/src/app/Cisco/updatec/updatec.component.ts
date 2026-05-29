import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { Cisco } from 'app/Model/Cisco';
import { CiscoService } from 'app/Services/cisco.service';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-cisco',
  templateUrl: './updatec.component.html',
  styleUrls: ['./updatec.component.scss']
})
export class UpdateCiscoComponent implements OnInit {
  clients: Client[] = [];
   updateForm!: FormGroup;
    ciscoId!: number;
    cisco!: Cisco;
    public Validators = Validators;
    currentFileName: string | null = null;
    currentFileOriginalName: string | null = null;
    selectedFile: File | null = null;
    commandePasserParOptions = [
        { label: 'GI_TN', value: CommandePasserPar.GI_TN },
        { label: 'GI_FR', value: CommandePasserPar.GI_FR },
        { label: 'GI_CI', value: CommandePasserPar.GI_CI }
      ];
  
    constructor(
      public fb: FormBuilder,
      private ciscoService: CiscoService,
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
  
      this.ciscoId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadCisco(this.ciscoId);
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

    loadCisco(id: number): void {
      this.ciscoService.getCiscoById(id).subscribe(
        (data: Cisco) => {
          this.cisco = data;
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
          console.error('Erreur r�cup�ration cisco:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateCisco(): void {
      if (!this.updateForm.valid) {
      this.updateForm.markAllAsTouched();
      return;
    }

            const updatedCisco: Cisco = {
          ciscoId: this.ciscoId,
          ...this.updateForm.value,
          fichier: this.currentFileName,
          fichierOriginalName: this.currentFileOriginalName
        };
  
        this.ciscoService.updateCisco(updatedCisco).subscribe(
          () => {
            console.log('Cisco mis � jour avec succ�s');
            this.router.navigate(['/Afficherc']);
          },
          error => {
            console.error('Erreur mise � jour Cisco:', error);
          }
        );
      
    }
  
    onSubmit(): void {
      this.updateCisco();
    }
  
    onCancel(): void {
      this.router.navigate(['/Afficherc']);
    }

    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      }
    }

    uploadFile(): void {
      if (this.selectedFile) {
        this.ciscoService.uploadFile(this.ciscoId, this.selectedFile).subscribe(
          (response) => {
            this.currentFileName = response.fichier || null;
            this.currentFileOriginalName = response.fichierOriginalName || null;
            this.selectedFile = null;
            window.alert('Fichier upload� avec succ�s');
          },
          (error) => {
            console.error('Erreur upload fichier:', error);
            window.alert('�chec de l\'upload du fichier');
          }
        );
      }
    }

    deleteFile(): void {
      if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
        this.ciscoService.deleteFile(this.ciscoId).subscribe(
          () => {
            this.currentFileName = null;
            this.currentFileOriginalName = null;
            window.alert('Fichier supprim� avec succ�s');
          },
          (error) => {
            console.error('Erreur suppression fichier:', error);
            window.alert('�chec de la suppression du fichier');
          }
        );
      }
    }

    getFileDownloadUrl(): string {
      return this.ciscoService.getFileDownloadUrl(this.ciscoId);
    }
  }
  
