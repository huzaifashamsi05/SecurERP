const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'artifacts', 'api-server', 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add $dynamic()
  content = content.replace(/let (\w+Query) = db\.select\((.*?)\)\.from\((\w+)\);/g, 'let $1 = db.select($2).from($3).$dynamic();');
  // Add $dynamic() for q if it exists
  content = content.replace(/let q = db\.select\((.*?)\)\.from\((\w+)\);/g, 'let q = db.select($1).from($2).$dynamic();');

  // Fix req vs _req bug if any
  content = content.replace(/\(req, res\)/g, '(req, res)');

  fs.writeFileSync(filePath, content);
}
console.log('Fixed all routes');
