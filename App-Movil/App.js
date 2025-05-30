import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// Screens
import SignInScreen from './screens/SignInScreen'; // Asegúrate de que exista este archivo
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';

// Clerk Publishable Key
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

function SyncUserWithBackend() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const sync = async () => {
      try {
        await axios.post('http://192.168.31.208:4000/api/users', {
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.firstName,
          imageUrl: user.imageUrl,
        });
      } catch (err) {
        console.error('Error sincronizando usuario:', err);
      }
    };

    sync();
  }, [user]);

  return null;
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <NavigationContainer>
        <SignedIn>
          <SyncUserWithBackend />
          <Stack.Navigator initialRouteName="Inicio">
            <Stack.Screen name="Inicio" component={HomeScreen} />
            <Stack.Screen name="Carrito" component={CartScreen} />
          </Stack.Navigator>
        </SignedIn>

        <SignedOut>
          <SignInScreen />
        </SignedOut>
      </NavigationContainer>
    </ClerkProvider>
  );
}
