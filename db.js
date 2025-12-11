import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// DEBUG: Ver qué variables hay
console.log("=== DEBUG CONEXIÓN BD ===");
console.log("DATABASE_URL existe:", !!process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("=== FIN DEBUG ===");

// Configuración SIMPLIFICADA - usa solo DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR CRÍTICO: DATABASE_URL no está definida");
  console.error("❌ Configura DATABASE_URL en Render");
  process.exit(1);
}

// Solo usa DATABASE_URL, ignora las otras variables
export const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // NECESARIO para Render
  }
});

pool.on("connect", () => {
  console.log("✅ CONEXIÓN EXITOSA a PostgreSQL");
  console.log("✅ Usando DATABASE_URL:", connectionString.substring(0, 50) + "...");
});

pool.on("error", (err) => {
  console.error("❌ Error PostgreSQL:", err.message);
});
