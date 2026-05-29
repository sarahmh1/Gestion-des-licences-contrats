/**
 * Corrige les enveloppes licence-field-stack cassées par fix-validation-layout.js
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

function repair(html) {
  let out = html;

  // 1) Stack englobe nom + quantite -> ne garder que quantite + erreur
  out = out.replace(
    /<div class="licence-field-stack">\s*(<input[\s\S]*?formControlName="nomDesLicences"[\s\S]*?>)\s*(<input[\s\S]*?formControlName="quantite"[\s\S]*?>)\s*(<app-field-error[\s\S]*?field="quantity"[\s\S]*?(?:\/>|<\/app-field-error>))\s*<\/div>/gi,
    '$1\n        <div class="licence-field-stack">\n        $2\n        $3\n        </div>'
  );

  // 2) col bootstrap : stack autour du nom seulement
  out = out.replace(
    /(<div class="col-md-\d+">\s*<label[^>]*>[\s\S]*?<\/label>\s*)<div class="licence-field-stack">\s*(<input[\s\S]*?formControlName="nomDesLicences"[\s\S]*?>)\s*<\/div>\s*<\/div>/gi,
    '$1$2\n    </div>'
  );

  // 3) quantite + erreur + </div> orphelin avant date (sans opening stack)
  out = out.replace(
    /(?<!<div class="licence-field-stack">\s*\n?\s*)(<input[\s\S]*?formControlName="quantite"[\s\S]*?>)\s*(<app-field-error[\s\S]*?field="quantity"[\s\S]*?(?:\/>|<\/app-field-error>))\s*<\/div>(?=\s*<input[\s\S]*?formControlName="dateEx")/gi,
    '<div class="licence-field-stack">\n        $1\n        $2\n        </div>'
  );

  // 4) col quantite : erreur + </div> orphelin (pas de stack ouvert)
  out = out.replace(
    /(<div class="col-md-\d+">\s*<label[^>]*>[\s\S]*?quantit[\s\S]*?<\/label>\s*)(?!<div class="licence-field-stack">)(<input[\s\S]*?formControlName="quantite"[\s\S]*?>)\s*(<app-field-error[\s\S]*?field="quantity"[\s\S]*?(?:\/>|<\/app-field-error>))\s*<\/div>\s*<\/div>/gi,
    '$1<div class="licence-field-stack">\n      $2\n      $3\n      </div>\n    </div>'
  );

  // 5) double stack (nom dans un stack puis quantite dans un autre)
  out = out.replace(
    /<div class="licence-field-stack">\s*(<input[\s\S]*?formControlName="nomDesLicences"[\s\S]*?>)\s*<div class="licence-field-stack">/gi,
    '$1\n        <div class="licence-field-stack">'
  );

  // 6) col quantite : fermer stack + colonne avant la colonne date
  out = out.replace(
    /(<div class="col-md-\d+">\s*<label[^>]*>[\s\S]*?quantit[\s\S]*?<\/label>\s*<div class="licence-field-stack">[\s\S]*?field="quantity"[\s\S]*?(?:\/>|<\/app-field-error>))\s*<\/div>\s*(<div class="col-md-\d+">\s*<label[^>]*>[\s\S]*?Date)/gi,
    '$1\n      </div>\n    </div>\n    $2'
  );

  // 7) stacks ouverts en double consécutifs
  out = out.replace(/(?:<div class="licence-field-stack">\s*){2,}/gi, '<div class="licence-field-stack">\n        ');

  return out;
}

let changed = 0;
for (const file of walk(appDir)) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('formControlName="quantite"')) {
    continue;
  }
  const fixed = repair(html);
  if (fixed !== html) {
    fs.writeFileSync(file, fixed, 'utf8');
    changed++;
    console.log('repaired:', path.relative(appDir, file));
  }
}
console.log('Repaired files:', changed);
