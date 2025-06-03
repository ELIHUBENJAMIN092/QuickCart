const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// URI de conexión a MongoDB
const MONGODB_URI = 'mongodb+srv://Compel:Compel8794@cluster0.diarpfy.mongodb.net/mydatabase?retryWrites=true&w=majority';

// Conexión a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Modelo de Usuario
const usuarioSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  imageUrl: String,
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Ruta: Crear o actualizar usuario
app.post('/api/users', async (req, res) => {
  const { clerkId, email, name, imageUrl } = req.body;

  if (!clerkId) {W
    return res.status(400).json({ message: 'clerkId es requerido' });
  }

  try {
    const usuarioExistente = await Usuario.findOne({ clerkId });

    if (usuarioExistente) {
      usuarioExistente.email = email;
      usuarioExistente.name = name;
      usuarioExistente.imageUrl = imageUrl;
      await usuarioExistente.save();
      return res.json({ message: 'Usuario actualizado', user: usuarioExistente });
    } else {
      const nuevoUsuario = new Usuario({ clerkId, email, name, imageUrl });
      await nuevoUsuario.save();
      return res.json({ message: 'Usuario creado', user: nuevoUsuario });
    }
  } catch (error) {
    console.error('Error en /api/users:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Ruta: Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    return res.json({ message: 'Lista de usuarios', users: usuarios });
  } catch (error) {
    console.error('Error en /api/users:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 🔥 Nueva ruta: Lista de productos
app.get('/api/product/list', (req, res) => {
  res.json([
    { id: 1, nombre: 'Producto 1', precio: 20 },
    { id: 2, nombre: 'Producto 2', precio: 35 }
  ]);
});

// Iniciar servidor
const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});
