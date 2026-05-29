const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..', 'src', 'app');

const products = [
  { type: 'eset', folder: 'Eset/expired-eset', title: 'ESET', idField: 'esetid', entity: 'eset', selected: 'selectedEset', selectFn: 'selectEset', paged: 'pagedExpiredProducts', emptyMsg: 'Aucune licence ESET approuvée trouvée.' },
  { type: 'equipment', folder: 'Fortinet/expired-fortinet', title: 'Fortinet', idField: 'fortinetId', entity: 'fortinet', serialField: 'numeroSerie', selected: 'selectedFortinet', selectFn: 'selectFortinet', paged: 'pagedExpiredFortinets', emptyMsg: 'Aucune licence Fortinet approuvée trouvée.' },
  { type: 'equipment', folder: 'Palo/expired-palo', title: 'Palo Alto', idField: 'paloId', entity: 'palo', serialField: 'numeroSerieBoitier', selected: 'selectedPalo', selectFn: 'selectPalo', paged: 'pagedExpiredPalos', emptyMsg: 'Aucune licence Palo Alto approuvée trouvée.' },
  { type: 'standard', folder: 'Varonis/expired-varonis', title: 'Varonis', idField: 'varonisId', entity: 'varonis', selected: 'selectedVaronis', selectFn: 'selectVaronis', paged: 'pagedExpiredVaroniss', emptyMsg: 'Aucune licence Varonis approuvée trouvée.' },
  { type: 'standard', folder: 'Cisco/expired-cisco', title: 'Cisco', idField: 'ciscoId', entity: 'cisco', selected: 'selectedCisco', selectFn: 'selectCisco', paged: 'pagedExpiredCiscos', emptyMsg: 'Aucune licence Cisco approuvée trouvée.' },
  { type: 'standard', folder: 'Imperva/expired-imperva', title: 'Imperva', idField: 'impervaId', entity: 'imperva', selected: 'selectedImperva', selectFn: 'selectImperva', paged: 'pagedExpiredImpervas', emptyMsg: 'Aucune licence Imperva approuvée trouvée.' },
  { type: 'standard', folder: 'MicrosoftO365/expired-microsoft-o365', title: 'Microsoft O365', idField: 'microsoftO365Id', entity: 'microsoftO365', selected: 'selectedMicrosoftO365', selectFn: 'selectMicrosoftO365', paged: 'pagedExpiredMicrosoftO365s', emptyMsg: 'Aucune licence Microsoft O365 approuvée trouvée.' },
  { type: 'standard', folder: 'Crowdstrike/expired-crowdstrike', title: 'CrowdStrike', idField: 'crowdstrikeid', entity: 'crowdstrike', selected: 'selectedCrowdstrike', selectFn: 'selectCrowdstrike', paged: 'pagedExpiredCrowdstrikes', emptyMsg: 'Aucune licence CrowdStrike approuvée trouvée.' },
  { type: 'standard', folder: 'Infoblox/expired-infoblox', title: 'Infoblox', idField: 'infobloxId', entity: 'infoblox', selected: 'selectedInfoblox', selectFn: 'selectInfoblox', paged: 'pagedExpiredInfobloxs', emptyMsg: 'Aucune licence Infoblox approuvée trouvée.' },
  { type: 'standard', folder: 'Alwarebytes/expired-alwarebytes', title: 'Malwarebytes', idField: 'alwarebytesId', entity: 'alwarebytes', selected: 'selectedAlwarebytes', selectFn: 'selectAlwarebytes', paged: 'pagedExpiredAlwarebytess', emptyMsg: 'Aucune licence Malwarebytes approuvée trouvée.' },
  { type: 'standard', folder: 'F5/expired-f5', title: 'F5', idField: 'f5Id', entity: 'f5', selected: 'selectedF5', selectFn: 'selectF5', paged: 'pagedExpiredF5s', emptyMsg: 'Aucune licence F5 approuvée trouvée.' },
  { type: 'standard', folder: 'SentineIOne/expired-sentineione', title: 'SentinelOne', idField: 'sentineIOneId', entity: 'sentineIOne', selected: 'selectedSentineIOne', selectFn: 'selectSentineIOne', paged: 'pagedExpiredSentineIOnes', emptyMsg: 'Aucune licence SentinelOne approuvée trouvée.' },
  { type: 'standard', folder: 'Fortra/expired-fortra', title: 'Fortra', idField: 'fortraId', entity: 'fortra', selected: 'selectedFortra', selectFn: 'selectFortra', paged: 'pagedExpiredFortras', emptyMsg: 'Aucune licence Fortra approuvée trouvée.' },
  { type: 'standard', folder: 'Netskope/expired-netskope', title: 'Netskope', idField: 'netskopeId', entity: 'netskope', selected: 'selectedNetskope', selectFn: 'selectNetskope', paged: 'pagedExpiredNetskopes', emptyMsg: 'Aucune licence Netskope approuvée trouvée.' },
  { type: 'standard', folder: 'Bitdefender/expired-bitdefender', title: 'Bitdefender', idField: 'bitdefenderId', entity: 'bitdefender', selected: 'selectedBitdefender', selectFn: 'selectBitdefender', paged: 'pagedExpiredBitdefenders', emptyMsg: 'Aucune licence Bitdefender approuvée trouvée.' },
  { type: 'standard', folder: 'OneIdentity/expired-oneidentity', title: 'One Identity', idField: 'oneIdentityId', entity: 'oneIdentity', selected: 'selectedOneIdentity', selectFn: 'selectOneIdentity', paged: 'pagedExpiredOneIdentitys', emptyMsg: 'Aucune licence One Identity approuvée trouvée.' },
  { type: 'standard', folder: 'Splunk/expired-splunk', title: 'Splunk', idField: 'splunkid', entity: 'splunk', selected: 'selectedSplunk', selectFn: 'selectSplunk', paged: 'pagedExpiredSplunks', emptyMsg: 'Aucune licence Splunk approuvée trouvée.' },
  { type: 'standard', folder: 'VMware/expired-vmware', title: 'VMware', idField: 'vmwareId', entity: 'vmware', selected: 'selectedVMware', selectFn: 'selectVMware', paged: 'pagedExpiredVMwares', emptyMsg: 'Aucune licence VMware approuvée trouvée.' },
  { type: 'standard', folder: 'Wallix/expired-wallix', title: 'Wallix', idField: 'wallixId', entity: 'wallix', selected: 'selectedWallix', selectFn: 'selectWallix', paged: 'pagedExpiredWallixs', emptyMsg: 'Aucune licence Wallix approuvée trouvée.' },
  { type: 'standard', folder: 'Veeam/expired-veeam', title: 'Veeam', idField: 'veeamId', entity: 'veeam', selected: 'selectedVeeam', selectFn: 'selectVeeam', paged: 'pagedExpiredVeeams', emptyMsg: 'Aucune licence Veeam approuvée trouvée.' },
  { type: 'standard', folder: 'Rapid7/expired-rapid7', title: 'Rapid7', idField: 'rapid7Id', entity: 'rapid7', selected: 'selectedRapid7', selectFn: 'selectRapid7', paged: 'pagedExpiredRapid7s', emptyMsg: 'Aucune licence Rapid7 approuvée trouvée.' },
  { type: 'standard', folder: 'Profpoint/expired-proofpoint', title: 'Proofpoint', idField: 'proofpointId', entity: 'proofpoint', selected: 'selectedProofpoint', selectFn: 'selectProofpoint', paged: 'pagedExpiredProofpoints', emptyMsg: 'Aucune licence Proofpoint approuvée trouvée.' },
  { type: 'standard', folder: 'SecPoint/expired-secpoint', title: 'SecPoint', idField: 'secPointId', entity: 'secPoint', selected: 'selectedSecPoint', selectFn: 'selectSecPoint', paged: 'pagedExpiredSecPoints', emptyMsg: 'Aucune licence SecPoint approuvée trouvée.' },
];

