import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import POSScreen from './src/screens/POSScreen';
import BiometricCaptureScreen from './src/screens/BiometricCaptureScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="POS" screenOptions={{ headerStyle: { backgroundColor: '#1A237E' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
        <Stack.Screen name="POS" component={POSScreen} options={{ title: 'BPN Seller POS' }} />
        <Stack.Screen name="BiometricCapture" component={BiometricCaptureScreen} options={{ title: 'Biometric Capture' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}