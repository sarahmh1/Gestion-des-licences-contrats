/**
 * Bouton Ajouter/Enregistrer toujours cliquable ; erreurs affichées au clic (markAllAsTouched).
 */
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.html') || name.endsWith('.ts')) files.push(p);
  }
  return files;
}

function patchHtml(html) {
  return html
    .replace(/\s*\[disabled\]="!?[\w]+Form\.invalid"/g, '')
    .replace(/\s*\[disabled\]="updateForm\.invalid"/g, '')
    .replace(/\s*\[disabled\]="contratForm\.invalid"/g, '')
    .replace(/\s*\[disabled\]="PaloForm\.invalid"/g, '')
    .replace(/\s*\[disabled\]="!productForm\.valid"/g, '');
}

function patchTs(ts) {
  let out = ts;
  out = out.replace(
    /if\s*\(\s*!this\.updateForm\.valid([^)]*)\)\s*\{\s*return;/g,
    (m, rest) => {
      if (m.includes('markAllAsTouched')) return m;
      return `if (!this.updateForm.valid${rest}) {\n      this.updateForm.markAllAsTouched();\n      return;`;
    }
  );
  return out;
}

let htmlN = 0;
let tsN = 0;

for (const file of walk(appDir)) {
  if (file.endsWith('.html')) {
    const orig = fs.readFileSync(file, 'utf8');
    const next = patchHtml(orig);
    if (next !== orig) {
      fs.writeFileSync(file, next, 'utf8');
      htmlN++;
    }
  }
  if (file.endsWith('.ts') && (file.includes('update') || file.includes('ajouter') || file.includes('products.component'))) {
    const orig = fs.readFileSync(file, 'utf8');
    let next = patchTs(orig);
    if (next !== orig) {
      fs.writeFileSync(file, next, 'utf8');
      tsN++;
      console.log('ts:', path.relative(appDir, file));
    }
  }
}

console.log('HTML files:', htmlN, 'TS files:', tsN);
