// db.js: conexión segura a PostgreSQL
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(() => console.log("Base de datos conectada correctamente"))
    .catch(err => console.error("Error al conectar la base:", err));

export default pool;
