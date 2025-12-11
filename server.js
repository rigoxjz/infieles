import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

// Configuración básica
app.use(cors());
app.use(express.json({ limit: "50mb" })); // 50 MB está bien si subes imágenes base64

// ============================
// LISTAR TODOS (con paginación opcional)
// ============================

// Servir archivos estáticos de /public
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/infieles", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // máximo 100 por petición
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
      pagination: { page, limit, total: result.rowCount },
    });
  } catch (e) {
    console.error("Error en GET /infieles:", e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ============================
// DETALLE
// ============================
app.get("/infieles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: "ID inválido" });

    const q = await pool.query(
      `SELECT *, 
              (votos->>'aprobar')::int AS aprobar,
              (votos->>'refutar')::int AS refutar,
              (votos->>'denunciar')::int AS denunciar
       FROM infieles WHERE id = $1`,
      [id]
    );

    if (q.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }

    res.json(q.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

// ============================
// CREAR NUEVO CHISME
// ============================
app.post("/infieles", async (req, res) => {
  try {
    const { reportero, nombre, apellido, ubicacion, historia, imagenes } = req.body;

    // Validación básica (evita spam y campos vacíos)
    if (!reportero || !nombre || !historia) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Limpiar un poco el texto (evitar scripts maliciosos en JSON)
    const clean = (str) => (typeof str === "string" ? str.trim().substring(0, 5000) : str);

    const q = await pool.query(
      `INSERT INTO infieles 
       (reportero, nombre, apellido, ubicacion, historia, imagenes, votos, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING *`,
      [
        clean(reportero),
        clean(nombre),
        clean(apellido) || null,
        clean(ubicacion) || null,
        clean(historia),
        imagenes || [], // array de strings base64 o URLs
        JSON.stringify({ aprobar: 0, refutar: 0, denunciar: 0 }), // valor por defecto
      ]
    );

    res.status(201).json(q.rows[0]);
  } catch (e) {
    console.error("Error creando infiel:", e);
    if (e.code === "23505") {
      return res.status(400).json({ error: "Ya existe un registro duplicado" });
    }
    res.status(500).json({ error: "Error al crear el chisme" });
  }
});

// ============================
// VOTAR (ahora es atómico y evita race conditions)
// ============================
app.post("/votar/:id", async (req, res) => {
  try {
    const { tipo } = req.body;
    const { id } = req.params;

    if (!["aprobar", "refutar", "denunciar"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de voto inválido" });
    }

    // Usamos UPDATE con RETURNING y JSONB para que sea atómico
    const q = await pool.query(
      `UPDATE infieles 
       SET votos = jsonb_set(
         votos, 
         '{${tipo}}', 
         ((COALESCE(votos->>${tipo}, '0'))::int + 1)::text::jsonb
       )
       WHERE id = $1 
       RETURNING votos, 
                (votos->>'aprobar')::int AS aprobar,
                (votos->>'refutar')::int AS refutar,
                (votos->>'denunciar')::int AS denunciar`,
      [id]
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ error: "Chisme no encontrado" });
    }

    res.json({ ok: true, votos: q.rows[0] });
  } catch (e) {
    console.error("Error votando:", e);
    res.status(500).json({ error: "Error al votar" });
  }
});

// ============================
// 404 global
// ============================
app.use("*", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ============================
// SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
