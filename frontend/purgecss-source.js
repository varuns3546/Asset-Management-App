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
  console.log(`Processing ${cssFile}...`);
  
  try {
    // Read the original CSS file
    const cssFilePath = path.join(stylesDir, cssFile);
    const originalContent = fs.readFileSync(cssFilePath, 'utf8');
    
    // Create a temporary file for processing
    const tempCssPath = path.join(__dirname, 'temp-purge.css');
    fs.writeFileSync(tempCssPath, originalContent);
    
    // Use relative paths from frontend directory
    const relativeCssPath = `temp-purge.css`;
    const relativeSrcPattern = `src/**/*.{js,jsx}`;
    const relativeHtmlPath = `public/index.html`;
    const relativeOutputPath = `temp-purge-output.css`;
    
    // Run purgecss with relative paths
    const command = `npx purgecss --css "${relativeCssPath}" --content "${relativeSrcPattern}" "${relativeHtmlPath}" --output "${relativeOutputPath}" --safelist "leaflet-*" "marker-*" "react-*" "map-*" "spinner*" "selected" "active" "hidden" "visible" "expanded" "collapsed" "layer-hidden"`;
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });
    
    // Read the purged output and write back to original file
    if (fs.existsSync(path.join(__dirname, relativeOutputPath))) {
      const purgedContent = fs.readFileSync(path.join(__dirname, relativeOutputPath), 'utf8');
      fs.writeFileSync(cssFilePath, purgedContent);
      
      // Clean up temp files
      fs.unlinkSync(tempCssPath);
      fs.unlinkSync(path.join(__dirname, relativeOutputPath));
      
      console.log(`✓ Processed ${cssFile}`);
    } else {
      console.log(`⚠ No output file created for ${cssFile}, skipping...`);
      if (fs.existsSync(tempCssPath)) {
        fs.unlinkSync(tempCssPath);
      }
    }
  } catch (error) {
    console.error(`✗ Error processing ${cssFile}:`, error.message);
    // Clean up temp files on error
    const tempCssPath = path.join(__dirname, 'temp-purge.css');
    const tempOutputPath = path.join(__dirname, 'temp-purge-output.css');
    if (fs.existsSync(tempCssPath)) fs.unlinkSync(tempCssPath);
    if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
  }
});

console.log('');
console.log('✓ Source CSS cleanup completed!');
console.log('⚠️  Remember to test your application to ensure nothing broke.');

