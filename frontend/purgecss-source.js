// PurgeCSS Source File Cleaner - Removes unused CSS from src/styles
// WARNING: This modifies your source files! Make sure you have a backup/version control.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const stylesDir = path.join(__dirname, 'src', 'styles');

// Find all CSS files in src/styles
const cssFiles = fs.readdirSync(stylesDir).filter(file => file.endsWith('.css'));

if (cssFiles.length === 0) {
  console.log('No CSS files found in src/styles');
  process.exit(1);
}

console.log(`Found ${cssFiles.length} CSS file(s) to process...`);
console.log('⚠️  WARNING: This will modify your source files!');
console.log('');

// Process each CSS file
cssFiles.forEach(cssFile => {
  const cssPath = path.join(stylesDir, cssFile);
  const relativeCssPath = `src/styles/${cssFile}`;
  
  console.log(`Processing ${cssFile}...`);
  
  try {
    // Run purgecss on source files
    // Content: all JS/JSX files in src
    const command = `npx purgecss --css "${relativeCssPath}" --content "src/**/*.{js,jsx}" "public/index.html" --output "src/styles" --safelist "leaflet-*" "marker-*" "react-*" "map-*" "spinner*" "selected" "active" "hidden" "visible" "expanded" "collapsed" "layer-hidden"`;
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });
    
    console.log(`✓ Processed ${cssFile}`);
  } catch (error) {
    console.error(`✗ Error processing ${cssFile}:`, error.message);
  }
});

console.log('');
console.log('✓ Source CSS cleanup completed!');
console.log('⚠️  Remember to test your application to ensure nothing broke.');

