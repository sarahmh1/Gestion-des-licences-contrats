const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('light-bootstrap-dashboard-angular2-master/src/app', function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('http://localhost:8089')) {
      if (!content.includes('environments/environment')) {
        let lines = content.split('\n');
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIdx = i;
          }
        }
        if (lastImportIdx !== -1) {
          lines.splice(lastImportIdx + 1, 0, "import { environment } from 'environments/environment';");
          content = lines.join('\n');
        } else {
          content = "import { environment } from 'environments/environment';\n" + content;
        }
      }
      
      content = content.replace(/'http:\/\/localhost:8089\/?([^']*)'/g, '`${environment.apiUrl}/$1`');
      content = content.replace(/"http:\/\/localhost:8089\/?([^"]*)"/g, '`${environment.apiUrl}/$1`');
      content = content.replace(/`http:\/\/localhost:8089\/?([^`]*)`/g, '`${environment.apiUrl}/$1`');
      content = content.replace(/http:\/\/localhost:8089/g, '${environment.apiUrl}');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});