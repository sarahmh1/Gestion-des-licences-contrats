/**
 * Répare le HTML cassé par patch-required-field-errors.js
 */
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.html')) files.push(p);
  }
  return files;
}

function repair(html) {
  let out = html;

  out = out.replace(/<input<input/g, '<input');

  // "/ [class.is-invalid]=...>" ou "/>" mal placé après formControlName
  out = out.replace(
    /(formControlName="[^"]+")(?:\s*\/)?\s*\[class\.is-invalid\]="(licences\.at\(i\)\.get\('[^']+'\)[^"]+)">/g,
    '$1 [class.is-invalid]="$2" />'
  );

  out = out.replace(
    /(formControlName="[^"]+")\s*\/\s*\[class\.is-invalid\]="([^"]+)">/g,
    '$1 [class.is-invalid]="$2" />'
  );

  // Doublon is-invalid sur quantite (déjà sur la ligne input)
  out = out.replace(
    /(\[class\.is-invalid\]="licences\.at\(i\)\.get\('quantite'\)[^"]+")\s*\n\s*\/\s*\[class\.is-invalid\]="licences\.at\(i\)\.get\('quantite'\)[^"]+">/g,
    '$1\n          />'
  );

  out = out.replace(
    /(\[class\.is-invalid\]="licences\.at\(i\)\.get\('quantite'\)[^"]+")\s*\/\s*\[class\.is-invalid\]="licences\.at\(i\)\.get\('quantite'\)[^"]+">/g,
    '$1 />'
  );

  return out;
}

let n = 0;
for (const file of walk(appDir)) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<input<input') && !html.includes('/ [class.is-invalid]')) continue;
  const fixed = repair(html);
  if (fixed !== html) {
    fs.writeFileSync(file, fixed, 'utf8');
    n++;
    console.log('fixed:', path.relative(appDir, file));
  }
}
console.log('Repaired:', n);
