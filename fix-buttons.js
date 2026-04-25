const fs = require('fs');
const path = require('path');

function fixHtmlFiles(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
            fixHtmlFiles(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // Target Add buttons that don't have an *ngIf check already, usually calling goToAdd... or openAdd... 
            const regex = /<button(?![^>]*\*ngIf)[^>]*\(click\)\s*=\s*"[^"]*(?:goToAdd[A-Za-z0-9_]*|openAdd[A-Za-z0-9_]*)\([^"]*"[^>]*>/g;
            
            content = content.replace(regex, match => {
                changed = true;
                // Add the angular directive right before the closing >
                return match.slice(0, -1) + ' *ngIf="permissionService.canAdd(\'licenses\')">';
            });

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed Add button in: ' + fullPath);
            }
        }
    }
}

fixHtmlFiles(path.join(__dirname, 'light-bootstrap-dashboard-angular2-master', 'src', 'app'));