function contactDetail(p) {
  const s = p.selected;
  const id = p.idField;
  return `
          <div class="md-detail-section-title">Vis-à-vis client</motion>
          <div class="md-detail-row"><span class="md-label">Vis-à-vis client</span><span class="md-value">{{ ${s}.nomDuContact || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">N° téléphone</span><span class="md-value">{{ ${s}.numero || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Email client</span><span class="md-value">{{ ${s}.adresseEmailContact || '-' }}</span></div>
          <motion class="md-detail-row"><span class="md-label">Email commercial</span><span class="md-value">{{ ${s}.mailAdmin || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">CC Mail</span><span class="md-value">{{ ${s}.ccMail || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Sous contrat</span>
            <span class="md-value"><span [class]="${s}.sousContrat ? 'md-badge md-badge-green' : 'md-badge md-badge-gray'">{{ ${s}.sousContrat ? 'Oui' : 'Non' }}</span></span>
          </div>
          <div class="md-detail-row"><span class="md-label">Remarque</span><span class="md-value">{{ ${s}.remarque || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Commande par</span><span class="md-value">{{ getCommandePasserParLabel(${s}.commandePasserPar) || '-' }}</span></motion>
          <div class="md-detail-row" *ngIf="${s}.fichier">
            <span class="md-label">Fichier</span>
            <span class="md-value">
              <a [href]="getFileDownloadUrl(${s}.${id})" target="_blank" class="btn btn-sm btn-outline-primary">
                <i class="fa fa-download"></i> {{ ${s}.fichierOriginalName || 'Télécharger' }}
              </a>
            </span>
          </div>
          <div class="md-detail-divider"></div>
          <div class="md-detail-actions">
            <button class="btn btn-sm btn-warning" (click)="desapprouve(${s}.${id})" title="Désexpirer">
              <i class="fas fa-times-circle"></i> Désexpirer
            </button>
          </div>`;
}

