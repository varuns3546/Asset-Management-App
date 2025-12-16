export const ITEM_TYPE_ICON_MAP = {
  marker: {
    label: 'Filled Circle',
    preview: '●'
  },
  circle: {
    label: 'Hollow Circle',
    preview: '○'
  },
  square: {
    label: 'Square',
    preview: '■'
  },
  diamond: {
    label: 'Diamond',
    preview: '◆'
  },
  triangle: {
    label: 'Triangle',
    preview: '▲'
  },
  star: {
    label: 'Star',
    preview: '★'
  },
  cross: {
    label: 'Cross',
    preview: '✚'
  },
  bar: {
    label: 'Bar',
    preview: '▮'
  },
  hexagon: {
    label: 'Hexagon',
    preview: '⬢'
  },
  pin: {
    label: 'Pointer',
    preview: '⩔'
  }
};

export const DEFAULT_ITEM_TYPE_ICON = 'marker';

export const ITEM_TYPE_ICON_OPTIONS = Object.entries(ITEM_TYPE_ICON_MAP).map(
  ([key, meta]) => ({
    key,
    ...meta
  })
);

export const ITEM_TYPE_COLOR_OPTIONS = [
  { value: '#dc3545', label: 'Red' },
  { value: '#fd7e14', label: 'Orange' },
  { value: '#ffc107', label: 'Yellow' },
  { value: '#198754', label: 'Green' },
  { value: '#0dcaf0', label: 'Teal' },
  { value: '#0d6efd', label: 'Blue' },
  { value: '#6f42c1', label: 'Purple' }
];

/**
 * Get a random unused style for GIS layers
 * @param {Array} existingLayers - Array of existing layers with style properties (symbol, color)
 * @param {Object} options - Configuration options (currently only supports 'layer' type)
 * @param {string} options.type - 'layer' (only option now, asset types no longer have styles)
 * @returns {Object} Style object with symbol, color, opacity, weight, fillColor, fillOpacity
 */
export const getRandomUnusedStyle = (existingLayers = [], options = {}) => {
  const { type = 'layer' } = options;
  const allSymbols = Object.keys(ITEM_TYPE_ICON_MAP);
  const allColors = ITEM_TYPE_COLOR_OPTIONS.map(opt => opt.value);
  
  // Get all used combinations from existing layers
  const usedCombinations = new Set();
  existingLayers.forEach(layer => {
    if (layer.style) {
      const symbol = layer.style.symbol || 'marker';
      const color = layer.style.color || '#3388ff';
      usedCombinations.add(`${symbol}:${color}`);
    }
  });
  
  // Generate all possible combinations
  const allCombinations = [];
  allSymbols.forEach(symbol => {
    allColors.forEach(color => {
      allCombinations.push({ symbol, color });
    });
  });
  
  // Filter out used combinations
  const unusedCombinations = allCombinations.filter(combo => {
    return !usedCombinations.has(`${combo.symbol}:${combo.color}`);
  });
  
  // If there are unused combinations, pick a random one
  let selectedCombo;
  if (unusedCombinations.length > 0) {
    const randomIndex = Math.floor(Math.random() * unusedCombinations.length);
    selectedCombo = unusedCombinations[randomIndex];
  } else {
    // If all combinations are used, just pick a random one anyway
    const randomSymbolIndex = Math.floor(Math.random() * allSymbols.length);
    const randomColorIndex = Math.floor(Math.random() * allColors.length);
    selectedCombo = {
      symbol: allSymbols[randomSymbolIndex],
      color: allColors[randomColorIndex]
    };
  }
  
  // Return full style object for layers
  return {
    symbol: selectedCombo.symbol,
    color: selectedCombo.color,
    opacity: 1,
    weight: 3,
    fillColor: selectedCombo.color,
    fillOpacity: 0.2
  };
};


