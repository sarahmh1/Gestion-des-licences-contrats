const fs = require('fs');
const path = require('path');

const filesToFix = [
    'Alwarebytes/affichera/affichera.component.ts',
    'Bitdefender/afficherb/afficherb.component.ts',
    'Crowdstrike/affichercr/affichercr.component.ts',
    'Fortra/afficherfortra/afficherfortra.component.ts',
    'F5/afficherf/afficherf.component.ts',
    'Imperva/afficherim/afficherim.component.ts',
    'Infoblox/afficheri/afficheri.component.ts',
    'MicrosoftO365/afficherm/afficherm.component.ts',
    'Netskope/affichern/affichern.component.ts',
    'OneIdentity/affichero/affichero.component.ts',
    'Profpoint/afficher-proofpoint/afficher-proofpoint.component.ts',
    'Rapid7/afficher-rapid7/afficher-rapid7.component.ts',
    'SecPoint/affichers/affichers.component.ts',
    'SentineIOne/affichers/affichers.component.ts',
    'Splunk/afficher-splunk/afficher-splunk.component.ts',
    'User/user.component.ts',
    'VMware/afficherv/afficherv.component.ts',
    'Varonis/affichervr/affichervr.component.ts',
    'Wallix/afficherw/afficherw.component.ts'
];

const basePath = path.join(__dirname, 'light-bootstrap-dashboard-angular2-master', 'src', 'app');

for(const rel of filesToFix) {
    const fullPath = path.join(basePath, rel);
    if(!fs.existsSync(fullPath)) {
        console.log('Not found:', fullPath);
        continue;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    
    // 1. Ajouter l'import si manquant
    if (!content.includes('PermissionService')) {
        const lastImportIndex = content.lastIndexOf('import ');
        const endOfLastImport = content.indexOf(';', lastImportIndex) + 1;
        const importStatement = "\nimport { PermissionService } from 'app/Services/permission.service';";
        
        if (lastImportIndex !== -1) {
            content = content.substring(0, endOfLastImport) + importStatement + content.substring(endOfLastImport);
            changed = true;
        }
    }
    
    // 2. Injecter dans le constructor
    if (content.includes('constructor(')) {
        if (!content.includes('public permissionService')) {
            content = content.replace(/constructor\s*\(([^)]*)\)/, (match, p1) => {
                const params = p1.trim();
                if (params.length === 0) {
                    return `constructor(public permissionService: PermissionService)`;
                } else {
                    return `constructor(${params}, public permissionService: PermissionService)`;
                }
            });
            changed = true;
        }
    } else {
        // Pas de constructeur du tout
        const classMatch = content.match(/export class [a-zA-Z0-9_]+(?: implements [a-zA-Z0-9_, ]+)?\s*{/);
        if (classMatch) {
            const insertPos = classMatch.index + classMatch[0].length;
            content = content.substring(0, insertPos) + "\n  constructor(public permissionService: PermissionService) {}\n" + content.substring(insertPos);
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed TS file:', rel);
    }
}