function standardDetailBody(p) {
  const s = p.selected;
  return `
          <div class="md-detail-section-title">Licence</div>
          <div class="md-detail-row"><span class="md-label">Durée</span><span class="md-value">{{ ${s}.dureeDeLicence || '-' }}</span></div>
          <div class="md-detail-divider"></div>
          <div class="md-detail-section-title">Licences</div>
          <motion *ngFor="let lic of ${s}.licences" class="licence-block">
            <div class="md-detail-row"><span class="md-label">Licence</span><span class="md-value">{{ lic.nomDesLicences }}</span></div>
            <div class="md-detail-row"><span class="md-label">Quantité</span><span class="md-value">{{ lic.quantite }}</span></div>
            <div class="md-detail-row"><span class="md-label">Expiration</span><span class="md-value">{{ lic.dateEx | date:'dd/MM/yyyy' }}</span></div>
          </div>
          <div class="md-detail-divider"></div>
          ${contactDetail(p)}`;
}

function equipmentDetailBody(p) {
  const s = p.selected;
  const serial = p.serialField;
  return `
          <div class="md-detail-section-title">Équipement</div>
          <div class="md-detail-row"><span class="md-label">Nom du boîtier</span><span class="md-value">{{ ${s}.nomDuBoitier || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Numéro de série</span><span class="md-value">{{ ${s}.${serial} || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Durée de licence</span><span class="md-value">{{ ${s}.dureeDeLicence || '-' }}</span></div>
          <div class="md-detail-divider"></motion>
          <div class="md-detail-section-title">Licences</div>
          <div *ngFor="let lic of ${s}.licences" class="licence-block">
            <div class="md-detail-row"><span class="md-label">Licence</span><span class="md-value">{{ lic.nomDesLicences }}</span></div>
            <div class="md-detail-row"><span class="md-label">Quantité</span><span class="md-value">{{ lic.quantite }}</span></div>
            <div class="md-detail-row"><span class="md-label">Expiration</span><span class="md-value">{{ lic.dateEx | date:'dd/MM/yyyy' }}</span></div>
          </div>
          <div class="md-detail-divider"></div>
          ${contactDetail(p)}`;
}

