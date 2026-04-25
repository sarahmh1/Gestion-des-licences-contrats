import { Routes } from '@angular/router';

import { HomeComponent } from '../../home/home.component';
//import { UserComponent } from '../../user/user.component';
import { TablesComponent } from '../../tables/tables.component';
import { TypographyComponent } from '../../typography/typography.component';
import { IconsComponent } from '../../icons/icons.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { UpgradeComponent } from '../../upgrade/upgrade.component';
//import { AfficherComponent } from '../../Fortinet/afficher/afficher.component';
//import { AjouterComponent } from '../../Fortinet/ajouter/ajouter.component';


import { ProductsComponent } from '../../products/products.component';
import { AfficherListeComponent } from '../../afficher-liste/afficher-liste.component';
import { AffichageComponent } from '../../Eset/affichage/affichage.component';
import { UpdateEsetComponent } from '../../Eset/update-eset/update-eset.component';
import { ExpiredEsetComponent } from '../../Eset/expired-eset/expired-eset.component';
import { AjouterComponent } from '../../Fortinet/ajouter/ajouter.component';
import { AfficherComponent } from '../../Fortinet/afficher/afficher.component';
import { AjoutermComponent } from '../../MicrosoftO365/ajouterm/ajouterm.component';
import { AffichermComponent } from '../../MicrosoftO365/afficherm/afficherm.component';
import { AjouterwComponent } from '../../Wallix/ajouterw/ajouterw.component';
import { AfficherwComponent } from '../../Wallix/afficherw/afficherw.component';
import { AjoutervComponent } from '../../VMware/ajouterv/ajouterv.component';
import { AffichervComponent } from '../../VMware/afficherv/afficherv.component';
import { AfficherveeComponent } from '../../Veeam/affichervee/affichervee.component';
import { AjouterVeeComponent } from '../../Veeam/ajoutervee/ajoutervee.component';
import { AjouterSplunkComponent } from '../../Splunk/ajouter-splunk/ajouter-splunk.component';
import { AfficherSplunkComponent } from '../../Splunk/afficher-splunk/afficher-splunk.component';
import { AjouterPaloComponent } from '../../Palo/ajouter-palo/ajouter-palo.component';
import { AfficherPaloComponent } from '../../Palo/afficher-palo/afficher-palo.component';
import { AjouterProofpointComponent } from '../../Profpoint/ajouter-proofpoint/ajouter-proofpoint.component';
import { AfficherProofpointComponent } from '../../Profpoint/afficher-proofpoint/afficher-proofpoint.component';
import { AjouterRapid7Component } from '../../Rapid7/ajouter-rapid7/ajouter-rapid7.component';
import { AfficherRapid7Component } from '../../Rapid7/afficher-rapid7/afficher-rapid7.component';
import { UpdateFortinetComponent } from '../../Fortinet/fortinet-update.component';
import { UpdatePaloComponent } from '../../Palo/update-palo/update-palo.component';
import { UpdateVeeamComponent } from '../../Veeam/updatevee/update-veeam.component';
import { UpdateProofpointComponent } from '../../Profpoint/update-proofpoint/update-proofpoint.component';
import { UpdateWallixComponent } from '../../Wallix/updatew/update-wallix.component';
import { UpdateRapid7Component } from '../../Rapid7/update-rapid7/update-rapid7.component';
import { UpdateVMwareComponent } from '../../VMware/updatev/updatev.component';
import { UpdateSplunkComponent } from '../../Splunk/update-splunk/update-splunk.component';
import { UpdateMicrosoftComponent } from '../../MicrosoftO365/updatem/updatem.component';
import { AjouteroComponent } from '../../OneIdentity/ajoutero/ajoutero.component';
import { AfficheroComponent } from '../../OneIdentity/affichero/affichero.component';
import { UpdateOneIdentityComponent } from '../../OneIdentity/updateo/updateo.component';
import { AjoutersComponent } from '../../SecPoint/ajouters/ajouters.component';
import { AffichersComponent } from '../../SecPoint/affichers/affichers.component';
import { UpdateSecPointComponent } from '../../SecPoint/updates/updates.component';
import { AjouterbComponent } from '../../Bitdefender/ajouteb/ajouterb.component';
import { AfficherbComponent } from '../../Bitdefender/afficherb/afficherb.component';
import { UpdateBitdefenderComponent } from '../../Bitdefender/updateb/updateb.component';
import { AjouternComponent } from '../../Netskope/ajoutern/ajoutern.component';
import { AffichernComponent } from '../../Netskope/affichern/affichern.component';
import { UpdateNetskopeComponent } from '../../Netskope/updaten/update.component';
import { AjouterfComponent } from '../../F5/ajouterf/ajouterf.component';
import { AfficherfComponent } from '../../F5/afficherf/afficherf.component';
import { UpdateF5Component } from '../../F5/updatef/updatef.component';
import { AjouterssComponent } from '../../SentineIOne/ajouters/ajouters.component';
import { AfficherssComponent } from '../../SentineIOne/affichers/affichers.component';
import { UpdateSentineIOneComponent } from '../../SentineIOne/updates/updates.component';
import { AjouterfortraComponent } from '../../Fortra/ajouterfortra/ajouterfortra.component';
import { AfficherfortraComponent } from '../../Fortra/afficherfortra/afficherfortra.component';
import { UpdateFortraComponent } from '../../Fortra/updatefortra/updatefortra.component';
import { AjouteraComponent } from '../../Alwarebytes/ajoutera/ajoutera.component';
import { AfficheraComponent } from '../../Alwarebytes/affichera/affichera.component';
import { UpdateAlwarebytesComponent } from '../../Alwarebytes/updatea/updatea.component';
import { AjouteriComponent } from '../../Infoblox/ajouteri/ajouteri.component';
import { AfficheriComponent } from '../../Infoblox/afficheri/afficheri.component';
import { UpdateInfobloxComponent } from '../../Infoblox/updatei/updatei.component';
import { AjoutervrComponent } from '../../Varonis/ajoutervr/ajoutervr.component';
import { AffichervrComponent } from '../../Varonis/affichervr/affichervr.component';
import { UpdateVaronisComponent } from '../../Varonis/updatevr/updatevr.component';
import { AjoutercComponent } from '../../Cisco/ajouterc/ajouterc.component';
import { AffichercComponent } from '../../Cisco/afficherc/afficherc.component';
import { UpdateCiscoComponent } from '../../Cisco/updatec/updatec.component';
import { AjouterimComponent } from '../../Imperva/ajouterim/ajouterim.component';
import { AfficherimComponent } from '../../Imperva/afficherim/afficherim.component';
import { UpdateImpervaComponent } from '../../Imperva/updateim/updateim.component';
import { ExpiredFortinetComponent } from '../../Fortinet/expired-fortinet/expired-fortinet.component';
import { UserComponent } from '../../User/user.component';
//import { FortinetComponent } from '../../Fortinet/fortinet.component';
import { ProfileComponent } from '../../Profil/profil.component';
import { ExpiredPaloComponent } from '../../Palo/expired-palo/expired-palo.component';
import { ExpiredVeeamComponent } from '../../Veeam/expired-veeam/expired-veeam.component';
import { ExpiredProofpointComponent } from '../../Profpoint/expired-proofpoint/expired-proofpoint.component';
import { ExpiredWallixComponent } from '../../Wallix/expired-wallix/expired-wallix.component';
import { ExpiredRapid7Component } from '../../Rapid7/expired-rapid7/expired-rapid7.component';
import { ExpiredVMwareComponent } from '../../VMware/expired-vmware/expired-vmware.component';
import { ExpiredSplunkComponent } from '../../Splunk/expired-splunk/expired-splunk.component';
import { ExpiredOneIdentityComponent } from '../../OneIdentity/expired-oneidentity/expired-oneidentity.component';
import { ExpiredSecPointComponent } from '../../SecPoint/expired-secpoint/expired-secpoint.component';
import { ExpiredBitdefenderComponent } from '../../Bitdefender/expired-bitdefender/expired-bitdefender.component';
import { ExpiredNetskopeComponent } from '../../Netskope/expired-netskope/expired-netskope.component';
import { ExpiredF5Component } from '../../F5/expired-f5/expired-f5.component';
import { ExpiredFortraComponent } from '../../Fortra/expired-fortra/expired-fortra.component';
import { ExpiredSentineIOneComponent } from '../../SentineIOne/expired-sentineione/expired-sentineione.component';
import { ExpiredAlwarebytesComponent } from '../../Alwarebytes/expired-alwarebytes/expired-alwarebytes.component';
import { ExpiredInfobloxComponent } from '../../Infoblox/expired-infoblox/expired-infoblox.component';
import { ExpiredVaronisComponent } from '../../Varonis/expired-varonis/expired-varonis.component';
import { ExpiredMicrosoftO365Component } from '../../MicrosoftO365/expired-microsoft-o365/expired-microsoft-o365.component';
import { ExpiredImpervaComponent } from '../../Imperva/expired-imperva/expired-imperva.component';
import { ExpiredCiscoComponent } from '../../Cisco/expired-cisco/expired-cisco.component';
import { UpdateCrowdstrikeComponent } from '../../Crowdstrike/updatecr/updatecr.component';
import { AjouterCrowdstrikeComponent } from '../../Crowdstrike/ajoutercr/ajoutercr.component';
import { AfficherCrowdstrikeComponent } from '../../Crowdstrike/affichercr/affichercr.component';
import { ExpiredCrowdstrikeComponent } from '../../Crowdstrike/expired-crowdstrike/expired-crowdstrike.component';
import { MessagingComponent } from '../../messaging/messaging.component';
import { AfficherContratComponent } from '../../Contrat/afficher-contrat/afficher-contrat.component';
import { AjouterContratComponent } from '../../Contrat/ajouter-contrat/ajouter-contrat.component';
import { UpdateContratComponent } from '../../Contrat/update-contrat/update-contrat.component';
import { AfficherInterventionCurativeComponent } from '../../InterventionCurative/afficher-intervention-curative/afficher-intervention-curative.component';
import { AfficherInterventionPreventiveComponent } from '../../intervention-preventive/afficher-intervention-preventive/afficher-intervention-preventive.component';
import { ClientStatsComponent } from '../../client-stats/client-stats/client-stats.component';
import { HistoriqueContratComponent } from '../../Contrat/historique-contrat/historique-contrat.component';

