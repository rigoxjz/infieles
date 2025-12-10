import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(cors());
app.use(express.json());

// =============================
// LISTAR INFIELES
// =============================
app.get("/infieles", async (req, res) => {
  const q = await pool.query("SELECT * FROM infieles ORDER BY id DESC");
  res.json(q.rows);
});

// =============================
// VER DETALLE
// =============================
app.get("/infieles/:id", async (req, res) => {
  const id = req.params.id;
  const q = await pool.query("SELECT * FROM infieles WHERE id=$1", [id]);
  res.json(q.rows[0]);
});

// =============================
// CREAR NUEVO INFIEL
// =============================
app.post("/infieles", async (req, res) => {
  const { nombre, apellido, ubicacion, historia, imagenes, reportero } = req.body;

  const result = await pool.query(
    `INSERT INTO infieles (nombre, apellido, ubicacion, historia, imagenes, reportero)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [nombre, apellido, ubicacion, historia, imagenes || [], reportero]
  );

  res.json({ ok: true, data: result.rows[0] });
});

// =============================
// VOTAR
// =============================
app.post("/votar/:id", async (req, res) => {
  const id = req.params.id;
  const { tipo } = req.body;

  await pool.query(`
      UPDATE infieles
      SET votos = jsonb_set(votos, '{${tipo}}', ((votos->>'${tipo}')::int + 1)::text::jsonb)
      WHERE id=$1
  `, [id]);

  await pool.query(
    "INSERT INTO votos_log (infiel_id, tipo) VALUES ($1,$2)",
    [id, tipo]
  );

  res.json({ ok: true });
});

app.listen(3000, () => console.log("SERVER READY"));
