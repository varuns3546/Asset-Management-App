import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../features/auth/authSlice';
import { getMaps, getLocations, createMap, createLocation, reset } from '../features/maps/mapSlice'; 
import MapView from '../components/MapView';

const MapScreen = () => {
  const dispatch = useDispatch();
  const { maps, locations, isMapLoading, isMapSuccess, isMapError, mapMessage, isLocationLoading, isLocationSuccess, isLocationError, locationMessage } = useSelector((state) => state.maps);
  const { user } = useSelector((state) => state.auth);

  // Local state for UI
  const [modalVisible, setModalVisible] = useState(false);
  const [createMapModalVisible, setCreateMapModalVisible] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [mapCreated, setMapCreated] = useState(false);
  const [newLocation, setNewLocation] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    map_id: null,
  });
  const [newMap, setNewMap] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      return;
    }
    console.log('Loading maps for user:', user.id);
    dispatch(getMaps());
    return () => {
      dispatch(reset());
    };
  }, [user, dispatch]);

  useEffect(() => {
    console.log('Maps loaded:', maps);
    console.log('Selected map ID:', selectedMapId);
  }, [maps, selectedMapId]);

  useEffect(() => {
    console.log('Modal visible:', modalVisible);
  }, [modalVisible]);

  useEffect(() => {
    if (isMapError) {
      Alert.alert('Error', mapMessage);
    }
  }, [isMapError, mapMessage]);

  useEffect(() => {
    if (isLocationError) {
      Alert.alert('Error', locationMessage);
    }
  }, [isLocationError, locationMessage]);

  useEffect(() => {
    if (isLocationSuccess && selectedMapId) {
      Alert.alert('Success', 'Location added successfully!');
      setModalVisible(false);
      setNewLocation({
        title: '',
        description: '',
        latitude: '',
        longitude: '',
        map_id: null,
      });
    }
  }, [isLocationSuccess]);

  useEffect(() => {
    if (isMapSuccess && createMapModalVisible && mapCreated) {
      console.log('Map created successfully, closing modal');
      Alert.alert('Success', 'Map created successfully!');
      setCreateMapModalVisible(false);
      setMapCreated(false);
      setNewMap({
        title: '',
        description: '',
      });
      // Refresh maps list
      dispatch(getMaps());
    }
  }, [isMapSuccess, createMapModalVisible, mapCreated, dispatch]);

  // Reset map success when modal is opened
  useEffect(() => {
    if (createMapModalVisible) {
      console.log('Create map modal opened');
      setMapCreated(false);
    }
  }, [createMapModalVisible]);

  // Initial region (New York City)
  const initialRegion = {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handleMapPress = (event) => {
    if (!selectedMapId) {
      Alert.alert('Error', 'Please select a map first');
      return;
    }

    const { coordinate } = event;
    Alert.alert(
      'Add Location',
      `Would you like to add a location at ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            setNewLocation({
              ...newLocation,
              latitude: coordinate.latitude.toString(),
              longitude: coordinate.longitude.toString(),
              map_id: selectedMapId,
            });
            setModalVisible(true);
          }
        }
      ]
    );
  };

  const handleMarkerPress = (marker) => {
    Alert.alert(
      marker.title,
      `${marker.description}`,
      [
        { text: 'OK' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteLocation(marker.id)
        }
      ]
    );
  };

  const handleAddLocation = () => {
    if (!newLocation.title || !newLocation.latitude || !newLocation.longitude || !newLocation.map_id) {
      Alert.alert('Error', 'Please fill in all required fields and select a map');
      return;
    }

    const locationData = {
      title: newLocation.title,
      description: newLocation.description,
      latitude: parseFloat(newLocation.latitude),
      longitude: parseFloat(newLocation.longitude),
      map_id: newLocation.map_id,
    };

    dispatch(createLocation(locationData));
  };

  const handleCreateMap = () => {
    if (!newMap.title) {
      Alert.alert('Error', 'Please enter a map title');
      return;
    }

    const mapData = {
      title: newMap.title,
      description: newMap.description,
    };

    setMapCreated(true);
    dispatch(createMap(mapData));
  };

  const handleDeleteLocation = (locationId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete location functionality
            Alert.alert('Success', 'Location deleted successfully!');
          }
        }
      ]
    );
  };

  const handleMapSelect = (mapId) => {
    setSelectedMapId(mapId);
    dispatch(getLocations(mapId));
  };

  const getLocationStats = () => {
    const stats = {
      total: locations.length,
    };
    return stats;
  };

  const stats = getLocationStats();

  // Transform locations for MapView component
  const mapMarkers = locations.map(location => ({
    id: location.id,
    title: location.title,
    description: location.description,
    coordinate: {
      latitude: location.latitude,
      longitude: location.longitude,
    }
  }));

  return (
    <View style={styles.container}>
      {/* Map Selection */}
      <View style={styles.mapSelector}>
        <View style={styles.mapSelectorHeader}>
          <Text style={styles.mapSelectorTitle}>Select Map:</Text>
          <TouchableOpacity
            style={styles.createMapButton}
            onPress={() => setCreateMapModalVisible(true)}
          >
            <Text style={styles.createMapButtonText}>+ Create Map</Text>
          </TouchableOpacity>
        </View>
        {maps.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {maps.map((map) => (
              <TouchableOpacity
                key={map.id}
                style={[
                  styles.mapOption,
                  selectedMapId === map.id && styles.selectedMapOption
                ]}
                onPress={() => handleMapSelect(map.id)}
              >
                <Text style={[
                  styles.mapOptionText,
                  selectedMapId === map.id && styles.selectedMapOptionText
                ]}>
                  {map.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noMapsText}>No maps available. Create your first map!</Text>
        )}
      </View>

      <MapView
        initialRegion={initialRegion}
        markers={mapMarkers}
        onPress={handleMapPress}
        onMarkerPress={handleMarkerPress}
        style={styles.map}
        showStyleSelector={true}
      />

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Maps: {maps.length}</Text>
        <Text style={styles.debugText}>Selected: {selectedMapId || 'None'}</Text>
        <Text style={styles.debugText}>Modal: {modalVisible ? 'Visible' : 'Hidden'}</Text>
      </View>

      {/* Test Button for Debugging */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#FF9500', bottom: 100 }]}
        onPress={() => {
          console.log('Test button pressed');
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>Test Modal</Text>
      </TouchableOpacity>

      {/* Location Stats */}
      {selectedMapId && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Location Stats</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total:</Text>
            <Text style={styles.statsValue}>{stats.total}</Text>
          </View>
        </View>
      )}

      {/* Add Location Button */}
      {selectedMapId ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            console.log('Opening modal, selectedMapId:', selectedMapId);
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add Location</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#FF6B6B' }]}
          onPress={() => {
            Alert.alert('Select Map', 'Please select a map first before adding locations.');
          }}
        >
          <Text style={styles.addButtonText}>Select Map to Add Location</Text>
        </TouchableOpacity>
      )}

      {/* Add Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Location</Text>
            
            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Location Name"
                value={newLocation.title}
                onChangeText={(text) => setNewLocation({ ...newLocation, title: text })}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Latitude"
                value={newLocation.latitude}
                onChangeText={(text) => setNewLocation({ ...newLocation, latitude: text })}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Longitude"
                value={newLocation.longitude}
                onChangeText={(text) => setNewLocation({ ...newLocation, longitude: text })}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newLocation.description}
                onChangeText={(text) => setNewLocation({ ...newLocation, description: text })}
                multiline
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddLocation}
                disabled={isLocationLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLocationLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Map Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createMapModalVisible}
        onRequestClose={() => setCreateMapModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Map</Text>
            
            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Map Title"
                value={newMap.title}
                onChangeText={(text) => setNewMap({ ...newMap, title: text })}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                value={newMap.description}
                onChangeText={(text) => setNewMap({ ...newMap, description: text })}
                multiline
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateMapModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateMap}
                disabled={isMapLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isMapLoading ? 'Creating...' : 'Create Map'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapSelector: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  mapSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  createMapButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createMapButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noMapsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 10,
  },
  mapOption: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedMapOption: {
    backgroundColor: '#007AFF',
  },
  mapOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedMapOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    top: 150,
    left: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 150,
    zIndex: 100,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
    zIndex: 99,
  },
  debugText: {
    fontSize: 14,
    color: '#333',
  },
});

export default MapScreen; 