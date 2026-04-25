
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Alwarebytes } from 'app/Model/Alwarebytes';
import { AlwarebytesService } from 'app/Services/alwarebytes.service';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-alwarebytes',
  templateUrl: './updatea.component.html',
  styleUrls: ['./updatea.component.scss']
})
export class UpdateAlwarebytesComponent implements OnInit {
  clients: Client[] = [];
  updateForm!: FormGroup;
  alwarebytesId!: number;
  alwarebytes!: Alwarebytes;
  public Validators = Validators;
  selectedFile: File | null = null;
  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    public fb: FormBuilder,
    private alwarebytesService: AlwarebytesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private clientService: ClientService) { }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Upload immédiat du fichier
      this.alwarebytesService.uploadFile(this.alwarebytesId, file).subscribe(
        (response: Alwarebytes) => {
          this.alwarebytes.fichier = response.fichier;
          this.alwarebytes.fichierOriginalName = response.fichierOriginalName;
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
      this.alwarebytesService.deleteFile(this.alwarebytesId).subscribe(
        (response: Alwarebytes) => {
          this.alwarebytes.fichier = undefined;
          this.alwarebytes.fichierOriginalName = undefined;
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
    return this.alwarebytesService.getFileDownloadUrl(this.alwarebytesId);
  }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.updateForm = this.fb.group({
      client: ['', Validators.required],
      dureeDeLicence: [''],
      nomDuContact: [''],
      commandePasserPar: ['', Validators.required],
      adresseEmailContact: [''],
      mailAdmin: ['', Validators.email],
      ccMail: this.fb.array([]),
      numero: [''],
      remarque: [''],
      sousContrat: [false],
      licences: this.fb.array([])  // ?? Ajout des licences dynamiques ici
    });

    this.alwarebytesId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAlwarebytes(this.alwarebytesId);
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

  loadAlwarebytes(id: number): void {
    this.alwarebytesService.getAlwarebytesById(id).subscribe(
      (data: Alwarebytes) => {
        this.alwarebytes = data;

        this.updateForm.patchValue({
          client: data.client ?? '',
          dureeDeLicence: data.dureeDeLicence ?? '',
          nomDuContact: data.nomDuContact ?? '',
          adresseEmailContact: data.adresseEmailContact ?? '',
          mailAdmin: data.mailAdmin ?? '',
          numero: data.numero ?? '',
          commandePasserPar: data.commandePasserPar ?? '',
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
        console.error('Erreur récupération alwarebytes:', error);
      }
    );
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().substring(0, 10); // yyyy-MM-dd
  }

  updateAlwarebytes(): void {
    if (this.updateForm.valid) {
      const updatedAlwarebytes: Alwarebytes = {
        alwarebytesId: this.alwarebytesId,
        ...this.updateForm.value,
        // Préserver les champs fichier
        fichier: this.alwarebytes?.fichier,
        fichierOriginalName: this.alwarebytes?.fichierOriginalName
      };

      this.alwarebytesService.updateAlwarebytes(updatedAlwarebytes).subscribe(
        () => {
          console.log('Alwarebytes mis à jour avec succès');
          this.router.navigate(['/Affichera']);
        },
        error => {
          console.error('Erreur mise à jour Alwarebytes:', error);
        }
      );
    } else {
      console.error('Formulaire invalide', this.updateForm);
    }
  }

  onSubmit(): void {
    this.updateAlwarebytes();
  }

  onCancel(): void {
    this.router.navigate(['/Affichera']);
  }
}
