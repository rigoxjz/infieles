import express from "express";
import cors from "cors";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const app = express();

// Para usar rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// SERVIR FRONTEND desde /public
app.use(express.static(path.join(__dirname, "public")));

// ==========================
// CONEXIÓN A RENDER POSTGRES
// ==========================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================
// API: GUARDAR REPORTE
// ==========================
app.post("/api/infieles", async (req, res) => {
  try {
    const { reportero, nombre, apellido, edad, ubicacion, historia, imagenes } = req.body;

    const result = await pool.query(
      `INSERT INTO infieles (reportero, nombre, apellido, edad, ubicacion, historia, imagenes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [reportero, nombre, apellido, edad, ubicacion, historia, imagenes]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ERROR AL GUARDAR REPORTE:", err);
    res.status(500).json({ error: "No se pudo guardar el reporte" });
  }
});

// ==========================
// API: LISTAR REPORTES
// ==========================
app.get("/api/infieles", async (req, res) => {
  const r = await pool.query(`SELECT * FROM infieles ORDER BY id DESC`);
  res.json(r.rows);
});

// ==========================
// API: OBTENER UN REPORTE
// ==========================
app.get("/api/infieles/:id", async (req, res) => {
  const { id } = req.params;
  const r = await pool.query(`SELECT * FROM infieles WHERE id=$1`, [id]);
  res.json(r.rows[0]);
});

// ==========================
// API: VOTAR
// ==========================
app.post("/api/votar", async (req, res) => {
  const { id, tipo } = req.body;

  const col =
    tipo === "verde" ? "v_aprobar" :
    tipo === "rojo" ? "v_refutar" :
    tipo === "naranja" ? "v_denunciar" :
    null;

  if (!col) return res.status(400).json({ error: "Tipo inválido" });

  await pool.query(`UPDATE infieles SET ${col} = ${col} + 1 WHERE id = $1`, [id]);

  res.json({ success: true });
});

// ==========================
// API: AGREGAR COMENTARIO
// ==========================
app.post("/api/comentario", async (req, res) => {
  const { id, usuario, comentario, prueba } = req.body;

  await pool.query(
    `INSERT INTO comentarios (id_reporte, usuario, comentario, prueba)
     VALUES ($1,$2,$3,$4)`,
    [id, usuario, comentario, prueba]
  );

  res.json({ success: true });
});

// ==========================
// API: LISTAR COMENTARIOS
// ==========================
app.get("/api/comentario/:id", async (req, res) => {
  const { id } = req.params;
  const r = await pool.query(
    `SELECT * FROM comentarios WHERE id_reporte=$1 ORDER BY id DESC`,
    [id]
  );
  res.json(r.rows);
});

// ==========================
// SPA fallback
// ==========================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================
// INICIO
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 Servidor listo en puerto", PORT));
