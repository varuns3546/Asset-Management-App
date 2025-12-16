// PurgeCSS Runner Script (Windows-compatible)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');
const cssDir = path.join(buildDir, 'static', 'css');
const jsDir = path.join(buildDir, 'static', 'js');

// Find all CSS files
const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));

if (cssFiles.length === 0) {
  console.log('No CSS files found in build/static/css');
  process.exit(1);
}

console.log(`Found ${cssFiles.length} CSS file(s) to process...`);

// Process each CSS file
cssFiles.forEach(cssFile => {
  // Use relative paths from frontend directory
  const relativeCssPath = `build/static/css/${cssFile}`;
  const relativeJsPattern = `build/static/js/*.js`;
  const relativeHtmlPath = `build/index.html`;
  const relativeOutputDir = `build/static/css`;
  
  console.log(`Processing ${cssFile}...`);
  
  try {
    // Use relative paths to avoid Windows path duplication issues
    const command = `npx purgecss --css "${relativeCssPath}" --content "${relativeJsPattern}" "${relativeHtmlPath}" --output "${relativeOutputDir}" --safelist "leaflet-*" "marker-*" "react-*" "map-*" "spinner*" "selected" "active" "hidden" "visible" "expanded" "collapsed" "layer-hidden"`;
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });
    
    console.log(`✓ Processed ${cssFile}`);
  } catch (error) {
    console.error(`✗ Error processing ${cssFile}:`, error.message);
    // Don't exit on error, continue with other files
  }
});

console.log('✓ PurgeCSS completed successfully!');

