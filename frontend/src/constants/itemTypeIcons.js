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
 * Get a random unused icon and color combination
 * @param {Array} existingAssetTypes - Array of existing asset types with icon and icon_color properties
 * @returns {Object} { icon: string, icon_color: string }
 */
export const getRandomUnusedStyle = (existingAssetTypes = []) => {
  const allIcons = Object.keys(ITEM_TYPE_ICON_MAP);
  const allColors = ITEM_TYPE_COLOR_OPTIONS.map(opt => opt.value);
  
  // Get all used combinations
  const usedCombinations = new Set();
  existingAssetTypes.forEach(type => {
    if (type.icon && type.icon_color) {
      usedCombinations.add(`${type.icon}:${type.icon_color}`);
    }
  });
  
  // Generate all possible combinations
  const allCombinations = [];
  allIcons.forEach(icon => {
    allColors.forEach(color => {
      allCombinations.push({ icon, icon_color: color });
    });
  });
  
  // Filter out used combinations
  const unusedCombinations = allCombinations.filter(combo => {
    return !usedCombinations.has(`${combo.icon}:${combo.icon_color}`);
  });
  
  // If there are unused combinations, pick a random one
  if (unusedCombinations.length > 0) {
    const randomIndex = Math.floor(Math.random() * unusedCombinations.length);
    return unusedCombinations[randomIndex];
  }
  
  // If all combinations are used, just pick a random one anyway
  const randomIconIndex = Math.floor(Math.random() * allIcons.length);
  const randomColorIndex = Math.floor(Math.random() * allColors.length);
  return {
    icon: allIcons[randomIconIndex],
    icon_color: allColors[randomColorIndex]
  };
};

