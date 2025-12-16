// PurgeCSS Configuration
// Note: Using command-line args in package.json instead due to Windows path issues
// This file is kept for reference

module.exports = {
  content: [
    './build/static/js/*.js',
    './build/index.html'
  ],
  css: ['./build/static/css/*.css'],
  safelist: [
    // Keep dynamic classes - use regex patterns
    { pattern: /^leaflet-/ },
    { pattern: /^marker-/ },
    { pattern: /^react-/ },
    { pattern: /^map-/ },
    { pattern: /^spinner/ },
    // Keep classes that might be added dynamically
    'selected',
    'active',
    'hidden',
    'visible',
    'expanded',
    'collapsed',
    'layer-hidden',
  ]
};

