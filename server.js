import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🟢 CONEXIÓN A POSTGRES DE RENDER
const pool = new pg.Pool({
  host: "dpg-d4rm7umuk2gs73eauuug-a.virginia-postgres.render.com",
  user: "infieles",
  password: "cQ1eK3awcS9J8l6pgLm0P20VbLZikt5W",
  database: "dbinfieles",
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// 🟢 Servir frontend
app.use(express.static("public"));


// =============================
//     API PARA REGISTROS
// =============================

// Guardar infiel
app.post("/api/infieles", async (req, res) => {
  try {
    const {
      reportero,
      nombre,
      apellido,
      edad,
      ubicacion,
      historia,
      imagenes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO infieles (reportero, nombre, apellido, edad, ubicacion, historia, imagenes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [reportero, nombre, apellido, edad, ubicacion, historia, imagenes]
    );

    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error("ERROR DB:", err);
    res.status(500).json({ error: err.message });
  }
});


// Obtener todos
app.get("/api/infieles", async (req, res) => {
  const r = await pool.query("SELECT * FROM infieles ORDER BY id DESC");
  res.json(r.rows);
});


// Obtener uno por ID
app.get("/api/infieles/:id", async (req, res) => {
  const r = await pool.query("SELECT * FROM infieles WHERE id = $1", [
    req.params.id
  ]);
  res.json(r.rows[0]);
});


// =============================
//          START SERVER
// =============================
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Servidor funcionando en puerto", port));
