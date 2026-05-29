/**
 * Affiche "Ce champ est obligatoire." via app-field-error sur les champs requis des produits.
 */
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');
const SKIP_DIRS = new Set(['node_modules', 'assets']);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.html') || name.endsWith('.ts')) files.push(p);
  }
  return files;
}

function patchHtml(html) {
  let out = html;

  // Ancien message obligatoire -> app-field-error
  out = out.replace(
    /<div \*ngIf="(\w+)\.get\('([^']+)'\)\?\.touched && \1\.get\('\2'\)\?\.invalid" class="text-danger">\s*Ce champ est obligatoire\.?\s*<\/div>/gi,
    '<app-field-error [control]="$1.get(\'$2\')"></app-field-error>'
  );

  // commandePasserPar : erreur sous le select si absent
  out = out.replace(
    /(<select[^>]*formControlName="commandePasserPar"[^>]*>[\s\S]*?<\/select>)(\s*)(?![\s\S]{0,120}app-field-error[^\n]*commandePasserPar)/gi,
    (m, select, sp) => {
      const formMatch = out.match(/\[formGroup\]="(\w+)"/);
      const form = formMatch ? formMatch[1] : 'updateForm';
      if (m.includes('app-field-error')) return m;
      return `${select}${sp}<app-field-error [control]="${form}.get('commandePasserPar')"></app-field-error>`;
    }
  );

  // client (searchable select) : après le composant si pas déjà d'erreur client
  out = out.replace(
    /(<app-searchable-client-select[^>]*formControlName="client"[^>]*><\/app-searchable-client-select>)(\s*)(?![\s\S]{0,200}app-field-error[^\n]*\.get\('client'\))/gi,
    (m, sel, sp) => {
      if (m.includes('app-field-error')) return m;
      const formMatch = out.match(/\[formGroup\]="(\w+)"/);
      const form = formMatch ? formMatch[1] : 'updateForm';
      return `${sel}${sp}<app-field-error [control]="${form}.get('client')"></app-field-error>`;
    }
  );

  const wrapLicenceInput = (controlName, fieldKind = '') => {
    const fieldAttr = fieldKind ? ` field="${fieldKind}"` : '';
    const invalidAttr = `[class.is-invalid]="licences.at(i).get('${controlName}')?.invalid && (licences.at(i).get('${controlName}')?.dirty || licences.at(i).get('${controlName}')?.touched)"`;
    const errTag = `<app-field-error [control]="licences.at(i).get('${controlName}')"${fieldAttr}></app-field-error>`;

    out = out.replace(
      new RegExp(
        `<div class="licence-field-stack">\\s*<input[^>]*formControlName="${controlName}"`,
        'g'
      ),
      `__ALREADY_STACK_${controlName}__`
    );

    out = out.replace(
      new RegExp(`(<input[^>]*formControlName="${controlName}"[^>]*)(\\s*\\/?>)`, 'gi'),
      (full, attrs, close) => {
        if (full.includes('__ALREADY_STACK_') || full.includes('is-invalid')) return full;
        const pos = out.indexOf(full);
        const ctx = out.slice(Math.max(0, pos - 80), pos + full.length + 200);
        if (ctx.includes(errTag) || ctx.includes(`get('${controlName}')"`)) return full;
        if (!out.includes('formArrayName="licences"') && !out.includes("formArrayName='licences'")) {
          return full;
        }
        return `<div class="licence-field-stack"><input${attrs} ${invalidAttr}${close}${errTag}</div>`;
      }
    );

    out = out.replace(new RegExp(`__ALREADY_STACK_${controlName}__`, 'g'), `<div class="licence-field-stack">\n        <input`);
  };

  if (out.includes('formControlName="nomDesLicences"')) {
    wrapLicenceInput('nomDesLicences');
  }
  if (out.includes('formControlName="dateEx"')) {
    wrapLicenceInput('dateEx');
  }

  // quantite : is-invalid si manquant (déjà souvent présent)
  out = out.replace(
    /(<input[^>]*formControlName="quantite"[^>]*)(?![^>]*\[class\.is-invalid\])([^>]*\/?>)/gi,
    '$1 [class.is-invalid]="licences.at(i).get(\'quantite\')?.invalid && (licences.at(i).get(\'quantite\')?.dirty || licences.at(i).get(\'quantite\')?.touched)"$2'
  );

  return out;
}

function patchTs(html, ts) {
  let out = ts;
  out = out.replace(
    /if\s*\(\s*!?\s*this\.(\w+)\.(valid|invalid)\s*\)\s*\{(\s*)(?!.*markAllAsTouched)([\s\S]*?(?:window\.alert|return)[\s\S]*?)\}/g,
    (m, form, validProp, sp1, body) => {
      if (body.includes('markAllAsTouched')) return m;
      if (!body.includes('invalide') && !body.includes('invalid') && validProp === 'invalid') {
        // only patch when block handles invalid submit
      }
      if (validProp === 'valid' && !body.includes('invalide')) return m;
      return `if (!this.${form}.valid) {${sp1}this.${form}.markAllAsTouched();${body}}`;
    }
  );
  // Fix double negation if we created if (!form.valid) from if (form.valid)
  return out;
}

function patchTsSimple(ts) {
  let out = ts;
  const patterns = [
    [/if\s*\(\s*!this\.(\w+)\.valid\s*\)\s*\{(\s*)window\.alert\('Le formulaire est invalide[^']*'\);(\s*)return;\s*\}/g,
      "if (!this.$1.valid) {$2this.$1.markAllAsTouched();$2window.alert('Le formulaire est invalide. Veuillez corriger les erreurs.');$3return;$3}"],
    [/if\s*\(\s*this\.(\w+)\.invalid\s*\)\s*\{(\s*)return;/g,
      'if (this.$1.invalid) {$2this.$1.markAllAsTouched();$2return;'],
  ];
  for (const [re, rep] of patterns) {
    out = out.replace(re, (m, ...args) => {
      if (m.includes('markAllAsTouched')) return m;
      return typeof rep === 'string' ? rep.replace(/\$(\d+)/g, (_, n) => args[Number(n) - 1] ?? '') : rep;
    });
  }
  return out;
}

let htmlCount = 0;
let tsCount = 0;

for (const file of walk(appDir)) {
  if (file.endsWith('.html') && (file.includes('ajouter') || file.includes('update') || file.includes('products') || file.includes('Contrat') || file.includes('Eset'))) {
    const orig = fs.readFileSync(file, 'utf8');
    const patched = patchHtml(orig);
    if (patched !== orig) {
      fs.writeFileSync(file, patched, 'utf8');
      htmlCount++;
      console.log('html:', path.relative(appDir, file));
    }
  }
  if (file.endsWith('.ts') && (file.includes('ajouter') || file.includes('update') || file.includes('products.component'))) {
    const orig = fs.readFileSync(file, 'utf8');
    const patched = patchTsSimple(orig);
    if (patched !== orig) {
      fs.writeFileSync(file, patched, 'utf8');
      tsCount++;
      console.log('ts:', path.relative(appDir, file));
    }
  }
}

console.log('Done. HTML:', htmlCount, 'TS:', tsCount);
