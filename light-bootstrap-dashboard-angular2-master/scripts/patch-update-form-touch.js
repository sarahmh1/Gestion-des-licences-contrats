const fs = require('fs');
const path = require('path');

const files = [
  'Crowdstrike/updatecr/updatecr.component.ts',
  'Cisco/updatec/updatec.component.ts',
  'Imperva/updateim/updateim.component.ts',
  'MicrosoftO365/updatem/updatem.component.ts',
  'Palo/update-palo/update-palo.component.ts',
  'Profpoint/update-proofpoint/update-proofpoint.component.ts',
  'Rapid7/update-rapid7/update-rapid7.component.ts',
  'VMware/updatev/updatev.component.ts',
  'Wallix/updatew/update-wallix.component.ts',
];

const root = path.join(__dirname, '..', 'src', 'app');

for (const rel of files) {
  const file = path.join(root, rel);
  let ts = fs.readFileSync(file, 'utf8');
  const orig = ts;

  ts = ts.replace(
    /if \(this\.updateForm\.valid\) \{\s*\n(\s*const )/g,
    'if (!this.updateForm.valid) {\n      this.updateForm.markAllAsTouched();\n      return;\n    }\n\n    $1'
  );

  ts = ts.replace(
    /\}\s*else \{\s*console\.error\([^)]*\)[^}]*\}/g,
    ''
  );

  ts = ts.replace(
    /\}\s*else \{\s*window\.alert\([^)]*\);\s*\}/g,
    ''
  );

  if (ts !== orig) {
    fs.writeFileSync(file, ts, 'utf8');
    console.log('patched', rel);
  }
}
