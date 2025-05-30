import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-expo';

const API_URL = 'http://192.168.31.208:3000/api/product/list';

export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useAuth();

  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const [resProductos, guardadoCarrito] = await Promise.all([
          axios.get(API_URL),
          AsyncStorage.getItem('carrito'),
        ]);

        setProductos(resProductos.data.products || []);
        if (guardadoCarrito) setCarrito(JSON.parse(guardadoCarrito));
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos.');
        console.error('Error en HomeScreen:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []);

  const guardarCarrito = async (nuevoCarrito) => {
    try {
      await AsyncStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
  };

  const agregarAlCarrito = (producto) => {
    const actualizado = [...carrito, producto];
    setCarrito(actualizado);
    guardarCarrito(actualizado);
  };

  const renderItem = ({ item }) => {
    const imageUri = Array.isArray(item.image) && item.image.length > 0
      ? item.image[0]
      : typeof item.image === 'string' && item.image
      ? item.image
      : 'https://via.placeholder.com/100';

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>${item.price?.toFixed(2) || '0.00'}</Text>
        <Button title="Agregar al carrito" onPress={() => agregarAlCarrito(item)} />
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <>
          <Text style={styles.welcome}>¡Bienvenido, {user.firstName}!</Text>
          {user.imageUrl && <Image source={{ uri: user.imageUrl }} style={styles.avatar} />}
          <Button title="Cerrar Sesión" color="red" onPress={signOut} />
        </>
      )}

      <Button
        title={`🛒 Ir al carrito (${carrito.length})`}
        onPress={() => navigation.navigate('Carrito')}
      />

      <FlatList
        data={productos}
        renderItem={renderItem}
        keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  welcome: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  image: { width: 100, height: 100, borderRadius: 8 },
  name: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  price: { fontSize: 16, color: 'green', marginBottom: 10 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
