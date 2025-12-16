// PurgeCSS Configuration (CommonJS format for Windows compatibility)
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

