import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { SentineIOne } from 'app/Model/SentineIOne';
import { SentineIOneService } from 'app/Services/sentineIOne.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-sentineIOne',
  templateUrl: './updates.component.html',
  styleUrls: ['./updates.component.scss']
})
export class UpdateSentineIOneComponent implements OnInit {
  clients: Client[] = [];
   updateForm!: FormGroup;
    sentineIOneId!: number;
    sentineIOne!: SentineIOne;
    selectedFile: File | null = null;
    public Validators = Validators;
   commandePasserParOptions = [
          { label: 'GI_TN', value: CommandePasserPar.GI_TN },
          { label: 'GI_FR', value: CommandePasserPar.GI_FR },
          { label: 'GI_CI', value: CommandePasserPar.GI_CI }
        ];
    constructor(
      public fb: FormBuilder,
      private sentineIOneService: SentineIOneService,
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
        adresseEmailContact: ['', [Validators.required, Validators.email]],
        mailAdmin: ['', Validators.email],
        commandePasserPar: ['', Validators.required],
        ccMail: this.fb.array([]),
        numero: [''],
        remarque: [''],
        sousContrat: [false],
        licences: this.fb.array([])  // ?? Ajout des licences dynamiques ici
      });
  
      this.sentineIOneId = Number(this.route.snapshot.paramMap.get('id'));
      this.loadSentineIOne(this.sentineIOneId);
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
  
    loadSentineIOne(id: number): void {
      this.sentineIOneService.getSentineIOneById(id).subscribe(
        (data: SentineIOne) => {
          this.sentineIOne = data;
  
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
          console.error('Erreur récupération SentineIOne:', error);
        }
      );
    }
  
    formatDate(date: string | Date): string {
      const d = new Date(date);
      return d.toISOString().substring(0, 10); // yyyy-MM-dd
    }
  
    updateSentineIOne(): void {
      if (this.updateForm.valid) {
        const updatedSentineIOne:SentineIOne = {
          sentineIOneId: this.sentineIOneId,
          ...this.updateForm.value,
          fichier: this.sentineIOne.fichier,
          fichierOriginalName: this.sentineIOne.fichierOriginalName
        };
  
        this.sentineIOneService.updateSentineIOne(updatedSentineIOne).subscribe(
          () => {
            console.log('SentineIOne mis à jour avec succès');
            this.router.navigate(['/Affichers']);
          },
          error => {
            console.error('Erreur mise à jour SentineIOne:', error);
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
        // Upload immédiat du fichier
        this.sentineIOneService.uploadFile(this.sentineIOneId, file).subscribe(
          (response: SentineIOne) => {
            this.sentineIOne.fichier = response.fichier;
            this.sentineIOne.fichierOriginalName = response.fichierOriginalName;
            this.selectedFile = null;
            this.cdr.detectChanges();
            window.alert('Fichier uploadé avec succès');
          },
          (error) => {
            console.error('Erreur upload fichier:', error);
            window.alert('Erreur lors de l\'upload du fichier');
          }
        );
      }
    }

    deleteFile(): void {
      if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
        this.sentineIOneService.deleteFile(this.sentineIOneId).subscribe(
          (response: SentineIOne) => {
            this.sentineIOne.fichier = undefined;
            this.sentineIOne.fichierOriginalName = undefined;
            this.cdr.detectChanges();
            window.alert('Fichier supprimé avec succès');
          },
          (error) => {
            console.error('Erreur suppression fichier:', error);
            window.alert('Erreur lors de la suppression du fichier');
          }
        );
      }
    }

    getFileDownloadUrl(): string {
      return this.sentineIOneService.getFileDownloadUrl(this.sentineIOneId);
    }
  
    onSubmit(): void {
      this.updateSentineIOne();
    }
  
    onCancel(): void {
      this.router.navigate(['/Affichers']);
    }
  }
  
