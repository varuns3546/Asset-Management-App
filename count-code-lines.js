// Count lines of code excluding comments
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');
const backendDir = path.join(__dirname, 'backend');

let totalLines = 0;
let totalComments = 0;
let totalEmpty = 0;
const stats = {
  css: { files: 0, lines: 0, comments: 0, empty: 0 },
  js: { files: 0, lines: 0, comments: 0, empty: 0 },
  json: { files: 0, lines: 0, comments: 0, empty: 0 },
  env: { files: 0, lines: 0, comments: 0, empty: 0 }
};

// Remove CSS comments
function removeCSSComments(content) {
  // Remove /* ... */ comments (including multi-line)
  return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Remove JS/JSX comments
function removeJSComments(content) {
  let result = content;
  let inMultiLineComment = false;
  let inString = false;
  let stringChar = '';
  const lines = result.split('\n');
  const cleanedLines = [];
  
  for (let line of lines) {
    let cleaned = '';
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1] || '';
      
      if (!inString && !inMultiLineComment) {
        // Check for string start
        if ((char === '"' || char === "'" || char === '`') && line[i - 1] !== '\\') {
          inString = true;
          stringChar = char;
          cleaned += char;
          i++;
          continue;
        }
        // Check for single-line comment
        if (char === '/' && nextChar === '/') {
          break; // Rest of line is comment
        }
        // Check for multi-line comment start
        if (char === '/' && nextChar === '*') {
          inMultiLineComment = true;
          i += 2;
          continue;
        }
        cleaned += char;
      } else if (inString) {
        cleaned += char;
        // Check for string end
        if (char === stringChar && line[i - 1] !== '\\') {
          inString = false;
          stringChar = '';
        }
      } else if (inMultiLineComment) {
        // Check for multi-line comment end
        if (char === '*' && nextChar === '/') {
          inMultiLineComment = false;
          i += 2;
          continue;
        }
      }
      i++;
    }
    
    cleanedLines.push(cleaned);
  }
  
  return cleanedLines.join('\n');
}

// Remove JSON comments (JSON doesn't support comments, but some files might have them)
function removeJSONComments(content) {
  // Some JSON files might have // comments (not standard but sometimes used)
  return content.replace(/\/\/.*$/gm, '');
}

// Remove .env comments (lines starting with #)
function removeEnvComments(content) {
  const lines = content.split('\n');
  return lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('#') && trimmed !== '';
  }).join('\n');
}

// Count lines in a file
function countLines(filePath, fileType) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let cleanedContent = '';
    
    // Remove comments based on file type
    switch (fileType) {
      case 'css':
        cleanedContent = removeCSSComments(content);
        break;
      case 'js':
        cleanedContent = removeJSComments(content);
        break;
      case 'json':
        cleanedContent = removeJSONComments(content);
        break;
      case 'env':
        cleanedContent = removeEnvComments(content);
        break;
      default:
        cleanedContent = content;
    }
    
    // Split into lines and count
    const lines = cleanedContent.split('\n');
    const originalLines = content.split('\n');
    let codeLines = 0;
    let emptyLines = 0;
    let commentLines = 0;
    
    // Count code and empty lines from cleaned content
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed === '') {
        emptyLines++;
      } else {
        codeLines++;
      }
    });
    
    // Count comment lines more accurately from original content
    let inMultiLineComment = false;
    originalLines.forEach((line) => {
      const trimmed = line.trim();
      
      // Check for multi-line comments
      if (fileType === 'js' || fileType === 'css') {
        // Check if we're already in a multi-line comment
        if (inMultiLineComment) {
          commentLines++;
          // Check if this line ends the comment
          if (trimmed.includes('*/')) {
            inMultiLineComment = false;
          }
        } else {
          // Check for single-line comment
          if (trimmed.startsWith('//')) {
            commentLines++;
          }
          // Check for multi-line comment start
          else if (trimmed.includes('/*')) {
            commentLines++;
            // If comment doesn't end on same line, mark as in multi-line comment
            if (!trimmed.includes('*/')) {
              inMultiLineComment = true;
            }
          }
          // Check for lines that are just continuation of multi-line comment (starts with *)
          else if (trimmed.startsWith('*') && trimmed.length > 1 && !trimmed.startsWith('*/')) {
            // This might be part of a multi-line comment, but we can't be sure without context
            // Skip for now to avoid false positives
          }
        }
      } else if (fileType === 'env') {
        if (trimmed.startsWith('#')) {
          commentLines++;
        }
      } else if (fileType === 'json') {
        // JSON doesn't officially support comments, but count // comments if present
        if (trimmed.startsWith('//')) {
          commentLines++;
        }
      }
    });
    
    return { codeLines, emptyLines, commentLines, totalLines: originalLines.length };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return { codeLines: 0, emptyLines: 0, commentLines: 0, totalLines: 0 };
  }
}

