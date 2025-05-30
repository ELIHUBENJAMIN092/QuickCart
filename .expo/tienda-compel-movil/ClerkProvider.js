import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key, value) {
    return SecureStore.setItemAsync(key, value);
  },
};

// Reemplaza esto con tu Publishable Key desde Clerk Dashboard
const CLERK_PUBLISHABLE_KEY = 'pk_test_aWRlYWwtc3RpbmdyYXktNDIuY2xlcmsuYWNjb3VudHMuZGV2JA';

export default function ClerkWithProvider({ children }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}
