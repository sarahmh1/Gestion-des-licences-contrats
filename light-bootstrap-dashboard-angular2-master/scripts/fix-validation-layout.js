/**
 * - Retire appNumbersOnly des champs quantite (saisie libre + message rouge)
 * - Enveloppe quantite + app-field-error dans .licence-field-stack
 * - Enveloppe numero + app-field-error dans .form-field-stack
 * - align-items-end -> align-items-start sur les lignes licences (update)
 */
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      walk(p, files);
    } else if (name.endsWith('.html')) {
      files.push(p);
    }
  }
  return files;
}

function stripNumbersOnlyFromQuantite(html) {
  return html.replace(
    /<input([^>]*formControlName="quantite"[^>]*)\/?>/gi,
    (match, attrs) => {
      let a = attrs
        .replace(/\s*appNumbersOnly\b/g, '')
        .replace(/\s*\[appNumbersOnlyBlock\]="[^"]*"/g, '')
        .replace(/\s*appNumbersOnlyBlock="[^"]*"/g, '');
      return `<input${a}>`;
    }
  );
}

function wrapQuantiteWithStack(html) {
  if (html.includes('licence-field-stack')) {
    return html;
  }
  return html.replace(
    /(<input[\s\S]*?formControlName="quantite"[\s\S]*?>)\s*(<app-field-error[\s\S]*?field="quantity"[\s\S]*?(?:\/>|<\/app-field-error>))/gi,
    (_, input, err) =>
      `<div class="licence-field-stack">\n        ${input.trim()}\n        ${err.trim()}\n        </div>`
  );
}

function wrapNumeroWithStack(html) {
  return html.replace(
    /(<input[^>]*formControlName="numero"[^>]*>)\s*(<app-field-error[^>]*field="phone"[^>]*><\/app-field-error>)/gi,
    (full, input, err) => {
      if (full.includes('form-field-stack')) {
        return full;
      }
      return `<div class="form-field-stack">\n      ${input}\n      ${err}\n      </div>`;
    }
  ).replace(
    /(<input[\s\S]*?formControlName="numero"[\s\S]*?>)\s*(<app-field-error[\s\S]*?field="phone"[\s\S]*?(?:\/>|<\/app-field-error>))/gi,
    (full, input, err) => {
      if (full.includes('form-field-stack')) {
        return full;
      }
      return `<div class="form-field-stack">\n      ${input.trim()}\n      ${err.trim()}\n      </div>`;
    }
  );
}

function fixAlignItems(html) {
  return html.replace(
    /class="([^"]*)\balign-items-end\b([^"]*)"/g,
    (m, before, after) => {
      if (!m.includes('lic') && !m.includes('licence') && !m.includes('Licence')) {
        return m;
      }
      const cls = `${before}align-items-start${after}`.replace(/\s+/g, ' ').trim();
      return `class="${cls}"`;
    }
  );
}

let changed = 0;
for (const file of walk(appDir)) {
  let html = fs.readFileSync(file, 'utf8');
  const orig = html;
  html = stripNumbersOnlyFromQuantite(html);
  html = wrapQuantiteWithStack(html);
  if (html.includes('formControlName="numero"') && html.includes('field="phone"')) {
    html = wrapNumeroWithStack(html);
  }
  html = fixAlignItems(html);
  if (html !== orig) {
    fs.writeFileSync(file, html, 'utf8');
    changed++;
    console.log('updated:', path.relative(appDir, file));
  }
}
console.log('Done. Files updated:', changed);
