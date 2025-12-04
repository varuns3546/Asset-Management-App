# GIS Layers with PostGIS - Setup Instructions

## Step 1: Run SQL Migration in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `backend/migrations/create_layers_tables.sql`
6. Click **Run** to execute the migration
7. Verify tables were created by going to **Table Editor** and checking for:
   - `gis_layers`
   - `gis_features`

## Step 2: Restart Backend Server

```bash
cd backend
npm run dev
```

The backend will now have the `/api/gis` endpoints available.

## Step 3: Update MapScreen to Save/Load Layers

Add these imports to `MapScreen.js`:

```javascript
import * as gisLayerService from '../services/gisLayerService';
```

### Load Layers from Database (on component mount):

```javascript
useEffect(() => {
  if (selectedProject?.id) {
    loadLayersFromDatabase();
  }
}, [selectedProject]);

const loadLayersFromDatabase = async () => {
  try {
    const response = await gisLayerService.getGisLayers(selectedProject.id);
    if (response.success && response.data) {
      // Convert database layers to local state format
      const loadedLayers = await Promise.all(
        response.data.map(async (dbLayer) => {
          // Get features for this layer
          const featuresResponse = await gisLayerService.getLayerFeatures(
            selectedProject.id,
            dbLayer.id
          );
          
          const features = featuresResponse.success 
            ? featuresResponse.data.map(f => ({
                id: f.id,
                name: f.name,
                coordinates: JSON.parse(f.geometry_geojson).coordinates,
                properties: f.properties
              }))
            : [];

          return {
            id: dbLayer.id,
            name: dbLayer.name,
            description: dbLayer.description,
            type: dbLayer.layer_type,
            geometryType: dbLayer.geometry_type,
            visible: dbLayer.visible,
            style: dbLayer.style,
            attributes: dbLayer.attributes,
            features: features,
            featureCount: features.length
          };
        })
      );
      
      setLayers(loadedLayers);
    }
  } catch (error) {
    console.error('Error loading layers:', error);
  }
};
```

### Save Layer to Database (when creating):

Update `handleCreateLayer` in `MapScreen.js`:

```javascript
const handleCreateLayer = async (layerData) => {
  try {
    // Save to Supabase
    const response = await gisLayerService.createGisLayer(
      selectedProject.id,
      {
        name: layerData.name,
        description: layerData.description,
        layerType: layerData.type,
        geometryType: layerData.geometryType,
        attributes: layerData.attributes,
        style: layerData.style || {
          color: '#3388ff',
          weight: 3,
          opacity: 1,
          fillColor: '#3388ff',
          fillOpacity: 0.2
        }
      }
    );

    if (response.success) {
      const newLayer = {
        id: response.data.id, // Use database ID
        name: layerData.name,
        description: layerData.description,
        type: layerData.type,
        geometryType: layerData.geometryType,
        visible: true,
        style: response.data.style,
        attributes: layerData.attributes,
        features: [],
        featureCount: 0
      };

      setLayers([...layers, newLayer]);
      setShowCreateLayerModal(false);
      
      console.log('Layer saved to database:', response.data);
    }
  } catch (error) {
    console.error('Error creating layer:', error);
    alert('Failed to create layer');
  }
};
```

### Save Feature to Database (when adding):

Update `handleAddFeature` in `MapScreen.js`:

```javascript
const handleAddFeature = async (featureData) => {
  const layer = layers.find(l => l.id === selectedLayerId);
  if (!layer) return;

  try {
    // Prepare coordinates in the format expected by backend
    const coordinates = featureData.coordinates.map(coord => [
      parseFloat(coord.lng),
      parseFloat(coord.lat)
    ]);

    // Save to Supabase
    const response = await gisLayerService.addFeature(
      selectedProject.id,
      layer.id,
      {
        name: featureData.name,
        coordinates: coordinates,
        properties: featureData.properties || {}
      }
    );

    if (response.success) {
      const newFeature = {
        id: response.data.id, // Use database ID
        name: featureData.name,
        coordinates: coordinates,
        properties: featureData.properties || {}
      };

      const updatedLayers = layers.map(l => 
        l.id === layer.id
          ? {
              ...l,
              features: [...l.features, newFeature],
              featureCount: l.features.length + 1
            }
          : l
      );

      setLayers(updatedLayers);
      setShowAddFeatureModal(false);
      setSelectedLayerId(null);
      
      console.log('Feature saved to database:', response.data);
    }
  } catch (error) {
    console.error('Error adding feature:', error);
    alert('Failed to add feature');
  }
};
```

### Update Layer Visibility (toggle):

```javascript
const handleToggleLayerVisibility = async (layerId) => {
  const layer = layers.find(l => l.id === layerId);
  if (!layer) return;

  try {
    // Update in database
    await gisLayerService.updateGisLayer(
      selectedProject.id,
      layerId,
      { visible: !layer.visible }
    );

    // Update local state
    setLayers(layers.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ));
  } catch (error) {
    console.error('Error updating layer visibility:', error);
  }
};
```

### Delete Layer:

```javascript
const handleRemoveLayer = async (layerId) => {
  try {
    await gisLayerService.deleteGisLayer(selectedProject.id, layerId);
    setLayers(layers.filter(l => l.id !== layerId));
    console.log('Layer deleted from database');
  } catch (error) {
    console.error('Error deleting layer:', error);
    alert('Failed to delete layer');
  }
};
```

## Step 4: Update LayerPanel Component

Pass the handler functions to LayerPanel in `MapScreen.js`:

```javascript
<LayerPanel
  layers={layers}
  onToggleVisibility={handleToggleLayerVisibility}
  onRemoveLayer={handleRemoveLayer}
  onAddFeature={(layerId) => {
    setSelectedLayerId(layerId);
    setShowAddFeatureModal(true);
  }}
/>
```

## Benefits of PostGIS

✅ **Spatial Indexing**: Lightning-fast queries for large datasets  
✅ **Geometric Operations**: Buffer, intersection, union, etc.  
✅ **Distance Calculations**: Accurate distance between features  
✅ **Bounding Box Queries**: Efficiently load only visible features  
✅ **Industry Standard**: Compatible with QGIS, ArcGIS, etc.  
✅ **GeoJSON Support**: Easy conversion for web mapping  

## Advanced PostGIS Queries (Optional)

### Get features within map viewport:

```javascript
const response = await gisApi.post(`/${projectId}/layers/${layerId}/features/in-bounds`, {
  minLat: 40.0,
  minLng: -75.0,
  maxLat: 41.0,
  maxLng: -74.0
});
```

### Get features within radius:

```javascript
const response = await gisApi.post(`/${projectId}/layers/${layerId}/features/near`, {
  lat: 40.7128,
  lng: -74.0060,
  radiusMeters: 1000
});
```

## Testing

1. **Create a layer**: Layer → Create Layer → Input Data
2. **Add features**: Click "➕ Add Features" in the layer panel
3. **Check database**: Go to Supabase → Table Editor → `gis_layers` and `gis_features`
4. **Reload page**: Layers should persist and load from database

## Troubleshooting

**Error: relation "gis_layers" does not exist**
- Run the SQL migration in Supabase SQL Editor

**Error: 401 Unauthorized**
- Check that user is logged in and token is valid

**Error: function does not exist**
- Make sure all PostGIS functions from migration are created

**Features not appearing on map**
- Check coordinates are [lng, lat] not [lat, lng]
- Verify geometry type matches layer type
- Check browser console for errors