// Find all files recursively
function findFiles(dir, extensions, excludeDirs = ['node_modules', 'build', '.git', 'dist', '.next', 'coverage', '.cache']) {
  const files = [];
  
  // Check if directory exists
  if (!fs.existsSync(dir)) {
    console.warn(`Directory does not exist: ${dir}`);
    return files;
  }
  
  function walk(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        try {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Check if directory should be excluded (case-insensitive)
            const shouldExclude = excludeDirs.some(exclude => 
              item.toLowerCase() === exclude.toLowerCase() || 
              item.startsWith('.') && item !== '.env'
            );
            if (!shouldExclude) {
              walk(fullPath);
            }
          } else {
            const ext = path.extname(item).toLowerCase();
            if (extensions.includes(ext) || (ext === '' && extensions.includes(item))) {
              files.push(fullPath);
            }
          }
        } catch (error) {
          // Skip files/directories that can't be accessed
          if (VERBOSE) {
            console.warn(`Skipping ${path.join(currentDir, item)}: ${error.message}`);
          }
        }
      });
    } catch (error) {
      if (VERBOSE) {
        console.error(`Error reading directory ${currentDir}:`, error.message);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Process files
console.log('Counting lines of code (excluding comments)...\n');
console.log(`Working directory: ${__dirname}\n`);

// Optional: Add verbose mode
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

// Check if directories exist
if (!fs.existsSync(frontendDir)) {
  console.error(`Error: Frontend directory not found: ${frontendDir}`);
  process.exit(1);
}

if (!fs.existsSync(backendDir)) {
  console.error(`Error: Backend directory not found: ${backendDir}`);
  process.exit(1);
}

// CSS files
const cssFiles = findFiles(frontendDir, ['.css']);
if (VERBOSE) console.log(`Found ${cssFiles.length} CSS files`);
cssFiles.forEach(file => {
  const counts = countLines(file, 'css');
  if (VERBOSE && counts.totalLines > 0) {
    console.log(`  ${path.relative(__dirname, file)}: ${counts.codeLines} code, ${counts.emptyLines} empty, ${counts.commentLines} comments`);
  }
  stats.css.files++;
  stats.css.lines += counts.codeLines;
  stats.css.comments += counts.commentLines;
  stats.css.empty += counts.emptyLines;
});

// JS/JSX files
const jsFiles = findFiles(frontendDir, ['.js', '.jsx']);
if (VERBOSE) console.log(`\nFound ${jsFiles.length} frontend JS/JSX files`);
jsFiles.forEach(file => {
  const counts = countLines(file, 'js');
  if (VERBOSE && counts.totalLines > 100) {
    console.log(`  ${path.relative(__dirname, file)}: ${counts.codeLines} code, ${counts.emptyLines} empty, ${counts.commentLines} comments (${counts.totalLines} total)`);
  }
  stats.js.files++;
  stats.js.lines += counts.codeLines;
  stats.js.comments += counts.commentLines;
  stats.js.empty += counts.emptyLines;
});

// Backend JS files
const backendJsFiles = findFiles(backendDir, ['.js']);
if (VERBOSE) console.log(`\nFound ${backendJsFiles.length} backend JS files`);
backendJsFiles.forEach(file => {
  const counts = countLines(file, 'js');
  if (VERBOSE && counts.totalLines > 100) {
    console.log(`  ${path.relative(__dirname, file)}: ${counts.codeLines} code, ${counts.emptyLines} empty, ${counts.commentLines} comments (${counts.totalLines} total)`);
  }
  stats.js.files++;
  stats.js.lines += counts.codeLines;
  stats.js.comments += counts.commentLines;
  stats.js.empty += counts.emptyLines;
});

// package.json files
const jsonFiles = [
  path.join(frontendDir, 'package.json'),
  path.join(backendDir, 'package.json'),
  path.join(__dirname, 'package.json')
].filter(file => fs.existsSync(file));

jsonFiles.forEach(file => {
  const counts = countLines(file, 'json');
  stats.json.files++;
  stats.json.lines += counts.codeLines;
  stats.json.comments += counts.commentLines;
  stats.json.empty += counts.emptyLines;
});

// .env files (look for files starting with .env)
const envFiles = [];
function findEnvFiles(dir) {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      if (item.startsWith('.env')) {
        const fullPath = path.join(dir, item);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            envFiles.push(fullPath);
          }
        } catch (e) {
          // Skip if can't access
        }
      }
    });
  } catch (e) {
    // Skip if can't read directory
  }
}

