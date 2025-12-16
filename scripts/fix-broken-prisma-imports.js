/**
 * Script to fix broken prisma imports (inside return statements)
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
  
  // Fix pattern: return NextResponse.json(...\n// Dynamic import\nconst { prisma } = await import(...);\n,
  const brokenPattern = /return NextResponse\.json\(\s*\{[^}]*\}\s*\/\/ Dynamic import to prevent build-time execution\s*const \{ prisma \} = await import\(["']@\/lib\/prisma["']\);\s*,\s*\{ status: 503 \}\s*\);/gs;
  
  if (brokenPattern.test(content)) {
    content = content.replace(
      /return NextResponse\.json\(\s*\{[^}]*\}\s*\/\/ Dynamic import to prevent build-time execution\s*const \{ prisma \} = await import\(["']@\/lib\/prisma["']\);\s*,\s*\{ status: 503 \}\s*\);/gs,
      (match) => {
        // Extract the JSON object
        const jsonMatch = match.match(/\{([^}]*)\}/);
        if (jsonMatch) {
          return `return NextResponse.json(\n      ${jsonMatch[0]},\n      { status: 503 }\n    );`;
        }
        return match;
      }
    );
    modified = true;
  }
  
  // Also fix if dynamic import is after return but before closing
  content = content.replace(
    /return NextResponse\.json\(\s*\{[^}]*\}\s*\/\/ Dynamic import to prevent build-time execution\s*const \{ prisma \} = await import\(["']@\/lib\/prisma["']\);\s*,\s*\{ status: 503 \}\s*\);/g,
    (match) => {
      const jsonMatch = match.match(/\{([^}]*)\}/);
      if (jsonMatch) {
        return `return NextResponse.json(\n      ${jsonMatch[0]},\n      { status: 503 }\n    );`;
      }
      return match;
    }
  );
  
  // Now add dynamic import in correct place (after build check, before try)
  if (content.includes('await prisma.') && !content.includes('const { prisma } = await import("@/lib/prisma");')) {
    // Find build check
    const buildCheckMatch = content.match(/if \(process\.env\.NEXT_PHASE === 'phase-production-build'\)\s*\{[^}]*return NextResponse\.json\([^}]*\{ status: 503 \}\s*\);\s*\}/s);
    
    if (buildCheckMatch) {
      const afterBuildCheck = buildCheckMatch.index + buildCheckMatch[0].length;
      const nextLines = content.substring(afterBuildCheck, afterBuildCheck + 200);
      const tryMatch = nextLines.match(/^\s*try\s*\{/m);
      
      if (tryMatch) {
        const insertPos = afterBuildCheck + tryMatch.index;
        const indent = tryMatch[0].match(/^(\s*)/)?.[1] || '    ';
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

console.log(`\n🔧 Fixing broken prisma imports in ${routeFiles.length} files...\n`);

routeFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files\n`);



