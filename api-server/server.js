const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Cambia esta URI por tu URI real (con usuario, contraseña, DB)
const MONGODB_URI = 'mongodb+srv://Compel:Compel8794@cluster0.diarpfy.mongodb.net/mydatabase?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB conectado'))
.catch(err => console.error('Error conectando a MongoDB:', err));

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Definimos esquema y modelo Usuario
const usuarioSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  imageUrl: String,
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Ruta para crear o actualizar usuario
app.post('/api/users', async (req, res) => {
  const { clerkId, email, name, imageUrl } = req.body;

  if (!clerkId) return res.status(400).json({ message: 'clerkId es requerido' });

  try {
    const usuarioExistente = await Usuario.findOne({ clerkId });

    if (usuarioExistente) {
      // Actualizar datos
      usuarioExistente.email = email;
      usuarioExistente.name = name;
      usuarioExistente.imageUrl = imageUrl;
      await usuarioExistente.save();
      return res.json({ message: 'Usuario actualizado', user: usuarioExistente });
    } else {
      // Crear usuario nuevo
      const nuevoUsuario = new Usuario({ clerkId, email, name, imageUrl });
      await nuevoUsuario.save();
      return res.json({ message: 'Usuario creado', user: nuevoUsuario });
    }
  } catch (error) {
    console.error('Error en /api/users:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Puerto y start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});
