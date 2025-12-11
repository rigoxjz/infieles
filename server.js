import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.get("/", (req, res) => {
    res.send("API funcionando 🔥");
});

// Ejemplo de endpoint
app.post("/api/denunciar", async (req, res) => {
    const { nombre, estado, descripcion } = req.body;

    const result = await pool.query(
        "INSERT INTO denuncias(nombre, estado, descripcion) VALUES($1,$2,$3) RETURNING *",
        [nombre, estado, descripcion]
    );

    res.json(result.rows[0]);
});

app.listen(10000, () => console.log("Servidor funcionando en Render"));
