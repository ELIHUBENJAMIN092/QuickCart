import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.31.208:3000/api/product/list';

export default function HomeScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await axios.get(API_URL);
        setProductos(res.data.products || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setCargando(false);
      }
    };
    obtenerDatos();
  }, []);

  const categorias = [
    { nombre: 'Inkjet Printers', imagen: require('./assets/inkjet.png') },
    { nombre: 'Document Scanners', imagen: require('./assets/scanner.png') },
    { nombre: 'POS Printers', imagen: require('./assets/pos.png') },
    { nombre: 'Printer Ink', imagen: require('./assets/ink.png') },
  ];

  const destacados = productos.slice(0, 2); // o filtrados por algún atributo

  if (cargando) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Printers</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search"
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <Text style={styles.sectionTitle}>Featured</Text>
      <FlatList
        data={destacados}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.featuredCard}>
            <Image
              source={{ uri: item.image[0] || 'https://via.placeholder.com/150' }}
              style={styles.featuredImage}
            />
            <Text style={styles.featuredText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.categoriesContainer}>
        {categorias.map((cat, index) => (
          <TouchableOpacity key={index} style={styles.categoryCard}>
            <Image source={cat.imagen} style={styles.categoryImage} />
            <Text style={styles.categoryText}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  titulo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  searchInput: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  featuredCard: {
    backgroundColor: '#fff',
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    width: 200,
  },
  featuredImage: { width: '100%', height: 120 },
  featuredText: { padding: 8, fontWeight: '500' },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryImage: { width: 60, height: 60, marginBottom: 8 },
  categoryText: { textAlign: 'center', fontWeight: '600' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
