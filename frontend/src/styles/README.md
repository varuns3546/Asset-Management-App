# Styling Structure

This directory contains all the styles for the React Native Maps app, organized into separate files for better maintainability and reusability.

## File Structure

```
styles/
├── index.js              # Main export file
├── commonStyles.js       # Common styles, colors, typography
├── screenStyles.js       # Screen-specific styles
├── componentStyles.js    # Component-specific styles
├── appStyles.js         # App-level styles (navigation, etc.)
└── README.md           # This file
```

## Usage

### Importing Styles

```javascript
// Import all styles
import { commonStyles, screenStyles, componentStyles, appStyles } from '../styles';

// Import specific style sections
import { colors, typography, spacing } from '../styles';
```

### Using Styles in Components

```javascript
// Screen component
import { screenStyles } from '../styles';

const MyScreen = () => {
  return (
    <View style={screenStyles.myScreen.container}>
      <Text style={screenStyles.myScreen.title}>My Screen</Text>
    </View>
  );
};

// Component
import { componentStyles } from '../styles';

const MyComponent = () => {
  return (
    <TouchableOpacity style={componentStyles.button.primary}>
      <Text style={componentStyles.buttonText.primary}>Click Me</Text>
    </TouchableOpacity>
  );
};
```

## Style Categories

### 1. Common Styles (`commonStyles.js`)
- **Colors**: Primary, secondary, warning, success, error colors
- **Typography**: Font sizes and weights
- **Spacing**: Consistent spacing values
- **Shadows**: Reusable shadow styles
- **Common Components**: Buttons, inputs, modals

### 2. Screen Styles (`screenStyles.js`)
- **MapScreen**: Map-related UI styles
- **EntryScreen**: Entry list and form styles
- **LoginScreen**: Authentication screen styles
- **RegisterScreen**: Registration screen styles
- **UploadScreen**: File upload screen styles

### 3. Component Styles (`componentStyles.js`)
- **Header**: Navigation header styles
- **EntryItem**: Individual entry display styles
- **EntryForm**: Form component styles
- **MapView**: Map component styles
- **Spinner**: Loading spinner styles
- **Modal**: Shared modal styles
- **Button**: Reusable button styles

### 4. App Styles (`appStyles.js`)
- **Navigation**: Tab and stack navigator styles
- **Loading**: Loading screen styles
- **Error**: Error screen styles
- **Safe Area**: Safe area handling

## Color Palette

```javascript
colors: {
  primary: '#007AFF',      // iOS blue
  secondary: '#FF6B6B',    // Coral red
  warning: '#FF9500',      // Orange
  success: '#34C759',      // Green
  error: '#FF3B30',        // Red
  background: '#F2F2F7',   // Light gray
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    light: '#F2F2F7',
    medium: '#C7C7CC',
    dark: '#8E8E93',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    light: '#999999',
  }
}
```

## Typography Scale

```javascript
typography: {
  h1: { fontSize: 24, fontWeight: 'bold' },
  h2: { fontSize: 20, fontWeight: 'bold' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  caption: { fontSize: 14 },
  small: { fontSize: 12 },
}
```

## Spacing Scale

```javascript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

## Best Practices

1. **Use Common Styles**: Always use colors, typography, and spacing from `commonStyles`
2. **Consistent Naming**: Use descriptive names for style objects
3. **Reusable Components**: Create reusable button, input, and modal styles
4. **Screen-Specific**: Keep screen-specific styles in `screenStyles`
5. **Component-Specific**: Keep component-specific styles in `componentStyles`

## Migration Guide

To migrate existing components:

1. **Remove inline styles** from component files
2. **Import appropriate style files**
3. **Replace style references** with centralized styles
4. **Test visual consistency** across the app

## Example Migration

**Before:**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
  },
});
```

**After:**
```javascript
import { commonStyles, componentStyles } from '../styles';

// Use centralized styles
<View style={commonStyles.container}>
  <TouchableOpacity style={componentStyles.button.primary}>
    <Text style={componentStyles.buttonText.primary}>Button</Text>
  </TouchableOpacity>
</View>
``` 