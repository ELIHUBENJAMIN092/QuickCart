// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClerkProvider, SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-expo';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// Tu llave pública de Clerk (reemplaza con la tuya)
const CLERK_PUBLISHABLE_KEY = 'pk_test_aWRlYWwtc3RpbmdyYXktNDIuY2xlcmsuYWNjb3VudHMuZGV2JA';

const Stack = createNativeStackNavigator();

const tokenCache = {
  async getToken(key) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key, value) {
    return SecureStore.setItemAsync(key, value);
  },
};

function ClerkWithProvider({ children }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}

// Componente que sincroniza usuario con backend
function SyncUserWithBackend() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const crearOActualizarUsuario = async () => {
      try {
        await axios.post('http://192.168.31.208:3000/api/users', { 
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.firstName,
          imageUrl: user.imageUrl,
        });
      } catch (error) {
        console.error('Error sincronizando usuario con backend:', error);
      }
    };

    crearOActualizarUsuario();
  }, [user]);


  return null;
}

export default function App() {
  return (
    <ClerkWithProvider>
      <NavigationContainer>
        <SignedIn>
          <SyncUserWithBackend />
          <Stack.Navigator initialRouteName="Inicio">
            <Stack.Screen name="Inicio" component={HomeScreen} />
            <Stack.Screen name="Carrito" component={CartScreen} />
          </Stack.Navigator>
        </SignedIn>

        <SignedOut>
          <SignIn
            path="/sign-in"
            routing="path"
          // Aquí Clerk muestra Google y otros providers si están configurados en el Dashboard
          />
        </SignedOut>
      </NavigationContainer>
    </ClerkWithProvider>
  );
}
