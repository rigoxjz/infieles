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

// Conexión PostgreSQL (Render lo pasa en la variable DATABASE_URL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// =======================
// RUTA PRINCIPAL (para que no salga Cannot GET /)
// =======================
app.get("/", (req, res) => {
    res.send("API Infieles funcionando correctamente 🔥");
});

// =======================
// GET – Lista de infieles
// =======================
app.get("/infieles", async (req, res) => {
    try {
        const q = await pool.query("SELECT * FROM infieles ORDER BY id DESC");
        res.json(q.rows);
    } catch (err) {
        console.error("Error GET:", err);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

// =======================
// POST – Crear registro
// =======================
app.post("/nuevo", upload.array("fotos", 10), async (req, res) => {
    try {
        const { reportero, nombre, apellido, edad, ubicacion, historia } = req.body;
        const fotos = req.files?.map(f => f.buffer.toString("base64")) || [];

        const q = `
            INSERT INTO infieles (reportero, nombre, apellido, edad, ubicacion, historia, fotos)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *;
        `;

        const values = [
            reportero || "Anónimo",
            nombre,
            apellido,
            edad,
            ubicacion,
            historia,
            fotos
        ];

        const r = await pool.query(q, values);
        res.json({ success: true, data: r.rows[0] });

    } catch (err) {
        console.error("Error POST:", err);
        res.status(500).json({ error: "Error al guardar" });
    }
});

// =======================
// PUERTO Render
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log("API lista en puerto", PORT)
);
