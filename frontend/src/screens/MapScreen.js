import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../features/auth/authSlice';
import { getMaps, getLocations, createMap, createLocation, reset } from '../features/maps/mapSlice'; 
import { screenStyles, componentStyles } from '../styles';
import MapView from '../components/MapView';

const MapScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const { maps, locations, isMapLoading, isMapSuccess, isMapError, mapMessage, isLocationLoading, isLocationSuccess, isLocationError, locationMessage } = useSelector((state) => state.maps);
    const { user } = useSelector((state) => state.auth);
    const [createMapModalVisible, setCreateMapModalVisible] = useState(false);
    const [selectedMapId, setSelectedMapId] = useState(null);

    const [newMap, setNewMap] = useState({
      title: '',
      description: '',
    });
    const [mapCreated, setMapCreated] = useState(false);
  
    const initialRegion = {
      latitude: 18.1263,
      longitude: -65.4401,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    
  useEffect(() => {
      dispatch(loadUser());
  }, [dispatch]);
  
  useEffect(() => {
    if (!user) {
        navigation.navigate('Login')
        return
    }
    dispatch(getMaps())
    return () => {
        dispatch(reset())
    }
  }, [user, dispatch])

  useEffect(() => {
      if (isMapError) {
          console.log('Error:', mapMessage)
      }
      if(isLocationError) {
        console.log('Error:', locationMessage)
      }
  }, [isMapError, isLocationError, mapMessage, locationMessage])

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
  }

  const handleMapSelect = (mapId) => {
    setSelectedMapId(mapId);
    dispatch(getLocations(mapId));
  }

  return(
    <SafeAreaView style={screenStyles.mapScreen.container}>
      {/* Map Selection */}
      <View style={screenStyles.mapScreen.mapSelector}>
        <View style={screenStyles.mapScreen.mapSelectorHeader}>
          <Text style={screenStyles.mapScreen.mapSelectorTitle}>Select Map:</Text>
          {maps.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={screenStyles.mapScreen.mapOptionsContainer}>
              {maps.map((map) => (
                <TouchableOpacity
                  key={map.id}
                  style={[
                    screenStyles.mapScreen.mapOption,
                    selectedMapId === map.id && screenStyles.mapScreen.selectedMapOption
                  ]}
                  onPress={() => handleMapSelect(map.id)}
                >
                  <Text style={[
                    screenStyles.mapScreen.mapOptionText,
                    selectedMapId === map.id && screenStyles.mapScreen.selectedMapOptionText
                  ]}>
                    {map.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={screenStyles.mapScreen.noMapsText}>No maps available</Text>
          )}
          <TouchableOpacity
            style={screenStyles.mapScreen.createMapButton}
            onPress={() => setCreateMapModalVisible(true)}
          >
            <Text style={screenStyles.mapScreen.createMapButtonText}>+ Create Map</Text>
          </TouchableOpacity>
        </View>
      </View>
      {selectedMapId && (
        <View style={screenStyles.mapScreen.map}>
          <MapView
            initialRegion={initialRegion}
            showStyleSelector={true}
          />
        </View>
      )}
      
      {/* Create Map Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createMapModalVisible}
        onRequestClose={() => setCreateMapModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={componentStyles.modal.overlay}>
          <View style={componentStyles.modal.content}>
            <Text style={componentStyles.modal.title}>Create New Map</Text>
            
            <ScrollView style={componentStyles.modal.formContainer}>
              <TextInput
                style={componentStyles.modal.input}
                placeholder="Map Title"
                value={newMap.title}
                onChangeText={(text) => setNewMap({ ...newMap, title: text })}
              />
              
              <TextInput
                style={componentStyles.modal.input}
                placeholder="Description (optional)"
                value={newMap.description}
                onChangeText={(text) => setNewMap({ ...newMap, description: text })}
                multiline
              />
            </ScrollView>

            <View style={componentStyles.modal.buttons}>
              <TouchableOpacity
                style={[componentStyles.modal.button, componentStyles.modal.cancelButton]}
                onPress={() => setCreateMapModalVisible(false)}
              >
                <Text style={componentStyles.modal.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[componentStyles.modal.button, componentStyles.modal.saveButton]}
                onPress={handleCreateMap}
                disabled={isMapLoading}
              >
                <Text style={componentStyles.modal.saveButtonText}>
                  {isMapLoading ? 'Creating...' : 'Create Map'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>  
    </SafeAreaView>
  )
}
export default MapScreen