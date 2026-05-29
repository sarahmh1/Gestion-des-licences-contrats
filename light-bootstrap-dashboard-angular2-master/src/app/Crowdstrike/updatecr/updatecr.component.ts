import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandePasserPar } from 'app/Model/CommandePasserPar';
import { Crowdstrike } from 'app/Model/Crowdstrike';
import { CrowdstrikeService } from 'app/Services/crowdstrike.service';
import { ClientService, Client } from '../../Services/client.service';

@Component({
  selector: 'app-update-crowdstrike',
  templateUrl: './updatecr.component.html',
  styleUrls: ['./updatecr.component.scss']
})
export class UpdateCrowdstrikeComponent implements OnInit {
  clients: Client[] = [];
  updateForm!: FormGroup;
  crowdstrikeid!: number;
  crowdstrike!: Crowdstrike;
  selectedFile: File | null = null;
  public Validators = Validators;
  commandePasserParOptions = [
    { label: 'GI_TN', value: CommandePasserPar.GI_TN },
    { label: 'GI_FR', value: CommandePasserPar.GI_FR },
    { label: 'GI_CI', value: CommandePasserPar.GI_CI }
  ];

  constructor(
    public fb: FormBuilder,
    private crowdstrikeService: CrowdstrikeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.updateForm = this.fb.group({
      client: ['', Validators.required],
      dureeLicence: [''],
      nomDuContact: [''],
      adresseEmailContact: ['', [Validators.required, Validators.email]],
      mailAdmin: ['', Validators.email],
      ccMail: this.fb.array([]),
      commandePasserPar: ['', Validators.required],
      numero: ['', AppValidators.optionalPhone],
      remarques: [''],
      sousContrat: [false],
      licences: this.fb.array([])
    });

    this.crowdstrikeid = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCrowdstrike(this.crowdstrikeid);
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

  loadCrowdstrike(id: number): void {
    this.crowdstrikeService.getCrowdstrikeById(id).subscribe(
      (data: Crowdstrike) => {
        this.crowdstrike = data;

        this.updateForm.patchValue({
          client: data.client ?? '',
          dureeLicence: data.dureeLicence ?? '',
          nomDuContact: data.nomDuContact ?? '',
          commandePasserPar: this.getCommandePasserParValue(data.commandePasserPar),
          adresseEmailContact: data.adresseEmailContact ?? '',
          mailAdmin: data.mailAdmin ?? '',
          numero: data.numero ?? '',
          remarques: data.remarques ?? '',
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
        console.error('Erreur r�cup�ration CrowdStrike:', error);
      }
    );
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().substring(0, 10); // yyyy-MM-dd
  }

  updateCrowdstrike(): void {
    if (!this.updateForm.valid) {
      this.updateForm.markAllAsTouched();
      return;
    }

          const updatedCrowdstrike: Crowdstrike = {
        crowdstrikeid: this.crowdstrikeid,
        ...this.updateForm.value,
        fichier: this.crowdstrike?.fichier,
        fichierOriginalName: this.crowdstrike?.fichierOriginalName
      };

      this.crowdstrikeService.updateCrowdstrike(updatedCrowdstrike).subscribe(
        () => {
          console.log('CrowdStrike mis � jour avec succ�s');
          this.router.navigate(['/AfficherCrowsdstrike']);
        },
        error => {
          console.error('Erreur mise � jour CrowdStrike:', error);
        }
      );
    
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.crowdstrikeService.uploadFile(this.crowdstrikeid, file).subscribe(
        (response) => {
          this.crowdstrike.fichier = response.fichier;
          this.crowdstrike.fichierOriginalName = response.fichierOriginalName;
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
    return this.crowdstrikeService.getFileDownloadUrlById(this.crowdstrikeid);
  }

  deleteFile(): void {
    if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
      this.crowdstrikeService.deleteFile(this.crowdstrikeid).subscribe(
        () => {
          this.crowdstrike.fichier = undefined;
          this.crowdstrike.fichierOriginalName = undefined;
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
    this.updateCrowdstrike();
  }

  onCancel(): void {
    this.router.navigate(['/AfficherCrowsdstrike']);
  }
}