export const AdminLayoutRoutes: Routes = [
  { path: 'dashboard', component: HomeComponent },
  { path: 'user', component: UserComponent },
  { path: 'table', component: TablesComponent },
  { path: 'typography', component: TypographyComponent },
  { path: 'icons', component: IconsComponent },
  { path: 'maps', component: MapsComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'upgrade', component: UpgradeComponent },
  { path: 'messaging', component: MessagingComponent },
  //{ path: 'fortinet',        component: FortinetComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'Afficherfortinet', component: AfficherComponent },
  { path: 'AjouterFortinet', component: AjouterComponent },
  {
    path: 'products',
    component: ProductsComponent

  },
  {
    path: 'affichage',
    component: AffichageComponent

  },
  {
    path: 'afficherListe',
    component: AfficherListeComponent

  },

  {
    path: 'expired-eset',
    component: ExpiredEsetComponent

  },
  {
    path: 'expired-cisco',
    component: ExpiredCiscoComponent

  },
  {
    path: 'expired-imperva',
    component: ExpiredImpervaComponent

  },
  {
    path: 'expired-microsoft',
    component: ExpiredMicrosoftO365Component

  },
  {
    path: 'expired-varonis',
    component: ExpiredVaronisComponent

  },
  {
    path: 'expired-crowdstrike',
    component: ExpiredCrowdstrikeComponent

  },
  {
    path: 'expired-infoblox',
    component: ExpiredInfobloxComponent

  },
  {
    path: 'expired-alwarebytes',
    component: ExpiredAlwarebytesComponent

  },
  {
    path: 'expired-f5',
    component: ExpiredF5Component

  },
  {
    path: 'expired-sentineione',
    component: ExpiredSentineIOneComponent

  },
  {
    path: 'expired-fortra',
    component: ExpiredFortraComponent

  },
  {
    path: 'expired-netskope',
    component: ExpiredNetskopeComponent

  },
  {
    path: 'expired-bitdefender',
    component: ExpiredBitdefenderComponent

  },
  {
    path: 'expired-oneidentity',
    component: ExpiredSecPointComponent

  },
  {
    path: 'expired-oneidentity',
    component: ExpiredOneIdentityComponent

  },
  {
    path: 'expired-splunk',
    component: ExpiredSplunkComponent

  },
  {
    path: 'expired-vmware',
    component: ExpiredVMwareComponent

  },
  {
    path: 'expired-wallix',
    component: ExpiredWallixComponent

  },
  {
    path: 'expired-veeam',
    component: ExpiredVeeamComponent

  },
  {
    path: 'expired-fortinet',
    component: ExpiredFortinetComponent

  },
  {
    path: 'expired-palo',
    component: ExpiredPaloComponent

  },
  {
    path: 'expired-rapid7',
    component: ExpiredRapid7Component

  },
  {
    path: 'expired-proofpoint',
    component: ExpiredProofpointComponent

  },
  /*{path: 'Afficherfortinet' , 
    component:AfficherComponent
  
  },*/

  { path: 'edit-fortinet/:id', component: UpdateFortinetComponent },

  {
    path: 'Ajouterwallix',
    component: AjouterwComponent

  },
  {
    path: 'Afficherwallix',
    component: AfficherwComponent
  },
  { path: 'edit-wallix/:id', component: UpdateWallixComponent },
  {
    path: 'AjouterCrowdstrike',
    component: AjouterCrowdstrikeComponent

  },
  {
    path: 'AfficherCrowsdstrike',
    component: AfficherCrowdstrikeComponent
  },
  { path: 'edit-crowdstrike/:id', component: UpdateCrowdstrikeComponent },

  {
    path: 'Ajoutero',
    component: AjouteroComponent

  },
  {
    path: 'Affichero',
    component: AfficheroComponent
  },
  { path: 'edit-oneIdentity/:id', component: UpdateOneIdentityComponent },


  {
    path: 'Ajouters',
    component: AjoutersComponent

  },
  {
    path: 'Affichers',
    component: AffichersComponent
  },
  { path: 'edit-secPoint/:id', component: UpdateSecPointComponent },

  {
    path: 'Ajouterf',
    component: AjouterfComponent

  },
  {
    path: 'Afficherf',
    component: AfficherfComponent
  },
  { path: 'edit-f5/:id', component: UpdateF5Component },

  {
    path: 'Ajouterc',
    component: AjoutercComponent

  },
  {
    path: 'Afficherc',
    component: AffichercComponent
  },
  { path: 'edit-cisco/:id', component: UpdateCiscoComponent },
  {
    path: 'Ajouterim',
    component: AjouterimComponent

  },
  {
    path: 'Afficherim',
    component: AfficherimComponent
  },
  { path: 'edit-imperva/:id', component: UpdateImpervaComponent },

  {
    path: 'Ajouterfortra',
    component: AjouterfortraComponent

  },
  {
    path: 'Afficherfortra',
    component: AfficherfortraComponent
  },
  { path: 'edit-fortra/:id', component: UpdateFortraComponent },

  {
    path: 'Ajoutera',
    component: AjouteraComponent

  },
  {
    path: 'Affichera',
    component: AfficheraComponent
  },
  { path: 'edit-alwarebytes/:id', component: UpdateAlwarebytesComponent },

  {
    path: 'Ajoutervr',
    component: AjoutervrComponent

  },
  {
    path: 'Affichervr',
    component: AffichervrComponent
  },
  { path: 'edit-varonis/:id', component: UpdateVaronisComponent },

  {
    path: 'Ajouteri',
    component: AjouteriComponent

  },
  {
    path: 'Afficheri',
    component: AfficheriComponent
  },
  { path: 'edit-infoblox/:id', component: UpdateInfobloxComponent },

  {
    path: 'Ajouterss',
    component: AjouterssComponent

  },
  {
    path: 'Afficherss',
    component: AfficherssComponent
  },
  { path: 'edit-sentineIOne/:id', component: UpdateSentineIOneComponent },

  {
    path: 'Affichervmw',
    component: AffichervComponent

  },
  {
    path: 'Ajoutervmw',
    component: AjoutervComponent

  },
  { path: 'edit-vmware/:id', component: UpdateVMwareComponent },
  {
    path: 'Ajouterveeam',
    component: AjouterVeeComponent

  },
  {
    path: 'Afficherveeam',
    component: AfficherveeComponent

  },
  { path: 'edit-veeam/:id', component: UpdateVeeamComponent },

  {
    path: 'Ajoutersplunk',
    component: AjouterSplunkComponent

  },
  {
    path: 'Affichersplunk',
    component: AfficherSplunkComponent
  },
  { path: 'edit-splunk/:id', component: UpdateSplunkComponent },
  {
    path: 'Ajoutermicro',
    component: AjoutermComponent

  },
  {
    path: 'Affichermicro',
    component: AffichermComponent

  },
  { path: 'edit-micro/:id', component: UpdateMicrosoftComponent },


  {
    path: 'Ajouterpalo',
    component: AjouterPaloComponent

  },
  {
    path: 'Afficherpalo',
    component: AfficherPaloComponent

  },
  { path: 'edit-palo/:id', component: UpdatePaloComponent },


  {
    path: 'Ajouterproof',
    component: AjouterProofpointComponent

  },
  {
    path: 'Afficherproof',
    component: AfficherProofpointComponent

  },
  {
    path: 'edit-proofpoint/:id',
    component: UpdateProofpointComponent

  },

  {
    path: 'Ajouterrapid7',
    component: AjouterRapid7Component

  },
  {
    path: 'Afficherrapid7',
    component: AfficherRapid7Component

  },

  {
    path: 'edit-rapid7/:id',
    component: UpdateRapid7Component

  },
  {
    path: 'Ajouterb',
    component: AjouterbComponent

  },
  {
    path: 'Afficherb',
    component: AfficherbComponent

  },

  {
    path: 'edit-bitdefender/:id',
    component: UpdateBitdefenderComponent

  },

  {
    path: 'Ajoutern',
    component: AjouternComponent

  },
  {
    path: 'Affichern',
    component: AffichernComponent

  },

  {
    path: 'edit-netskope/:id',
    component: UpdateNetskopeComponent

  },



  //AjouterwComponent=
  { path: 'edit-eset/:id', component: UpdateEsetComponent },  // Route for the update component
  //  { path: '', redirectTo: '/affichage'},

  // Routes Contrat
  { path: 'contrats', component: AfficherContratComponent },
  { path: 'AjouterContrat', component: AjouterContratComponent },
  { path: 'edit-contrat/:id', component: UpdateContratComponent },
  { path: 'historique-contrats', component: HistoriqueContratComponent },

  // Routes Intervention Curative
  { path: 'interventions-curatives', component: AfficherInterventionCurativeComponent },

  // Routes Intervention Préventive
  { path: 'interventions-preventives', component: AfficherInterventionPreventiveComponent },

  // Route Client Stats
  { path: 'client-stats', component: ClientStatsComponent },

];