// Check root, frontend, and backend directories
findEnvFiles(__dirname);
findEnvFiles(frontendDir);
findEnvFiles(backendDir);

envFiles.forEach(file => {
  const counts = countLines(file, 'env');
  stats.env.files++;
  stats.env.lines += counts.codeLines;
  stats.env.comments += counts.commentLines;
  stats.env.empty += counts.emptyLines;
});

// Calculate totals
totalLines = stats.css.lines + stats.js.lines + stats.json.lines + stats.env.lines;
totalComments = stats.css.comments + stats.js.comments + stats.json.comments + stats.env.comments;
totalEmpty = stats.css.empty + stats.js.empty + stats.json.empty + stats.env.empty;

// Display results
console.log('=== CODE STATISTICS (Excluding Comments) ===\n');
console.log('CSS Files:');
console.log(`  Files: ${stats.css.files}`);
console.log(`  Code lines: ${stats.css.lines.toLocaleString()}`);
console.log(`  Empty lines: ${stats.css.empty.toLocaleString()}`);
console.log(`  Comment lines: ${stats.css.comments.toLocaleString()}`);
console.log('');

console.log('JavaScript/JSX Files:');
console.log(`  Files: ${stats.js.files}`);
console.log(`  Code lines: ${stats.js.lines.toLocaleString()}`);
console.log(`  Empty lines: ${stats.js.empty.toLocaleString()}`);
console.log(`  Comment lines: ${stats.js.comments.toLocaleString()}`);
console.log('');

console.log('package.json Files:');
console.log(`  Files: ${stats.json.files}`);
console.log(`  Code lines: ${stats.json.lines.toLocaleString()}`);
console.log(`  Empty lines: ${stats.json.empty.toLocaleString()}`);
console.log(`  Comment lines: ${stats.json.comments.toLocaleString()}`);
console.log('');

console.log('.env Files:');
console.log(`  Files: ${stats.env.files}`);
console.log(`  Code lines: ${stats.env.lines.toLocaleString()}`);
console.log(`  Empty lines: ${stats.env.empty.toLocaleString()}`);
console.log(`  Comment lines: ${stats.env.comments.toLocaleString()}`);
console.log('');

console.log('=== TOTALS ===');
console.log(`Total Code Lines (excluding comments): ${totalLines.toLocaleString()}`);
console.log(`Total Comment Lines: ${totalComments.toLocaleString()}`);
console.log(`Total Empty Lines: ${totalEmpty.toLocaleString()}`);
const totalFiles = stats.css.files + stats.js.files + stats.json.files + stats.env.files;
console.log(`Total Files: ${totalFiles}`);
console.log(`\nNote: Run with --verbose flag to see per-file breakdown`);

