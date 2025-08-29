import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import EntryScreen from './EntryScreen';
import UploadScreen from './UploadScreen';
import MapScreen from './MapScreen';
import GeoPackageScreen from './GeoPackageScreen';
import ProjectNavbar from '../components/ProjectNavbar';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

const MainTabScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1 }}>
      {/* Project Navigation Bar */}
      <ProjectNavbar navigation={navigation} />
      
      {/* Tab Navigator */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

             if (route.name === 'Entries') {
              iconName = focused ? '➕' : '➕';
            } else if (route.name === 'Upload') {
              iconName = focused ? '☁️' : '☁️';
            } else if (route.name === 'Map') {
              iconName = focused ? '🗺️' : '🗺️';
            } else if (route.name === 'Export') {
              iconName = focused ? '📦' : '📦';
            }

            return <Text style={{ fontSize: size, color: color }}>{iconName}</Text>;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
            name="Entries" 
          component={EntryScreen}
          options={{
            title: 'Create Entries',
            tabBarLabel: 'Entries',
          }}
        />
        <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            title: 'Interactive Map',
            tabBarLabel: 'Map',
          }}
        />
        <Tab.Screen 
          name="Upload" 
          component={UploadScreen}
          options={{
            title: 'Upload',
            tabBarLabel: 'Upload',
          }}
        />
        <Tab.Screen 
          name="Export" 
          component={GeoPackageScreen}
          options={{
            title: 'Export Data',
            tabBarLabel: 'Export',
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

export default MainTabScreen; 