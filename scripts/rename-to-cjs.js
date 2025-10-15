import { renameSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

function fixRequirePaths(dir) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      fixRequirePaths(fullPath);
    } else if (extname(file) === '.js') {
      let content = readFileSync(fullPath, 'utf-8');
      // Fix require statements: require('./something') -> require('./something.cjs')
      // But skip if already has an extension
      content = content.replace(/require\(['"](\.[^'"]+)['"]\)/g, (match, path) => {
        // Skip if path already has an extension
        if (path.match(/\.(js|cjs|mjs|json)$/)) {
          return match;
        }
        // Preserve the quote style (single or double)
        const quote = match.includes('"') ? '"' : "'";
        return `require(${quote}${path}.cjs${quote})`;
      });
      writeFileSync(fullPath, content, 'utf-8');
    }
  }
}

function renameJsToCjs(dir) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      renameJsToCjs(fullPath);
    } else if (extname(file) === '.js') {
      const newPath = fullPath.replace(/\.js$/, '.cjs');
      renameSync(fullPath, newPath);
      console.log(`Renamed: ${fullPath} -> ${newPath}`);
    }
  }
}

// First fix require paths in .js files
fixRequirePaths('dist/main');
console.log('✅ Fixed require paths');

// Then rename .js to .cjs
renameJsToCjs('dist/main');
console.log('✅ All .js files in dist/main renamed to .cjs');
