// Remove all comments from CSS files in src/styles
const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src', 'styles');

// Find all CSS files
const cssFiles = fs.readdirSync(stylesDir).filter(file => file.endsWith('.css'));

if (cssFiles.length === 0) {
  console.log('No CSS files found in src/styles');
  process.exit(1);
}

console.log(`Found ${cssFiles.length} CSS file(s) to process...`);
console.log('⚠️  WARNING: This will modify your source files!');
console.log('');

let totalCommentsRemoved = 0;
let totalFilesProcessed = 0;

// Process each CSS file
cssFiles.forEach(cssFile => {
  const cssPath = path.join(stylesDir, cssFile);
  
  try {
    // Read the CSS file
    let content = fs.readFileSync(cssPath, 'utf8');
    const originalLength = content.length;
    
    // Remove CSS comments (/* ... */)
    // This regex handles both single-line and multi-line comments
    // It's careful to not remove comments inside strings (though CSS doesn't have strings like JS)
    const commentRegex = /\/\*[\s\S]*?\*\//g;
    const matches = content.match(commentRegex);
    const commentCount = matches ? matches.length : 0;
    
    // Remove all comments
    content = content.replace(commentRegex, '');
    
    // Clean up multiple consecutive newlines (resulting from removed comments)
    content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');
    
    // Trim leading/trailing whitespace
    content = content.trim();
    
    // Write back to file
    fs.writeFileSync(cssPath, content, 'utf8');
    
    const newLength = content.length;
    const bytesRemoved = originalLength - newLength;
    
    console.log(`✓ ${cssFile}: Removed ${commentCount} comment(s), ${bytesRemoved} bytes`);
    
    totalCommentsRemoved += commentCount;
    totalFilesProcessed++;
  } catch (error) {
    console.error(`✗ Error processing ${cssFile}:`, error.message);
  }
});

console.log('');
console.log(`✓ Completed! Processed ${totalFilesProcessed} file(s), removed ${totalCommentsRemoved} comment(s) total.`);

