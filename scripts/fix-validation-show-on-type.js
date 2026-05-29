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
    /\.invalid\s*&&\s*([^?]+)\?\.touched/g,
    '.invalid && ($1?.dirty || $1?.touched)'
  );
  h = h.replace(
    /get\('([^']+)'\)\?\.invalid\s*&&\s*signupForm\.get\('([^']+)'\)\?\.touched/g,
    "get('$2')?.invalid && (signupForm.get('$2')?.dirty || signupForm.get('$2')?.touched)"
  );
  if (h !== orig) {
    fs.writeFileSync(file, h);
    console.log('Updated:', path.relative(appRoot, file));
  }
}

console.log('Done.');
