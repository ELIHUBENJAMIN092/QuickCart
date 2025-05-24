import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.31.208:3000/productos'; // Reemplaza con tu IP local

export default function App() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const respuesta = await axios.get(API_URL);
        setProductos(respuesta.data);
      } catch (error) {
        console.error('Error obteniendo productos:', error);
      }
    };

    obtenerProductos();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Bienvenido a la APP de Compel 24052025</Text>
      <FlatList
        data={productos}
        renderItem={({ item }) => <Text>{item.nombre} - ${item.precio}</Text>}
        keyExtractor={item => item.id.toString()}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
