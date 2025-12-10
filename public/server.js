import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ============================
// LISTAR TODOS
// ============================
app.get("/infieles", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM infieles ORDER BY id DESC");
    res.json(q.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================
// OBTENER DETALLE
// ============================
app.get("/infieles/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM infieles WHERE id=$1", [
      req.params.id,
    ]);

    if (q.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    res.json(q.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================
// CREAR NUEVO CHISME
// ============================
app.post("/infieles", async (req, res) => {
  try {
    const { reportero, nombre, apellido, ubicacion, historia, imagenes } =
      req.body;

    const q = await pool.query(
      `INSERT INTO infieles 
      (reportero, nombre, apellido, ubicacion, historia, imagenes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [reportero, nombre, apellido, ubicacion, historia, imagenes]
    );

    res.json(q.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================
// VOTAR
// ============================
app.post("/votar/:id", async (req, res) => {
  try {
    const { tipo } = req.body;
    const id = req.params.id;

    const q = await pool.query("SELECT votos FROM infieles WHERE id=$1", [id]);

    if (q.rows.length === 0)
      return res.status(404).json({ error: "No encontrado" });

    const votos = q.rows[0].votos || {
      aprobar: 0,
      refutar: 0,
      denunciar: 0,
    };

    votos[tipo]++;

    await pool.query("UPDATE infieles SET votos=$1 WHERE id=$2", [
      votos,
      id,
    ]);

    res.json({ ok: true, votos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================
// SERVIDOR
// ============================
app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));
