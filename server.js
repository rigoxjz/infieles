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
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT *, 
              (votos->>'aprobar')::int AS aprobar,
              (votos->>'refutar')::int AS refutar,
              (votos->>'denunciar')::int AS denunciar
       FROM infieles 
       ORDER BY id DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total: result.rowCount }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error cargando lista" });
  }
});

// ============================
// DETALLE
// ============================
app.get("/infieles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query(
      `SELECT *, 
              (votos->>'aprobar')::int AS aprobar,
              (votos->>'refutar')::int AS refutar,
              (votos->>'denunciar')::int AS denunciar
       FROM infieles WHERE id = $1`,
      [id]
    );
    if (q.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(q.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Error" });
  }
});

// ============================
// CREAR CHISME
// ============================
app.post("/infieles", async (req, res) => {
  try {
    const {
      reportero = "Anónimo",
      nombre,
      apellido,
      edad,
      ubicacion,
      historia,
      imagenes = []
    } = req.body;

    if (!nombre || !ubicacion || !historia) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const clean = (s) => (typeof s === "string" ? s.trim().slice(0, 5000) : "");

    const result = await pool.query(
      `INSERT INTO infieles 
       (reportero, nombre, apellido, edad, ubicacion, historia, imagenes, votos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        clean(reportero),
        clean(nombre),
        clean(apellido) || null,
        edad ? parseInt(edad) : null,
        clean(ubicacion),
        clean(historia),
        imagenes,
        { aprobar: 0, refutar: 0, denunciar: 0 }
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("ERROR GUARDANDO:", e.message);
    res.status(500).json({ error: "No se pudo guardar", detalle: e.message });
  }
});

// ============================
// VOTAR
// ============================
app.post("/votar/:id", async (req, res) => {
  try {
    const { tipo } = req.body;
    const { id } = req.params;
    if (!["aprobar", "refutar", "denunciar"].includes(tipo)) {
      return res.status(400).json({ error: "Voto inválido" });
    }

    const q = await pool.query(
      `UPDATE infieles 
       SET votos = jsonb_set(
         COALESCE(votos, '{"aprobar":0,"refutar":0,"denunciar":0}'::jsonb),
         '{${tipo}}',
         (COALESCE((votos->>${tipo})::int, 0) + 1)::text::jsonb
       )
       WHERE id = $1
       RETURNING votos`,
      [id]
    );

    if (q.rowCount === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true, votos: q.rows[0].votos });
  } catch (e) {
    res.status(500).json({ error: "Error al votar" });
  }
});

// 404
app.use("*", (req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API ON en puerto ${PORT}`));
