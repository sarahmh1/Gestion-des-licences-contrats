const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'light-bootstrap-dashboard-angular2-master', 'src', 'app');

function fixHtmlFiles(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
            fixHtmlFiles(fullPath);
        } else if (fullPath.endsWith('.html')) {
            const relPath = path.relative(basePath, fullPath);
            const folderName = relPath.split(path.sep)[0].toLowerCase(); // e.g. f5, eset, fortinet
            let origContent = fs.readFileSync(fullPath, 'utf8');
            let content = origContent;

            // Fix exact match of our previous ADD script
            content = content.replace(/canAdd\('licenses'\)/g, `canAddProduct('${folderName}')`);

            // Edit button injection
            content = content.replace(/(<button[^>]*\(click\)="update[A-Za-z0-9_]*\([^"]*"[^>]*>)/gi, match => {
                if (match.includes('*ngIf') || match.includes('canEditProduct')) return match;
                return match.replace(/>$/, ` *ngIf="permissionService.canEditProduct('${folderName}')">`);
            });

            // Delete button injection
            content = content.replace(/(<button[^>]*\(click\)="delete[A-Za-z0-9_]*\([^"]*"[^>]*>)/gi, match => {
                if (match.includes('*ngIf') || match.includes('canDeleteProduct')) return match;
                return match.replace(/>$/, ` *ngIf="permissionService.canDeleteProduct('${folderName}')">`);
            });

            // Approve button injection
            content = content.replace(/(<button[^>]*\(click\)="approve[A-Za-z0-9_]*\([^"]*"[^>]*>)/gi, match => {
                if (match.includes('*ngIf') || match.includes('canEditProduct')) return match;
                return match.replace(/>$/, ` *ngIf="permissionService.canEditProduct('${folderName}')">`);
            });

            if (content !== origContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed Edit/Delete/Approve in: ' + relPath);
            }
        }
    }
}

fixHtmlFiles(basePath);
