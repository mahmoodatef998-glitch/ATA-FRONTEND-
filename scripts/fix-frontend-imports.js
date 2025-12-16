/**
 * Script to fix frontend imports
 * Replace @/lib/utils with @ata-crm/shared
 */

const fs = require('fs');
const path = require('path');

function findTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.includes('node_modules')) {
      files.push(...findTsxFiles(fullPath));
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix @/lib/utils imports
  if (content.includes('@/lib/utils')) {
    content = content.replace(
      /from ["']@\/lib\/utils["']/g,
      'from "@ata-crm/shared"'
    );
    content = content.replace(
      /from ["']@\/lib\/utils\/([^"']+)["']/g,
      'from "@ata-crm/shared"'
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

const frontendDir = path.join(process.cwd(), 'apps', 'frontend');
const tsxFiles = findTsxFiles(frontendDir);
let fixedCount = 0;

console.log(`\n🔧 Fixing frontend imports in ${tsxFiles.length} files...\n`);

tsxFiles.forEach(file => {
  if (fixImports(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files\n`);



