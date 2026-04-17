const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

console.log("Revisando la clave:", process.env.MONGO_URI); // <--- Agrega esta línea para debug

if (!process.env.MONGO_URI) {
  console.error(
    "❌ ERROR: No se encontró la variable MONGO_URI en el archivo .env"
  );
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ ¡Conectado a MongoDB Atlas!"))
    .catch((err) => console.error("❌ Error al conectar:", err));
}

const app = express();
app.use(express.json()); // Para entender archivos JSON
app.use(cors()); // Para evitar problemas de permisos
app.use(express.static(path.join(__dirname, '../frontend')));



// Usamos app.use en lugar de app.get para capturar todas las rutas
// y enviarlas al index.html
app.use((req, res, next) => {
    // Si la ruta no es de la API (tareas), enviamos el index.html
    if (!req.path.startsWith('/tareas')) {
        res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
    } else {
        next();
    }
});

const TaskSchema = new mongoose.Schema({
  titulo: String,
  chequeado: { type: Boolean, default: false },
  fecha_creacion: { type: String, default: () => new Date().toISOString().split('T')[0] }, // Formato AAAA-MM-DD
  notas: String,
  remitente: String,
});

const Task = mongoose.model("Task", TaskSchema);

// RUTA PARA GUARDAR TAREA
app.post("/tareas", async (req, res) => {
  try {
    const nuevaTarea = new Task(req.body);
    await nuevaTarea.save();
    res.send({ mensaje: "Tarea guardada con éxito" });
  } catch (err) { res.status(500).send(err); }
});

// RUTA PARA VER TAREAS (Con filtros opcionales)
app.get("/tareas", async (req, res) => {
  try {
    const { fecha, ultimosDias, noRealizadas } = req.query;
    const filtro = {};

    if (fecha) {
      filtro.fecha_creacion = fecha;
    } else if (ultimosDias) {
      const dias = Number.parseInt(ultimosDias, 10);
      if (!Number.isNaN(dias) && dias > 0) {
        const desde = new Date();
        desde.setHours(0, 0, 0, 0);
        desde.setDate(desde.getDate() - (dias - 1));
        const fechaDesde = desde.toISOString().split("T")[0];
        filtro.fecha_creacion = { $gte: fechaDesde };
      }
    }

    if (noRealizadas === "true") {
      filtro.chequeado = false;
    }

    const tareas = await Task.find(filtro).sort({ fecha_creacion: -1 });
    res.json(tareas);
  } catch (err) {
    res.status(500).send(err);
  }
});

// RUTA PARA ACTUALIZAR EL CHEQUEO
app.put("/tareas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { chequeado } = req.body;
        await Task.findByIdAndUpdate(id, { chequeado }); // <--- Cambiado de 'Tarea' a 'Task'
        res.json({ mensaje: "Estado actualizado" });
    } catch (err) { res.status(500).send(err); }
});

// RUTA PARA ELIMINAR UNA TAREA
app.delete("/tareas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE request received for id:', id);
    const eliminado = await Task.findByIdAndDelete(id);
    if (!eliminado) {
      console.log('No se encontró tarea con id:', id);
      return res.status(404).json({ mensaje: 'No se encontró la tarea' });
    }
    console.log('Tarea eliminada con id:', id);
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (err) {
    console.error('Error en DELETE /tareas/:id', err);
    res.status(500).send(err);
  }
});

// ... (El resto del app.listen se mantiene igual)// Busca el final de tu server.js y déjalo así:
/* const PUERTO = 3000;
app.listen(PUERTO, "0.0.0.0", () => {
  console.log(`🚀 Servidor listo en la red local!`);
  console.log(`PC: http://localhost:${PUERTO}`);
  console.log(`Celular: http://192.168.1.4:${PUERTO}`);
});
 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
