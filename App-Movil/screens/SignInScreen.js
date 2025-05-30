import React from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

// Necesario para completar sesiones abiertas por el navegador
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('Error en el login:', err);
      Alert.alert('Error', 'No se pudo iniciar sesión. Intenta nuevamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Iniciar sesión con Google" onPress={handleSignIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
