import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AppValidators } from 'app/shared/validators/app-validators';
import { Router } from '@angular/router';
import { ContratService } from 'app/Services/contrat.service';
import { ClientService, Client } from '../../Services/client.service';
import { PRODUIT_LIST } from '../../Model/NomProduit';

@Component({
  selector: 'app-ajouter-contrat',
  templateUrl: './ajouter-contrat.component.html',
  styleUrls: ['./ajouter-contrat.component.scss']
})
export class AjouterContratComponent implements OnInit {
  clients: Client[] = [];
  contratForm!: FormGroup;
  nomProduitOptions = PRODUIT_LIST;
  dateFinDisabled = false;  // controle le grisage visuel du champ dateFin

  constructor(
    private fb: FormBuilder,
    private contratService: ContratService,
    private router: Router,
    private clientService: ClientService) { }

  ngOnInit(): void {
    this.clientService.getAllClients().subscribe(data => this.clients = data);
    this.initForm();
    this.watchDateFin();
  }

  initForm(): void {
    this.contratForm = this.fb.group({
      client: ['', Validators.required],
      objetContrat: ['', Validators.required],
      nbInterventionsPreventives: ['', AppValidators.requiredDigits],
      nbInterventionsCuratives: ['', AppValidators.requiredDigits],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      renouvelable: [false],
      remarque: [''],
      emailCommercial: ['', Validators.email],
      ccMail: this.fb.array([]),
      nomProduit: [''],
      criticite: ['', Validators.required],
      delaiMaxIntervention: ['', AppValidators.requiredDigits],
      delaiMaxResolution: ['', AppValidators.requiredDigits]
    });
  }

  // 1) Quand dateFin est remplie -> renouvelable devient grise (comportement existant)
  watchDateFin(): void {
    this.contratForm.get('dateFin')!.valueChanges.subscribe((val: string) => {
      const renouvelable = this.contratForm.get('renouvelable');
      if (val) {
        renouvelable?.setValue(false, { emitEvent: false });
        renouvelable?.disable({ emitEvent: false });
      } else {
        renouvelable?.enable({ emitEvent: false });
      }
    });
  }

  // 2) Appele directement par (change) sur la checkbox
  onRenouvelableChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.dateFinDisabled = checked;
    const dateFin = this.contratForm.get('dateFin');
    if (checked) {
      dateFin?.setValue('');
      dateFin?.disable();
    } else {
      dateFin?.enable();
      dateFin?.setValidators([Validators.required]);
      dateFin?.updateValueAndValidity();
    }
  }

  // 3) Calcule dateFin = dateDebut + duree choisie
  setDuration(duration: '1w' | '3m' | '6m' | '1y'): void {
    const debutVal = this.contratForm.get('dateDebut')?.value;
    if (!debutVal) {
      alert('Veuillez d\'abord renseigner la Date de Début.');
      return;
    }
    const debut = new Date(debutVal);
    const fin = new Date(debut);

    switch (duration) {
      case '1w': fin.setDate(fin.getDate() + 7);      break;
      case '3m': fin.setMonth(fin.getMonth() + 3);    break;
      case '6m': fin.setMonth(fin.getMonth() + 6);    break;
      case '1y': fin.setFullYear(fin.getFullYear() + 1); break;
    }

    // Formater en YYYY-MM-DD pour l'input[type="date"]
    const yyyy = fin.getFullYear();
    const mm   = String(fin.getMonth() + 1).padStart(2, '0');
    const dd   = String(fin.getDate()).padStart(2, '0');
    this.contratForm.get('dateFin')?.setValue(`${yyyy}-${mm}-${dd}`);
  }

  // Getter pour le FormArray des emails CC
  get ccMailArray(): FormArray {
    return this.contratForm.get('ccMail') as FormArray;
  }

  // Ajouter un email CC
  addCcMail(): void {
    this.ccMailArray.push(this.fb.control('', Validators.email));
  }

  // Supprimer un email CC
  removeCcMail(index: number): void {
    this.ccMailArray.removeAt(index);
  }

  addContrat(): void {
    if (this.contratForm.valid) {
      // getRawValue inclut les champs desactives (dateFin quand renouvelable)
      const formValue = this.contratForm.getRawValue();
      const contrat = {
        ...formValue,
        dateFin: formValue.renouvelable ? null : formValue.dateFin,
        ccMail: formValue.ccMail.filter((email: string) => email && email.trim() !== '')
      };
      this.contratService.addContrat(contrat).subscribe(
        () => {
          alert('Contrat ajouté avec succès');
          this.router.navigate(['/contrats']);
        },
        (error) => {
          console.error('Erreur lors de l\'ajout du contrat', error);
          alert('Erreur lors de l\'ajout du contrat');
        }
      );
    }
  }

  cancel(): void {
    this.router.navigate(['/contrats']);
  }
}
