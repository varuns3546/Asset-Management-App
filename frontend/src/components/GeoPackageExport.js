import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { exportGeoPackage, getExportStats, resetExport, resetStats } from '../features/geopackage/geopackageSlice';
import { componentStyles, commonStyles } from '../styles';

const GeoPackageExport = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    exportStats,
    isExporting,
    isExportSuccess,
    isExportError,
    exportMessage,
    isStatsLoading,
    isStatsSuccess,
    isStatsError,
    statsMessage,
  } = useSelector((state) => state.geopackage);

  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(getExportStats());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (isExportError) {
      Alert.alert('Export Error', exportMessage || 'Failed to export data');
      dispatch(resetExport());
    }
  }, [isExportError, exportMessage, dispatch]);

  useEffect(() => {
    if (isExportSuccess) {
      const message = Platform.OS === 'web' 
        ? 'Your data has been exported successfully! The file should download automatically. Check your downloads folder.'
        : 'Your data has been exported successfully! On mobile, you may need to manually save the file.';
      
      Alert.alert(
        'Export Successful',
        message,
        [{ text: 'OK', onPress: () => dispatch(resetExport()) }]
      );
    }
  }, [isExportSuccess, dispatch]);

  useEffect(() => {
    if (isStatsError) {
      console.log('Stats Error:', statsMessage);
      dispatch(resetStats());
    }
  }, [isStatsError, statsMessage, dispatch]);

  const handleExport = () => {
    console.log('Export button pressed');
    console.log('Export stats:', exportStats);
    
    if (!exportStats || exportStats.total === 0) {
      Alert.alert('No Data', 'You have no data to export. Please create some entries, maps, or locations first.');
      return;
    }

    // First, let's test a simple download
    if (Platform.OS === 'web') {
      console.log('Testing simple download...');
      const testBlob = new Blob(['{"test": "data"}'], { type: 'application/geopackage+sqlite3' });
      const url = window.URL.createObjectURL(testBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'test.gpkg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Test download completed');
    }

    // Start export immediately
    console.log('Starting export...');
    dispatch(exportGeoPackage());
  };

  const handleRefreshStats = () => {
    dispatch(getExportStats());
  };

  const formatStats = () => {
    if (!exportStats) return 'Loading...';
    
    return `${exportStats.entries} entries, ${exportStats.maps} maps, ${exportStats.locations} locations`;
  };

  return (
    <View style={componentStyles.geopackageExport.container}>
      <Text style={componentStyles.geopackageExport.title}>Data Export</Text>
      
      {/* Statistics Section */}
      <View style={componentStyles.geopackageExport.statsSection}>
        <View style={componentStyles.geopackageExport.statsHeader}>
          <Text style={componentStyles.geopackageExport.statsTitle}>Your Data</Text>
          <TouchableOpacity
            style={componentStyles.geopackageExport.refreshButton}
            onPress={handleRefreshStats}
            disabled={isStatsLoading}
          >
            <Text style={componentStyles.geopackageExport.refreshButtonText}>
              {isStatsLoading ? 'Loading...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={componentStyles.geopackageExport.statsText}>
          {formatStats()}
        </Text>
        
        {exportStats && exportStats.total > 0 && (
          <Text style={componentStyles.geopackageExport.totalText}>
            Total: {exportStats.total} items
          </Text>
        )}
      </View>

      {/* Export Section */}
      <View style={componentStyles.geopackageExport.exportSection}>
        <Text style={componentStyles.geopackageExport.sectionTitle}>
          Export as GeoPackage
        </Text>
        
        <Text style={componentStyles.geopackageExport.description}>
          Export all your data (entries, maps, and locations) as a GeoPackage file (.gpkg). 
          This includes spatial data for all your geographic locations in a standard format.
        </Text>

        <TouchableOpacity
          style={[
            componentStyles.geopackageExport.exportButton,
            (!exportStats || exportStats.total === 0) && componentStyles.geopackageExport.disabledButton
          ]}
          onPress={handleExport}
          disabled={isExporting || !exportStats || exportStats.total === 0}
        >
          <Text style={componentStyles.geopackageExport.exportButtonText}>
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Text>
        </TouchableOpacity>
        {isExporting && (
          <Text style={componentStyles.geopackageExport.loadingText}>
            Preparing your data for export...
          </Text>
        )}
      </View>

      {/* Info Section */}
      <View style={componentStyles.geopackageExport.infoSection}>
        <Text style={componentStyles.geopackageExport.infoTitle}>About GeoPackage Export</Text>
        <Text style={componentStyles.geopackageExport.infoText}>
          • Exports all your entries, maps, and locations{'\n'}
          • Includes spatial data for geographic features{'\n'}
          • File format: GeoPackage (.gpkg){'\n'}
          • Compatible with GIS software like QGIS, ArcGIS{'\n'}
          • Contains metadata about your data
        </Text>
      </View>
    </View>
  );
};

export default GeoPackageExport;
