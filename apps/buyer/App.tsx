import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EnrollmentScreen from './src/screens/EnrollmentScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Enrollment"
        screenOptions={{
          headerStyle: { backgroundColor: '#1A237E' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Enrollment" component={EnrollmentScreen} options={{ title: 'BPN Enrollment' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Payment History' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Security Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
