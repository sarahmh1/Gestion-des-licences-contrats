const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..', 'light-bootstrap-dashboard-angular2-master', 'src', 'app');
const IMPORT_LINE = "import { AppValidators } from 'app/shared/validators/app-validators';";

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.ts')) files.push(p);
  }
  return files;
}

for (const file of walk(appRoot)) {
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('AppValidators') || c.includes("from 'app/shared/validators/app-validators'")) continue;
  const m = c.match(/import\s*\{[^}]+\}\s*from\s*'@angular\/forms';/);
  if (m) {
    c = c.replace(m[0], m[0] + '\n' + IMPORT_LINE);
  } else {
    c = IMPORT_LINE + '\n' + c;
  }
  fs.writeFileSync(file, c);
  console.log('Import:', path.relative(appRoot, file));
}

console.log('Done.');
