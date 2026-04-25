import { Component, OnInit } from '@angular/core';
import { SecPointService } from 'app/Services/sec-point.service';
import { SecPoint } from 'app/Model/SecPoint';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-affichers',
  templateUrl: './affichers.component.html',
  styleUrls: ['./affichers.component.scss']
})
export class AffichersComponent implements OnInit {

  searchTerm: string = '';
  selectedSecPoint: SecPoint | null = null;
   secPoints: SecPoint[] = [];
   filteredSecPoints: SecPoint[] = [];
  unapprovedSecPoints:SecPoint[] = [];
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedSecPoints:SecPoint[] = [];
 
   constructor(private secPointService: SecPointService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllSecPoints();
    }
  
    onSearch() {
      this.filteredSecPoints = this.filterSecPoints();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllSecPoints(): void {
      this.secPointService.getAllSecPoints().subscribe(
        (data: SecPoint[]) => {
          this.secPoints = data;
          this.filteredSecPoints = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur r�cup�ration SecPoints', error);
        }
      );
    }
  
    filterSecPoints(): SecPoint[] {
      const term = this.searchTerm.toLowerCase();
      return this.secPoints.filter((secPoint) => {
        const inLicences = secPoint.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          secPoint.client?.toLowerCase().includes(term) ||
          secPoint.nomDuContact?.toLowerCase().includes(term) ||
          secPoint.adresseEmailContact?.toLowerCase().includes(term) ||
          secPoint.numero?.toLowerCase().includes(term) ||
          secPoint.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredSecPoints.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedSecPoints = this.filteredSecPoints.slice(start, end);
    }
  
    approveSecPoint(id: number): void {
      this.secPointService.activate(id).subscribe(() => {
       this.unapprovedSecPoints = this.unapprovedSecPoints.filter(secPoint => secPoint.secPointId !== id);
      this.filteredSecPoints = this.filteredSecPoints.filter(secPoint => secPoint.secPointId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuv� et retir� de la liste');
    });
  }
  
    deleteSecPoint(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.secPointService.deleteSecPoint(id).subscribe(
          () => {
            this.getAllSecPoints();
            alert('SecPoint supprim� avec succ�s');
          },
          error => {
            console.error('Erreur suppression SecPoint', error);
            alert('�chec suppression');
          }
        );
      }
    }
  
    updateSecPoint(secPoint: SecPoint): void {
      this.router.navigate(['/edit-secPoint', secPoint.secPointId]);
    }
  
    goToAddSecPoint() {
      this.router.navigate(['/Ajouters']);
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
  return this.secPointService.getFileDownloadUrl(id);
}
  
  selectSecPoint(x: SecPoint): void { this.selectedSecPoint = this.selectedSecPoint?.secPointId === x.secPointId ? null : x; }
  closeDetail(): void { this.selectedSecPoint = null; }
}
