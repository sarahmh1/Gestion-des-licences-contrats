/**
 * Ajoute AppValidators sur numero / quantite dans les formulaires licences.
 */
const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..', 'light-bootstrap-dashboard-angular2-master', 'src', 'app');

const IMPORT_LINE = "import { AppValidators } from 'app/shared/validators/app-validators';";

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (name !== 'node_modules') walk(p, files);
    } else if (name.endsWith('.component.ts')) {
      files.push(p);
    }
  }
  return files;
}

function ensureImport(content) {
  if (content.includes('AppValidators')) return content;
  const m = content.match(/import\s*\{[^}]+\}\s*from\s*'@angular\/forms';/);
  if (m) {
    return content.replace(m[0], m[0] + '\n' + IMPORT_LINE);
  }
  return IMPORT_LINE + '\n' + content;
}

function patchTs(file) {
  let c = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (c.includes("numero: ['']") || c.includes('quantite:') && c.includes('Validators.required')) {
    const before = c;
    c = c.replace(/numero:\s*\[''\]/g, "numero: ['', AppValidators.optionalPhone]");
    c = c.replace(
      /quantite:\s*\['',\s*Validators\.required\]/g,
      "quantite: ['', AppValidators.requiredQuantity]"
    );
    c = c.replace(
      /quantite:\s*\[([^\]]+),\s*Validators\.required\]/g,
      'quantite: [$1, AppValidators.requiredQuantity]'
    );
    if (c !== before) changed = true;
  }

  if (changed) {
    c = ensureImport(c);
    fs.writeFileSync(file, c);
    console.log('TS:', path.relative(appRoot, file));
  }
}

function getFormName(tsPath) {
  const c = fs.readFileSync(tsPath, 'utf8');
  const m = c.match(/this\.(\w+)\s*=\s*this\.fb\.group\s*\(/);
  return m ? m[1] : null;
}

function patchHtml(htmlPath, formName) {
  let h = fs.readFileSync(htmlPath, 'utf8');
  let changed = false;

  if (h.includes('formControlName="numero"') && !h.includes('app-field-error') && formName) {
    const numeroRe = /(<input[^>]*formControlName="numero"[^>]*)(\/?>)/gi;
    h = h.replace(numeroRe, (match, start, end) => {
      if (start.includes('appNumbersOnly')) return match;
      changed = true;
      let tag = start;
      if (!tag.includes('appNumbersOnly')) tag += ' appNumbersOnly maxlength="8"';
      if (!tag.includes('is-invalid')) {
        tag += ` [class.is-invalid]="${formName}.get('numero')?.invalid && ${formName}.get('numero')?.touched"`;
      }
      return (
        tag +
        end +
        `\n      <app-field-error [control]="${formName}.get('numero')" field="phone"></app-field-error>`
      );
    });
  }

  if (h.includes('formControlName="quantite"') && formName) {
    const qRe = /(<input[^>]*formControlName="quantite"[^>]*)(\/?>)/gi;
    h = h.replace(qRe, (match, start, end) => {
      if (start.includes('appNumbersOnly')) return match;
      changed = true;
      let tag = start;
      if (!tag.includes('appNumbersOnly')) tag += ' appNumbersOnly';
      if (!tag.includes('is-invalid') && h.includes('let i = index')) {
        tag += ` [class.is-invalid]="licences.at(i).get('quantite')?.invalid && licences.at(i).get('quantite')?.touched"`;
      }
      const errBlock = h.includes('let i = index')
        ? `\n        <app-field-error [control]="licences.at(i).get('quantite')" field="quantity"></app-field-error>`
        : `\n      <app-field-error [control]="${formName}.get('quantite')" field="quantity"></app-field-error>`;
      if (h.includes('licences.at(i).get(\'quantite\')') && match.includes('app-field-error')) return match;
      return tag + end + errBlock;
    });
  }

  if (changed) {
    fs.writeFileSync(htmlPath, h);
    console.log('HTML:', path.relative(appRoot, htmlPath));
  }
}

const tsFiles = walk(appRoot);
for (const ts of tsFiles) {
  patchTs(ts);
  const html = ts.replace('.component.ts', '.component.html');
  if (fs.existsSync(html)) {
    const formName = getFormName(ts);
    if (formName) patchHtml(html, formName);
  }
}

console.log('Done.');
