const fs = require('fs');
const path = require('path');

const routesIndex = path.join(__dirname, '../src/routes/backend/index.ts');
if (!fs.existsSync(routesIndex)) {
  console.error('Cannot find routes index at', routesIndex);
  process.exit(2);
}

const content = fs.readFileSync(routesIndex, 'utf8');
const exportLines = content.split(/\r?\n/).filter(l => l.includes("export { default as"));
if (exportLines.length === 0) {
  console.log('No exports found in', routesIndex);
  process.exit(0);
}

let allOk = true;

exportLines.forEach(line => {
  // extract path between from '...';
  const m = line.match(/from '\.?\.?\/(.*)';/);
  if (!m) {
    console.warn('Could not parse export line:', line);
    allOk = false;
    return;
  }
  const rel = m[1];
  // allow exports that point to parent folder (../)
  const baseDir = line.includes("from '../") ? path.join(__dirname, '../src/routes') : path.join(__dirname, '../src/routes/backend');
  const fileTs = path.join(baseDir, rel + '.ts');
  const fileJs = path.join(baseDir, rel + '.js');
  const exists = fs.existsSync(fileTs) || fs.existsSync(fileJs);
  if (!exists) {
    console.error('Missing route file for export:', rel, '\n  expected:', fileTs, 'or', fileJs);
    allOk = false;
    return;
  }
  const file = fs.existsSync(fileTs) ? fileTs : fileJs;
  const fcont = fs.readFileSync(file, 'utf8');
  if (!/export default router;/.test(fcont)) {
    console.error('Route file does not export default router:', file);
    allOk = false;
    return;
  }
  console.log('OK:', rel, '->', file);
});

process.exit(allOk ? 0 : 1);
