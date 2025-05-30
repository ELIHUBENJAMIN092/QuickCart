import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/clerk-expo';

const API_URL = 'http://192.168.31.208:3000/api/product/list';

export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useAuth();

  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const respuesta = await axios.get(API_URL);
        setProductos(respuesta.data.products);
      } catch (error) {
        console.error('Error obteniendo productos:', error);
      }
    };

    const obtenerCarritoGuardado = async () => {
      try {
        const guardado = await AsyncStorage.getItem('carrito');
        if (guardado) setCarrito(JSON.parse(guardado));
      } catch (error) {
        console.error('Error cargando carrito:', error);
      }
    };

    obtenerProductos();
    obtenerCarritoGuardado();
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
        title={`Ir al carrito (${carrito.length})`}
        onPress={() => navigation.navigate('Carrito', { carrito })}
      />

      <FlatList
        data={productos}
        renderItem={({ item }) => {
          // Validar imagen
          const imageUri = Array.isArray(item.image) && item.image.length > 0
            ? item.image[0]
            : typeof item.image === 'string' && item.image.length > 0
            ? item.image
            : 'https://via.placeholder.com/100'; // fallback si no hay imagen

          return (
            <View style={styles.card}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
              <Button title="Agregar al carrito" onPress={() => agregarAlCarrito(item)} />
            </View>
          );
        }}
        keyExtractor={item => item._id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  welcome: { fontSize: 24, marginBottom: 10, fontWeight: 'bold', textAlign: 'center' },
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
  },
  image: { width: 100, height: 100, borderRadius: 8 },
  name: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  price: { fontSize: 16, color: 'green', marginBottom: 10 },
});
