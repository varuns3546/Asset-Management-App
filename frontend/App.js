import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerShown: false,
            gestureEnabled: true,
            cardStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ 
              title: 'Sign In',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ 
              title: 'Create Account',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ 
              title: 'Dashboard',
              headerShown: false 
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
