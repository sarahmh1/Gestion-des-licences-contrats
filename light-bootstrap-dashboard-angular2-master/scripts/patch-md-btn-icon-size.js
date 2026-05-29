/**
 * Align .md-btn-icon sizes with ESET (32px, font-size 0.9rem).
 */
const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..', 'src', 'app');

const canonical = `.md-btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;

  i {
    font-size: 0.9rem;
    line-height: 1;
  }

  &:hover {
    opacity: 0.8;
  }
}`;

function replaceMdBtnIconBlocks(content) {
  const marker = '.md-btn-icon';
  let result = '';
  let index = 0;

  while (true) {
    const start = content.indexOf(marker, index);
    if (start === -1) {
      result += content.slice(index);
      break;
    }

    result += content.slice(index, start);
    const braceStart = content.indexOf('{', start);
    if (braceStart === -1) {
      result += content.slice(start);
      break;
    }

    let depth = 0;
    let end = braceStart;
    for (; end < content.length; end++) {
      const ch = content[end];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          end++;
          break;
        }
      }
    }

    result += canonical;
    index = end;
  }

  return result;
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name !== 'node_modules') walk(full, files);
    } else if (name.endsWith('.scss')) {
      const text = fs.readFileSync(full, 'utf8');
      if (text.includes('.md-btn-icon')) files.push(full);
    }
  }
  return files;
}

let count = 0;
for (const file of walk(appRoot)) {
  const content = fs.readFileSync(file, 'utf8');
  const next = replaceMdBtnIconBlocks(content);
  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log('Updated', path.relative(appRoot, file));
    count++;
  }
}

console.log('Done:', count, 'files');
