import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';

import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ClientHomeScreen from './src/screens/ClientHomeScreen';
import EnforcerScreen from './src/screens/EnforcerScreen';
// AdminScreen removed - Admin users should use web dashboard only

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Landing" component={LandingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user.role === 'client' && (
            <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
          )}
          {user.role === 'enforcer' && (
            <Stack.Screen name="EnforcerDashboard" component={EnforcerScreen} />
          )}
          {/* Admin users are blocked at login - they should use web dashboard */}
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
