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

