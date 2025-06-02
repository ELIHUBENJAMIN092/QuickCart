import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

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
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#49739c"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#49739c"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Log in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.signupText}>Don't have an account? Sign up</Text>
      </View>

      <Image
        source={require('../assets/light.png')} // o 'dark.png'
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // bg-slate-50
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  card: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0d141c',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 56,
    backgroundColor: '#e7edf4',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0d141c',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0c7ff2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#49739c',
    textDecorationLine: 'underline',
    marginTop: 12,
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 390 / 320, // igual que en tu HTML
  },
});