function esetDetailBody() {
  return `
          <div class="md-detail-section-title">Informations licence</div>
          <div class="md-detail-row"><span class="md-label">Produit</span>
            <span class="md-value"><span class="md-badge md-badge-orange">{{ getProductName(selectedEset.nom_produit) }}</span></span>
          </div>
          <div class="md-detail-row"><span class="md-label">Identifiant</span><span class="md-value">{{ selectedEset.identifiant || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Clé de licence</span><span class="md-value">{{ selectedEset.cle_de_Licence || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Durée</span><span class="md-value">{{ selectedEset.dureeDeLicence || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Date d'expiration</span><span class="md-value">{{ selectedEset.dateEx | date:'dd/MM/yyyy' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Type d'achat</span><span class="md-value">{{ getTypeAchatName(selectedEset.typeAchat) }}</span></div>
          <div class="md-detail-row"><span class="md-label">Nombre</span><span class="md-value">{{ selectedEset.nombre }}</span></div>
          <div class="md-detail-row"><span class="md-label">Sous contrat</span>
            <span class="md-value"><span [class]="selectedEset.sousContrat ? 'md-badge md-badge-green' : 'md-badge md-badge-gray'">{{ selectedEset.sousContrat ? 'Oui' : 'Non' }}</span></span>
          </div>
          <div class="md-detail-row"><span class="md-label">Commande par</span><span class="md-value">{{ getCommandePasserParLabel(selectedEset.commandePasserPar) || '-' }}</span></div>
          <div class="md-detail-divider"></div>
          <div class="md-detail-section-title">Vis-à-vis client</div>
          <motion class="md-detail-row"><span class="md-label">Vis-à-vis client</span><span class="md-value">{{ selectedEset.nom_contact || '-' }}</span></div>
          <motion class="md-detail-row"><span class="md-label">N° téléphone</span><span class="md-value">{{ selectedEset.nmb_tlf || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Email client</span><span class="md-value">{{ selectedEset.mail || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Email commercial</span><span class="md-value">{{ selectedEset.mailAdmin || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">CC Mail</span><span class="md-value">{{ selectedEset.ccMail?.join(', ') || '-' }}</span></div>
          <div class="md-detail-row"><span class="md-label">Remarque</span><span class="md-value">{{ selectedEset.remarque || '-' }}</span></div>
          <div class="md-detail-row" *ngIf="selectedEset.fichier">
            <span class="md-label">Fichier</span>
            <span class="md-value">
              <a [href]="getFileDownloadUrl(selectedEset.esetid)" target="_blank" class="btn btn-sm btn-outline-primary">
                <i class="fa fa-download"></i> {{ selectedEset.fichierOriginalName || 'Télécharger' }}
              </a>
            </span>
          </div>
          <div class="md-detail-divider"></div>
          <div class="md-detail-actions">
            <button class="btn btn-sm btn-warning" (click)="desapprouve(selectedEset.esetid)" title="Désexpirer">
              <i class="fas fa-times-circle"></i> Désexpirer
            </button>
          </div>`;
}

function masterSummary(p) {
  if (p.type === 'eset') {
    return `
              <span class="md-field"><strong>Identifiant :</strong> {{ eset.identifiant || '-' }}</span>
              <span class="md-field"><strong>Clé :</strong> {{ eset.cle_de_Licence || '-' }}</span>
              <span class="md-field"><strong>Produit :</strong> {{ getProductName(eset.nom_produit) }}</span>
              <span class="md-field"><strong>Expiration :</strong> {{ eset.dateEx | date:'dd/MM/yyyy' }}</span>`;
  }
  if (p.type === 'equipment') {
    const serial = p.serialField;
    return `
              <span class="md-field"><strong>Boîtier :</strong> {{ ${p.entity}.nomDuBoitier || '-' }}</span>
              <span class="md-field"><strong>N° série :</strong> {{ ${p.entity}.${serial} || '-' }}</span>
              <span class="md-field"><strong>Durée :</strong> {{ ${p.entity}.dureeDeLicence || '-' }}</span>
              <span *ngFor="let lic of ${p.entity}.licences" class="md-field">
                <strong>{{ lic.nomDesLicences }} :</strong> expire {{ lic.dateEx | date:'dd/MM/yyyy' }}
              </span>`;
  }
  return `
              <span class="md-field"><strong>Durée :</strong> {{ ${p.entity}.dureeDeLicence || '-' }}</span>
              <span *ngFor="let lic of ${p.entity}.licences" class="md-field">
                <strong>{{ lic.nomDesLicences }} :</strong> expire {{ lic.dateEx | date:'dd/MM/yyyy' }}
              </span>`;
}

function activeClass(p) {
  if (p.type === 'eset') return 'selectedEset?.esetid === eset.esetid';
  return `${p.selected}?.${p.idField} === ${p.entity}.${p.idField}`;
}

