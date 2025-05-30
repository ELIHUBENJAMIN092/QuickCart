import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';

export default function CartScreen() {
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const cargarCarrito = async () => {
      try {
        const guardado = await AsyncStorage.getItem('carrito');
        if (guardado) setCarrito(JSON.parse(guardado));
      } catch (error) {
        console.error('Error al cargar el carrito:', error);
      }
    };
    cargarCarrito();
  }, []);

  const eliminarDelCarrito = async (index) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
    try {
      await AsyncStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    } catch (error) {
      console.error('Error al guardar el carrito:', error);
    }
  };

  const total = carrito.reduce((sum, item) => sum + (item.price || 0), 0);

  const renderItem = ({ item, index }) => {
    const imageUri = Array.isArray(item.image) && item.image.length > 0
      ? item.image[0]
      : typeof item.image === 'string' && item.image
        ? item.image
        : 'https://via.placeholder.com/70';

    return (
      <View style={styles.item}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name || 'Producto sin nombre'}</Text>
          <Text style={styles.price}>${item.price?.toFixed(2) || '0.00'}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() =>
              Alert.alert(
                'Eliminar producto',
                '¿Estás seguro de eliminar este producto del carrito?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', onPress: () => eliminarDelCarrito(index) },
                ]
              )
            }
          >
            <AntDesign name="delete" size={20} color="white" />
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛍️ Carrito de Compras</Text>

      {carrito.length === 0 ? (
        <Text style={styles.emptyText}>Tu carrito está vacío</Text>
      ) : (
        <>
          <FlatList
            data={carrito}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
          />
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 1,
  },
  image: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginRight: 15,
    borderRadius: 4,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 14, color: '#666', marginBottom: 5 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9534f',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  deleteText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
});
