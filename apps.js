const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Sirve archivos estáticos como index.html y script.js

const pool = new Pool({
  connectionString: 'postgresql://infieles:cQ1eK3awcS9J8l6pgLm0P20VbLZikt5W@dpg-d4rm7umuk2gs73eauuug-a.virginia-postgres.render.com/dbinfieles',
  ssl: { rejectUnauthorized: false } // Requerido para Render
});

// Sirve el index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// GET todos los infieles
app.get('/api/infieles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM infieles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

// GET un infiel por ID
app.get('/api/infieles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM infieles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('No encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

// POST nuevo infiel
app.post('/api/infieles', async (req, res) => {
  const { reportero, nombre, apellido, edad, ubicacion, historia, pruebas } = req.body;
  try {
    await pool.query(
      'INSERT INTO infieles (reportero, nombre, apellido, edad, ubicacion, historia, pruebas) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [reportero, nombre, apellido, edad, ubicacion, historia, pruebas]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

// GET comentarios por infiel_id
app.get('/api/comentarios/:infiel_id', async (req, res) => {
  const { infiel_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM comentarios WHERE infiel_id = $1 ORDER BY created_at DESC', [infiel_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

// POST nuevo comentario
app.post('/api/comentarios', async (req, res) => {
  const { infiel_id, reportero, comentario } = req.body;
  try {
    await pool.query(
      'INSERT INTO comentarios (infiel_id, reportero, comentario) VALUES ($1, $2, $3)',
      [infiel_id, reportero, comentario]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

// POST voto
app.post('/api/votos/:id', async (req, res) => {
  const { id } = req.params;
  const { tipo } = req.body;
  try {
    if (tipo === 'pos') {
      await pool.query('UPDATE infieles SET votos_pos = votos_pos + 1 WHERE id = $1', [id]);
    } else if (tipo === 'neg') {
      await pool.query('UPDATE infieles SET votos_neg = votos_neg + 1 WHERE id = $1', [id]);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
