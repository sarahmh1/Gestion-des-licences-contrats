const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..', 'src', 'app');

const products = [
  { folder: 'Eset/expired-eset', entity: 'eset', idField: 'esetid', selectFn: 'selectEset' },
  { folder: 'Fortinet/expired-fortinet', entity: 'fortinet', idField: 'fortinetId', selectFn: 'selectFortinet' },
  { folder: 'Palo/expired-palo', entity: 'palo', idField: 'paloId', selectFn: 'selectPalo' },
  { folder: 'Varonis/expired-varonis', entity: 'varonis', idField: 'varonisId', selectFn: 'selectVaronis' },
  { folder: 'Cisco/expired-cisco', entity: 'cisco', idField: 'ciscoId', selectFn: 'selectCisco' },
  { folder: 'Imperva/expired-imperva', entity: 'imperva', idField: 'impervaId', selectFn: 'selectImperva' },
  { folder: 'MicrosoftO365/expired-microsoft-o365', entity: 'microsoftO365', idField: 'microsoftO365Id', selectFn: 'selectMicrosoftO365' },
  { folder: 'Crowdstrike/expired-crowdstrike', entity: 'crowdstrike', idField: 'crowdstrikeid', selectFn: 'selectCrowdstrike' },
  { folder: 'Infoblox/expired-infoblox', entity: 'infoblox', idField: 'infobloxId', selectFn: 'selectInfoblox' },
  { folder: 'Alwarebytes/expired-alwarebytes', entity: 'alwarebytes', idField: 'alwarebytesId', selectFn: 'selectAlwarebytes' },
  { folder: 'F5/expired-f5', entity: 'f5', idField: 'f5Id', selectFn: 'selectF5' },
  { folder: 'SentineIOne/expired-sentineione', entity: 'sentineIOne', idField: 'sentineIOneId', selectFn: 'selectSentineIOne' },
  { folder: 'Fortra/expired-fortra', entity: 'fortra', idField: 'fortraId', selectFn: 'selectFortra' },
  { folder: 'Netskope/expired-netskope', entity: 'netskope', idField: 'netskopeId', selectFn: 'selectNetskope' },
  { folder: 'Bitdefender/expired-bitdefender', entity: 'bitdefender', idField: 'bitdefenderId', selectFn: 'selectBitdefender' },
  { folder: 'OneIdentity/expired-oneidentity', entity: 'oneIdentity', idField: 'oneIdentityId', selectFn: 'selectOneIdentity' },
  { folder: 'Splunk/expired-splunk', entity: 'splunk', idField: 'splunkid', selectFn: 'selectSplunk' },
  { folder: 'VMware/expired-vmware', entity: 'vmware', idField: 'vmwareId', selectFn: 'selectVMware' },
  { folder: 'Wallix/expired-wallix', entity: 'wallix', idField: 'wallixId', selectFn: 'selectWallix' },
  { folder: 'Veeam/expired-veeam', entity: 'veeam', idField: 'veeamId', selectFn: 'selectVeeam' },
  { folder: 'Rapid7/expired-rapid7', entity: 'rapid7', idField: 'rapid7Id', selectFn: 'selectRapid7' },
  { folder: 'Profpoint/expired-proofpoint', entity: 'proofpoint', idField: 'proofpointId', selectFn: 'selectProofpoint' },
  { folder: 'SecPoint/expired-secpoint', entity: 'secPoint', idField: 'secPointId', selectFn: 'selectSecPoint' },
];

products.forEach((p) => {
  const name = path.basename(p.folder);
  const filePath = path.join(appRoot, p.folder, `${name}.component.html`);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('md-btn-unapprove')) {
    console.log('skip', p.folder);
    return;
  }

  const eyeBlock =
    `<button class="md-btn-icon md-btn-view" (click)="${p.selectFn}(${p.entity})" title="Voir détails">\n` +
    `              <i class="fas fa-eye"></i>\n` +
    `            </button>`;

  const unapproveBtn =
    `            <button class="md-btn-icon md-btn-unapprove" (click)="desapprouve(${p.entity}.${p.idField})" title="Désexpirer">\n` +
    `              <i class="fas fa-times-circle"></i>\n` +
    `            </button>`;

  if (!content.includes(eyeBlock)) {
    console.log('MISSING eye block', p.folder);
    return;
  }

  content = content.replace(eyeBlock, `${eyeBlock}\n${unapproveBtn}`);
  fs.writeFileSync(filePath, content);
  console.log('OK', p.folder);
});
