import { Component, OnInit } from '@angular/core';
import { VMwareService } from 'app/Services/vmware.service';
import { VMware } from 'app/Model/VMware';
import { Router } from '@angular/router';
import { PermissionService } from 'app/Services/permission.service';
@Component({
  selector: 'app-afficherv',
  templateUrl: './afficherv.component.html',
  styleUrls: ['./afficherv.component.scss']
})
export class AffichervComponent implements OnInit {

  searchTerm: string = '';
   vmwares: VMware[] = [];
   filteredVMwares: VMware[] = [];
   selectedVMware: VMware | null = null;
 
    currentPage = 0;
     pageSize = 10;
     totalPages: number = 0;
     pagedVMwares:VMware[] = [];
     unapprovedVmwares:VMware[] = [];

 
   constructor(private vmwareService: VMwareService, private router: Router, public permissionService: PermissionService) {}
 
  ngOnInit(): void {
      this.getAllVMwares();
    }
  
    onSearch() {
      this.filteredVMwares = this.filterVMwares();
      this.calculatePagination();
      this.changePage(0);
    }
  
    getAllVMwares(): void {
      this.vmwareService.getAllVMwares().subscribe(
        (data: VMware[]) => {
          this.vmwares = data;
          this.filteredVMwares = data;
          this.calculatePagination();
          this.changePage(0);
        },
        (error) => {
          console.error('Erreur récupération VMwares', error);
        }
      );
    }
  
    filterVMwares(): VMware[] {
      const term = this.searchTerm.toLowerCase();
      return this.vmwares.filter((vmware) => {
        const inLicences = vmware.licences?.some(lic =>
          lic.nomDesLicences?.toLowerCase().includes(term) ||
          lic.quantite?.toLowerCase().includes(term) ||
          (lic.dateEx && new Date(lic.dateEx).toLocaleDateString('fr-FR').includes(term))
        );
  
        const inMainFields =
          vmware.client?.toLowerCase().includes(term) ||
          vmware.nomDuContact?.toLowerCase().includes(term) ||
          vmware.adresseEmailContact?.toLowerCase().includes(term) ||
          vmware.numero?.toLowerCase().includes(term) ||
          vmware.dureeDeLicence?.toLowerCase?.().includes(term);
  
        return inMainFields || inLicences;
      });
    }
  
    calculatePagination() {
      this.totalPages = Math.ceil(this.filteredVMwares.length / this.pageSize);
    }
  
    changePage(pageIndex: number) {
      this.currentPage = pageIndex;
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      this.pagedVMwares = this.filteredVMwares.slice(start, end);
    }
  
    approveVMware(id: number): void {
      this.vmwareService.activate(id).subscribe(() => {
    this.unapprovedVmwares = this.unapprovedVmwares.filter(vmware => vmware.vmwareId !== id);
      this.filteredVMwares = this.filteredVMwares.filter(vmware=> vmware.vmwareId !== id);
      this.calculatePagination();
      this.changePage(this.currentPage);
      console.log('Article approuvé et retiré de la liste');
    });
  }
  
    deleteVMware(id: number | undefined | null): void {
      if (id != null && confirm('Confirmer la suppression ?')) {
        this.vmwareService.deleteVMware(id).subscribe(
          () => {
            this.getAllVMwares();
            alert('VMware supprimé avec succès');
          },
          error => {
            console.error('Erreur suppressionVMware', error);
            alert('Échec suppression');
          }
        );
      }
    }
  
    updateVMware(vmware: VMware): void {
      this.router.navigate(['/edit-vmware', vmware.vmwareId]);
    }

    selectVMware(v: VMware): void { this.selectedVMware = this.selectedVMware?.vmwareId === v.vmwareId ? null : v; }
    closeDetail(): void { this.selectedVMware = null; }
  
    goToAddVMware() {
      this.router.navigate(['/Ajoutervmw']);
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
  return this.vmwareService.getFileDownloadUrl(id);
}

onCancel(): void {
      this.router.navigate(['/Affichervmware']);
    }
  }
  
