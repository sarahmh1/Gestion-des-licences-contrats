import { Veeam } from './Model/Veeam';
import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule  } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ProductsComponent } from './products/products.component';
import { AfficherListeComponent } from './afficher-liste/afficher-liste.component';
import { AffichageComponent } from './Eset/affichage/affichage.component';
import { UpdateEsetComponent } from './Eset/update-eset/update-eset.component';
import { ExpiredEsetComponent } from './Eset/expired-eset/expired-eset.component';
//import { AjouterComponent } from './Fortinet/ajouter/ajouter.component';
//import { AfficherComponent } from './Fortinet/afficher/afficher.component';
import { AjouterwComponent } from './Wallix/ajouterw/ajouterw.component';
import { AfficherwComponent } from './Wallix/afficherw/afficherw.component';
import { AffichervComponent } from './VMware/afficherv/afficherv.component';
import { AjoutervComponent } from './VMware/ajouterv/ajouterv.component';
import { AjouterVeeComponent} from './Veeam/ajoutervee/ajoutervee.component';
import { AfficherveeComponent } from './Veeam/affichervee/affichervee.component';
import { AjouterSplunkComponent } from './Splunk/ajouter-splunk/ajouter-splunk.component';
import { AfficherSplunkComponent } from './Splunk/afficher-splunk/afficher-splunk.component';
import { AjoutermComponent } from './MicrosoftO365/ajouterm/ajouterm.component';
import { AffichermComponent } from './MicrosoftO365/afficherm/afficherm.component';
import { AjouterPaloComponent } from './Palo/ajouter-palo/ajouter-palo.component';
import { AfficherPaloComponent } from './Palo/afficher-palo/afficher-palo.component';
import { AfficherProofpointComponent } from './Profpoint/afficher-proofpoint/afficher-proofpoint.component';
import { AjouterProofpointComponent } from './Profpoint/ajouter-proofpoint/ajouter-proofpoint.component';
import { AfficherRapid7Component } from './Rapid7/afficher-rapid7/afficher-rapid7.component';
import { AjouterRapid7Component } from './Rapid7/ajouter-rapid7/ajouter-rapid7.component';
//import { UpdateFortinetComponent} from './Fortinet/fortinet-update.component';
import { UpdatePaloComponent } from './Palo/update-palo/update-palo.component';
import { UpdateVeeamComponent } from './Veeam/updatevee/update-veeam.component';
import { UpdateProofpointComponent } from './Profpoint/update-proofpoint/update-proofpoint.component';
import { UpdateWallixComponent } from './Wallix/updatew/update-wallix.component';
import { UpdateRapid7Component } from './Rapid7/update-rapid7/update-rapid7.component';
import { UpdateVMwareComponent } from './VMware/updatev/updatev.component';
import { UpdateSplunkComponent } from './Splunk/update-splunk/update-splunk.component';
import { UpdateMicrosoftComponent } from './MicrosoftO365/updatem/updatem.component';
import { AjouteroComponent } from './OneIdentity/ajoutero/ajoutero.component';
import { AfficheroComponent } from './OneIdentity/affichero/affichero.component';
import { UpdateOneIdentityComponent } from './OneIdentity/updateo/updateo.component';
import { AjoutersComponent } from './SecPoint/ajouters/ajouters.component';
import { AffichersComponent } from './SecPoint/affichers/affichers.component';
import { UpdateSecPointComponent } from './SecPoint/updates/updates.component';
import { AjouterbComponent } from './Bitdefender/ajouteb/ajouterb.component';
import { AfficherbComponent } from './Bitdefender/afficherb/afficherb.component';
import { UpdateBitdefenderComponent } from './Bitdefender/updateb/updateb.component';
import { AjouternComponent } from './Netskope/ajoutern/ajoutern.component';
import { AffichernComponent } from './Netskope/affichern/affichern.component';
import { UpdateNetskopeComponent } from './Netskope/updaten/update.component';
import { AjouterfComponent } from './F5/ajouterf/ajouterf.component';
import { AfficherfComponent } from './F5/afficherf/afficherf.component';
import { UpdateF5Component } from './F5/updatef/updatef.component';
import { AjouterssComponent } from './SentineIOne/ajouters/ajouters.component';
import { AfficherssComponent } from './SentineIOne/affichers/affichers.component';
import { UpdateSentineIOneComponent } from './SentineIOne/updates/updates.component';
import { AjouterfortraComponent } from './Fortra/ajouterfortra/ajouterfortra.component';
import { AfficherfortraComponent } from './Fortra/afficherfortra/afficherfortra.component';
import { UpdateFortraComponent } from './Fortra/updatefortra/updatefortra.component';
import { AjouteraComponent } from './Alwarebytes/ajoutera/ajoutera.component';
import { AfficheraComponent } from './Alwarebytes/affichera/affichera.component';
import { UpdateAlwarebytesComponent } from './Alwarebytes/updatea/updatea.component';
import { AjouteriComponent } from './Infoblox/ajouteri/ajouteri.component';
import { AfficheriComponent } from './Infoblox/afficheri/afficheri.component';
import { UpdateInfobloxComponent } from './Infoblox/updatei/updatei.component';
import { AjoutervrComponent } from './Varonis/ajoutervr/ajoutervr.component';
import { AffichervrComponent } from './Varonis/affichervr/affichervr.component';
import { UpdateVaronisComponent } from './Varonis/updatevr/updatevr.component';
import { AjoutercComponent } from './Cisco/ajouterc/ajouterc.component';
import { AffichercComponent } from './Cisco/afficherc/afficherc.component';
import { UpdateCiscoComponent } from './Cisco/updatec/updatec.component';
import { AjouterimComponent } from './Imperva/ajouterim/ajouterim.component';
import { AfficherimComponent } from './Imperva/afficherim/afficherim.component';
import { UpdateImpervaComponent } from './Imperva/updateim/updateim.component';
const routes: Routes =[
  { 
    path: 'login', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'signup', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'verify-email',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  

  {
    path: '',
    redirectTo: 'login', // ← Redirige vers /login au lieu de /dashboard
    pathMatch: 'full'
  },
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
        {
      path: '',
      loadChildren: () => import('./layouts/admin-layout/admin-layout.module').then(x => x.AdminLayoutModule)
  }]},
  
  {
    path: '**',
    redirectTo: 'dashboard'
  }
  
];


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes,{
       useHash: true
    })
  ],
  exports: [RouterModule
  ],

})

export class AppRoutingModule { }
