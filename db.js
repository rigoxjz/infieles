// db.js
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ← Esto es lo más importante
  // Solo usamos las variables individuales como fallback (por si estás en local)
  ...(isProduction
    ? {}
    : {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT || 5432,
      }),

  // SSL correcto para todos los hosts modernos (Railway, Render, Supabase, Neon, etc.)
  ssl: isProduction
    ? { rejectUnauthorized: false } // necesario en la mayoría de hosts gratis
    : false,
});

// Test de conexión al iniciar (opcional pero te salva la vida)
pool.on("connect", () => {
  console.log("Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Error en la conexión a la base de datos:", err);
});
