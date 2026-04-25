import { Component, OnInit } from '@angular/core';
import { AlwarebytesService } from 'app/Services/alwarebytes.service';
import { Alwarebytes } from 'app/Model/Alwarebytes';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-affichera',
  templateUrl: './affichera.component.html',
  styleUrls: ['./affichera.component.scss']
})
export class AfficheraComponent implements OnInit {

  searchTerm: string = '';
  selectedAlwarebytes: Alwarebytes | null = null;
  alwarebytess: Alwarebytes[] = [];
  filteredAlwarebytess: Alwarebytes[] = [];
  unapprovedAlwarebytes: Alwarebytes[] = [];

  currentPage = 0;
  pageSize = 10;
  totalPages: number = 0;
  pagedAlwarebytess: Alwarebytes[] = [];

  constructor(private alwarebytesService: AlwarebytesService, private router: Router, public permissionService: PermissionService) { }

  ngOnInit(): void {
    this.getAllAlwarebytess();
  }

  onSearch() {
    this.filteredAlwarebytess = this.filterAlwarebytess();
    this.calculatePagination();
    this.changePage(0);
  }

  getAllAlwarebytess(): void {
    this.alwarebytesService.getAllAlwarebytess().subscribe(
      (data: Alwarebytes[]) => {
        this.alwarebytess = data;
        this.filteredAlwarebytess = data;
        this.calculatePagination();
        this.changePage(0);
      },
      (error) => {
        console.error('Erreur r�cup�ration Alwarebytess', error);
      }
    );
  }

  filterAlwarebytess(): Alwarebytes[] {
    const term = this.searchTerm.toLowerCase();
    return this.alwarebytess.filter((alwarebytes) => {
      const inLicences = alwarebytes.licences?.some(lic =>
        lic.nomDesLicences?.toLowerCase().includes(term) ||
        lic.quantite?.toLowerCase().includes(term) ||
        (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
      );

      const inMainFields =
        alwarebytes.client?.toLowerCase().includes(term) ||
        alwarebytes.nomDuContact?.toLowerCase().includes(term) ||
        alwarebytes.adresseEmailContact?.toLowerCase().includes(term) ||
        alwarebytes.numero?.toLowerCase().includes(term) ||
        alwarebytes.dureeDeLicence?.toLowerCase?.().includes(term);

      return inMainFields || inLicences;
    });
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredAlwarebytess.length / this.pageSize);
  }

  changePage(pageIndex: number) {
    this.currentPage = pageIndex;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAlwarebytess = this.filteredAlwarebytess.slice(start, end);
  }

  approveAlwarebytes(id: number): void {
    this.alwarebytesService.activate(id).subscribe(() => {
      this.unapprovedAlwarebytes = this.unapprovedAlwarebytes.filter(alwarebytes => alwarebytes.alwarebytesId !== id);
      this.filteredAlwarebytess = this.filteredAlwarebytess.filter(alwarebytes => alwarebytes.alwarebytesId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }

  deleteAlwarebytes(id: number | undefined | null): void {
    if (id != null && confirm('Confirmer la suppression ?')) {
      this.alwarebytesService.deleteAlwarebytes(id).subscribe(
        () => {
          this.getAllAlwarebytess();
          alert('Alwarebytes supprim� avec succ�s');
        },
        error => {
          console.error('Erreur suppression Alwarebytes', error);
          alert('�chec suppression');
        }
      );
    }
  }

  updateAlwarebytes(alwarebytes: Alwarebytes): void {
    this.router.navigate(['/edit-alwarebytes', alwarebytes.alwarebytesId]);
  }

  goToAddAlwarebytes() {
    this.router.navigate(['/Ajoutera']);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  getCommandePasserParLabel(value: any): string {
    switch (value) {
      case 'GI_TN': return 'GI_TN';
      case 'GI_FR': return 'GI_FR';
      case 'GI_CI': return 'GI_CI';
      default: return value;
    }
  }

  getFileDownloadUrl(id: number): string {
    return this.alwarebytesService.getFileDownloadUrl(id);
  }

  selectAlwarebytes(x: Alwarebytes): void { this.selectedAlwarebytes = this.selectedAlwarebytes?.alwarebytesId === x.alwarebytesId ? null : x; }
  closeDetail(): void { this.selectedAlwarebytes = null; }
}

