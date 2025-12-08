import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// === Conexión a Render Postgres ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ======================
//   GUARDAR REPORTE
// ======================
app.post("/api/infieles", async (req, res) => {
  try {
    const { reportero, nombre, apellido, edad, ubicacion, historia, imagenes } = req.body;

    const result = await pool.query(
      `INSERT INTO infieles (reportero, nombre, apellido, edad, ubicacion, historia, imagenes) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [reportero, nombre, apellido, edad, ubicacion, historia, imagenes]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al guardar reporte" });
  }
});

// ======================
//   LISTAR REPORTES
// ======================
app.get("/api/infieles", async (req, res) => {
  const r = await pool.query(`SELECT * FROM infieles ORDER BY id DESC`);
  res.json(r.rows);
});

// ======================
//   OBTENER UN REPORTE
// ======================
app.get("/api/infieles/:id", async (req, res) => {
  const { id } = req.params;
  const r = await pool.query(`SELECT * FROM infieles WHERE id=$1`, [id]);
  res.json(r.rows[0]);
});

// ======================
//   VOTAR (APROBAR / REFUTAR / DENUNCIAR)
// ======================
app.post("/api/votar", async (req, res) => {
  const { id, tipo } = req.body;

  const columna = tipo === "verde" ? "v_aprobar" :
                  tipo === "rojo" ? "v_refutar" :
                  tipo === "naranja" ? "v_denunciar" : null;

  if (!columna) return res.status(400).json({ error: "Tipo inválido" });

  await pool.query(`UPDATE infieles SET ${columna} = ${columna} + 1 WHERE id=$1`, [id]);

  res.json({ success: true });
});

// ======================
//   COMENTARIOS
// ======================
app.post("/api/comentario", async (req, res) => {
  const { id, usuario, comentario, prueba } = req.body;

  await pool.query(
    `INSERT INTO comentarios (id_reporte, usuario, comentario, prueba)
     VALUES ($1,$2,$3,$4)`,
    [id, usuario, comentario, prueba]
  );

  res.json({ success: true });
});

// ======================
//   OBTENER COMENTARIOS
// ======================
app.get("/api/comentario/:id", async (req, res) => {
  const { id } = req.params;
  const r = await pool.query(`SELECT * FROM comentarios WHERE id_reporte=$1 ORDER BY id DESC`, [id]);
  res.json(r.rows);
});

app.listen(3000, () => console.log("Servidor activo en puerto 3000"));
