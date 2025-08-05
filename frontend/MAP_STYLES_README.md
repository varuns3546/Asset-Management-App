# 🗺️ Interactive Map with Multiple Styles

A cross-platform map component with multiple map styles that works seamlessly on web, iOS, and Android.

## ✨ Features

### 🎨 **Multiple Map Styles**
- **Standard** - OpenStreetMap tiles (default)
- **Satellite** - High-resolution satellite imagery
- **Terrain** - Topographic maps with elevation
- **Dark** - Dark theme for low-light environments
- **Light** - Clean, minimalist light theme

### 🌐 **Cross-Platform Support**
- **Web**: Uses Leaflet.js with multiple tile providers
- **Mobile**: Uses react-native-maps with native map types
- **Unified API**: Same interface across all platforms

### 🎯 **Interactive Features**
- Tap to add locations
- Tap markers for details
- Delete locations with confirmation
- Real-time style switching
- Location statistics overlay

## 🚀 Quick Start

### 1. Import the Map Component
```javascript
import MapView from '../components/MapView';
```

### 2. Basic Usage
```javascript
const MyComponent = () => {
  const [locations, setLocations] = useState([]);
  
  const initialRegion = {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <MapView
      initialRegion={initialRegion}
      markers={locations}
      onPress={handleMapPress}
      onMarkerPress={handleMarkerPress}
    />
  );
};
```

## 📋 API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialRegion` | Object | Required | Initial map center and zoom |
| `markers` | Array | `[]` | Array of location markers |
| `onPress` | Function | - | Called when map is tapped |
| `onMarkerPress` | Function | - | Called when marker is tapped |
| `mapStyle` | String | `'standard'` | Initial map style |
| `showStyleSelector` | Boolean | `true` | Show style selector button |

### Map Styles

| Style | Web Provider | Mobile Type | Description |
|-------|-------------|-------------|-------------|
| `standard` | OpenStreetMap | standard | Default street map |
| `satellite` | Esri World Imagery | satellite | Satellite imagery |
| `terrain` | OpenTopoMap | hybrid | Topographic map |
| `dark` | CartoDB Dark | standard | Dark theme |
| `light` | CartoDB Light | standard | Light theme |

## 🎨 Map Style Examples

### Standard Map
```javascript
<MapView
  mapStyle="standard"
  // ... other props
/>
```

### Satellite View
```javascript
<MapView
  mapStyle="satellite"
  // ... other props
/>
```

### Dark Theme
```javascript
<MapView
  mapStyle="dark"
  // ... other props
/>
```

## 📍 Marker Format

```javascript
const markers = [
  {
    id: 1,
    title: 'Location Name',
    description: 'Location description',
    category: 'tourist',
    coordinate: {
      latitude: 40.7589,
      longitude: -73.9851
    }
  }
];
```

## 🔧 Customization

### Custom Map Style
```javascript
// Add custom style to MAP_STYLES
const customStyle = {
  name: 'Custom',
  web: 'https://your-tile-server/{z}/{x}/{y}.png',
  mobile: 'standard',
  attribution: '© Your Company'
};
```

### Disable Style Selector
```javascript
<MapView
  showStyleSelector={false}
  // ... other props
/>
```

## 🌐 Web Implementation

The web version uses **Leaflet.js** with multiple tile providers:

- **OpenStreetMap**: Standard street maps
- **Esri World Imagery**: High-resolution satellite
- **OpenTopoMap**: Topographic maps
- **CartoDB**: Dark and light themes

### Web Features
- ✅ Responsive design
- ✅ Touch and mouse support
- ✅ Popup information windows
- ✅ Smooth style transitions
- ✅ Attribution compliance

## 📱 Mobile Implementation

The mobile version uses **react-native-maps** with native map types:

- **Standard**: Default street map
- **Satellite**: Satellite imagery
- **Hybrid**: Satellite with labels

### Mobile Features
- ✅ Native performance
- ✅ Platform-specific optimizations
- ✅ Gesture support
- ✅ Offline capability (with cached tiles)

## 🎯 Usage Examples

### Basic Map with Style Selector
```javascript
import React, { useState } from 'react';
import MapView from '../components/MapView';

const MyMapScreen = () => {
  const [locations, setLocations] = useState([]);
  
  const handleMapPress = (event) => {
    console.log('Map pressed at:', event.coordinate);
  };
  
  const handleMarkerPress = (marker) => {
    console.log('Marker pressed:', marker.title);
  };

  return (
    <MapView
      initialRegion={{
        latitude: 40.7128,
        longitude: -74.0060,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      markers={locations}
      onPress={handleMapPress}
      onMarkerPress={handleMarkerPress}
    />
  );
};
```

### Map with Custom Style
```javascript
<MapView
  mapStyle="satellite"
  showStyleSelector={false}
  // ... other props
/>
```

### Map with Location Management
```javascript
const [locations, setLocations] = useState([]);

const addLocation = (coordinate) => {
  const newLocation = {
    id: Date.now(),
    title: 'New Location',
    description: 'Added by user',
    coordinate: coordinate
  };
  setLocations([...locations, newLocation]);
};

const deleteLocation = (id) => {
  setLocations(locations.filter(loc => loc.id !== id));
};
```

## 🔍 Troubleshooting

### Web Issues
- **Map not loading**: Check internet connection
- **Styles not changing**: Ensure Leaflet.js is loaded
- **Markers not showing**: Verify marker format

### Mobile Issues
- **Map not rendering**: Check react-native-maps installation
- **Styles not working**: Verify mapType prop
- **Performance issues**: Consider marker clustering

## 📚 Dependencies

### Required
- `react-native-maps` (for mobile)
- `leaflet` (loaded dynamically for web)

### Optional
- `@react-navigation/native` (for navigation)
- `@react-native-async-storage/async-storage` (for persistence)

## 🎨 Style Customization

### Custom CSS (Web)
```css
.leaflet-container {
  background: #f0f0f0;
}

.leaflet-popup-content {
  font-family: 'Arial', sans-serif;
}
```

### Custom Styles (Mobile)
```javascript
const customMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  }
];
```

## 🚀 Performance Tips

1. **Limit markers** to reasonable numbers (100-500)
2. **Use clustering** for large datasets
3. **Cache tile data** for offline use
4. **Optimize images** for marker icons
5. **Debounce style changes** to prevent excessive API calls

## 📄 License

MIT License - Feel free to use and modify as needed! 