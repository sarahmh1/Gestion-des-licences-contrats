const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..', 'light-bootstrap-dashboard-angular2-master', 'src', 'app');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.html')) files.push(p);
  }
  return files;
}

for (const file of walk(appRoot)) {
  let h = fs.readFileSync(file, 'utf8');
  const orig = h;

  h = h.replace(
    /[ \t]*\/ appNumbersOnly maxlength="8" \[class\.is-invalid\]="([^"]+)">/g,
    '\n        appNumbersOnly maxlength="8"\n        [class.is-invalid]="$1"\n      />'
  );

  h = h.replace(
    /[ \t]*\/ appNumbersOnly \[class\.is-invalid\]="(licences\.at\(i\)\.get\('quantite'\)[^"]+)">/g,
    '\n        appNumbersOnly\n        [class.is-invalid]="$1"\n        />'
  );

  if (h !== orig) {
    fs.writeFileSync(file, h);
    console.log('Fixed:', path.relative(appRoot, file));
  }
}

console.log('Done.');
