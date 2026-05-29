
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LbdModule } from '../../lbd/lbd.module';
import { NguiMapModule } from '@ngui/map';

import { AdminLayoutRoutes } from './admin-layout.routing';
import { JhFormatPipe } from '../../shared/jh-format.pipe';
import { SearchableClientSelectComponent } from '../../shared/searchable-client-select/searchable-client-select.component';
import { SearchableUserSelectComponent } from '../../shared/searchable-user-select/searchable-user-select.component';
import { SharedDirectivesModule } from '../../shared/shared-directives.module';

import { HomeComponent } from '../../home/home.component';
//import { UserComponent } from '../../user/user.component';
import { TablesComponent } from '../../tables/tables.component';
import { TypographyComponent } from '../../typography/typography.component';
import { IconsComponent } from '../../icons/icons.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { UpgradeComponent } from '../../upgrade/upgrade.component';
/*import { AfficherComponent } from '../../Fortinet/afficher/afficher.component';
import { AjouterComponent } from '../../Fortinet/ajouter/ajouter.component';*/


import { ProductsComponent } from '../../products/products.component';
import { AfficherListeComponent } from '../../afficher-liste/afficher-liste.component';
import { AffichageComponent } from '../../Eset/affichage/affichage.component';
import { UpdateEsetComponent } from '../../Eset/update-eset/update-eset.component';
import { ExpiredF5Component } from '../../F5/expired-f5/expired-f5.component';
import { ExpiredCiscoComponent } from '../../Cisco/expired-cisco/expired-cisco.component';
import { ExpiredMicrosoftO365Component } from '../../MicrosoftO365/expired-microsoft-o365/expired-microsoft-o365.component';
import { ExpiredInfobloxComponent } from '../../Infoblox/expired-infoblox/expired-infoblox.component';
import { ExpiredAlwarebytesComponent } from '../../Alwarebytes/expired-alwarebytes/expired-alwarebytes.component';
import { ExpiredSentineIOneComponent } from '../../SentineIOne/expired-sentineione/expired-sentineione.component';
import { ExpiredFortraComponent } from '../../Fortra/expired-fortra/expired-fortra.component';
import { ExpiredEsetComponent } from '../../Eset/expired-eset/expired-eset.component';
import { ExpiredImpervaComponent } from '../../Imperva/expired-imperva/expired-imperva.component';
import { ExpiredVaronisComponent } from '../../Varonis/expired-varonis/expired-varonis.component';
import { ExpiredNetskopeComponent } from '../../Netskope/expired-netskope/expired-netskope.component';
import { ExpiredBitdefenderComponent } from '../../Bitdefender/expired-bitdefender/expired-bitdefender.component';
import { ExpiredSecPointComponent } from '../../SecPoint/expired-secpoint/expired-secpoint.component';
import { ExpiredOneIdentityComponent } from '../../OneIdentity/expired-oneidentity/expired-oneidentity.component';
import { ExpiredSplunkComponent } from '../../Splunk/expired-splunk/expired-splunk.component';
import { ExpiredVMwareComponent } from '../../VMware/expired-vmware/expired-vmware.component';
import { ExpiredRapid7Component } from '../../Rapid7/expired-rapid7/expired-rapid7.component';
import { ExpiredWallixComponent } from '../../Wallix/expired-wallix/expired-wallix.component';
import { ExpiredProofpointComponent } from '../../Profpoint/expired-proofpoint/expired-proofpoint.component';
import { ExpiredVeeamComponent } from '../../Veeam/expired-veeam/expired-veeam.component';
import { ExpiredPaloComponent } from '../../Palo/expired-palo/expired-palo.component';
import { ExpiredFortinetComponent } from '../../Fortinet/expired-fortinet/expired-fortinet.component';
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
import { UpdateCrowdstrikeComponent } from '../../Crowdstrike/updatecr/updatecr.component';
import { AjouterCrowdstrikeComponent } from '../../Crowdstrike/ajoutercr/ajoutercr.component';
import { AfficherCrowdstrikeComponent } from '../../Crowdstrike/affichercr/affichercr.component';
import { ExpiredCrowdstrikeComponent } from '../../Crowdstrike/expired-crowdstrike/expired-crowdstrike.component';
import { UpdateVaronisComponent } from '../../Varonis/updatevr/updatevr.component';
import { AjoutercComponent } from '../../Cisco/ajouterc/ajouterc.component';
import { AffichercComponent } from '../../Cisco/afficherc/afficherc.component';
import { UpdateCiscoComponent } from '../../Cisco/updatec/updatec.component';
import { AjouterimComponent } from '../../Imperva/ajouterim/ajouterim.component';
import { AfficherimComponent } from '../../Imperva/afficherim/afficherim.component';
import { UpdateImpervaComponent } from '../../Imperva/updateim/updateim.component';
import { UserComponent } from '../../User/user.component';
//import { FortinetComponent } from '../../Fortinet/fortinet.component';
import { ProfileComponent } from '../../Profil/profil.component';
import { MessagingComponent } from '../../messaging/messaging.component';
import { AfficherContratComponent } from '../../Contrat/afficher-contrat/afficher-contrat.component';
import { AjouterContratComponent } from '../../Contrat/ajouter-contrat/ajouter-contrat.component';
import { UpdateContratComponent } from '../../Contrat/update-contrat/update-contrat.component';
import { AfficherInterventionCurativeComponent } from '../../InterventionCurative/afficher-intervention-curative/afficher-intervention-curative.component';
import { AfficherInterventionPreventiveComponent } from '../../intervention-preventive/afficher-intervention-preventive/afficher-intervention-preventive.component';
import { ClientStatsComponent } from '../../client-stats/client-stats/client-stats.component';
import { HistoriqueContratComponent } from '../../Contrat/historique-contrat/historique-contrat.component';
import { AssistantUiModule } from '../../assistant/assistant-ui.module';



