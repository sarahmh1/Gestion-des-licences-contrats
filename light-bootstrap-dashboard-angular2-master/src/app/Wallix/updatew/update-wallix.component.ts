import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Wallix } from 'app/Model/Wallix';
import { WallixService } from 'app/Services/wallix.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-wallix',
  templateUrl: './update-wallix.component.html',
  styleUrls: ['./update-wallix.component.scss']
})
export class UpdateWallixComponent implements OnInit {
  clients: Client[] = [];
 updateForm!: FormGroup;
    wallixId!: number;
    wallix!: Wallix;
    selectedFile: File | null = null;
    public Validators = Validators;
  commandePasserParOptions = [
          { label: 'GI_TN', value: CommandePasserPar.GI_TN },
          { label: 'GI_FR', value: CommandePasserPar.GI_FR },
          { label: 'GI_CI', value: CommandePasserPar.GI_CI }
        ];
    constructor(
      public fb: FormBuilder,
      private wallixService: WallixService,
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
        adresseEmailContact: [''],
        mailAdmin: ['', Validators.email],
        commandePasserPar: ['', Validators.required],
        ccMail: this.fb.array([]),
        numero: ['', AppValidators.optionalPhone],
        remarque: [''],
        sousContrat: [false],
        licences: this.fb.array([])  // ?? Ajout des licences dynamiques ici
      });
  
      this.wallixId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadWallix(this.wallixId);
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
  
    loadWallix(id: number): void {
      this.wallixService.getWallixById(id).subscribe(
        (data: Wallix) => {
          this.wallix = data;
  
          this.updateForm.patchValue({
            client: data.client ?? '',
            dureeDeLicence: data.dureeDeLicence ?? '',
            nomDuContact: data.nomDuContact ?? '',
            commandePasserPar: this.getCommandePasserParValue(data.commandePasserPar),
            adresseEmailContact: data.adresseEmailContact ?? '',
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
          console.error('Erreur r�cup�ration Wallix:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateWallix(): void {
      if (!this.updateForm.valid) {
      this.updateForm.markAllAsTouched();
      return;
    }

            const updatedWallix: Wallix = {
          wallixId: this.wallixId,
          ...this.updateForm.value,
          fichier: this.wallix?.fichier,
          fichierOriginalName: this.wallix?.fichierOriginalName
        };
  
        this.wallixService.updateWallix(updatedWallix).subscribe(
          () => {
            console.log('wallix mis � jour avec succ�s');
            this.router.navigate(['/Afficherwallix']);
          },
          error => {
            console.error('Erreur mise � jour wallix:', error);
          }
        );
      
    }

    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.wallixService.uploadFile(this.wallixId, file).subscribe(
          (response) => {
            this.wallix.fichier = response.fichier;
            this.wallix.fichierOriginalName = response.fichierOriginalName;
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
      return this.wallixService.getFileDownloadUrlById(this.wallixId);
    }

    deleteFile(): void {
      if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
        this.wallixService.deleteFile(this.wallixId).subscribe(
          () => {
            this.wallix.fichier = undefined;
            this.wallix.fichierOriginalName = undefined;
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
      this.updateWallix();
    }
  
    onCancel(): void {
      this.router.navigate(['/Afficherwallix']);
    }
  }
  
