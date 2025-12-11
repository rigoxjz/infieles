import express from "express";
import cors from "cors";
import multer from "multer";
import pkg from "pg";
const { Pool } = pkg;

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Multer para fotos
const upload = multer({ storage: multer.memoryStorage() });

// Conexión PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// =======================
// GET – Lista de infieles con comentarios y votos
// =======================
app.get("/infieles", async (req, res) => {
    try {
        const infieles = await pool.query("SELECT * FROM infieles ORDER BY id DESC");
        const resultados = [];

        for (let infiel of infieles.rows) {
            const comentariosQ = await pool.query(
                "SELECT * FROM comentarios WHERE infiel_id=$1 ORDER BY created_at ASC",
                [infiel.id]
            );

            resultados.push({
                ...infiel,
                comentarios: comentariosQ.rows
            });
        }

        res.json(resultados);
    } catch (err) {
        console.error("Error GET:", err);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

// =======================
// POST – Crear publicación
// =======================
app.post("/nuevo", upload.array("fotos", 10), async (req, res) => {
    try {
        const { reportero, nombre, apellido, edad, ubicacion, historia } = req.body;
        const fotos = req.files?.map(f => f.buffer.toString("base64")) || [];

        const result = await pool.query(
            `INSERT INTO infieles (reportero,nombre,apellido,edad,ubicacion,historia,fotos)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [reportero || "Anónimo", nombre, apellido, edad, ubicacion, historia, fotos]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Error POST:", err);
        res.status(500).json({ error: "No se pudo guardar" });
    }
});

// =======================
// POST – Votar
// =======================
app.post("/votar", async (req, res) => {
    try {
        const { infiel_id, usuario, voto } = req.body;

        // Evitar votos duplicados
        await pool.query(
            `INSERT INTO votos (infiel_id, usuario, voto) VALUES ($1,$2,$3)
             ON CONFLICT (infiel_id, usuario) DO NOTHING`,
            [infiel_id, usuario, voto]
        );

        // Actualizar contador
        if (voto) {
            await pool.query("UPDATE infieles SET votos_reales=votos_reales+1 WHERE id=$1", [infiel_id]);
        } else {
            await pool.query("UPDATE infieles SET votos_falsos=votos_falsos+1 WHERE id=$1", [infiel_id]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al votar" });
    }
});

// =======================
// POST – Agregar comentario
// =======================
app.post("/comentario", upload.array("fotos", 5), async (req, res) => {
    try {
        const { infiel_id, nombre, texto, propietario } = req.body;
        const fotos = req.files?.map(f => f.buffer.toString("base64")) || [];

        const result = await pool.query(
            `INSERT INTO comentarios (infiel_id,nombre,texto,fotos,propietario)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [infiel_id, nombre || "Anónimo", texto, fotos, propietario || false]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al guardar comentario" });
    }
});

// =======================
// PORT Render
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API lista en puerto", PORT));