@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    AssistantUiModule,
    SharedDirectivesModule,
    LbdModule,
    NguiMapModule.forRoot({ apiUrl: 'https://maps.google.com/maps/api/js?key=YOUR_KEY_HERE' })
  ],
  declarations: [
    HomeComponent,
    //UserComponent,
    TablesComponent,
    TypographyComponent,
    IconsComponent,
    MapsComponent,
    NotificationsComponent,
    UpgradeComponent,
    AfficherComponent,
    AjouterComponent,
    ProductsComponent,
    AfficherListeComponent,
    AffichageComponent,
    UpdateEsetComponent,
    ExpiredEsetComponent,
    //AjouterComponent,
    //AfficherComponent,
    AjoutermComponent,
    AffichermComponent,
    AjouterwComponent,
    AfficherwComponent,
    AjoutervComponent,
    AffichervComponent,
    AfficherveeComponent,
    AjouterVeeComponent,
    AjouterSplunkComponent,
    AfficherSplunkComponent,
    AffichermComponent,
    AjoutermComponent,
    AjouterPaloComponent,
    AfficherPaloComponent,
    AjouterProofpointComponent,
    AfficherProofpointComponent,
    AjouterRapid7Component,
    AfficherRapid7Component,
    UpdateFortinetComponent,
    UpdatePaloComponent,
    UpdateVeeamComponent,
    UpdateProofpointComponent,
    UpdateWallixComponent,
    UpdateRapid7Component,
    UpdateVMwareComponent,
    UpdateSplunkComponent,
    UpdateMicrosoftComponent,
    AjouteroComponent,
    AfficheroComponent,
    UpdateOneIdentityComponent,
    UpdateSecPointComponent,
    AffichersComponent,
    AjoutersComponent,
    AfficherbComponent,
    AjouterbComponent,
    UpdateBitdefenderComponent,
    AjouternComponent,
    AffichernComponent,
    UpdateNetskopeComponent,
    AjouterfComponent,
    AfficherfComponent,
    UpdateF5Component,
    AjouterssComponent,
    AfficherssComponent,
    UpdateSentineIOneComponent,
    AjouterfortraComponent,
    AfficherfortraComponent,
    UpdateFortraComponent,
    AjouteraComponent,
    AfficheraComponent,
    UpdateAlwarebytesComponent,
    AjouteriComponent,
    AfficheriComponent,
    UpdateInfobloxComponent,
    AjoutervrComponent,
    AffichervrComponent,
    UpdateVaronisComponent,
    AjoutercComponent,
    AffichercComponent,
    UpdateCiscoComponent,
    AjouterimComponent,
    AfficherimComponent,
    UpdateImpervaComponent,
    UserComponent,
    //FortinetComponent,
    ProfileComponent,
    ExpiredFortinetComponent,
    ExpiredPaloComponent,
    ExpiredVeeamComponent,
    ExpiredProofpointComponent,
    ExpiredWallixComponent,
    ExpiredRapid7Component,
    ExpiredSplunkComponent,
    ExpiredVMwareComponent,
    ExpiredOneIdentityComponent,
    ExpiredSecPointComponent,
    ExpiredBitdefenderComponent,
    ExpiredNetskopeComponent,
    ExpiredF5Component,
    ExpiredFortraComponent,
    ExpiredSentineIOneComponent,
    ExpiredAlwarebytesComponent,
    ExpiredInfobloxComponent,
    ExpiredVaronisComponent,
    ExpiredMicrosoftO365Component,
    ExpiredImpervaComponent,
    ExpiredCiscoComponent,
    UpdateCrowdstrikeComponent,
    AjouterCrowdstrikeComponent,
    AfficherCrowdstrikeComponent,
    ExpiredCrowdstrikeComponent,
    MessagingComponent,
    AfficherContratComponent,
    AjouterContratComponent,
    UpdateContratComponent,
    AfficherInterventionCurativeComponent,
    AfficherInterventionPreventiveComponent,
    ClientStatsComponent,
    HistoriqueContratComponent,
    JhFormatPipe,
    SearchableClientSelectComponent,
    SearchableUserSelectComponent

  ]
})

export class AdminLayoutModule { }
