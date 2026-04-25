import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Infoblox } from 'app/Model/Infoblox';
import { InfobloxService } from 'app/Services/infoblox.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-infoblox',
  templateUrl: './updatei.component.html',
  styleUrls: ['./updatei.component.scss']
})
export class UpdateInfobloxComponent implements OnInit {
  clients: Client[] = [];
   updateForm!: FormGroup;
    infobloxId!: number;
    infoblox!: Infoblox;
    selectedFile: File | null = null;
    currentFileName: string | null = null;
    currentFileOriginalName: string | null = null;
    public Validators = Validators;
     commandePasserParOptions = [
            { label: 'GI_TN', value: CommandePasserPar.GI_TN },
            { label: 'GI_FR', value: CommandePasserPar.GI_FR },
            { label: 'GI_CI', value: CommandePasserPar.GI_CI }
          ];
  
    constructor(
      public fb: FormBuilder,
      private infobloxService: InfobloxService,
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
  
      this.infobloxId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadInfoblox(this.infobloxId);
    }
  
    get ccMail(): FormArray {
      return this.updateForm.get('ccMail') as FormArray;
    }
  
    get licences(): FormArray {
      return this.updateForm.get('licences') as FormArray;
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
  
    loadInfoblox(id: number): void {
      this.infobloxService.getInfobloxById(id).subscribe(
        (data: Infoblox) => {
          this.infoblox = data;
  
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

          // Charger le nom du fichier existant
          if (data.fichier) {
            this.currentFileName = data.fichier;
            this.currentFileOriginalName = data.fichierOriginalName || data.fichier;
          }
  
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
          console.error('Erreur récupération infoblox:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateInfoblox(): void {
      if (this.updateForm.valid) {
        const updatedInfoblox: Infoblox = {
          infobloxId: this.infobloxId,
          ...this.updateForm.value,
          // Préserver les champs fichier
          fichier: this.infoblox?.fichier,
          fichierOriginalName: this.infoblox?.fichierOriginalName
        };
  
        this.infobloxService.updateInfoblox(updatedInfoblox).subscribe(
          () => {
            // Si un nouveau fichier est sélectionné, l'uploader
            if (this.selectedFile) {
              this.infobloxService.uploadFile(this.infobloxId, this.selectedFile).subscribe(
                () => {
                  console.log('Infoblox et fichier mis à jour avec succès');
                  this.router.navigate(['/Afficheri']);
                },
                error => {
                  console.error('Erreur upload fichier:', error);
                  this.router.navigate(['/Afficheri']);
                }
              );
            } else {
              console.log('Infoblox mis à jour avec succès');
              this.router.navigate(['/Afficheri']);
            }
          },
          error => {
            console.error('Erreur mise à jour infoblox:', error);
          }
        );
      } else {
        console.error('Formulaire invalide', this.updateForm);
      }
    }

    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      }
    }

    deleteFile(): void {
      if (confirm('Voulez-vous supprimer ce fichier ?')) {
        this.infobloxService.deleteFile(this.infobloxId).subscribe(
          () => {
            this.currentFileName = null;
            this.currentFileOriginalName = null;
            this.infoblox.fichier = undefined;
            this.infoblox.fichierOriginalName = undefined;
            alert('Fichier supprimé avec succès');
          },
          error => {
            console.error('Erreur suppression fichier:', error);
            alert('Erreur lors de la suppression du fichier');
          }
        );
      }
    }

    getFileDownloadUrl(): string {
      return this.infobloxService.getFileDownloadUrl(this.infobloxId);
    }

    downloadFile(): void {
      if (this.currentFileName && this.infobloxId) {
        const url = this.infobloxService.getFileDownloadUrl(this.infobloxId);
        window.open(url, '_blank');
      }
    }
  
    onSubmit(): void {
      this.updateInfoblox();
    }
  
    onCancel(): void {
      this.router.navigate(['/Afficheri']);
    }
  }
  
