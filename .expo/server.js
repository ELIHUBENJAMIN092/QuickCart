const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Habilita CORS
app.use(express.json()); // Permite manejar JSON

// Endpoint de prueba
app.get('/api/product/list', (req, res) => {
  res.json([
    { id: 1, nombre: 'Producto 1', precio: 20 },
    { id: 2, nombre: 'Producto 2', precio: 35 }
  ]);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT} y accesible en la red`);
});

