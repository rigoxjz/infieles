// server.js
import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

// ================= LISTA PAGINADA =================
app.get("/infieles", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const q = `SELECT * FROM infieles ORDER BY creado_en DESC LIMIT $1 OFFSET $2`;
        const result = await pool.query(q, [limit, offset]);

        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).send("Error servidor");
    }
});

// ================= DETALLE =================
app.get("/infieles/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const q = `SELECT * FROM infieles WHERE id = $1`;
        const result = await pool.query(q, [id]);

        if (result.rows.length === 0) return res.status(404).send("No encontrado");

        res.json(result.rows[0]);
    } catch {
        res.status(500).send("Error servidor");
    }
});

// ================= PUBLICAR =================
app.post("/infieles", async (req, res) => {
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

        const q = `
            INSERT INTO infieles (reportero,nombre,apellido,edad,ubicacion,historia,imagenes)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
        `;

        const r = await pool.query(q, [
            reportero,
            nombre,
            apellido,
            edad,
            ubicacion,
            historia,
            imagenes
        ]);

        res.json(r.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error al publicar");
    }
});

// ================= VOTAR =================
app.post("/votar/:id", async (req, res) => {
    try {
        const tipo = req.body.tipo;
        const id = req.params.id;

        if (!["aprobar", "refutar", "denunciar"].includes(tipo))
            return res.status(400).send("Tipo inválido");

        const q = `
            UPDATE infieles 
            SET ${tipo} = ${tipo} + 1
            WHERE id = $1
            RETURNING *
        `;

        const r = await pool.query(q, [id]);
        res.json(r.rows[0]);
    } catch {
        res.status(500).send("Error al votar");
    }
});

// ================= INICIAR SERVIDOR =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("API lista en puerto " + PORT));