function buildHtml(p) {
  let body;
  if (p.type === 'eset') body = esetDetailBody();
  else if (p.type === 'equipment') body = equipmentDetailBody(p);
  else body = standardDetailBody(p);

  const html = `<div class="master-detail-container">
  <div class="header-row">
    <h2>Licences Expirées ${p.title}</h2>
    <div class="action-group">
      <motion class="input-group search-box">
        <input type="text" class="form-control" placeholder="Rechercher..."
          [(ngModel)]="searchTerm" (input)="onSearch()" />
      </div>
    </div>
  </div>

  <div class="md-layout" [class.detail-open]="${p.selected}">
    <div class="md-master">
      <div class="md-list">
        <div *ngFor="let ${p.entity} of ${p.paged}" class="md-item"
          [class.md-item-active]="${activeClass(p)}"
          (click)="${p.selectFn}(${p.entity})">
          <div class="md-item-info">
            <div class="md-item-client">{{ ${p.entity}.client }}</div>
            <div class="md-item-fields">${masterSummary(p)}
            </div>
          </div>
          <div class="md-item-actions" (click)="$event.stopPropagation()">
            <button class="md-btn-icon md-btn-view" (click)="${p.selectFn}(${p.entity})" title="Voir détails">
              <i class="fas fa-eye"></i>
            </button>
            <button class="md-btn-icon md-btn-unapprove" (click)="desapprouve(${p.entity}.${p.idField})" title="Désexpirer">
              <i class="fas fa-times-circle"></i>
            </button>
          </motion>
        </motion>
        <div *ngIf="${p.paged}.length === 0" class="md-empty">
          <i class="fas fa-folder-open"></i>
          <p>${p.emptyMsg}</p>
        </motion>
      </div>
      <div class="md-pagination" *ngIf="totalPages > 1">
        <button *ngFor="let page of pageNumbers; let i = index" (click)="changePage(i)"
          [class.active]="i === currentPage" class="btn btn-sm btn-outline-primary mx-1">
          {{ i + 1 }}
        </button>
      </div>
    </div>

    <div class="md-detail" *ngIf="${p.selected}">
      <div class="md-detail-card">
        <div class="md-detail-header">
          <h4>{{ ${p.selected}.client }}</h4>
          <button class="md-detail-close" (click)="closeDetail()">&times;</button>
        </div>
        <div class="md-detail-body">${body}
        </div>
      </div>
    </motion>
  </div>
</div>`;

  return html.replace(/<\/?motion>/g, (tag) => {
    if (tag === '<motion>') return '<div>';
    if (tag === '</motion>') return '</div>';
    return tag;
  });
}

function patchTs(tsPath, p) {
  let content = fs.readFileSync(tsPath, 'utf8');
  const typeMatch = content.match(/:\s*(\w+)\[\]\s*=\s*\[\]/);
  const typeName = typeMatch ? typeMatch[1] : 'any';

  if (!content.includes(`${p.selected}:`)) {
    content = content.replace(
      /searchTerm: string = '';/,
      `searchTerm: string = '';\n  ${p.selected}: ${typeName} | null = null;`
    );
  }

  if (!content.includes(`${p.selectFn}(`)) {
    const block = `
  ${p.selectFn}(item: ${typeName}): void {
    this.${p.selected} = item;
  }

  closeDetail(): void {
    this.${p.selected} = null;
  }
`;
    content = content.replace(/\n  desapprouve\(/, `${block}\n  desapprouve(`);
  }

  if (!content.includes(`this.${p.selected}?.${p.idField} === id`)) {
    content = content.replace(
      /(desapprouve\(id: number\): void \{\s*\n\s*this\.\w+Service\.activate\(id\)\.subscribe\(\(\) => \{)/,
      `$1\n      if (this.${p.selected}?.${p.idField} === id) {\n        this.${p.selected} = null;\n      }`
    );
  }

  fs.writeFileSync(tsPath, content);
}

products.forEach((p) => {
  const name = path.basename(p.folder);
  const base = path.join(appRoot, p.folder);
  fs.writeFileSync(path.join(base, `${name}.component.html`), buildHtml(p));
  patchTs(path.join(base, `${name}.component.ts`), p);
  fs.writeFileSync(path.join(base, `${name}.component.scss`), "@import '../../shared/styles/master-detail-layout.scss';\n");
  console.log('OK', p.folder);
});

console.log('Done', products.length);
