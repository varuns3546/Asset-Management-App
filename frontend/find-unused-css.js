const fs = require('fs');
const path = require('path');

// Get all JS/JSX files
function getAllJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules')) {
        getAllJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Extract CSS classes from JS/JSX files
function extractClassesFromJS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const classes = new Set();
  
  // Match className="..." or className={'...'} patterns
  const classNameRegex = /className\s*[=:]\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = classNameRegex.exec(content)) !== null) {
    const classString = match[1];
    classString.split(/\s+/).forEach(cls => {
      if (cls.trim()) classes.add(cls.trim());
    });
  }
  
  // Match template literals
  const templateRegex = /className\s*=\s*\{[^}]*["'`]([^"'`]+)["'`]/g;
  while ((match = templateRegex.exec(content)) !== null) {
    const classString = match[1];
    classString.split(/\s+/).forEach(cls => {
      if (cls.trim()) classes.add(cls.trim());
    });
  }
  
  return classes;
}

// Extract CSS class definitions
function extractCSSClasses(cssFilePath) {
  const content = fs.readFileSync(cssFilePath, 'utf8');
  const classes = new Set();
  
  // Match .class-name { patterns
  const classRegex = /\.([a-zA-Z0-9_-]+)(?:\s*[,{])/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    classes.add(match[1]);
  }
  
  return classes;
}

// Main analysis
const srcDir = path.join(__dirname, 'src');
const stylesDir = path.join(__dirname, 'src', 'styles');

const jsFiles = getAllJSFiles(srcDir);
const usedClasses = new Set();

console.log(`Analyzing ${jsFiles.length} JS/JSX files...`);

jsFiles.forEach(file => {
  const classes = extractClassesFromJS(file);
  classes.forEach(cls => usedClasses.add(cls));
});

console.log(`Found ${usedClasses.size} unique CSS classes used in code\n`);

// Get all CSS files
const cssFiles = fs.readdirSync(stylesDir)
  .filter(file => file.endsWith('.css'))
  .map(file => path.join(stylesDir, file));

const allDefinedClasses = new Map();
const unusedClasses = new Map();

cssFiles.forEach(cssFile => {
  const definedClasses = extractCSSClasses(cssFile);
  const fileName = path.basename(cssFile);
  
  definedClasses.forEach(cls => {
    if (!allDefinedClasses.has(cls)) {
      allDefinedClasses.set(cls, []);
    }
    allDefinedClasses.get(cls).push(fileName);
    
    if (!usedClasses.has(cls)) {
      if (!unusedClasses.has(cls)) {
        unusedClasses.set(cls, []);
      }
      unusedClasses.get(cls).push(fileName);
    }
  });
});

console.log(`=== CSS ANALYSIS RESULTS ===\n`);
console.log(`Total CSS classes defined: ${allDefinedClasses.size}`);
console.log(`CSS classes used in code: ${usedClasses.size}`);
console.log(`Potentially unused classes: ${unusedClasses.size}\n`);

if (unusedClasses.size > 0) {
  console.log('⚠️  POTENTIALLY UNUSED CSS CLASSES:\n');
  const sorted = Array.from(unusedClasses.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  sorted.forEach(([className, files]) => {
    console.log(`  .${className}`);
    console.log(`    Found in: ${files.join(', ')}`);
  });
  
  // Save to file
  const output = sorted.map(([className, files]) => 
    `.${className} (in ${files.join(', ')})`
  ).join('\n');
  
  fs.writeFileSync(
    path.join(__dirname, 'unused-css-report.txt'),
    `Unused CSS Classes Report\nGenerated: ${new Date().toISOString()}\n\n${output}`
  );
  
  console.log(`\n✅ Report saved to unused-css-report.txt`);
  console.log(`\n⚠️  WARNING: Review carefully before removing!`);
  console.log(`   Some classes may be used dynamically or in third-party libraries.`);
} else {
  console.log('✅ No unused CSS classes found!');
}

