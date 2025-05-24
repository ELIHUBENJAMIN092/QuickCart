import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.31.208:3000/api/product/list';

export default function App() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const respuesta = await axios.get(API_URL);
        setProductos(respuesta.data.products); // ✅ Accede correctamente a "products"
      } catch (error) {
        console.error('Error obteniendo productos:', error);
      }
    };

    obtenerProductos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Tienda Online</Text>
      <FlatList
        data={productos}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image[0] }} style={styles.image} />  {/* ✅ Muestra la primera imagen */}
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.price}</Text>
          </View>
        )}
        keyExtractor={item => item._id.toString()}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  price: {
    fontSize: 16,
    color: 'green',
  },
});
