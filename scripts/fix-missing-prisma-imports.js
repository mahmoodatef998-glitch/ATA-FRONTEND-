/**
 * Script to find and fix missing prisma dynamic imports
 */

const fs = require('fs');
const path = require('path');

function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file uses prisma but doesn't have dynamic import
  const usesPrisma = /await prisma\.|prisma\./g.test(content);
  const hasDynamicImport = /const \{ prisma \} = await import\(["']@\/lib\/prisma["']\)/g.test(content);
  
  if (usesPrisma && !hasDynamicImport) {
    // Find the first function (GET, POST, etc.)
    const functionMatch = content.match(/export async function (GET|POST|PUT|DELETE|PATCH|OPTIONS)\([^)]*\)\s*\{/);
    
    if (functionMatch) {
      const functionStart = functionMatch.index + functionMatch[0].length;
      
      // Check if there's already a build-time check
      const buildCheckMatch = content.substring(functionStart, functionStart + 200).match(/if \(process\.env\.NEXT_PHASE/);
      
      let insertPos = functionStart;
      if (buildCheckMatch) {
        // Insert after build check
        insertPos = functionStart + buildCheckMatch.index + buildCheckMatch[0].length;
        // Find the closing brace of the if statement
        const afterCheck = content.substring(insertPos);
        const closingBrace = afterCheck.indexOf('}');
        if (closingBrace !== -1) {
          insertPos += closingBrace + 1;
        }
      }
      
      // Find the first line after function opening
      const afterFunction = content.substring(insertPos);
      const firstLineMatch = afterFunction.match(/^(\s*)(.*)/);
      if (firstLineMatch) {
        const indent = firstLineMatch[1];
        const dynamicImport = `\n${indent}// Dynamic import to prevent build-time execution\n${indent}const { prisma } = await import("@/lib/prisma");\n`;
        
        content = content.slice(0, insertPos) + dynamicImport + content.slice(insertPos);
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

const apiDir = path.join(process.cwd(), 'apps', 'backend', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);
let fixedCount = 0;

console.log(`\n🔧 Fixing missing prisma imports in ${routeFiles.length} files...\n`);

routeFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files\n`);



