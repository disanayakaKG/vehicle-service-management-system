import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';

import { ProductProvider } from './src/context/ProductContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ProductProvider>
    </AuthProvider>
  );
}

